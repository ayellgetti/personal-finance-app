import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth/store";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
