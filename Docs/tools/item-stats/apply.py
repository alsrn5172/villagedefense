import argparse
import csv
import difflib
import io
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
TIERS = {10: (3, 1), 15: (6, 2), 20: (13, 4), 25: (28, 9), 30: (60, 20)}
JOBS = {
    "WARRIOR": ("BaseStr", "BaseDex"),
    "PIRATE": ("BaseStr", "BaseDex"),
    "MAGICIAN": ("BaseInt", "BaseLuk"),
    "ARCHER": ("BaseDex", "BaseStr"),
    "THIEF": ("BaseLuk", "BaseDex"),
}
POTIONS = {
    "MANA_ELIXIR": {
        "name": "마나 엘릭서", "icon": "thumbnail://3b778fe9d0b64a52a038b1c72cb58454",
        "heal_hp": "0", "heal_mp": "600", "price": "300", "sell": "150",
        "note": "MP +600 · 마을 물약 상인 300메소 · 회복량 ConsumeInfo",
    },
    "PURE_WATER": {
        "name": "맑은 물", "icon": "thumbnail://81217a4dc8b74af19a93c07a0fb72a5f",
        "heal_hp": "0", "heal_mp": "1200", "price": "600", "sell": "300",
        "note": "MP +1200 · 마을 물약 상인 600메소 · 회복량 ConsumeInfo",
    },
    "GRILLED_EEL": {
        "name": "장어구이", "icon": "thumbnail://2d35e350465c47f39eff7596f5c01f22",
        "heal_hp": "1000", "heal_mp": "0", "price": "650", "sell": "325",
        "note": "HP +1000 · 마을 물약 상인 650메소 · 회복량 ConsumeInfo",
    },
}


def read_csv(path):
    raw = path.read_bytes()
    bom = raw.startswith(b"\xef\xbb\xbf")
    text = raw.decode("utf-8-sig" if bom else "utf-8")
    newline = "\r\n" if "\r\n" in text else "\n"
    rows = list(csv.reader(io.StringIO(text, newline="")))
    return rows, bom, newline


def render_csv(rows, bom, newline):
    out = io.StringIO(newline="")
    writer = csv.writer(out, lineterminator=newline)
    writer.writerows(rows)
    data = out.getvalue().encode("utf-8")
    return (b"\xef\xbb\xbf" if bom else b"") + data


def set_cell(row, header, key, value):
    row[header.index(key)] = str(value)


def new_row(header, values):
    return [str(values.get(name, "")) for name in header]


def update_item_info(rows):
    header = rows[0]
    index = {row[header.index("ItemId")]: row for row in rows[1:] if row[header.index("ItemId")]}
    for item_id, potion in POTIONS.items():
        if item_id not in index:
            index[item_id] = new_row(header, {
                "ItemId": item_id, "Name": potion["name"], "ItemType": "CONSUME",
                "IconRUID": potion["icon"], "SellMeso": potion["sell"],
                "Stackable": "true", "MaxStack": "99", "Enabled": "true",
                "#Note": potion["note"],
            })
            rows.append(index[item_id])
        else:
            row = index[item_id]
            set_cell(row, header, "Name", potion["name"])
            set_cell(row, header, "ItemType", "CONSUME")
            set_cell(row, header, "IconRUID", potion["icon"])
            set_cell(row, header, "SellMeso", potion["sell"])
            set_cell(row, header, "Stackable", "true")
            set_cell(row, header, "MaxStack", "99")
            set_cell(row, header, "Enabled", "true")
            set_cell(row, header, "#Note", potion["note"])

    item_notes = {
        "POTION_RED": "HP +255 · 물약 상인 30메소 · 회복량 ConsumeInfo",
        "POTION_ORANGE": "HP +330 · 마을 물약 상인 150메소 · 물약 단계 2",
        "POTION_WHITE": "HP +405 · 마을 물약 상인 250메소 · 물약 단계 3",
        "POTION_BLUE": "MP +200 · 물약 상인 30메소 · MP 물약 공용 쿨",
    }
    for item_id, note in item_notes.items():
        if item_id in index:
            set_cell(index[item_id], header, "#Note", note)

    magician_mp = {
        "TOP_MAGICIAN_T10": 280, "BOTTOM_MAGICIAN_T10": 280,
        "TOP_MAGICIAN_T15": 760, "BOTTOM_MAGICIAN_T15": 380,
        "TOP_MAGICIAN_T20": 960, "BOTTOM_MAGICIAN_T20": 480,
        "TOP_MAGICIAN_T25": 1160, "BOTTOM_MAGICIAN_T25": 580,
        "TOP_MAGICIAN_T30": 1360, "BOTTOM_MAGICIAN_T30": 680,
        "ABSOLAB_TOP_MAGICIAN": 1360,
    }
    for item_id, value in magician_mp.items():
        if item_id not in index:
            raise ValueError("Missing magician item: " + item_id)
        set_cell(index[item_id], header, "BaseMaxMp", value)

    jobs = set(JOBS)
    tiers = set(TIERS)
    stat_cols = ("BaseStr", "BaseDex", "BaseInt", "BaseLuk")
    touched = 0
    for row in rows[1:]:
        item_id = row[header.index("ItemId")]
        if (row[header.index("ItemType")] != "EQUIP"
                or row[header.index("ReqJob")] not in jobs
                or row[header.index("ReqLevel")] not in {str(x) for x in tiers}
                or item_id.startswith("ABSOLAB_")):
            continue
        level = int(row[header.index("ReqLevel")])
        primary, secondary = JOBS[row[header.index("ReqJob")]]
        full_primary, full_secondary = TIERS[level]
        scale = 2 if row[header.index("AvatarSlot")] == "LONGCOAT" or row[header.index("WeaponType")] == "SWORD_2H" else 1
        base_primary = (full_primary + 1) // 2
        base_secondary = (full_secondary + 1) // 2
        values = {col: 0 for col in stat_cols}
        values[primary] = base_primary * scale
        values[secondary] = base_secondary * scale
        for col, value in values.items():
            set_cell(row, header, col, value)
        touched += 1
    return touched


