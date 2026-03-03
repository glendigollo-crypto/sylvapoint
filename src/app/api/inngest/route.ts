import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import { auditPipeline } from '@/inngest/functions/audit-pipeline';

// Allow up to 60s per step invocation (Vercel Hobby max).
// Inngest steps run as separate HTTP requests, so each step
// gets its own maxDuration budget.
export const maxDuration = 60;

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [auditPipeline],
});
