"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Info, Minus, Plus } from "lucide-react";
import { snapshot, comparePool, countInterval, formatInterval, type Occupation } from "@/lib/pool";

export function PoolChart({ occupation, score }: { occupation: Occupation; score: number }) {
  const first = Math.min(65, Math.floor(score/5)*5);
  const last = Math.max(110, Math.ceil(score/5)*5);
  const bands = Array.from({ length: (last-first)/5+1 }, (_, i) => first + i * 5);
  const spacing=420/bands.length;
  const values = bands.map(value => occupation.points.filter(p => p.score === value).reduce((sum, p) => sum + countInterval(p.count).max, 0));
  const max = Math.max(...values, 1);
  return <svg className="pool-chart" viewBox="0 0 440 165" role="img" aria-label={`Published EOI distribution for ${occupation.name}. Your score of ${score} is highlighted. Counts below 20 are masked; bar heights use interval upper bounds.`}>
    {[0,1,2].map(i => <line key={i} x1="10" x2="430" y1={20+i*52} y2={20+i*52} stroke="#e8ebe5" strokeDasharray="3 5"/>)}
    {bands.map((band, i) => { const height = Math.max(3, values[i]/max*105); const center=10+spacing*(i+.5); return <g key={band}><rect x={center-spacing*.35} y={128-height} width={spacing*.7} height={height} rx="3" fill={band === score ? "#c9e793" : band > score ? "#245b4a" : "#dfe9e1"}/><text x={center} y="151" textAnchor="middle" fontSize={bands.length>18?8:10} fill={band === score ? "#173e32" : "#606b59"} fontWeight={band===score ? "600" : "400"}>{band}</text>{band===score && <path d={`M${center-4} ${119-height}l4 4 4-4`} fill="none" stroke="#245b4a" strokeWidth="1.6"/>}</g>; })}
  </svg>;
}

export function PoolExplorer() {
  const [code, setCode] = useState("261111");
  const [score, setScore] = useState(90);
  const occupation = snapshot.occupations.find(o => o.code === code)!;
  const pool = comparePool(occupation, score);
  return <div className="explorer"><div className="explorer-heading"><span className="mini-brand">Your first look</span><span className="pill"><span className="status-dot"/> Official snapshot</span></div><div className="explorer-tab"><span>189 independent</span><Link href="/states/">190 & 491 pathways <ArrowUpRight size={13}/></Link></div><div className="explorer-fields"><label htmlFor="explore-occupation">Your occupation<select id="explore-occupation" value={code} onChange={e => setCode(e.target.value)}>{snapshot.occupations.map(o => <option value={o.code} key={o.code}>{o.name}</option>)}</select></label><div><label id="score-label">Your points</label><div className="stepper" aria-labelledby="score-label"><button aria-label="5 fewer points" disabled={score<=65} onClick={() => setScore(score-5)}><Minus size={14}/></button><output>{score}</output><button aria-label="5 more points" disabled={score>=110} onClick={() => setScore(score+5)}><Plus size={14}/></button></div></div></div><div className="explorer-metric" aria-live="polite"><span className="big-number">{formatInterval(pool.higher)}</span><span>EOIs with higher points<br/>in your occupation</span></div><PoolChart occupation={occupation} score={score}/><div className="chart-key"><span><i className="key-dot dark"/> Higher points</span><span><i className="key-dot lime"/> Your score band</span><span><i className="key-dot pale"/> Lower points</span></div><div className="explorer-note"><Info size={15}/><p>Another <strong>{formatInterval(pool.same)}</strong> share your score. Their dates of effect determine tie-break order.</p></div><div className="explorer-bottom"><Link href={`/check/?occupation=${code}`} className="text-link">See my personal picture <ArrowRight size={15}/></Link><span>As at 31 Oct 2026</span></div><p className="explorer-disclaimer">Ranges preserve masked counts. This is a pool comparison, not an exact queue position.</p></div>;
}
