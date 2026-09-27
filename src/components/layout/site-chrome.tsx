"use client";

/**
 * Decides which shell wraps the page.
 *
 * Three different pages want three different amounts of chrome, and a nested
 * layout cannot *remove* what the root layout renders — so the decision is made
 * here, in one place, from the pathname:
 *
 *  • /admin — no public chrome at all. It is a staff tool on a counter machine;
 *    a marketing header with a "Book Token" button on it would be noise, and the
 *    footer's patient disclaimer is addressed to the wrong reader entirely.
 *
 *  • /book — header and footer, but no sticky mobile bar. Its "Token" button
 *    would link to the page you are already on, and it would cover the form's
 *    submit button on a short screen.
 *
 *  • everything else — the full shell.
 */

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Header } from "./header";
import { Footer } from "./footer";
import { MobileActionBar } from "./mobile-action-bar";

export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";

  if (pathname.startsWith("/admin")) {
    return <main id="main">{children}</main>;
  }

  const showActionBar = !pathname.startsWith("/book");

  return (
    <>
      <Header />
      <main id="main" className={showActionBar ? "pb-20 sm:pb-0" : undefined}>
        {children}
      </main>
      <Footer />
      {showActionBar && <MobileActionBar />}
    </>
  );
}
