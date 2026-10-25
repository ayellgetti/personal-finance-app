import { ChevronLeft, ChevronRight } from "lucide-react";
import { MonthYearPicker } from "@/components/MonthYearPicker";
import { Button } from "@/components/ui/button";

function shiftMonth(cursor: Date, direction: 1 | -1): Date {
  return new Date(cursor.getFullYear(), cursor.getMonth() + direction, 1);
}

export function MonthNav({ cursor, onChange }: { cursor: Date; onChange: (next: Date) => void }) {
  return (
    <div className="flex items-center justify-between">
      <Button type="button" variant="ghost" size="icon" aria-label="Previous month" onClick={() => onChange(shiftMonth(cursor, -1))}>
        <ChevronLeft className="h-5 w-5" aria-hidden />
      </Button>
      <MonthYearPicker
        cursor={cursor}
        onChange={onChange}
        className="flex min-w-0 items-center gap-1.5 rounded-lg px-2 py-1 font-display text-base font-semibold tap-highlight-none"
      />
      <Button type="button" variant="ghost" size="icon" aria-label="Next month" onClick={() => onChange(shiftMonth(cursor, 1))}>
        <ChevronRight className="h-5 w-5" aria-hidden />
      </Button>
    </div>
  );
}
