import Link from "next/link";
import { ArrowRight } from "lucide-react";
export default function NotFound() {
  return (
    <main className="not-found" id="main">
      <span className="eyebrow" style={{ justifyContent: "center" }}>
        A small detour
      </span>
      <h1>
        Let’s find <em>your way back.</em>
      </h1>
      <p>
        That page isn’t here. Your next chapter starts with a little clarity.
      </p>
      <Link className="button" href="/">
        Back to Landfall <ArrowRight size={16} />
      </Link>
    </main>
  );
}
