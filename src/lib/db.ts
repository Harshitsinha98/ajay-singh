/**
 * Storage for appointment tokens.
 *
 * Two interchangeable backends behind one small async interface:
 *
 *   • **libSQL / Turso** — used when TURSO_DATABASE_URL is set. Pure HTTP, no
 *     native addon, so it works on Vercel and other serverless hosts where the
 *     filesystem is read-only and wiped between requests.
 *   • **better-sqlite3** — used otherwise, against a local file. Zero setup for
 *     development, and the right choice on a VPS with a real disk.
 *
 * Both are SQLite, so the schema — and with it the entire no-overlap guarantee —
 * is identical on either.
 *
 * There are deliberately **no multi-statement transactions**. Every write is a
 * single atomic statement: an INSERT for a booking, a conditional UPDATE for a
 * cancellation. The partial UNIQUE indexes do the concurrency work, which means
 * no interactive transaction has to be held open across a network round trip —
 * something that matters a great deal when the database is reached over HTTP.
 */

import type Database from "better-sqlite3";
import type { Client as LibsqlClient } from "@libsql/client";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export type AppointmentStatus =
  | "confirmed"
  | "completed"
  | "no_show"
  | "cancelled";

/**
 * Statuses that hold a slot. A cancelled appointment releases its slot and token
 * back to the pool; everything else keeps it occupied so the day's historical
 * record stays truthful.
 */
export const SLOT_HOLDING_STATUSES: AppointmentStatus[] = [
  "confirmed",
  "completed",
  "no_show",
];

/* ------------------------------------------------------------------ */
/* The interface every caller uses                                     */
/* ------------------------------------------------------------------ */

export type Row = Record<string, unknown>;

export interface Sql {
  all<T = Row>(sql: string, params?: unknown[]): Promise<T[]>;
  get<T = Row>(sql: string, params?: unknown[]): Promise<T | undefined>;
  run(sql: string, params?: unknown[]): Promise<{ rowsAffected: number }>;
}

export type BackendKind = "libsql" | "sqlite";

/* ------------------------------------------------------------------ */
/* Schema                                                             */
/* ------------------------------------------------------------------ */

/**
 * DDL as discrete statements rather than one script. better-sqlite3 can run a
 * multi-statement script but the libSQL client is happier with one statement per
 * call, and keeping them separate means both backends execute exactly the same
 * SQL in exactly the same order.
 *
 * `doctor_id` is carried even though this clinic has one doctor. It costs a
 * column and keeps the UNIQUE indexes correctly shaped, so a second doctor
 * later is a config change rather than a migration.
 */
const SCHEMA: string[] = [
  `CREATE TABLE IF NOT EXISTS appointments (
      id             TEXT    PRIMARY KEY,
      reference      TEXT    NOT NULL UNIQUE,
      doctor_id      TEXT    NOT NULL,
      date           TEXT    NOT NULL,
      session_id     TEXT    NOT NULL,
      slot_index     INTEGER NOT NULL,
      token_number   INTEGER NOT NULL,
      slot_start     TEXT    NOT NULL,
      slot_end       TEXT    NOT NULL,
      patient_name   TEXT    NOT NULL,
      patient_key    TEXT    NOT NULL,
      patient_phone  TEXT    NOT NULL,
      patient_age    INTEGER,
      patient_gender TEXT,
      reason         TEXT,
      channel        TEXT    NOT NULL,
      status         TEXT    NOT NULL DEFAULT 'confirmed',
      created_at     TEXT    NOT NULL,
      updated_at     TEXT    NOT NULL,
      cancelled_at   TEXT,
      CHECK (status IN ('confirmed','completed','no_show','cancelled')),
      CHECK (channel IN ('web','phone','walk_in')),
      CHECK (slot_index >= 0),
      CHECK (token_number = slot_index + 1),
      CHECK (date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]')
   )`,

  /* ------------------------------------------------------------------
     The heart of the booking guarantee.

     A partial UNIQUE index means the database itself rejects a second
     slot-holding appointment for the same doctor, date and slot. Even if two
     requests race through the availability check at the same instant, one fails
     at INSERT time with a UNIQUE constraint error. Overlap is not prevented by
     careful application code — it is structurally impossible.
     ------------------------------------------------------------------ */
  `CREATE UNIQUE INDEX IF NOT EXISTS appointments_slot_unique
      ON appointments (doctor_id, date, slot_index)
      WHERE status IN ('confirmed','completed','no_show')`,

  /* Token numbers are derived from slot_index, so this is redundant by
     construction — kept as a second tripwire in case that ever changes. */
  `CREATE UNIQUE INDEX IF NOT EXISTS appointments_token_unique
      ON appointments (doctor_id, date, token_number)
      WHERE status IN ('confirmed','completed','no_show')`,

  /* One live booking per patient per day. Keyed on name as well as phone,
     because one handset is often shared by a whole family who may each need
     their own token. */
  `CREATE UNIQUE INDEX IF NOT EXISTS appointments_patient_unique
      ON appointments (doctor_id, date, patient_phone, patient_key)
      WHERE status = 'confirmed'`,

  `CREATE INDEX IF NOT EXISTS appointments_day
      ON appointments (date, doctor_id, slot_index)`,

  `CREATE INDEX IF NOT EXISTS appointments_phone
      ON appointments (patient_phone, date)`,
];

