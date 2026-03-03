-- ===========================================
-- SylvaPoint GTM Audit Tool — Database Schema
-- ===========================================
-- Run this in Supabase SQL Editor to set up all tables
-- Raw Supabase client (no Prisma) — serverless-friendly

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- ENUM TYPES
-- ==========================================

CREATE TYPE audit_status AS ENUM (
  'pending',
  'crawling',
  'analyzing',
  'scoring',
  'completed',
  'failed'
);

CREATE TYPE business_type AS ENUM (
  'saas',
  'services',
  'info_product'
);

CREATE TYPE payment_status AS ENUM (
  'pending',
  'completed',
  'failed',
  'refunded'
);

CREATE TYPE payment_provider AS ENUM (
  'stripe',
  'mpesa'
);

CREATE TYPE product_type AS ENUM (
  'playbook_basic',
  'playbook_premium'
);

CREATE TYPE tier_level AS ENUM (
  'free',
  'gated',
  'paid'
);

CREATE TYPE identifier_type AS ENUM (
  'fingerprint',
  'ip',
  'email'
);

CREATE TYPE admin_role AS ENUM (
  'super_admin',
  'admin',
  'viewer'
);

-- ==========================================
-- 1. TENANTS (white-label ready)
-- ==========================================

CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  domain TEXT,
  branding JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Default tenant
INSERT INTO tenants (id, name, slug, domain) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'SylvaPoint',
  'sylvapoint',
  'sylvapoint.com'
);

-- ==========================================
-- 2. LEADS
-- ==========================================

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES tenants(id),
  email TEXT,
  name TEXT,
  company TEXT,
  source TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  nurture_status TEXT DEFAULT 'none',
  nurture_step INT DEFAULT 0,
  unsubscribed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_leads_email ON leads(email) WHERE email IS NOT NULL;
CREATE INDEX idx_leads_tenant ON leads(tenant_id);

-- ==========================================
-- 3. AUDITS
-- ==========================================

CREATE TABLE audits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES tenants(id),
  lead_id UUID REFERENCES leads(id),
  url TEXT NOT NULL,
  business_type business_type NOT NULL DEFAULT 'services',
  target_clients TEXT,
  social_links TEXT,
  status audit_status NOT NULL DEFAULT 'pending',
  current_step TEXT,
  progress_pct INT DEFAULT 0,
  composite_score NUMERIC(5,2),
  composite_grade TEXT,
  share_slug TEXT NOT NULL UNIQUE,
  tier_unlocked tier_level NOT NULL DEFAULT 'free',
  top_gaps JSONB DEFAULT '[]',
  error_message TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audits_share_slug ON audits(share_slug);
CREATE INDEX idx_audits_lead ON audits(lead_id);
CREATE INDEX idx_audits_tenant ON audits(tenant_id);
CREATE INDEX idx_audits_status ON audits(status);
CREATE INDEX idx_audits_created ON audits(created_at DESC);

-- ==========================================
-- 4. CRAWL DATA
-- ==========================================

CREATE TABLE crawl_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES tenants(id),
  audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  firecrawl_raw JSONB,
  pagespeed_raw JSONB,
  social_data JSONB,
  extracted_content JSONB,
  pages_crawled INT DEFAULT 0,
  content_hash TEXT,
  crawled_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_crawl_data_audit ON crawl_data(audit_id);
CREATE INDEX idx_crawl_data_hash ON crawl_data(content_hash);

-- ==========================================
-- 5. DIMENSION SCORES
-- ==========================================

CREATE TABLE dimension_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES tenants(id),
  audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  dimension_key TEXT NOT NULL,
  label TEXT NOT NULL,
  raw_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  weighted_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  grade TEXT NOT NULL DEFAULT 'F',
  summary_free TEXT,
  summary_gated TEXT,
  findings JSONB DEFAULT '[]',
  quick_wins JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_dimension_scores_unique ON dimension_scores(audit_id, dimension_key);
CREATE INDEX idx_dimension_scores_audit ON dimension_scores(audit_id);

-- ==========================================
-- 6. SUB SCORES
-- ==========================================

CREATE TABLE sub_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES tenants(id),
  dimension_score_id UUID NOT NULL REFERENCES dimension_scores(id) ON DELETE CASCADE,
  audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  sub_score_key TEXT NOT NULL,
  label TEXT NOT NULL,
  score NUMERIC(5,2) NOT NULL DEFAULT 0,
  weight_within_dimension NUMERIC(4,2) NOT NULL DEFAULT 0,
  evidence TEXT,
  evidence_quotes JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sub_scores_dimension ON sub_scores(dimension_score_id);
