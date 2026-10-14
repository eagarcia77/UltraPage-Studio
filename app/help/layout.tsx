import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help Center | CREVELIO",
  description: "Bilingual help for CREVELIO, EstiloAPA APA 7 documents, TXT Test Generator, QTI 2.1 Blackboard, mobile editing, recovery and LMS export.",
  alternates: { canonical: "/help" },
};

export default function HelpLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
