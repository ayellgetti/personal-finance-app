import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AppDrawer } from "@/components/layout/AppDrawer";
import { BottomNav } from "@/components/layout/BottomNav";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { QuickAddSheet } from "@/components/layout/QuickAddSheet";
import { DRAWER_ITEMS, PROFILE_ITEM, TABS } from "@/components/layout/nav";

function titleFor(pathname: string): string {
  const match = [PROFILE_ITEM, ...TABS, ...DRAWER_ITEMS].find((item) =>
    item.to === "/" ? pathname === "/" : pathname.startsWith(item.to),
  );
  return match?.label ?? "Freedom Planner Mobile";
}

export function AppShell() {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="relative mx-auto min-h-screen w-full max-w-tablet bg-background shadow-[var(--shadow-elevated)]">
        <MobileHeader
          title={titleFor(pathname)}
          onOpenMenu={() => setMenuOpen(true)}
          onOpenQuickAdd={() => setQuickAddOpen(true)}
        />

        <main className="mx-auto w-full px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-4 md:px-6">
          <Outlet />
        </main>

        <BottomNav />

        <AppDrawer open={menuOpen} onOpenChange={setMenuOpen} />
        <QuickAddSheet open={quickAddOpen} onOpenChange={setQuickAddOpen} />
      </div>
    </div>
  );
}
