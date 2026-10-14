/* Curralume Studio · © 2026 Eduardo Augusto García Rodríguez · Original contributions and integrations; third-party licenses preserved. */
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help Center | Curralume Studio",
  description: "Bilingual help for Curralume Studio, EstiloAPA APA 7 documents, TXT Test Generator, QTI 2.1 Blackboard, mobile editing, recovery and LMS export.",
  alternates: { canonical: "/help" },
};

export default function HelpLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
