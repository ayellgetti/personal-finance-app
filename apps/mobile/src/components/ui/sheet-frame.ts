/**
 * Bottom sheets stay inside the small viewport, below the notch and browser chrome,
 * and leave a strip of the page so the sheet can be dismissed.
 */
export const bottomSheetCapClass =
  "flex max-h-[calc(100svh-max(4.5rem,env(safe-area-inset-top)))] flex-col gap-0 overflow-hidden rounded-t-3xl p-0 pb-safe";

/** Same frame as {@link bottomSheetCapClass}, stretched so the footer stays at the bottom. */
export const bottomSheetFillClass =
  "flex h-[calc(100svh-max(4.5rem,env(safe-area-inset-top)))] max-h-[calc(100svh-max(4.5rem,env(safe-area-inset-top)))] flex-col gap-0 overflow-hidden rounded-t-3xl p-0 pb-safe";

const PREFERRED_GAP = 72;
const MIN_GAP = 48;
const COMFORTABLE_SHEET = 160;

/** Keep a bottom sheet inside the visible viewport, including the keyboard. */
export function bottomSheetFrame(layoutHeight: number, offsetTop: number, visibleHeight: number) {
  const roomForPreferredGap = visibleHeight - PREFERRED_GAP >= COMFORTABLE_SHEET;
  const gap = roomForPreferredGap ? PREFERRED_GAP : MIN_GAP;
  const maxHeight = Math.max(0, Math.round(visibleHeight - gap));
  const bottom = Math.max(0, Math.round(layoutHeight - offsetTop - visibleHeight));
  return { bottom, maxHeight };
}
