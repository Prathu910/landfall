// The changed lines between two page texts, for an issue's before/after
// excerpt. Relative imports: runs under tsx.

const MAX_LINE = 300;
// The line-by-line comparison's table size; longer pages use a set difference.
const MAX_DIFF_CELLS = 4_000_000;

const clip = (line: string) =>
  line.length <= MAX_LINE ? line : `${line.slice(0, MAX_LINE)}…`;

function lcsOps(before: string[], after: string[]): string[] {
  const width = after.length + 1;
  // common[i * width + j]: the longest common run of before[i..] and after[j..].
  const common = new Uint32Array((before.length + 1) * width);
  for (let i = before.length - 1; i >= 0; i--)
    for (let j = after.length - 1; j >= 0; j--)
      common[i * width + j] =
        before[i] === after[j]
          ? common[(i + 1) * width + j + 1] + 1
          : Math.max(common[(i + 1) * width + j], common[i * width + j + 1]);
  const ops: string[] = [];
  let i = 0;
  let j = 0;
  while (i < before.length || j < after.length) {
    if (i < before.length && j < after.length && before[i] === after[j]) {
      i++;
      j++;
    } else if (
      j === after.length ||
      (i < before.length &&
        common[(i + 1) * width + j] >= common[i * width + j + 1])
    ) {
      ops.push(`- ${before[i++]}`);
    } else {
      ops.push(`+ ${after[j++]}`);
    }
  }
  return ops;
}

function setOps(before: string[], after: string[]): string[] {
  const kept = new Set(after);
  const had = new Set(before);
  return [
    ...before.filter((line) => !kept.has(line)).map((line) => `- ${line}`),
    ...after.filter((line) => !had.has(line)).map((line) => `+ ${line}`),
  ];
}

/** The changed lines ("- before", "+ after"), the first `max` of `total`. */
export function diffLines(
  before: string,
  after: string,
  max: number,
): { lines: string[]; total: number } {
  const a = before.split("\n");
  const b = after.split("\n");
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start++;
  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--;
    endB--;
  }
  const middleA = a.slice(start, endA);
  const middleB = b.slice(start, endB);
  const ops =
    middleA.length * middleB.length <= MAX_DIFF_CELLS
      ? lcsOps(middleA, middleB)
      : setOps(middleA, middleB);
  return { lines: ops.slice(0, max).map(clip), total: ops.length };
}
