import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
export const resend = resendApiKey ? new Resend(resendApiKey) : null;

export const DEFAULT_FROM_EMAIL =
  process.env.EMAIL_FROM || "Expense Tracker <onboarding@resend.dev>";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
  mocked?: boolean;
}> {
  if (!to) {
    return { success: false, error: "Recipient email address is required" };
  }

  if (!resend) {
    console.warn(
      `[Email Service] RESEND_API_KEY is not set in environment. Mocking email delivery to ${to} with subject "${subject}".`
    );
    return {
      success: true,
      mocked: true,
      messageId: `mock-${Date.now()}`,
    };
  }

  try {
    const result = await resend.emails.send({
      from: DEFAULT_FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (result.error) {
      console.error("[Email Service] Resend error:", result.error);
      return { success: false, error: result.error.message };
    }

    return {
      success: true,
      messageId: result.data?.id,
      mocked: false,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to send email";
    console.error("[Email Service] Exception:", msg);
    return { success: false, error: msg };
  }
}

