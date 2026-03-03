// ---------------------------------------------------------------------------
// Playbook PDF Download API — SylvaPoint GTM Audit Tool
// ---------------------------------------------------------------------------
// GET /api/playbooks/[id]/pdf?token=<signed JWT>
// Downloads the playbook as a PDF (if available) or as markdown plain text.
// A signed JWT token is required to prevent unauthorized downloads.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getAdminSupabase } from "@/lib/supabase/admin";

// ---------------------------------------------------------------------------
// Token verification
// ---------------------------------------------------------------------------

interface PlaybookTokenPayload {
  playbook_id: string;
  audit_id: string;
  iat: number;
  exp: number;
}

function getPlaybookJwtSecret(): string {
  // Use a dedicated secret if available, otherwise fall back to admin secret
  const secret =
    process.env.PLAYBOOK_JWT_SECRET ?? process.env.ADMIN_JWT_SECRET;
  if (!secret) {
    throw new Error(
      "Missing environment variable: PLAYBOOK_JWT_SECRET or ADMIN_JWT_SECRET. " +
        "Add one to your .env.local file."
    );
  }
  return secret;
}

function verifyPlaybookToken(
  token: string,
  expectedPlaybookId: string
): { valid: true; payload: PlaybookTokenPayload } | { valid: false; error: string } {
  try {
    const secret = getPlaybookJwtSecret();
    const decoded = jwt.verify(token, secret, {
      algorithms: ["HS256"],
    }) as PlaybookTokenPayload;

    if (decoded.playbook_id !== expectedPlaybookId) {
      return { valid: false, error: "Token does not match the requested playbook" };
    }

    return { valid: true, payload: decoded };
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return { valid: false, error: "Download link has expired" };
    }
    if (err instanceof jwt.JsonWebTokenError) {
      return { valid: false, error: "Invalid download token" };
    }
    return { valid: false, error: "Token verification failed" };
  }
}

// ---------------------------------------------------------------------------
// Utility: sign a playbook download token (exported for use by other routes)
// ---------------------------------------------------------------------------

/**
 * Create a signed JWT for downloading a specific playbook.
 * Valid for 24 hours by default.
 */
export function signPlaybookToken(
  playbookId: string,
  auditId: string,
  expiresInSeconds: number = 86400 // 24 hours
): string {
  const secret = getPlaybookJwtSecret();
  const options: jwt.SignOptions = { expiresIn: expiresInSeconds, algorithm: "HS256" };
  return jwt.sign(
    { playbook_id: playbookId, audit_id: auditId },
    secret,
    options
  );
}

// ---------------------------------------------------------------------------
// GET handler
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: playbookId } = await params;

  try {
    // --- Extract token from query params ---
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Missing download token. Provide ?token=<jwt> query parameter." },
        { status: 401 }
      );
    }

    // --- Verify token ---
    const verification = verifyPlaybookToken(token, playbookId);
    if (!verification.valid) {
      return NextResponse.json(
        { error: verification.error },
        { status: 403 }
      );
    }

    // --- Fetch playbook from Supabase ---
    const supabase = getAdminSupabase();

    const { data: playbook, error: fetchError } = await supabase
      .from("playbooks")
      .select("id, audit_id, content_markdown, pdf_url, created_at")
      .eq("id", playbookId)
      .single();

    if (fetchError || !playbook) {
      return NextResponse.json(
        { error: "Playbook not found" },
        { status: 404 }
      );
    }

    // --- If a PDF exists in Supabase Storage, redirect to it ---
    if (playbook.pdf_url) {
      // Check if the URL is a Supabase Storage path or a full URL
      let pdfUrl = playbook.pdf_url;

      if (!pdfUrl.startsWith("http")) {
        // It's a storage path — generate a signed URL
        const { data: signedUrlData, error: signedUrlError } = await supabase
          .storage
          .from("playbooks")
          .createSignedUrl(pdfUrl, 3600); // 1 hour expiry

        if (signedUrlError || !signedUrlData?.signedUrl) {
          console.error(
            "[playbooks/pdf] Failed to create signed URL:",
            signedUrlError?.message
          );
          // Fall through to serve markdown instead
        } else {
          pdfUrl = signedUrlData.signedUrl;
        }
      }

      // If we have a valid URL, redirect
      if (pdfUrl.startsWith("http")) {
        return NextResponse.redirect(pdfUrl, {
          status: 302,
          headers: {
            "Content-Disposition": `attachment; filename="sylvapoint-playbook-${playbookId}.pdf"`,
            "Cache-Control": "private, max-age=3600",
          },
        });
      }
    }

    // --- No PDF available — serve the markdown as plain text ---
    if (!playbook.content_markdown) {
      return NextResponse.json(
        { error: "Playbook content is empty" },
        { status: 404 }
      );
    }

    // Fetch audit URL for a meaningful filename
    let filename = `sylvapoint-playbook-${playbookId}`;
    if (playbook.audit_id) {
      const { data: audit } = await supabase
        .from("audits")
        .select("url")
        .eq("id", playbook.audit_id)
        .single();

      if (audit?.url) {
        try {
          const hostname = new URL(audit.url).hostname.replace(/\./g, "-");
          filename = `sylvapoint-playbook-${hostname}`;
        } catch {
          // Use default filename
        }
      }
    }

    return new NextResponse(playbook.content_markdown, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}.md"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error(
      "[playbooks/pdf] Unexpected error:",
      error instanceof Error ? error.message : error
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
