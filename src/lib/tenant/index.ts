// ---------------------------------------------------------------------------
// Tenant Resolution — SylvaPoint GTM Audit Tool
// ---------------------------------------------------------------------------
// Single-tenant for now; designed for future multi-tenant header/cookie/domain
// resolution.
// ---------------------------------------------------------------------------

/** Default tenant UUID used for all single-tenant operations. */
export const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Resolve the current tenant ID.
 *
 * Currently returns the default tenant. In a future multi-tenant setup this
 * would inspect request headers, cookies, or the hostname.
 */
export function getTenantId(_request?: unknown): string {
  return DEFAULT_TENANT_ID;
}
