#!/usr/bin/env python3
"""WO-049 4 follow-up: elite monsters follow their base monster's hunting-ground tier.

Rule read from the existing EliteMonsterInfo rows (every row follows it):
  Level        = base MonsterInfo.Level
  MaxHp        = 25 x base MaxHp
  AttackPower  = 4  x base Attack
  Exp          = 10 x base Exp
  Meso         = 10 x base CoinMin
  Tier / ScaleMul / CoinDrop / DreamDrop / SoulstoneDrop by level: <=10 -> 1 / 1.6 / 2 / 2 / 1,
                                                                  <=17 -> 2 / 1.8 / 4 / 4 / 1, else -> 3 / 2.0 / 6 / 6 / 1

Only elites whose Level differs from their base monster's Level are touched (so the elites of monsters
that did not change, and E2220100 whose base keeps Lv17, stay as they are). Safe to run repeatedly.
Keeps the header, column order, UTF-8 BOM and the file's line ending.   --dry prints the changes only.
"""
import csv
import io
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3] / "RootDesk" / "MyDesk"
TIER = {1: ("1.6", "2", "2", "1"), 2: ("1.8", "4", "4", "1"), 3: ("2.0", "6", "6", "1")}


def load(name):
    raw = (ROOT / name).read_bytes()
    bom = raw.startswith(b"\xef\xbb\xbf")
    text = raw.decode("utf-8-sig")
    eol = "\r\n" if "\r\n" in text else "\n"
    return bom, eol, list(csv.reader(io.StringIO(text)))


def tier_of(level):
    return 1 if level <= 10 else (2 if level <= 17 else 3)


def main():
    dry = "--dry" in sys.argv
    _, _, mrows = load("MonsterInfo.csv")
    mh = mrows[0]
    info = {r[0]: dict(zip(mh, r)) for r in mrows[1:] if r}
    bom, eol, rows = load("EliteMonsterInfo.csv")
    h = rows[0]
    col = {k: h.index(k) for k in ("EliteId", "BaseMonsterId", "Level", "MaxHp", "AttackPower", "Exp", "Meso", "ScaleMul", "CoinDrop", "DreamDrop", "SoulstoneDrop", "Tier")}
    changed = 0
    for r in rows[1:]:
        if not r:
            continue
        b = info.get(r[col["BaseMonsterId"]])
        if b is None:
            continue
        lv = int(float(b["Level"]))
        if int(float(r[col["Level"]])) == lv:
            continue
        t = tier_of(lv)
        new = {
            "Level": str(lv), "MaxHp": str(25 * int(float(b["MaxHp"]))), "AttackPower": str(4 * int(float(b["Attack"]))),
            "Exp": str(10 * int(float(b["Exp"]))), "Meso": str(10 * int(float(b["CoinMin"]))), "Tier": str(t),
            "ScaleMul": TIER[t][0], "CoinDrop": TIER[t][1], "DreamDrop": TIER[t][2], "SoulstoneDrop": TIER[t][3],
        }
        before = {k: r[col[k]] for k in new}
        print(r[col["EliteId"]], {k: (before[k], v) for k, v in new.items() if before[k] != v})
        for k, v in new.items():
            r[col[k]] = v
        changed += 1
    print("changed", changed)
    if dry or not changed:
        return
    out = io.StringIO()
    csv.writer(out, lineterminator=eol).writerows(rows)
    (ROOT / "EliteMonsterInfo.csv").write_bytes((b"\xef\xbb\xbf" if bom else b"") + out.getvalue().encode("utf-8"))


main()
