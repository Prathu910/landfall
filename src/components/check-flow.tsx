"use client";

import {
  persistCheckProfile,
  clearSavedProfile,
  migrateLegacyProfile,
  STORAGE_KEY,
} from "@/lib/profile-storage";
import { useEffect, useState, useRef } from "react";
import { START_OVER, TRY_SAMPLE_ANSWERS } from "@/lib/check-actions";
import { Alert, Button, Progress } from "@mantine/core";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Check,
  LockKeyhole,
  ScanLine,
} from "lucide-react";
import {
  emptyProfile,
  calculatePoints,
  localToday,
  type Profile,
} from "@/lib/migration";
import { sampleReportProfile } from "@/lib/sample";
import { resetStateRelativeAnswers, restoreProfile } from "@/lib/state-answers";
import type { ReportSource } from "@/lib/data/report-source";
import { publishedOccupationCode } from "@/lib/data/occupation-url";
import { occupationIndex } from "./data/occupation-index";
import { toReportOccupation } from "./data/report-occupation";
import {
  useOccupationCore,
  useOccupationDetail,
} from "./data/use-occupation-core";
import { Report } from "./report";
import { CheckReviewStep } from "./check-review-step";
import { CheckProfileStep } from "./check/check-profile-step";
import { CheckStudyStep } from "./check/check-study-step";
import { CheckWorkStep } from "./check/check-work-step";
import { CalculationEmail } from "./submissions/calculation-email";
import { configuredSubmissions } from "./submissions/config";
import { useSubmission } from "./submissions/use-submission";
import {
  PRIVACY_VERSION,
  validEmail,
  normalizeEmail,
} from "@/lib/submissions/contract";
import { calculationSummary } from "@/lib/submissions/summary";
import { CheckFlowTheme } from "./check/check-flow-theme";
import { CheckPointsPreview } from "./check/check-points-preview";
import styles from "./check-flow.module.css";

const STEPS = [
  "Your profile",
  "English & study",
  "Work & details",
  "Your overview",
];

function isProfile(value: unknown): value is Profile {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (
    !Object.entries(emptyProfile).every(
      ([key, base]) => typeof v[key] === typeof base,
    )
  )
    return false;
  return (
    ["unknown", "competent", "proficient", "superior"].includes(
      String(v.english),
    ) &&
    ["unknown", "none", "trade", "bachelor", "doctorate"].includes(
      String(v.qualification),
    ) &&
    ["unknown", "single", "citizen", "skilled", "english", "none"].includes(
      String(v.partner),
    )
  );
}

