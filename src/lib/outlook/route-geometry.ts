import { labelName } from "./labels";
import type { Route, RouteDeadline } from "./route";

/** Where a deadline sits along the step axis: halfway past the step it follows. */
export function deadlinePosition(deadline: RouteDeadline, stepCount: number) {
  return Math.min(deadline.afterStep + 0.5, stepCount - 1);
}

/** Horizontal centre of step `index`, with `margin` kept clear at both ends. */
export function stepX(
  index: number,
  stepCount: number,
  width: number,
  margin: number,
): number {
  const span = width - 2 * margin;
  return margin + (stepCount < 2 ? span / 2 : (index * span) / (stepCount - 1));
}

/** Splits "Your 33rd birthday, 9 Aug 2027: −5" into a name and its date. */
export function deadlineLines(deadline: RouteDeadline): [string, string] {
  const at = deadline.title.indexOf(", ");
  if (at < 0) return [deadline.title, deadline.date];
  return [deadline.title.slice(0, at), deadline.title.slice(at + 2)];
}

/** Greedy word wrap by character count; a long single word stays whole. */
export function wrapText(text: string, maxChars: number): string[] {
  const lines: string[] = [];
  let current = "";
  for (const word of text.split(" ")) {
    const next = current ? `${current} ${word}` : word;
    if (current && next.length > maxChars) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** The text alternative for the route graphic, in step order. */
export function routeAria(route: Route): string {
  const steps = route.steps.map((step, i) => {
    const points = step.points === null ? "" : `, ${step.points} points`;
    const label = step.label ? `, ${labelName(step.label)}` : "";
    return `${i + 1}. ${step.title}${points}${label}`;
  });
  const deadlines = route.deadlines.map((d) => `${d.title}`);
  const parts = [`Your route: ${steps.join("; ")}.`];
  if (deadlines.length > 0) {
    parts.push(`Dates that work against you: ${deadlines.join("; ")}.`);
  }
  return parts.join(" ");
}
