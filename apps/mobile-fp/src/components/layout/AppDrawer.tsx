import { LogOut, WalletCards } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DRAWER_ITEMS } from "@/components/layout/nav";
import { useAuth } from "@/lib/auth/store";

export function AppDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  const { user, logout } = useAuth();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="flex w-[17rem] flex-col gap-0 overflow-hidden p-0 pt-safe">
        <div className="flex items-center gap-3 border-b border-border px-5 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary">
            <WalletCards className="h-5 w-5 text-primary-foreground" aria-hidden />
          </div>
          <div className="min-w-0 leading-tight">
            <SheetTitle className="truncate font-display text-base font-bold">Freedom Planner Mobile</SheetTitle>
            <SheetDescription className="truncate text-xs">{user?.email ?? "Signed in"}</SheetDescription>
          </div>
        </div>

        <nav aria-label="More sections" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4">
          <div className="flex flex-col gap-1">
            {DRAWER_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => onOpenChange(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    )
                  }
                >
                  <Icon className="h-[18px] w-[18px]" aria-hidden />
                  {item.label}
                </NavLink>
              );
            })}
          </div>
        </nav>

        <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-3 pb-safe">
          <ThemeToggle />
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={() => {
              onOpenChange(false);
              void logout();
            }}
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Sign out
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
