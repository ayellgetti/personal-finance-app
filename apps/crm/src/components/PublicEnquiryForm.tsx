import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function PublicEnquiryField({
  id,
  label,
  required,
  error,
  accentClass = "text-amber-600",
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  accentClass?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={id} className="text-sm font-medium text-stone-700">
        {label}
        {required ? <span className={accentClass}>*</span> : null}
      </Label>
      <div className="mt-1.5">{children}</div>
      {error ? (
        <p className="mt-1 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const publicEnquiryInputClass =
  "h-11 rounded-full border-stone-200 bg-stone-50 px-4 text-stone-800 placeholder:text-stone-400";
export const publicEnquirySelectClass =
  "h-11 rounded-full border-stone-200 bg-stone-50 px-4 text-stone-800";

export function PublicEnquiryShell({
  title,
  description,
  titleClass,
  borderClass,
  children,
}: {
  title: string;
  description: string;
  titleClass: string;
  borderClass: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#fbf8f3] px-4 py-10 text-stone-800">
      <div
        className={cn(
          "mx-auto w-full max-w-5xl rounded-[2rem] border bg-white p-6 shadow-[0_16px_48px_-24px_rgba(40,70,120,0.28)] sm:p-10",
          borderClass,
        )}
      >
        <h1 className={cn("font-display text-2xl font-semibold tracking-tight sm:text-3xl", titleClass)}>
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-stone-500">{description}</p>
        {children}
      </div>
    </div>
  );
}
