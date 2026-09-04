import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/store";
import { useCrm } from "@/lib/crm/store";
import type { ReactNode } from "react";

export function CrmSessionGate({ children }: { children: ReactNode }) {
  const { logout } = useAuth();
  const { status, errorMessage, reload } = useCrm();

  if (status === "idle" || status === "loading") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
        <p className="text-sm text-muted-foreground">Loading CRM session…</p>
        <div className="w-full max-w-md space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  if (status === "forbidden") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Alert className="max-w-md rounded-2xl">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>No access</AlertTitle>
          <AlertDescription className="space-y-4">
            <p>You do not have a Sales CRM role. Ask an admin to assign one, then try again.</p>
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
        <Alert variant="destructive" className="max-w-md rounded-2xl">
          <AlertTitle>Unable to load CRM</AlertTitle>
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
