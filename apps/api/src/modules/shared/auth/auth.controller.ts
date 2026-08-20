import type { Request, Response } from "express";
import { BaseController } from "../../../controller/base.controller.js";
import type {
  ForgotPasswordBody,
  LoginBody,
  LogoutBody,
  RefreshBody,
  RegisterBody,
} from "./auth.request.js";
import { authService } from "./auth.service.js";
import type { AuthService } from "./auth.service.js";

export class AuthController extends BaseController {
  constructor(private readonly service: AuthService = authService) {
    super();
  }

  async register(req: Request, res: Response) {
    const body = req.body as RegisterBody;
    const result = await this.service.register(body);
    this.sendSuccess(req, res, result, "Registration successful", 201);
  }

  async login(req: Request, res: Response) {
    const body = req.body as LoginBody;
    const result = await this.service.login(body);
    this.sendSuccess(req, res, result, "Login successful");
  }

  async refresh(req: Request, res: Response) {
    const body = req.body as RefreshBody;
    const result = await this.service.refresh(body);
    this.sendSuccess(req, res, result, "Tokens refreshed");
  }

  async logout(req: Request, res: Response) {
    const body = req.body as LogoutBody;
    await this.service.logout(body);
    this.sendSuccess(req, res, null, "Logout successful");
  }

  async forgotPassword(req: Request, res: Response) {
    const body = req.body as ForgotPasswordBody;
    await this.service.forgotPassword(body);
    this.sendSuccess(req, res, null, "Password reset successful");
  }
}

export const authController = new AuthController();
