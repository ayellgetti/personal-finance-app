import { useEffect } from "react";

export function usePageMeta(title: string, description: string): void {
  useEffect(() => {
    const previousTitle = document.title;
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const created = meta === null;
    const previousDescription = meta?.getAttribute("content") ?? "";

    if (meta === null) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }

    document.title = title;
    meta.setAttribute("content", description);

    return () => {
      document.title = previousTitle;
      if (created) {
        meta.remove();
      } else {
        meta.setAttribute("content", previousDescription);
      }
    };
  }, [title, description]);
}
