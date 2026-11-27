import {
  MARK_VIEWBOX,
  markSvgBody,
} from "../../../src/components/brand/mark-geometry";
import type { AvatarCard } from "../../../src/lib/social/launch-types";

/** The profile picture: the logo mark centred on guilloche paper, inside the circular crop. */
export function ProfileAvatar({ card }: { card: AvatarCard }) {
  return (
    <div className="avatar">
      <div className="guill" />
      <svg
        className="avatar-mark"
        viewBox={MARK_VIEWBOX}
        role="img"
        aria-label={card.name}
        data-circle=""
        dangerouslySetInnerHTML={{ __html: markSvgBody("var(--ink)") }}
      />
    </div>
  );
}
