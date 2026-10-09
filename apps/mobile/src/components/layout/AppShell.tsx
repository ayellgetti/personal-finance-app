import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AppDrawer } from "@/components/layout/AppDrawer";
import { BottomNav } from "@/components/layout/BottomNav";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { QuickAddSheet } from "@/components/layout/QuickAddSheet";
import { DRAWER_ITEMS, PROFILE_ITEM, TABS } from "@/components/layout/nav";
import { useMobile } from "@/lib/mobile/store";

function titleFor(pathname: string): string {
  const match = [PROFILE_ITEM, ...TABS, ...DRAWER_ITEMS].find((item) =>
    item.to === "/" ? pathname === "/" : pathname.startsWith(item.to),
  );
  return match?.label ?? "CRM Mobile";
}

export function AppShell() {
  const { pathname } = useLocation();
  const { permissions } = useMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader
        title={titleFor(pathname)}
        onOpenMenu={() => setMenuOpen(true)}
        onOpenQuickAdd={() => setQuickAddOpen(true)}
      />

      <main className="mx-auto w-full max-w-md px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-4">
        <Outlet />
      </main>

      <BottomNav permissions={permissions} />

      <AppDrawer open={menuOpen} onOpenChange={setMenuOpen} permissions={permissions} />
      <QuickAddSheet open={quickAddOpen} onOpenChange={setQuickAddOpen} permissions={permissions} />
    </div>
  );
}
