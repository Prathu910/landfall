"""Pull every figure used on the round-recap mockups from the checked-in data.

Run from anywhere:  python3 -I .superpowers/brainstorm/round-recap-2026-11-24/data/extract.py
Writes figures.json (for notes) and figures.js (window.FIG, read by the mockups).

Rules followed (docs/DATA.md):
- "<20" is the interval 0..19, never a number. Sums of masked cells stay intervals.
- INVITED is a stock and a lower bound; never summed across as-at months.
- Never sum across visas or across states (states overlap; ANY is separate).
- A month that was not fetched is "not published", not zero.
"""

import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
OUT = Path(__file__).resolve().parent
DATA = ROOT / "src" / "data"
FIXTURE = ROOT / "scripts" / "import" / "__fixtures__" / "invitation-rounds.html"
STATES = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"]
STATE_NAMES = {
    "ACT": "Australian Capital Territory", "NSW": "New South Wales", "NT": "Northern Territory",
    "QLD": "Queensland", "SA": "South Australia", "TAS": "Tasmania", "VIC": "Victoria",
    "WA": "Western Australia",
}


def interval(text):
    if text is None:
        return None
    if text == "<20":
        return [0, 19]
    n = int(text.replace(",", ""))
    return [n, n]


def add(a, b):
    return [a[0] + b[0], a[1] + b[1]]


def slug(code, name):
    words = re.sub(r"^-+|-+$", "", re.sub(r"[^a-z0-9]+", "-", name.lower()))
    return f"/occupations/{words}-{code}/" if words else f"/occupations/{code}/"


manifest = json.loads((DATA / "manifest.json").read_text())
rounds = json.loads((DATA / "rounds.json").read_text())["rounds"]
as_at = manifest["asAt"]  # "2026-10"
prev_month = "2026-09"
assert as_at == "2026-10"

cores = {}
for occ in manifest["occupations"]:
    if not occ["hasData"]:
        continue
    cores[occ["code"]] = json.loads((DATA / "occupations" / f"{occ['code']}.json").read_text())

