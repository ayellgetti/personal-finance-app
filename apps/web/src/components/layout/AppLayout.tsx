import { ReactNode, useState } from "react";
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  Landmark,
  TrendingUp,
  ShieldCheck,
  Target,
  Rocket,
  LineChart,
  Sparkles,
  FileText,
  Menu,
  Gem,
  GraduationCap,
  CalendarClock,
  ClipboardList,
  FileSpreadsheet,
  Calculator,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth/store";

export type ViewId =
  | "dashboard"
  | "setup"
  | "profile"
  | "income"
  | "expenses"
  | "daily"
  | "loans"
  | "investments"
  | "insurance"
  | "goals"
  | "statements"
  | "tax"
  | "freedom"
  | "forecast"
  | "advisor"
  | "learn"
  | "report";

export const NAV: { id: ViewId; label: string; icon: typeof LayoutDashboard; group: string }[] = [
  { id: "dashboard", label: "Net Worth", icon: LayoutDashboard, group: "Overview" },
  { id: "setup", label: "Quick Setup", icon: ClipboardList, group: "Overview" },
  { id: "income", label: "Income", icon: Wallet, group: "Manage" },
  { id: "expenses", label: "Expenses", icon: Receipt, group: "Manage" },
  { id: "loans", label: "Loans", icon: Landmark, group: "Manage" },
  { id: "investments", label: "Investments", icon: TrendingUp, group: "Manage" },
  { id: "insurance", label: "Insurance", icon: ShieldCheck, group: "Manage" },
  { id: "goals", label: "Goals", icon: Target, group: "Manage" },
  { id: "statements", label: "Statements", icon: FileSpreadsheet, group: "Plan" },
  { id: "tax", label: "Tax Planner", icon: Calculator, group: "Plan" },
  { id: "daily", label: "Daily Tracker", icon: CalendarClock, group: "Plan" },
  { id: "freedom", label: "Freedom Calculator", icon: Rocket, group: "Plan" },
  { id: "forecast", label: "Forecast Engine", icon: LineChart, group: "Plan" },
  { id: "advisor", label: "AI Advisor", icon: Sparkles, group: "Plan" },
  { id: "learn", label: "Learning Hub", icon: GraduationCap, group: "Plan" },
  { id: "report", label: "Summary Report", icon: FileText, group: "Report" },
];

const GROUPS = ["Overview", "Manage", "Report", "Plan"];

function NavList({ active, onSelect }: { active: ViewId; onSelect: (id: ViewId) => void }) {
  const { user } = useAuth();
  const hideSetup = user?.quickStep === 1;

  return (
    <nav className="flex flex-col gap-6 px-3 py-4">
      {GROUPS.map((group) => {
        const items = NAV.filter((n) => n.group === group && !(hideSetup && n.id === "setup"));
        if (!items.length) return null;
        return (
        <div key={group}>
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{group}</p>
          <div className="flex flex-col gap-1">
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = active === item.id;
              return (
                <button
                  key={item.id}
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
        <Gem className="h-5 w-5 text-primary-foreground" />
      </div>
      <div className="leading-tight">
        <p className="font-display text-base font-bold">Freedom Planner</p>
        <p className="text-xs text-muted-foreground">Wealth & FIRE Suite</p>
      </div>
    </div>
  );
}

export function AppLayout({
  active,
  onSelect,
  title,
  description,
  actions,
  children,
}: {
  active: ViewId;
  onSelect: (id: ViewId) => void;
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <Brand />
        <div className="flex-1 overflow-y-auto">
          <NavList active={active} onSelect={onSelect} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-xl lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-xl lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex h-full w-72 flex-col gap-0 overflow-hidden p-0">
                <div className="shrink-0">
                  <Brand />
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                  <NavList active={active} onSelect={(id) => { onSelect(id); setMobileOpen(false); }} />
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
            <UserMenu onProfile={() => onSelect("profile")} />
          </div>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
