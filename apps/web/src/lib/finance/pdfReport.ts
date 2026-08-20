import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FinanceData } from "@/types/finance";
import { AdvisorResult, AdvisorSource } from "@/lib/finance/advisor";
import { ageFromDob, type AccountIdentity } from "@/lib/finance/profile";
import {
  formatPercent, monthlyIncome, monthlyExpenses, monthlyEMI,
  totalInvestments, totalLiabilities, netWorth, savingsRate, debtToIncome,
  healthScore, financialFreedom, analyzeGoal, prepaymentStrategy,
} from "./calculations";

const GREEN: [number, number, number] = [16, 122, 87];
const DARK: [number, number, number] = [22, 38, 44];
const GOLD: [number, number, number] = [217, 152, 30];
const PAGE_MARGIN = 40;
const PAGE_WIDTH = 595.28;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;

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
  return typeof y === "number" ? y + 24 : fallback + 24;
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

export function generateReport(
  data: FinanceData,
  advisor?: AdvisorResult | null,
  identity?: AccountIdentity | null,
) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const fi = financialFreedom(data);
  const hs = healthScore(data);
  const advice = advisor?.advice;
  const name = identity?.name || data.profile.name;
  const age = identity ? ageFromDob(identity.dob) : data.profile.age;
  const email = identity?.email;
  let y = 140;

  doc.setFillColor(...DARK);
  doc.rect(0, 0, PAGE_WIDTH, 110, "F");
  doc.setFillColor(...GREEN);
  doc.rect(0, 106, PAGE_WIDTH, 4, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("Financial Freedom Report", PAGE_MARGIN, 50);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(200, 220, 210);
  doc.text(
    pdfSafe(
      [name, age ? `Age ${age}` : null, email, new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })]
        .filter(Boolean)
        .join("  |  "),
    ),
    PAGE_MARGIN,
    72,
  );
  doc.setFontSize(10);
  const sourceLine = advisor
    ? `Health ${hs.total}/100  |  ${SOURCE_LABEL[advisor.source]}${advisor.generatedAt ? `  |  ${new Date(advisor.generatedAt).toLocaleString("en-IN")}` : ""}`
    : `Financial Health Score: ${hs.total}/100`;
  doc.text(pdfSafe(sourceLine), PAGE_MARGIN, 90);

  const ensureSpace = (needed = 60) => {
    if (y > 780 - needed) {
      doc.addPage();
      y = 50;
    }
  };

  const sectionTitle = (title: string) => {
    ensureSpace(80);
    doc.setTextColor(...GREEN);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(title, PAGE_MARGIN, y);
    y += 8;
    doc.setDrawColor(220, 230, 225);
    doc.line(PAGE_MARGIN, y, PAGE_WIDTH - PAGE_MARGIN, y);
    y += 14;
  };

  const paragraph = (text: string, indent = 44) => {
    const safe = pdfSafe(text);
    if (!safe) return;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    const lines = doc.splitTextToSize(safe, PAGE_WIDTH - indent - PAGE_MARGIN) as string[];
    lines.forEach((line) => {
      if (!line) return;
      ensureSpace(24);
      doc.text(line, indent, y);
      y += 13;
    });
  };

  const table = (options: Parameters<typeof autoTable>[1]) => {
    autoTable(doc, {
      ...options,
      startY: y,
      margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
      styles: {
        font: "helvetica",
        fontSize: 9,
        overflow: "linebreak",
        cellWidth: "auto",
        textColor: DARK,
        ...(options?.styles ?? {}),
      },
    });
    y = lastTableY(doc, y);
  };

  sectionTitle("1. Current Position");
  table({
    theme: "grid",
    headStyles: { fillColor: GREEN, textColor: 255, fontStyle: "bold" },
    head: [["Metric", "Value"]],
    body: [
      ["Total Monthly Income", money(monthlyIncome(data))],
      ["Total Monthly Expenses", money(monthlyExpenses(data) + monthlyEMI(data))],
      ["Total Investments", money(totalInvestments(data))],
      ["Total Loans (Liabilities)", money(totalLiabilities(data))],
      ["Net Worth", money(netWorth(data))],
      ["Savings Rate", formatPercent(savingsRate(data))],
      ["Debt-to-Income Ratio", formatPercent(debtToIncome(data))],
      ["Freedom Date", `${fi.fiDate.getFullYear()} | ${fi.yearsRemaining}y remaining`],
    ],
  });

  if (advice) {
    sectionTitle("2. AI Summary Report");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...DARK);
    const headline = doc.splitTextToSize(pdfSafe(advice.summaryReport.headline), CONTENT_WIDTH) as string[];
    headline.forEach((line) => {
      if (!line) return;
      ensureSpace(24);
      doc.text(line, 44, y);
      y += 16;
    });
    y += 4;
    paragraph(advice.executiveSummary);
    y += 10;

    table({
      theme: "grid",
      headStyles: { fillColor: GREEN, textColor: 255, fontStyle: "bold" },
      head: [["Highlight", "Detail"]],
      body: advice.summaryReport.highlights.map((item) => [pdfSafe(item.label), pdfSafe(item.detail)]),
      columnStyles: { 0: { cellWidth: 140 } },
    });

    if (advice.riskWarnings.length) {
      sectionTitle("3. Risks to Watch");
      table({
        theme: "grid",
        headStyles: { fillColor: GOLD, textColor: 255, fontStyle: "bold" },
        head: [["Severity", "Risk", "Detail"]],
        body: advice.riskWarnings.map((warning) => [
          pdfSafe(warning.severity),
          pdfSafe(warning.title),
          pdfSafe(warning.detail),
        ]),
        columnStyles: { 0: { cellWidth: 70 }, 1: { cellWidth: 130 } },
      });
    }
  }

  sectionTitle(advice ? "4. Goals" : "2. Goals Analysis");
  const goalRows = data.goals.map((g) => {
    const a = analyzeGoal(data, g);
    return [
      pdfSafe(g.name),
      money(g.targetAmount),
      new Date(g.targetDate).getFullYear().toString(),
      `${a.probability}%`,
      pdfSafe(a.status),
      money(a.fundingGap),
    ];
  });
  table({
    theme: "grid",
    headStyles: { fillColor: GREEN, textColor: 255, fontStyle: "bold" },
    head: [["Goal", "Target", "By", "Prob.", "Status", "Gap"]],
    body: goalRows.length ? goalRows : [["No goals added", "-", "-", "-", "-", "-"]],
  });

  if (advice) {
    sectionTitle("5. Plan of Action");
    table({
      theme: "grid",
      headStyles: { fillColor: GREEN, textColor: 255, fontStyle: "bold" },
      head: [["#", "Impact", "Category", "Action"]],
      body: advice.planOfAction.map((step) => [
        String(step.priority),
        pdfSafe(step.impact),
        pdfSafe(step.category),
        pdfSafe(step.monthlyAmount ? `${step.action} (${money(step.monthlyAmount)} / month)` : step.action),
      ]),
      columnStyles: { 0: { cellWidth: 28 }, 1: { cellWidth: 55 }, 2: { cellWidth: 90 } },
    });

    advice.planOfAction.forEach((step) => {
      ensureSpace(48);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...DARK);
      doc.text(pdfSafe(`${step.priority}. ${step.action}`), 44, y);
      y += 14;
      paragraph(step.rationale, 54);
      y += 8;
    });
    y += 6;

    sectionTitle("6. Debt and Investment Strategy");
    paragraph(advice.debtStrategy.summary);
    y += 8;
    table({
      theme: "grid",
      headStyles: { fillColor: GOLD, textColor: 255, fontStyle: "bold" },
      head: [["Order", "Loan", "Action", "Reason"]],
      body: advice.debtStrategy.steps.map((step) => [
        String(step.order),
        pdfSafe(step.loan),
        pdfSafe(step.action),
        pdfSafe(step.reason),
      ]),
    });
    paragraph(`Investment strategy (${advice.investmentStrategy.status}): ${advice.investmentStrategy.rationale}`);
    y += 6;
    paragraph(advice.investmentStrategy.resumeTrigger);
    y += 12;
    paragraph(advice.disclaimer);
    y += 16;
  }

  sectionTitle(advice ? "7. Debt Payoff Sequence" : "3. Debt Payoff Sequence");
  const strat = prepaymentStrategy(data);
  table({
    theme: "grid",
    headStyles: { fillColor: GOLD, textColor: 255, fontStyle: "bold" },
    head: [["Priority", "Loan", "Rate", "Outstanding"]],
    body: strat.length
      ? strat.map((loan, i) => [`#${i + 1}`, pdfSafe(loan.name), formatPercent(loan.interestRate), money(loan.outstanding)])
      : [["-", "Debt free", "-", "-"]],
  });

  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(150, 160, 160);
    doc.text("Generated by Financial Freedom Planner - estimates for planning purposes only.", PAGE_MARGIN, doc.internal.pageSize.getHeight() - 24);
    doc.text(`Page ${p} / ${pages}`, PAGE_WIDTH - PAGE_MARGIN, doc.internal.pageSize.getHeight() - 24, { align: "right" });
  }

  const filename = `Financial-Freedom-Report-${pdfSafe(name || "report").replace(/\s+/g, "-") || "report"}.pdf`;
  downloadBlob(doc, filename);
}
