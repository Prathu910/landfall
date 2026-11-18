"use client";
import { useState } from "react";
import { Checkbox } from "@mantine/core";
import { calculatePoints, type Profile } from "@/lib/migration";
import { applyScenarios, buildScenarios } from "@/lib/scenarios";
import { AnimatedNumber } from "../reveal";

export function ScenariosSection({
  profile,
  asOf,
  label,
}: {
  profile: Profile;
  asOf: string;
  label: string;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const current = calculatePoints(profile, asOf);
  const assumed = calculatePoints(
    applyScenarios(profile, selected, asOf),
    asOf,
  );
  const change = assumed.base - current.base;
  return (
    <section className="report-section" id="scenarios">
      <span className="section-label">{label}</span>
      <h2>What could change your score</h2>
      <p>
        Compare hypothetical qualifying changes together. We recalculate your
        score, including the employment cap. This does not assess whether a
        credential or work period qualifies.
      </p>
      <div className="scenario-grid">
        {buildScenarios(profile, asOf).map((s) => (
          <div
            className="scenario-card"
            key={s.id}
            data-selected={selected.includes(s.id)}
          >
            <Checkbox
              label={s.title}
              checked={selected.includes(s.id)}
              onChange={(e) => {
                const checked = e.currentTarget.checked;
                setSelected((ids) =>
                  checked ? [...ids, s.id] : ids.filter((id) => id !== s.id),
                );
              }}
            />
            <p>{s.description}</p>
          </div>
        ))}
      </div>
      <div className="scenario-result" aria-live="polite">
        <div>
          <span>Hypothetical federal points</span>
          <strong>
            <AnimatedNumber value={assumed.base} />
          </strong>{" "}
          <span className="pill">
            {change > 0 ? "+" : ""}
            {change} points
          </span>
        </div>
        <div>
          Current {current.base} → Scenario {assumed.base}
          <br />
          {assumed.subclass190} if 190 nominated
          <br />
          {assumed.subclass491} if 491 nominated / sponsored
        </div>
      </div>
      <p className="data-caption">
        No future completion date, cost, invitation or evidence approval is
        assumed. The reality check and visa panels above use your current score.
      </p>
    </section>
  );
}
