# WO-048 — 시설 오라 띠 애니메이션 프레임 합치기 (다시 돌려도 같은 결과)
#
#   python Docs/tools/aura-anim/prep.py
#
# 입력: 메월드폴더/리소스파일/오라-애니메이션/
#   ref/game/aura_band[_<kind>].png        디자이너 정지 띠 1200x600 (게임에 올라가 있는 그림과 같은 규격)
#   concepts/3-dawn-drift/full/overlay_NN  "떠오르는 안개" 겹 24장 1200x600 (RGB 흰색 · 곧은 알파)
#   concepts.json                          종류별 물들일 색(tint) · 겹 투명도(overlay_opacity)
# 출력: 같은 폴더 _upload/aura_mist_<kind>_NN.png 96장 + _upload/manifest.json
#
# 합성(README "Game compositing" 순서 그대로): 정지 띠(알파 × 0.9) 위에 겹(RGB × tint · 알파 × overlay_opacity)을 보통 source-over 로 얹는다.
# 투명도 0.9 가 그림에 들어가므로 게임에서는 렌더러 색 알파를 1 로 둔다(AuraEmitter).
# 크기 1200x600 · 가운데 피벗 그대로 — AuraEmitter.ApplySize 의 1200x600 기준 배율을 안 고쳐도 된다.
import hashlib, json, os
import numpy as np
from PIL import Image

SRC = "C:/Users/mingu/메월드폴더/리소스파일/오라-애니메이션"
OUT = os.path.join(SRC, "_upload")
CONCEPT = "dawn-drift"
STILL_ALPHA = 0.9
KINDS = {"base": "aura_band.png", "speed": "aura_band_speed.png", "attack": "aura_band_attack.png", "heal": "aura_band_heal.png"}
SIZE = (1200, 600)

concepts = json.load(open(os.path.join(SRC, "concepts.json"), encoding="utf-8"))
c = next(x for x in concepts if x["slug"] == CONCEPT)
frames, fps, ov_op = c["frames"], c["fps"], c["overlay_opacity"]
os.makedirs(OUT, exist_ok=True)

overlays = []
for i in range(frames):
    im = Image.open(os.path.join(SRC, "concepts", "3-" + CONCEPT, "full", "overlay_%02d.png" % i)).convert("RGBA")
    assert im.size == SIZE, (i, im.size)
    overlays.append(np.asarray(im, dtype=np.float64) / 255.0)

manifest = {"concept": CONCEPT, "frames": frames, "fps": fps, "frameSec": round(1.0 / fps, 4), "px": list(SIZE),
            "pivot": [0.5, 0.5], "stillAlpha": STILL_ALPHA, "overlayOpacity": ov_op, "kinds": {}}
largest = 0
for kind, fname in KINDS.items():
    still = Image.open(os.path.join(SRC, "ref", "game", fname)).convert("RGBA")
    assert still.size == SIZE, (kind, still.size)
    s = np.asarray(still, dtype=np.float64) / 255.0
    s_rgb, s_a = s[..., :3], s[..., 3:4] * STILL_ALPHA
    tint = np.array(c["tint"][kind], dtype=np.float64) / 255.0
    files = []
    for i, o in enumerate(overlays):
        o_rgb, o_a = o[..., :3] * tint, o[..., 3:4] * ov_op
        a = o_a + s_a * (1.0 - o_a)
        num = o_rgb * o_a + s_rgb * s_a * (1.0 - o_a)
        rgb = np.where(a > 0, num / np.maximum(a, 1e-12), 0.0)
        px = np.concatenate([rgb, a], axis=2)
        px = np.clip(np.rint(px * 255.0), 0, 255).astype(np.uint8)
        name = "aura_mist_%s_%02d.png" % (kind, i)
        path = os.path.join(OUT, name)
        Image.fromarray(px, "RGBA").save(path, optimize=True)
        b = os.path.getsize(path)
        largest = max(largest, b)
        files.append({"file": name, "bytes": b, "md5": hashlib.md5(open(path, "rb").read()).hexdigest()})
    manifest["kinds"][kind] = {"still": "ref/game/" + fname, "tint": c["tint"][kind], "files": files}
    print(kind, "frames", len(files), "max bytes", max(f["bytes"] for f in files))

json.dump(manifest, open(os.path.join(OUT, "manifest.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("done", sum(len(k["files"]) for k in manifest["kinds"].values()), "files · largest", largest, "bytes")
