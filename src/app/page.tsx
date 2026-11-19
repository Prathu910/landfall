import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Doors } from "@/components/home/doors";
import { HeroDemoLoader } from "@/components/home/hero-demo-loader";
import { HomeFaqList } from "@/components/home/home-faq-list";
import { buildSampleView } from "@/components/home/sample-view";
import { ThreeQuestions } from "@/components/home/three-questions";
import { TryIt } from "@/components/home/try-it";
import { loadManifest } from "@/lib/data/load-server";
import { buildDemoContent } from "@/lib/home/demo-content";
import { HOME_COPY, trustLine } from "@/lib/home/home-copy";
import { TRY_IT_OCCUPATION } from "@/lib/home/try-it";
import styles from "./home.module.css";

export default function Home() {
  const sample = buildSampleView();
  const demo = buildDemoContent(
    sample.view,
    sample.occupationName,
    sample.points,
    sample.categories,
  );
  const { story, rules, finalCta } = HOME_COPY;
  return (
    <main id="main">
      <section
        className={`container ${styles.hero}`}
        aria-labelledby="home-heading"
      >
        <div className={styles.heroCopy}>
          <h1 id="home-heading" className={styles.headline}>
            {HOME_COPY.headline.split(/(?<=\.) /).map((sentence, index) => (
              <span key={sentence}>
                {index ? " " : null}
                {sentence}
              </span>
            ))}
          </h1>
          <p className={styles.lede}>{HOME_COPY.lede}</p>
          <Doors />
          <ul className={styles.trust}>
            {trustLine(loadManifest().asAt).map((point) => (
              <li key={point}>
                <Check size={15} aria-hidden />
                {point}
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.heroDemo}>
          <HeroDemoLoader content={demo} />
        </div>
      </section>

      <div className={`container ${styles.band}`}>
        <div className={styles.tryIt}>
          <TryIt defaultOccupation={TRY_IT_OCCUPATION} />
        </div>
      </div>

      <div className={`container ${styles.band}`}>
        <ThreeQuestions
          view={sample.view}
          occupationName={sample.occupationName}
        />
      </div>

      <section className={styles.story} aria-labelledby="story-heading">
        <div className={`container ${styles.storyInner}`}>
          <div>
            <p className={styles.label}>{story.label}</p>
            <h2 id="story-heading" className={styles.storyTitle}>
              {story.title}
            </h2>
          </div>
          <p className={styles.storyBody}>{story.body}</p>
        </div>
      </section>

      <section
        className={`container ${styles.band} ${styles.rules}`}
        aria-labelledby="rules-heading"
      >
        <h2 id="rules-heading" className={styles.heading}>
          {rules.heading}
        </h2>
        <div>
          <ul className={styles.ruleList}>
            {rules.items.map((rule) => (
              <li key={rule}>
                <Check size={18} aria-hidden />
                {rule}
              </li>
            ))}
          </ul>
          <Link className={styles.textLink} href="/methodology/">
            {rules.link}
            <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
      </section>

      <section
        id="questions"
        className={`container ${styles.band}`}
        aria-labelledby="faq-heading"
      >
        <h2 id="faq-heading" className={styles.heading}>
          {HOME_COPY.faqHeading}
        </h2>
        <HomeFaqList />
      </section>

      <section
        className={`container ${styles.band}`}
        aria-labelledby="cta-heading"
      >
        <div className={styles.cta}>
          <h2 id="cta-heading" className={styles.heading}>
            {finalCta.heading}
          </h2>
          <p className={styles.ctaBody}>{finalCta.body}</p>
          <div className={styles.ctaActions}>
            <Link className="button" href="/check/">
              {finalCta.action}
              <ArrowRight size={18} aria-hidden />
            </Link>
            <Link className={styles.textLink} href="/sample/">
              {finalCta.sample}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