/* ------------------------------------------------------------------ */
/* Configuration                                                       */
/* ------------------------------------------------------------------ */

type Config =
  | { kind: "libsql"; url: string; authToken?: string }
  | { kind: "sqlite"; file: string };

function remoteUrl(): string | undefined {
  const candidate =
    process.env.TURSO_DATABASE_URL ||
    process.env.LIBSQL_URL ||
    process.env.DATABASE_URL;
  if (!candidate) return undefined;
  return /^(libsql|wss?|https?):\/\//.test(candidate) ? candidate : undefined;
}

/** True on platforms whose filesystem is read-only or wiped between requests. */
function isServerless(): boolean {
  return Boolean(
    process.env.VERCEL ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.NETLIFY,
  );
}

function resolveConfig(): Config {
  const url = remoteUrl();
  if (url) {
    return {
      kind: "libsql",
      url,
      authToken:
        process.env.TURSO_AUTH_TOKEN ||
        process.env.LIBSQL_AUTH_TOKEN ||
        process.env.DATABASE_AUTH_TOKEN,
    };
  }

  const configured = process.env.DATABASE_PATH;
  if (configured === ":memory:") return { kind: "sqlite", file: ":memory:" };

  const file = configured
    ? path.resolve(configured)
    : path.join(process.cwd(), "data", "clinic.db");
  return { kind: "sqlite", file };
}

/* ------------------------------------------------------------------ */
/* Backends                                                            */
/* ------------------------------------------------------------------ */

async function openLibsql(config: Extract<Config, { kind: "libsql" }>) {
  // The `/web` entry point is pure JavaScript over HTTP. The default entry
  // pulls in a native addon for embedded-replica support, which cannot be
  // bundled for a serverless runtime.
  const { createClient } = await import("@libsql/client/web");
  const client: LibsqlClient = createClient({
    url: config.url,
    authToken: config.authToken,
    // Return plain numbers for INTEGER columns; the default can hand back
    // BigInt, which would break arithmetic on token numbers.
    intMode: "number",
  });

  for (const statement of SCHEMA) {
    await client.execute(statement);
  }

  const sql: Sql = {
    async all<T>(text: string, params: unknown[] = []) {
      const result = await client.execute({ sql: text, args: params as never });
      return result.rows as unknown as T[];
    },
    async get<T>(text: string, params: unknown[] = []) {
      const result = await client.execute({ sql: text, args: params as never });
      return result.rows[0] as unknown as T | undefined;
    },
    async run(text: string, params: unknown[] = []) {
      const result = await client.execute({ sql: text, args: params as never });
      return { rowsAffected: result.rowsAffected };
    },
  };

  return { sql, close: () => client.close() };
}

