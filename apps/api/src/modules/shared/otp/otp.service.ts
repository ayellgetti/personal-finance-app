import { randomInt } from "node:crypto";
import { setting } from "../../../config/setting.js";
import { HttpError } from "../../../lib/http-error.js";
import { otpModel, type OtpModel } from "../../../models/index.js";
import { userService, type UserService } from "../user/user.service.js";
import { OTP_TYPE, type GenerateOtpBody, type ResendOtpBody, type VerifyOtpBody } from "./otp.request.js";

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 30 * 1000;
const OTP_MAX_TRIES = 5;

type IssuedOtp = {
  mobileNo: string;
  type: string;
  expiresInSeconds: number;
  retryAfterSeconds: number;
  otp?: number;
};

type VerifiedOtp = {
  verified: true;
  mobileNo: string;
  type: string;
};

export class OtpService {
  constructor(
    private readonly model: OtpModel = otpModel,
    private readonly users: UserService = userService,
  ) {}

  async generate(input: GenerateOtpBody): Promise<IssuedOtp> {
    return this.issue(input.mobileNo, input.type);
  }

  async resend(input: ResendOtpBody): Promise<IssuedOtp> {
    const existing = await this.latest(input.mobileNo, input.type);
    if (!existing) {
      throw new HttpError(404, "OTP not found. Generate an OTP first");
    }

    const elapsed = Date.now() - existing.createdAt.getTime();
    if (elapsed < OTP_RESEND_COOLDOWN_MS) {
      throw new HttpError(429, "Please wait before requesting another OTP", {
        retryAfterSeconds: Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsed) / 1000),
      });
    }

    return this.issue(input.mobileNo, input.type);
  }

  async verify(input: VerifyOtpBody, consume = false): Promise<VerifiedOtp> {
    const otp = await this.latest(input.mobileNo, input.type);
    if (!otp || otp.isActive !== 1) {
      throw new HttpError(400, "OTP is invalid or has expired");
    }

    if (Date.now() - otp.createdAt.getTime() > OTP_TTL_MS) {
      await this.deactivate(otp.id);
      throw new HttpError(400, "OTP is invalid or has expired");
    }

    if (otp.try >= OTP_MAX_TRIES) {
      await this.deactivate(otp.id);
      throw new HttpError(400, "OTP attempts exceeded. Generate a new OTP");
    }

    if (otp.no !== input.no) {
      await this.model.update({ id: otp.id }, { try: otp.try + 1 });
      throw new HttpError(400, "Invalid OTP");
    }

    if (consume) {
      await this.deactivate(otp.id);
    }

    return {
      verified: true,
      mobileNo: otp.mobileNo,
      type: otp.type,
    };
  }

  private async issue(mobileNo: string, type: string): Promise<IssuedOtp> {
    if (type === OTP_TYPE.REGISTER && (await this.users.findByMobileNo(mobileNo))) {
      throw new HttpError(409, "Duplicate mobileNo is not allowed");
    }

    await this.model.updateMany({ mobileNo, type, isActive: 1 }, { isActive: 0 });

    const no = randomInt(100000, 1000000);
    await this.model.create({
      mobileNo,
      type,
      no,
      try: 0,
      isActive: 1,
    });

    const payload: IssuedOtp = {
      mobileNo,
      type,
      expiresInSeconds: OTP_TTL_MS / 1000,
      retryAfterSeconds: OTP_RESEND_COOLDOWN_MS / 1000,
    };

    if (!setting.isProduction) {
      payload.otp = no;
    }

    return payload;
  }

  private latest(mobileNo: string, type: string) {
    return this.model.findOne(
      { mobileNo, type },
      { orderBy: { createdAt: "desc" }, includeHidden: true },
    );
  }

  private deactivate(id: string) {
    return this.model.update({ id }, { isActive: 0 });
  }
}

export const otpService = new OtpService();
