import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Express } from "express";
import express from "express";
import { advisorRouter } from "../modules/personal-finance/advisor/advisor.route.js";
import { budgetRouter } from "../modules/personal-finance/budget/budget.route.js";
import { financialProfileRouter } from "../modules/personal-finance/financial-profile/financial-profile.route.js";
import { goalRouter } from "../modules/personal-finance/goal/goal.route.js";
import { insuranceRouter } from "../modules/personal-finance/insurance/insurance.route.js";
import { investmentRouter } from "../modules/personal-finance/investment/investment.route.js";
import { loanRouter } from "../modules/personal-finance/loan/loan.route.js";
import { plannerRouter } from "../modules/personal-finance/planner/planner.route.js";
import { setupRouter } from "../modules/personal-finance/setup/setup.route.js";
import { authRouter } from "../modules/shared/auth/auth.route.js";
import { deviceRouter } from "../modules/shared/device/device.route.js";
import { otpRouter } from "../modules/shared/otp/otp.route.js";
import { userRouter } from "../modules/shared/user/user.route.js";
import { Api } from "../utils/api.util.js";
import { swagger } from "./swagger.js";

// Resolves to apps/api/public from both src (tsx) and dist (compiled) layouts.
const publicDir = fileURLToPath(new URL("../../public", import.meta.url));

export class Route {
  mount(app: Express): void {
    swagger.mount(app);

    app.use(express.static(publicDir));

    app.get("/planner", (_req, res) => {
      res.sendFile(path.join(publicDir, "planner.html"));
    });

    app.get("/health", (req, res) => {
      Api.success(req, res, { ok: true }, "API is healthy");
    });

    app.get("/api/hello", (req, res) => {
      Api.success(req, res, { message: "Hello from the API" });
    });

    app.use("/api/auth", authRouter);
    app.use("/api/otp", otpRouter);
    app.use("/api/device", deviceRouter);
    app.use("/api/users", userRouter);
    app.use("/api/budgets", budgetRouter);
    app.use("/api/loans", loanRouter);
    app.use("/api/investments", investmentRouter);
    app.use("/api/insurances", insuranceRouter);
    app.use("/api/setup", setupRouter);
    app.use("/api/goals", goalRouter);
    app.use("/api/financial-profile", financialProfileRouter);
    app.use("/api/planner", plannerRouter);
    app.use("/api/advisor", advisorRouter);
  }
}

export const route = new Route();