export function CheckFlow({ source }: { source: ReportSource }) {
  const [profile, setProfile] = useState<Profile>({ ...emptyProfile });
  const [step, setStep] = useState(0);
  const [sampleRun, setSampleRun] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [token, setToken] = useState("");
  const [verification, setVerification] = useState(0);
  const capture = useSubmission("calculation");
  const config = configuredSubmissions();
  const [asOf, setAsOf] = useState("2026-11-17");
  const [save, setSave] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [report, setReport] = useState(false);
  const [error, setError] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const reduceMotion = useReducedMotion();
  // Browser-only state (local date, opt-in saved profile, ?occupation=) is read
  // after hydration so the statically exported HTML matches the first render.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- post-hydration sync with browser storage
    setAsOf(localToday());
    try {
      migrateLegacyProfile(localStorage);
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (isProfile(parsed)) {
          setProfile(restoreProfile(parsed));
          setSave(true);
        }
      }
    } catch {
      /* A blocked store never prevents the free check. */
    }
    const code = new URLSearchParams(window.location.search).get("occupation");
    if (code && occupationIndex.some((o) => o.code === code))
      // A saved profile's work answers were about its own occupation.
      setProfile((p) =>
        resetStateRelativeAnswers(p, { ...p, occupation: code }),
      );
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try {
      persistCheckProfile(localStorage, profile, save, sampleRun);
    } catch {
      /* Optional local saving may be unavailable. */
    }
  }, [profile, save, loaded, sampleRun]);
  const result = calculatePoints(profile, asOf);
  // Fetched as soon as an occupation is chosen, so the report is usually ready.
  const publishedCode = publishedOccupationCode(
    profile.occupation,
    occupationIndex,
  );
  const occupation = toReportOccupation(
    useOccupationCore(publishedCode, occupationIndex),
    useOccupationDetail(publishedCode, occupationIndex),
  );
  // Every answer goes through here, so the opt-in saving effect applies to all
  // and answers about the state you live in, or about the occupation, reset
  // when that changes.
  const updateMany = (patch: Partial<Profile>) => {
    setProfile((p) => resetStateRelativeAnswers(p, { ...p, ...patch }));
    setError("");
  };
  const update = <K extends keyof Profile>(key: K, value: Profile[K]) =>
    updateMany({ [key]: value });
  const changeStep = (next: number) => {
    if (next === step) return;
    setToken("");
    setStep(next);
    setError("");
  };
  const clear = () => {
    setToken("");
    setError("");
    setSampleRun(false);
    setEmail("");
    setEmailError("");
    capture.reset();
    setProfile({ ...emptyProfile });
    setSave(false);
    setReport(false);
    changeStep(0);
    clearSavedProfile(localStorage);
  };
  const next = async () => {
    if (capture.pending) return;
    if (
      step === 0 &&
      (!profile.dob || result.missing.includes("Date of birth"))
    )
      return setError("Enter a valid date of birth, on or before today.");
    if (step === 0 && !profile.occupation)
      return setError("Choose your occupation, or select points check only.");
    if (
      step === 1 &&
      (profile.english === "unknown" || profile.qualification === "unknown")
    )
      return setError("Choose your English level and highest qualification.");
    if (step === 1 && profile.englishDate > asOf)
      return setError("Your English test date cannot be in the future.");
    if (step === 2 && profile.partner === "unknown")
      return setError("Choose the partner category that describes you.");
    if (
      step === 2 &&
      (profile.assessmentDate > asOf ||
        profile.eoiDate > asOf ||
        (profile.professionalYear && profile.professionalYearDate > asOf))
    )
      return setError(
        "Assessment, EOI and completion dates cannot be in the future.",
      );
    if (step === 3) {
      if (!sampleRun) {
        if (!validEmail(email)) {
          setEmailError("Enter a valid email address to view your report.");
          document.getElementById("report-email")?.focus();
          return;
        }
        setEmailError("");
        const saved = await capture.submit(
          {
            email: normalizeEmail(email),
            summary: calculationSummary(
              profile,
              result,
              asOf,
              source.snapshotDate,
            ),
            privacy_version: PRIVACY_VERSION,
          },
          token,
          config,
        );
        if (!saved) {
          setToken("");
          setVerification((n) => n + 1);
          return;
        }
      }
      setReport(true);
      window.scrollTo({
        top: 0,
        behavior: reduceMotion ? "instant" : "smooth",
      });
    } else changeStep(step + 1);
  };
  if (report)
    return (
      <Report
        profile={profile}
        sample={sampleRun}
        asOf={asOf}
        occupation={occupation}
        comparisonIndex={occupationIndex}
        source={source}
        onAnswer={updateMany}
        readToken={sampleRun ? null : capture.readToken}
        onEdit={() => {
          setToken("");
          capture.reset();
          setReport(false);
          changeStep(3);
        }}
      />
    );
  return (
    <CheckFlowTheme>
      <div className={styles.layout}>
        <div>
          <form
            data-points-check
            className={styles.card}
            aria-busy={capture.pending}
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              void next();
            }}
          >
            <fieldset disabled={capture.pending} className={styles.fieldset}>
              <div className={styles.stepMeta}>
                <span className={styles.checkLabel}>
                  <ScanLine size={17} aria-hidden /> Your free points check
                </span>
                <span>Step {step + 1} / 4</span>
              </div>
              <Progress
                value={(step + 1) * 25}
                size={4}
                radius="xl"
                color="ink"
                aria-label={`Step ${step + 1} of 4`}
                className={styles.progress}
              />
              <div className={styles.steps} aria-label="Check progress">
                {STEPS.map((title, index) => (
                  <button
                    type="button"
                    aria-current={step === index ? "step" : undefined}
                    className={
                      step === index
                        ? styles.activeStep
                        : index < step
                          ? styles.completedStep
                          : ""
                    }
                    key={title}
                    disabled={index > step}
                    onClick={() => changeStep(index)}
                  >
                    <span>
                      {index < step ? <Check size={12} /> : index + 1}
                    </span>
                    <small>{title}</small>
                  </button>
                ))}
              </div>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: reduceMotion ? 0 : 14 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: reduceMotion ? 0 : -10 }}
                  transition={{ duration: reduceMotion ? 0 : 0.18 }}
                  onAnimationComplete={() =>
                    heading.current?.focus({ preventScroll: true })
                  }
                >
                  <h2 className={styles.title} tabIndex={-1} ref={heading}>
                    {
                      [
                        "Let’s start with you.",
                        "Your English and study.",
                        "Your experience counts.",
                        "Your picture, ready to review.",
                      ][step]
                    }
                  </h2>
                  <p className={styles.intro}>
                    {
                      [
                        "Your age, occupation and location help put your points in context.",
                        "Add your English level and qualifications to build your score.",
                        "Use experience and credentials you can support with evidence.",
                        "Check the details below, then view your free personal report.",
                      ][step]
                    }
                  </p>
                  <div className={styles.fields}>
                    {step === 0 && (
                      <CheckProfileStep
                        profile={profile}
                        update={update}
                        asOf={asOf}
                      />
                    )}
                    {step === 1 && (
                      <CheckStudyStep
                        profile={profile}
                        update={update}
                        asOf={asOf}
                      />
                    )}
                    {step === 2 && (
                      <CheckWorkStep
                        profile={profile}
                        update={update}
                        asOf={asOf}
                      />
                    )}
                    {step === 3 && (
                      <CheckReviewStep
                        profile={profile}
                        result={result}
                        asOf={asOf}
                        occupationName={
                          occupationIndex.find(
                            (o) => o.code === profile.occupation,
                          )?.name ?? "Other · points check only"
                        }
                        save={save}
                        allowSave={!sampleRun}
                        onSave={setSave}
                      >
                        {sampleRun ? (
                          <Alert color="ink">
                            You’re exploring sample answers. No email or
                            calculation is saved. Use “Start a new check” below
                            to calculate your own report.
                          </Alert>
                        ) : (
                          <div className={styles.emailBox}>
                            <CalculationEmail
                              email={email}
                              onEmail={(value) => {
                                setEmail(value);
                                setEmailError("");
                                capture.clearError();
                              }}
                              error={emailError}
                              config={config}
                              generation={verification}
                              onToken={setToken}
                            />
                          </div>
                        )}
                      </CheckReviewStep>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
              {(error || capture.error) && (
                <Alert
                  role="alert"
                  color="red"
                  variant="light"
                  radius="md"
                  mt="lg"
                >
                  {error || capture.error}
                </Alert>
              )}
              <div className={styles.actions}>
                <Button
                  type="button"
                  variant="subtle"
                  color="dark"
                  leftSection={
                    step > 0 ? <ArrowLeft size={16} /> : <RotateCcw size={15} />
                  }
                  onClick={() => (step > 0 ? changeStep(step - 1) : clear())}
                >
                  {step > 0 ? "Back" : START_OVER}
                </Button>
                <Button
                  type="submit"
                  size="md"
                  color="ink"
                  radius="md"
                  rightSection={<ArrowRight size={17} />}
                >
                  {capture.pending
                    ? "Saving your calculation…"
                    : step === 3
                      ? sampleRun
                        ? "View sample report"
                        : "View my free report"
                      : "Continue"}
                </Button>
              </div>
            </fieldset>
          </form>
          <div className={styles.below}>
            <span>
              <LockKeyhole size={13} /> Email needed for your personal report.
              No documents needed.
            </span>
            <Button
              variant="subtle"
              size="xs"
              color="ink"
              disabled={capture.pending}
              onClick={() => {
                setError("");
                setSave(false);
                setSampleRun(true);
                setEmail("");
                capture.clearError();
                setProfile({ ...sampleReportProfile });
                changeStep(0);
              }}
            >
              {TRY_SAMPLE_ANSWERS}
            </Button>
          </div>
          <Button
            className={styles.clear}
            variant="subtle"
            color="gray"
            size="xs"
            onClick={clear}
            disabled={capture.pending}
          >
            {sampleRun
              ? "Start a new check"
              : "Clear my answers from this device"}
          </Button>
        </div>
        <CheckPointsPreview result={result} />
      </div>
    </CheckFlowTheme>
  );
}
