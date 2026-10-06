# WO-050 §2-18 — 레벨업 "몸 뒤 금빛 원" 그림을 만든다(메이플 리소스 검색에 마땅한 부드러운 금빛 원이 없어 직접 그린다 · 다시 돌려도 같은 결과).
#
#   python Docs/tools/levelup-glow/make.py     →  메월드폴더/리소스파일/레벨업빛/_upload/levelup_glow.png + manifest.json
#   node Docs/tools/levelup-glow/upload.cjs    →  그룹 mIYbC 에 올리고 Docs/tools/levelup-glow/glow-upload.json 에 RUID 기록
#
# 모양: 256×256 · 가운데가 가장 밝은 금색(안쪽 연노랑 → 바깥 진금) · 알파는 가장자리로 부드럽게 0(투명 가장자리) · 가는 금 고리 한 줄.
import json
import os

import numpy as np
from PIL import Image

OUT = "C:/Users/mingu/메월드폴더/리소스파일/레벨업빛/_upload"
SIZE = 256
os.makedirs(OUT, exist_ok=True)

yy, xx = np.mgrid[0:SIZE, 0:SIZE]
r = np.hypot(xx - (SIZE - 1) / 2.0, yy - (SIZE - 1) / 2.0) / (SIZE / 2.0)  # 0(가운데) ~ 1(가장자리)
core = np.clip(1.0 - r, 0.0, 1.0)
alpha = (core ** 1.5) * 0.92
ring = np.exp(-(((r - 0.78) / 0.045) ** 2)) * 0.55  # 바깥쪽 가는 고리
alpha = np.clip(alpha + ring * (r < 1.0), 0.0, 1.0)
alpha[r >= 1.0] = 0.0
t = np.clip(r, 0.0, 1.0)
rgb = np.zeros((SIZE, SIZE, 3))
rgb[..., 0] = 255
rgb[..., 1] = 244 - 52 * t  # 244 → 192
rgb[..., 2] = 184 - 112 * t  # 184 → 72
img = np.concatenate([rgb, alpha[..., None] * 255.0], axis=2)
img = np.clip(np.rint(img), 0, 255).astype(np.uint8)
path = os.path.join(OUT, "levelup_glow.png")
Image.fromarray(img, "RGBA").save(path, optimize=True)
json.dump({"dui_levelup_glow": {"file": "levelup_glow.png", "px": [SIZE, SIZE], "bytes": os.path.getsize(path)}},
          open(os.path.join(OUT, "manifest.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("ok", path, os.path.getsize(path), "bytes")
