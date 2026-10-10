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
import FollowUps from "./pages/FollowUps.tsx";
import ForgotPassword from "./pages/ForgotPassword.tsx";
import Home from "./pages/Home.tsx";
import Login from "./pages/Login.tsx";
import NotFound from "./pages/NotFound.tsx";
import Payments from "./pages/Payments.tsx";
import Profile from "./pages/Profile.tsx";
import Reminders from "./pages/Reminders.tsx";
import Roles from "./pages/Roles.tsx";
import Tasks from "./pages/Tasks.tsx";
import Users from "./pages/Users.tsx";

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
                <Route path="/follow-ups" element={<FollowUps />} />
                <Route path="/booked" element={<Booked />} />
                <Route path="/payments" element={<Payments />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/reminders" element={<Reminders />} />
                <Route path="/users" element={<Users />} />
                <Route path="/roles" element={<Roles />} />
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
