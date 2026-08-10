/**
 * Input sanitization utilities
 * Prevents prompt injection, XSS, and oversized inputs
 */

const MAX_TEXT_LENGTH = 10000;
const MAX_QUERY_LENGTH = 500;
const MAX_TITLE_LENGTH = 200;

// Strip potential prompt injection patterns
function stripPromptInjection(text: string): string {
  return text
    .replace(/ignore\s+previous\s+instructions?/gi, "")
    .replace(/system\s*:\s*/gi, "")
    .replace(/\[INST\]/gi, "")
    .replace(/<<SYS>>/gi, "")
    .replace(/<\|im_start\|>/gi, "")
    .replace(/<\|im_end\|>/gi, "");
}

// Strip HTML/script tags
function stripHtml(text: string): string {
  return text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/javascript:/gi, "");
}

export function sanitizeText(text: string, maxLength = MAX_TEXT_LENGTH): string {
  if (!text || typeof text !== "string") return "";
  return stripHtml(stripPromptInjection(text.trim())).slice(0, maxLength);
}

export function sanitizeQuery(query: string): string {
  if (!query || typeof query !== "string") return "";
  return stripHtml(stripPromptInjection(query.trim())).slice(0, MAX_QUERY_LENGTH);
}

export function sanitizeTitle(title: string): string {
  return sanitizeText(title, MAX_TITLE_LENGTH);
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length < 254;
}

export function validateUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return ["http:", "https:"].includes(u.protocol);
  } catch { return false; }
}

// Check for suspiciously large payloads
export function checkPayloadSize(obj: unknown, maxBytes = 50000): boolean {
  try {
    return JSON.stringify(obj).length <= maxBytes;
  } catch { return false; }
}
