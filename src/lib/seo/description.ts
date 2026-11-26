/**
 * Meta descriptions built from whole sentences, so a search snippet never
 * ends in a mid-sentence "…" (SEO audit T-P1-2). Google shows about 155–160
 * characters; under about 120 it tends to write its own.
 */
export const DESCRIPTION_MIN = 120;
export const DESCRIPTION_MAX = 160;

/**
 * The longest prefix of `sentence` that ends at a "; " and fits `max`,
 * closed with a full stop. Our copy joins independent clauses with "; ", so
 * the prefix is a whole sentence. Never at a ",": that leaves fragments
 * such as "For 2026–27." or a partial list ("For 2026–27, QLD."). Null
 * when no such prefix fits.
 */
function clausePrefix(sentence: string, max: number): string | null {
  let best: string | null = null;
  let at = sentence.indexOf("; ");
  while (at > 0) {
    const prefix = `${sentence.slice(0, at)}.`;
    if (prefix.length > max) break;
    best = prefix;
    at = sentence.indexOf("; ", at + 1);
  }
  return best;
}

/** A paragraph's sentences: split after ".", "!" or "?" before a capital or digit. */
export function splitSentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+(?=[A-Z0-9])/).filter(Boolean);
}

/** The last resort: a word-boundary cut with "…". */
function wordCut(text: string, max: number): string {
  const cut = text.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  const trimmed = (space > 0 ? cut.slice(0, space) : cut).replace(
    /[\s,;:.]+$/,
    "",
  );
  return `${trimmed}…`;
}

/**
 * Whole `sentences` in order while they fit `max`; then `extras` (fixed,
 * true sentences) while the text is shorter than `min`. A sentence that
 * does not fit is shortened at a "; " when a whole clause fits, and
 * otherwise dropped, so the extras fill the space.
 */
export function wholeSentences(
  sentences: string[],
  extras: string[] = [],
  { min = DESCRIPTION_MIN, max = DESCRIPTION_MAX } = {},
): string {
  const parts: string[] = [];
  const length = () => parts.join(" ").length;
  const fits = (sentence: string) =>
    length() + (parts.length > 0 ? 1 : 0) + sentence.length <= max;
  for (const sentence of sentences) {
    if (fits(sentence)) {
      parts.push(sentence);
      continue;
    }
    const room = max - length() - (parts.length > 0 ? 1 : 0);
    const clause = clausePrefix(sentence, room);
    if (clause) parts.push(clause);
  }
  for (const extra of extras) {
    if (length() >= min) break;
    if (fits(extra)) parts.push(extra);
  }
  if (parts.length === 0 && sentences.length > 0) {
    return wordCut(sentences[0], max);
  }
  return parts.join(" ");
}
