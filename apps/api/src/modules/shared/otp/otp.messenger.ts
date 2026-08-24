import nodemailer from "nodemailer";
import { setting } from "../../../config/setting";
import { HttpError } from "../../../utils/http-error.util";
import { logger } from "../../../utils/logger.util";

export type OtpDelivery = {
  email: boolean;
  sms: boolean;
};

export type OtpMessage = {
  mobileNo: string;
  email?: string;
  code: number;
  type: string;
  requireEmail: boolean;
};

export interface OtpMessenger {
  deliver(message: OtpMessage): Promise<OtpDelivery>;
}

function purpose(type: string) {
  return type === "register" ? "sign up" : "reset your password";
}

function emailBody(message: OtpMessage) {
  return [
    `Your Freedom Planner verification code is ${message.code}.`,
    `Use it to ${purpose(message.type)}. It expires in 5 minutes.`,
    "If you did not request this, you can ignore this email.",
  ].join("\n");
}

function smsBody(message: OtpMessage) {
  return `Freedom Planner OTP ${message.code} to ${purpose(message.type)}. Valid 5 min.`;
}

function transportCode(error: unknown): string | undefined {
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code: unknown }).code;
    return typeof code === "string" ? code : undefined;
  }
  return undefined;
}

function toE164(mobileNo: string, defaultCountryCode: string) {
  const digits = mobileNo.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  return `${defaultCountryCode}${digits.replace(/^0+/, "")}`;
}

export class ChannelOtpMessenger implements OtpMessenger {
  constructor(
    private readonly mail = setting.mail,
    private readonly sms = setting.sms,
    private readonly production = setting.isProduction,
    private readonly post: typeof fetch = fetch,
  ) {}

  async deliver(message: OtpMessage): Promise<OtpDelivery> {
    if (message.requireEmail && !message.email) {
      throw new HttpError(400, "Email is required to send this OTP");
    }

    const [sms] = await Promise.all([
      // this.sendEmail(message),
      this.sendSms(message),
    ]);

    // if (message.requireEmail && !email) {
    //   throw new HttpError(502, "Could not send the OTP by email");
    // }
    if (!sms) {
      throw new HttpError(502, "Could not send the OTP by SMS");
    }

    return { email: false, sms };
  }

  // private async sendEmail(message: OtpMessage): Promise<boolean> {
  //   if (!message.email) return false;

  //   if (!this.mail.host || !this.mail.from) {
  //     if (this.production) {
  //       logger.error("OTP email skipped: SMTP is not configured", {
  //         hasHost: Boolean(this.mail.host),
  //         hasFrom: Boolean(this.mail.from),
  //         type: message.type,
  //       });
  //       return false;
  //     }
  //     logger.info("OTP email logged (SMTP is not configured)", {
  //       email: message.email,
  //       type: message.type,
  //     });
  //     return true;
  //   }

  //   try {
  //     const transporter = nodemailer.createTransport({
  //       host: this.mail.host,
  //       port: this.mail.port,
  //       secure: this.mail.secure,
  //       auth:
  //         this.mail.user && this.mail.pass
  //           ? { user: this.mail.user, pass: this.mail.pass }
  //           : undefined,
  //     });
  //     await transporter.sendMail({
  //       from: this.mail.from,
  //       to: message.email,
  //       subject: `Your Freedom Planner code is ${message.code}`,
  //       text: emailBody(message),
  //     });
  //     return true;
  //   } catch (error) {
  //     logger.error("OTP email delivery failed", {
  //       errorType: error instanceof Error ? error.name : "UnknownError",
  //       code: transportCode(error),
  //       message: error instanceof Error ? error.message.slice(0, 240) : undefined,
  //       type: message.type,
  //     });
  //     if (this.production) return false;
  //     return true;
  //   }
  // }

  private async sendSms(message: OtpMessage): Promise<boolean> {
    if (!this.sms.accountSid || !this.sms.authToken || !this.sms.from) {
      if (this.production) return false;
      logger.info("OTP SMS logged (Twilio is not configured)", {
        mobileNo: message.mobileNo,
        type: message.type,
      });
      return true;
    }

    const to = toE164(message.mobileNo, this.sms.defaultCountryCode);
    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.sms.accountSid}/Messages.json`;
    const authorization = Buffer.from(
      `${this.sms.accountSid}:${this.sms.authToken}`,
    ).toString("base64");

    try {
      const response = await this.post(url, {
        method: "POST",
        headers: {
          Authorization: `Basic ${authorization}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: to,
          From: this.sms.from,
          Body: smsBody(message),
        }),
      });
      if (!response.ok) {
        throw new Error(`Twilio responded ${response.status}`);
      }
      return true;
    } catch (error) {
      logger.error("OTP SMS delivery failed", {
        errorType: error instanceof Error ? error.name : "UnknownError",
        type: message.type,
      });
      if (this.production) return false;
      return true;
    }
  }
}

export const channelOtpMessenger = new ChannelOtpMessenger();
