"use client";
import { useState } from "react";
import { Button, Loader } from "@mantine/core";
import { occupationIndex } from "@/components/data/occupation-index";
import { useOccupationCore } from "@/components/data/use-occupation-core";
import type { OccupationCore, StateCode, Visa } from "@/lib/data/types";
import { buildHomeAtlas, type HomeAtlasProvenance } from "@/lib/home/atlas";
import { formatMonth } from "@/lib/report/copy";
import { HomeOccupation } from "./controls/home-occupation";
import { HomeSegments } from "./controls/home-segments";
import { AtlasMap } from "./atlas-map";
import { AtlasEvidence } from "./atlas-evidence";

const points = [65, 70, 75, 80, 85, 90].map((value) => ({
  value: String(value),
  label: String(value),
}));
const visas = [
  {
    value: "189",
    label: (
      <>
        189 <span>Independent</span>
      </>
    ),
  },
  {
    value: "190",
    label: (
      <>
        190 <span>State</span>
      </>
    ),
  },
  {
    value: "491",
    label: (
      <>
        491 <span>Regional</span>
      </>
    ),
  },
];

export function HomeAtlas({
  initialCore,
  provenance,
}: {
  initialCore: OccupationCore;
  provenance: HomeAtlasProvenance;
}) {
  const [code, setCode] = useState(initialCore.code);
  const [basePoints, setBasePoints] = useState(70);
  const [visa, setVisa] = useState<Visa>("190");
  const [state, setState] = useState<StateCode>("NSW");
  const [zoom, setZoom] = useState(1);
  const load = useOccupationCore(
    code === initialCore.code ? null : code,
    occupationIndex,
  );
  const knownEmpty =
    occupationIndex.find((item) => item.code === code)?.hasData === false;
  const core =
    code === initialCore.code
      ? initialCore
      : load.status === "ready"
        ? load.core
        : null;
  const view = core
    ? buildHomeAtlas(core, basePoints, visa, state, provenance)
    : null;
  function chooseState(selected: StateCode) {
    setState(selected);
    if (visa === "189") setVisa("190");
  }
  return (
    <>
      <div className="atlas-controls">
        <HomeOccupation value={code} onChange={setCode} />
        <fieldset>
          <legend>Your points, before nomination</legend>
          <HomeSegments
            points
            label="Points before nomination"
            value={String(basePoints)}
            onChange={(value) => setBasePoints(Number(value))}
            data={points}
          />
        </fieldset>
      </div>
      <div className="atlas-surface">
        <AtlasMap
          selected={state}
          national={visa === "189"}
          onSelect={chooseState}
          zoom={zoom}
          onZoom={setZoom}
        >
          <HomeSegments
            label="Map visa pathway"
            value={visa}
            onChange={(value) => {
              if (value === "189" || value === "190" || value === "491")
                setVisa(value);
            }}
            data={visas}
          />
        </AtlasMap>
        {view ? (
          <AtlasEvidence view={view} code={code} />
        ) : (
          <aside
            className="atlas-passport loading-evidence"
            aria-live="polite"
            aria-busy={!knownEmpty && load.status !== "unavailable"}
          >
            {knownEmpty ? (
              <div>
                <h3>No published occupation data</h3>
                <p>
                  This occupation has no published EOI data in the{" "}
                  {formatMonth(provenance.asAt)} snapshot. Choose another
                  occupation to explore its evidence, or check your own points.
                </p>
                <a href={`/check/?occupation=${code}`}>Check my points</a>
              </div>
            ) : load.status === "unavailable" ? (
              <div>
                <h3>Published data unavailable</h3>
                <p>
                  We couldn’t load this occupation. Choose another occupation or
                  reload to try again.
                </p>
                <Button component="a" href="/" variant="outline">
                  Reload published data
                </Button>
                <Button
                  variant="subtle"
                  onClick={() => {
                    setCode(initialCore.code);
                  }}
                >
                  Back to the nurse example
                </Button>
              </div>
            ) : (
              <div>
                <Loader color="var(--homepage-ink)" aria-hidden="true" />
                <p>Loading published data…</p>
              </div>
            )}
          </aside>
        )}
      </div>
      <div className="atlas-source">
        <p>
          Fictional profiles. Real{" "}
          <a href={provenance.sources.dashboard}>SkillSelect data</a>, as at{" "}
          {formatMonth(view?.provenance.asAt ?? provenance.asAt)}. Checked{" "}
          {provenance.checkedAt}. Counts are EOIs, not unique people; masked
          ranges may include zero.
        </p>
        <a href="/methodology/">How we read the data</a>
      </div>
    </>
  );
}
