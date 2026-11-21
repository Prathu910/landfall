// Shared by the report's "How we label your outlook" note and the
// methodology page, so the two never describe the labels differently.

/** The mockup's "How we label your outlook" bullets (spec 6.2 to 6.5). */
export const METHOD_LINES: readonly string[] = [
  "Very strong: your points are above every 189 cut-off in your occupation's last 3 listed rounds, and fewer than 20 EOIs score higher.",
  "Strong: your points meet every cut-off in those 3 rounds.",
  "Competitive: your points meet the lowest of those 3 cut-offs, but not all of them.",
  "Long wait: your occupation is still listed, but your points are below all 3 cut-offs.",
  "Not currently invited: your occupation wasn't listed in any of the last 4 rounds.",
  "Not eligible yet: under 65 points, or a basic requirement isn't met.",
  "190 and 491: each state is labelled from its invitations at or below your points (with nomination) over the last 3 to 6 months, and its rules. The visa takes its best state.",
  "The stamp shows your best visa. If none is Competitive or better, it covers all three.",
  "Estimated wait: an estimate from published history, never a percentage. For a submitted 189 EOI it divides the EOIs roughly ahead of you by the latest month's invitations at your score; for a state it counts the recent months with invitations at or below your points.",
  "Future points assume today's points test; the announced reforms could change them.",
];

/** The methodology page's "What we can't tell you" paragraph. */
export const METHOD_LIMITS: readonly string[] = [
  "The report's labels, from Very strong to Not currently invited, and its estimated waits are computed from published SkillSelect history: recent 189 cut-offs, the EOI pool by points and state invitations. Waits are labelled as estimates, there are no percentages, and rounds, cut-offs and state rules can change at any time, so your real result may be different.",
  "The report does not establish full visa eligibility. Age, English and assessment checks cover only a subset of the requirements, and exceptions can apply.",
];
