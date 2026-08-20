import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FinanceData, Scenario } from "@/types/finance";
import {
  formatCurrency, formatPercent, monthlyIncome, monthlyExpenses, monthlyEMI,
  totalInvestments, totalLiabilities, netWorth, savingsRate, debtToIncome,
  healthScore, financialFreedom, analyzeGoal, generateRecommendations,
  prepaymentStrategy, scenarioSummary,
} from "./calculations";

const GREEN: [number, number, number] = [16, 122, 87];
const DARK: [number, number, number] = [22, 38, 44];
const GOLD: [number, number, number] = [217, 152, 30];

export function generateReport(data: FinanceData) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const cur = data.profile.currency;
  const pw = doc.internal.pageSize.getWidth();
  let y = 0;

  const c = (n: number) => formatCurrency(n, cur, true);
  const fi = financialFreedom(data);
  const hs = healthScore(data);

  // ---- Header band ----
  doc.setFillColor(...DARK);
  doc.rect(0, 0, pw, 110, "F");
  doc.setFillColor(...GREEN);
  doc.rect(0, 106, pw, 4, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("Financial Freedom Report", 40, 50);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(200, 220, 210);
  doc.text(`${data.profile.name}  ·  Age ${data.profile.age}  ·  ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`, 40, 72);
  doc.setFontSize(10);
  doc.text(`Financial Health Score: ${hs.total}/100`, 40, 90);

  y = 140;

  const sectionTitle = (title: string) => {
    if (y > 720) { doc.addPage(); y = 50; }
    doc.setTextColor(...GREEN);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(title, 40, y);
    y += 8;
    doc.setDrawColor(220, 230, 225);
    doc.line(40, y, pw - 40, y);
    y += 14;
  };

  // ---- Current Position ----
  sectionTitle("1. Current Position");
  autoTable(doc, {
    startY: y,
    theme: "grid",
    headStyles: { fillColor: GREEN, textColor: 255, fontStyle: "bold" },
    bodyStyles: { textColor: DARK },
    head: [["Metric", "Value"]],
    body: [
      ["Total Monthly Income", c(monthlyIncome(data))],
      ["Total Monthly Expenses", c(monthlyExpenses(data) + monthlyEMI(data))],
      ["Total Investments", c(totalInvestments(data))],
      ["Total Loans (Liabilities)", c(totalLiabilities(data))],
      ["Net Worth", c(netWorth(data))],
      ["Savings Rate", formatPercent(savingsRate(data))],
      ["Debt-to-Income Ratio", formatPercent(debtToIncome(data))],
    ],
    margin: { left: 40, right: 40 },
  });
  y = (doc as any).lastAutoTable.finalY + 24;

  // ---- Goals analysis ----
  sectionTitle("2. Goals Analysis");
  const goalRows = data.goals.map((g) => {
    const a = analyzeGoal(data, g);
    return [g.name, c(g.targetAmount), new Date(g.targetDate).getFullYear().toString(), `${a.probability}%`, a.status, c(a.fundingGap)];
  });
  autoTable(doc, {
    startY: y,
    theme: "grid",
    headStyles: { fillColor: GREEN, textColor: 255, fontStyle: "bold" },
    head: [["Goal", "Target", "By", "Prob.", "Status", "Gap"]],
    body: goalRows.length ? goalRows : [["No goals added", "-", "-", "-", "-", "-"]],
    margin: { left: 40, right: 40 },
    styles: { fontSize: 9 },
  });
  y = (doc as any).lastAutoTable.finalY + 24;

  // ---- Recommendations ----
  sectionTitle("3. Top Recommendations to Reach Freedom Faster");
  const recs = generateRecommendations(data).slice(0, 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  recs.forEach((r, i) => {
    if (y > 760) { doc.addPage(); y = 50; }
    doc.setFont("helvetica", "bold");
    doc.text(`${i + 1}. ${r.title}  [${r.impact}]`, 44, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 90, 90);
    const lines = doc.splitTextToSize(r.detail, pw - 100);
    doc.text(lines, 54, y);
    y += lines.length * 12 + 8;
    doc.setTextColor(...DARK);
  });
  y += 6;

  // ---- Debt payoff sequence ----
  sectionTitle("4. Debt Payoff Sequence");
  const strat = prepaymentStrategy(data);
  autoTable(doc, {
    startY: y,
    theme: "grid",
    headStyles: { fillColor: GOLD, textColor: 255, fontStyle: "bold" },
    head: [["Priority", "Loan", "Rate", "Outstanding"]],
    body: strat.length ? strat.map((l, i) => [`#${i + 1}`, l.name, formatPercent(l.interestRate), c(l.outstanding)]) : [["-", "Debt free", "-", "-"]],
    margin: { left: 40, right: 40 },
    styles: { fontSize: 9 },
  });
  y = (doc as any).lastAutoTable.finalY + 24;

  // ---- Wealth projection scenarios ----
  sectionTitle("5. Wealth Projection (Scenarios)");
  const sum = scenarioSummary(data);
  autoTable(doc, {
    startY: y,
    theme: "grid",
    headStyles: { fillColor: GREEN, textColor: 255, fontStyle: "bold" },
    head: [["Scenario", "5 yrs", "10 yrs", "20 yrs", "Retirement Corpus"]],
    body: sum.map((s: any) => [s.scenario, c(s.y5), c(s.y10), c(s.y20), c(s.retirementCorpus)]),
    margin: { left: 40, right: 40 },
    styles: { fontSize: 9 },
  });
  y = (doc as any).lastAutoTable.finalY + 24;

  // ---- Final output ----
  if (y > 660) { doc.addPage(); y = 50; }
  sectionTitle("6. Final Output");
  doc.setFillColor(245, 250, 247);
  doc.roundedRect(40, y, pw - 80, 110, 8, 8, "F");
  doc.setTextColor(...DARK);
  doc.setFontSize(10);
  const finals: [string, string][] = [
    ["Financial Freedom Date", `${fi.fiDate.getFullYear()} (${fi.yearsRemaining} years remaining)`],
    ["Estimated Retirement Age", `${data.profile.age + fi.yearsRemaining}`],
    ["FI Number Required", c(fi.fiNumber)],
    ["Projected Corpus at Retirement", c(fi.projectedCorpus)],
    ["Required Monthly Investment", c(fi.requiredMonthlyInvestment)],
    ["Probability Score", `${fi.probabilityScore}%`],
  ];
  let fy = y + 22;
  finals.forEach(([k, v]) => {
    doc.setFont("helvetica", "normal");
    doc.text(k, 54, fy);
    doc.setFont("helvetica", "bold");
    doc.text(v, pw - 54, fy, { align: "right" });
    fy += 16;
  });

  // ---- Footer on all pages ----
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(150, 160, 160);
    doc.text("Generated by Financial Freedom Planner · Estimates for planning purposes only.", 40, doc.internal.pageSize.getHeight() - 24);
    doc.text(`Page ${p} / ${pages}`, pw - 40, doc.internal.pageSize.getHeight() - 24, { align: "right" });
  }

  doc.save(`Financial-Freedom-Report-${data.profile.name.replace(/\s+/g, "-")}.pdf`);
}
