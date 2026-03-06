/**
 * Generate the GTM Clarity Blueprint as a pitch-deck-style PDF.
 *
 * Run:  npx tsx scripts/generate-blueprint-pdf.ts
 * Out:  public/downloads/gtm-clarity-blueprint.pdf
 */

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  renderToFile,
} from "@react-pdf/renderer";
import path from "path";
import fs from "fs";

// ---------------------------------------------------------------------------
// Brand tokens
// ---------------------------------------------------------------------------
const C = {
  white: "#FFFFFF",
  bg: "#F8F9FA",
  border: "#DEE2E6",
  muted: "#868E96",
  text: "#495057",
  heading: "#212529",
  accent: "#FF4D4D",
  accentDark: "#E63946",
  accentLight: "#FF6B6B",
  accentBg: "#FFF5F5",
  gradeA: "#10B981",
  gradeB: "#3B82F6",
  gradeC: "#F59E0B",
  gradeD: "#F97316",
  gradeF: "#EF4444",
  dark: "#1a1a2e",
  darkMid: "#16213e",
  darkText: "#E8E8E8",
  darkMuted: "#A0A0B0",
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const s = StyleSheet.create({
  // -- Layouts --
  page: {
    width: "100%",
    height: "100%",
    padding: 0,
  },
  padded: {
    padding: 48,
    flex: 1,
  },
  paddedDark: {
    padding: 48,
    flex: 1,
    backgroundColor: C.dark,
  },

  // -- Title slide --
  titlePage: {
    backgroundColor: C.dark,
    padding: 60,
    flex: 1,
    justifyContent: "center",
  },
  titleLabel: {
    fontSize: 11,
    letterSpacing: 3,
    color: C.accent,
    textTransform: "uppercase" as const,
    marginBottom: 16,
  },
  titleMain: {
    fontSize: 36,
    fontWeight: "bold",
    color: C.white,
    lineHeight: 1.2,
    marginBottom: 12,
  },
  titleSub: {
    fontSize: 16,
    color: C.darkMuted,
    lineHeight: 1.5,
    maxWidth: 480,
  },
  titleFooter: {
    position: "absolute",
    bottom: 40,
    left: 60,
    right: 60,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titleBrand: {
    fontSize: 12,
    fontWeight: "bold",
    color: C.accent,
    letterSpacing: 1.5,
  },
  titleUrl: {
    fontSize: 10,
    color: C.darkMuted,
  },

  // -- Section slides --
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 12,
  },
  sectionNumber: {
    fontSize: 11,
    fontWeight: "bold",
    color: C.accent,
    backgroundColor: C.accentBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  sectionNumberDark: {
    fontSize: 11,
    fontWeight: "bold",
    color: C.accent,
    backgroundColor: "rgba(255,77,77,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: C.heading,
  },
  sectionTitleDark: {
    fontSize: 24,
    fontWeight: "bold",
    color: C.white,
  },

  // -- Content --
  body: {
    fontSize: 11,
    color: C.text,
    lineHeight: 1.7,
    marginBottom: 10,
  },
  bodyDark: {
    fontSize: 11,
    color: C.darkText,
    lineHeight: 1.7,
    marginBottom: 10,
  },
  bold: {
    fontWeight: "bold",
  },
  accent: {
    color: C.accent,
    fontWeight: "bold",
  },

  // -- Callout box --
  callout: {
    backgroundColor: C.accentBg,
    borderLeft: `3px solid ${C.accent}`,
    borderRadius: 6,
    padding: 14,
    marginTop: 8,
    marginBottom: 12,
  },
  calloutDark: {
    backgroundColor: "rgba(255,77,77,0.08)",
    borderLeft: `3px solid ${C.accent}`,
    borderRadius: 6,
    padding: 14,
    marginTop: 8,
    marginBottom: 12,
  },
  calloutLabel: {
    fontSize: 9,
    fontWeight: "bold",
    color: C.accent,
    textTransform: "uppercase" as const,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  calloutText: {
    fontSize: 10,
    color: C.text,
    lineHeight: 1.6,
  },
  calloutTextDark: {
    fontSize: 10,
    color: C.darkText,
    lineHeight: 1.6,
  },

  // -- Check items --
  checkRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 8,
  },
  checkBox: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: C.border,
    marginTop: 1,
  },
  checkBoxDark: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: C.darkMuted,
    marginTop: 1,
  },
  checkLabel: {
    fontSize: 11,
    color: C.text,
    lineHeight: 1.5,
    flex: 1,
  },
  checkLabelDark: {
    fontSize: 11,
    color: C.darkText,
    lineHeight: 1.5,
    flex: 1,
  },

  // -- Reflection prompt --
  reflectionBox: {
    backgroundColor: C.bg,
    borderRadius: 6,
    padding: 12,
    marginTop: 6,
    marginBottom: 12,
  },
  reflectionBoxDark: {
    backgroundColor: C.darkMid,
    borderRadius: 6,
    padding: 12,
    marginTop: 6,
    marginBottom: 12,
  },
  reflectionLabel: {
    fontSize: 9,
    fontWeight: "bold",
    color: C.muted,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
    marginBottom: 4,
  },
  reflectionText: {
    fontSize: 10,
    color: C.text,
    lineHeight: 1.5,
    fontStyle: "italic",
  },
  reflectionTextDark: {
    fontSize: 10,
    color: C.darkMuted,
    lineHeight: 1.5,
    fontStyle: "italic",
  },

  // -- Two-column --
  cols: {
    flexDirection: "row",
    gap: 24,
    marginBottom: 12,
  },
  col: {
    flex: 1,
  },

  // -- Bullet --
  bulletRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 4,
  },
  bulletDot: {
    fontSize: 11,
    color: C.accent,
    marginTop: 1,
  },
  bulletText: {
    fontSize: 11,
    color: C.text,
    lineHeight: 1.6,
    flex: 1,
  },
  bulletTextDark: {
    fontSize: 11,
    color: C.darkText,
    lineHeight: 1.6,
    flex: 1,
  },

  // -- Comparison --
  comparisonBad: {
    backgroundColor: "#FEF2F2",
    borderRadius: 6,
    padding: 10,
    marginBottom: 6,
  },
  comparisonGood: {
    backgroundColor: "#F0FDF4",
    borderRadius: 6,
    padding: 10,
    marginBottom: 6,
  },
  comparisonBadDark: {
    backgroundColor: "rgba(239,68,68,0.1)",
    borderRadius: 6,
    padding: 10,
    marginBottom: 6,
  },
  comparisonGoodDark: {
    backgroundColor: "rgba(16,185,129,0.1)",
    borderRadius: 6,
    padding: 10,
    marginBottom: 6,
  },

  // -- Phase label --
  phaseLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: C.accent,
    textTransform: "uppercase" as const,
    letterSpacing: 1.5,
    marginBottom: 8,
    marginTop: 14,
  },

  // -- Divider --
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 14,
  },
  dividerDark: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginVertical: 14,
  },

  // -- Footer --
  pageFooter: {
    position: "absolute",
    bottom: 20,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 8,
    color: C.muted,
  },
  footerTextDark: {
    fontSize: 8,
    color: C.darkMuted,
  },

  // -- CTA slide --
  ctaPage: {
    backgroundColor: C.dark,
    padding: 60,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  ctaTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: C.white,
    textAlign: "center",
    marginBottom: 16,
  },
  ctaBody: {
    fontSize: 13,
    color: C.darkMuted,
    textAlign: "center",
    lineHeight: 1.7,
    maxWidth: 420,
    marginBottom: 28,
  },
  ctaButton: {
    backgroundColor: C.accent,
    borderRadius: 8,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  ctaButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: C.white,
    textAlign: "center",
  },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const e = React.createElement;

