"use client";

import { useState } from "react";
import { Alert, Button, Drawer } from "@mantine/core";
import { answersError } from "@/lib/check-validation";
import type { Profile } from "@/lib/migration";
import { resetStateRelativeAnswers } from "@/lib/state-answers";
import { CheckFlowTheme } from "../check/check-flow-theme";
import { CheckProfileStep } from "../check/check-profile-step";
import { CheckStudyStep } from "../check/check-study-step";
import { CheckWorkStep } from "../check/check-work-step";
import styles from "./issued-report.module.css";

type Props = {
  opened: boolean;
  /** The stored answers (ruling R4). */
  profile: Profile;
  asOf: string;
  revisionsLeft: number;
  busy: boolean;
  message: string;
  onClose: () => void;
  onSave: (profile: Profile) => void;
};

/** "Edit answers": the check form, pre-filled, in a dialog over the report. */
export function EditAnswers(props: Props) {
  const [draft, setDraft] = useState(props.profile);
  const [error, setError] = useState("");
  const update = <K extends keyof Profile>(key: K, value: Profile[K]) => {
    setDraft((p) => resetStateRelativeAnswers(p, { ...p, [key]: value }));
    setError("");
  };
  const save = () => {
    const problem = answersError(draft, props.asOf);
    if (problem) return setError(problem);
    props.onSave(draft);
  };
  return (
    <Drawer
      opened={props.opened}
      onClose={props.onClose}
      title="Edit your answers"
      position="right"
      size="min(100%, 46rem)"
      trapFocus
      returnFocus
      lockScroll
      closeOnEscape
      classNames={{ content: styles.drawer, title: styles.drawerTitle }}
    >
      <CheckFlowTheme>
        <form
          className={styles.editForm}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
        >
          <p className={styles.note}>
            Saving rebuilds your report from the same data month and emails the
            new PDF. You have {props.revisionsLeft}{" "}
            {props.revisionsLeft === 1 ? "correction" : "corrections"} left.
          </p>
          <fieldset className={styles.editStep}>
            <legend>Your profile</legend>
            <CheckProfileStep
              profile={draft}
              update={update}
              asOf={props.asOf}
            />
          </fieldset>
          <fieldset className={styles.editStep}>
            <legend>English and study</legend>
            <CheckStudyStep profile={draft} update={update} asOf={props.asOf} />
          </fieldset>
          <fieldset className={styles.editStep}>
            <legend>Work and details</legend>
            <CheckWorkStep profile={draft} update={update} asOf={props.asOf} />
          </fieldset>
          {(error || props.message) && (
            <Alert role="alert" color="red" variant="light" radius="md">
              {error || props.message}
            </Alert>
          )}
          <div className={styles.editActions}>
            <Button variant="subtle" color="dark" onClick={props.onClose}>
              Cancel
            </Button>
            <Button type="submit" color="ink" radius="md" loading={props.busy}>
              Save and rebuild my report
            </Button>
          </div>
        </form>
      </CheckFlowTheme>
    </Drawer>
  );
}
