"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";

export function Brand() {
  return <Link className="brand" href="/" aria-label="Landfall home"><svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true"><path d="M5 24V14a10 10 0 0 1 20 0v10M11 24V14a4 4 0 0 1 8 0v10M5 19h20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/><path d="m11 25 5-5 5 5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg><span>landfall<span className="brand-dot">.</span></span></Link>;
}

export function SiteHeader() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const links = [["/", "Overview"], ["/sample/", "The report"], ["/states/", "State pathways"], ["/methodology/", "Our data"]];
  return <header className="site-header"><div className="header-inner"><Brand/><nav className={open ? "main-nav is-open" : "main-nav"} aria-label="Main navigation">{links.map(([href, label]) => <Link key={href} href={href} onClick={() => setOpen(false)} aria-current={path === href || (href !== "/" && path === href.slice(0,-1)) ? "page" : undefined}>{label}</Link>)}</nav><Link href="/check/" className="button button-small header-cta">Free points check <ArrowUpRight size={15}/></Link><button className="menu-button" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={open ? "Close navigation" : "Open navigation"}>{open ? <X/> : <Menu/>}</button></div></header>;
}
