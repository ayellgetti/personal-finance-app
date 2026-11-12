import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Gem, Menu, X } from "lucide-react";
import { appUrl } from "@/lib/utils";

const pageLinks = [
  { to: "/why", label: "Why" },
  { to: "/guide", label: "Guide" },
  { to: "/course", label: "Course" },
];

const linkClass = "hover:text-foreground aria-[current=page]:text-foreground";

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      {pageLinks.map((l) => (
        <NavLink key={l.to} to={l.to} onClick={onNavigate} className={linkClass}>
          {l.label}
        </NavLink>
      ))}
      <a href="/#product" onClick={onNavigate} className={linkClass}>
        Product
      </a>
      <a href="/#faq" onClick={onNavigate} className={linkClass}>
        FAQ
      </a>
      <a href={appUrl("/login")} className={linkClass}>
        Sign in
      </a>
    </>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-20 border-b border-border/80 bg-background/90 backdrop-blur">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Gem className="h-4 w-4" aria-hidden />
          </span>
          Freedom Planner
        </Link>
        <nav
          aria-label="Main"
          className="hidden items-center gap-6 text-sm font-medium text-muted-foreground lg:flex"
        >
          <NavLinks />
        </nav>
        <div className="flex items-center gap-2">
          <a
            href={appUrl("/login")}
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-card hover:opacity-95"
          >
            Open the app
          </a>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </button>
        </div>
      </div>
      {open ? (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="container flex flex-col gap-4 border-t border-border/80 py-4 text-sm font-medium text-muted-foreground lg:hidden"
        >
          <NavLinks onNavigate={() => setOpen(false)} />
        </nav>
      ) : null}
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
            {pageLinks.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="hover:text-foreground">
                  {l.label}
                </Link>
              </li>
            ))}
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
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
    // Only a route change should reset scroll.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
