import Link from "next/link";
import type { LinkedNote } from "../../lib/report/copy";
import styles from "./note-with-link.module.css";

/** A caveat followed by a link to the methodology section that explains it. */
export function NoteWithLink({
  note,
  className,
}: {
  note: LinkedNote;
  className: string;
}) {
  return (
    <p className={className}>
      {note.text}{" "}
      <Link className={styles.link} href={note.link.href}>
        {note.link.text}
      </Link>
    </p>
  );
}