# ---- Official round page (recorded by the importer on 2026-11-17) ----
page = FIXTURE.read_text()
blocks = json.loads(html.unescape(re.search(r'value="([^"]*)"', page).group(1)))["content"]
texts = {b["text"]: re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", b["block"]))) for b in blocks}
current = texts["Current round"]
round_total = re.search(r"Skilled Independent visa \(subclass 189\) ([\d,]+)", current).group(1)
tie_breaks = dict(
    (m.group(1).strip(), m.group(2))
    for m in re.finditer(r"([A-Z][A-Za-z ,()'\-]+?) \d+ (\d\d/\d\d/\d{4})", current)
)
noms_text = texts["State and Territory nominations"]
noms_period = re.search(r"from (\d+ \w+ \d{4}) to (\d+ \w+ \d{4})", noms_text).groups()
row190 = re.search(r"\(subclass 190\) ((?:<?\d+ ){8})", noms_text + " ").group(1).split()
row491 = re.search(r"State and Territory Nominated ((?:<?\d+ ?){8})", noms_text + " ").group(1).split()
nominations = {
    "period": noms_period,
    "190": dict(zip(STATES, row190)),
    "491": dict(zip(STATES, row491)),
    "note": "Home Affairs table order is ACT NSW NT Qld SA Tas Vic WA; values copied as published ('<5' kept as text).",
}

# ---- 189 rounds ----
latest, previous = rounds[0], rounds[1]
latest_cut = {r["code"]: r["cutoff"] for r in latest["rows"] if r.get("code")}
prev_cut = {r["code"]: r["cutoff"] for r in previous["rows"] if r.get("code")}
names = {o["code"]: o["name"] for o in manifest["occupations"]}

cut_dist = {}
for c in latest_cut.values():
    cut_dist[c] = cut_dist.get(c, 0) + 1

changes = []
for code, cut in latest_cut.items():
    if code in prev_cut:
        changes.append({"code": code, "name": names.get(code), "jun": prev_cut[code], "oct": cut, "delta": cut - prev_cut[code]})
new_listed = sorted([names.get(c) for c in latest_cut if c not in prev_cut])
dropped = sorted([names.get(c) for c in prev_cut if c not in latest_cut])

# ---- pools and invited stock (sum across occupations within one visa and one month) ----
def national(visa, month, status):
    total, cells = [0, 0], 0
    for core in cores.values():
        v = core["statusHistory"].get(visa, {}).get(month)
        if v is None:
            continue
        iv = interval(v.get(status, "0"))
        total = add(total, iv)
        cells += iv == [0, 19]
    return {"interval": total, "maskedCells": cells}

nat = {
    visa: {
        "pool": {m: national(visa, m, "SUBMITTED") for m in (prev_month, as_at)},
        "invited": {m: national(visa, m, "INVITED") for m in (prev_month, as_at)},
    }
    for visa in ("189", "190", "491")
}

# 189 pool by points (latest month)
by_score = {}
for core in cores.values():
    for score, text in core["pool"].get("189", {}).get("byScore", {}).items():
        by_score[int(score)] = add(by_score.get(int(score), [0, 0]), interval(text))
pool_by_points = [{"score": s, "interval": by_score[s]} for s in sorted(by_score)]

# ---- 190 / 491 invited by nominated state (as at Oct and Sep) ----
def state_invited(visa, month):
    out = {}
    for st in STATES + ["ANY"]:
        total, fetched, masked = [0, 0], 0, 0
        for core in cores.values():
            months = core.get("stateInvited", {}).get(visa, {}).get(st)
            if months is None or month not in months:
                continue
            fetched += 1
            for text in months[month].values():
                iv = interval(text)
                total = add(total, iv)
                masked += iv == [0, 19]
        out[st] = {"interval": total, "maskedCells": masked}
    return out

states = {v: {m: state_invited(v, m) for m in (prev_month, as_at)} for v in ("190", "491")}

# top occupations by invited (lower bound) per state for the latest month, 190
def top_state_occupations(visa, st, n=3):
    rows = []
    for code, core in cores.items():
        cells = core.get("stateInvited", {}).get(visa, {}).get(st, {}).get(as_at)
        if not cells:
            continue
        iv = [0, 0]
        for text in cells.values():
            iv = add(iv, interval(text))
        if iv[0] > 0:
            rows.append({"code": code, "name": core["name"], "interval": iv})
    rows.sort(key=lambda r: -r["interval"][0])
    return rows[:n]

state_top = {v: {st: top_state_occupations(v, st) for st in STATES} for v in ("190", "491")}

# ---- movers: 189 pool change Sep -> Oct, exact counts only ----
movers = []
for code, core in cores.items():
    sh = core["statusHistory"].get("189", {})
    a, b = sh.get(prev_month, {}).get("SUBMITTED"), sh.get(as_at, {}).get("SUBMITTED")
    if a and b and "<" not in a and "<" not in b:
        movers.append({"code": code, "name": core["name"], "sep": int(a), "oct": int(b), "delta": int(b) - int(a),
                       "cutJun": prev_cut.get(code), "cutOct": latest_cut.get(code), "href": slug(code, core["name"])})
movers.sort(key=lambda r: r["delta"])

# ---- notable 189 occupations (largest 189 pools that the Oct round listed) ----
notable = []
for code, cut in latest_cut.items():
    core = cores.get(code)
    if not core:
        continue
    total = core["pool"].get("189", {}).get("total")
    inv = core["statusHistory"].get("189", {}).get(as_at, {}).get("INVITED", "0")
    if total and "<" not in total:
        notable.append({"code": code, "name": core["name"], "cutOct": cut, "cutJun": prev_cut.get(code),
                        "tieBreak": tie_breaks.get(latest_cut and next((r["name"] for r in latest["rows"] if r.get("code") == code), "")),
                        "pool": int(total), "invitedOct": inv, "href": slug(code, core["name"])})
notable.sort(key=lambda r: -r["pool"])

# ---- spotlight occupations ----
def spotlight(code):
    core = cores[code]
    sh = core["statusHistory"]
    return {
        "code": code, "name": core["name"], "href": slug(code, core["name"]),
        "rounds": [r for r in core["rounds189"][:6]],
        "status": {v: {m: sh.get(v, {}).get(m) for m in (prev_month, as_at)} for v in ("189", "190", "491")},
        "pool189ByScore": core["pool"].get("189", {}).get("byScore"),
        "pool189Total": core["pool"].get("189", {}).get("total"),
        "invited189ByScoreOct": core["invitedByScore"].get("189", {}).get(as_at),
        "stateInvited190Oct": {st: core["stateInvited"].get("190", {}).get(st, {}).get(as_at) for st in STATES + ["ANY"]},
        "tieBreak": tie_breaks.get(next((r["name"] for r in latest["rows"] if r.get("code") == code), "")),
    }

# ---- large 189 pools on the 189 list that the latest round did not list ----
federal = json.loads((DATA / "state-rules" / "federal-occupations.json").read_text())
waiting = []
for code, core in cores.items():
    on189 = federal["entries"].get(code, {}).get("189")
    total = core["pool"].get("189", {}).get("total")
    if on189 and code not in latest_cut and total and "<" not in total:
        last = next((r for r in core["rounds189"] if r["cutoff"] is not None), None)
        unlisted = 0
        for r in core["rounds189"]:
            if r["cutoff"] is not None:
                break
            unlisted += 1
        waiting.append({"code": code, "name": core["name"], "pool": int(total), "lastListed": last,
                        "roundsNotListed": unlisted, "href": slug(code, core["name"])})
waiting.sort(key=lambda r: -r["pool"])

figures = {
    "snapshotId": manifest["snapshotId"], "asAt": as_at, "asAtLabel": "31 Oct 2026",
    "checkedAt": manifest["checkedAt"], "previousMonth": prev_month,
    "round": {"date": latest["date"], "listed": len(latest_cut), "total189": round_total,
              "previousDate": previous["date"], "previousListed": len(prev_cut),
              "cutoffDistribution": dict(sorted(cut_dist.items())),
              "lowestCutoff": min(latest_cut.values()), "highestCutoff": max(latest_cut.values()),
              "changes": {"down": sorted([c for c in changes if c["delta"] < 0], key=lambda c: c["delta"]),
                          "up": sorted([c for c in changes if c["delta"] > 0], key=lambda c: -c["delta"]),
                          "same": len([c for c in changes if c["delta"] == 0])},
              "newlyListed": new_listed, "notListedAgain": dropped},
    "newlyListedDetail": sorted([{"code": c, "name": names.get(c), "cutoff": latest_cut[c], "href": slug(c, names.get(c)),
                                  "pool189": (cores.get(c) or {}).get("pool", {}).get("189", {}).get("total")}
                                 for c in latest_cut if c not in prev_cut],
                                key=lambda r: -(int(r["pool189"]) if r["pool189"] and "<" not in r["pool189"] else 0)),
    "nominations": nominations,
    "national": nat,
    "pool189ByPoints": pool_by_points,
    "stateInvited": states,
    "stateTop": state_top,
    "movers": {"fell": movers[:6], "rose": movers[::-1][:6]},
    "notable189": notable[:12],
    "notListed189": waiting[:6],
    "federalListCheckedAt": federal["checkedAt"],
    "spotlight": {"254499": spotlight("254499"), "261313": spotlight("261313")},
    "occupationsWithData": len(cores),
}

(OUT / "figures.json").write_text(json.dumps(figures, indent=1))
(OUT / "figures.js").write_text("window.FIG = " + json.dumps(figures) + ";\n")
print("round", figures["round"]["date"], figures["round"]["total189"], "listed", figures["round"]["listed"])
print("cut dist", figures["round"]["cutoffDistribution"])
print("changes down", [(c["name"], c["jun"], c["oct"]) for c in figures["round"]["changes"]["down"]][:10])
print("changes up", [(c["name"], c["jun"], c["oct"]) for c in figures["round"]["changes"]["up"]][:10])
print("same", figures["round"]["changes"]["same"], "new", len(new_listed), new_listed[:10], "dropped", len(dropped), dropped[:10])
for v in ("189", "190", "491"):
    print(v, "pool", nat[v]["pool"], "invited", nat[v]["invited"])
print("nominations", nominations)
for v in ("190", "491"):
    for m in (prev_month, as_at):
        print(v, m, {k: (x["interval"], x["maskedCells"]) for k, x in states[v][m].items()})
print("pool by points", [(p["score"], p["interval"]) for p in pool_by_points])
print("movers fell", [(m["name"], m["sep"], m["oct"]) for m in figures["movers"]["fell"]])
print("movers rose", [(m["name"], m["sep"], m["oct"]) for m in figures["movers"]["rose"]])
print("notable", [(n["name"], n["cutJun"], n["cutOct"], n["tieBreak"], n["pool"], n["invitedOct"]) for n in figures["notable189"]])
print("not listed", [(w["name"], w["pool"], w["lastListed"], w["roundsNotListed"]) for w in waiting[:8]])
for c, s in figures["spotlight"].items():
    print(c, s["name"], s["rounds"], s["status"], s["pool189Total"], s["tieBreak"])
    print("  inv by score", s["invited189ByScoreOct"], "state190", s["stateInvited190Oct"])
print("stateTop190", {k: [(r["name"], r["interval"]) for r in v] for k, v in state_top["190"].items()})
print("stateTop491", {k: [(r["name"], r["interval"]) for r in v] for k, v in state_top["491"].items()})