function Footer({ num, dark }: { num: number; dark?: boolean }) {
  return e(
    View,
    { style: dark ? s.pageFooter : s.pageFooter },
    e(Text, { style: dark ? s.footerTextDark : s.footerText }, "SylvaPoint"),
    e(
      Text,
      { style: dark ? s.footerTextDark : s.footerText },
      `GTM Clarity Blueprint  |  ${num}`
    )
  );
}

function Bullet({
  text,
  dark,
}: {
  text: string;
  dark?: boolean;
}) {
  return e(
    View,
    { style: s.bulletRow },
    e(Text, { style: s.bulletDot }, "\u2022"),
    e(Text, { style: dark ? s.bulletTextDark : s.bulletText }, text)
  );
}

function CheckItem({ label, dark }: { label: string; dark?: boolean }) {
  return e(
    View,
    { style: s.checkRow },
    e(View, { style: dark ? s.checkBoxDark : s.checkBox }),
    e(Text, { style: dark ? s.checkLabelDark : s.checkLabel }, label)
  );
}

function Reflection({ prompt, dark }: { prompt: string; dark?: boolean }) {
  return e(
    View,
    { style: dark ? s.reflectionBoxDark : s.reflectionBox },
    e(Text, { style: s.reflectionLabel }, "Reflection Prompt"),
    e(
      Text,
      { style: dark ? s.reflectionTextDark : s.reflectionText },
      prompt
    )
  );
}

