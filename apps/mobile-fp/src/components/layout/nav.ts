import {
  BookOpen,
  Calculator,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  Home,
  Landmark,
  PiggyBank,
  Settings2,
  Sparkles,
  Target,
  User,
} from "lucide-react";

export type NavItem = {
  to: string;
  label: string;
  icon: typeof Home;
};

/** Bottom tabs. Profile stays in the header so these five labels remain readable. */
export const TABS: NavItem[] = [
  { to: "/", label: "Home", icon: Home },
  { to: "/my-plan", label: "My Plan", icon: Landmark },
  { to: "/wealth", label: "Wealth", icon: PiggyBank },
  { to: "/goals", label: "Goals", icon: Target },
  { to: "/advisor", label: "Advisor", icon: Sparkles },
];

export const PROFILE_ITEM: NavItem = { to: "/profile", label: "Profile", icon: User };

export const DRAWER_ITEMS: NavItem[] = [
  { to: "/setup", label: "Quick Setup", icon: Settings2 },
  { to: "/statements", label: "Statement Analyzer", icon: FileSpreadsheet },
  { to: "/tax", label: "Tax Planner", icon: FileText },
  { to: "/calculators", label: "Calculators", icon: Calculator },
  { to: "/report", label: "Summary Report", icon: FileText },
  { to: "/course", label: "Course", icon: BookOpen },
  { to: "/learn", label: "Learning Hub", icon: GraduationCap },
];