async function openSqlite(file: string) {
  const { default: Ctor } = await import("better-sqlite3");

  if (file !== ":memory:") {
    fs.mkdirSync(path.dirname(file), { recursive: true });
  }

  const db: Database.Database = new Ctor(file);
  db.pragma("journal_mode = WAL");
  // If another writer holds the lock, wait rather than throwing SQLITE_BUSY.
  db.pragma("busy_timeout = 5000");
  db.pragma("foreign_keys = ON");
  db.pragma("synchronous = FULL");

  for (const statement of SCHEMA) db.exec(statement);

  const sql: Sql = {
    async all<T>(text: string, params: unknown[] = []) {
      return db.prepare(text).all(...(params as never[])) as T[];
    },
    async get<T>(text: string, params: unknown[] = []) {
      return db.prepare(text).get(...(params as never[])) as T | undefined;
    },
    async run(text: string, params: unknown[] = []) {
      const info = db.prepare(text).run(...(params as never[]));
      return { rowsAffected: info.changes };
    },
  };

  return {
    sql,
    close: () => {
      db.close();
    },
  };
}

/* ------------------------------------------------------------------ */
/* Readiness                                                           */
/* ------------------------------------------------------------------ */

/**
 * Opening storage can fail — a wrong Turso token, a read-only filesystem, a
 * network partition. If that threw from inside a route handler it would surface
 * to a patient as a bare "something went wrong" on the day picker. Readiness is
 * resolved once and reported as data, so routes can answer with a phone number
 * instead.
 */
export type StorageStatus =
  | { ready: true; backend: BackendKind; target: string; ephemeral: boolean }
  | { ready: false; reason: string; hint: string };

type Handle = { sql: Sql; close: () => void | Promise<void> };

/**
 * Next recompiles modules on every edit in development, which would otherwise
 * open a fresh connection each time. Cache on globalThis.
 */
const globalForDb = globalThis as unknown as {
  __apcHandle?: Handle;
  __apcStatus?: StorageStatus;
  __apcInit?: Promise<StorageStatus>;
};

function describe(config: Config): string {
  return config.kind === "libsql" ? config.url : config.file;
}

async function initialise(): Promise<StorageStatus> {
  const config = resolveConfig();

  try {
    const handle =
      config.kind === "libsql"
        ? await openLibsql(config)
        : await openSqlite(config.file);

    globalForDb.__apcHandle = handle;
    const status: StorageStatus = {
      ready: true,
      backend: config.kind,
      target: describe(config),
      ephemeral: false,
    };
    globalForDb.__apcStatus = status;
    return status;
  } catch (primaryError) {
    const reason = (primaryError as Error).message;

    /**
     * A temp-directory fallback exists, but only when explicitly requested.
     * Falling back silently would be worse than failing: patients would be
     * handed real-looking token numbers that quietly vanish when the instance is
     * recycled, and a clinic queue built on lost bookings is a safety problem.
     * Failing loudly sends them to the phone instead.
     */
    if (config.kind === "sqlite" && process.env.ALLOW_EPHEMERAL_DB === "1") {
      try {
        const file = path.join(os.tmpdir(), "ajay-pundir-clinic", "clinic.db");
        const handle = await openSqlite(file);
        globalForDb.__apcHandle = handle;
        console.warn(
          "[db] WARNING: using ephemeral storage (ALLOW_EPHEMERAL_DB=1). " +
            "Appointments will be LOST when this instance is recycled. " +
            "Demo use only — never for real patient bookings.",
        );
        const status: StorageStatus = {
          ready: true,
          backend: "sqlite",
          target: file,
          ephemeral: true,
        };
        globalForDb.__apcStatus = status;
        return status;
      } catch (fallbackError) {
        const status: StorageStatus = {
          ready: false,
          reason: (fallbackError as Error).message,
          hint: "Could not open a database even in the system temp directory.",
        };
        globalForDb.__apcStatus = status;
        return status;
      }
    }

    const hint =
      config.kind === "libsql"
        ? `Could not reach the libSQL/Turso database at ${config.url}. Check TURSO_DATABASE_URL and TURSO_AUTH_TOKEN. (${reason})`
        : isServerless()
          ? "This is a serverless deployment, where the filesystem is read-only, so a SQLite file cannot be used. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN to use Turso (the free tier is plenty), or deploy to a host with a persistent disk."
          : `Could not open the database at ${describe(config)}. Check DATABASE_PATH and that the directory is writable. (${reason})`;

    console.error(`[db] storage unavailable: ${reason}\n[db] ${hint}`);
    const status: StorageStatus = { ready: false, reason, hint };
    globalForDb.__apcStatus = status;
    return status;
  }
}

