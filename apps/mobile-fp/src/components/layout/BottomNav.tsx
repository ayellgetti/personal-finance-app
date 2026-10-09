import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { TABS } from "@/components/layout/nav";

export function BottomNav() {
  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-0 right-0 z-40 mx-auto w-full max-w-tablet border-t border-border bg-background/95 pb-safe backdrop-blur-xl"
    >
      <ul className="mx-auto grid w-full grid-cols-5 items-stretch gap-1 px-2 py-1.5 md:px-4">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const shell =
            "relative flex min-h-12 w-full flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[11px] font-medium tap-highlight-none transition-colors";

          return (
            <li key={tab.to}>
              <NavLink
                to={tab.to}
                end={tab.to === "/"}
                aria-label={tab.label === "Advisor" ? "AI Advisor" : tab.label}
                className={({ isActive }) =>
                  cn(
                    shell,
                    isActive
                      ? "bg-primary text-primary-foreground shadow-[var(--shadow-glow)]"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )
                }
              >
                <Icon className="h-4.5 w-4.5" aria-hidden />
                <span className="whitespace-nowrap">{tab.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
