import { Menu, Plus, User } from "lucide-react";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function MobileHeader({
  title,
  onOpenMenu,
  onOpenQuickAdd,
}: {
  title: string;
  onOpenMenu: () => void;
  onOpenQuickAdd: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 pt-safe backdrop-blur-xl">
      <div className="mx-auto flex w-full items-center gap-2 py-2.5 pl-3 pr-2 md:px-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label="Open menu"
          onClick={onOpenMenu}
        >
          <Menu className="h-5 w-5" aria-hidden />
        </Button>

        <h1 className="min-w-0 flex-1 truncate text-center font-display text-base font-bold tracking-tight">
          {title}
        </h1>

        <button
          type="button"
          aria-label="Create"
          onClick={onOpenQuickAdd}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-glow)] transition-opacity tap-highlight-none hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Plus className="h-5 w-5" strokeWidth={2.25} aria-hidden />
        </button>

        <NavLink
          to="/profile"
          aria-label="Profile"
          className={({ isActive }) =>
            cn(
              "flex h-9 w-9 items-center justify-center rounded-full border-2 border-primary bg-transparent text-primary transition-colors tap-highlight-none",
              isActive ? "bg-primary/10 shadow-[var(--shadow-glow)]" : "hover:bg-primary/10",
            )
          }
        >
          <User className="h-4 w-4" aria-hidden />
        </NavLink>
      </div>
    </header>
  );
}
