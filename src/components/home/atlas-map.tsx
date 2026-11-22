"use client";
import { useId, useRef, type CSSProperties } from "react";
import { ActionIcon, Button } from "@mantine/core";
import type { StateCode } from "@/lib/data/types";
import { STATE_NAMES } from "@/lib/state-outlook/context";
import geometry from "./atlas-map-geometry.json";
import styles from "./atlas-map.module.css";

const order: StateCode[] = [
  "WA",
  "NT",
  "SA",
  "QLD",
  "NSW",
  "VIC",
  "TAS",
  "ACT",
];

export function AtlasMap({
  selected,
  national,
  onSelect,
  zoom,
  onZoom,
  children,
}: {
  selected: StateCode;
  national: boolean;
  onSelect: (state: StateCode) => void;
  zoom: number;
  onZoom: (zoom: number) => void;
  children: React.ReactNode;
}) {
  const id = useId();
  const regions = useRef<Partial<Record<StateCode, SVGGElement | null>>>({});
  const width = 760 / zoom;
  const height = 600 / zoom;
  return (
    <div className="atlas-geo">
      <div className="atlas-toolbar">
        {children}
        <div className="map-tools" role="group" aria-label="Map zoom">
          <ActionIcon
            className={styles.tool}
            variant="default"
            aria-label="Zoom out"
            disabled={zoom <= 1}
            onClick={() => onZoom(Math.max(1, zoom - 0.25))}
          >
            −
          </ActionIcon>
          <ActionIcon
            className={styles.tool}
            variant="default"
            aria-label="Zoom in"
            disabled={zoom >= 2}
            onClick={() => onZoom(Math.min(2, zoom + 0.25))}
          >
            +
          </ActionIcon>
          <ActionIcon
            className={styles.tool}
            variant="default"
            aria-label="Reset map"
            disabled={zoom === 1}
            onClick={() => onZoom(1)}
          >
            ↺
          </ActionIcon>
        </div>
      </div>
      <div className="map-canvas">
        <svg
          className="interactive-australia"
          style={{ "--atlas-face": `url(#${id}face)` } as CSSProperties}
          viewBox={`${(760 - width) / 2} ${(600 - height) / 2} ${width} ${height}`}
          role="group"
          aria-labelledby={`${id}title ${id}description`}
        >
          <title id={`${id}title`}>
            Explore Australian state nomination evidence
          </title>
          <desc id={`${id}description`}>
            Choose a state with Enter or Space. Arrow keys move between states.
            Equivalent state buttons are below the map. Selection updates the
            published invitation evidence.
          </desc>
          <defs>
            <path id={`${id}country`} d={geometry.country} />
            <linearGradient id={`${id}face`} x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="var(--homepage-paper)" />
              <stop offset="1" stopColor="var(--homepage-color-eef3ee)" />
            </linearGradient>
            <filter
              id={`${id}shadow`}
              x="-30%"
              y="-30%"
              width="180%"
              height="180%"
            >
              <feGaussianBlur stdDeviation="11" />
            </filter>
          </defs>
          <g transform="translate(42 28) rotate(-8 320 260)">
            <use
              href={`#${id}country`}
              fill="var(--homepage-color-607a68)"
              opacity=".18"
              transform="translate(0 29)"
              filter={`url(#${id}shadow)`}
            />
            <use
              href={`#${id}country`}
              fill="var(--homepage-color-a9b9ac)"
              transform="translate(0 15)"
            />
            <use
              href={`#${id}country`}
              fill="var(--homepage-color-c0cec3)"
              transform="translate(0 9)"
            />
            <use
              href={`#${id}country`}
              fill="var(--homepage-color-d3dfd5)"
              transform="translate(0 4)"
            />
            {order.map((state) => {
              const shape = geometry.regions[state];
              return (
                <g
                  key={state}
                  ref={(el) => {
                    regions.current[state] = el;
                  }}
                  className="map-region"
                  data-atlas-state={state}
                  role="button"
                  tabIndex={0}
                  aria-label={STATE_NAMES[state]}
                  aria-pressed={!national && selected === state}
                  onClick={() => onSelect(state)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelect(state);
                    }
                    if (
                      [
                        "ArrowRight",
                        "ArrowLeft",
                        "ArrowUp",
                        "ArrowDown",
                      ].includes(event.key)
                    ) {
                      event.preventDefault();
                      const offset = ["ArrowRight", "ArrowDown"].includes(
                        event.key,
                      )
                        ? 1
                        : -1;
                      regions.current[
                        order[
                          (order.indexOf(state) + offset + order.length) %
                            order.length
                        ]
                      ]?.focus();
                    }
                  }}
                >
                  <title>{STATE_NAMES[state]}</title>
                  <path className="state-face" d={shape.path} />
                  {state === "ACT" && (
                    <>
                      <path
                        d={geometry.regions.ACT.connector}
                        fill="none"
                        stroke="var(--homepage-color-92a396)"
                        strokeWidth="1.2"
                        pointerEvents="none"
                      />
                      <circle className="state-face" cx="650" cy="420" r="24" />
                    </>
                  )}
                  <text className="state-label" x={shape.x} y={shape.y}>
                    {state}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
        <div className="map-instruction" aria-hidden="true">
          <span>↖</span> Pick a state. See the evidence.
        </div>
        <small className="map-compass" aria-hidden="true">
          N<br />↑
        </small>
      </div>
      <div
        className="state-picker"
        role="group"
        aria-label="Choose a state or territory"
      >
        {order.map((state) => (
          <Button
            className={styles.state}
            key={state}
            variant="default"
            aria-label={STATE_NAMES[state]}
            aria-pressed={!national && selected === state}
            onClick={() => onSelect(state)}
          >
            {state}
          </Button>
        ))}
      </div>
      <p className="map-note">
        Tap a state or use its button. Selection highlights geography, not
        eligibility.
      </p>
    </div>
  );
}
