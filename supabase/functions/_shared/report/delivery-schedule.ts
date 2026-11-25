// When report-deliver tries a failed step again.

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;
const BACKOFF_MINUTES = [5, 15, 60];
const LIMITED_QUICK_RETRIES = 3;

/** 5, 15 and 60 minutes, then daily. */
export function backoff(attempts: number, now: number): number {
  const minutes = BACKOFF_MINUTES[attempts];
  return now + (minutes === undefined ? DAY : minutes * MINUTE);
}

/** The next 00:05 UTC, after Cloudflare's daily browser time resets. */
export function nextReset(now: number): number {
  const day = new Date(now);
  const today = Date.UTC(
    day.getUTCFullYear(),
    day.getUTCMonth(),
    day.getUTCDate(),
    0,
    5,
  );
  return today > now ? today : today + DAY;
}

/**
 * Ruling R7: a 429 is either the day's limit or 3 browsers at once, so it
 * retries at +15 minutes up to 3 times before waiting for the reset.
 */
export function limitedRetry(attempts: number, now: number): number {
  return attempts < LIMITED_QUICK_RETRIES ? now + 15 * MINUTE : nextReset(now);
}
