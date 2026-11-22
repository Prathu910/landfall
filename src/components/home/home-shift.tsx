import { labelName, type OutlookLabel } from "@/lib/outlook/labels";
import styles from "./home-shift.module.css";
const short: Record<OutlookLabel, string> = {
  competitive: "COMP.",
  "very-strong": "V.STRONG",
  strong: "STRONG",
  "long-wait": "WAIT",
  "not-invited": "NOT INV.",
  "not-eligible": "NOT ELIG.",
  "not-open": "NOT OPEN",
  "no-data": "NO DATA",
};
export function HomeShift({
  from,
  to,
}: {
  from: { points: number; label: OutlookLabel };
  to: { points: number; label: OutlookLabel };
}) {
  return (
    <svg
      className={styles.shift}
      viewBox="-6 -4 286 78"
      role="img"
      aria-label={`From ${from.points} points, ${labelName(from.label)}, to ${to.points} points, ${labelName(to.label)}`}
    >
      {[from, to].map((item, index) => {
        const x = index * 158;
        const text = `${item.points} ${short[item.label]}`;
        return (
          <g
            key={index}
            className={styles[item.label]}
            transform={`rotate(${index ? 3 : -4} ${x + 56} 35)`}
          >
            <rect
              x={x}
              y="10"
              width="118"
              height="50"
              rx="8"
              fill="white"
              stroke="currentColor"
              strokeWidth="3"
            />
            <text
              x={x + 59}
              y="42"
              textAnchor="middle"
              fontWeight="900"
              fontSize={Math.min(19, 104 / (text.length * 0.55))}
              fill="currentColor"
            >
              {text}
            </text>
          </g>
        );
      })}
      <path
        d="M124 35 H150 L143 30 M150 35 L143 40"
        fill="none"
        stroke="var(--homepage-ink)"
        strokeWidth="2.5"
      />
    </svg>
  );
}
