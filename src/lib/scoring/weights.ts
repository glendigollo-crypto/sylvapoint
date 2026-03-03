// ---------------------------------------------------------------------------
// Weight Profiles — SylvaPoint GTM Audit Tool
// Manages per-business-type dimension & sub-score weights
// ---------------------------------------------------------------------------

import type { DimensionKey } from '@/types/scoring';
import { supabaseAdmin } from '@/lib/supabase/admin';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DimensionWeightConfig {
  weight: number;
  subWeights: Record<string, number>;
}

export type WeightProfileMap = Record<DimensionKey, DimensionWeightConfig>;

type BusinessType = 'saas' | 'ecommerce' | 'marketplace' | 'services' | 'info_product' | 'enterprise';

// ---------------------------------------------------------------------------
// Hardcoded Defaults — match the GTM audit plan weight tables
// ---------------------------------------------------------------------------

const DEFAULT_SUB_WEIGHTS: Record<DimensionKey, Record<string, number>> = {
  positioning: {
    clarity: 0.20,
    differentiation: 0.20,
    audience_fit: 0.20,
    value_proposition: 0.15,
    brand_consistency: 0.15,
    competitive_stance: 0.10,
  },
  copy: {
    headline_power: 0.18,
    benefit_focus: 0.16,
    readability: 0.14,
    voice_consistency: 0.14,
    emotional_hooks: 0.14,
    ai_originality: 0.12,
    scanability: 0.12,
  },
  seo: {
    title_meta: 0.25,
    heading_structure: 0.20,
    keyword_alignment: 0.25,
    content_depth: 0.15,
    internal_linking: 0.15,
  },
  lead_capture: {
    cta_clarity: 0.20,
    cta_placement: 0.15,
    form_design: 0.15,
    value_exchange: 0.20,
    urgency_scarcity: 0.15,
    trust_signals: 0.15,
  },
  performance: {
    lcp: 0.30,
    fid: 0.25,
    cls: 0.25,
    overall_performance: 0.20,
  },
  visual: {
    above_fold_impact: 0.25,
    visual_hierarchy: 0.20,
    imagery_quality: 0.20,
    whitespace_balance: 0.15,
    mobile_responsiveness: 0.20,
  },
};

const DEFAULT_WEIGHTS: Record<string, Record<DimensionKey, number>> = {
  default: {
    positioning: 0.18,
    copy: 0.15,
    seo: 0.15,
    lead_capture: 0.15,
    performance: 0.12,
    visual: 0.25,
  },
  saas: {
    positioning: 0.20,
    copy: 0.15,
    seo: 0.15,
    lead_capture: 0.18,
    performance: 0.12,
    visual: 0.20,
  },
  services: {
    positioning: 0.20,
    copy: 0.18,
    seo: 0.12,
    lead_capture: 0.15,
    performance: 0.10,
    visual: 0.25,
  },
  info_product: {
    positioning: 0.18,
    copy: 0.20,
    seo: 0.12,
    lead_capture: 0.18,
    performance: 0.10,
    visual: 0.22,
  },
  ecommerce: {
    positioning: 0.12,
    copy: 0.15,
    seo: 0.22,
    lead_capture: 0.15,
    performance: 0.16,
    visual: 0.20,
  },
  marketplace: {
    positioning: 0.22,
    copy: 0.15,
    seo: 0.13,
    lead_capture: 0.18,
    performance: 0.12,
    visual: 0.20,
  },
  enterprise: {
    positioning: 0.22,
    copy: 0.18,
    seo: 0.10,
    lead_capture: 0.20,
    performance: 0.10,
    visual: 0.20,
  },
};

const ALL_DIMENSIONS: DimensionKey[] = [
  'positioning',
  'copy',
  'seo',
  'lead_capture',
  'performance',
  'visual',
];

// ---------------------------------------------------------------------------
// Build a default profile from the hardcoded tables
// ---------------------------------------------------------------------------

function buildDefaultProfile(businessType: BusinessType): WeightProfileMap {
  const dimensionWeights =
    DEFAULT_WEIGHTS[businessType] ?? DEFAULT_WEIGHTS['default'];

  const profile = {} as WeightProfileMap;

  for (const dim of ALL_DIMENSIONS) {
    profile[dim] = {
      weight: dimensionWeights[dim],
      subWeights: { ...DEFAULT_SUB_WEIGHTS[dim] },
    };
  }

  return profile;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch the weight profile for a given business type, optionally scoped to a
 * tenant. Falls back to hardcoded defaults if the database is unavailable or
 * returns no rows.
 *
 * @param businessType - One of 'saas', 'services', 'info_product'
 * @param tenantId     - Optional tenant ID for custom overrides
 */
export async function getWeightProfile(
  businessType: BusinessType,
  tenantId?: string
): Promise<WeightProfileMap> {
  try {
    // Attempt to load from the weight_profiles table
    let query = supabaseAdmin
      .from('weight_profiles')
      .select('*')
      .eq('business_type', businessType);

    if (tenantId) {
      // Prefer tenant-specific override; fall back to default tenant
      query = query.or(`tenant_id.eq.${tenantId},tenant_id.eq.00000000-0000-0000-0000-000000000001`);
    } else {
      // Use the default tenant's weight profiles
      query = query.eq('tenant_id', '00000000-0000-0000-0000-000000000001');
    }

    const { data, error } = await query;

    if (error) {
      console.warn(
        `[weights] Failed to fetch weight_profiles: ${error.message}. Using defaults.`
      );
      return buildDefaultProfile(businessType);
    }

    if (!data || data.length === 0) {
      return buildDefaultProfile(businessType);
    }

    // If we have both tenant-specific and global rows, prefer tenant-specific
    const tenantRows = tenantId
      ? data.filter((row: Record<string, unknown>) => row.tenant_id === tenantId)
      : [];
    const rows = tenantRows.length > 0 ? tenantRows : data;

    // Build profile from DB rows
    const profile = buildDefaultProfile(businessType);

    for (const row of rows) {
      const dimKey = row.dimension_key as DimensionKey;
      if (ALL_DIMENSIONS.includes(dimKey)) {
        profile[dimKey] = {
          weight:
            typeof row.dimension_weight === 'number'
              ? row.dimension_weight
              : profile[dimKey].weight,
          subWeights:
            row.sub_weights && typeof row.sub_weights === 'object'
              ? { ...profile[dimKey].subWeights, ...(row.sub_weights as Record<string, number>) }
              : profile[dimKey].subWeights,
        };
      }
    }

    return profile;
  } catch (err) {
    console.warn(
      `[weights] Unexpected error fetching weight profiles: ${err}. Using defaults.`
    );
    return buildDefaultProfile(businessType);
  }
}
