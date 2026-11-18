import Link from "next/link";
import type { LinkedNote } from "../../lib/report/copy";

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
      {note.text} <Link href={note.link.href}>{note.link.text}</Link>
    </p>
  );
}
