import {
  AFFECTED_VISA_GROUPS,
  FEE_SOURCE_URLS,
} from "@/data/news/onshore-visa-fee-increase-2026";
import { BookOpen, Globe2, GraduationCap } from "lucide-react";
import styles from "./news.module.css";

export function VisaFeeScope() {
  return (
    <>
      <section
        id="who-pays"
        className={styles.section}
        aria-labelledby="who-heading"
      >
        <h2 id="who-heading">Who pays the extra onshore charge?</h2>
        <p>
          The rules combine three tests: where the applicant or primary
          applicant is when applying, the visa class, and the particular fee
          category. Being in Australia alone does not make every visa
          application subject to this charge.
        </p>
        <p>
          The government’s{" "}
          <a href={FEE_SOURCE_URLS.explanation}>explanatory statement</a>{" "}
          identifies these subclasses within the listed classes:
        </p>
        <div className={styles.scopeList}>
          {AFFECTED_VISA_GROUPS.map((group) => (
            <div key={group.title}>
              <h3>{group.title}</h3>
              <p>{group.visas}</p>
            </div>
          ))}
        </div>
        <p className={styles.note}>
          The partner class listed in the amendment is the 801 class; a standard
          new 820/801 application is normally combined. The charge attaches only
          to the fee categories specified in{" "}
          <a href={FEE_SOURCE_URLS.amendment}>regulation 2.12C(10)</a>.
        </p>
      </section>
      <section
        id="exemptions"
        className={styles.section}
        aria-labelledby="exemptions-heading"
      >
        <h2 id="exemptions-heading">Who is exempt?</h2>
        <p>
          Some applicants keep their existing fee arrangements. The government
          identifies these exemption cohorts; check the exact category rather
          than relying on the visa number alone.
        </p>
        <div className={styles.exemptions}>
          <div>
            <Globe2 aria-hidden="true" />
            <h3>Specified passport cohorts</h3>
            <p>
              Certain applicants with a valid passport from a specified
              Pacific-regional country.
            </p>
          </div>
          <div>
            <GraduationCap aria-hidden="true" />
            <h3>ASEAN student applicants</h3>
            <p>
              Certain Student 500 applicants with a valid passport from an ASEAN
              member country.
            </p>
          </div>
          <div>
            <BookOpen aria-hidden="true" />
            <h3>ELICOS and non-award study</h3>
            <p>
              Certain Student 500 applicants enrolled in an ELICOS or non-award
              course.
            </p>
          </div>
        </div>
        <p className={styles.note}>
          Source:{" "}
          <a href={FEE_SOURCE_URLS.explanation}>
            government explanatory statement, pages 14–15
          </a>
          . These exemptions are to the new charge; they do not mean the whole
          visa application is free.
        </p>
      </section>
    </>
  );
}
