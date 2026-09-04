import { type ReactNode, useState } from "react";
import { Menu, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { NAV_GROUPS, visibleNavItems } from "@/components/layout/nav";
import type { CrmViewId } from "@/types/crm";

function NavList({
  active,
  permissions,
  onSelect,
}: {
  active: CrmViewId;
  permissions: readonly string[];
  onSelect: (id: CrmViewId) => void;
}) {
  const items = visibleNavItems(permissions);

  return (
    <nav className="flex flex-col gap-6 px-3 py-4">
      {NAV_GROUPS.map((group) => {
        const groupItems = items.filter((item) => item.group === group);
        if (!groupItems.length) return null;
        return (
          <div key={group}>
            <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {group}
            </p>
            <div className="flex flex-col gap-1">
              {groupItems.map((item) => {
                const Icon = item.icon;
                const isActive = active === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelect(item.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-[var(--shadow-glow)]"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    )}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3 px-5 py-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary shadow-[var(--shadow-glow)]">
        <Briefcase className="h-5 w-5 text-primary-foreground" />
      </div>
      <div className="leading-tight">
        <p className="font-display text-base font-bold">Sales CRM</p>
        <p className="text-xs text-muted-foreground">Pipeline & collections</p>
      </div>
    </div>
  );
}

export function AppLayout({
  active,
  permissions,
  onSelect,
  title,
  description,
  actions,
  children,
}: {
  active: CrmViewId;
  permissions: readonly string[];
  onSelect: (id: CrmViewId) => void;
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <Brand />
        <div className="flex-1 overflow-y-auto">
          <NavList active={active} permissions={permissions} onSelect={onSelect} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-xl lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-xl lg:hidden" aria-label="Open navigation">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex h-full w-72 flex-col gap-0 overflow-hidden p-0">
                <div className="shrink-0">
                  <Brand />
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                  <NavList
                    active={active}
                    permissions={permissions}
                    onSelect={(id) => {
                      onSelect(id);
                      setMobileOpen(false);
                    }}
                  />
                </div>
              </SheetContent>
            </Sheet>
            <div className="min-w-0">
              <h1 className="truncate font-display text-xl font-bold tracking-tight md:text-2xl">{title}</h1>
              <p className="truncate text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {actions}
            <ThemeToggle />
            <UserMenu />
          </div>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
