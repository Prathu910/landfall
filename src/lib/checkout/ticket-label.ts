/** A trailing "→" is decoration; screen readers would read it as "right arrow". */
const ARROW = /[\s ]*→\s*$/;

/** A ticket button's accessible name: its title, then its meta, without the arrow. */
export function ticketLabel(title: string, meta: string): string {
  const words = title.replace(ARROW, "").trim();
  const extra = meta.trim();
  return extra ? `${words}, ${extra}` : words;
}
