#!/usr/bin/env python3
"""Reproduce the report evidence using displayed, public government data only.

Requires requests and websocket-client. Example:
  python3 -m venv /tmp/landfall-evidence
  /tmp/landfall-evidence/bin/pip install requests websocket-client
  /tmp/landfall-evidence/bin/python scripts/import-report-evidence.py

The target month and occupation scope come from src/data/pool.json. This script
never asks for an underlying unmasked count. Qlik qText is the same suppressed
text shown in the dashboard. It does not create custom count expressions.
An absent invitation table row is null, never a zero-point cut-off.
"""
import argparse
import calendar
import json
import re
from datetime import date, datetime
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DASHBOARD = "https://api.dynamic.reports.employment.gov.au"
APP = "aaac76b5-ad30-477e-9ca0-472f8ab57fc8"
SKILLSELECT = "https://immi.homeaffairs.gov.au/visas/working-in-australia/skillselect/"
VISAS = {
    "189": "189PTS Points-Tested Stream",
    "190": "190SAS Skilled Australian Sponsored",
    "491": "491SNR State or Territory Nominated - Regional",
}


def count_interval(value):
    if value == "<20":
        return {"min": 0, "max": 19}
    if not value.isdigit():
        raise ValueError(f"Unexpected published count {value!r}")
    return {"min": int(value), "max": int(value)}


def month_end(value):
    month, year = map(int, value.split("/"))
    return date(year, month, calendar.monthrange(year, month)[1]).isoformat()


class PageSchema(HTMLParser):
    schema = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "input" and attrs.get("id") == "ctl00_PlaceHolderMain_PageSchemaHiddenField_Input":
            self.schema = json.loads(attrs["value"])


