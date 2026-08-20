import type { Request, Response } from "express";
import { BaseController } from "../../../controller/base.controller.js";
import { HttpError } from "../../../lib/http-error.js";
import type { AddDeviceBody, RemoveDeviceBody } from "./device.request.js";
import { deviceService } from "./device.service.js";
import type { DeviceService } from "./device.service.js";

function currentUserId(req: Request): string {
  if (!req.user) {
    throw new HttpError(401, "Unauthenticated");
  }
  return req.user.id;
}

export class DeviceController extends BaseController {
  constructor(private readonly service: DeviceService = deviceService) {
    super();
  }

  async add(req: Request, res: Response) {
    const body = req.body as AddDeviceBody;
    const device = await this.service.add(currentUserId(req), body);
    this.sendSuccess(req, res, { device }, "Device added");
  }

  async remove(req: Request, res: Response) {
    const body = req.body as RemoveDeviceBody;
    const result = await this.service.remove(currentUserId(req), body);
    this.sendSuccess(req, res, result, "Device removed");
  }
}

export const deviceController = new DeviceController();
