import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Native picker: the phone's own wheel or list is easier to use than a popover for long option lists. */
export function NativeSelect({
  id,
  value,
  onChange,
  children,
  className,
  disabled,
}: {
  id: string;
  value: string;
  onChange: (next: string) => void;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <select
      id={id}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className={cn(
        "flex h-11 w-full rounded-xl border border-input bg-background px-3 text-base focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50",
        className,
      )}
    >
      {children}
    </select>
  );
}

export function FieldError({ message }: { message: string | undefined }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}
