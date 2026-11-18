import Link from "next/link";
import { ArrowRight } from "lucide-react";
export default function NotFound() {
  return (
    <main className="not-found" id="main">
      <h1>Page not found</h1>
      <p>
        That page isn’t here. Check the address, or go back to the homepage.
      </p>
      <Link className="button" href="/">
        Back to MigrateLens <ArrowRight size={16} />
      </Link>
    </main>
  );
}
