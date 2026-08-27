import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { setting } from "../../../config/setting";
import { HttpError } from "../../../utils/http-error.util";
import type { PublicUser } from "../../../models/index";
import { jwtUtil, type AuthUser, type Jwt } from "../../../utils/jwt.util";
import { OTP_TYPE } from "../otp/otp.request";
import { otpService, type OtpService } from "../otp/otp.service";
import { userService } from "../user/user.service";
import type { UserService } from "../user/user.service";
import type {
  ForgotPasswordBody,
  LoginBody,
  LogoutBody,
  RefreshBody,
  RegisterBody,
} from "./auth.request";
import {
  hashRefreshToken,
  refreshSessionModel,
  type RefreshSessionModel,
} from "./auth.store";

type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

type AuthResult = TokenPair & {
  user: PublicUser;
};

export class AuthService {
  constructor(
    private readonly users: UserService = userService,
    private readonly sessions: RefreshSessionModel = refreshSessionModel,
    private readonly tokens: Jwt = jwtUtil,
    private readonly otps: OtpService = otpService,
  ) {}

  async register(input: RegisterBody): Promise<AuthResult> {
    if (await this.users.findByEmail(input.email)) {
      throw new HttpError(409, "Duplicate email is not allowed");
    }
    if (await this.users.findByMobileNo(input.mobileNo)) {
      throw new HttpError(409, "Duplicate mobileNo is not allowed");
    }

    await this.otps.verify({
      mobileNo: input.mobileNo,
      type: OTP_TYPE.REGISTER,
      no: input.no,
    }, true);

    const password = await bcrypt.hash(input.password, setting.bcryptRounds);
    const user = await this.users.create({
      firstName: input.firstName,
      lastName: input.lastName,
      dob: new Date(input.dob),
      gender: input.gender,
      countryCode: input.countryCode,
      mobileNo: input.mobileNo,
      email: input.email,
      password,
    });

    return {
      ...(await this.issueTokenPair(user)),
      user,
    };
  }

  async login(input: LoginBody): Promise<AuthResult> {
    const user = await this.users.findByEmail(input.email);
    if (!user || !(await bcrypt.compare(input.password, user.password))) {
      throw new HttpError(401, "Invalid email or password");
    }

    return {
      ...(await this.issueTokenPair(user)),
      user: this.users.withoutHidden(user),
    };
  }

  async refresh(input: RefreshBody): Promise<AuthResult> {
    return this.rotateRefreshToken(input.refreshToken);
  }

  async logout(input: LogoutBody): Promise<void> {
    try {
      const payload = this.tokens.verifyRefreshToken(input.refreshToken);
      await this.sessions.delete(payload.jti);
    } catch {
      // Already invalid or expired — treat logout as successful.
    }
  }

  async forgotPassword(input: ForgotPasswordBody): Promise<void> {
    await this.otps.verify({
      mobileNo: input.mobileNo,
      type: OTP_TYPE.FORGOT_PASSWORD,
      no: input.no,
    }, true);

    const user = await this.users.findByMobileNo(input.mobileNo);
    if (!user) {
      throw new HttpError(400, "OTP is invalid or has expired");
    }

    await this.users.resetPassword(user, input.password);
  }

  private async issueTokenPair(user: AuthUser): Promise<TokenPair> {
    const jti = randomUUID();
    const refreshToken = this.tokens.signRefreshToken(user, jti);

    await this.sessions.save({
      jti,
      userId: user.id,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: new Date(Date.now() + setting.jwt.refreshTtlSeconds * 1000),
    });

    return {
      accessToken: this.tokens.signAccessToken(user),
      refreshToken,
    };
  }

  private async rotateRefreshToken(refreshToken: string): Promise<AuthResult> {
    let payload;
    try {
      payload = this.tokens.verifyRefreshToken(refreshToken);
    } catch {
      throw new HttpError(401, "Invalid or expired refresh token");
    }

    const session = await this.sessions.find(payload.jti);
    if (!session || session.userId !== payload.id || session.expiresAt.getTime() <= Date.now()) {
      await this.sessions.delete(payload.jti);
      throw new HttpError(401, "Invalid or expired refresh token");
    }

    if (session.tokenHash !== hashRefreshToken(refreshToken)) {
      await this.sessions.deleteAllForUser(payload.id);
      throw new HttpError(401, "Refresh token reuse detected");
    }

    await this.sessions.delete(payload.jti);
    const user = await this.users.getById(payload.id);

    return {
      ...(await this.issueTokenPair({ id: user.id, email: user.email })),
      user,
    };
  }
}

export const authService = new AuthService();
