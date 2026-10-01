#!/usr/bin/env python3
"""WO-040 조각 0 — 방어 시설 새 그림 가공(헤네시스 포탑 E18-7-1 한 종류 · 시험).

원본(리소스파일/포탑관련 모든것) → 공통 캔버스로 자르고 50% 줄여 `_upload/E18-7-1/*.png` + `manifest.json` 을 만든다.
다시 돌려도 같은 결과(난수 · 시간 없음). 의존: Pillow, numpy.

  python Docs/tools/facility-art/prep.py            # 가공 + manifest
  python Docs/tools/facility-art/prep.py --sheet    # 확인용 시트(리소스파일/.../_upload/E18-7-1/_check_*.png)도

규칙(조사 문서 WO-040-시설-그림-현황조사.md §3):
- 재생 순서는 번호 높은 것 → 낮은 것(0007 → 0000). 프레임마다 따로 여백을 자르지 않는다 — 한 종류의 모든 프레임이 **같은 크롭 · 같은 피벗**.
- 손상(damage-1) · 완파(damage-2) 정지 원본은 캔버스가 달라 NORMAL 캔버스(1536×1024)에 맞춰 정렬한다(§3-4).
  손상 정지 = 손상 공격 0007 의 몸체와 IoU 로 맞춤 · 완파 정지 = 섬(바닥 풀 · 돌 층)을 NORMAL 0007 의 섬과 IoU 로 맞춤.
- 캔버스 너비 · 높이는 8 의 배수(50% 축소 뒤 4 의 배수 — 문서 "4 의 배수면 업로드 때 자동 최적화").
"""
import json
import os
import sys
import unicodedata

import numpy as np
from PIL import Image

SRC = 'C:/Users/mingu/메월드폴더/리소스파일/포탑관련 모든것'
OUT = SRC + '/_upload/E18-7-1'
KIND = 'E18-7-1'
ALPHA = 16            # 불투명 기준(조사 문서와 같음)
MARGIN = 8            # 합집합 불투명 상자 바깥 여백(원본 px)
REDUCE = 0.5          # 축소 배율
FRAMES = 8
# 발사체좌표.txt (원본 캔버스 1536×1024 기준 px · 기준 파일 = 0007)
FIRE = {'normal': (602, 370), 'damage1': (601, 364)}


def find(name):
    """폴더명이 NFD 라 정규화 비교로 찾는다."""
    for r, _d, fs in os.walk(SRC):
        if '_upload' in r or 'review' in r:
            continue
        for f in fs:
            if unicodedata.normalize('NFC', f) == name:
                return os.path.join(r, f)
    raise FileNotFoundError(name)


def load(name):
    return Image.open(find(name)).convert('RGBA')


def amask(im):
    return np.array(im)[:, :, 3] > ALPHA


def bbox(m):
    ys, xs = np.where(m)
    return int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())


def floor_and_center(m):
    """바닥선 = 행 폭이 최대 행의 25% 이상인 가장 아래 행 · 기둥 중심 = 그 근처(60행) 불투명의 가로 중앙."""
    rw = m.sum(1)
    fl = int(np.where(rw >= 0.25 * rw.max())[0].max())
    ys, xs = np.where(m)
    sel = xs[ys >= fl - 60]
    return fl, (int(sel.min()) + int(sel.max())) / 2.0


def place(still, s, dx, dy, size):
    """정지 그림을 s 배로 줄이거나 늘려 dx, dy 에 놓은 NORMAL 크기 캔버스."""
    w, h = still.size
    t = still.convert('RGBa').resize((max(1, round(w * s)), max(1, round(h * s))), Image.LANCZOS).convert('RGBA')
    cv = Image.new('RGBA', size, (0, 0, 0, 0))
    cv.paste(t, (int(round(dx)), int(round(dy))))
    return cv


def iou(a, b):
    return float((a & b).sum()) / float(max(1, (a | b).sum()))


