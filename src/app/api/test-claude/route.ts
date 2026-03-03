import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { scoreCopyEffectiveness } from '@/lib/scoring/dimensions/copy-effectiveness';
import type { ScorerInput } from '@/lib/scoring/types';
import type { BusinessType } from '@/types/audit';

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const auditId = request.nextUrl.searchParams.get('audit') || 'c5ea1c3d-2115-4a8c-9091-a4c284819570';

  try {
    // Fetch crawl data from DB
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { data: crawl } = await supabase
      .from('crawl_data')
      .select('extracted_content, pagespeed_raw')
      .eq('audit_id', auditId)
      .single();

    if (!crawl) {
      return NextResponse.json({ error: 'No crawl data found' }, { status: 404 });
    }

    const { data: audit } = await supabase
      .from('audits')
      .select('url, business_type, target_clients')
      .eq('id', auditId)
      .single();

    if (!audit) {
      return NextResponse.json({ error: 'No audit found' }, { status: 404 });
    }

    const scorerInput: ScorerInput = {
      audit_id: auditId,
      url: audit.url,
      business_type: audit.business_type as BusinessType,
      target_clients: audit.target_clients,
      extraction: crawl.extracted_content,
      pagespeed: crawl.pagespeed_raw ?? undefined,
    };

    // Log what we're sending
    const inputSize = JSON.stringify(scorerInput).length;

    // Call Claude directly to see the raw response
    const { callClaude } = await import('@/lib/claude/client');

    // Build a minimal prompt similar to what the scorer sends
    const headlines = (crawl.extracted_content.headlines || []).slice(0, 10).map((h: {text: string}) => h.text).join('\n');
    const ctas = (crawl.extracted_content.ctas || []).slice(0, 10).map((c: {text: string}) => c.text).join('\n');

    const response = await callClaude({
      model: 'claude-sonnet-4-6',
      systemPrompt: 'You are a copy effectiveness scorer. Respond with ONLY valid JSON.',
      userPrompt: `Score the copy on this website.\n\nHeadlines:\n${headlines}\n\nCTAs:\n${ctas}\n\nReturn JSON with: {"sub_scores":[{"key":"clarity","score":7,"evidence":"...","evidence_quotes":["..."]}],"summary_free":"...","summary_gated":"...","findings":[],"quick_wins":[]}`,
      maxTokens: 2048,
      temperature: 0.3,
    });

    // Try to parse it
    let parseError = null;
    let parsed = null;
    try {
      const start = response.content.indexOf('{');
      const end = response.content.lastIndexOf('}');
      if (start !== -1 && end > start) {
        let jsonStr = response.content.slice(start, end + 1);
        jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');
        parsed = JSON.parse(jsonStr);
      }
    } catch (e) {
      parseError = (e as Error).message;
    }

    return NextResponse.json({
      success: true,
      inputSize,
      rawContentLength: response.content.length,
      rawContentFirst500: response.content.substring(0, 500),
      rawContentLast500: response.content.substring(response.content.length - 500),
      parseError,
      parsedKeys: parsed ? Object.keys(parsed) : null,
      tokens: response.usage,
    });
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 8),
    }, { status: 500 });
  }
}