class Tables(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tables, self.table, self.row, self.cell = [], None, None, None

    def handle_starttag(self, tag, _):
        if tag == "table":
            self.table = []
        elif tag == "tr" and self.table is not None:
            self.row = []
        elif tag in ("td", "th") and self.row is not None:
            self.cell = []

    def handle_data(self, data):
        if self.cell is not None:
            self.cell.append(data)

    def handle_endtag(self, tag):
        if tag in ("td", "th") and self.cell is not None:
            self.row.append(" ".join(" ".join(self.cell).split()))
            self.cell = None
        elif tag == "tr" and self.row is not None:
            self.table.append(self.row)
            self.row = None
        elif tag == "table" and self.table is not None:
            self.tables.append(self.table)
            self.table = None


def read_rounds(session, occupations):
    def schema(page):
        response = session.get(SKILLSELECT + page, timeout=40)
        response.raise_for_status()
        parser = PageSchema()
        parser.feed(response.text)
        if parser.schema is None:
            raise ValueError("Official page schema changed; review the source before importing")
        return parser.schema

    current, previous = schema("invitation-rounds"), schema("previous-rounds")
    current_block = next(b["block"] for b in current["content"] if b["text"] == "Current round")
    match = re.search(r"Invitations issued on (\d+ \w+ \d{4})", current_block)
    if match is None:
        raise ValueError("Current round date missing")
    blocks = [(match[1], current_block)] + [(b["title"], b["description"]) for b in previous["criteria"][:5]]
    result = {o["code"]: [] for o in occupations}
    normalize = lambda text: re.sub(r"[^a-z0-9]", "", text.lower())
    for round_date, block in blocks:
        day = datetime.strptime(round_date, "%d %B %Y").date().isoformat()
        parser = Tables()
        parser.feed(block)
        table = next(t for t in parser.tables if t and "occupation" in t[0][0].lower())
        if "189" not in " ".join(table[0]) and "minimum points" not in " ".join(table[0]).lower():
            raise ValueError("Occupation table columns changed")
        for occupation in occupations:
            row = next((r for r in table[1:] if normalize(r[0]) == normalize(occupation["name"])), None)
            if row is not None and not row[1].isdigit():
                raise ValueError(f"Unexpected 189 cut-off for {occupation['code']}: {row[1]}")
            result[occupation["code"]].append({"date": day, "cutoff": int(row[1]) if row else None})
    return result


def read_pool(session, pool):
    import websocket
    from websocket._cookiejar import SimpleCookieJar

    # The public load balancer can emit cookie attributes its websocket parser
    # rejects. Keep requests' anonymous session cookies; ignore WS-added cookies.
    SimpleCookieJar.add = lambda self, set_cookie: None
    response = session.get(pool["sourceUrl"], timeout=40)
    response.raise_for_status()
    ws = websocket.create_connection(
        f"wss://api.dynamic.reports.employment.gov.au/anonap/app/{APP}",
        origin=DASHBOARD,
        cookie="; ".join(f"{key}={value}" for key, value in session.cookies.items()),
        timeout=40,
    )
    request_id = 0

    def call(handle, method, params):
        nonlocal request_id
        request_id += 1
        ws.send(json.dumps({"jsonrpc": "2.0", "id": request_id, "handle": handle, "method": method, "params": params}))
        while True:
            message = json.loads(ws.recv())
            if message.get("id") == request_id:
                if "error" in message:
                    raise ValueError(message["error"])
                return message["result"]

    app = call(-1, "OpenDoc", [APP])["qReturn"]["qHandle"]
    call(app, "ApplyBookmark", ["44604edb-b94c-414b-b978-30bb79019ffd"])

    def variable(name, value):
        handle = call(app, "GetVariableByName", [name])["qReturn"]["qHandle"]
        call(handle, "SetStringValue", [value])

    def select(name, values):
        handle = call(app, "GetField", [name])["qReturn"]["qHandle"]
        call(handle, "SelectValues", [values, False, False])

    variable("vShowOccupations", "Y")
    variable("vShowPoints", "N")
    select("Visa Type", [{"qText": text} for text in VISAS.values()])
    select("EOI Status", [{"qText": "SUBMITTED"}])
    table = call(app, "GetObject", ["eymDb"])["qReturn"]["qHandle"]

    def read_table(expected_width):
        cube = call(table, "GetLayout", [])["qLayout"]["qHyperCube"]
        size = cube["qSize"]
        if size["qcx"] != expected_width or not size["qcy"]:
            raise ValueError("Published dashboard table changed or cannot calculate")
        result = []
        for offset in range(0, size["qcy"], 1000):
            page = {"qTop": offset, "qLeft": 0, "qHeight": 1000, "qWidth": size["qcx"]}
            pages = call(table, "GetHyperCubeData", ["/qHyperCubeDef", [page]])["qDataPages"]
            result.extend([[cell["qText"] for cell in row] for row in pages[0]["qMatrix"]])
        return result

    end = date.fromisoformat(pool["snapshotDate"])
    index = end.year * 12 + end.month - 1
    months = [divmod(index - offset, 12) for offset in range(11, -1, -1)]
    trends = []
    for year, zero_month in months:
        month = zero_month + 1
        day = date(year, month, calendar.monthrange(year, month)[1])
        select("As At Month", [{"qNumber": (day - date(1899, 12, 30)).days, "qIsNumeric": True}])
        trends.extend(read_table(5))
    variable("vShowPoints", "Y")
    points = read_table(6)
    ws.close()
    return trends, points


def build(pool, rounds, trends, points, checked_at):
    data = {
        "sourceUrl": pool["sourceUrl"], "sourceCheckedAt": checked_at,
        "snapshotDate": pool["snapshotDate"], "status": "SUBMITTED",
        "roundsSourceUrl": SKILLSELECT + "invitation-rounds",
        "previousRoundsSourceUrl": SKILLSELECT + "previous-rounds",
        "roundsNote": "Null means this occupation is not listed in the published 189 results for that round. It does not mean a zero-point cut-off. Historical cut-offs are not forecasts.",
        "trendNote": "Monthly submitted EOI occupation totals read directly from the published table with points hidden. A net change is not gross arrivals, departures, invitations or people.",
        "pathwaysNote": "Pools overlap: one EOI may express interest in multiple visas or states. 491 here is state/territory nominated, excluding family sponsorship. Points are the dashboard score for the selected visa, which includes its applicable nomination/sponsorship points.",
        "importMethod": "Existing public SkillSelect Qlik table eymDb, displayed qText only. One As At Month at a time; SUBMITTED, three visa types, occupation shown. Points hidden for monthly totals; shown for current score distributions. Suppression preserved.",
        "occupations": [],
    }
    last_month = date.fromisoformat(pool["snapshotDate"]).strftime("%m/%Y")
    for occupation in pool["occupations"]:
        code = occupation["code"]
        matching = lambda row: row[2].startswith(code + " ")
        trend = [{"date": month_end(row[0]), "total": count_interval(row[-1])} for row in trends if row[1] == VISAS["189"] and matching(row)]
        if len(trend) != 12:
            raise ValueError(f"Expected 12 monthly totals for {code}, got {len(trend)}")
        pathways = []
        for visa, name in VISAS.items():
            rows = [row for row in points if row[1] == name and matching(row)]
            totals = [row[-1] for row in trends if row[0] == last_month and row[1] == name and matching(row)]
            if len(totals) != 1 or not rows:
                raise ValueError(f"Missing or duplicate current pool for {code} / {visa}")
            distribution = sorted([{"score": int(row[-2]), "count": row[-1]} for row in rows], key=lambda row: row["score"])
            total = count_interval(totals[0])
            lower = sum(count_interval(row["count"])["min"] for row in distribution)
            upper = sum(count_interval(row["count"])["max"] for row in distribution)
            if lower > total["max"] or upper < total["min"]:
                raise ValueError(f"Aggregate/distribution mismatch for {code} / {visa}")
            pathways.append({"visa": visa, "total": total, "points": distribution})
        data["occupations"].append({"code": code, "name": occupation["name"], "rounds": rounds[code], "trend": sorted(trend, key=lambda row: row["date"]), "pathways": pathways})
    return data


def main():
    import requests
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--checked-at", default=date.today().isoformat())
    parser.add_argument("--cache-dir", type=Path, help="Save source extracts for review or reuse on a later import")
    parser.add_argument("--from-cache", action="store_true", help="Read rounds.json, trends.json and points.json from --cache-dir")
    args = parser.parse_args()
    pool = json.loads((ROOT / "src/data/pool.json").read_text())
    if args.from_cache:
        if args.cache_dir is None:
            parser.error("--from-cache requires --cache-dir")
        rounds, trends, points = [json.loads((args.cache_dir / f"{name}.json").read_text()) for name in ("rounds", "trends", "points")]
    else:
        session = requests.Session()
        rounds = read_rounds(session, pool["occupations"])
        trends, points = read_pool(session, pool)
        if args.cache_dir:
            args.cache_dir.mkdir(parents=True, exist_ok=True)
            for name, rows in (("rounds", rounds), ("trends", trends), ("points", points)):
                (args.cache_dir / f"{name}.json").write_text(json.dumps(rows))
    data = build(pool, rounds, trends, points, args.checked_at)
    output = ROOT / "src/data/report-evidence.json"
    output.write_text(json.dumps(data, indent=2) + "\n")
    print(f"Imported {len(data['occupations'])} occupations; as at {data['snapshotDate']}; checked {args.checked_at}")


if __name__ == "__main__":
    main()
