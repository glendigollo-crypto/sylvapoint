// ---------------------------------------------------------------------------
// JSON Repair — Robust parser for LLM-generated JSON
// ---------------------------------------------------------------------------
// Handles common LLM JSON issues: trailing commas, unescaped control chars,
// markdown fences, and truncated output.
// ---------------------------------------------------------------------------

/**
 * Extract and parse JSON from a Claude response string.
 * Handles markdown code fences, trailing commas, unescaped newlines in strings,
 * and other common LLM JSON quirks.
 */
export function extractJson(raw: string): unknown {
  // Find the outermost JSON object
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');

  if (start === -1 || end <= start) {
    return JSON.parse(raw.trim());
  }

  let jsonStr = raw.slice(start, end + 1);

  // Strip trailing commas before } or ]
  jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');

  // Try parsing as-is first (fast path)
  try {
    return JSON.parse(jsonStr);
  } catch {
    // Fall through to repair attempts
  }

  // Repair: escape unescaped control characters inside JSON strings
  // This handles newlines, tabs, etc. that LLMs sometimes put inside string values
  jsonStr = repairControlChars(jsonStr);

  try {
    return JSON.parse(jsonStr);
  } catch {
    // Fall through
  }

  // Repair: try removing any non-JSON text after the last complete property
  // This handles truncated output where Claude ran out of tokens mid-string
  const repaired = tryCloseJson(jsonStr);
  return JSON.parse(repaired);
}

/**
 * Escape unescaped control characters inside JSON string values.
 */
function repairControlChars(json: string): string {
  let result = '';
  let inString = false;
  let escaped = false;

  for (let i = 0; i < json.length; i++) {
    const ch = json[i];

    if (escaped) {
      result += ch;
      escaped = false;
      continue;
    }

    if (ch === '\\' && inString) {
      escaped = true;
      result += ch;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      result += ch;
      continue;
    }

    if (inString) {
      // Escape control characters that should be escaped in JSON strings
      if (ch === '\n') { result += '\\n'; continue; }
      if (ch === '\r') { result += '\\r'; continue; }
      if (ch === '\t') { result += '\\t'; continue; }
      const code = ch.charCodeAt(0);
      if (code < 0x20) { result += '\\u' + code.toString(16).padStart(4, '0'); continue; }
    }

    result += ch;
  }

  return result;
}

/**
 * Try to close truncated JSON by removing incomplete trailing content
 * and adding missing closing brackets/braces.
 */
function tryCloseJson(json: string): string {
  // Count open brackets and braces
  let depth = 0;
  let inString = false;
  let escaped = false;
  let lastValidEnd = 0;
  const stack: string[] = [];

  for (let i = 0; i < json.length; i++) {
    const ch = json[i];

    if (escaped) { escaped = false; continue; }
    if (ch === '\\' && inString) { escaped = true; continue; }

    if (ch === '"') {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (ch === '{') { stack.push('}'); depth++; }
      else if (ch === '[') { stack.push(']'); depth++; }
      else if (ch === '}' || ch === ']') {
        stack.pop();
        depth--;
        if (depth === 0) lastValidEnd = i;
      }
      // Track last position after a complete value
      if (ch === ',' || ch === ':' || ch === '}' || ch === ']') {
        lastValidEnd = i;
      }
    }
  }

  // If balanced, return as-is
  if (stack.length === 0) return json;

  // Truncate to last valid position and close open brackets
  let result = json.slice(0, lastValidEnd + 1);

  // Remove any trailing comma
  result = result.replace(/,\s*$/, '');

  // Close remaining open brackets/braces
  while (stack.length > 0) {
    result += stack.pop();
  }

  return result;
}
