"use client";

import { useEffect, useRef } from "react";
import { Button } from "@mantine/core";
import { ArrowLeft } from "lucide-react";
import type { FreeResult } from "@/lib/outlook/free-result";
import { FreeResultSpread } from "../checkout/free-result-spread";
import styles from "./check-result.module.css";

/** /check/'s last screen: the free result, with a way back to the answers. */
export function CheckResult({
  free,
  sample,
  occupationName,
  whereLine,
  onEdit,
}: {
  free: FreeResult;
  sample: boolean;
  occupationName: string;
  whereLine: string;
  onEdit: () => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  // Move focus to the result, as the steps move it to each step's heading.
  useEffect(() => {
    root.current?.querySelector("h2")?.focus({ preventScroll: true });
  }, []);
  return (
    <div ref={root} className={styles.result}>
      <Button
        className={styles.edit}
        variant="subtle"
        color="dark"
        leftSection={<ArrowLeft size={16} aria-hidden />}
        onClick={onEdit}
      >
        Edit my answers
      </Button>
      <FreeResultSpread
        result={free}
        // Plan 3 Task 4 fetches the quote and opens the checkout here.
        quote={null}
        onOpenCheckout={() => {}}
        occupationName={occupationName}
        whereLine={whereLine}
        sample={sample}
      />
    </div>
  );
}
