"use client";
import { Button } from "@mantine/core";
import styles from "./home-controls.module.css";

export function HomeAction({
  href,
  children,
  secondary = false,
}: {
  href: string;
  children: React.ReactNode;
  secondary?: boolean;
}) {
  return (
    <Button
      component="a"
      data-home-action={secondary ? "secondary" : "primary"}
      href={href}
      className={`${styles.action} ${secondary ? styles.secondary : styles.primary}`}
      radius="xl"
      size="lg"
    >
      {children}
    </Button>
  );
}
