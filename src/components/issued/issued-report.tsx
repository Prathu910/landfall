"use client";

import { useEffect, useState } from "react";
import { occupationIndex } from "@/components/data/occupation-index";
import { issuedFlagKey } from "@/lib/checkout/issued-flag";
import {
  correctionState,
  reviseMessage,
  tokenFromHash,
} from "@/lib/checkout/report-window";
import type { Profile } from "@/lib/migration";
import { NOT_ADVICE } from "@/lib/orders/seller";
import { toReportOccupation } from "../data/report-occupation";
import {
  useOccupationCore,
  useOccupationDetail,
} from "../data/use-occupation-core";
import { ReportView } from "../report/report-renderer";
import { EditAnswers } from "./edit-answers";
import { IssuedMoment } from "./issued-moment";
import { ReportState } from "./report-states";
import { useIssuedReport } from "./use-issued-report";
import styles from "./issued-report.module.css";

const REPORT_ID = "report-start";

/** The issued mark from the checkout: read once, then removed. */
function useIssuedMark(token: string | null, ready: boolean) {
  const [hint, setHint] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    if (!token || !ready) return;
    let cancelled = false;
    void issuedFlagKey(token)
      .then((key) => {
        const value = sessionStorage.getItem(key);
        sessionStorage.removeItem(key);
        if (!cancelled && value !== null) setHint(value || null);
      })
      .catch(() => {
        /* No mark, no moment: the report shows as on any later visit. */
      });
    return () => {
      cancelled = true;
    };
  }, [token, ready]);
  return hint;
}

/** /report/: the issued report behind the link token in the hash. */
export function IssuedReport() {
  // undefined until the hash is read after hydration; null for a bad link.
  const [token, setToken] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    const read = () => setToken(tokenFromHash(window.location.hash));
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);
  const report = useIssuedReport(token ?? null);
  const status =
    token === undefined
      ? "loading"
      : token === null
        ? "not-found"
        : report.status;
  const payload = status === "report" ? report.payload : undefined;
  const code = payload?.profile.occupation || null;
  const occupation = toReportOccupation(
    useOccupationCore(code, occupationIndex),
    useOccupationDetail(code, occupationIndex),
  );
  const hint = useIssuedMark(token ?? null, !!payload);
  const [editing, setEditing] = useState(false);
  const [patch, setPatch] = useState<Partial<Profile>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  // The PDF renderer waits for this: the print tree is complete once set.
  useEffect(() => {
    if (payload) document.body.dataset.ready = "true";
  }, [payload]);
  if (!payload || !report.profile || !payload.meta)
    return (
      <ReportState
        status={status === "report" ? "error" : status}
        onRetry={report.reload}
      />
    );
  const meta = payload.meta;
  const stored = report.profile;
  const window7 = correctionState(meta, new Date().toISOString());
  const save = async (profile: Profile) => {
    setBusy(true);
    const reply = await report.revise(profile);
    setBusy(false);
    setMessage(reviseMessage(reply));
    if (reply.kind === "revised") {
      setEditing(false);
      setPatch({});
    }
  };
  const answered = Object.keys(patch).length > 0;
  const shown = answered
    ? { ...payload, profile: { ...payload.profile, ...patch } }
    : payload;
  const note = window7.finalLine
    ? window7.finalLine
    : `Your personal report, built from your answers. Report ${meta.reportNo}, version ${meta.version}.`;
  return (
    <>
      {hint !== undefined && (
        <IssuedMoment
          name={payload.profile.name}
          reportNo={meta.reportNo}
          issuedAt={meta.issuedAt}
          dataAsAt={payload.source.snapshotDate}
          hint={hint}
          reportId={REPORT_ID}
        />
      )}
      {message && !editing && (
        <p className={`${styles.notice} no-print`} role="status">
          {message}
        </p>
      )}
      <div id={REPORT_ID} tabIndex={-1} className={styles.report}>
        <ReportView
          payload={shown}
          occupation={occupation}
          mode="issued"
          comparisonIndex={occupationIndex}
          toolbarNote={note}
          onEdit={window7.open ? () => setEditing(true) : undefined}
          onAnswer={
            window7.open
              ? (answer) => setPatch((p) => ({ ...p, ...answer }))
              : undefined
          }
        />
      </div>
      {answered && window7.open && (
        <div
          className={`${styles.saveBar} no-print`}
          role="region"
          aria-label="Update your report"
        >
          <p>
            Update your report with these answers? It uses 1 of your{" "}
            {window7.revisionsLeft} corrections.
          </p>
          <div>
            <button
              type="button"
              className={styles.button}
              onClick={() => setPatch({})}
              disabled={busy}
            >
              Discard
            </button>
            <button
              type="button"
              className={`${styles.button} ${styles.primary}`}
              onClick={() => void save({ ...stored, ...patch })}
              disabled={busy}
              aria-busy={busy || undefined}
            >
              Update my report
            </button>
          </div>
        </div>
      )}
      <p className={`${styles.fine} no-print`}>{NOT_ADVICE}</p>
      {window7.open && (
        <EditAnswers
          key={meta.version}
          opened={editing}
          profile={stored}
          asOf={payload.asOf}
          revisionsLeft={window7.revisionsLeft}
          busy={busy}
          message={editing ? message : ""}
          onClose={() => {
            setEditing(false);
            setMessage("");
          }}
          onSave={(profile) => void save(profile)}
        />
      )}
    </>
  );
}
