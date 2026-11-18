"use client";
import { useState } from "react";
import type { Profile } from "../../lib/migration";
import type { StateOutlookView } from "../../lib/report/state-outlook-view";
import { keepAskedQuestions } from "../../lib/state-outlook/questions";
import { SharpenForm } from "./sharpen-form";
import { StateOutlook } from "./state-outlook";

/**
 * The state outlook with the optional questions under it. Without `onAnswer`
 * (the sample report) the answers are shown read-only.
 */
export function StateOutlookSection({
  view,
  profile,
  onAnswer,
}: {
  view: StateOutlookView;
  profile: Profile;
  onAnswer?: (patch: Partial<Profile>) => void;
}) {
  // A question stays in the form once shown, even after its answer settles
  // the rule, so the field never disappears while it is being typed in.
  const [shown, setShown] = useState(view.questions);
  const questions = keepAskedQuestions(shown, view.questions);
  if (questions.length !== shown.length) setShown(questions);
  return (
    <>
      <StateOutlook
        subtitle={view.subtitle}
        summaryByVisa={view.summaryByVisa}
        tilesByVisa={view.tilesByVisa}
        panelsByVisa={view.panelsByVisa}
        anyStateByVisa={view.anyStateByVisa}
        defaultVisa={view.defaultVisa}
      />
      <SharpenForm
        questions={questions}
        profile={profile}
        onChange={onAnswer ?? (() => {})}
        readOnly={onAnswer === undefined}
      />
    </>
  );
}
