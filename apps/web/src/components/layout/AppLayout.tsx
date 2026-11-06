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
  Sparkles,
  FileText,
  Menu,
  Gem,
  GraduationCap,
  BookMarked,
  ClipboardList,
  Calculator,
  Percent,
  CreditCard,
  CalendarClock,
  FileSpreadsheet,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth/store";
import type { CalculatorType } from "@/lib/finance/calculator-remote";

export type ViewId =
  | "dashboard"
  | "setup"
  | "profile"
  | "income"
  | "expenses"
  | "daily"
  | "loans"
  | "creditCards"
  | "investments"
  | "insurance"
  | "goals"
  | "statements"
  | "tax"
  | "calculators"
  | "freedom"
  | "advisor"
  | "chat"
  | "learn"
  | "course"
  | "report"
  | "progress";

type NavItem = {
  id: ViewId;
  label: string;
  icon: typeof LayoutDashboard;
  calculatorType?: CalculatorType;
};

type NavSection = {
  label: string;
  icon: typeof LayoutDashboard;
  items: NavItem[];
};

// Six top-level sections. Sections with several screens expand in place.
// AI Chat stays routable but is not listed until it can quote the user's own numbers.
const NAV_SECTIONS: NavSection[] = [
  {
    label: "Home",
    icon: LayoutDashboard,
    items: [
      { id: "dashboard", label: "Overview", icon: LayoutDashboard },
      { id: "setup", label: "Quick Setup", icon: ClipboardList },
      { id: "progress", label: "Progress", icon: TrendingUp },
      { id: "report", label: "Summary Report", icon: FileText },
    ],
  },
  {
    label: "Money In/Out",
    icon: Wallet,
    items: [
      { id: "income", label: "Income", icon: Wallet },
      { id: "expenses", label: "Expenses", icon: Receipt },
      { id: "loans", label: "Loans", icon: Landmark },
      { id: "creditCards", label: "Credit Card", icon: CreditCard },
      { id: "investments", label: "Investments", icon: TrendingUp },
      { id: "insurance", label: "Insurance", icon: ShieldCheck },
    ],
  },
  { label: "Goals", icon: Target, items: [{ id: "goals", label: "Goals", icon: Target }] },
  { label: "Advisor", icon: Sparkles, items: [{ id: "advisor", label: "AI Advisor", icon: Sparkles }] },
  {
    label: "Learn",
    icon: GraduationCap,
    items: [
      { id: "learn", label: "Learning Hub", icon: GraduationCap },
      { id: "course", label: "Course", icon: BookMarked },
    ],
  },
  {
    label: "Tools",
    icon: Calculator,
    items: [
      { id: "freedom", label: "Freedom Calculator", icon: Rocket },
      { id: "tax", label: "Tax", icon: Percent },
      { id: "daily", label: "Budget Tracker", icon: CalendarClock },
      { id: "statements", label: "Statement Analyzer", icon: FileSpreadsheet },
      { id: "calculators", label: "SIP", icon: Calculator, calculatorType: "sip" },
      { id: "calculators", label: "Step Up SIP", icon: Calculator, calculatorType: "step_up_sip" },
      { id: "calculators", label: "Lumpsum", icon: Calculator, calculatorType: "lumpsum" },
      { id: "calculators", label: "EMI", icon: Calculator, calculatorType: "emi" },
      { id: "calculators", label: "Loan", icon: Calculator, calculatorType: "loan" },
      { id: "calculators", label: "Future Value", icon: Calculator, calculatorType: "future" },
      { id: "calculators", label: "IRR", icon: Calculator, calculatorType: "irr" },
    ],
  },
];

function NavList({
  active,
  activeCalculator,
  onSelect,
}: {
  active: ViewId;
  activeCalculator?: CalculatorType;
  onSelect: (id: ViewId, calculatorType?: CalculatorType) => void;
}) {
  const { user } = useAuth();
  const hideSetup = user?.quickStep === 1;
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const isItemActive = (item: NavItem) =>
    active === item.id && (!item.calculatorType || item.calculatorType === activeCalculator);

  return (
    <nav className="flex flex-col gap-1 px-3 py-4" aria-label="Main">
      {NAV_SECTIONS.map((section) => {
        const items = section.items.filter((n) => !(hideSetup && n.id === "setup"));
        if (!items.length) return null;
        const SectionIcon = section.icon;
        const containsActive = items.some(isItemActive);
        const buttonClass = (on: boolean) =>
          cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
            on
              ? "bg-primary text-primary-foreground shadow-[var(--shadow-glow)]"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          );

        const [only] = items;
        if (items.length === 1 && only) {
          return (
            <button key={section.label} onClick={() => onSelect(only.id, only.calculatorType)} className={buttonClass(isItemActive(only))}>
              <SectionIcon className="h-[18px] w-[18px]" />
              {section.label}
            </button>
          );
        }

        const open = openSections[section.label] ?? containsActive;
        return (
          <div key={section.label}>
            <button
              aria-expanded={open}
              onClick={() => setOpenSections((prev) => ({ ...prev, [section.label]: !open }))}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                containsActive ? "text-primary" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <SectionIcon className="h-[18px] w-[18px]" />
              <span className="flex-1 text-left">{section.label}</span>
              <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
            </button>
            {open && (
              <div className="ml-4 mt-1 flex flex-col gap-1 border-l border-sidebar-border pl-3">
                {items.map((item) => (
                  <button
                    key={`${item.id}-${item.calculatorType ?? item.label}`}
                    onClick={() => onSelect(item.id, item.calculatorType)}
                    className={buttonClass(isItemActive(item))}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
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
  activeCalculator,
  onSelect,
  title,
  description,
  actions,
  children,
}: {
  active: ViewId;
  activeCalculator?: CalculatorType;
  onSelect: (id: ViewId, calculatorType?: CalculatorType) => void;
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
          <NavList
            active={active}
            activeCalculator={activeCalculator}
            onSelect={onSelect}
          />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-xl lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-xl lg:hidden" aria-label="Open menu">
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
                    activeCalculator={activeCalculator}
                    onSelect={(id, calculatorType) => {
                      onSelect(id, calculatorType);
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
            <UserMenu onProfile={() => onSelect("profile")} />
          </div>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
