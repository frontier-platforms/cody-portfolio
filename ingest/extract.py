"""Extract raw rows from the source APIs.

Each extractor returns {raw_table_name: [rows]} matching dbt's sources.yml.
Full extracts run weekly in the Airflow DAG. The browser's live runs use the
TypeScript connectors in lib/pipelines/, which call the same endpoints.
"""

from __future__ import annotations

import datetime as dt
import json
import time
from collections.abc import Iterator
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import requests

CACHE = Path(__file__).resolve().parent.parent / ".cache" / "data"
SESSION = requests.Session()
SESSION.headers["User-Agent"] = "cody-portfolio-lab (github.com/frontier-platforms/cody-portfolio)"


def _socrata_pages(url: str, params: dict[str, str], page_size: int = 100_000) -> Iterator[list[dict]]:
    """Page through a Socrata dataset until a short page comes back."""
    offset = 0
    while True:
        res = SESSION.get(url, params={**params, "$limit": page_size, "$offset": offset}, timeout=120)
        res.raise_for_status()
        page = res.json()
        yield page
        if len(page) < page_size:
            return
        offset += page_size


# ---------------------------------------------------------------- permits

PERMITS_URL = "https://data.calgary.ca/resource/c2es-76ed.json"
PERMIT_FIELDS = [
    "permitnum", "applieddate", "issueddate", "completeddate", "statuscurrent", "permittypemapped",
    "permitclassmapped", "permitclassgroup", "workclassgroup", "housingunits", "estprojectcost",
    "totalsqft", "communityname", "latitude", "longitude",
]  # fmt: skip


def extract_permits() -> dict[str, list[dict]]:
    """Every permit applied for since 2015. Socrata's :updated_at becomes source_updated_at."""
    rows: list[dict] = []
    params = {
        "$select": ",".join([*PERMIT_FIELDS, ":updated_at"]),
        "$where": "applieddate >= '2015-01-01'",
        "$order": "permitnum",
    }
    for page in _socrata_pages(PERMITS_URL, params):
        rows.extend(
            {**{k: v for k, v in r.items() if k != ":updated_at"}, "source_updated_at": r.get(":updated_at")}
            for r in page
        )
        print(f"  extract  permits: {len(rows):,} rows")
    return {"raw_permits": rows}


# ---------------------------------------------------------------- housing

ASSESSMENTS_URL = "https://data.calgary.ca/resource/4bsw-nn7w.json"
USE_CODES_URL = "https://data.calgary.ca/resource/5843-8tyj.json"
HOME_USES = ["R110", "R111", "R120", "R401", "R402", "R201", "R301"]
ASSESSMENT_FIELDS = [
    "roll_year", "roll_number", "assessed_value", "comm_name", "year_of_construction",
    "land_use_designation", "land_size_sf", "sub_property_use", "mod_date",
]  # fmt: skip


def extract_housing() -> dict[str, list[dict]]:
    """Residential home parcels, plus the City's use-code lookup."""
    uses = ", ".join(f"'{c}'" for c in HOME_USES)
    params = {
        "$select": ",".join(ASSESSMENT_FIELDS),
        "$where": f"assessment_class = 'RE' AND sub_property_use IN ({uses})",
        "$order": "roll_number",
    }
    assessments: list[dict] = []
    for page in _socrata_pages(ASSESSMENTS_URL, params):
        assessments.extend(page)
        print(f"  extract  housing: {len(assessments):,} rows")
    codes = SESSION.get(USE_CODES_URL, params={"$limit": 1000}, timeout=60)
    codes.raise_for_status()
    return {"raw_assessments": assessments, "raw_use_codes": codes.json()}


# ---------------------------------------------------------------- flames

NHL_API = "https://api-web.nhle.com/v1"
TEAM = "CGY"
FIRST_SEASON = 2021
SHOT_EVENTS = {"goal", "shot-on-goal", "missed-shot", "blocked-shot"}


