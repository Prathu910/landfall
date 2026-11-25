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
import { parseProfile } from "@/lib/profile-guard";
import { resetStateRelativeAnswers, restoreProfile } from "@/lib/state-answers";
import type { ReportSource } from "@/lib/data/report-source";
import { publishedOccupationCode } from "@/lib/data/occupation-url";
import { whereLine } from "@/lib/checkout/teaser";
import { buildFreeResult } from "@/lib/outlook/free-result";
import { occupationIndex } from "./data/occupation-index";
import { occupationState, toReportOccupation } from "./data/report-occupation";
import { stateRuleData } from "./data/state-rule-data";
import {
  useOccupationCore,
  useOccupationDetail,
} from "./data/use-occupation-core";
import { CheckReviewStep } from "./check-review-step";
import { CheckProfileStep } from "./check/check-profile-step";
import { CheckStudyStep } from "./check/check-study-step";
import { CheckWorkStep } from "./check/check-work-step";
import { CheckFlowTheme } from "./check/check-flow-theme";
import { CheckResult } from "./check/check-result";
import { CheckPointsPreview } from "./check/check-points-preview";
import styles from "./check-flow.module.css";

const STEPS = [
  "Your profile",
  "English & study",
  "Work & details",
  "Your overview",
];

export function CheckFlow({ source }: { source: ReportSource }) {
  const [profile, setProfile] = useState<Profile>({ ...emptyProfile });
  const [step, setStep] = useState(0);
  const [sampleRun, setSampleRun] = useState(false);
  const [asOf, setAsOf] = useState("2026-11-17");
  const [save, setSave] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [showResult, setShowResult] = useState(false);
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
        const parsed: unknown = JSON.parse(saved);
        const restored =
          parsed && typeof parsed === "object"
            ? parseProfile(restoreProfile(parsed as Record<string, unknown>))
            : null;
        if (restored) {
          setProfile(restored);
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
  const occupationName =
    occupationIndex.find((o) => o.code === profile.occupation)?.name ??
    "Other · points check only";
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
    setStep(next);
    setError("");
  };
  const clear = () => {
    setError("");
    setSampleRun(false);
    setProfile({ ...emptyProfile });
    setSave(false);
    setShowResult(false);
    changeStep(0);
    clearSavedProfile(localStorage);
  };
  const next = () => {
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
      setShowResult(true);
      window.scrollTo({
        top: 0,
        behavior: reduceMotion ? "instant" : "smooth",
      });
    } else changeStep(step + 1);
  };
  if (showResult)
    return (
      <CheckResult
        free={buildFreeResult({
          profile,
          asOf,
          rules: stateRuleData,
          occupation: occupationState(
            profile.occupation,
            occupation,
            occupationIndex,
          ),
        })}
        sample={sampleRun}
        occupationName={occupationName}
        whereLine={whereLine(
          occupationName,
          profile.onshore,
          source.snapshotDate,
        )}
        onEdit={() => {
          setShowResult(false);
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
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              next();
            }}
          >
            <fieldset className={styles.fieldset}>
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
                        "Check the details below, then see your free result.",
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
                        occupationName={occupationName}
                        save={save}
                        allowSave={!sampleRun}
                        onSave={setSave}
                      >
                        {sampleRun && (
                          <Alert color="ink">
                            You’re exploring sample answers. Nothing is saved.
                            Use “Start a new check” below to calculate your own
                            result.
                          </Alert>
                        )}
                      </CheckReviewStep>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
              {error && (
                <Alert
                  role="alert"
                  color="red"
                  variant="light"
                  radius="md"
                  mt="lg"
                >
                  {error}
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
                  {step === 3
                    ? sampleRun
                      ? "View sample result"
                      : "View my free result"
                    : "Continue"}
                </Button>
              </div>
            </fieldset>
          </form>
          <div className={styles.below}>
            <span>
              <LockKeyhole size={13} /> No email needed for your free result. No
              documents needed.
            </span>
            <Button
              variant="subtle"
              size="xs"
              color="ink"
              onClick={() => {
                setError("");
                setSave(false);
                setSampleRun(true);
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
