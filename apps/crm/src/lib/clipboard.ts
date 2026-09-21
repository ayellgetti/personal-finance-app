/**
 * The CRM apps are also served over plain HTTP on the LAN, where
 * navigator.clipboard is unavailable, so fall back to a hidden textarea.
 */
export async function copyToClipboard(value: string): Promise<boolean> {
  if (!value) return false;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // fall through to the textarea below
  }

  if (typeof document === "undefined") return false;

  const holder = document.createElement("textarea");
  holder.value = value;
  holder.setAttribute("readonly", "");
  holder.style.position = "fixed";
  holder.style.opacity = "0";
  document.body.appendChild(holder);
  holder.select();
  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    document.body.removeChild(holder);
  }
}
