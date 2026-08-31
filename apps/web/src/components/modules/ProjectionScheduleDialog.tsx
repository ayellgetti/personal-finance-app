import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TableProperties } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  formatCurrency,
  type ProjectionSchedulePoint,
} from "@/lib/finance/calculations";
import { tooltipStyle } from "./shared";

function periodLabel(year: number) {
  if (year === 0) return "Today";
  if (year < 1) return `${Math.round(year * 12)} months`;
  return Number.isInteger(year) ? `Year ${year}` : `${year.toFixed(1)} years`;
}

export function ProjectionScheduleDialog({
  name,
  description,
  rows,
  currency,
}: {
  name: string;
  description: string;
  rows: ProjectionSchedulePoint[];
  currency: string;
}) {
  const finalPoint = rows.at(-1);
  const chartRows = rows.map((row) => ({
    ...row,
    period: periodLabel(row.year),
  }));

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="text-xs">
          <TableProperties className="mr-1.5 h-4 w-4" />
          View projection
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="font-display">{name} projection</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {finalPoint && (
          <div className="grid gap-3 sm:grid-cols-3">
            <Summary label="Total contributed" value={finalPoint.contributed} currency={currency} />
            <Summary label="Estimated returns" value={finalPoint.estimatedReturns} currency={currency} />
            <Summary label="Projected value" value={finalPoint.projectedValue} currency={currency} />
          </div>
        )}

        <div>
          <p className="mb-2 text-sm font-medium">Year-by-year growth</p>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={chartRows}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" tick={{ fontSize: 11 }} />
              <YAxis
                tickFormatter={(value) => formatCurrency(value, currency, true)}
                tick={{ fontSize: 10 }}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number) => formatCurrency(value, currency)}
              />
              <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
              <Bar dataKey="contributed" name="Contributed" fill="hsl(142 55% 38%)" />
              <Line
                dataKey="projectedValue"
                name="Projected value"
                type="monotone"
                stroke="hsl(338 72% 38%)"
                strokeWidth={2}
              />
              {finalPoint?.target !== undefined && (
                <Line
                  dataKey="target"
                  name="Inflation-adjusted target"
                  type="monotone"
                  stroke="hsl(24 92% 54%)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/60 text-left">
                <th className="px-3 py-2 font-medium">Period</th>
                <th className="px-3 py-2 font-medium">Contributed</th>
                <th className="px-3 py-2 font-medium">Estimated returns</th>
                <th className="px-3 py-2 font-medium">Projected value</th>
                {finalPoint?.target !== undefined && (
                  <th className="px-3 py-2 font-medium">Target</th>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.year} className="border-b last:border-0">
                  <td className="px-3 py-2 font-medium">{periodLabel(row.year)}</td>
                  <td className="px-3 py-2">{formatCurrency(row.contributed, currency)}</td>
                  <td className="px-3 py-2">{formatCurrency(row.estimatedReturns, currency)}</td>
                  <td className="px-3 py-2">{formatCurrency(row.projectedValue, currency)}</td>
                  {finalPoint?.target !== undefined && (
                    <td className="px-3 py-2">{formatCurrency(row.target ?? 0, currency)}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-muted-foreground">
          This projection uses the saved return and contribution assumptions. Actual returns may vary.
        </p>
      </DialogContent>
    </Dialog>
  );
}

function Summary({
  label,
  value,
  currency,
}: {
  label: string;
  value: number;
  currency: string;
}) {
  return (
    <div className="rounded-xl bg-muted/50 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-lg font-bold">
        {formatCurrency(value, currency)}
      </p>
    </div>
  );
}
