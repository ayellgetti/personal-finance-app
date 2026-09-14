import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  addCalendarMonths,
  formatCurrency,
  formatMonthYear,
  formatTenureMonths,
  loanBalanceChartData,
  loanChartSeriesKey,
  loanPayoffBars,
} from "@/lib/finance/calculations";
import type { Loan } from "@/types/finance";
import { CHART_COLORS, Panel, tooltipStyle } from "./shared";

const FALLBACK_CHART_COLOR = "hsl(var(--chart-1))";

export function LoanPayoffChart({
  loans,
  currency,
  from,
}: {
  loans: Loan[];
  currency: string;
  from?: Date;
}) {
  const asOf = useMemo(() => from ?? new Date(), [from]);
  const active = useMemo(() => loans.filter((loan) => loan.outstanding > 0), [loans]);
  const bars = useMemo(() => loanPayoffBars(active, asOf), [active, asOf]);
  const chartData = useMemo(() => loanBalanceChartData(active, asOf), [active, asOf]);
  const series = useMemo(
    () =>
      active.map((loan, index) => ({
        id: loan.id,
        key: loanChartSeriesKey(loan, active),
        color: CHART_COLORS[index % CHART_COLORS.length] ?? FALLBACK_CHART_COLOR,
      })),
    [active],
  );
  const colorByKey = useMemo(
    () => Object.fromEntries(series.map((item) => [item.key, item.color])),
    [series],
  );
  const closable = bars.filter((bar) => !bar.neverEnds);
  const stuck = bars.filter((bar) => bar.neverEnds);

  if (active.length === 0) return null;

  return (
    <Panel title="When loans end">
      <p className="mb-4 text-sm text-muted-foreground">
        Each bar is the remaining time on the current EMI. The line chart shows outstanding dropping to zero when that loan closes.
      </p>
      {closable.length > 0 && (
        <ul className="mb-4 flex flex-wrap gap-2">
          {closable.map((bar) => (
            <li
              key={bar.id}
              className="rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-medium"
            >
              {bar.seriesKey} · {bar.endLabel}
            </li>
          ))}
        </ul>
      )}
      {stuck.map((bar) => (
        <p key={bar.id} className="mb-3 text-sm text-danger">
          {bar.seriesKey} EMI does not cover interest, so it will not close on the current payment.
        </p>
      ))}
      {closable.length > 0 && (
        <ResponsiveContainer width="100%" height={Math.min(360, Math.max(160, closable.length * 48 + 48))}>
          <BarChart
            layout="vertical"
            data={closable}
            margin={{ top: 8, right: 72, left: 8, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(months: number) =>
                months === 0 ? "Now" : formatMonthYear(addCalendarMonths(asOf, months))
              }
            />
            <YAxis
              type="category"
              dataKey="seriesKey"
              width={120}
              interval={0}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: number, _name, item) => {
                const endLabel = (item?.payload as { endLabel?: string } | undefined)?.endLabel;
                return [`${formatTenureMonths(value)}${endLabel ? ` · ${endLabel}` : ""}`, "Ends"];
              }}
            />
            <Bar dataKey="months" name="Ends" radius={[0, 6, 6, 0]} maxBarSize={28}>
              {closable.map((bar) => (
                <Cell key={bar.id} fill={colorByKey[bar.seriesKey] ?? FALLBACK_CHART_COLOR} />
              ))}
              <LabelList dataKey="endLabel" position="right" style={{ fill: "hsl(var(--foreground))", fontSize: 12 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
      {chartData.length > 1 && (
        <div className={closable.length > 0 ? "mt-6" : undefined}>
          <p className="mb-2 text-sm font-medium">Outstanding until close</p>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                interval="preserveStartEnd"
                minTickGap={28}
              />
              <YAxis
                tickFormatter={(value: number) => formatCurrency(value, currency, true)}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                width={70}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number, name: string) => [formatCurrency(value, currency, true), name]}
              />
              <Legend wrapperStyle={{ fontSize: "0.7rem" }} />
              {series.map((item) => (
                <Line
                  key={item.id}
                  type="monotone"
                  dataKey={item.key}
                  stroke={item.color}
                  strokeWidth={2.5}
                  dot={false}
                  name={item.key}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  );
}
