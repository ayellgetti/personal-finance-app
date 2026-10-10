/** Text actions under a list card. The person is already known, so each one opens a short form. */
export function RecordShortcuts({
  onPay,
  onRemind,
  onFollow,
}: {
  onPay?: () => void;
  onRemind?: () => void;
  onFollow?: () => void;
}) {
  const actions = [
    onPay ? { label: "Add payment", onClick: onPay } : null,
    onRemind ? { label: "Add reminder", onClick: onRemind } : null,
    onFollow ? { label: "Add follow-up", onClick: onFollow } : null,
  ].filter((action): action is { label: string; onClick: () => void } => action !== null);

  if (actions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1">
      {actions.map((action) => (
        <button
          key={action.label}
          type="button"
          onClick={action.onClick}
          className="text-xs font-semibold text-primary tap-highlight-none"
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
