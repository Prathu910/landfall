import Link from "next/link";
import { Brand } from "./site-header";
import { ArrowUpRight } from "lucide-react";

export function SiteFooter() {
  return <footer className="site-footer"><div className="container"><div className="footer-top"><div><Brand/><p>A little more clarity.<br/>For a very big decision.</p></div><div className="footer-links"><Link href="/check/">Points check</Link><Link href="/sample/">Sample report</Link><Link href="/states/">State pathways</Link><Link href="/methodology/">Methodology & sources</Link><a href="https://www.mara.gov.au/" target="_blank" rel="noreferrer">Find a registered agent <ArrowUpRight size={13}/></a></div></div><div className="footer-bottom"><p>General information, not migration advice. Landfall is independent and is not a registered migration agent or affiliated with the Australian Government.</p><span>© {new Date().getFullYear()} Landfall</span></div></div></footer>;
}
