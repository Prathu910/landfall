import { HANDLE } from "../updates/social-spec";
import { NOT_ADVICE, SITE } from "./launch-common";
import { HIGHLIGHTS } from "./stories";

/** Instagram's limits for the profile's name field and bio. */
export const NAME_LIMIT = 30;
export const BIO_LIMIT = 150;

export type ProfileOption = { name: string; bio: string; why: string };

/**
 * Three name-and-bio pairs for the founder to choose from. The name field
 * is searchable on Instagram, so each carries search words; every bio ends
 * with the not-advice line.
 */
export const PROFILE_OPTIONS: ProfileOption[] = [
  {
    name: "MigrateLens: Australia PR data",
    bio: `Your points vs real SkillSelect data, 189 · 190 · 491. Free points check below. ${NOT_ADVICE}`,
    why: "Leads with the hook of post 1 and puts “Australia PR” in the searchable name.",
  },
  {
    name: "MigrateLens · SkillSelect data",
    bio: `Australian skilled visa data, dated and sourced. Every 189 round, every month. ${NOT_ADVICE}`,
    why: "For readers who already know SkillSelect; says how often it updates.",
  },
  {
    name: "MigrateLens | 189 190 491",
    bio: `Free points check and SkillSelect figures for the 189, 190 and 491. ${NOT_ADVICE}`,
    why: "The shortest name, with the three visa numbers as search words.",
  },
];

/** `profile.md`: the options, the link and the highlight names. */
export function profileMarkdown(): string {
  const options = PROFILE_OPTIONS.flatMap((o, i) => [
    `## Option ${i + 1}`,
    "",
    `- **Name** (${o.name.length}/${NAME_LIMIT}): ${o.name}`,
    `- **Bio** (${o.bio.length}/${BIO_LIMIT}): ${o.bio}`,
    `- **Why:** ${o.why}`,
    "",
  ]);
  return [
    "# MigrateLens Instagram profile",
    "",
    `Handle: ${HANDLE}. Website field: https://${SITE}/. Profile picture: \`profile/avatar.png\`.`,
    "",
    ...options,
    "## Highlights",
    "",
    "Covers in `profile/`, in this order:",
    "",
    ...HIGHLIGHTS.map(
      (h, i) => `${i + 1}. ${h.name} (\`profile/highlight-${h.icon}.png\`)`,
    ),
    "",
    "Rounds: the round posts and their stories. Points: the points table and the poll. States: the state spotlights. How it works: the welcome post, the glossary and the link story.",
    "",
  ].join("\n");
}
