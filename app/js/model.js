/**
 * Shared script data helpers. Used by parser, rehearsal, and the PWA.
 */

export function slugify(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "untitled";
}

export function titleCaseName(name) {
  const raw = String(name || "").trim();
  if (!raw) return "Unknown";
  const small = new Set(["of", "the", "and", "a", "an", "de", "da", "von", "van"]);
  return raw
    .toLowerCase()
    .split(/\s+/)
    .map((word, i) => {
      if (i > 0 && small.has(word)) return word;
      if (word.includes("-")) {
        return word
          .split("-")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join("-");
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

export function newId(prefix = "id") {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const CHARACTER_COLORS = [
  "#d4a84b",
  "#7eb8c9",
  "#c97e9a",
  "#8fbf7a",
  "#c9a07e",
  "#9b8fd4",
  "#e07a5f",
  "#5fb8a8",
];

export function emptyScript(overrides = {}) {
  const now = Date.now();
  return {
    id: newId("script"),
    title: "Untitled",
    sourceText: "",
    sourceType: "text",
    characters: [],
    scenes: [],
    lines: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function estimateSpeechMs(text, rate = 1) {
  const words = String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const ms = Math.max(900, (words / 2.4) * 1000);
  const safeRate = Math.min(2.5, Math.max(0.5, Number(rate) || 1));
  return Math.round(ms / safeRate);
}
