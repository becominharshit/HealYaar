/**
 * Pure Healthcare UI & RAG Formatting Helpers
 * - ISO timestamp to clean local date formatting ("25 Nov 2026")
 * - RAG stop-word filter for matched-keyword badges
 * - Deep English fallback merger for multilingual translations
 */

export const RAG_STOP_WORDS = new Set<string>([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'else', 'when', 'while',
  'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'shall', 'should', 'can', 'could', 'may', 'might', 'must',
  'of', 'in', 'to', 'for', 'with', 'on', 'at', 'from', 'by', 'about', 'as', 'into', 'like', 'through', 'after', 'over', 'between', 'out', 'against', 'during', 'without', 'before', 'under', 'around', 'among',
  'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'you', 'your', 'yours', 'he', 'him', 'his', 'she', 'her', 'hers', 'it', 'its', 'they', 'them', 'their',
  'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'how', 'why', 'where', 'there', 'here',
  'not', 'no', 'nor', 'so', 'too', 'very', 'just', 'also', 'more', 'most', 'some', 'any', 'all', 'both', 'each', 'few', 'other', 'such', 'only', 'own', 'same', 'than', 'now', 'tell', 'please', 'help', 'know', 'explain', 'mean', 'means', 'meaning', 'give', 'get', 'take', 'make', 'use'
]);

/**
 * Filters out common English stop-words and tiny noise tokens from RAG keyword lists.
 */
export function filterRAGStopWords(keywords: string[]): string[] {
  if (!Array.isArray(keywords)) return [];
  const seen = new Set<string>();
  const cleaned: string[] = [];

  for (const raw of keywords) {
    const token = String(raw || '').trim().toLowerCase();
    if (!token || token.length < 2) continue;
    if (RAG_STOP_WORDS.has(token)) continue;
    if (/^\d+$/.test(token)) continue;
    if (!seen.has(token)) {
      seen.add(token);
      cleaned.push(token);
    }
  }
  return cleaned;
}

const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * Formats ISO timestamps (e.g., "2026-11-25T00:00:00+00:00" or "2026-11-25")
 * into crisp human-readable dates like "25 Nov 2026".
 */
export function formatDisplayDate(rawDate: string | Date | null | undefined): string {
  if (!rawDate) return 'Recent';

  if (rawDate instanceof Date) {
    if (isNaN(rawDate.getTime())) return 'Recent';
    return `${rawDate.getDate()} ${SHORT_MONTHS[rawDate.getMonth()]} ${rawDate.getFullYear()}`;
  }

  const trimmed = String(rawDate).trim();
  if (!trimmed) return 'Recent';

  // Match YYYY-MM-DD prefix first so timezone offsets don't shift calendar dates by 1 day
  const isoDateMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDateMatch) {
    const year = parseInt(isoDateMatch[1], 10);
    const monthIdx = parseInt(isoDateMatch[2], 10) - 1;
    const day = parseInt(isoDateMatch[3], 10);
    if (monthIdx >= 0 && monthIdx <= 11 && day >= 1 && day <= 31) {
      return `${day} ${SHORT_MONTHS[monthIdx]} ${year}`;
    }
  }

  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    return `${parsed.getDate()} ${SHORT_MONTHS[parsed.getMonth()]} ${parsed.getFullYear()}`;
  }

  return trimmed;
}

/**
 * Recursively merges a regional translation dictionary over the English baseline
 * so that missing or blank ("") strings ALWAYS fall back to English.
 */
export function mergeTranslationWithFallback<T extends Record<string, any>>(
  englishBase: T,
  regionalOverride?: Partial<T> | null
): T {
  if (!regionalOverride) return englishBase;

  const result: Record<string, any> = {};

  for (const key of Object.keys(englishBase)) {
    const baseVal = englishBase[key];
    const overrideVal = (regionalOverride as Record<string, any>)[key];

    if (baseVal && typeof baseVal === 'object' && !Array.isArray(baseVal)) {
      result[key] = mergeTranslationWithFallback(
        baseVal,
        overrideVal && typeof overrideVal === 'object' ? overrideVal : undefined
      );
    } else if (typeof overrideVal === 'string' && overrideVal.trim().length > 0) {
      result[key] = overrideVal;
    } else {
      result[key] = baseVal;
    }
  }

  return result as T;
}
