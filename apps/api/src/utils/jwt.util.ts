import jwt, { type SignOptions } from "jsonwebtoken";
import { setting } from "../config/setting";
import { HttpError } from "./http-error.util";

export type AuthUser = {
  id: string;
  email: string;
};

export type RefreshTokenPayload = AuthUser & {
  jti: string;
};

export class Jwt {
  signAccessToken(user: AuthUser): string {
    return jwt.sign(
      { sub: user.id, email: user.email, typ: "access" },
      setting.jwt.accessSecret,
      { expiresIn: setting.jwt.accessTtl as SignOptions["expiresIn"] },
    );
  }

  signRefreshToken(user: AuthUser, jti: string): string {
    return jwt.sign(
      { sub: user.id, email: user.email, typ: "refresh" },
      setting.jwt.refreshSecret,
      { jwtid: jti, expiresIn: setting.jwt.refreshTtlSeconds },
    );
  }

  verifyAccessToken(token: string): AuthUser {
    const payload = jwt.verify(token, setting.jwt.accessSecret);
    if (
      typeof payload === "string" ||
      payload.typ !== "access" ||
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string"
    ) {
      throw new HttpError(401, "Invalid access token");
    }
    return { id: payload.sub, email: payload.email };
  }

  verifyRefreshToken(token: string): RefreshTokenPayload {
    const payload = jwt.verify(token, setting.jwt.refreshSecret);
    if (
      typeof payload === "string" ||
      payload.typ !== "refresh" ||
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.jti !== "string"
    ) {
      throw new HttpError(401, "Invalid refresh token");
    }
    return { id: payload.sub, email: payload.email, jti: payload.jti };
  }
}

export const jwtUtil = new Jwt();
