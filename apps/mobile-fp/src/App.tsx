import { lazy, Suspense } from "react";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { AuthProvider } from "@/lib/auth/store";
import { FinanceProvider } from "@/lib/finance/store";
import { LoadingState } from "@/components/PageState";
import ForgotPassword from "./pages/ForgotPassword.tsx";
import Login from "./pages/Login.tsx";
import Signup from "./pages/Signup.tsx";
import NotFound from "./pages/NotFound.tsx";

const financePages = () => import("./pages/FinancePages");
const secondaryPages = () => import("./pages/SecondaryPages");
const HomePage = lazy(() => financePages().then((module) => ({ default: module.HomePage })));
const MyPlanPage = lazy(() => financePages().then((module) => ({ default: module.MyPlanPage })));
const WealthPage = lazy(() => financePages().then((module) => ({ default: module.WealthPage })));
const GoalsPage = lazy(() => financePages().then((module) => ({ default: module.GoalsPage })));
const ResourcePage = lazy(() => financePages().then((module) => ({ default: module.ResourcePage })));
const AdvisorPage = lazy(() => secondaryPages().then((module) => ({ default: module.AdvisorPage })));
const ProfilePage = lazy(() => secondaryPages().then((module) => ({ default: module.ProfilePage })));
const SetupPage = lazy(() => secondaryPages().then((module) => ({ default: module.SetupPage })));
const StatementsPage = lazy(() => secondaryPages().then((module) => ({ default: module.StatementsPage })));
const TaxPage = lazy(() => secondaryPages().then((module) => ({ default: module.TaxPage })));
const CalculatorsPage = lazy(() => secondaryPages().then((module) => ({ default: module.CalculatorsPage })));
const ReportPage = lazy(() => secondaryPages().then((module) => ({ default: module.ReportPage })));
const StaticLearningPage = lazy(() => secondaryPages().then((module) => ({ default: module.StaticLearningPage })));

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="fp-mobile-theme">
    <AuthProvider>
      <TooltipProvider delayDuration={200}>
          <Sonner position="top-center" />
          <BrowserRouter>
            <Suspense fallback={<LoadingState label="Loading screen…" />}>
              <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route
                element={
                  <ProtectedRoute>
                    <FinanceProvider>
                      <AppShell />
                    </FinanceProvider>
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<HomePage />} />
                <Route path="/my-plan" element={<MyPlanPage />} />
                <Route path="/my-plan/income" element={<ResourcePage resource="income" />} />
                <Route path="/my-plan/expenses" element={<ResourcePage resource="expenses" />} />
                <Route path="/my-plan/loans" element={<ResourcePage resource="loans" />} />
                <Route path="/my-plan/insurance" element={<ResourcePage resource="insurance" />} />
                <Route path="/wealth" element={<WealthPage />} />
                <Route path="/wealth/investments" element={<ResourcePage resource="investments" />} />
                <Route path="/goals" element={<GoalsPage />} />
                <Route path="/advisor" element={<AdvisorPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/setup" element={<SetupPage />} />
                <Route path="/statements" element={<StatementsPage />} />
                <Route path="/tax" element={<TaxPage />} />
                <Route path="/calculators" element={<CalculatorsPage />} />
                <Route path="/report" element={<ReportPage />} />
                <Route path="/course" element={<StaticLearningPage kind="course" />} />
                <Route path="/learn" element={<StaticLearningPage kind="learn" />} />
                <Route path="*" element={<NotFound />} />
              </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