function Callout({ text, dark }: { text: string; dark?: boolean }) {
  return e(
    View,
    { style: dark ? s.calloutDark : s.callout },
    e(Text, { style: s.calloutLabel }, "Consultant\u2019s Note"),
    e(Text, { style: dark ? s.calloutTextDark : s.calloutText }, text)
  );
}

function SectionHead({
  num,
  title,
  dark,
}: {
  num: string;
  title: string;
  dark?: boolean;
}) {
  return e(
    View,
    { style: s.sectionHeader },
    e(Text, { style: dark ? s.sectionNumberDark : s.sectionNumber }, num),
    e(Text, { style: dark ? s.sectionTitleDark : s.sectionTitle }, title)
  );
}

function PhaseLabel({ label }: { label: string }) {
  return e(Text, { style: s.phaseLabel }, label);
}

function Divider({ dark }: { dark?: boolean }) {
  return e(View, { style: dark ? s.dividerDark : s.divider });
}

// ---------------------------------------------------------------------------
// Document
// ---------------------------------------------------------------------------
const landscape = { width: 842, height: 595 }; // A4 landscape

const BlueprintPDF = e(
  Document,
  { title: "The Startup Go-to-Market Clarity Blueprint", author: "SylvaPoint" },

  // ====== SLIDE 1 — TITLE ======
  e(
    Page,
    { size: landscape, style: s.page },
    e(
      View,
      { style: s.titlePage },
      e(Text, { style: s.titleLabel }, "SYLVAPOINT STRATEGIC BLUEPRINT"),
      e(
        Text,
        { style: s.titleMain },
        "The Startup\nGo-to-Market\nClarity Blueprint"
      ),
      e(
        Text,
        { style: s.titleSub },
        "Moving from Confusion to Direction Before You Launch.\nA structured self-assessment for founders who refuse to launch to silence."
      ),
      e(
        View,
        { style: s.titleFooter },
        e(Text, { style: s.titleBrand }, "SYLVAPOINT"),
        e(Text, { style: s.titleUrl }, "sylvapoint.vercel.app")
      )
    )
  ),

  // ====== SLIDE 2 — WHY MOST LAUNCHES FAIL ======
  e(
    Page,
    { size: landscape, style: s.page },
    e(
      View,
      { style: s.paddedDark },
      SectionHead({ num: "01", title: "Why Most Launches Fail", dark: true }),
      e(
        Text,
        { style: s.bodyDark },
        'The uncomfortable truth: most startup launches are "loud" but ineffective. Founders often confuse activity with Go-to-Market strategy.'
      ),
      e(
        Text,
        { style: { ...s.bodyDark, fontSize: 14, color: C.accent, marginVertical: 12 } },
        '\"Posting at launch\" is not a go-to-market strategy.\nIt\u2019s a moment of visibility without context.'
      ),
      e(
        Text,
        { style: { ...s.bodyDark, fontWeight: "bold", marginBottom: 8 } },
        "Early-stage teams often confuse:"
      ),
      Bullet({ text: "Visibility with readiness", dark: true }),
      Bullet({ text: "Activity with clarity", dark: true }),
      Bullet({ text: "Attention with traction", dark: true }),
      Divider({ dark: true }),
      e(
        Text,
        { style: s.bodyDark },
        "At this stage, scale does not solve uncertainty \u2014 it amplifies it. Clarity and Readiness, not reach, is the most important growth lever before and during market entry."
      ),
      Callout({
        text: "Visibility without readiness usually just accelerates the rate at which the market realizes you aren\u2019t ready. This blueprint exists to help founders slow down, zoom out, and ask better questions before entering the market.",
        dark: true,
      }),
      Footer({ num: 2, dark: true })
    )
  ),

  // ====== SLIDE 3 — MARKET ENTRY READINESS (Product Clarity) ======
  e(
    Page,
    { size: landscape, style: s.page },
    e(
      View,
      { style: s.padded },
      SectionHead({ num: "02", title: "Market Entry Readiness Assessment" }),
      e(
        Text,
        { style: s.body },
        "Before thinking about channels, content, or launches, there is one question to answer: Are you actually ready to enter the market?"
      ),
      PhaseLabel({ label: "Phase A: The Product Clarity Check" }),
      e(
        Text,
        { style: { ...s.body, fontStyle: "italic", marginBottom: 12 } },
        "If the answers change depending on who is speaking internally, you have a clarity problem \u2014 not a marketing problem."
      ),
      CheckItem({
        label:
          'The "Stranger" Test: Can you explain the problem you solve to a stranger in one sentence without using industry jargon?',
      }),
      CheckItem({
        label:
          "The Urgency Test: Do you know why the market needs this solution right now, rather than 6 months ago or 6 months from now?",
      }),
      Reflection({
        prompt:
          'Who feels this problem most acutely? Be specific \u2014 e.g., "CFOs at Series B startups," not just "Companies."',
      }),
      Divider({}),
      PhaseLabel({ label: "Phase B: Market Reality (Awareness vs. Demand)" }),
      e(
        View,
        { style: s.cols },
        e(
          View,
          { style: s.col },
          e(
            Text,
            { style: { ...s.body, fontWeight: "bold" } },
            "Awareness"
          ),
          e(
            Text,
            { style: s.body },
            "People know the problem exists."
          )
        ),
        e(
          View,
          { style: s.col },
          e(
            Text,
            { style: { ...s.body, fontWeight: "bold" } },
            "Demand"
          ),
          e(
            Text,
            { style: s.body },
            "People are actively searching for a solution."
          )
        )
      ),
      CheckItem({
        label:
          "Are we trying to capture existing demand, or educate the market from scratch?",
      }),
      CheckItem({
        label:
          'Do we have a specific "beachhead" niche, or are we trying to sell to "everyone" from Day 1?',
      }),
      Footer({ num: 3 })
    )
  ),

  // ====== SLIDE 4 — MARKET ENTRY (Internal Alignment) ======
  e(
    Page,
    { size: landscape, style: s.page },
    e(
      View,
      { style: s.padded },
      SectionHead({ num: "02", title: "Market Entry Readiness (cont.)" }),
      Reflection({
        prompt:
          "Do early conversations with prospects feel curious (nice to have) or urgent (need to have)?",
      }),
      PhaseLabel({ label: "Phase C: Internal Alignment Signals" }),
      e(
        Text,
        { style: s.body },
        "Misalignment shows up as chaos during launch week."
      ),
      CheckItem({
        label:
          'The "North Star" Check: Does the Founder, Product Lead, and Marketing Lead agree on the "One Metric That Matters" for this launch?',
      }),
      CheckItem({
        label:
          "The Pitch Check: If we separated the team into different rooms, would everyone describe the product\u2019s value proposition the exact same way?",
      }),
      Callout({
        text: 'If you answered "No" to the Internal Alignment questions, stop. Do not launch yet. Solving this friction now costs $0. Solving it after launch costs your reputation.',
      }),
      Footer({ num: 4 })
    )
  ),

  // ====== SLIDE 5 — AUDIENCE DEFINITION ======
  e(
    Page,
    { size: landscape, style: s.page },
    e(
      View,
      { style: s.paddedDark },
      SectionHead({
        num: "03",
        title: "Audience Definition (Without Personas)",
        dark: true,
      }),
      e(
        Text,
        { style: s.bodyDark },
        'Forget generic avatars like "Manager Mark, 35." Real buyers are defined by their anxieties, specific triggers, and jobs-to-be-done.'
      ),
      PhaseLabel({ label: "Phase A: Real Buyer vs. Imagined User" }),
      e(
        View,
        { style: s.comparisonBadDark },
        e(
          Text,
          { style: { fontSize: 10, color: C.gradeF, fontWeight: "bold" } },
          "The Imagined User"
        ),
        e(
          Text,
          { style: { fontSize: 10, color: C.darkText } },
          '"Anyone who needs X." \u2014 Too vague, leads to expensive, ineffective marketing.'
        )
      ),
      e(
        View,
        { style: s.comparisonGoodDark },
        e(
          Text,
          { style: { fontSize: 10, color: C.gradeA, fontWeight: "bold" } },
          "The Real Buyer"
        ),
        e(
          Text,
          { style: { fontSize: 10, color: C.darkText } },
          "Has specific context, hard constraints, and a compelling reason to care right now."
        )
      ),
      PhaseLabel({ label: 'Phase B: The "Trigger" Profile' }),
      CheckItem({
        label:
          "The Trigger Event: What specific event causes them to look for a solution today?",
        dark: true,
      }),
      CheckItem({
        label:
          "The Emotional Cost: Who feels the most embarrassment, frustration, or fear if this problem isn\u2019t solved?",
        dark: true,
      }),
      CheckItem({
        label:
          "The Active Search: Where do they hang out when they are trying to learn, not just be entertained?",
        dark: true,
      }),
      Callout({
        text: "If you can\u2019t name the Trigger Event that forces a purchase, you don\u2019t have a target audience yet. Go back and interview 5 potential customers until you find it.",
        dark: true,
      }),
      Footer({ num: 5, dark: true })
    )
  ),

  // ====== SLIDE 6 — AUDIENCE (Focus + Early Believers) ======
  e(
    Page,
    { size: landscape, style: s.page },
    e(
      View,
      { style: s.padded },
      SectionHead({ num: "03", title: "Audience Definition (cont.)" }),
      PhaseLabel({ label: "Phase C: The Focus Test" }),
      e(
        Text,
        { style: s.body },
        "Clarity comes from exclusion. You must be brave enough to narrow your focus."
      ),
      e(
        View,
        { style: s.comparisonBad },
        e(
          Text,
          { style: { fontSize: 10, color: C.gradeF, fontWeight: "bold" } },
          "Too Broad"
        ),
        e(
          Text,
          { style: { fontSize: 10, color: C.text } },
          '"We help small businesses save money."'
        )
      ),
      e(
        View,
        { style: s.comparisonGood },
        e(
          Text,
          { style: { fontSize: 10, color: C.gradeA, fontWeight: "bold" } },
          "Focused"
        ),
        e(
          Text,
          { style: { fontSize: 10, color: C.text } },
          '"We help remote-first design agencies cut software subscription bloat by 20%."'
        )
      ),
      PhaseLabel({ label: "Phase D: Where Early Believers Hide" }),
      e(
        Text,
        { style: s.body },
        "Early adopters rarely come from mass audiences or broad ads. They usually come from:"
      ),
      Bullet({
        text: "Niche professional circles (Private Slacks, WhatsApp groups).",
      }),
      Bullet({ text: "Founder-led conversations (Direct 1-on-1s)." }),
      Bullet({
        text: 'Existing "Pain Communities" (Forums where people are already complaining about the status quo).',
      }),
      Footer({ num: 6 })
    )
  ),

  // ====== SLIDE 7 — NARRATIVE & POSITIONING ======
  e(
    Page,
    { size: landscape, style: s.page },
    e(
      View,
      { style: s.paddedDark },
      SectionHead({
        num: "04",
        title: "Narrative & Positioning Framework",
        dark: true,
      }),
      e(
        Text,
        { style: s.bodyDark },
        "Your product is the solution. Your narrative is the bridge. At this stage, positioning is not about clever slogans \u2014 it is about meaning."
      ),
      PhaseLabel({ label: "Phase A: Category Context" }),
      e(
        Text,
        { style: { ...s.bodyDark, fontWeight: "bold", marginBottom: 6 } },
        "Define Your Battlefield:"
      ),
      Bullet({
        text: "The Grouping: What will people mentally group us with?",
        dark: true,
      }),
      Bullet({
        text: "The Assumptions: What baggage comes with that category?",
        dark: true,
      }),
      Bullet({
        text: "The Stance: Are we reinforcing these assumptions or reframing them?",
        dark: true,
      }),
      Divider({ dark: true }),
      PhaseLabel({ label: "Phase B: The 3-Layer Narrative Model" }),
      Bullet({
        text: "The Problem (The Villain): What is the painful, expensive status quo? Don\u2019t describe the lack of your product \u2014 describe the presence of their pain.",
        dark: true,
      }),
      Bullet({
        text: "The Shift (The New World): What has changed that makes the old way obsolete? This provides the \u201CWhy Now?\u201D context.",
        dark: true,
      }),
      Bullet({
        text: "Your Role (The Guide): How does your product help them navigate this shift and defeat the villain?",
        dark: true,
      }),
      Callout({
        text: 'Stop trying to be "better" than the competition. Aim to be "different." Category design is about explaining the problem so clearly that the customer assumes you have the best solution.',
        dark: true,
      }),
      Footer({ num: 7, dark: true })
    )
  ),

  // ====== SLIDE 8 — AUDIENCE BUILDING BEFORE LAUNCH ======
  e(
    Page,
    { size: landscape, style: s.page },
    e(
      View,
      { style: s.padded },
      SectionHead({
        num: "05",
        title: "Audience-Building Before Launch",
      }),
      e(
        Text,
        { style: { ...s.body, fontSize: 13, fontWeight: "bold", color: C.heading, marginBottom: 8 } },
        "If you launch to an empty room, the acoustics don\u2019t matter."
      ),
      PhaseLabel({ label: "Phase A: The Strategic Imperative" }),
      Bullet({
        text: "Trust Before Transaction: People don\u2019t trust products they\u2019ve never heard of that solve problems they don\u2019t fully understand.",
      }),
      Bullet({
        text: "The Pre-Work: Create Familiarity, Trust, and Context before launch day.",
      }),
      Bullet({
        text: "Content Rule: Early content should reduce confusion, not just sell features.",
      }),
      Reflection({
        prompt:
          "What does our audience need to understand before they can care about our solution? What misconceptions do we need to correct?",
      }),
      Divider({}),
      PhaseLabel({ label: "Phase B: Founder Voice vs. Brand Voice" }),
      e(
        Text,
        { style: s.body },
        "In the early days, people trust people more than they trust logos. A founder sharing insights and building in public creates emotional context. Founder presence signals skin in the game."
      ),
      PhaseLabel({ label: "Phase C: Channel Thinking" }),
      e(
        View,
        { style: s.comparisonBad },
        e(
          Text,
          { style: { fontSize: 10, color: C.gradeF, fontWeight: "bold" } },
          "Wrong Question"
        ),
        e(
          Text,
          { style: { fontSize: 10, color: C.text } },
          '"Should we be on TikTok?" \u2014 Tactic-first thinking.'
        )
      ),
      e(
        View,
        { style: s.comparisonGood },
        e(
          Text,
          { style: { fontSize: 10, color: C.gradeA, fontWeight: "bold" } },
          "Right Question"
        ),
        e(
          Text,
          { style: { fontSize: 10, color: C.text } },
          '"Where is the conversation about [Problem] currently happening?" \u2014 Audience-first thinking.'
        )
      ),
      Callout({
        text: "Do not try to build an audience on every channel simultaneously. Pick one channel where you can be consistent and dominate the conversation there before expanding.",
      }),
      Footer({ num: 8 })
    )
  ),

  // ====== SLIDE 9 — LAUNCH SEQUENCING ======
  e(
    Page,
    { size: landscape, style: s.page },
    e(
      View,
      { style: s.paddedDark },
      SectionHead({
        num: "06",
        title: "Launch Sequencing Overview",
        dark: true,
      }),
      e(
        Text,
        { style: { ...s.bodyDark, fontSize: 13, fontWeight: "bold", marginBottom: 12 } },
        "A launch is a transition \u2014 a sequence of signals managed over time, not a single day of noise."
      ),
      PhaseLabel({ label: "Phase 1: Pre-Launch Signals (The Whisper)" }),
      Bullet({
        text: "Goal: Growing clarity and internal confidence.",
        dark: true,
      }),
      Bullet({
        text: "Action: Seeding the narrative with insiders, beta testers, and partners.",
        dark: true,
      }),
      Bullet({
        text: "Signal: If you cannot get engagement from 50 warm contacts, you will not get engagement from 5,000 strangers.",
        dark: true,
      }),
      Divider({ dark: true }),
      PhaseLabel({ label: "Phase 2: The Launch Moment (The Noise)" }),
      Bullet({
        text: "Goal: Legitimacy and starting conversations.",
        dark: true,
      }),
      Bullet({
        text: "Action: A coordinated event to capture attention and direct it to a single call-to-action.",
        dark: true,
      }),
      Bullet({
        text: "Reality Check: A good launch creates reference points. It rarely creates instant, sustainable growth on its own.",
        dark: true,
      }),
      Divider({ dark: true }),
      PhaseLabel({ label: "Phase 3: Post-Launch (The Retention)" }),
      Bullet({
        text: "Goal: Turning attention into onboarding and feedback loops.",
        dark: true,
      }),
      Bullet({
        text: 'Trap: Avoid "Post-Launch Depression." Do not chase attention instead of insight.',
        dark: true,
      }),
      Bullet({
        text: "Action: Focus on learning from the users who showed up, rather than obsessing over the ones who didn\u2019t.",
        dark: true,
      }),
      Footer({ num: 9, dark: true })
    )
  ),

  // ====== SLIDE 10 — COMMON MISTAKES ======
  e(
    Page,
    { size: landscape, style: s.page },
    e(
      View,
      { style: s.padded },
      SectionHead({
        num: "07",
        title: "Common GTM Mistakes to Avoid",
      }),
      e(
        Text,
        { style: s.body },
        "These mistakes happen because speed is often rewarded more than alignment."
      ),
      e(View, { style: { marginTop: 8 } }),
      e(
        View,
        {
          style: {
            backgroundColor: "#FEF2F2",
            borderRadius: 8,
            padding: 14,
            marginBottom: 10,
            borderLeft: `3px solid ${C.gradeF}`,
          },
        },
        e(
          Text,
          { style: { fontSize: 12, fontWeight: "bold", color: C.gradeF, marginBottom: 4 } },
          "Launching Before Clarity"
        ),
        e(
          Text,
          { style: { fontSize: 10, color: C.text, lineHeight: 1.6 } },
          'Spending budget to amplify a confusing message. Expecting marketing to "fix" a gap in product positioning never works.'
        )
      ),
      e(
        View,
        {
          style: {
            backgroundColor: "#FFF7ED",
            borderRadius: 8,
            padding: 14,
            marginBottom: 10,
            borderLeft: `3px solid ${C.gradeD}`,
          },
        },
        e(
          Text,
          { style: { fontSize: 12, fontWeight: "bold", color: C.gradeD, marginBottom: 4 } },
          "Confusing Attention with Traction"
        ),
        e(
          Text,
          { style: { fontSize: 10, color: C.text, lineHeight: 1.6 } },
          "Getting likes on Twitter does not equal user adoption. Viral posts are vanity; active users are sanity."
        )
      ),
      e(
        View,
        {
          style: {
            backgroundColor: "#FFFBEB",
            borderRadius: 8,
            padding: 14,
            marginBottom: 10,
            borderLeft: `3px solid ${C.gradeC}`,
          },
        },
        e(
          Text,
          { style: { fontSize: 12, fontWeight: "bold", color: C.gradeC, marginBottom: 4 } },
          "Overbuilding Content"
        ),
        e(
          Text,
          { style: { fontSize: 10, color: C.text, lineHeight: 1.6 } },
          "Creating a 6-month content calendar before validating if the first post resonated. Strategy should be agile, not rigid."
        )
      ),
      Footer({ num: 10 })
    )
  ),

  // ====== SLIDE 11 — WHAT CLARITY UNLOCKS + CTA ======
  e(
    Page,
    { size: landscape, style: s.page },
    e(
      View,
      { style: s.ctaPage },
      e(
        Text,
        { style: { ...s.titleLabel, textAlign: "center", marginBottom: 24 } },
        "SECTION 08"
      ),
      e(
        Text,
        { style: s.ctaTitle },
        "What Clarity Unlocks"
      ),
      e(
        Text,
        { style: { ...s.ctaBody, marginBottom: 20 } },
        "When you have GTM clarity, marketing becomes easier. You stop guessing what to say and start amplifying what works."
      ),
      e(
        View,
        { style: { marginBottom: 32, alignItems: "center" } },
        Bullet({
          text: "Better Decisions \u2014 You know what to say \u201Cno\u201D to.",
          dark: true,
        }),
        Bullet({
          text: "Stronger Trust \u2014 Your market understands you faster.",
          dark: true,
        }),
        Bullet({
          text: 'Sustainable Momentum \u2014 Move from a "spike" to a "slope" of growth.',
          dark: true,
        })
      ),
      e(
        View,
        { style: s.ctaButton },
        e(
          Text,
          { style: s.ctaButtonText },
          "Get Your GTM Score \u2192 sylvapoint.vercel.app/audit"
        )
      ),
      e(
        Text,
        {
          style: {
            fontSize: 11,
            color: C.darkMuted,
            textAlign: "center",
            marginTop: 16,
          },
        },
        "This blueprint gives you the right questions.\nThe answers determine your survival."
      ),
      e(
        View,
        { style: { ...s.titleFooter, bottom: -120 } },
        e(Text, { style: s.titleBrand }, "SYLVAPOINT"),
        e(Text, { style: s.titleUrl }, "sylvapoint.vercel.app/work-with-me")
      )
    )
  )
);

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------
async function main() {
  const outDir = path.resolve(__dirname, "../public/downloads");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outPath = path.join(outDir, "gtm-clarity-blueprint.pdf");
  await renderToFile(BlueprintPDF, outPath);
  console.log(`PDF generated: ${outPath}`);
}

main().catch((err) => {
  console.error("Failed to generate PDF:", err);
  process.exit(1);
});
