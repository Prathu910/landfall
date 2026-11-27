import { Fragment, type CSSProperties } from "react";
import type {
  ChartScene,
  EndScene,
  HookScene,
  LinkScene,
  ReadingScene,
  Reel,
  ReelScene,
} from "../../../src/lib/social/reel-types";
import {
  estimatedLines,
  fitLines,
  fitTitleLines,
  type LinesBox,
} from "../title-fit";
import { Logo } from "./card-page";
import { LaunchStamp } from "./launch-stamp";

/**
 * One reel as a passport page holding every scene at once; the page's
 * script (reel-html.ts) plays each element's track, so a scene shows only
 * in its own seconds. Content keeps to x 132-940 and y 250-1540, clear of
 * Instagram's buttons and captions; the renderer checks each `[data-safe]`
 * box in the still layout, so a box never carries a track itself.
 */

/** The reel's content is 808px wide (reel.css). */
const WIDTH = 808;
/** Titles: up to three balanced lines (reel.css). */
const REEL_TITLE: LinesBox = {
  sizes: [104, 96, 88, 80],
  width: WIDTH,
  maxLines: 3,
};
/** Two lines: the chart's title, so the bars have room, and the reading's. */
const TWO_LINES: LinesBox = {
  sizes: [96, 88, 80],
  width: WIDTH,
  maxLines: 2,
};
/** The hook's forced lines, each kept whole: three lines at most. */
const HOOK_TITLE = {
  sizes: [132, 120, 112, 104, 96, 88, 80],
  width: WIDTH,
  height: 400,
};
/** The tallest bar (reel.css `.rtrack`). */
const BAR_MAX = 420;

/** The address, breakable only after a "/", as the launch link card. */
function Url({ url }: { url: string }) {
  const parts = url.split(/(?<=\/)/);
  return (
    <span>
      {parts.map((part, i) => (
        <Fragment key={i}>
          <span className="nowrap">{part}</span>
          {i < parts.length - 1 ? <wbr /> : null}
        </Fragment>
      ))}
    </span>
  );
}

function Title({
  anim,
  text,
  box = REEL_TITLE,
}: {
  anim: string;
  text: string;
  box?: LinesBox;
}) {
  return (
    <h1 className="title fit" data-anim={anim} style={fitTitleLines(text, box)}>
      {text}
    </h1>
  );
}

function Hook({ scene }: { scene: HookScene }) {
  const { size } = fitLines(scene.title.lines, HOOK_TITLE);
  const wraps = scene.title.lines.some(
    (line) => estimatedLines(line, size, WIDTH) > 1,
  );
  return (
    <div className="scene-body" data-safe="" data-cover="">
      <h1
        className={wraps ? "title hook-title" : "title hook-title nowrap"}
        data-anim={scene.title.anim}
        style={{ fontSize: size }}
      >
        {scene.title.lines.map((line) => (
          <span className="line" key={line}>
            {line}
          </span>
        ))}
      </h1>
      <p className="reel-sub" data-anim={scene.sub.anim}>
        {scene.sub.text}
      </p>
      <div className="reel-stamp hook-stamp" data-anim={scene.stamp.anim}>
        <LaunchStamp stamp={scene.stamp.stamp} rotate={-6} />
      </div>
    </div>
  );
}

function Chart({ scene }: { scene: ChartScene }) {
  return (
    <div className="scene-body" data-safe="">
      <div className="eyebrow" data-anim={scene.eyebrow.anim}>
        {scene.eyebrow.text}
      </div>
      <Title {...scene.title} box={TWO_LINES} />
      <h3 className="reel-heading" data-anim={scene.heading.anim}>
        {scene.heading.text}
      </h3>
      <div className="rchart" data-anim={scene.chartAnim}>
        {scene.bars.map((bar) => (
          <div className={bar.strong ? "rcol strong" : "rcol"} key={bar.label}>
            <b className="rvalue" data-anim={bar.valueAnim}>
              <span data-count={bar.count}>{bar.value}</span>
            </b>
            <span className="rtrack">
              <span
                className="rbar"
                data-anim={bar.anim}
                style={
                  { height: Math.max(6, bar.share * BAR_MAX) } as CSSProperties
                }
              />
            </span>
            <span className="rlabel">{bar.label}</span>
          </div>
        ))}
      </div>
      <p className="reel-axis" data-anim={scene.axis.anim}>
        {scene.axis.text}
      </p>
    </div>
  );
}

function Reading({ scene }: { scene: ReadingScene }) {
  return (
    <div className="scene-body" data-safe="">
      <div className="eyebrow" data-anim={scene.eyebrow.anim}>
        {scene.eyebrow.text}
      </div>
      <Title {...scene.title} box={TWO_LINES} />
      <p className="reel-sub" data-anim={scene.lead.anim}>
        {scene.lead.text}
      </p>
      <p className="reel-emphasis" data-anim={scene.emphasis.anim}>
        {scene.emphasis.text}
      </p>
    </div>
  );
}

function Link({ scene }: { scene: LinkScene }) {
  return (
    <div className="scene-body" data-safe="">
      <div className="eyebrow" data-anim={scene.eyebrow.anim}>
        {scene.eyebrow.text}
      </div>
      <Title {...scene.title} />
      <p className="reel-sub" data-anim={scene.sub.anim}>
        {scene.sub.text}
      </p>
      <div className="visa-label reel-label" data-anim={scene.label.anim}>
        <span className="visa-label-head">{scene.label.text}</span>
        <div className="link-url reel-url">
          <Url url={scene.url} />
        </div>
      </div>
    </div>
  );
}

function End({ scene }: { scene: EndScene }) {
  return (
    <div className="scene-body end-body" data-safe="">
      <div data-anim={scene.anim}>
        <div className="end-logo">
          <Logo />
        </div>
        <div className="reel-stamp end-stamp" data-anim={scene.stamp.anim}>
          <LaunchStamp stamp={scene.stamp.stamp} rotate={-6} />
        </div>
        <h1 className="title end-title">{scene.title}</h1>
        <div className="end-url">
          <span>{scene.url}</span>
        </div>
        <div className="end-handle">{scene.handle}</div>
        <p className="end-disclaim">{scene.disclaimer}</p>
      </div>
    </div>
  );
}

function Scene({ scene }: { scene: ReelScene }) {
  switch (scene.kind) {
    case "hook":
      return <Hook scene={scene} />;
    case "chart":
      return <Chart scene={scene} />;
    case "reading":
      return <Reading scene={scene} />;
    case "link":
      return <Link scene={scene} />;
    case "end":
      return <End scene={scene} />;
  }
}

export function ReelPage({ reel }: { reel: Reel }) {
  return (
    <div className="page reel-page">
      <div className="guill" />
      <div className="inner">
        <div data-safe="">
          <div className="top" data-anim={reel.topAnim}>
            <Logo />
            <span className="tag">{reel.tag}</span>
          </div>
        </div>
        <div className="stage">
          {reel.scenes.map((scene) => (
            <section
              className={`scene scene-${scene.kind} fit`}
              key={scene.kind}
            >
              <Scene scene={scene} />
            </section>
          ))}
        </div>
        <div className="foot" data-safe="">
          <div className="source">{reel.source}</div>
          <div className="mrz">{reel.mrz}</div>
        </div>
      </div>
    </div>
  );
}
