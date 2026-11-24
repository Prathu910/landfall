"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Burger, Drawer } from "@mantine/core";
import { Brand } from "@/components/brand/brand";
import { ThemeChoices } from "@/components/theme/theme-choices";
import { ThemeMenu } from "@/components/theme/theme-menu";
import { isNavigationActive, SITE_NAVIGATION } from "./site-navigation";
import styles from "./site-header.module.css";

export function SiteHeader() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1041px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  const navLinks = SITE_NAVIGATION.map(({ href, label }) => (
    <Link
      key={href}
      href={href}
      onClick={close}
      aria-current={isNavigationActive(path, href) ? "page" : undefined}
    >
      {label}
    </Link>
  ));
  return (
    <>
      <header className={`site-header ${styles.header}`}>
        <div className={styles.inner}>
          <Brand />
          <nav className={styles.navigation} aria-label="Main navigation">
            {navLinks}
          </nav>
          <ThemeMenu className={styles.themeMenu} />
          <Link
            href="/check/"
            className={`${styles.cta} ${styles.desktopCta}`}
            aria-current={
              isNavigationActive(path, "/check/") ? "page" : undefined
            }
          >
            Check my points <ArrowUpRight size={17} aria-hidden />
          </Link>
          <Burger
            className={styles.burger}
            opened={open}
            onClick={() => setOpen(!open)}
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            aria-controls="site-navigation-body"
            size={22}
            color="var(--brand-ink)"
          />
        </div>
      </header>
      <Drawer
        id="site-navigation"
        opened={open}
        onClose={close}
        title={<Brand onClick={close} />}
        size="min(100%, 420px)"
        position="right"
        classNames={{
          root: styles.drawerRoot,
          content: styles.drawer,
          header: styles.drawerHeader,
          body: styles.drawerBody,
          close: styles.close,
        }}
        closeButtonProps={{ "aria-label": "Close navigation" }}
        overlayProps={{ backgroundOpacity: 0.35, blur: 2 }}
        trapFocus
        returnFocus
        lockScroll
        closeOnEscape
      >
        <p className={styles.drawerLabel}>Explore MigrateLens</p>
        <nav className={styles.mobileNavigation} aria-label="Mobile navigation">
          {navLinks}
        </nav>
        <ThemeChoices variant="segmented" />
        <Link
          href="/check/"
          onClick={close}
          className={styles.cta}
          aria-current={
            isNavigationActive(path, "/check/") ? "page" : undefined
          }
        >
          Check my points <ArrowUpRight size={18} aria-hidden />
        </Link>
        <p className={styles.drawerNote}>
          Your points, with published SkillSelect data to put them in context.
        </p>
      </Drawer>
    </>
  );
}
