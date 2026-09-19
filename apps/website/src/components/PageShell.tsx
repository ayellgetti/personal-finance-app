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
        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground lg:flex">
          <a href="/#product" className="hover:text-foreground">
            Product
          </a>
          <a href="/#goals" className="hover:text-foreground">
            Goals
          </a>
          <a href="/#how" className="hover:text-foreground">
            How it works
          </a>
          <a href="/#tools" className="hover:text-foreground">
            Tools
          </a>
          <a href="/#faq" className="hover:text-foreground">
            FAQ
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
      <div className="container grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-base font-bold text-foreground">Freedom Planner</p>
          <p className="mt-2 text-sm text-muted-foreground">
            India-first household finance: capture, forecast, advisor report. Not a fund house.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">On this site</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <a href="/#product" className="hover:text-foreground">
                Product
              </a>
            </li>
            <li>
              <a href="/#goals" className="hover:text-foreground">
                Life goals
              </a>
            </li>
            <li>
              <a href="/#how" className="hover:text-foreground">
                Getting started
              </a>
            </li>
            <li>
              <a href="/#tools" className="hover:text-foreground">
                Tools
              </a>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">The app</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <a href={appUrl("/login")} className="hover:text-foreground">
                Sign in
              </a>
            </li>
            <li>
              <a href={appUrl("/guide")} className="hover:text-foreground">
                Product walkthrough
              </a>
            </li>
            <li>
              <a href="/#faq" className="hover:text-foreground">
                FAQ
              </a>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Please note</p>
          <p className="mt-3 text-sm text-muted-foreground">
            Forecasts are educational. Investments are subject to market risk. This site does not offer
            e-filing, brokerage, or scheme distribution.
          </p>
        </div>
      </div>
      <div className="container flex flex-col gap-2 border-t border-border py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Freedom Planner</p>
        <p>Your numbers stay in your account.</p>
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
