import { HomeStamp } from "./home-stamp";
import { Guilloche } from "./guilloche";
import type { HomeAtlasView } from "@/lib/home/atlas";

export function HomePassport({
  national,
  vic,
  nt,
  date,
}: {
  national: HomeAtlasView;
  vic: HomeAtlasView;
  nt: HomeAtlasView;
  date: string;
}) {
  return (
    <div
      className="spread"
      aria-label="An example report, opened like a passport"
    >
      <div className="pp left">
        <Guilloche src="/home/passport-left.svg" />
        <div className="pp-h">
          <b>Your three visas</b>
          <span>{date}</span>
        </div>
        <div className="collage">
          <HomeStamp
            shape="rect"
            label={national.label}
            top="189 ANY STATE"
            bottom="70 PTS"
            rotate={-6}
          />
          <HomeStamp
            shape="hex"
            label={vic.label}
            top="190 VIC"
            bottom="75 PTS"
            rotate={7}
          />
          <HomeStamp
            shape="oval"
            label={nt.label}
            top="491 NT"
            bottom="85 PTS"
            rotate={-3}
          />
        </div>
      </div>
      <div className="pp">
        <Guilloche src="/home/passport-right.svg" />
        <div className="pp-h">
          <b>Your outlook</b>
          <span>Example</span>
        </div>
        <div className="big">
          <HomeStamp
            label={national.label}
            top="SUBCLASS 189"
            bottom={`${date.toUpperCase()} • 70 POINTS`}
          />
        </div>
        <p className="cap">A registered nurse at 70 points.</p>
      </div>
    </div>
  );
}
