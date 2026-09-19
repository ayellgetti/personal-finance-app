import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FinanceData } from "@/types/finance";
import { AdvisorResult, AdvisorSource } from "@/lib/finance/advisor";
import { ageFromDob, type AccountIdentity } from "@/lib/finance/profile";
import {
  formatPercent,
  monthlyIncome,
  monthlyExpenses,
  monthlyEMI,
  monthlySIP,
  monthlyInsurancePremium,
  monthlySavings,
  totalInvestments,
  totalLiabilities,
  netWorth,
  savingsRate,
  debtToIncome,
  healthScore,
  financialFreedom,
  analyzeGoal,
  prepaymentStrategy,
} from "./calculations";

const GREEN: [number, number, number] = [16, 122, 87];
const DARK: [number, number, number] = [22, 38, 44];
const GOLD: [number, number, number] = [217, 152, 30];
const PAGE_MARGIN = 28;
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;
const FOOTER_Y = PAGE_HEIGHT - 18;
const MAX_Y = FOOTER_Y - 10;
const COL_GAP = 10;
const COL_WIDTH = (CONTENT_WIDTH - COL_GAP) / 2;

const SOURCE_LABEL: Record<AdvisorSource, string> = {
  openai: "OpenAI",
  cache: "Saved",
  rules: "Rule engine",
};

/** jsPDF Helvetica only supports WinAnsi; AI text often has rupee signs and dashes. */
export function pdfSafe(value: unknown): string {
  return String(value ?? "")
    .replace(/₹/g, "Rs.")
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/[\u2018\u2019\u201A\u2032]/g, "'")
    .replace(/[\u201C\u201D\u201E\u2033]/g, '"')
    .replace(/\u2026/g, "...")
    .replace(/[\u00A0\u202F]/g, " ")
    .replace(/[^\t\n\r\x20-\x7E]/g, "");
}

function money(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_00_00_000) return `Rs.${(value / 1_00_00_000).toFixed(2)} Cr`;
  if (abs >= 1_00_000) return `Rs.${(value / 1_00_000).toFixed(2)} L`;
  if (abs >= 1_000) return `Rs.${(value / 1_000).toFixed(1)} K`;
  return `Rs.${Math.round(value).toLocaleString("en-IN")}`;
}

