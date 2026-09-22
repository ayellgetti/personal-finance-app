import { ThemeProvider } from "next-themes";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth/store";
import { CrmProvider } from "@/lib/crm/store";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { CrmSessionGate } from "@/components/CrmSessionGate";
import { PwaInstallDialog } from "@/components/PwaInstallDialog";
import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import ForgotPassword from "./pages/ForgotPassword.tsx";
import Banquet from "./pages/Banquet.tsx";
import BanquetEnquiry from "./pages/BanquetEnquiry.tsx";
import BanquetChecklist from "./pages/BanquetChecklist.tsx";
import TravelEnquiry from "./pages/TravelEnquiry.tsx";
import RealEstate from "./pages/RealEstate.tsx";
import Freedom from "./pages/Freedom.tsx";
import NotFound from "./pages/NotFound.tsx";

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="crm-theme">
    <AuthProvider>
      <CrmProvider>
        <TooltipProvider delayDuration={200}>
          <Sonner />
          <PwaInstallDialog appName="Sales CRM" />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/banquet" element={<Banquet />} />
              <Route path="/banquet.html" element={<Banquet />} />
              <Route path="/banquet-enquiry" element={<BanquetEnquiry />} />
              <Route path="/banquet-checklist" element={<BanquetChecklist />} />
              <Route path="/travel-enquiry" element={<TravelEnquiry />} />
              <Route path="/real-estate" element={<RealEstate />} />
              <Route path="/real-estate.html" element={<RealEstate />} />
              <Route path="/freedom" element={<Freedom />} />
              <Route path="/freedom.html" element={<Freedom />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <CrmSessionGate>
                      <Index />
                    </CrmSessionGate>
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CrmProvider>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
