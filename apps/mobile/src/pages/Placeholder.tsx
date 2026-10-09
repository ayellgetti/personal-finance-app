import { Link } from "react-router-dom";
import { Construction } from "lucide-react";

/** Drawer destinations that the web CRM already covers; the mobile view lands in a later phase. */
export default function Placeholder({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <Construction className="h-7 w-7 text-muted-foreground" aria-hidden />
      <h2 className="font-display text-lg font-bold">{title}</h2>
      <p className="max-w-[18rem] text-sm text-muted-foreground">
        This section is not on mobile yet. Use the web CRM for now.
      </p>
      <Link to="/" className="text-sm font-medium text-primary hover:underline">
        Back to Home
      </Link>
    </div>
  );
}
