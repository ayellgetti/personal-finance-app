import { HealthScore } from "@/lib/finance/calculations";

export function HealthGauge({ score, size = 180 }: { score: HealthScore; size?: number }) {
  const stroke = size < 150 ? 8 : 12;
  const radius = size / 2 - stroke - 2;
  const circ = 2 * Math.PI * radius;
  const pct = score.total / 100;
  const color = score.total >= 75 ? "hsl(var(--success))" : score.total >= 50 ? "hsl(var(--accent))" : "hsl(var(--danger))";
  const label = score.total >= 75 ? "Excellent" : score.total >= 50 ? "Good" : score.total >= 35 ? "Fair" : "Needs Work";

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - pct)}
            style={{ transition: "stroke-dashoffset 1s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-display font-bold leading-none ${size < 150 ? "text-2xl" : "text-4xl"}`}>{score.total}</span>
          <span className="mt-1 text-[11px] text-muted-foreground">/ 100</span>
        </div>
      </div>
      <span className="mt-2 font-display text-sm font-semibold" style={{ color }}>{label}</span>
    </div>
  );
}
