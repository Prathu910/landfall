import { RectStamp } from "../../../src/components/updates/rect-stamp";
import { RoundStamp } from "../../../src/components/updates/round-stamp";
import type { LaunchStamp as StampView } from "../../../src/lib/social/launch-types";

/** A launch card's stamp: the round frame or the rectangular visa frame. */
export function LaunchStamp({
  stamp,
  rotate,
  ink = "green",
}: {
  stamp: StampView;
  rotate: number;
  ink?: "green" | "ink";
}) {
  const className = `stamp ink-${ink}`;
  const { top, word, bottom } = stamp;
  return stamp.shape === "round" ? (
    <RoundStamp
      top={top}
      word={word}
      bottom={bottom}
      rotate={rotate}
      paper="var(--paper)"
      className={className}
    />
  ) : (
    <RectStamp
      top={top}
      word={word}
      bottom={bottom}
      rotate={rotate}
      className={className}
    />
  );
}
