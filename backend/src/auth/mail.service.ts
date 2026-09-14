import { Injectable, Logger } from "@nestjs/common";
import { createTransport, type Transporter } from "nodemailer";

/**
 * Sends transactional mail when SMTP_* is configured. Without SMTP the link is
 * logged instead, so password reset stays usable in development without
 * silently pretending an email went out.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;

  constructor() {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (host && user && pass) {
      const port = Number(process.env.SMTP_PORT ?? 587);
      this.transporter = createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
    } else {
      this.transporter = null;
      this.logger.warn(
        "SMTP not configured — password reset links will be logged, not emailed.",
      );
    }
  }

  /** True when mail is actually delivered rather than logged. */
  get enabled(): boolean {
    return this.transporter !== null;
  }

  async sendPasswordReset(to: string, link: string, expiresMinutes: number) {
    const subject = "Reset your Indonesia Arcadia Gaming League password";
    const text = [
      "We received a request to reset your Indonesia Arcadia Gaming League password.",
      "",
      `Open this link to choose a new password (valid for ${expiresMinutes} minutes):`,
      link,
      "",
      "If you did not request this, you can safely ignore this email.",
    ].join("\n");

    if (!this.transporter) {
      this.logger.log(`[password reset] ${to} -> ${link}`);
      return;
    }

    await this.transporter.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to,
      subject,
      text,
    });
    this.logger.log(`Password reset email sent to ${to}`);
  }
}
