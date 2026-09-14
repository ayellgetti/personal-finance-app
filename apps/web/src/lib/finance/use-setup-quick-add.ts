import { useImperativeHandle, useState, type Ref } from "react";
import { toast } from "sonner";
import {
  validateEntityDraft,
  type EntityDraftKey,
  type FieldErrors,
  type SetupDraftHandle,
} from "./setup-validation";

export type SetupQuickAddProps<T> = {
  currency: string;
  onAdd: (item: T) => void | Promise<void | string | undefined>;
  onUpdate?: (id: string, item: T) => void | Promise<boolean>;
  dualActions?: boolean;
};

export function useSetupQuickAdd<T>(
  ref: Ref<SetupDraftHandle>,
  {
    dualActions,
    key,
    getValues,
    reset,
  }: {
    dualActions: boolean;
    key: EntityDraftKey;
    getValues: () => Record<string, unknown>;
    reset: () => void;
  },
) {
  const [saved, setSaved] = useState(true);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});

  const markDirty = () => {
    setSaved(false);
    setErrors({});
  };

  const clearDraft = () => {
    reset();
    setSaved(true);
    setSavedId(null);
    setErrors({});
  };

  const saveItem = async (
    payload: T,
    onAdd: (item: T) => void | Promise<void | string | undefined>,
    onUpdate?: (id: string, item: T) => void | Promise<boolean>,
  ) => {
    const result = validateEntityDraft(key, getValues());
    if (result.status !== "complete") {
      setErrors(result.errors);
      toast.error(Object.values(result.errors)[0] ?? "Complete required fields before saving");
      return false;
    }
    if (savedId && onUpdate) {
      const ok = await onUpdate(savedId, payload);
      if (!ok) return false;
    } else {
      const id = await onAdd(payload);
      if (dualActions && !id) return false;
      if (typeof id === "string") setSavedId(id);
    }
    toast.success("Saved");
    if (dualActions) {
      clearDraft();
    } else {
      setSaved(true);
    }
    return true;
  };

  useImperativeHandle(ref, () => ({
    canProceed: () => {
      if (!dualActions) return true;
      const result = validateEntityDraft(key, getValues());
      if (result.status === "empty") return true;
      if (result.status === "incomplete") {
        setErrors(result.errors);
        toast.error("Complete required fields before continuing");
        return false;
      }
      if (!saved) {
        toast.error("Save this item before continuing");
        return false;
      }
      return true;
    },
  }), [dualActions, getValues, key, saved]);

  return { errors, markDirty, saveItem, clearDraft };
}
