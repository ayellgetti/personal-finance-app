import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * The header quick-add sheet navigates to `<tab>?new=1`; the tab reads that intent
 * here and opens its own create form.
 */
export function useCreateIntent(enabled: boolean): [boolean, (next: boolean) => void] {
  const [params, setParams] = useSearchParams();
  const open = enabled && params.get("new") === "1";

  const setOpen = useCallback(
    (next: boolean) => {
      const updated = new URLSearchParams(params);
      if (next) {
        updated.set("new", "1");
      } else {
        updated.delete("new");
      }
      setParams(updated, { replace: true });
    },
    [params, setParams],
  );

  return [open, setOpen];
}
