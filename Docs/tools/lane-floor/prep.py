# WO-047 — 레인 바닥 그림 가공: 원본 12장(리소스파일/레인-발판/<마을>_왼끝|중간|오른끝.png) → _upload/lfl_<마을>_<left|mid|right>.png + manifest.json
# 다시 돌려도 같은 결과. 투명 여백은 자르지 않는다(끝 ↔ 중간 경계 정렬이 깨진다). 엘리니아만 줄인다(원본이 커서).
# 피벗(왼쪽 아래 기준 비율): 중간 x 0.5 · 왼끝 x 1.0(중간과 붙는 오른쪽 경계) · 오른끝 x 0.0 · y = 걷는 선 → 엔티티 y = 밟는 선 y 그대로.
# 실행: python -X utf8 Docs/tools/lane-floor/prep.py
import os, json, unicodedata
from PIL import Image

SRC = "C:/Users/mingu/메월드폴더/리소스파일/레인-발판"
OUT = os.path.join(SRC, "_upload")
# 걷는 선 = 중간 그림의 위에서부터 행(원본 px · WO-047 분석.json). dy = 끝 조각을 중간보다 이만큼 아래로(끝 행 r = 중간 행 r + dy).
VILLAGES = {
    "henesys": {"walk_row": 31, "dy": 0, "scale": 1.0},       # 풀 높이 중간(윗끝 5 · 아래끝 58)
    "kerning_city": {"walk_row": 2, "dy": 0, "scale": 1.0},   # 판석 윗면
    "perion": {"walk_row": 4, "dy": 0, "scale": 1.0},         # 돌 윗면
    "ellinia": {"walk_row": 250, "dy": 21, "scale": 0.37},    # 잎 높이 중간(잎 윗끝 186 · 줄기 315) · 보이는 잎+줄기 407px → 약 1.5 유닛
}
PARTS = {"left": "왼끝", "mid": "중간", "right": "오른끝"}
PIVOT_X = {"left": 1.0, "mid": 0.5, "right": 0.0}


def find(name):
    want = unicodedata.normalize("NFC", name)
    for f in os.listdir(SRC):
        if unicodedata.normalize("NFC", f) == want:
            return os.path.join(SRC, f)
    raise FileNotFoundError(name)


os.makedirs(OUT, exist_ok=True)
manifest = {"ppu": 100, "villages": {}}
for v, cfg in VILLAGES.items():
    entry = {"scale": cfg["scale"], "walk_row_mid": cfg["walk_row"], "dy": cfg["dy"], "parts": {}}
    for part, ko in PARTS.items():
        im = Image.open(find(f"{v}_{ko}.png")).convert("RGBA")
        w0, h0 = im.size
        # 이 조각에서 걷는 선이 지나는 행(원본 px). 끝 조각은 dy 만큼 위 행이 중간의 걷는 선과 같은 높이다.
        row = cfg["walk_row"] - (cfg["dy"] if part != "mid" else 0)
        pivot_y = round((h0 - row) / h0, 4)
        if cfg["scale"] != 1.0:
            im = im.resize((max(1, round(w0 * cfg["scale"])), max(1, round(h0 * cfg["scale"]))), Image.LANCZOS)
        w, h = im.size
        out = f"lfl_{v}_{part}.png"
        im.save(os.path.join(OUT, out), optimize=True)
        entry["parts"][part] = {
            "file": out, "src_px": [w0, h0], "px": [w, h], "units": [round(w / 100, 4), round(h / 100, 4)],
            "walk_row_src": row, "pivot_x": PIVOT_X[part], "pivot_y": pivot_y,
        }
        print(f"{out:26s} {w0}x{h0} -> {w}x{h}  pivot ({PIVOT_X[part]}, {pivot_y})")
    manifest["villages"][v] = entry
with open(os.path.join(OUT, "manifest.json"), "w", encoding="utf-8") as f:
    json.dump(manifest, f, ensure_ascii=False, indent=1)
print("manifest", os.path.join(OUT, "manifest.json"))
