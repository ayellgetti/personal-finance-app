import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Express } from "express";
import express from "express";
import { advisorRouter } from "../modules/personal-finance/advisor/advisor.route";
import { budgetRouter } from "../modules/personal-finance/budget/budget.route";
import { calculatorRouter } from "../modules/personal-finance/calculator/calculator.route";
import { financialProfileRouter } from "../modules/personal-finance/financial-profile/financial-profile.route";
import { goalRouter } from "../modules/personal-finance/goal/goal.route";
import { insuranceRouter } from "../modules/personal-finance/insurance/insurance.route";
import { investmentRouter } from "../modules/personal-finance/investment/investment.route";
import { loanRouter } from "../modules/personal-finance/loan/loan.route";
import { plannerRouter } from "../modules/personal-finance/planner/planner.route";
import { setupRouter } from "../modules/personal-finance/setup/setup.route";
import { statementRouter } from "../modules/personal-finance/statement/statement.route";
import { taxRouter } from "../modules/personal-finance/tax/tax.route";
import { crmRouter } from "../modules/sales-crm/crm.route";
import { authRouter } from "../modules/shared/auth/auth.route";
import { deviceRouter } from "../modules/shared/device/device.route";
import { otpRouter } from "../modules/shared/otp/otp.route";
import { userRouter } from "../modules/shared/user/user.route";
import { Api } from "../utils/api.util";
import { swagger } from "./swagger";

// Resolves to apps/api/public from both src (tsx) and dist (compiled) layouts.
const publicDir = fileURLToPath(new URL("../../public", import.meta.url));

export class Route {
  mount(app: Express): void {
    swagger.mount(app);

    app.use(express.static(publicDir));

    app.get("/planner", (_req, res) => {
      res.sendFile(path.join(publicDir, "planner.html"));
    });

    const health = (req: express.Request, res: express.Response) => {
      Api.success(req, res, { ok: true }, "API is healthy");
    };
    app.get("/health", health);
    app.get("/api/health", health);

    app.get("/api/hello", (req, res) => {
      Api.success(req, res, { message: "Hello from the API" });
    });

    app.use("/api/auth", authRouter);
    app.use("/api/otp", otpRouter);
    app.use("/api/device", deviceRouter);
    app.use("/api/users", userRouter);
    app.use("/api/budgets", budgetRouter);
    app.use("/api/calculators", calculatorRouter);
    app.use("/api/loans", loanRouter);
    app.use("/api/investments", investmentRouter);
    app.use("/api/insurances", insuranceRouter);
    app.use("/api/setup", setupRouter);
    app.use("/api/goals", goalRouter);
    app.use("/api/financial-profile", financialProfileRouter);
    app.use("/api/planner", plannerRouter);
    app.use("/api/advisor", advisorRouter);
    app.use("/api/statements", statementRouter);
    app.use("/api/tax", taxRouter);
    app.use("/api/crm", crmRouter);
  }
}

export const route = new Route();
