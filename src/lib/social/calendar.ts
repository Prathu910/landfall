import { dated189Sentence, datedLead } from "../occupation-page/answer";
import { occupationPath } from "../occupation-page/slug";
import { poolSentence } from "../occupation-page/summary";
import { dayText } from "../updates/format";
import { NOT_ADVICE, siteUrl } from "./launch-common";
import type { LaunchPack } from "./launch-types";
import type { OccupationInput } from "./occupation-post";

/**
 * calendar.md: ten days, one feed post a day in the evening, India time,
 * then a day of stories only. Posts go in their numbered order, so the
 * pinned posts 1, 4 and 7 land on days 1, 4 and 7.
 */

type Day = {
  post: number | null;
  time: string;
  stories: string[];
  why: string;
};

const NEW_POST = "`stories/04-new-post.png` sharing the day's post";
const POLL =
  "`stories/01-poll.png` with a poll sticker: Under 65 / 65 to 75 / 80 to 90 / 95 or more";
const QUIZ =
  "`stories/02-quiz.png` with a quiz sticker: Fewer than 20 EOIs, from 0 to 19 (correct) / Exactly 20 EOIs / No EOIs at all / 20 or more EOIs";
const LINK =
  "`stories/03-link.png` with a link sticker to https://migratelens.com/check/";

const DAYS: Day[] = [
  {
    post: 1,
    time: "7:30 pm",
    stories: [LINK, NEW_POST],
    why: "The first post says what the account is for; pinned, it stays first for every new visitor.",
  },
  {
    post: 2,
    time: "8:00 pm",
    stories: [NEW_POST, POLL],
    why: "The newest 189 round is the most current data in the pack, so it goes out early.",
  },
  {
    post: 3,
    time: "8:00 pm",
    stories: [NEW_POST],
    why: "Completes the month: the 190 and 491 by state and the occupation spotlight, while the month is still the newest.",
  },
  {
    post: 4,
    time: "7:30 pm",
    stories: [POLL, NEW_POST],
    why: "Evergreen and worth saving; pinned for anyone who lands on the profile.",
  },
  {
    post: 5,
    time: "8:30 pm",
    stories: [NEW_POST],
    why: "The next question after points: which visa, and who nominates.",
  },
  {
    post: 6,
    time: "8:00 pm",
    stories: [QUIZ, NEW_POST],
    why: "Explains “<20” and the other terms before the state and occupation posts use them.",
  },
  {
    post: 7,
    time: "7:30 pm",
    stories: [LINK, NEW_POST],
    why: "Answers “Is 65 points enough?” from the newest round; pinned.",
  },
  {
    post: 8,
    time: "8:30 pm",
    stories: [NEW_POST],
    why: "The first state spotlight, once readers know what a month-end count of invited EOIs is.",
  },
  {
    post: 9,
    time: "8:00 pm",
    stories: [NEW_POST, LINK],
    why: "The first occupation spotlight; its comments start the “comment your occupation” replies.",
  },
  {
    post: null,
    time: "7:30 pm",
    stories: [LINK, POLL],
    why: "No new feed post: share the poll results, answer the comments and see in Insights which hour and post did well.",
  },
];

/** The weekday and date of day `offset` after `start` (YYYY-MM-DD, read in UTC). */
function dateOf(start: string, offset: number): string {
  const date = new Date(`${start}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  const weekday = date.toLocaleDateString("en-AU", {
    weekday: "short",
    timeZone: "UTC",
  });
  return `${weekday} ${dayText(date.toISOString().slice(0, 10))}`;
}

/** A dated reply for one occupation, from its page's own sentences. */
export function replyExample(input: OccupationInput): string {
  const { core } = input;
  const round = core.rounds189.length > 0 ? `${dated189Sentence(core)} ` : "";
  const pool = datedLead(core, poolSentence(core.name, core));
  return `${round}${pool} Every figure: ${siteUrl(occupationPath(core))} ${NOT_ADVICE}`;
}

function dayLines(pack: LaunchPack, start: string): string[] {
  return DAYS.flatMap((day, i) => {
    const post = day.post ? pack.posts[day.post - 1] : null;
    const pin = post?.pinned ? " Pin it straight after posting." : "";
    return [
      `### Day ${i + 1}: ${dateOf(start, i)}`,
      "",
      post
        ? `- **Feed, ${day.time} IST:** post ${day.post}, ${post.title} (\`${post.slug}/\`).${pin}`
        : `- **Feed:** none.`,
      `- **Stories, from ${day.time} IST:** ${day.stories.join("; ")}.`,
      `- **Why this slot:** ${day.why}`,
      "",
    ];
  });
}

/** calendar.md, starting on `start`, with a reply example for the occupation spotlight. */
export function calendarMarkdown(
  pack: LaunchPack,
  start: string,
  example: string,
): string {
  return [
    "# Launch calendar: 10 days",
    "",
    "One feed post a day at 7 to 9 pm India time (IST), in the posts' own order, so the pinned posts 1, 4 and 7 go out on days 1, 4 and 7. Every time is a starting point: after day 10, Insights shows which hour worked, and later posts keep that hour. Shift every date together if the launch moves.",
    "",
    "If a new 189 round or a new month's data is merged during these days, post its new set instead of an older one; the pack's figures are dated, so an older post is still correct for its date.",
    "",
    "## Pinning",
    "",
    "Pin post 1 on day 1, post 4 on day 4 and post 7 on day 7. After pinning post 7, check that the pinned row reads 1, 4, 7 from the left; if it doesn't, unpin and pin them again until it does.",
    "",
    "## Days",
    "",
    ...dayLines(pack, start),
    "## Replying to “comment your occupation”",
    "",
    "1. Find the occupation at https://migratelens.com/occupations/ (search by name or ANZSCO code).",
    "2. Reply with its dated figures from the top of its page: the latest 189 round that listed it and its cut-off, and the pool as at the data month. Copy the dates exactly as the page shows them.",
    "3. End with the page link and “General information, not migration advice.”",
    "4. If the occupation has no published data, say so plainly and link https://migratelens.com/occupations/.",
    "",
    "Rules for every reply:",
    "",
    "- Never promise an outcome or say anyone will be invited; past cut-offs are history, not a promise.",
    "- Never assess someone's own case or tell them what to do; point them to the free check at https://migratelens.com/check/, and for advice to a registered migration agent (https://www.mara.gov.au/).",
    "- Counts are EOIs, not individuals; “<20” is 0 to 19 and may be zero.",
    "",
    "Example reply:",
    "",
    `> ${example}`,
    "",
  ].join("\n");
}
