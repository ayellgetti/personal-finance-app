import { useState, ReactNode } from "react";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export interface FieldDef {
  name: string;
  label: string;
  type: "text" | "number" | "date" | "select" | "switch";
  options?: readonly string[];
  defaultValue?: string | number | boolean;
  prefix?: string;
  span?: 1 | 2;
}

interface EntityDialogProps {
  title: string;
  description?: string;
  fields: FieldDef[];
  triggerLabel?: string;
  trigger?: ReactNode;
  onSubmit: (values: Record<string, any>) => void;
}

export function EntityDialog({ title, description, fields, triggerLabel = "Add", trigger, onSubmit }: EntityDialogProps) {
  const [open, setOpen] = useState(false);
  const init = () => {
    const v: Record<string, any> = {};
    fields.forEach((f) => {
      v[f.name] =
        f.defaultValue ?? (f.type === "number" ? 0 : f.type === "switch" ? true : f.type === "select" ? f.options?.[0] : "");
    });
    return v;
  };
  const [values, setValues] = useState<Record<string, any>>(init);

  const set = (name: string, val: any) => setValues((v) => ({ ...v, [name]: val }));

  const handleSubmit = () => {
    onSubmit(values);
    setValues(init());
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) setValues(init()); }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="gap-2 rounded-xl">
            <Plus className="h-4 w-4" /> {triggerLabel}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          {fields.map((f) => (
            <div key={f.name} className={f.span === 2 || f.type === "switch" ? "col-span-2 space-y-2" : "space-y-2"}>
              <Label htmlFor={f.name}>{f.label}</Label>
              {f.type === "select" ? (
                <Select value={String(values[f.name])} onValueChange={(val) => set(f.name, val)}>
                  <SelectTrigger id={f.name}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {f.options?.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : f.type === "switch" ? (
                <div className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <Switch id={f.name} checked={!!values[f.name]} onCheckedChange={(c) => set(f.name, c)} />
                  <span className="text-sm text-muted-foreground">{values[f.name] ? "Yes" : "No"}</span>
                </div>
              ) : (
                <div className="relative">
                  {f.prefix && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{f.prefix}</span>
                  )}
                  <Input
                    id={f.name}
                    type={f.type}
                    value={values[f.name]}
                    className={f.prefix ? "pl-7" : ""}
                    onChange={(e) => set(f.name, f.type === "number" ? Number(e.target.value) : e.target.value)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} className="rounded-xl">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