CREATE INDEX idx_sub_scores_audit ON sub_scores(audit_id);

-- ==========================================
-- 7. WEIGHT PROFILES
-- ==========================================

CREATE TABLE weight_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES tenants(id),
  business_type business_type NOT NULL,
  dimension_key TEXT NOT NULL,
  dimension_weight NUMERIC(4,2) NOT NULL,
  sub_weights JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_weight_profiles_unique ON weight_profiles(tenant_id, business_type, dimension_key);

-- Default weight profiles
INSERT INTO weight_profiles (tenant_id, business_type, dimension_key, dimension_weight, sub_weights) VALUES
  -- SaaS
  ('00000000-0000-0000-0000-000000000001', 'saas', 'positioning', 0.20, '{"transformation_clarity":0.20,"differentiation":0.20,"value_translation":0.15,"target_specificity":0.15,"proof_arsenal":0.15,"mechanism_naming":0.15}'),
  ('00000000-0000-0000-0000-000000000001', 'saas', 'copy', 0.15, '{"headline_quality":0.20,"cta_effectiveness":0.15,"proof_specificity":0.15,"pain_articulation":0.15,"page_structure":0.15,"ai_tell_score":0.10,"objection_handling":0.10}'),
  ('00000000-0000-0000-0000-000000000001', 'saas', 'seo', 0.15, '{"technical_seo":0.25,"readability":0.20,"eeat_signals":0.20,"content_depth":0.20,"content_freshness":0.15}'),
  ('00000000-0000-0000-0000-000000000001', 'saas', 'lead_capture', 0.18, '{"lead_magnet_existence":0.20,"offer_specificity":0.20,"form_friction":0.15,"bridge_to_paid":0.15,"social_proof_capture":0.15,"format_business_match":0.15}'),
  ('00000000-0000-0000-0000-000000000001', 'saas', 'performance', 0.12, '{"performance_score":0.30,"mobile_readiness":0.25,"accessibility":0.25,"best_practices":0.20}'),
  ('00000000-0000-0000-0000-000000000001', 'saas', 'visual', 0.20, '{"product_photography":0.20,"video_presence":0.20,"platform_visual_compliance":0.20,"brand_consistency":0.20,"human_presence":0.20}'),
  -- Services
  ('00000000-0000-0000-0000-000000000001', 'services', 'positioning', 0.20, '{"transformation_clarity":0.20,"differentiation":0.20,"value_translation":0.15,"target_specificity":0.15,"proof_arsenal":0.15,"mechanism_naming":0.15}'),
  ('00000000-0000-0000-0000-000000000001', 'services', 'copy', 0.18, '{"headline_quality":0.20,"cta_effectiveness":0.15,"proof_specificity":0.15,"pain_articulation":0.15,"page_structure":0.15,"ai_tell_score":0.10,"objection_handling":0.10}'),
  ('00000000-0000-0000-0000-000000000001', 'services', 'seo', 0.12, '{"technical_seo":0.25,"readability":0.20,"eeat_signals":0.20,"content_depth":0.20,"content_freshness":0.15}'),
  ('00000000-0000-0000-0000-000000000001', 'services', 'lead_capture', 0.15, '{"lead_magnet_existence":0.20,"offer_specificity":0.20,"form_friction":0.15,"bridge_to_paid":0.15,"social_proof_capture":0.15,"format_business_match":0.15}'),
  ('00000000-0000-0000-0000-000000000001', 'services', 'performance', 0.10, '{"performance_score":0.30,"mobile_readiness":0.25,"accessibility":0.25,"best_practices":0.20}'),
  ('00000000-0000-0000-0000-000000000001', 'services', 'visual', 0.25, '{"product_photography":0.20,"video_presence":0.20,"platform_visual_compliance":0.20,"brand_consistency":0.20,"human_presence":0.20}'),
  -- Info Product
  ('00000000-0000-0000-0000-000000000001', 'info_product', 'positioning', 0.18, '{"transformation_clarity":0.20,"differentiation":0.20,"value_translation":0.15,"target_specificity":0.15,"proof_arsenal":0.15,"mechanism_naming":0.15}'),
  ('00000000-0000-0000-0000-000000000001', 'info_product', 'copy', 0.20, '{"headline_quality":0.20,"cta_effectiveness":0.15,"proof_specificity":0.15,"pain_articulation":0.15,"page_structure":0.15,"ai_tell_score":0.10,"objection_handling":0.10}'),
  ('00000000-0000-0000-0000-000000000001', 'info_product', 'seo', 0.12, '{"technical_seo":0.25,"readability":0.20,"eeat_signals":0.20,"content_depth":0.20,"content_freshness":0.15}'),
  ('00000000-0000-0000-0000-000000000001', 'info_product', 'lead_capture', 0.18, '{"lead_magnet_existence":0.20,"offer_specificity":0.20,"form_friction":0.15,"bridge_to_paid":0.15,"social_proof_capture":0.15,"format_business_match":0.15}'),
  ('00000000-0000-0000-0000-000000000001', 'info_product', 'performance', 0.10, '{"performance_score":0.30,"mobile_readiness":0.25,"accessibility":0.25,"best_practices":0.20}'),
  ('00000000-0000-0000-0000-000000000001', 'info_product', 'visual', 0.22, '{"product_photography":0.20,"video_presence":0.20,"platform_visual_compliance":0.20,"brand_consistency":0.20,"human_presence":0.20}');

