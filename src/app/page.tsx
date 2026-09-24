/**
 * Home — the whole site.
 *
 * This is one scrolling document by design. The practice has perhaps a dozen
 * facts worth publishing; splitting them across routes would mean a patient
 * tapping three times to find a phone number. Section order follows the
 * questions a visitor asks, in the order they ask them: who, what, where, why
 * trust you, how do I reach you.
 */

import { Hero } from "@/components/sections/hero";
import { QuickFacts } from "@/components/sections/quick-facts";
import { About } from "@/components/sections/about";
import { Expertise } from "@/components/sections/expertise";
import { Experience } from "@/components/sections/experience";
import { Clinic } from "@/components/sections/clinic";
import { Recognition } from "@/components/sections/recognition";
import { Gallery } from "@/components/sections/gallery";
import { Contact } from "@/components/sections/contact";

export default function HomePage() {
  return (
    <>
      <Hero />
      <QuickFacts />
      <About />
      <Expertise />
      <Experience />
      <Clinic />
      <Recognition />
      <Gallery />
      <Contact />
    </>
  );
}
