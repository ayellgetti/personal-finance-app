import { Loader2, ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/store";
import { useMobile } from "@/lib/mobile/store";

export function SessionGate({ children }: { children: ReactNode }) {
  const { logout } = useAuth();
  const { status, errorMessage, reload } = useMobile();

  if (status === "idle" || status === "loading") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
        <p className="text-sm text-muted-foreground">Loading your session…</p>
      </div>
    );
  }

  if (status === "forbidden") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Alert className="max-w-sm rounded-2xl">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>No access</AlertTitle>
          <AlertDescription className="space-y-4">
            <p>You do not have a CRM role. Ask an admin to assign one, then try again.</p>
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => void logout()}>
              Sign out
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Alert variant="destructive" className="max-w-sm rounded-2xl">
          <AlertTitle>Unable to load</AlertTitle>
          <AlertDescription className="space-y-4">
            <p>{errorMessage ?? "Something went wrong while loading your session."}</p>
            <div className="flex gap-2">
              <Button type="button" className="rounded-xl" onClick={reload}>
                Try again
              </Button>
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => void logout()}>
                Sign out
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
}
