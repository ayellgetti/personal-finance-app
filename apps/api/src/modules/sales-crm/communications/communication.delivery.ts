import nodemailer from "nodemailer";
import { setting } from "../../../config/setting";
import { logger } from "../../../utils/logger.util";

export type OutboundEmail = {
  to: string;
  subject: string;
  text: string;
};

export type OutboundSms = {
  to: string;
  text: string;
};

export interface ChannelDeliverer {
  sendEmail(message: OutboundEmail): Promise<void>;
  sendSms(message: OutboundSms): Promise<void>;
}

type MailConfig = {
  host?: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
  from?: string;
};

type SmsConfig = {
  accountSid?: string;
  authToken?: string;
  from?: string;
  defaultCountryCode: string;
};

function toE164(mobileNo: string, defaultCountryCode: string) {
  const digits = mobileNo.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  return `${defaultCountryCode}${digits.replace(/^0+/, "")}`;
}

function failure(error: unknown): { errorType: string; code?: string } {
  const errorType = error instanceof Error ? error.name : "UnknownError";
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code: unknown }).code;
    return { errorType, code: typeof code === "string" ? code : undefined };
  }
  return { errorType };
}

export class ChannelDelivererClient implements ChannelDeliverer {
  constructor(
    private readonly mail: MailConfig = setting.mail,
    private readonly sms: SmsConfig = setting.sms,
    private readonly production = setting.isProduction,
    private readonly post: typeof fetch = fetch,
  ) {}

  async sendEmail(message: OutboundEmail): Promise<void> {
    if (!this.mail.host || !this.mail.from) {
      if (this.production) {
        logger.error("CRM email skipped: SMTP is not configured");
        throw new Error("Email is not configured");
      }
      logger.info("CRM email logged (SMTP is not configured)", { channel: "email" });
      return;
    }

    try {
      const transporter = nodemailer.createTransport({
        host: this.mail.host,
        port: this.mail.port,
        secure: this.mail.secure,
        auth:
          this.mail.user && this.mail.pass
            ? { user: this.mail.user, pass: this.mail.pass }
            : undefined,
      });
      await transporter.sendMail({
        from: this.mail.from,
        to: message.to,
        subject: message.subject,
        text: message.text,
      });
    } catch (error) {
      logger.error("CRM email delivery failed", failure(error));
      if (this.production) {
        throw new Error("Email delivery failed");
      }
    }
  }

  async sendSms(message: OutboundSms): Promise<void> {
    if (!this.sms.accountSid || !this.sms.authToken || !this.sms.from) {
      if (this.production) {
        throw new Error("SMS is not configured");
      }
      logger.info("CRM SMS logged (Twilio is not configured)", { channel: "sms" });
      return;
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.sms.accountSid}/Messages.json`;
    const authorization = Buffer.from(`${this.sms.accountSid}:${this.sms.authToken}`).toString(
      "base64",
    );

    try {
      const response = await this.post(url, {
        method: "POST",
        headers: {
          Authorization: `Basic ${authorization}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: toE164(message.to, this.sms.defaultCountryCode),
          From: this.sms.from,
          Body: message.text,
        }),
      });
      if (!response.ok) {
        throw new Error(`Twilio responded ${response.status}`);
      }
    } catch (error) {
      logger.error("CRM SMS delivery failed", failure(error));
      if (this.production) {
        throw new Error("SMS delivery failed");
      }
    }
  }
}

export const channelDeliverer = new ChannelDelivererClient();
