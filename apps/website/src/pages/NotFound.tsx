import { Link } from "react-router-dom";
import { PageShell } from "@/components/PageShell";

export default function NotFound() {
  return (
    <PageShell>
      <div className="container py-24 text-center">
        <p className="text-sm font-semibold text-primary">404</p>
        <h1 className="mt-2 font-display text-3xl font-bold">Page not found</h1>
        <p className="mt-3 text-muted-foreground">That URL is not part of this marketing site.</p>
        <Link to="/" className="mt-8 inline-block font-semibold text-primary hover:underline">
          Back to home
        </Link>
      </div>
    </PageShell>
  );
}
