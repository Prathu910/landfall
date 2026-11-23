import { labelName, stampName, type OutlookLabel } from "@/lib/outlook/labels";
import { SHIFT_STAMP, stampTextSize } from "@/lib/outlook/stamp-geometry";
import styles from "./home-shift.module.css";

/** "70 COMPETITIVE", sized by the report's shift-stamp geometry. */
function shiftText(points: number, label: OutlookLabel) {
  const text = `${points} ${stampName(label)}`.toUpperCase();
  const size = stampTextSize(
    text,
    SHIFT_STAMP.textWidth,
    SHIFT_STAMP.textMax,
    SHIFT_STAMP.floor,
  );
  return { text, size };
}

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
        const { text, size } = shiftText(item.points, item.label);
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
              fill="var(--homepage-paper)"
              stroke="currentColor"
              strokeWidth="3"
            />
            <text
              x={x + 59}
              y={35 + size * 0.36}
              textAnchor="middle"
              fontWeight="900"
              fontSize={size}
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
