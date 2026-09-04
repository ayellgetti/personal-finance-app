import type { Request, Response } from "express";
import { BaseController } from "../../shared/base/base.controller";
import { dashboardService, type DashboardService } from "./dashboard.service";

export class DashboardController extends BaseController {
  constructor(private readonly service: DashboardService = dashboardService) {
    super();
  }

  async get(req: Request, res: Response) {
    const dashboard = await this.service.get();
    this.sendSuccess(req, res, { dashboard }, "Dashboard retrieved");
  }
}

export const dashboardController = new DashboardController();
