import type { Request, Response } from "express";
import { BaseController } from "../../../controller/base.controller.js";
import { HttpError } from "../../../lib/http-error.js";
import type { ChangePasswordBody, UpdateMeBody } from "./user.request.js";
import { userService } from "./user.service.js";
import type { UserService } from "./user.service.js";

function currentUserId(req: Request): string {
  if (!req.user) {
    throw new HttpError(401, "Unauthenticated");
  }
  return req.user.id;
}

export class UserController extends BaseController {
  constructor(private readonly service: UserService = userService) {
    super();
  }

  async me(req: Request, res: Response) {
    const user = await this.service.getById(currentUserId(req));
    this.sendSuccess(req, res, { user }, "Current user retrieved");
  }

  async getById(req: Request, res: Response) {
    const id = req.params.id;
    if (typeof id !== "string") {
      throw new HttpError(400, "User id is required");
    }
    const user = await this.service.getById(id);
    this.sendSuccess(req, res, { user }, "User retrieved");
  }

  async updateMe(req: Request, res: Response) {
    const body = req.body as UpdateMeBody;
    const user = await this.service.updateMe(currentUserId(req), body);
    this.sendSuccess(req, res, { user }, "User updated");
  }

  async changePassword(req: Request, res: Response) {
    const body = req.body as ChangePasswordBody;
    const user = await this.service.changePassword(currentUserId(req), body);
    this.sendSuccess(req, res, { user }, "Password changed");
  }
}

export const userController = new UserController();