-- ==========================================
-- 8. PAYMENTS
-- ==========================================

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES tenants(id),
  lead_id UUID NOT NULL REFERENCES leads(id),
  audit_id UUID NOT NULL REFERENCES audits(id),
  provider payment_provider NOT NULL,
  product_type product_type NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status payment_status NOT NULL DEFAULT 'pending',
  stripe_session_id TEXT,
  stripe_payment_intent TEXT,
  mpesa_checkout_request_id TEXT,
  mpesa_receipt_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_lead ON payments(lead_id);
CREATE INDEX idx_payments_audit ON payments(audit_id);
CREATE INDEX idx_payments_stripe ON payments(stripe_session_id) WHERE stripe_session_id IS NOT NULL;
CREATE INDEX idx_payments_mpesa ON payments(mpesa_checkout_request_id) WHERE mpesa_checkout_request_id IS NOT NULL;

-- ==========================================
-- 9. PLAYBOOKS
-- ==========================================

CREATE TABLE playbooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES tenants(id),
  audit_id UUID NOT NULL REFERENCES audits(id),
  lead_id UUID NOT NULL REFERENCES leads(id),
  payment_id UUID REFERENCES payments(id),
  content_markdown TEXT,
  pdf_storage_path TEXT,
  pdf_url TEXT,
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_playbooks_audit ON playbooks(audit_id);

-- ==========================================
-- 10. ANALYTICS EVENTS (append-only)
-- ==========================================

CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES tenants(id),
  event_type TEXT NOT NULL,
  audit_id UUID REFERENCES audits(id),
  lead_id UUID REFERENCES leads(id),
  properties JSONB DEFAULT '{}',
  utm_params JSONB DEFAULT '{}',
  referrer TEXT,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_audit ON analytics_events(audit_id);
CREATE INDEX idx_analytics_created ON analytics_events(created_at DESC);

-- ==========================================
-- 11. RATE LIMITS
-- ==========================================

CREATE TABLE rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES tenants(id),
  identifier TEXT NOT NULL,
  identifier_type identifier_type NOT NULL,
  audit_count INT NOT NULL DEFAULT 0,
  last_audit_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_rate_limits_unique ON rate_limits(tenant_id, identifier, identifier_type);

-- ==========================================
-- 12. ADMIN USERS
-- ==========================================

CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES tenants(id),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role admin_role NOT NULL DEFAULT 'admin',
  last_login_at TIMESTAMPTZ,
  failed_attempts INT DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE crawl_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE dimension_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Public: read completed audits by share_slug
CREATE POLICY "Public can read completed audits by slug"
  ON audits FOR SELECT
  USING (status = 'completed' AND share_slug IS NOT NULL);

-- Public: read dimension scores for completed audits
CREATE POLICY "Public can read dimension scores for completed audits"
  ON dimension_scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM audits
      WHERE audits.id = dimension_scores.audit_id
      AND audits.status = 'completed'
    )
  );

-- Public: read sub scores for completed audits
CREATE POLICY "Public can read sub scores for completed audits"
  ON sub_scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM audits
      WHERE audits.id = sub_scores.audit_id
      AND audits.status = 'completed'
    )
  );

-- Public: read weight profiles (needed for display)
CREATE POLICY "Public can read weight profiles"
  ON weight_profiles FOR SELECT
  USING (true);

-- Service role: full access (all writes go through server-side API routes)
-- Supabase service_role key bypasses RLS by default

-- ==========================================
-- UPDATED_AT TRIGGER
-- ==========================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_audits_updated_at
  BEFORE UPDATE ON audits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_weight_profiles_updated_at
  BEFORE UPDATE ON weight_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
