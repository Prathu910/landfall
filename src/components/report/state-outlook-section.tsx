import type { Profile } from "../../lib/migration";
import type { StateOutlookView } from "../../lib/report/state-outlook-view";
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
        questions={view.questions}
        profile={profile}
        onChange={onAnswer ?? (() => {})}
        readOnly={onAnswer === undefined}
      />
    </>
  );
}
