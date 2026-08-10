import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { EnvConfigService } from '../env/env-config.service';

@Injectable()
export class ResendService {
  private readonly logger = new Logger(ResendService.name);
  private readonly resend: Resend | null;
  readonly from: string;

  constructor(private readonly envConfig: EnvConfigService) {
    const apiKey = envConfig.resendApiKey;
    this.from = envConfig.resendFrom;
    this.resend = apiKey ? new Resend(apiKey) : null;
    if (!this.resend) {
      this.logger.warn(
        'RESEND_API_KEY chưa được cấu hình. Email thông báo sự kiện sẽ được bỏ qua.',
      );
    }
  }

  get enabled(): boolean {
    return this.resend !== null;
  }

  async sendEmail(params: {
    to: string;
    subject: string;
    html: string;
  }): Promise<string | null> {
    if (!this.resend) {
      this.logger.debug(
        `Bỏ qua email (chưa cấu hình Resend): ${params.to} - ${params.subject}`,
      );
      return null;
    }

    const { data, error } = await this.resend.emails.send({
      from: this.from,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    if (error) {
      this.logger.error(
        `Resend send failed for ${params.to}: ${error.message}`,
      );
      throw new Error(error.message ?? 'Resend send failed');
    }

    return data?.id ?? null;
  }
}