/**
 * Resolves storage readiness, opening the connection on first call.
 * Never throws, and concurrent callers share a single initialisation.
 */
export function storageStatus(): Promise<StorageStatus> {
  if (globalForDb.__apcStatus?.ready && globalForDb.__apcHandle) {
    return Promise.resolve(globalForDb.__apcStatus);
  }
  // Retry a previous failure on the next request: a transient network blip
  // should not permanently disable booking for the life of the process.
  if (!globalForDb.__apcInit) {
    globalForDb.__apcInit = initialise().finally(() => {
      globalForDb.__apcInit = undefined;
    });
  }
  return globalForDb.__apcInit;
}

export async function isStorageReady(): Promise<boolean> {
  return (await storageStatus()).ready;
}

/**
 * The query interface.
 *
 * Throws when storage is unavailable. Callers that can show a useful message
 * should gate on `storageStatus()` first — see `requireStorage` in api-guard.ts.
 */
export async function db(): Promise<Sql> {
  const status = await storageStatus();
  if (!status.ready) {
    throw new Error(`Appointment storage is unavailable: ${status.hint}`);
  }
  const handle = globalForDb.__apcHandle;
  if (!handle) {
    throw new Error("Appointment storage reported ready but no handle is open.");
  }
  return handle.sql;
}

/** Test helper: closes the connection so a fresh one can be opened. */
export async function resetDbForTests() {
  await globalForDb.__apcHandle?.close();
  globalForDb.__apcHandle = undefined;
  globalForDb.__apcStatus = undefined;
  globalForDb.__apcInit = undefined;
}

/** Convenience for tests and maintenance scripts. */
export async function wipeAllData() {
  const sql = await db();
  await sql.run(`DELETE FROM appointments`);
}

/* ------------------------------------------------------------------ */
/* Constraint error classification                                     */
/* ------------------------------------------------------------------ */

/**
 * True when an error is the database refusing to violate a UNIQUE index.
 *
 * Matched on the message rather than the error code, because libSQL reports the
 * broad `SQLITE_CONSTRAINT` for CHECK violations too — keying on the code alone
 * would misread a bad token number as a slot conflict.
 */
export function isUniqueViolation(error: unknown): boolean {
  return /UNIQUE constraint failed/i.test(
    String((error as Error)?.message ?? ""),
  );
}

/**
 * Which constraint a UNIQUE violation came from, so it can be explained.
 *
 * SQLite names the offending *columns*, not the index:
 *   "UNIQUE constraint failed: appointments.doctor_id, appointments.date,
 *    appointments.slot_index"
 * A duplicate slot trips the slot and token indexes at once and SQLite reports
 * whichever it evaluates first; both mean the same thing to a patient, so
 * callers treat them alike.
 */
export function uniqueViolationTarget(
  error: unknown,
): "slot" | "token" | "patient" | "reference" | "unknown" {
  const message = String((error as Error)?.message ?? "");
  if (!isUniqueViolation(error)) return "unknown";
  // Checked first: it is the only constraint naming patient_phone.
  if (message.includes("patient_phone")) return "patient";
  if (message.includes("slot_index")) return "slot";
  if (message.includes("token_number")) return "token";
  if (message.includes("reference")) return "reference";
  return "unknown";
}
