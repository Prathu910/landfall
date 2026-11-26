import type { Metadata } from "next";
import {
  loadManifest,
  loadOccupationCore,
  loadOccupationDetail,
} from "@/lib/data/load-server";
import { stateRuleData } from "@/components/data/state-rule-data";
import { EXAMPLE_PROFILES } from "@/lib/outlook/examples";
import { SAMPLE_AS_OF } from "@/lib/sample";
import { buildHomeExample } from "@/lib/home/example";
import { buildHomeAtlas } from "@/lib/home/atlas";
import { listed189, listed189Codes } from "@/lib/occupation-page/summary";
import { formatMonth } from "@/lib/report/copy";
import { HomeAction } from "@/components/home/controls/home-action";
import { HomePassport } from "@/components/home/home-passport";
import { HomeAtlas } from "@/components/home/home-atlas";
import { HomeReportExample } from "@/components/home/home-report-example";
import { HomeConditions } from "@/components/home/home-conditions";
import { HomeGuideLink } from "@/components/home/home-guide-link";
import { HomeQuestions } from "@/components/home/home-questions";
import { HomeFinal } from "@/components/home/home-final";
import { sitePageMetadata } from "@/lib/seo/page-meta";
import { HOME_PAGE } from "@/lib/seo/site-pages";
import styles from "./home.module.css";

export const metadata: Metadata = sitePageMetadata(HOME_PAGE);

export default function Home() {
  const { snapshotId, asAt, checkedAt, sources } = loadManifest();
  const provenance = { snapshotId, asAt, checkedAt, sources };
  const core = loadOccupationCore("254499");
  if (!core)
    throw new Error(
      "The homepage nurse example needs its published occupation snapshot.",
    );
  const { federal } = stateRuleData;
  const national = buildHomeAtlas(
    core,
    70,
    "189",
    "NSW",
    provenance,
    listed189(core.code, federal),
  );
  const vic = buildHomeAtlas(core, 70, "190", "VIC", provenance);
  const nt = buildHomeAtlas(core, 70, "491", "NT", provenance);
  const example = buildHomeExample({
    profile: EXAMPLE_PROFILES.middle,
    core,
    detail: loadOccupationDetail(core.code),
    asOf: SAMPLE_AS_OF,
    rules: stateRuleData,
  });
  const date = formatMonth(asAt);
  const longDate = new Intl.DateTimeFormat("en-AU", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${asAt}-01T00:00:00Z`));
  return (
    <main id="main" className={styles.home}>
      <div className="wrap">
        <section className="hero" aria-labelledby="home-heading">
          <div className="hero-copy">
            <p className="pr-context">
              <span aria-hidden="true">◎</span> Australian permanent residency,
              explained
            </p>
            <h1 id="home-heading">
              Will my points
              <br />
              get me invited?
            </h1>
            <p className="lede">
              Your points. Your occupation. Your Australian outlook. Check the
              189, 190 and 491 pathways free, then get your full personal
              report.
            </p>
            <div className="ctas">
              <HomeAction href="/check/">Check my points, free</HomeAction>
              <HomeAction secondary href="/sample/">
                See an example report
              </HomeAction>
            </div>
            <p className="fine">
              Official data to {longDate}. No documents needed.
              <br />
              Your points and visa stamps are free, with no email or account.
            </p>
          </div>
          <HomePassport national={national} vic={vic} nt={nt} date={date} />
        </section>
      </div>
      <section
        className="band atlas-section"
        id="try"
        aria-labelledby="atlas-h"
      >
        <div className="wrap">
          <div className="atlas-heading">
            <div>
              <p className="atlas-kicker">The Australian picture</p>
              <h2 className="sec-h" id="atlas-h">
                Put your points on the map.
              </h2>
            </div>
            <p className="atlas-intro">
              A score is only part of the story. Explore your occupation’s
              published invitation evidence, state by state.
            </p>
          </div>
          <HomeAtlas
            initialCore={core}
            provenance={provenance}
            listed189Codes={listed189Codes(federal)}
          />
        </div>
      </section>
      <HomeReportExample example={example} date={date} />
      <HomeGuideLink />
      <HomeConditions date={longDate} />
      <HomeQuestions />
      <HomeFinal />
    </main>
  );
}
