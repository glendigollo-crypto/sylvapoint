// ---------------------------------------------------------------------------
// Resend Email Client — SylvaPoint GTM Audit Tool
// ---------------------------------------------------------------------------
// Sends transactional emails, audit report summaries, and schedules
// nurture sequences via the Resend API.
// ---------------------------------------------------------------------------

import { Resend } from 'resend';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { DEFAULT_TENANT_ID } from '@/lib/tenant';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  scheduledAt?: Date;
}

export interface SendEmailResult {
  id: string;
}

export interface SendAuditReportParams {
  email: string;
  auditId: string;
  score: number;
  grade: string;
  topGaps: AuditGapSummary[];
}

export interface ScheduleNurtureParams {
  leadId: string;
  email: string;
  auditId: string;
}

interface AuditGapSummary {
  dimension_key: string;
  label: string;
  score: number;
  grade: string;
  quick_win: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FROM_ADDRESS = 'SylvaPoint <audit@sylvapoint.com>';

/** Nurture sequence emails: sent at day 1, 3, 5, 7, 14 after audit. */
const NURTURE_SCHEDULE_DAYS = [1, 3, 5, 7, 14];

// ---------------------------------------------------------------------------
// Client singleton
// ---------------------------------------------------------------------------

let _resend: Resend | null = null;

function getResend(): Resend {
  if (_resend) return _resend;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Missing environment variable: RESEND_API_KEY. ' +
        'Add it to your .env.local file.',
    );
  }

  _resend = new Resend(apiKey);
  return _resend;
}

// ---------------------------------------------------------------------------
// Public API: Send Email
// ---------------------------------------------------------------------------

/**
 * Send a single email via Resend.
 *
 * @param params - Recipient, subject, HTML body, and optional scheduled send time.
 * @returns The Resend email ID.
 */
export async function sendEmail(
  params: SendEmailParams,
): Promise<SendEmailResult> {
  const resend = getResend();

  const payload: Parameters<typeof resend.emails.send>[0] = {
    from: FROM_ADDRESS,
    to: [params.to],
    subject: params.subject,
    html: params.html,
  };

  // Add scheduled send time if provided
  if (params.scheduledAt) {
    payload.scheduledAt = params.scheduledAt.toISOString();
  }

  const { data, error } = await resend.emails.send(payload);

  if (error) {
    throw new Error(
      `Resend email failed: ${error.message ?? JSON.stringify(error)}`,
    );
  }

  if (!data?.id) {
    throw new Error('Resend returned no email ID');
  }

  return { id: data.id };
}

// ---------------------------------------------------------------------------
// Public API: Send Audit Report
// ---------------------------------------------------------------------------

/**
 * Send the audit report summary email to a lead.
 *
 * Includes the composite score, grade, and top gap quick wins to entice
 * the recipient to view the full report and consider the paid playbook.
 *
 * @param params - Email, audit ID, score, grade, and top gaps.
 */
export async function sendAuditReport(
  params: SendAuditReportParams,
): Promise<void> {
  const { email, auditId, score, grade, topGaps } = params;

  const reportUrl = `${getBaseUrl()}/audit/${auditId}`;

  const gapRows = topGaps
    .map(
      (gap) =>
        `<tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${gap.label}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${gap.score}/100</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${gap.quick_win}</td>
        </tr>`,
    )
    .join('\n');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <h1 style="color: #111827; margin: 0 0 8px;">Your GTM Audit Results</h1>
      <p style="color: #6b7280; margin: 0 0 32px;">Here's a summary of your website audit.</p>

      <div style="text-align: center; padding: 24px; background: #f0fdf4; border-radius: 8px; margin-bottom: 32px;">
        <div style="font-size: 48px; font-weight: 700; color: #111827;">${score}<span style="font-size: 24px; color: #6b7280;">/100</span></div>
        <div style="font-size: 20px; font-weight: 600; color: #059669; margin-top: 4px;">Grade: ${grade}</div>
      </div>

      ${topGaps.length > 0 ? `
      <h2 style="color: #111827; font-size: 18px; margin: 0 0 16px;">Top Areas for Improvement</h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
        <thead>
          <tr style="background: #f9fafb;">
            <th style="padding: 8px 12px; text-align: left; font-size: 14px; color: #6b7280;">Dimension</th>
            <th style="padding: 8px 12px; text-align: center; font-size: 14px; color: #6b7280;">Score</th>
            <th style="padding: 8px 12px; text-align: left; font-size: 14px; color: #6b7280;">Quick Win</th>
          </tr>
        </thead>
        <tbody>
          ${gapRows}
        </tbody>
      </table>
      ` : ''}

      <div style="text-align: center;">
        <a href="${reportUrl}" style="display: inline-block; padding: 14px 32px; background: #059669; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">View Full Report</a>
      </div>

      <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 32px 0 0;">
        This audit was generated by SylvaPoint.
        <a href="${getBaseUrl()}/unsubscribe?email=${encodeURIComponent(email)}" style="color: #9ca3af;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>`.trim();

  await sendEmail({
    to: email,
    subject: `Your GTM Audit Score: ${score}/100 (Grade ${grade})`,
    html,
  });
}

// ---------------------------------------------------------------------------
// Public API: Schedule Nurture Sequence
// ---------------------------------------------------------------------------

/**
 * Schedule the drip nurture email sequence for a lead.
 *
 * Creates scheduled emails at predefined intervals (day 1, 3, 5, 7, 14)
 * after the audit. Each email is tailored to the nurture step.
 *
 * @param params - Lead ID, email, and audit ID.
 */
