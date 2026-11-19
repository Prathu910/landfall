"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Burger, Drawer, Button } from "@mantine/core";
import { Brand } from "@/components/brand/brand";

export function SiteHeader() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const links = [
    ["/sample/", "Sample report"],
    ["/states/", "States"],
    ["/methodology/", "Method"],
  ];
  const navLinks = links.map(([href, label]) => (
    <Link
      key={href}
      href={href}
      onClick={() => setOpen(false)}
      aria-current={
        path === href || path === href.slice(0, -1) ? "page" : undefined
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
          color="ink.9"
          size="sm"
          rightSection={<ArrowUpRight size={14} />}
        >
          Check my points
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
          Check my points
        </Button>
      </Drawer>
    </header>
  );
}
