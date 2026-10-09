import { ThemeProvider } from "next-themes";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SessionGate } from "@/components/SessionGate";
import { AppShell } from "@/components/layout/AppShell";
import { AuthProvider } from "@/lib/auth/store";
import { MobileProvider } from "@/lib/mobile/store";
import Booked from "./pages/Booked.tsx";
import Calendar from "./pages/Calendar.tsx";
import Contacts from "./pages/Contacts.tsx";
import Enquiries from "./pages/Enquiries.tsx";
import ForgotPassword from "./pages/ForgotPassword.tsx";
import Home from "./pages/Home.tsx";
import Login from "./pages/Login.tsx";
import NotFound from "./pages/NotFound.tsx";
import Payments from "./pages/Payments.tsx";
import Placeholder from "./pages/Placeholder.tsx";
import Profile from "./pages/Profile.tsx";

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="mobile-theme">
    <AuthProvider>
      <MobileProvider>
        <TooltipProvider delayDuration={200}>
          <Sonner position="top-center" />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route
                element={
                  <ProtectedRoute>
                    <SessionGate>
                      <AppShell />
                    </SessionGate>
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<Home />} />
                <Route path="/contacts" element={<Contacts />} />
                <Route path="/enquiries" element={<Enquiries />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/follow-ups" element={<Placeholder title="Follow-ups" />} />
                <Route path="/booked" element={<Booked />} />
                <Route path="/payments" element={<Payments />} />
                <Route path="/tasks" element={<Placeholder title="Tasks" />} />
                <Route path="/reminders" element={<Placeholder title="Reminders" />} />
                <Route path="/users" element={<Placeholder title="Users" />} />
                <Route path="/roles" element={<Placeholder title="Roles" />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </MobileProvider>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
