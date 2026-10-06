#!/usr/bin/env python3
"""Apply WO-049 hunting-ground monster tiers; safe to run repeatedly."""

from __future__ import annotations

import csv
import io
import math
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
BASE_HP = {10: 150, 17: 320, 24: 600}
LEVEL_VALUES = {
    10: {"Exp": "22", "Attack": "58", "CoinMin": "60", "CoinMax": "60"},
    17: {"Exp": "38", "Attack": "114", "CoinMin": "180", "CoinMax": "180"},
    24: {"Exp": "70", "Attack": "162", "CoinMin": "450", "CoinMax": "450"},
}

# MonsterId: (original level, original MaxHp, target level). Fixed source values
# make the calculation idempotent instead of compounding from a previous run.
MONSTERS = {
    "5130102": (24, 465, 17),
    "2220110": (17, 305, 24),
    "210100": (17, 260, 10),
    "3230100": (17, 350, 10),
    "4230100": (24, 535, 17),
    "2230100": (10, 215, 24),
    "2230102": (24, 775, 10),
    "2230112": (24, 775, 10),
    "3230300": (10, 170, 24),
    "3230101": (24, 710, 17),
    "2130103": (17, 455, 24),
}
MAP_OVERRIDE = ("Henesys_Hunt_BlueMushroomTrail", "2220100", "24")
RECRUIT_TIER = {"5130102": 2, "2220110": 3, "210100": 1, "3230100": 1,
                "4230100": 2, "2230100": 3, "2230102": 1, "2230112": 1,
                "3230300": 3, "3230101": 2, "2130103": 3}
GUARD = {1: ("500", "150"), 2: ("1600", "315"), 3: ("2500", "1850")}
DROP_CHANCE = {1: "0.25", 2: "0.35", 3: "0.50"}


def read_csv(path: Path):
    raw = path.read_bytes()
    bom = raw.startswith(b"\xef\xbb\xbf")
    newline = "\r\n" if b"\r\n" in raw else "\n"
    text = raw.decode("utf-8-sig")
    rows = list(csv.DictReader(io.StringIO(text, newline="")))
    return raw, bom, newline, rows


def write_csv(path: Path, raw: bytes, bom: bool, newline: str, rows) -> None:
    fields = list(rows[0].keys()) if rows else []
    out = io.StringIO(newline="")
    writer = csv.DictWriter(out, fieldnames=fields, lineterminator=newline,
                            quoting=csv.QUOTE_MINIMAL, extrasaction="raise")
    writer.writeheader()
    writer.writerows(rows)
    payload = out.getvalue().encode("utf-8")
    path.write_bytes((b"\xef\xbb\xbf" if bom else b"") + payload)


def change(path: Path, row_no: int, row, key: str, value: str, changed: list) -> None:
    before = row[key]
    if before != value:
        row[key] = value
        changed.append((path.name, row_no, key, before, value))


def main() -> None:
    data = ROOT / "RootDesk" / "MyDesk"
    changed = []

    path = data / "MonsterInfo.csv"
    raw, bom, newline, rows = read_csv(path)
    found = set()
    for n, row in enumerate(rows, 2):
        monster_id = row["Id"]
        if monster_id not in MONSTERS:
            continue
        old_level, old_hp, target = MONSTERS[monster_id]
        found.add(monster_id)
        if int(row["Level"]) not in (old_level, target):
            raise ValueError(f"{monster_id}: unexpected level {row['Level']}")
        hp = math.floor(old_hp * BASE_HP[target] / BASE_HP[old_level] + 0.5)
        values = {"Level": str(target), "MaxHp": str(hp), **LEVEL_VALUES[target]}
        for key, value in values.items():
            change(path, n, row, key, value, changed)
    if found != set(MONSTERS):
        raise ValueError(f"MonsterInfo rows missing: {sorted(set(MONSTERS) - found)}")
    write_csv(path, raw, bom, newline, rows)

    path = data / "MapMonsters.csv"
    raw, bom, newline, rows = read_csv(path)
    map_name, monster_id, target_level = MAP_OVERRIDE
    hit = False
    for n, row in enumerate(rows, 2):
        if row["MapName"] == map_name and row["MonsterId"] == monster_id:
            hit = True
            change(path, n, row, "LevelOverride", target_level, changed)
    if not hit:
        raise ValueError(f"MapMonsters row missing: {map_name}/{monster_id}")
    write_csv(path, raw, bom, newline, rows)

    path = data / "MonsterRecruit.csv"
    raw, bom, newline, rows = read_csv(path)
    found = set()
    for n, row in enumerate(rows, 2):
        monster_id = row["MonsterId"]
        if monster_id not in RECRUIT_TIER:
            continue
        tier = RECRUIT_TIER[monster_id]
        found.add(monster_id)
        hp, attack = GUARD[tier]
        for key, value in {"Tier": str(tier), "GuardHp": hp,
                           "GuardAttack": attack}.items():
            change(path, n, row, key, value, changed)
    if found != set(RECRUIT_TIER):
        raise ValueError(f"MonsterRecruit rows missing: {sorted(set(RECRUIT_TIER) - found)}")
    write_csv(path, raw, bom, newline, rows)

    path = data / "DropTable.csv"
    raw, bom, newline, rows = read_csv(path)
    found = set()
    for n, row in enumerate(rows, 2):
        if row["SourceKind"] != "MONSTER":
            continue
        monster_id = row["SourceId"]
        if monster_id not in RECRUIT_TIER:
            continue
        found.add(monster_id)
        change(path, n, row, "Chance", DROP_CHANCE[RECRUIT_TIER[monster_id]], changed)
    if found != set(RECRUIT_TIER):
        raise ValueError(f"DropTable MONSTER rows missing: {sorted(set(RECRUIT_TIER) - found)}")
    write_csv(path, raw, bom, newline, rows)

    changed_rows = {}
    for filename, row, key, before, after in changed:
        changed_rows.setdefault((filename, row), []).append(
            f"{key}: {before!r} -> {after!r}"
        )
    for (filename, row), values in changed_rows.items():
        print(f"{filename}:{row} " + "; ".join(values))
    print(f"변경 행: {len(changed_rows)}")


if __name__ == "__main__":
    main()
