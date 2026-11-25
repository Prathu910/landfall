import type { MoveList as MoveListView } from "@/lib/updates/round-view";
import { OccupationLink } from "./occupation-link";
import parts from "./recap-parts.module.css";

/** One list of movers: an occupation and its "before → after" each. */
export function MoveList({ list }: { list: MoveListView }) {
  return (
    <div className={parts.card}>
      <h3 className={parts.cardTitle}>{list.heading}</h3>
      {list.items.length > 0 && (
        <ul className={parts.list}>
          {list.items.map((item) => (
            <li key={item.occupation.name}>
              <OccupationLink
                occupation={item.occupation}
                className={parts.name}
              />
              <span className={parts.figure}>{item.text}</span>
            </li>
          ))}
        </ul>
      )}
      <p className={parts.cap}>{list.caption}</p>
    </div>
  );
}