function lastTableY(doc: jsPDF, fallback: number) {
  const y = (doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY;
  return typeof y === "number" ? y + 10 : fallback + 10;
}

function clipRows(rows: string[][], max: number): string[][] {
  if (rows.length <= max) return rows;
  const width = rows[0]?.length ?? 1;
  const kept = rows.slice(0, max);
  const extra = Array.from({ length: width }, () => "");
  extra[0] = width > 1 ? "..." : `... ${rows.length - max} more`;
  if (width > 1) extra[1] = `${rows.length - max} more`;
  kept.push(extra);
  return kept;
}

function downloadBlob(doc: jsPDF, filename: string) {
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export function buildReport(
  data: FinanceData,
  advisor?: AdvisorResult | null,
  identity?: AccountIdentity | null,
): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const fi = financialFreedom(data);
  const hs = healthScore(data);
  const advice = advisor?.advice;
  const name = identity?.name || data.profile.name;
  const age = identity ? ageFromDob(identity.dob) : data.profile.age;
  const email = identity?.email;
  let y = 78;

  doc.setFillColor(...DARK);
  doc.rect(0, 0, PAGE_WIDTH, 64, "F");
  doc.setFillColor(...GREEN);
  doc.rect(0, 62, PAGE_WIDTH, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Financial Freedom Report", PAGE_MARGIN, 28);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(200, 220, 210);
  doc.text(
    pdfSafe(
      [name, age ? `Age ${age}` : null, email, new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })]
        .filter(Boolean)
        .join("  |  "),
    ),
    PAGE_MARGIN,
    44,
  );
  const sourceLine = advisor
    ? `Health ${hs.total}/100  |  ${SOURCE_LABEL[advisor.source]}${advisor.generatedAt ? `  |  ${new Date(advisor.generatedAt).toLocaleString("en-IN")}` : ""}`
    : `Financial Health Score: ${hs.total}/100`;
  doc.text(pdfSafe(sourceLine), PAGE_MARGIN, 56);

  const sectionTitle = (title: string, x = PAGE_MARGIN, width = CONTENT_WIDTH) => {
    if (y > MAX_Y - 28) return false;
    doc.setTextColor(...GREEN);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(title, x, y);
    y += 5;
    doc.setDrawColor(220, 230, 225);
    doc.line(x, y, x + width, y);
    y += 8;
    return true;
  };

  const paragraph = (text: string, maxLines = 3) => {
    const safe = pdfSafe(text);
    if (!safe || y > MAX_Y - 12) return;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...DARK);
    const lines = (doc.splitTextToSize(safe, CONTENT_WIDTH) as string[]).slice(0, maxLines);
    lines.forEach((line) => {
      if (!line || y > MAX_Y - 10) return;
      doc.text(line, PAGE_MARGIN, y);
      y += 10;
    });
  };

  const table = (
    options: Parameters<typeof autoTable>[1],
    left = PAGE_MARGIN,
    width = CONTENT_WIDTH,
  ) => {
    if (y > MAX_Y - 24) return;
    autoTable(doc, {
      ...options,
      startY: y,
      pageBreak: "avoid",
      margin: { left, right: PAGE_WIDTH - left - width },
      tableWidth: width,
      styles: {
        font: "helvetica",
        fontSize: 7,
        overflow: "linebreak",
        cellWidth: "auto",
        textColor: DARK,
        cellPadding: 2,
        ...(options?.styles ?? {}),
      },
      headStyles: {
        fillColor: GREEN,
        textColor: 255,
        fontStyle: "bold",
        fontSize: 7,
        cellPadding: 2,
        ...(options?.headStyles ?? {}),
      },
    });
    y = lastTableY(doc, y);
  };

  if (sectionTitle("1. Current Position")) {
    table({
      theme: "grid",
      head: [["Metric", "Value", "Metric", "Value"]],
      body: [
        ["Monthly income", money(monthlyIncome(data)), "Monthly expenses + EMI", money(monthlyExpenses(data) + monthlyEMI(data))],
        ["Monthly surplus", money(monthlySavings(data)), "Savings rate", formatPercent(savingsRate(data))],
        ["Investments", money(totalInvestments(data)), "Loans & cards", money(totalLiabilities(data))],
        ["Net worth", money(netWorth(data)), "Debt-to-income", formatPercent(debtToIncome(data))],
        ["Monthly SIPs", money(monthlySIP(data)), "Insurance / month", money(monthlyInsurancePremium(data))],
        ["Freedom date", `${fi.fiDate.getFullYear()} | ${fi.yearsRemaining}y left`, "Health score", `${hs.total}/100`],
      ],
    });
  }

  const leftX = PAGE_MARGIN;
  const rightX = PAGE_MARGIN + COL_WIDTH + COL_GAP;
  const splitY = y;

  const incomeRows = data.incomes.map((item) => [pdfSafe(item.name), pdfSafe(item.type), money(item.monthlyAmount)]);
  const expenseRows = data.expenses.filter((item) => item.recurring).map((item) => [pdfSafe(item.name), pdfSafe(item.category), money(item.amount)]);
  y = splitY;
  if (sectionTitle("2. Income", leftX, COL_WIDTH)) {
    table(
      {
        theme: "grid",
        head: [["Source", "Type", "Monthly"]],
        body: clipRows(incomeRows.length ? incomeRows : [["None", "-", "-"]], 5),
        columnStyles: { 2: { cellWidth: 48, halign: "right" } },
      },
      leftX,
      COL_WIDTH,
    );
  }
  const afterIncome = y;

  y = splitY;
  if (sectionTitle("3. Expenses", rightX, COL_WIDTH)) {
    table(
      {
        theme: "grid",
        head: [["Item", "Category", "Monthly"]],
        body: clipRows(expenseRows.length ? expenseRows : [["None", "-", "-"]], 5),
        columnStyles: { 2: { cellWidth: 48, halign: "right" } },
      },
      rightX,
      COL_WIDTH,
    );
  }
  y = Math.max(afterIncome, y);

  const loanSplit = y;
  const loanRows = data.loans.map((item) => [
    pdfSafe(item.name),
    formatPercent(item.interestRate),
    money(item.emi),
    money(item.outstanding),
  ]);
  const cardRows = data.creditCards.map((item) => [
    pdfSafe(item.name),
    pdfSafe(item.network),
    money(item.minimumDue),
    money(item.outstanding),
  ]);
  y = loanSplit;
  if (sectionTitle("4. Loans", leftX, COL_WIDTH)) {
    table(
      {
        theme: "grid",
        headStyles: { fillColor: GOLD },
        head: [["Loan", "Rate", "EMI", "Balance"]],
        body: clipRows(loanRows.length ? loanRows : [["None", "-", "-", "-"]], 4),
      },
      leftX,
      COL_WIDTH,
    );
  }
  const afterLoans = y;

  y = loanSplit;
  if (sectionTitle("5. Credit Cards", rightX, COL_WIDTH)) {
    table(
      {
        theme: "grid",
        headStyles: { fillColor: GOLD },
        head: [["Card", "Network", "Min due", "Due"]],
        body: clipRows(cardRows.length ? cardRows : [["None", "-", "-", "-"]], 4),
      },
      rightX,
      COL_WIDTH,
    );
  }
  y = Math.max(afterLoans, y);

  const investSplit = y;
  const investRows = data.investments.map((item) => [
    pdfSafe(item.name),
    pdfSafe(item.type),
    money(item.monthlySip),
    money(item.currentValue),
  ]);
  const insureRows = data.insurances.map((item) => [
    pdfSafe(item.name),
    pdfSafe(item.type),
    money(item.annualPremium),
    money(item.coverage),
  ]);
  y = investSplit;
  if (sectionTitle("6. Investments", leftX, COL_WIDTH)) {
    table(
      {
        theme: "grid",
        head: [["Holding", "Type", "SIP", "Value"]],
        body: clipRows(investRows.length ? investRows : [["None", "-", "-", "-"]], 4),
      },
      leftX,
      COL_WIDTH,
    );
  }
  const afterInvest = y;

  y = investSplit;
  if (sectionTitle("7. Insurance", rightX, COL_WIDTH)) {
    table(
      {
        theme: "grid",
        head: [["Policy", "Type", "Premium", "Cover"]],
        body: clipRows(insureRows.length ? insureRows : [["None", "-", "-", "-"]], 4),
      },
      rightX,
      COL_WIDTH,
    );
  }
  y = Math.max(afterInvest, y);

  if (advice) {
    if (sectionTitle("8. AI Summary")) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...DARK);
      const headline = (doc.splitTextToSize(pdfSafe(advice.summaryReport.headline), CONTENT_WIDTH) as string[]).slice(0, 2);
      headline.forEach((line) => {
        if (!line || y > MAX_Y - 10) return;
        doc.text(line, PAGE_MARGIN, y);
        y += 11;
      });
      paragraph(advice.executiveSummary, 2);
      table({
        theme: "grid",
        head: [["Highlight", "Detail"]],
        body: advice.summaryReport.highlights.slice(0, 4).map((item) => [pdfSafe(item.label), pdfSafe(item.detail)]),
        columnStyles: { 0: { cellWidth: 110 } },
      });
    }

    if (advice.riskWarnings.length && sectionTitle("9. Risks to Watch")) {
      table({
        theme: "grid",
        headStyles: { fillColor: GOLD },
        head: [["Severity", "Risk", "Detail"]],
        body: advice.riskWarnings.slice(0, 3).map((warning) => [
          pdfSafe(warning.severity),
          pdfSafe(warning.title),
          pdfSafe(warning.detail),
        ]),
        columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 120 } },
      });
    }
  }

  const goalNumber = advice ? "10" : "8";
  if (sectionTitle(`${goalNumber}. Goals`)) {
    const goalRows = data.goals.map((g) => {
      const a = analyzeGoal(data, g);
      return [pdfSafe(g.name), money(g.targetAmount), `${a.probability}%`, pdfSafe(a.status), money(a.fundingGap)];
    });
    table({
      theme: "grid",
      head: [["Goal", "Target", "Prob.", "Status", "Gap"]],
      body: clipRows(goalRows.length ? goalRows : [["No goals added", "-", "-", "-", "-"]], 5),
    });
  }

  if (advice && sectionTitle("11. Plan of Action")) {
    table({
      theme: "grid",
      head: [["#", "Impact", "Category", "Action"]],
      body: advice.planOfAction.slice(0, 6).map((step) => [
        String(step.priority),
        pdfSafe(step.impact),
        pdfSafe(step.category),
        pdfSafe(step.monthlyAmount ? `${step.action} (${money(step.monthlyAmount)} / mo)` : step.action),
      ]),
      columnStyles: { 0: { cellWidth: 18 }, 1: { cellWidth: 42 }, 2: { cellWidth: 70 } },
    });
  }

  if (advice && sectionTitle("12. Debt & Investment Strategy")) {
    paragraph(advice.debtStrategy.summary, 2);
    if (advice.debtStrategy.steps.length) {
      table({
        theme: "grid",
        headStyles: { fillColor: GOLD },
        head: [["#", "Loan", "Action"]],
        body: advice.debtStrategy.steps.slice(0, 4).map((step) => [
          String(step.order),
          pdfSafe(step.loan),
          pdfSafe(step.action),
        ]),
        columnStyles: { 0: { cellWidth: 18 }, 1: { cellWidth: 130 } },
      });
    }
    paragraph(`${advice.investmentStrategy.status}: ${advice.investmentStrategy.rationale}`, 2);
  }

  const debtNumber = advice ? "13" : "9";
  if (sectionTitle(`${debtNumber}. Debt Payoff Sequence`)) {
    const strat = prepaymentStrategy(data);
    table({
      theme: "grid",
      headStyles: { fillColor: GOLD },
      head: [["Priority", "Loan", "Rate", "Outstanding"]],
      body: strat.length
        ? strat.slice(0, 6).map((loan, i) => [`#${i + 1}`, pdfSafe(loan.name), formatPercent(loan.interestRate), money(loan.outstanding)])
        : [["-", "Debt free", "-", "-"]],
    });
  }

  doc.setFontSize(7);
  doc.setTextColor(150, 160, 160);
  doc.text("Generated by Financial Freedom Planner - estimates for planning purposes only.", PAGE_MARGIN, FOOTER_Y);
  doc.text("Page 1 / 1", PAGE_WIDTH - PAGE_MARGIN, FOOTER_Y, { align: "right" });

  return doc;
}

export function generateReport(
  data: FinanceData,
  advisor?: AdvisorResult | null,
  identity?: AccountIdentity | null,
) {
  const doc = buildReport(data, advisor, identity);
  const name = identity?.name || data.profile.name;
  const filename = `Financial-Freedom-Report-${pdfSafe(name || "report").replace(/\s+/g, "-") || "report"}.pdf`;
  downloadBlob(doc, filename);
}
