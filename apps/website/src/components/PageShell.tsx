import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Gem } from "lucide-react";
import { appUrl } from "@/lib/utils";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border/80 bg-background/90 backdrop-blur">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Gem className="h-4 w-4" aria-hidden />
          </span>
          Freedom Planner
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground sm:flex">
          <a href="/#product" className="hover:text-foreground">
            Product
          </a>
          <a href="/#how" className="hover:text-foreground">
            How it works
          </a>
          <a href={appUrl("/login")} className="hover:text-foreground">
            Sign in
          </a>
        </nav>
        <a
          href={appUrl("/login")}
          className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-card hover:opacity-95"
        >
          Open the app
        </a>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container flex flex-col gap-3 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Freedom Planner</p>
        <p>India-first personal finance. Your numbers stay in your account.</p>
      </div>
    </footer>
  );
}

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
