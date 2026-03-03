import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import { auditPipeline } from '@/inngest/functions/audit-pipeline';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [auditPipeline],
});