def season_ids(today: dt.date | None = None) -> list[str]:
    """2021-22 through the season in progress, e.g. "20262027"."""
    today = today or dt.datetime.now(dt.UTC).date()
    current = today.year if today.month >= 7 else today.year - 1
    return [f"{y}{y + 1}" for y in range(FIRST_SEASON, current + 1)]


def _nhl(path: str) -> dict:
    """NHL fetch with backoff on 429s. Finished games are cached on disk forever."""
    cacheable = path.startswith("gamecenter/")
    cached = CACHE / f"nhl-{''.join(c if c.isalnum() else '-' for c in path)}.json"
    if cacheable and cached.exists():
        return json.loads(cached.read_text())
    for attempt in range(1, 7):
        res = SESSION.get(f"{NHL_API}/{path}", timeout=60)
        if res.ok:
            data = res.json()
            if cacheable:
                CACHE.mkdir(parents=True, exist_ok=True)
                cached.write_text(json.dumps(data))
            time.sleep(0.25)
            return data
        time.sleep(float(res.headers.get("retry-after") or 2**attempt))
    raise RuntimeError(f"NHL API {res.status_code} for {path}")


def extract_flames() -> dict[str, list[dict]]:
    """Schedules for every season, and shot events plus rosters for finished regular-season games."""
    games: list[dict] = []
    plays: list[dict] = []
    roster: list[dict] = []

    for season in season_ids():
        schedule = _nhl(f"club-schedule-season/{TEAM}/{season}")["games"]
        for g in schedule:
            games.append({
                "game_id": g["id"], "season": str(g["season"]), "game_type": g["gameType"],
                "game_date": g["gameDate"], "game_state": g["gameState"],
                "home_id": g["homeTeam"]["id"], "home_abbrev": g["homeTeam"]["abbrev"],
                "home_score": g["homeTeam"].get("score"),
                "away_id": g["awayTeam"]["id"], "away_abbrev": g["awayTeam"]["abbrev"],
                "away_score": g["awayTeam"].get("score"),
                "last_period_type": (g.get("gameOutcome") or {}).get("lastPeriodType"),
            })  # fmt: skip
        finished = [g for g in schedule if g["gameType"] == 2 and g["gameState"] in ("OFF", "FINAL")]
        print(f"  extract  {season}: {len(schedule)} scheduled, {len(finished)} finished")

        with ThreadPoolExecutor(max_workers=2) as pool:
            for g, pbp in zip(
                finished, pool.map(lambda g: _nhl(f"gamecenter/{g['id']}/play-by-play"), finished)
            ):
                for r in pbp["rosterSpots"]:
                    roster.append({
                        "game_id": g["id"], "player_id": r["playerId"],
                        "first_name": r["firstName"]["default"], "last_name": r["lastName"]["default"],
                    })  # fmt: skip
                for p in pbp["plays"]:
                    if p["typeDescKey"] not in SHOT_EVENTS:
                        continue
                    d = p.get("details") or {}
                    plays.append({
                        "game_id": g["id"], "home_team_id": pbp["homeTeam"]["id"], "event_type": p["typeDescKey"],
                        "period": p["periodDescriptor"]["number"], "period_type": p["periodDescriptor"]["periodType"],
                        "time_in_period": p["timeInPeriod"], "situation_code": p.get("situationCode"),
                        "home_defending_side": p.get("homeTeamDefendingSide"),
                        "x": d.get("xCoord"), "y": d.get("yCoord"), "owner_team_id": d.get("eventOwnerTeamId"),
                        "shot_type": d.get("shotType"),
                        "shooter_id": d.get("scoringPlayerId") or d.get("shootingPlayerId"),
                    })  # fmt: skip

    return {"raw_games": games, "raw_plays": plays, "raw_roster": roster}


EXTRACTORS = {"permits": extract_permits, "housing": extract_housing, "flames": extract_flames}
