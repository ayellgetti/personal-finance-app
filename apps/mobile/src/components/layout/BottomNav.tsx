import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { TABS, hasPermission } from "@/components/layout/nav";

export function BottomNav({
  permissions,
  badges = {},
}: {
  permissions: readonly string[];
  badges?: Record<string, number>;
}) {
  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-0 right-0 z-40 mx-auto w-full max-w-tablet border-t border-border bg-background/95 pb-safe backdrop-blur-xl"
    >
      <ul className="mx-auto flex w-full items-stretch justify-between gap-1 px-2 py-1.5 md:px-4">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const allowed = hasPermission(tab, permissions);
          const badge = badges[tab.to] ?? 0;
          const shell =
            "relative flex h-full w-full flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium tap-highlight-none transition-colors";

          return (
            <li key={tab.to} className="flex-1">
              {allowed ? (
                <NavLink
                  to={tab.to}
                  end={tab.to === "/"}
                  className={({ isActive }) =>
                    cn(
                      shell,
                      isActive
                        ? "bg-primary text-primary-foreground shadow-[var(--shadow-glow)]"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                    )
                  }
                >
                  <span className="relative">
                    <Icon className="h-5 w-5" aria-hidden />
                    {badge > 0 ? (
                      <span
                        aria-label={`${badge} pending`}
                        className="absolute -right-1.5 -top-1 h-2.5 w-2.5 rounded-full bg-danger ring-2 ring-background"
                      />
                    ) : null}
                  </span>
                  {tab.label}
                </NavLink>
              ) : (
                <button
                  type="button"
                  disabled
                  title="You do not have access to this section"
                  className={cn(shell, "text-muted-foreground/40")}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                  {tab.label}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
