import "server-only";

import { Resend } from "resend";

let resend: Resend | null = null;

function getResend(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY is not set");
    resend = new Resend(apiKey);
  }
  return resend;
}

export type ScrapeNotificationEmailInput = {
  to: string;
  projectName: string;
  type: "leads" | "searchbox" | "mentions";
  count: number;
  projectUrl: string;
};

export async function sendScrapeNotificationEmail(input: ScrapeNotificationEmailInput): Promise<void> {
  const from = process.env.RESEND_FROM_EMAIL ?? "noreply@prowlit.com";
  const { to, projectName, type, count, projectUrl } = input;

  const labels: Record<typeof type, { subject: string; noun: string; path: string }> = {
    leads:     { subject: "New opportunities found",    noun: count === 1 ? "opportunity" : "opportunities", path: "/dashboard" },
    searchbox: { subject: "New Google mentions found",  noun: count === 1 ? "result" : "results",            path: "/searchbox" },
    mentions:  { subject: "New Reddit mentions found",  noun: count === 1 ? "mention" : "mentions",          path: "/mentions" },
  };

  const { subject, noun, path } = labels[type];
  const url = `${projectUrl}${path}`;

  const html = `
<div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#1A1A1B">
  <p style="font-size:15px;margin:0 0 8px">
    <strong>${projectName}</strong> has <strong>${count} new ${noun}</strong>.
  </p>
  <a href="${url}" style="display:inline-block;margin-top:12px;padding:10px 20px;background:#FF4500;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">
    View ${noun}
  </a>
  <p style="margin-top:24px;font-size:11px;color:#B0B0B5">
    You're receiving this because your project is configured to send email notifications.
  </p>
</div>`;

  const client = getResend();
  const { error } = await client.emails.send({
    from,
    to,
    subject: `[Prowlit] ${projectName} — ${subject}`,
    html,
  });

  if (error) throw new Error(`Resend error: ${error.message}`);
}
