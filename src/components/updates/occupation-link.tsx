import Link from "next/link";
import type { OccLink } from "@/lib/updates/round-view";

/** An occupation's name, linked to its page when it has one. */
export function OccupationLink({
  occupation,
  className,
}: {
  occupation: OccLink;
  className?: string;
}) {
  if (!occupation.href)
    return <span className={className}>{occupation.name}</span>;
  return (
    <Link href={occupation.href} className={className}>
      {occupation.name}
    </Link>
  );
}
