import Link from "next/link";
import type { ReactNode } from "react";
import type {
  NotableView,
  NotListedView,
  PoolView,
} from "@/lib/updates/data-view";
import type { RecapView } from "@/lib/updates/recap-view";
import type { RoundView } from "@/lib/updates/round-view";
import { DistributionCard } from "./distribution-card";
import { MoveList } from "./move-list";
import { NotListedCard } from "./not-listed-card";
import { NotableTable } from "./notable-table";
import { PoolChart } from "./pool-chart";
import { RecapBand, type BandTone } from "./recap-band";
import { RoundTable } from "./round-table";
import { SectionHead, type HeadStamp } from "./section-head";
import styles from "./round-section.module.css";

const HEADING_ID = "s189-heading";
const KICKER = "189 · Skilled Independent";
const STAMP: HeadStamp = {
  top: "SUBCLASS",
  word: "189",
  bottom: "INDEPENDENT",
};

function RoundBlock({
  round,
  first,
  aside,
}: {
  round: RoundView;
  first: boolean;
  aside: ReactNode;
}) {
  return (
    <div className={first ? undefined : styles.earlier}>
      <SectionHead
        headingId={first ? HEADING_ID : `s189-${round.date}`}
        kicker={first ? KICKER : "Earlier 189 round"}
        title={round.heading}
        lead={round.lead}
        stamp={first ? STAMP : undefined}
      />
      <div className={aside ? styles.grid : `${styles.grid} ${styles.single}`}>
        <DistributionCard round={round} />
        {aside}
      </div>
      {!first && <RoundTable round={round} />}
    </div>
  );
}

function CutoffMoves({ moves }: { moves: NonNullable<RoundView["moves"]> }) {
  return (
    <div className={styles.moves}>
      <MoveList list={moves.fell} />
      <MoveList list={moves.rose} />
    </div>
  );
}

/**
 * The 189 section: each of the month's rounds, newest first, and once the
 * month's data is in, the pool by points, the notable table and the large
 * pools the round didn't list, then every occupation the round listed.
 * Cut-off moves sit here only when the page has no movers section.
 */
export function RoundSection({
  tone,
  rounds,
  noRound,
  pool,
  notable,
  notListed,
  showCutoffMoves,
}: {
  tone: BandTone;
  rounds: RoundView[];
  noRound: RecapView["noRound"];
  pool: PoolView | null;
  notable: NotableView | null;
  notListed: NotListedView | null;
  showCutoffMoves: boolean;
}) {
  const [newest, ...earlier] = rounds;
  const moves = showCutoffMoves && newest?.moves;
  const aside = pool ? (
    <PoolChart pool={pool} />
  ) : moves ? (
    <CutoffMoves moves={moves} />
  ) : null;
  return (
    <RecapBand id="s189" tone={tone} labelledBy={HEADING_ID}>
      {newest ? (
        <RoundBlock round={newest} first aside={aside} />
      ) : (
        <>
          <SectionHead
            headingId={HEADING_ID}
            kicker={KICKER}
            title="The 189 pool"
            stamp={STAMP}
            lead={
              noRound && (
                <>
                  {noRound.text}.
                  {noRound.href && (
                    <>
                      {" "}
                      <Link href={noRound.href}>Read that round’s update</Link>.
                    </>
                  )}
                </>
              )
            }
          />
          {pool && (
            <div className={`${styles.grid} ${styles.single}`}>
              <PoolChart pool={pool} />
            </div>
          )}
        </>
      )}
      {notable && <NotableTable notable={notable} />}
      {notListed && <NotListedCard notListed={notListed} />}
      {newest && <RoundTable round={newest} />}
      {newest && (
        <p className={styles.hubLink}>
          Each occupation’s cut-off across the last four rounds:{" "}
          <Link href="/occupations/189-cut-offs/">
            189 cut-offs by occupation
          </Link>
          .
        </p>
      )}
      {earlier.map((round) => (
        <RoundBlock key={round.date} round={round} first={false} aside={null} />
      ))}
    </RecapBand>
  );
}
