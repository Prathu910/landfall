import { calculatePoints, type Profile } from "./migration";
export type Scenario = { id: string; title: string; description: string };
export function buildScenarios(p: Profile, asOf = "2026-11-17"): Scenario[] {
  const current = calculatePoints(p, asOf);
  const points = (key: string) =>
    current.categories.find((c) => c.key === key)?.points ?? 0;
  return [
    ...(points("english") < 20
      ? [
          {
            id: "english",
            title:
              p.english === "superior"
                ? "Renewed Superior English evidence"
                : "Superior English",
            description:
              "Assume a new accepted result demonstrating Superior English.",
          },
        ]
      : []),
    ...(points("community-language") < 5
      ? [
          {
            id: "language",
            title: p.communityLanguage
              ? "Renewed community language credential"
              : "Community language",
            description:
              "Assume a valid credential meeting the five-point requirement.",
          },
        ]
      : []),
    ...(p.australianYears < 8
      ? [
          {
            id: "australian-work",
            title: "Next Australian work band",
            description:
              "Compare the next qualifying employment band. No completion date is predicted.",
          },
        ]
      : []),
    ...(p.overseasYears < 8
      ? [
          {
            id: "overseas-work",
            title: "Next overseas work band",
            description:
              "Compare the next qualifying employment band within the ten-year window.",
          },
        ]
      : []),
  ];
}
export function applyScenarios(
  p: Profile,
  ids: string[],
  asOf = "2026-11-17",
): Profile {
  const next = { ...p };
  if (ids.includes("english")) {
    next.english = "superior";
    next.englishDate = asOf;
  }
  if (ids.includes("language")) {
    next.communityLanguage = true;
    next.communityLanguageExpiry = "";
  }
  if (ids.includes("australian-work"))
    next.australianYears =
      [1, 3, 5, 8].find((v) => v > p.australianYears) ?? p.australianYears;
  if (ids.includes("overseas-work"))
    next.overseasYears =
      [3, 5, 8].find((v) => v > p.overseasYears) ?? p.overseasYears;
  return next;
}
