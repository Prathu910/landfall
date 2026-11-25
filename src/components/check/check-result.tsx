"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@mantine/core";
import { ArrowLeft } from "lucide-react";
import { checkoutBeats } from "@/lib/checkout/beats";
import { canBuy } from "@/lib/checkout/teaser";
import type { OccupationCore } from "@/lib/data/types";
import type { Profile } from "@/lib/migration";
import type { Quote } from "@/lib/orders/contract";
import type { FreeResult } from "@/lib/outlook/free-result";
import { CheckoutStep } from "../checkout/checkout-step";
import { FreeResultSpread } from "../checkout/free-result-spread";
import { getQuote } from "../checkout/transport";
import styles from "./check-result.module.css";

type Props = {
  free: FreeResult;
  sample: boolean;
  profile: Profile;
  asOf: string;
  /** The occupation's published record, once loaded. */
  core: OccupationCore | null;
  occupationName: string;
  whereLine: string;
  occupationsWithData: number;
  stateCount: number;
  onEdit: () => void;
};

/** /check/'s last screen: the free result, then the checkout in place. */
export function CheckResult(props: Props) {
  const { sample, core, occupationName } = props;
  const root = useRef<HTMLDivElement>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [checkout, setCheckout] = useState(false);
  // The server found no report to issue: the result says so, with no ticket.
  const [noData, setNoData] = useState(false);
  const free: FreeResult = noData
    ? {
        kind: "points-only",
        points: props.free.points,
        reason: "unavailable",
        note: null,
      }
    : props.free;
  const offered = canBuy(free) && !sample;
  // Move focus to the result, as the steps move it to each step's heading.
  useEffect(() => {
    if (!checkout)
      root.current?.querySelector("h2")?.focus({ preventScroll: true });
  }, [checkout]);
  // The pass shows the founding count and the price, from the quote only.
  useEffect(() => {
    if (!offered) return;
    let cancelled = false;
    getQuote()
      .then((next) => !cancelled && setQuote(next))
      .catch(() => {
        /* The pass keeps its skeleton; the checkout asks again. */
      });
    return () => {
      cancelled = true;
    };
  }, [offered]);
  const onNoData = useCallback(() => {
    setNoData(true);
    setCheckout(false);
  }, []);
  if (checkout && core && free.kind === "stamps")
    return (
      <div ref={root} className={styles.result}>
        <CheckoutStep
          profile={props.profile}
          asOf={props.asOf}
          reader={{
            occupationName,
            points: free.points.base,
            onshore: props.profile.onshore,
          }}
          beats={checkoutBeats({
            occupationName,
            points: free.points.base,
            core,
            occupationsWithData: props.occupationsWithData,
            stateCount: props.stateCount,
          })}
          initialQuote={quote}
          onBack={() => setCheckout(false)}
          onNoData={onNoData}
        />
      </div>
    );
  return (
    <div ref={root} className={styles.result}>
      <Button
        className={styles.edit}
        variant="subtle"
        color="dark"
        leftSection={<ArrowLeft size={16} aria-hidden />}
        onClick={props.onEdit}
      >
        Edit my answers
      </Button>
      <FreeResultSpread
        result={free}
        quote={quote}
        onOpenCheckout={() => setCheckout(true)}
        occupationName={occupationName}
        whereLine={props.whereLine}
        sample={sample}
      />
    </div>
  );
}