export async function scheduleNurtureSequence(
  params: ScheduleNurtureParams,
): Promise<void> {
  const { leadId, email, auditId } = params;

  const reportUrl = `${getBaseUrl()}/audit/${auditId}`;
  const playbookUrl = `${getBaseUrl()}/audit/${auditId}/playbook`;

  const nurtureEmails = buildNurtureEmails(reportUrl, playbookUrl);
  const now = new Date();

  for (let i = 0; i < nurtureEmails.length; i++) {
    const scheduledAt = new Date(now);
    scheduledAt.setDate(scheduledAt.getDate() + NURTURE_SCHEDULE_DAYS[i]);
    // Send at 9:00 AM
    scheduledAt.setHours(9, 0, 0, 0);

    try {
      const { id } = await sendEmail({
        to: email,
        subject: nurtureEmails[i].subject,
        html: nurtureEmails[i].html,
        scheduledAt,
      });

      // Track the scheduled email via analytics_events
      await getAdminSupabase().from('analytics_events').insert({
        tenant_id: DEFAULT_TENANT_ID,
        event_type: 'nurture_email_scheduled',
        audit_id: auditId,
        lead_id: leadId,
        properties: {
          step: i + 1,
          resend_email_id: id,
          scheduled_at: scheduledAt.toISOString(),
        },
      });
    } catch (error) {
      console.error(
        `[resend] Failed to schedule nurture step ${i + 1} for lead=${leadId}:`,
        error instanceof Error ? error.message : error,
      );
      // Continue scheduling remaining emails even if one fails
    }
  }

  // Track nurture sequence start
  await getAdminSupabase().from('analytics_events').insert({
    tenant_id: DEFAULT_TENANT_ID,
    event_type: 'nurture_sequence_started',
    audit_id: auditId,
    lead_id: leadId,
    properties: {
      total_emails: nurtureEmails.length,
    },
  });
}

// ---------------------------------------------------------------------------
// Nurture email templates
// ---------------------------------------------------------------------------

interface NurtureEmail {
  subject: string;
  html: string;
}

function buildNurtureEmails(
  reportUrl: string,
  playbookUrl: string,
): NurtureEmail[] {
  return [
    // Day 1: Reminder to review
    {
      subject: 'Did you check your GTM audit results?',
      html: wrapNurtureHtml(`
        <h1 style="color: #111827; margin: 0 0 16px;">Your audit is ready</h1>
        <p>We noticed you haven't viewed your full audit report yet. Your GTM score and personalised recommendations are waiting.</p>
        <p style="text-align: center; margin: 24px 0;">
          <a href="${reportUrl}" style="display: inline-block; padding: 12px 28px; background: #059669; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">View My Report</a>
        </p>
      `),
    },
    // Day 3: Quick win highlight
    {
      subject: 'One change that could boost your conversions',
      html: wrapNurtureHtml(`
        <h1 style="color: #111827; margin: 0 0 16px;">Your #1 quick win</h1>
        <p>Based on your audit, we identified quick wins you can implement today to improve your go-to-market presence.</p>
        <p>The most impactful improvement? Check your personalised report to find out.</p>
        <p style="text-align: center; margin: 24px 0;">
          <a href="${reportUrl}" style="display: inline-block; padding: 12px 28px; background: #059669; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">See Quick Wins</a>
        </p>
      `),
    },
    // Day 5: Playbook teaser
    {
      subject: 'Turn your audit into a step-by-step playbook',
      html: wrapNurtureHtml(`
        <h1 style="color: #111827; margin: 0 0 16px;">From insights to action</h1>
        <p>Your GTM audit revealed specific gaps in your online presence. Our personalised playbook turns those gaps into a prioritised action plan.</p>
        <ul style="color: #374151; line-height: 1.8;">
          <li>Step-by-step fixes for each gap</li>
          <li>Copy suggestions tailored to your business</li>
          <li>Priority-ranked by impact</li>
        </ul>
        <p style="text-align: center; margin: 24px 0;">
          <a href="${playbookUrl}" style="display: inline-block; padding: 12px 28px; background: #059669; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Get Your Playbook</a>
        </p>
      `),
    },
    // Day 7: Social proof
    {
      subject: 'How businesses improved their GTM score by 30+ points',
      html: wrapNurtureHtml(`
        <h1 style="color: #111827; margin: 0 0 16px;">Real results from real businesses</h1>
        <p>Businesses that act on their GTM audit recommendations typically see significant improvements within weeks.</p>
        <p>The playbook gives you the exact steps to follow, customised to your audit findings.</p>
        <p style="text-align: center; margin: 24px 0;">
          <a href="${playbookUrl}" style="display: inline-block; padding: 12px 28px; background: #059669; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Start Improving Today</a>
        </p>
      `),
    },
    // Day 14: Final follow-up
    {
      subject: 'Last chance: your personalised GTM playbook',
      html: wrapNurtureHtml(`
        <h1 style="color: #111827; margin: 0 0 16px;">Don't leave insights on the table</h1>
        <p>It's been two weeks since your GTM audit. Your personalised recommendations are still available, but the market doesn't wait.</p>
        <p>Get your step-by-step playbook and start closing the gaps today.</p>
        <p style="text-align: center; margin: 24px 0;">
          <a href="${playbookUrl}" style="display: inline-block; padding: 12px 28px; background: #059669; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Get My Playbook</a>
        </p>
      `),
    },
  ];
}

function wrapNurtureHtml(bodyContent: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      ${bodyContent}
      <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 32px 0 0;">
        Sent by SylvaPoint.
        <a href="${getBaseUrl()}/unsubscribe" style="color: #9ca3af;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>`.trim();
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:3000';
}
