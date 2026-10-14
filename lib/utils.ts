/* Curralume Studio · © 2026 Eduardo Augusto García Rodríguez · Original contributions and integrations; third-party licenses preserved. */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
