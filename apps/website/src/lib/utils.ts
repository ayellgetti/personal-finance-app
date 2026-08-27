import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Product app origin (login / dashboard). Not this marketing site. */
export function appUrl(path = "/"): string {
  const base = (import.meta.env.VITE_APP_URL ?? "http://localhost:8080").replace(/\/$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}
