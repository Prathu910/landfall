import Link from "next/link";
import { Logo } from "./logo";

/** The logo lockup as the home link, for the header and the footer. */
export function Brand({ reversed = false }: { reversed?: boolean }) {
  return (
    <Link className="brand" href="/" aria-label="MigrateLens home">
      <Logo reversed={reversed} />
    </Link>
  );
}
