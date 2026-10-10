import { FieldError } from "@/components/forms/NativeSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DateRangeFilter({
  idPrefix,
  from,
  to,
  onFromChange,
  onToChange,
  error,
}: {
  idPrefix: string;
  from: string;
  to: string;
  onFromChange: (next: string) => void;
  onToChange: (next: string) => void;
  error?: string | null;
}) {
  return (
    <div className="space-y-1">
      <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
        <div className="space-y-1">
          <Label htmlFor={`${idPrefix}-from`} className="text-xs text-muted-foreground">
            From
          </Label>
          <Input
            id={`${idPrefix}-from`}
            type="date"
            value={from}
            onChange={(event) => onFromChange(event.target.value)}
            className="h-10 rounded-xl text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`${idPrefix}-to`} className="text-xs text-muted-foreground">
            To
          </Label>
          <Input
            id={`${idPrefix}-to`}
            type="date"
            value={to}
            onChange={(event) => onToChange(event.target.value)}
            className="h-10 rounded-xl text-sm"
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          className="h-10 rounded-xl"
          disabled={!from && !to}
          onClick={() => {
            onFromChange("");
            onToChange("");
          }}
        >
          Clear
        </Button>
      </div>
      <FieldError message={error ?? undefined} />
    </div>
  );
}
