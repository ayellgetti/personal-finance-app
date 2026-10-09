import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <h2 className="font-display text-3xl font-bold">404</h2>
      <p className="text-sm text-muted-foreground">This page does not exist.</p>
      <Link to="/" className="text-sm font-medium text-primary hover:underline">
        Back to Home
      </Link>
    </div>
  );
}
