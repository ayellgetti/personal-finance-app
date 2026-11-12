import { Link } from "react-router-dom";
import { appUrl } from "@/lib/utils";

export function CtaBand({ next }: { next: { to: string; label: string } }) {
  return (
    <section className="border-t border-border bg-card">
      <div className="container flex flex-col items-start gap-6 py-14 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="max-w-xl font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Ready to try it with your own numbers?
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={appUrl("/login")}
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-card hover:opacity-95"
          >
            Create your account
          </a>
          <Link to={next.to} className="text-sm font-semibold text-foreground hover:underline">
            {next.label}
          </Link>
        </div>
      </div>
    </section>
  );
}
