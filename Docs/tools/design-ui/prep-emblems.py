# WO-050 §4 — drive 앰블럼 그림 7장을 올릴 크기로 가공한다(다시 돌려도 같은 결과).
#
#   python Docs/tools/design-ui/prep-emblems.py
#
# 입력: 메월드폴더/리소스파일/drive-download-20261005T101642Z-1-001/*.png (1254×1254 RGBA · 파일 이름은 NFD 한글일 수 있다 → NFC 로 맞춰 찾는다)
# 출력: 같은 폴더 _upload/<이름>.png + manifest.json
#   마을 5장(헤네시스 · 커닝시티 · 엘리니아 · 노틸러스 · 페리온) = 168×168 (기존 emblem_* 와 같은 크기라 기존 배치가 그대로 맞는다)
#   키우기 · 지키기 = 144×144 (소개 카드 표시 72 의 2배)
# 가공: 투명 여백을 자르고(알파 > 8) 가운데 정렬한 정사각 캔버스에 넣은 뒤 LANCZOS 로 줄인다. 비율은 바꾸지 않는다.
import json
import os
import unicodedata

import numpy as np
from PIL import Image

SRC = "C:/Users/mingu/메월드폴더/리소스파일/drive-download-20261005T101642Z-1-001"
OUT = os.path.join(SRC, "_upload")
# (한글 파일 이름, 올릴 이름, 크기)
ITEMS = [
    ("헤네시스", "dui_emblem_henesys_v2", 168),
    ("커닝시티", "dui_emblem_kerning_v2", 168),
    ("엘리니아", "dui_emblem_ellinia_v2", 168),
    ("노틸러스", "dui_emblem_nautilus_v2", 168),
    ("페리온", "dui_emblem_perion_v2", 168),
    ("키우기", "dui_intro_grow", 144),
    ("지키기", "dui_intro_defend", 144),
]

by_nfc = {unicodedata.normalize("NFC", f)[:-4]: f for f in os.listdir(SRC) if f.lower().endswith(".png")}
os.makedirs(OUT, exist_ok=True)
manifest = {}
for ko, name, px in ITEMS:
    src = os.path.join(SRC, by_nfc[ko])
    im = Image.open(src).convert("RGBA")
    a = np.asarray(im)[..., 3]
    ys, xs = np.where(a > 8)
    box = (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)
    cut = im.crop(box)
    side = max(cut.size)
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(cut, ((side - cut.size[0]) // 2, (side - cut.size[1]) // 2))
    out = canvas.resize((px, px), Image.LANCZOS)
    path = os.path.join(OUT, name + ".png")
    out.save(path, optimize=True)
    manifest[name] = {"file": name + ".png", "source": ko, "px": [px, px], "crop": list(box), "bytes": os.path.getsize(path)}
    print(name.ljust(26), ko, "crop", box, "->", px, os.path.getsize(path), "bytes")
json.dump(manifest, open(os.path.join(OUT, "manifest.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
