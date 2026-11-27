import Link from "next/link";
import { SELLER } from "@/lib/orders/seller";
import type { LegalParagraph } from "@/lib/legal/copy";

/** Text with the contact address as a mail link. */
function WithEmail({ text }: { text: string }) {
  const parts = text.split(SELLER.email);
  return parts.map((part, i) => (
    <span key={i}>
      {part}
      {i < parts.length - 1 && (
        <a href={`mailto:${SELLER.email}`}>{SELLER.email}</a>
      )}
    </span>
  ));
}

/** One legal paragraph; `bare` renders its text without the <p>. */
export function LegalText({
  paragraph,
  bare = false,
}: {
  paragraph: LegalParagraph;
  bare?: boolean;
}) {
  if (typeof paragraph === "string") {
    return bare ? (
      <WithEmail text={paragraph} />
    ) : (
      <p>
        <WithEmail text={paragraph} />
      </p>
    );
  }
  const { before, link, after } = paragraph;
  const external = link.href.startsWith("http");
  return (
    <p>
      <WithEmail text={before} />{" "}
      {external ? (
        <a href={link.href} target="_blank" rel="noreferrer">
          {link.text}
        </a>
      ) : (
        <Link href={link.href}>{link.text}</Link>
      )}
      {after}
    </p>
  );
}
