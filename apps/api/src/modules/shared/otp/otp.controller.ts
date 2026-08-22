import type { Request, Response } from "express";
import { BaseController } from "../base/base.controller";
import type { GenerateOtpBody, ResendOtpBody, VerifyOtpBody } from "./otp.request";
import { otpService } from "./otp.service";
import type { OtpService } from "./otp.service";

export class OtpController extends BaseController {
  constructor(private readonly service: OtpService = otpService) {
    super();
  }

  async generate(req: Request, res: Response) {
    const body = req.body as GenerateOtpBody;
    const result = await this.service.generate(body);
    this.sendSuccess(req, res, result, "OTP sent");
  }

  async resend(req: Request, res: Response) {
    const body = req.body as ResendOtpBody;
    const result = await this.service.resend(body);
    this.sendSuccess(req, res, result, "OTP resent");
  }

  async verify(req: Request, res: Response) {
    const body = req.body as VerifyOtpBody;
    const result = await this.service.verify(body);
    this.sendSuccess(req, res, result, "OTP verified");
  }
}

export const otpController = new OtpController();