def align(still, ref_mask, size, s_range, dx_range, dy_range, region=None):
    """정지 그림의 스케일 · 위치를 ref_mask 와의 IoU 로 맞춘다(반 해상도로 훑고 원본 해상도로 다듬는다). region = (y0, y1) 행만 비교."""
    h2, w2 = size[1] // 2, size[0] // 2
    ref2 = np.array(Image.fromarray((ref_mask * 255).astype(np.uint8)).resize((w2, h2), Image.BILINEAR)) > 127
    if region:
        ref2 = ref2.copy()
        ref2[: region[0] // 2] = False
        ref2[region[1] // 2:] = False
    st_a = still.split()[3]
    best = (-1, None)
    for s in np.arange(s_range[0], s_range[1] + 1e-9, s_range[2]):
        sw, sh = max(1, round(still.width * s / 2)), max(1, round(still.height * s / 2))
        sm = np.array(st_a.resize((sw, sh), Image.BILINEAR)) > 127
        for dy in range(dy_range[0] // 2, dy_range[1] // 2 + 1):
            for dx in range(dx_range[0] // 2, dx_range[1] // 2 + 1):
                cv = np.zeros((h2, w2), bool)
                x0, y0 = max(0, dx), max(0, dy)
                x1, y1 = min(w2, dx + sw), min(h2, dy + sh)
                if x1 <= x0 or y1 <= y0:
                    continue
                cv[y0:y1, x0:x1] = sm[y0 - dy:y1 - dy, x0 - dx:x1 - dx]
                if region:
                    cv[: region[0] // 2] = False
                    cv[region[1] // 2:] = False
                v = iou(cv, ref2)
                if v > best[0]:
                    best = (v, (float(s), dx * 2, dy * 2))
    # 원본 해상도로 다듬기(스케일 ±0.01 · 위치 ±2px)
    s0, dx0, dy0 = best[1]
    ref = ref_mask.copy()
    if region:
        ref[: region[0]] = False
        ref[region[1]:] = False
    fine = (-1, None)
    for s in (s0 - 0.01, s0 - 0.005, s0, s0 + 0.005, s0 + 0.01):
        for dy in range(dy0 - 2, dy0 + 3):
            for dx in range(dx0 - 2, dx0 + 3):
                m = amask(place(still, s, dx, dy, size))
                if region:
                    m[: region[0]] = False
                    m[region[1]:] = False
                v = iou(m, ref)
                if v > fine[0]:
                    fine = (v, (round(float(s), 3), dx, dy))
    return fine


def main():
    want_sheet = '--sheet' in sys.argv
    os.makedirs(OUT, exist_ok=True)
    normal = {i: load('%s__%04d.png' % (KIND, i)) for i in range(FRAMES)}
    damage = {i: load('%s_damage-1__%04d.png' % (KIND, i)) for i in range(FRAMES)}
    d1_still = load(KIND + '_damage-1.png')
    d2_still = load(KIND + '_damage-2.png')
    size = normal[0].size  # (1536, 1024)
    assert all(im.size == size for im in list(normal.values()) + list(damage.values())), '프레임 크기가 다름'

    # 기준 피벗: NORMAL 프레임의 바닥선 · 기둥 중심(프레임 간 같아야 한다 — 조사 §3-2)
    fcs = [floor_and_center(amask(normal[i])) for i in range(FRAMES)]
    floors = sorted(set(f for f, _ in fcs))
    centers = sorted(set(c for _, c in fcs))
    assert len(floors) == 1 and len(centers) == 1, ('NORMAL 프레임 간 바닥선/기둥 중심이 다름', floors, centers)
    floor, pillar = floors[0], centers[0]

    # 정지 그림 정렬
    d1_fit = align(d1_still, amask(damage[7]), size, (0.70, 0.78, 0.005), (330, 370), (0, 20))
    d2_fit = align(d2_still, amask(normal[7]), size, (0.66, 0.82, 0.01), (330, 400), (-10, 50), region=(size[1] - 330, size[1]))
    d1 = place(d1_still, d1_fit[1][0], d1_fit[1][1], d1_fit[1][2], size)
    d2 = place(d2_still, d2_fit[1][0], d2_fit[1][1], d2_fit[1][2], size)
    print('손상 정지 정렬: IoU %.3f  scale/dx/dy = %s' % (d1_fit[0], d1_fit[1]))
    print('완파 정지 정렬: IoU %.3f(섬 영역)  scale/dx/dy = %s' % (d2_fit[0], d2_fit[1]))

    items = []  # (이름, 상태, 프레임 번호, 원본 파일, 정렬)
    for i in range(FRAMES - 1, -1, -1):
        items.append(('normal_%04d' % i, 'normal', i, '%s__%04d.png' % (KIND, i), normal[i], None))
    for i in range(FRAMES - 1, -1, -1):
        items.append(('damage1_%04d' % i, 'damage1', i, '%s_damage-1__%04d.png' % (KIND, i), damage[i], None))
    items.append(('damage1_still', 'damage1', None, KIND + '_damage-1.png', d1, {'iou': d1_fit[0], 'scale': d1_fit[1][0], 'dx': d1_fit[1][1], 'dy': d1_fit[1][2]}))
    items.append(('damage2_still', 'damage2', None, KIND + '_damage-2.png', d2, {'iou': d2_fit[0], 'scale': d2_fit[1][0], 'dx': d2_fit[1][1], 'dy': d2_fit[1][2], 'region': '섬(아래 330행)'}))

    # 공통 캔버스: 모든 프레임 불투명 경계의 합집합 + 여백, 기둥 중심 기준 좌우 대칭 · 8 의 배수
    boxes = [bbox(amask(im)) for _n, _s, _i, _f, im, _a in items]
    xmin = min(b[0] for b in boxes)
    ymin = min(b[1] for b in boxes)
    xmax = max(b[2] for b in boxes)
    ymax = max(b[3] for b in boxes)
    half = max(pillar - xmin, xmax - pillar) + MARGIN
    w = int(np.ceil((2 * half + 1) / 8.0) * 8)
    top = ymin - MARGIN
    bottom = ymax + MARGIN + 1
    h = int(np.ceil((bottom - top) / 8.0) * 8)
    x0 = int(round(pillar - w / 2.0))
    y0 = top
    # 아래 여백이 모자라면 위로 늘린다(바닥을 캔버스 밑에 고정)
    y0 = bottom - h
    box = (x0, y0, x0 + w, y0 + h)
    rw, rh = int(w * REDUCE), int(h * REDUCE)
    assert rw % 4 == 0 and rh % 4 == 0
    pivot_px = ((pillar - x0) * REDUCE, (floor + 1 - y0) * REDUCE)   # 바닥선 중앙(축소 뒤 px · 위에서부터)
    print('공통 크롭(원본 px) x%d..%d y%d..%d = %dx%d → 축소 %dx%d · 기둥 중심 %.1f · 바닥선 %d → 피벗 px %s' % (box[0], box[2], box[1], box[3], w, h, rw, rh, pillar, floor, pivot_px))

    # 발사 좌표(축소 뒤 캔버스 px → 피벗 기준 오프셋)
    fire = {}
    for k, (fx, fy) in FIRE.items():
        cx, cy = (fx - x0) * REDUCE, (fy - y0) * REDUCE
        fire[k] = {
            'orig_xy': [fx, fy],
            'canvas_px': [cx, cy],                                    # 축소 뒤 캔버스(왼쪽 위 원점)
            'from_pillar_floor_px': [cx - pivot_px[0], pivot_px[1] - cy],   # + 오른쪽 · + 위 (원본이 바라보는 방향 = 왼쪽이라 음수)
            'from_center_px': [cx - rw / 2.0, rh / 2.0 - cy],         # 캔버스 중심 기준(= 중심 피벗 엔티티 기준)
        }

    mf = {
        'kind': KIND, 'reduce': REDUCE, 'alpha_threshold': ALPHA, 'margin_px': MARGIN,
        'source_canvas': list(size), 'crop_box_orig': list(box), 'canvas_orig': [w, h], 'canvas': [rw, rh],
        'pillar_center_orig_x': pillar, 'floor_orig_y': floor,
        'pivot_px_from_top_left': [pivot_px[0], pivot_px[1]],
        'pivot_norm_x': pivot_px[0] / rw,
        'pivot_norm_y_from_bottom': 1.0 - pivot_px[1] / rh,
        'opaque_union_orig': [xmin, ymin, xmax, ymax],
        'height_above_floor_px': (floor + 1 - ymin) * REDUCE,
        'play_order': '0007 → 0000 (번호 높은 것 → 낮은 것)',
        'fire': fire, 'frames': [],
    }
    total = 0
    for name, state, idx, src, im, al in items:
        out = im.crop(box).convert('RGBa').resize((rw, rh), Image.LANCZOS).convert('RGBA')
        path = '%s/%s.png' % (OUT, name)
        out.save(path, optimize=True)
        sz = os.path.getsize(path)
        total += sz
        mf['frames'].append({
            'name': name, 'state': state, 'frame': idx, 'source': unicodedata.normalize('NFC', os.path.relpath(find(src), SRC)).replace('\\', '/'),
            'file': name + '.png', 'bytes': sz, 'align': al,
        })
    mf['total_bytes'] = total
    with open(OUT + '/manifest.json', 'w', encoding='utf-8') as f:
        json.dump(mf, f, ensure_ascii=False, indent=1)
    print('저장 %d장 · 합계 %.2f MB → %s' % (len(items), total / 1048576.0, OUT))

    if want_sheet:
        def sheet(names, out_name, cols):
            ims = [Image.open('%s/%s.png' % (OUT, n)).convert('RGBA') for n in names]
            rows = (len(ims) + cols - 1) // cols
            sh = Image.new('RGBA', (cols * rw, rows * rh), (70, 110, 70, 255))
            for i, t in enumerate(ims):
                sh.alpha_composite(t, ((i % cols) * rw, (i // cols) * rh))
            # 피벗(바닥선 중앙) 십자
            from PIL import ImageDraw
            dr = ImageDraw.Draw(sh)
            for i in range(len(ims)):
                ox, oy = (i % cols) * rw, (i // cols) * rh
                dr.line([(ox + pivot_px[0] - 12, oy + pivot_px[1]), (ox + pivot_px[0] + 12, oy + pivot_px[1])], fill=(255, 0, 255, 255), width=2)
                dr.line([(ox + pivot_px[0], oy + pivot_px[1] - 12), (ox + pivot_px[0], oy + pivot_px[1] + 12)], fill=(255, 0, 255, 255), width=2)
            sh.convert('RGB').save('%s/%s.png' % (OUT, out_name))
        sheet([n for n, *_ in items if n.startswith('normal')], '_check_normal', 4)
        sheet([n for n, *_ in items if n.startswith('damage1_0')], '_check_damage1', 4)
        sheet(['damage1_still', 'damage2_still', 'normal_0007', 'damage1_0007'], '_check_stills', 4)


if __name__ == '__main__':
    main()
