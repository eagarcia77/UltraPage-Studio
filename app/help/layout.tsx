import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help Center | Curralume Studio",
  description: "Bilingual instructions and troubleshooting for Curralume Studio, EstiloAPA, TXT Test Generator and QTI 2.1 Blackboard.",
};

export default function HelpLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