def update_consume(rows):
    header = rows[0]
    index = {row[header.index("ItemId")]: row for row in rows[1:] if row[header.index("ItemId")]}
    values = {
        "POTION_RED": ("255", "0", "빨간 포션 · HP +255 · HP 물약 공용 쿨"),
        "POTION_ORANGE": ("330", "0", "주황 포션 · HP +330 · HP 물약 공용 쿨"),
        "POTION_WHITE": ("405", "0", "하얀 포션 · HP +405 · HP 물약 공용 쿨"),
        "POTION_BLUE": ("0", "200", "파란 포션 · MP +200 · MP 물약 공용 쿨"),
    }
    for item_id, potion in POTIONS.items():
        values[item_id] = (potion["heal_hp"], potion["heal_mp"], potion["name"] + " · 회복량 설정")
    for item_id, (hp, mp, note) in values.items():
        if item_id not in index:
            if item_id not in POTIONS:
                raise ValueError("Missing consume item: " + item_id)
            row = new_row(header, {
                "ItemId": item_id, "HealHp": hp, "HealMp": mp, "Enabled": "true",
                "CooldownStartSeconds": "13", "CooldownEndSeconds": "6",
                "CooldownEndLevel": "30", "HealHpPct": "0", "HealMpPct": "0",
                "#Note": note,
            })
            rows.append(row)
            index[item_id] = row
        else:
            row = index[item_id]
            set_cell(row, header, "HealHp", hp)
            set_cell(row, header, "HealMp", mp)
            if item_id in POTIONS:
                for key, value in (("Enabled", "true"), ("CooldownStartSeconds", "13"),
                                   ("CooldownEndSeconds", "6"), ("CooldownEndLevel", "30"),
                                   ("HealHpPct", "0"), ("HealMpPct", "0")):
                    set_cell(row, header, key, value)
            set_cell(row, header, "#Note", note)


def update_shop(rows):
    header = rows[0]
    index = {row[header.index("ShopItemId")]: row for row in rows[1:] if row[header.index("ShopItemId")]}
    for item_id, potion in POTIONS.items():
        shop_id = "SHOP_" + item_id
        values = {
            "ShopItemId": shop_id, "ShopKey": "POTION", "ItemId": item_id,
            "PriceMeso": potion["price"], "MaxCount": "99", "Enabled": "true",
            "#Note": "마을 물약 상인 · " + potion["name"],
        }
        if shop_id not in index:
            row = new_row(header, values)
            rows.append(row)
            index[shop_id] = row
        else:
            row = index[shop_id]
            for key, value in values.items():
                set_cell(row, header, key, value)


def process(path, updater, dry):
    rows, bom, newline = read_csv(path)
    before = render_csv(rows, bom, newline).decode("utf-8-sig" if bom else "utf-8")
    result = updater(rows)
    after_bytes = render_csv(rows, bom, newline)
    after = after_bytes.decode("utf-8-sig" if bom else "utf-8")
    if before != after:
        rel = str(path.relative_to(ROOT))
        diff = difflib.unified_diff(before.splitlines(True), after.splitlines(True),
                                    fromfile=rel, tofile=rel + " (new)")
        sys.stdout.writelines(diff)
        if not dry:
            path.write_bytes(after_bytes)
    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry", action="store_true", help="Print the diff without writing files")
    args = parser.parse_args()
    item_path = ROOT / "RootDesk/MyDesk/ItemInfo.csv"
    consume_path = ROOT / "RootDesk/MyDesk/ConsumeInfo.csv"
    shop_path = ROOT / "RootDesk/MyDesk/ShopItem.csv"
    count = process(item_path, update_item_info, args.dry)
    process(consume_path, update_consume, args.dry)
    process(shop_path, update_shop, args.dry)
    print("Target job equipment rows: " + str(count))
    print("Dry run; no files written." if args.dry else "CSV updates written.")


if __name__ == "__main__":
    main()
