import type { Request, Response } from "express";
import { BaseController } from "../../shared/base/base.controller";
import { currentUserId, requireParamId } from "../crm.http";
import type { CreateRoleBody, UpdateRoleBody } from "./role.request";
import { roleService, type RoleService } from "./role.service";

export class RoleController extends BaseController {
  constructor(private readonly service: RoleService = roleService) {
    super();
  }

  async listRoles(req: Request, res: Response) {
    const roles = await this.service.listRoles();
    this.sendSuccess(req, res, { roles }, "Roles retrieved");
  }

  async listPermissions(req: Request, res: Response) {
    const permissions = await this.service.listPermissions();
    this.sendSuccess(req, res, { permissions }, "Permissions retrieved");
  }

  async createRole(req: Request, res: Response) {
    const role = await this.service.createRole(currentUserId(req), req.body as CreateRoleBody);
    this.sendSuccess(req, res, { role }, "Role created", 201);
  }

  async updateRole(req: Request, res: Response) {
    const role = await this.service.updateRole(
      currentUserId(req),
      requireParamId(req, "Role"),
      req.body as UpdateRoleBody,
    );
    this.sendSuccess(req, res, { role }, "Role updated");
  }
}

export const roleController = new RoleController();
