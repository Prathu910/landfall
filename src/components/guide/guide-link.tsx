import Link from "next/link";
import type { ReactNode } from "react";

/** An internal link (→) or an official page in a new tab (↗), announced as such. */
export function GuideLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  if (href.startsWith("/")) {
    return (
      <Link className={className} href={href}>
        {children} <span aria-hidden="true">→</span>
      </Link>
    );
  }
  return (
    <a className={className} href={href} target="_blank" rel="noreferrer">
      {children} <span aria-hidden="true">↗</span>
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
