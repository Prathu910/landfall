"use client";

import { useEffect, useState, useRef } from "react";
import {
  Alert,
  Badge,
  Button,
  Checkbox,
  NumberInput,
  Progress,
  Radio,
  Select,
  SegmentedControl,
  TextInput,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Info,
  CalendarDays,
  Check,
  Sparkles,
  LockKeyhole,
} from "lucide-react";
import {
  emptyProfile,
  sampleProfile,
  calculatePoints,
  localToday,
  formatDate,
  type Profile,
} from "@/lib/migration";
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
import styles from "./check-flow.module.css";

const STORAGE_KEY = "migratelens-profile-v1";
const STEPS = [
  "Your profile",
  "English & study",
  "Work & details",
  "Your overview",
];
const states = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"];
const example: Profile = {
  ...sampleProfile,
  onshore: true,
  state: "VIC",
  visaExpiry: "2027-09-30",
  assessmentDate: "2026-02-20",
  assessmentExpiry: "2029-02-20",
  eoiDate: "2026-03-14",
};

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
      if (save) localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* Optional local saving may be unavailable. */
    }
  }, [profile, save, loaded]);
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
    setStep(next);
    setError("");
  };
  const clear = () => {
    setProfile({ ...emptyProfile });
    setSave(false);
    setReport(false);
    changeStep(0);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
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
      setReport(true);
      window.scrollTo({
        top: 0,
        behavior: reduceMotion ? "instant" : "smooth",
      });
    } else changeStep(step + 1);
  };
  const dateField = (
    key:
      | "dob"
      | "englishDate"
      | "visaExpiry"
      | "professionalYearDate"
      | "communityLanguageExpiry"
      | "assessmentDate"
      | "assessmentExpiry"
      | "eoiDate",
    label: string,
    description?: string,
    pastOnly = false,
  ) => (
    <DateInput
      label={label}
      description={description}
      placeholder="DD MMM YYYY"
      valueFormat="DD MMM YYYY"
      clearable={key !== "dob"}
      value={profile[key] || null}
      onChange={(value) => update(key, value ?? "")}
      maxDate={pastOnly ? asOf : undefined}
      minDate="1900-01-01"
      maxLevel="decade"
      defaultDate={key === "dob" ? "1995-01-01" : asOf}
      leftSection={<CalendarDays size={16} />}
      size="md"
      radius="md"
      popoverProps={{ shadow: "md", withinPortal: true }}
      aria-required={key === "dob"}
    />
  );
  const numberField = (
    key: "overseasYears" | "australianYears",
    label: string,
  ) => (
    <NumberInput
      label={label}
      description="Completed qualifying years in the last 10 years."
      min={0}
      max={10}
      step={0.5}
      decimalScale={1}
      value={profile[key]}
      onChange={(value) =>
        update(key, Math.min(10, Math.max(0, Number(value) || 0)))
      }
      size="md"
      radius="md"
    />
  );
  if (report)
    return (
      <Report
        profile={profile}
        asOf={asOf}
        occupation={occupation}
        comparisonIndex={occupationIndex}
        source={source}
        onAnswer={updateMany}
        onEdit={() => {
          setReport(false);
          changeStep(3);
        }}
      />
    );
  return (
    <div className={styles.layout}>
      <div>
        <form
          className={styles.card}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            next();
          }}
        >
          <div className={styles.stepMeta}>
            <Badge variant="light" color="ink" radius="sm">
              Your free check
            </Badge>
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
                className={step === index ? styles.activeStep : ""}
                key={title}
                disabled={index > step}
                onClick={() => changeStep(index)}
              >
                <span>{index < step ? <Check size={12} /> : index + 1}</span>
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
                    "English. Education. Possibility.",
                    "Complete your picture.",
                    "Looking good. One last check.",
                  ][step]
                }
              </h2>
              <p className={styles.intro}>
                {
                  [
                    "A few details turn the bigger picture into your picture.",
                    "Every qualification and credential adds a little more clarity.",
                    "Use experience and credentials you can support with evidence.",
                    "Review your answers, then explore your personal overview.",
                  ][step]
                }
              </p>
              <div className={styles.fields}>
                {step === 0 && (
                  <>
                    <div className={styles.columns}>
                      <TextInput
                        label="First name (optional)"
                        autoComplete="given-name"
                        maxLength={50}
                        placeholder="What should we call you?"
                        value={profile.name}
                        onChange={(event) =>
                          update("name", event.currentTarget.value)
                        }
                        size="md"
                        radius="md"
                      />
                      {dateField(
                        "dob",
                        "Date of birth",
                        "Age points are assessed when invited.",
                        true,
                      )}
                    </div>
                    <Select
                      label="Nominated occupation"
                      description="Use the occupation in your skills assessment. Search by title or ANZSCO code."
                      placeholder="Search your occupation"
                      searchable
                      nothingFoundMessage="No match. Choose Other for a points check."
                      value={profile.occupation || null}
                      onChange={(value) => update("occupation", value ?? "")}
                      data={[
                        ...occupationIndex.map((o) => ({
                          value: o.code,
                          label: `${o.name} · ${o.code}`,
                        })),
                        {
                          value: "other",
                          label: "Other occupation · points check only",
                        },
                      ]}
                      size="md"
                      radius="md"
                      maxDropdownHeight={260}
                      aria-required
                    />
                    <div>
                      <span className={styles.fieldLabel}>
                        Where are you living?
                      </span>
                      <SegmentedControl
                        aria-label="Where are you living?"
                        fullWidth
                        value={profile.onshore ? "onshore" : "offshore"}
                        onChange={(value) =>
                          update("onshore", value === "onshore")
                        }
                        data={[
                          { value: "offshore", label: "Outside Australia" },
                          { value: "onshore", label: "In Australia" },
                        ]}
                        size="md"
                        radius="md"
                      />
                    </div>
                    {profile.onshore && (
                      <div className={styles.columns}>
                        <Select
                          label="Current state or territory"
                          placeholder="Choose your state"
                          data={states}
                          value={profile.state || null}
                          onChange={(value) => update("state", value ?? "")}
                          size="md"
                          radius="md"
                        />
                        {dateField(
                          "visaExpiry",
                          "Current visa expiry (optional)",
                        )}
                      </div>
                    )}
                  </>
                )}
                {step === 1 && (
                  <>
                    <Radio.Group
                      label="Your English proficiency"
                      value={profile.english}
                      onChange={(value) =>
                        update("english", value as Profile["english"])
                      }
                      size="md"
                      withAsterisk
                    >
                      <div className={styles.englishChoices}>
                        {[
                          {
                            value: "competent",
                            label: "Competent",
                            detail: "0 points",
                          },
                          {
                            value: "proficient",
                            label: "Proficient",
                            detail: "10 points",
                          },
                          {
                            value: "superior",
                            label: "Superior",
                            detail: "20 points",
                          },
                        ].map((option) => (
                          <label
                            className={`${styles.englishChoice} ${profile.english === option.value ? styles.selectedChoice : ""}`}
                            key={option.value}
                          >
                            <Radio
                              value={option.value}
                              aria-label={option.label}
                              size="sm"
                            />
                            <span>
                              {option.label}
                              <strong>{option.detail}</strong>
                            </span>
                          </label>
                        ))}
                      </div>
                    </Radio.Group>
                    <p className={styles.help}>
                      Choose the level demonstrated by an accepted test, or
                      Competent if you hold an eligible passport.{" "}
                      <a
                        target="_blank"
                        rel="noreferrer"
                        href="https://immi.homeaffairs.gov.au/help-support/meeting-our-requirements/english-language"
                      >
                        Check official thresholds ↗
                      </a>
                    </p>
                    {dateField(
                      "englishDate",
                      "English test date (optional)",
                      "Leave blank for passport evidence. Test results use a three-year window in this overview.",
                      true,
                    )}
                    <div className={styles.divider} />
                    <Select
                      label="Highest recognised qualification"
                      placeholder="Choose your highest qualification"
                      value={
                        profile.qualification === "unknown"
                          ? null
                          : profile.qualification
                      }
                      onChange={(value) =>
                        update(
                          "qualification",
                          (value ?? "unknown") as Profile["qualification"],
                        )
                      }
                      data={[
                        { value: "doctorate", label: "Doctorate · 20 points" },
                        {
                          value: "bachelor",
                          label: "Bachelor’s or master’s degree · 15 points",
                        },
                        {
                          value: "trade",
                          label:
                            "Australian diploma/trade, or recognised qualification · 10 points",
                        },
                        { value: "none", label: "None of these · 0 points" },
                      ]}
                      size="md"
                      radius="md"
                      aria-required
                    />
                    <Checkbox
                      label="I meet the Australian study requirement"
                      description="Qualifying study of at least two academic years over at least 16 months in Australia."
                      checked={profile.ausStudy}
                      onChange={(event) => {
                        update("ausStudy", event.currentTarget.checked);
                        if (!event.currentTarget.checked)
                          update("regionalStudy", false);
                      }}
                      size="md"
                    />
                    {profile.ausStudy && (
                      <Checkbox
                        label="I meet the regional Australian study requirement"
                        description="Living and studying in an eligible regional area during the qualifying study, excluding distance education."
                        checked={profile.regionalStudy}
                        onChange={(event) =>
                          update("regionalStudy", event.currentTarget.checked)
                        }
                        size="md"
                      />
                    )}
                    <Checkbox
                      label="I have a qualifying Australian research master’s or doctorate"
                      description="At least two academic years of eligible STEM/ICT study for specialist education points."
                      checked={profile.specialistEducation}
                      onChange={(event) =>
                        update(
                          "specialistEducation",
                          event.currentTarget.checked,
                        )
                      }
                      size="md"
                    />
                  </>
                )}
                {step === 2 && (
                  <>
                    <Alert
                      icon={<Info size={17} />}
                      color="ink"
                      variant="light"
                      radius="md"
                    >
                      Qualifying work must be paid, at least 20 hours a week,
                      and in your nominated or a closely related occupation.
                      Australian work must meet visa conditions.
                    </Alert>
                    <div className={styles.columns}>
                      {numberField(
                        "overseasYears",
                        "Overseas skilled experience",
                      )}
                      {numberField(
                        "australianYears",
                        "Australian skilled experience",
                      )}
                    </div>
                    <Select
                      label="Partner status"
                      placeholder="Choose your situation"
                      value={
                        profile.partner === "unknown" ? null : profile.partner
                      }
                      onChange={(value) =>
                        update(
                          "partner",
                          (value ?? "unknown") as Profile["partner"],
                        )
                      }
                      data={[
                        { value: "single", label: "Single · 10 points" },
                        {
                          value: "citizen",
                          label:
                            "Partner is an Australian citizen or PR · 10 points",
                        },
                        {
                          value: "skilled",
                          label:
                            "Partner meets all skilled partner requirements · 10 points",
                        },
                        {
                          value: "english",
                          label:
                            "Partner meets English-only requirements · 5 points",
                        },
                        {
                          value: "none",
                          label: "Partner meets neither category · 0 points",
                        },
                      ]}
                      size="md"
                      radius="md"
                      aria-required
                    />
                    {["skilled", "english"].includes(profile.partner) && (
                      <p className={styles.help}>
                        Partner must apply for the same visa. Skilled points
                        also require being under 45, Competent English, an
                        eligible occupation on the same list and a suitable
                        assessment. Your answer confirms these conditions.
                      </p>
                    )}
                    <Checkbox
                      label="I completed an approved Professional Year in my eligible occupation"
                      checked={profile.professionalYear}
                      onChange={(event) =>
                        update("professionalYear", event.currentTarget.checked)
                      }
                      size="md"
                    />
                    {profile.professionalYear &&
                      dateField(
                        "professionalYearDate",
                        "Professional Year completion date",
                        undefined,
                        true,
                      )}
                    <Checkbox
                      label="I hold a recognised NAATI community language credential"
                      checked={profile.communityLanguage}
                      onChange={(event) =>
                        update("communityLanguage", event.currentTarget.checked)
                      }
                      size="md"
                    />
                    {profile.communityLanguage &&
                      dateField(
                        "communityLanguageExpiry",
                        "Community language expiry (optional)",
                      )}
                    <div className={styles.divider} />
                    <h3 className={styles.sectionTitle}>
                      <CalendarDays size={18} /> Dates for your timeline{" "}
                      <Badge color="gray" variant="light" size="sm">
                        Optional
                      </Badge>
                    </h3>
                    <div className={styles.columns}>
                      {dateField(
                        "assessmentDate",
                        "Skills assessment issue date",
                        undefined,
                        true,
                      )}
                      {dateField(
                        "assessmentExpiry",
                        "Assessment expiry on letter",
                        "The earlier of this date and the three-year cap is used.",
                      )}
                    </div>
                    {dateField(
                      "eoiDate",
                      "EOI submission date",
                      "Submission date, not date of effect. Used for the two-year EOI validity window.",
                      true,
                    )}
                  </>
                )}
                {step === 3 && (
                  <>
                    <div className={styles.review}>
                      {[
                        ["Name", profile.name || "Not provided"],
                        ["Date of birth", formatDate(profile.dob)],
                        [
                          "Occupation",
                          occupationIndex.find(
                            (o) => o.code === profile.occupation,
                          )?.name ?? "Other · points check only",
                        ],
                        ["English", profile.english],
                        ["Qualification", profile.qualification],
                        [
                          "Skilled experience",
                          `${profile.overseasYears} overseas + ${profile.australianYears} Australian years`,
                        ],
                        ["Partner category", profile.partner],
                        ["189 points", String(result.base)],
                        ["Calculated on", formatDate(asOf)],
                      ].map(([key, value]) => (
                        <div key={key}>
                          <span>{key}</span>
                          <strong>{value}</strong>
                        </div>
                      ))}
                    </div>
                    <Alert
                      icon={<ShieldCheck size={18} />}
                      color="ink"
                      radius="md"
                    >
                      Your answers are self-reported. This overview explains
                      points and published data; it does not establish visa
                      eligibility or guarantee an invitation.
                    </Alert>
                    <Checkbox
                      label="Save my progress on this device"
                      description="Optional. Anyone using this browser may see saved answers. Clear them below at any time."
                      checked={save}
                      onChange={(event) => setSave(event.currentTarget.checked)}
                      size="md"
                    />
                  </>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
          {error && (
            <Alert role="alert" color="red" variant="light" radius="md" mt="lg">
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
              {step > 0 ? "Back" : "Start over"}
            </Button>
            <Button
              type="submit"
              size="md"
              color="ink"
              radius="md"
              rightSection={<ArrowRight size={17} />}
            >
              {step === 3 ? "Open my overview" : "Continue"}
            </Button>
          </div>
        </form>
        <div className={styles.below}>
          <span>
            <LockKeyhole size={13} /> No email or documents needed.
          </span>
          <Button
            variant="subtle"
            size="xs"
            color="ink"
            onClick={() => {
              setProfile({ ...example });
              changeStep(0);
            }}
          >
            Try sample answers
          </Button>
        </div>
        <Button
          className={styles.clear}
          variant="subtle"
          color="gray"
          size="xs"
          onClick={clear}
        >
          Clear my answers from this device
        </Button>
      </div>
      <aside className={styles.aside} aria-label="Live points estimate">
        <div className={styles.asideTop}>
          <span>
            <Sparkles size={15} /> Your picture, taking shape
          </span>
          <span className={styles.liveDot}>Live estimate</span>
        </div>
        <h3>
          {result.missing.length ? "Your points so far" : "Your federal points"}
        </h3>
        <div className={styles.total} aria-live="polite">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.strong
              key={result.base}
              initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduceMotion ? 0 : -12 }}
              transition={{ duration: reduceMotion ? 0 : 0.2 }}
            >
              {result.base}
            </motion.strong>
          </AnimatePresence>
          <span>
            points
            <br />
            189 · Independent
          </span>
        </div>
        <div className={styles.nomination}>
          <div>
            <strong>{result.subclass190}</strong>
            <span>190 · if nominated</span>
          </div>
          <div>
            <strong>{result.subclass491}</strong>
            <span>491 · if nominated / sponsored</span>
          </div>
        </div>
        <div className={styles.breakdown}>
          {result.categories.map((category) => (
            <div key={category.key}>
              <span>{category.label}</span>
              <strong>{category.points}</strong>
            </div>
          ))}
        </div>
        <div className={styles.privacy}>
          <ShieldCheck size={18} />
          <p>
            Your answers stay in this browser.
            <br />
            <span>Saving is optional. You’re in control.</span>
          </p>
        </div>
      </aside>
    </div>
  );
}
