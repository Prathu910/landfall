"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Burger, Drawer, Button } from "@mantine/core";

export function Brand() {
  return (
    <Link className="brand" href="/" aria-label="Landfall home">
      <svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
        <path
          d="M5 24V14a10 10 0 0 1 20 0v10M11 24V14a4 4 0 0 1 8 0v10M5 19h20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          d="m11 25 5-5 5 5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>
        landfall<span className="brand-dot">.</span>
      </span>
    </Link>
  );
}

export function SiteHeader() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const links = [
    ["/", "Overview"],
    ["/sample/", "The report"],
    ["/states/", "State pathways"],
    ["/methodology/", "Our data"],
  ];
  const navLinks = links.map(([href, label]) => (
    <Link
      key={href}
      href={href}
      onClick={() => setOpen(false)}
      aria-current={
        path === href || (href !== "/" && path === href.slice(0, -1))
          ? "page"
          : undefined
      }
    >
      {label}
    </Link>
  ));
  return (
    <header className="site-header">
      <div className="header-inner">
        <Brand />
        <nav className="main-nav" aria-label="Main navigation">
          {navLinks}
        </nav>
        <Button
          component={Link}
          href="/check/"
          className="header-cta"
          color="forest.9"
          size="sm"
          rightSection={<ArrowUpRight size={14} />}
        >
          Free points check
        </Button>
        <Burger
          className="menu-button"
          opened={open}
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close navigation" : "Open navigation"}
          size="sm"
        />
      </div>
      <Drawer
        opened={open}
        onClose={() => setOpen(false)}
        title={<Brand />}
        size="xs"
        position="right"
        overlayProps={{ backgroundOpacity: 0.25, blur: 3 }}
      >
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {navLinks}
        </nav>
        <Button
          component={Link}
          href="/check/"
          onClick={() => setOpen(false)}
          fullWidth
          mt="xl"
        >
          Start my free check
        </Button>
      </Drawer>
    </header>
  );
}
