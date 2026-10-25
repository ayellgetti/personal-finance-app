import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const MONTHS = Array.from({ length: 12 }, (_, month) =>
  new Date(2020, month, 1).toLocaleDateString(undefined, { month: "long" }),
);

function yearsAround(year: number): number[] {
  const currentYear = new Date().getFullYear();
  const first = Math.min(currentYear - 20, year);
  const last = Math.max(currentYear + 20, year);
  return Array.from({ length: last - first + 1 }, (_, index) => first + index);
}

export function MonthYearPicker({
  cursor,
  onChange,
  className,
}: {
  cursor: Date;
  onChange: (next: Date) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(cursor.getMonth());
  const [year, setYear] = useState(cursor.getFullYear());
  const years = yearsAround(cursor.getFullYear());
  const label = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const changeOpen = (next: boolean) => {
    setOpen(next);
    if (next) {
      setMonth(cursor.getMonth());
      setYear(cursor.getFullYear());
    }
  };

  return (
    <>
      <button
        type="button"
        className={className}
        aria-label={`Choose month and year, currently ${label}`}
        onClick={() => changeOpen(true)}
      >
        <span>{label}</span>
        <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden />
      </button>

      <Dialog open={open} onOpenChange={changeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choose month and year</DialogTitle>
            <DialogDescription>Jump directly to a month in the calendar.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="calendar-month">Month</Label>
              <select
                id="calendar-month"
                value={month}
                onChange={(event) => setMonth(Number(event.target.value))}
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
              >
                {MONTHS.map((name, index) => (
                  <option key={name} value={index}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="calendar-year">Year</Label>
              <select
                id="calendar-year"
                value={year}
                onChange={(event) => setYear(Number(event.target.value))}
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
              >
                {years.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter className="flex-row gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => changeOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="flex-1"
              onClick={() => {
                onChange(new Date(year, month, 1));
                setOpen(false);
              }}
            >
              Go
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
