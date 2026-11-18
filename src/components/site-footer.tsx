import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { loadManifest } from "@/lib/data/load-server";
import { Brand } from "./brand/brand";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function formatAsAt(asAt: string): string {
  const [year, month] = asAt.split("-");
  return `${MONTHS[Number(month) - 1]} ${year}`;
}

export function SiteFooter() {
  const asAt = formatAsAt(loadManifest().asAt);
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          <div>
            <Brand reversed />
            <p>Published SkillSelect data, as at {asAt}.</p>
          </div>
          <div className="footer-links">
            <Link href="/check/">Check my points</Link>
            <Link href="/sample/">Sample report</Link>
            <Link href="/states/">States</Link>
            <Link href="/methodology/">Method and sources</Link>
            <a href="https://www.mara.gov.au/" target="_blank" rel="noreferrer">
              Find a registered agent <ArrowUpRight size={13} />
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>
            MigrateLens gives general information from published data. We are
            not registered migration agents and don&apos;t give migration
            advice.
          </p>
          <span>© {new Date().getFullYear()} MigrateLens</span>
        </div>
      </div>
    </footer>
  );
}
