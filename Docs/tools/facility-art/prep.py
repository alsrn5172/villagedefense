#!/usr/bin/env python3
"""WO-040 조각 1 — 방어 시설 새 그림 14종 가공(공통 캔버스 크롭 · 50% 축소 · 피벗 · manifest · 접촉 시트).

원본(리소스파일/포탑관련 모든것) → 종류마다 `_upload/<종류>/*.png` + `_upload/<종류>/manifest.json`,
종류 전체를 묶은 `Docs/tools/facility-art/manifest.json`(저장소), 눈으로 볼 접촉 시트 `_upload/_sheets/<종류>.png`.
다시 돌려도 같은 결과(난수 · 시간 없음). 의존: Pillow, numpy.

  python Docs/tools/facility-art/prep.py                     # 14종 전부
  python Docs/tools/facility-art/prep.py E18-7-2 E18-9-1     # 골라서(이 경우 저장소 manifest 는 이미 있는 종류 값에 합쳐 씀)
  python Docs/tools/facility-art/prep.py --no-sheet          # 접촉 시트 생략

규칙(조사 문서 WO-040-시설-그림-현황조사.md §3 · 조각 0 체인지로그):
- 재생 순서는 번호 높은 것 → 낮은 것. 대기 프레임 = 첫 프레임(가장 높은 번호). 프레임마다 따로 여백을 자르지 않는다 —
  한 종류의 모든 프레임 · 손상 · 완파가 **같은 크롭 · 같은 피벗**.
- 공통 캔버스 = 그 종류의 모든 그림(일반 · 손상 공격 · 정렬한 손상/완파 정지) 불투명 경계의 합집합 + 여백, 기둥 중심 기준 좌우 대칭,
  가로세로 8 의 배수(50% 축소 뒤 4 의 배수 — 업로드 때 자동 최적화). 대칭이라 "기둥 중심 = 캔버스 가운데" 이고 피벗 속성이 먹든 안 먹든 반전 때 안 튄다.
- 피벗 = x 는 기둥(몸체) 중심 · y 는 캔버스 가운데(지금 GroundOffset 규칙을 그대로 쓰려고). 피벗 속성은 올릴 때 정한다.
- 손상(damage-1) · 완파(damage-2) 정지 원본은 캔버스가 달라 일반 캔버스에 맞춰 정렬한다(조사 §3-4).
  손상 정지 = 7-x 는 손상 공격 첫 프레임 · 그 밖은 일반 첫 프레임의 몸체와 IoU 로 맞춤(FFT 상관으로 훑고 원본 해상도로 다듬음).
  완파 정지 = 손상 정지의 스케일을 중심으로 일반 첫 프레임의 아래쪽(바닥 · 섬) 영역과 IoU 로 맞춤. 잔해 모양이 달라 전체 IoU 는 못 씀.

WO-040 M3(2026-10-02) 확장 — 종류 설정에 선택 항목 5개(없으면 지금까지와 똑같이 돈다):
- src       : 원본 파일 이름의 종류 ID. 새 이름으로 올리는 종류(E18-7-5b)는 id 와 다르다(그룹 리소스 이름 · 폴더 · 표 키는 id 를 쓴다 · 옛 RUID 는 그대로 남는다).
- src_dirs  : {'normal': [하위 폴더 경로], 'damage': [...]} — 같은 이름 파일이 여러 폴더에 있을 때(구버전 · _backup) 이 폴더의 것을 먼저 쓴다.
- reduce    : 축소 배율(기본 0.5). 원본이 이미 작은 7-5 는 1.0.
- pad       : 원본 그림 둘레에 투명 여백을 이만큼 더한 뒤 처리한다(손상 · 완파 정지가 일반 캔버스보다 커서 잘리는 것을 막는다).
- dedupe    : 같은 그림(픽셀이 같은 프레임)은 첫 번째만 올리고 나머지는 manifest 의 aliases 로 가리킨다(7-5 3연사 복제 프레임).
- skip_d1_still : 손상 정지 그림은 올리지 않는다(손상 공격의 첫 프레임이 그 역할).
- fit_d     : 정렬 탐색의 축소 단위(기본 4 · 캔버스가 작으면 2).
"""
import hashlib
import json
import os
import re
import sys
import unicodedata

import numpy as np
from PIL import Image, ImageDraw

SRC = 'C:/Users/mingu/메월드폴더/리소스파일/포탑관련 모든것'
UP = SRC + '/_upload'
REPO_MANIFEST = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'manifest.json')
ALPHA = 16            # 불투명 기준(조사 문서와 같음)
MARGIN = 8            # 합집합 불투명 상자 바깥 여백(원본 px)
REDUCE = 0.5          # 축소 배율
BASE_FRAC = 0.33      # 완파 정렬에 쓰는 아래쪽 영역 = (바닥 − 맨 위)의 33%
STATIC_DIFF = 1.5     # 프레임 간 변화량이 이 이하면 "거의 정지"

# 종류 설정표 — 발사 좌표 = 발사체좌표.txt(원본 캔버스 px · 왼쪽 위 원점), 발사 프레임 = 조사 §3-2 의 눈 확인 + 좌표 기준 파일.
#   d1_scale = 조사 §3-4 의 손상 정지 스케일(FFT 탐색 중심) · d1_region = 손상 정지 비교에서 위쪽을 뺄 비율(8-1 은 석궁이 떨어져 나가 윗부분이 다름)
#   pin = 이미 올린 값을 그대로 쓰라고 못박는 정렬(7-1: 조각 0 에서 올린 18장과 같은 결과를 내려고)
KINDS = [
    dict(id='E18-7-1', village='HENESYS', fac='TOWER', n=8, dmg_attack=True, attacker=True, d1_scale=0.74,
         fire_n=(602, 370), fire_d=(601, 364), fire_frame_n=6, fire_frame_d=6,
         pin=dict(d1=(0.74, 354, 8), d2=(0.73, 355, 6)),
         note='버섯 지붕 대포탑 · 0006 섬광 · 0004~0003 포탄이 그림 속에 보임 · 공격 1회 재생'),
    dict(id='E18-7-2', village='KERNING', fac='TOWER', n=8, dmg_attack=True, attacker=True, d1_scale=1.005,
         fire_n=(415, 498), fire_d=(412, 502), fire_frame_n=5, fire_frame_d=5,
         note='산업/기계 대포탑 · 0005~0002 작은 별 투사체 · 기둥이 캔버스 중심에서 오른쪽으로 치우침'),
    dict(id='E18-7-3', village='PERION', fac='TOWER', n=15, dmg_attack=True, attacker=True, d1_scale=1.04,
         fire_n=(1304, 623), fire_d=(1255, 642), fire_frame_n=9, fire_frame_d=9,
         note='목재·석재 작살 포탑 · _fire 15프레임 · 0009~0005 작살이 몸에서 떨어져 왼쪽으로 · 프레임 15장이라 쿨보다 길다(프레임 시간 단축 필요)'),
    dict(id='E18-7-4', village='ELLINIA', fac='TOWER', n=10, dmg_attack=True, attacker=True, d1_scale=1.63,
         fire_n=(800, 420), fire_d=(808, 398), fire_frame_n=2, fire_frame_d=2,
         note='나무 새총 포탑 · 최신 10프레임 · 0003(A) 잎 분리 시작 · 0002(B) 발사 중간 = 좌표 기준 프레임'),
    # 2026-10-02 사용자: 옛 5프레임(1254 캔버스 · 상하 움직임만)을 버리고 새 3연사 18프레임(362×362)으로 교체. 옛 RUID(E18-7-5)는 그룹 리소스에 그대로 남아 있다(ruid-map.json 의 E18-7-5 칸 · 지우지 않음).
    #   일반 = 노틸러스포탑공격수정/E18-7-5__0000~0017 · 손상 = damage-1_attack/E18-7-5 · 완파 = 부서진 포탑들/E18-7-5_damage-2(1254 캔버스 → 새 캔버스에 다시 정렬).
    #   18프레임 안에 같은 그림이 복사돼 있다(설명서 [9] 대응표) → dedupe. 포구(발사) = 0011 / 0008 / 0005 진입 때 한 발씩 · 일반 (85,131) · 손상 (76,123).
    dict(id='E18-7-5b', src='E18-7-5', village='NAUTILUS', fac='TOWER', n=18, dmg_attack=True, attacker=True, d1_scale=0.32,
         src_dirs={'normal': ['노틸러스포탑공격수정'], 'damage': ['damage-1_attack', 'E18-7-5']},
         reduce=1.0, pad=40, dedupe=True, skip_d1_still=True, fit_d=2,
         fire_n=(85, 131), fire_d=(76, 123), fire_frame_n=11, fire_frame_d=11, fire_frames_n=[11, 8, 5], fire_frames_d=[11, 8, 5],
         note='해양 대포탑 3연사 18프레임(362×362 · 축소 없음) · 0011/0008/0005 진입 때 한 발씩 · 0011~0003 은 50ms 나머지 100ms(설명서 [9]) · 같은 그림 복사 프레임은 한 장만 올림'),
    dict(id='E18-8-1', village='HENESYS', fac='SUPPRESSOR', n=12, dmg_attack=False, attacker=True, d1_scale=1.045, d1_region=0.70,
         fire_n=(236, 408), fire_d=None, fire_frame_n=10, fire_frame_d=None,
         note='버섯 지붕 석궁·수정 탑 · 0011 → 0010 에서 화살 발사 · 손상되면 석궁이 떨어져 공격 불가(손상 정지 = 석궁 없음)'),
    dict(id='E18-8-2', village='KERNING', fac='SUPPRESSOR', n=8, dmg_attack=False, attacker=False, d1_scale=0.985,
         note='산업/전기 설비 탑 · 상시 반복 · 프레임 간 차이 거의 없음'),
    dict(id='E18-8-3', village='PERION', fac='SUPPRESSOR', n=4, dmg_attack=False, attacker=False, d1_scale=0.965,
         note='불꽃 문양 돌기둥·제단 · 상시 반복 · 프레임 간 차이 거의 없음'),
    dict(id='E18-8-4', village='ELLINIA', fac='SUPPRESSOR', n=5, dmg_attack=False, attacker=False, d1_scale=1.64,
         note='초록빛 결정·덩굴 분수 · 상시 반복 · 뚜렷한 움직임 · 마지막 → 첫 프레임 이음매 8.7(튐 주의)'),
    dict(id='E18-8-5', village='NAUTILUS', fac='SUPPRESSOR', n=5, dmg_attack=False, attacker=False, d1_scale=0.945,
         note='해양 장치·등불 탑 · 상시 반복 · 뚜렷한 움직임'),
    dict(id='E18-9-1', village='HENESYS', fac='CORE', n=8, dmg_attack=False, attacker=False, d1_scale=0.905,
         note='버섯 지붕 건물(넥서스) · 상시 반복 · 프레임 간 차이 거의 없음'),
    dict(id='E18-9-2', village='KERNING', fac='CORE', n=8, dmg_attack=False, attacker=False, d1_scale=0.95,
         note='산업/기계 건물(넥서스) · 상시 반복'),
    dict(id='E18-9-3', village='PERION', fac='CORE', n=4, dmg_attack=False, attacker=False, d1_scale=0.99,
         note='모닥불 제단(넥서스) · 상시 반복 · 약한 움직임'),
    dict(id='E18-9-4', village='ELLINIA', fac='CORE', n=5, dmg_attack=False, attacker=False, d1_scale=0.995,
         note='초록빛 결정·나무 제단(넥서스) · 상시 반복 · 프레임 간 차이 거의 없음'),
]


# 시설 그림이 아닌 발사체 그림(그룹 리소스로 올려 FacilityAttackFx.BallRuid 에 쓴다) — WO-040 M3.
#   엘리니아 포탑 = 포탑들_gif_png/새총알.png (2048 캔버스 · 7-4 프레임과 같은 축척이라 시설 Scale 을 그대로 곱하면 그림 속 잎과 같은 크기).
#   불투명(알파 > 0 · 꼬리 빛줄기 포함)상자로 크롭 + 여백 · 50% 축소(7-4 와 같게) · 피벗 가운데(발사체는 중심이 위치 · 진행 방향으로 돎).
PROJECTILES = [
    # 새총알.png 의 잎은 그림 속(7-4 프레임) 잎보다 크다(잎 몸통 길이 425px · 그림 속 0002 215 → 0001 262 → 다음 약 320) → 몸통 길이 비 0.75(= 320/425)로 줄인다:
    #   reduce = 7-4 의 0.5 × 0.75 = 0.375 → 엔티티 Scale 을 시설 Scale 과 같게 두면 그림 속 잎이 이어서 날아가는 크기가 된다(코드 · 표에 배율 상수 없음).
    dict(id='E18-7-4-proj', src='새총알.png', village='ELLINIA', fac='TOWER', reduce=0.375, name='leaf075', margin=4,
         note='엘리니아 포탑 발사체(잎) · 새총알.png 2048 캔버스(7-4 프레임과 같은 축척) · 알파>0 상자 크롭 · 0.375 배(= 7-4 의 50% × 잎 크기 보정 0.75) · 피벗 가운데 · 그림은 왼쪽을 봄(FaceDeg 180) · 엔티티 Scale = 시설 Scale 그대로'),
]


# ---------------------------------------------------------------- 파일 찾기
_IDX = None
_LOC = {}   # 종류 설정의 src_dirs 폴더 안 파일(이름 → 경로) — 같은 이름이 다른 폴더(구버전 · 백업)에도 있을 때 이쪽이 먼저


def index():
    """폴더명이 NFD 라 정규화 비교로 찾는다. {NFC 파일명: 전체 경로} (백업 폴더는 건너뛴다)"""
    global _IDX
    if _IDX is None:
        _IDX = {}
        for r, _d, fs in os.walk(SRC):
            if '_upload' in r or 'review' in r or '_backup' in r:
                continue
            for f in fs:
                if f.lower().endswith('.png'):
                    _IDX.setdefault(unicodedata.normalize('NFC', f), os.path.join(r, f))
    return _IDX


def all_names():
    d = dict(index())
    d.update(_LOC)
    return d


def find_dir(parts):
    """SRC 아래 하위 폴더를 NFC 비교로 찾는다."""
    cur = SRC
    for p in parts:
        hit = None
        for n in os.listdir(cur):
            if unicodedata.normalize('NFC', n) == unicodedata.normalize('NFC', p):
                hit = n
                break
        assert hit, ('폴더 없음', cur, p)
        cur = os.path.join(cur, hit)
    return cur


def find(name):
    p = _LOC.get(name) or index().get(name)
    if not p:
        raise FileNotFoundError(name)
    return p


def rel(name):
    return unicodedata.normalize('NFC', os.path.relpath(find(name), SRC)).replace('\\', '/')


def frames_of(pattern):
    """정규식에 맞는 파일 → {프레임 번호: 파일명}. 번호가 겹치면 오류."""
    rx = re.compile(pattern)
    out = {}
    for nm in all_names():
        m = rx.match(nm)
        if m:
            i = int(m.group(1))
            assert i not in out, ('프레임 번호 겹침', pattern, i, nm, out[i])
            out[i] = nm
    return out


def load(name):
    return Image.open(find(name)).convert('RGBA')


# ---------------------------------------------------------------- 마스크 · 측정
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


def iou(a, b):
    return float((a & b).sum()) / float(max(1, (a | b).sum()))


def place(still, s, dx, dy, size):
    """정지 그림을 s 배로 줄이거나 늘려 dx, dy 에 놓은 일반 크기 캔버스."""
    w, h = still.size
    t = still.convert('RGBa').resize((max(1, round(w * s)), max(1, round(h * s))), Image.LANCZOS).convert('RGBA')
    cv = Image.new('RGBA', size, (0, 0, 0, 0))
    cv.paste(t, (int(round(dx)), int(round(dy))))
    return cv


def region_cut(m, region):
    if not region:
        return m
    m = m.copy()
    m[: region[0]] = False
    m[region[1]:] = False
    return m


# ---------------------------------------------------------------- 정렬(FFT 상관 + 원본 해상도 다듬기)
def small_mask(alpha_img, w, h):
    return np.array(alpha_img.resize((max(1, w), max(1, h)), Image.BILINEAR)) > 127


def coarse_fit(still, ref_mask, size, s_center, s_half, step, region=None, D=4):
    """1/D 해상도에서 스케일마다 FFT 상관으로 모든 위치의 IoU 를 한 번에 구해 가장 좋은 (IoU, s, dx, dy) 를 돌려준다."""
    W, H = size
    w, h = W // D, H // D
    ref = small_mask(Image.fromarray((ref_mask * 255).astype(np.uint8)), w, h)
    if region:
        ref = region_cut(ref, (region[0] // D, region[1] // D))
    rc = float(ref.sum())
    ya = still.split()[3]
    best = (-1.0, None)
    for s in np.arange(s_center - s_half, s_center + s_half + 1e-9, step):
        sw, sh = max(1, round(still.width * s / D)), max(1, round(still.height * s / D))
        sm = small_mask(ya, sw, sh)
        Ph = 1 << int(np.ceil(np.log2(h + sh)))
        Pw = 1 << int(np.ceil(np.log2(w + sw)))
        A = np.fft.rfft2(ref.astype(np.float32), (Ph, Pw))
        B = np.fft.rfft2(sm.astype(np.float32), (Ph, Pw))
        c = np.fft.irfft2(A * np.conj(B), (Ph, Pw))   # c[dy, dx] = Σ ref[y,x] · sm[y−dy, x−dx] (음수 위치는 뒤쪽으로 감김)
        dys = np.arange(-(sh - 1), h)
        dxs = np.arange(-(sw - 1), w)
        inter = c[np.ix_(dys % Ph, dxs % Pw)]
        # 정지 그림 불투명이 (캔버스 ∩ 영역) 행에 놓인 수 — 가로는 캔버스 밖으로 안 나간다고 본다
        rs = sm.sum(1).astype(np.float64)
        cs = np.concatenate([[0.0], np.cumsum(rs)])
        y0, y1 = (region[0] // D, region[1] // D) if region else (0, h)
        lo = np.clip(y0 - dys, 0, sh)
        hi = np.clip(y1 - dys, 0, sh)
        st_in = (cs[hi] - cs[lo])[:, None]
        un = rc + st_in - inter
        v = inter / np.maximum(un, 1.0)
        k = np.unravel_index(int(np.argmax(v)), v.shape)
        if v[k] > best[0]:
            best = (float(v[k]), (float(s), int(dxs[k[1]]) * D, int(dys[k[0]]) * D))
    return best


def fine_fit(still, ref_mask, size, s0, dx0, dy0, region=None, ds=0.01, dstep=0.005, dpos=5):
    """원본 해상도로 다듬기 — 스케일 ±ds · 위치 ±dpos."""
    W, H = size
    ref = region_cut(ref_mask, region)
    rc = float(ref.sum())
    ya = still.split()[3]
    best = (-1.0, None)
    for s in np.arange(s0 - ds, s0 + ds + 1e-9, dstep):
        s = round(float(s), 4)
        sm = np.array(ya.resize((max(1, round(still.width * s)), max(1, round(still.height * s))), Image.LANCZOS)) > ALPHA
        sh_, sw_ = sm.shape
        for dy in range(dy0 - dpos, dy0 + dpos + 1):
            for dx in range(dx0 - dpos, dx0 + dpos + 1):
                x0, y0 = max(0, dx), max(0, dy)
                x1, y1 = min(W, dx + sw_), min(H, dy + sh_)
                if x1 <= x0 or y1 <= y0:
                    continue
                part = sm[y0 - dy:y1 - dy, x0 - dx:x1 - dx]
                if region:
                    r0, r1 = max(y0, region[0]), min(y1, region[1])
                    if r1 <= r0:
                        continue
                    part_r = sm[r0 - dy:r1 - dy, x0 - dx:x1 - dx]
                    inter = float((ref[r0:r1, x0:x1] & part_r).sum())
                    st = float(part_r.sum())
                else:
                    inter = float((ref[y0:y1, x0:x1] & part).sum())
                    st = float(part.sum())
                v = inter / max(1.0, rc + st - inter)
                if v > best[0]:
                    best = (v, (s, dx, dy))
    return best


def fit_still(still, ref_mask, size, s_center, s_half, region=None, D=4):
    v, (s, dx, dy) = coarse_fit(still, ref_mask, size, s_center, s_half, 0.005, region, D)
    return fine_fit(still, ref_mask, size, s, dx, dy, region, dpos=max(5, D + 1))


def measure_fit(still, fit, ref_mask, size, region=None):
    """정렬 결과의 실제 겹침(place 로 놓은 마스크 기준)."""
    s, dx, dy = fit
    m = amask(place(still, s, dx, dy, size))
    return m, iou(region_cut(m, region), region_cut(ref_mask, region))


# ---------------------------------------------------------------- 프레임 간 변화량
def frame_diffs(ims, step=4):
    """재생 순서 그림들의 연속 프레임 평균 색 차(0~255 · 회색 바탕 합성 · 둘 중 하나라도 불투명인 영역) — 마지막 → 첫 이음매 포함."""
    arr = []
    for im in ims:
        a = np.array(im.resize((im.width // step, im.height // step), Image.BILINEAR)).astype(np.float32)
        al = a[:, :, 3:4] / 255.0
        arr.append((a[:, :, :3] * al + 128.0 * (1 - al), a[:, :, 3] > ALPHA))
    out = []
    for i in range(len(arr)):
        j = (i + 1) % len(arr)
        reg = arr[i][1] | arr[j][1]
        out.append(float(np.abs(arr[i][0] - arr[j][0])[reg].mean()) if reg.any() else 0.0)
    return out   # out[i] = 프레임 i → i+1(마지막은 첫 프레임으로 돌아가는 이음매)


# ---------------------------------------------------------------- 한 종류 가공
def process(K, want_sheet):
    kid = K['id']
    sid = K.get('src', kid)                 # 원본 파일 이름의 종류 ID
    REDUCE = K.get('reduce', globals()['REDUCE'])   # 이 종류의 축소 배율(기본 0.5)
    pad = K.get('pad', 0)
    fitD = K.get('fit_d', 4)
    out_dir = '%s/%s' % (UP, kid)
    os.makedirs(out_dir, exist_ok=True)
    _LOC.clear()
    for _key, _parts in K.get('src_dirs', {}).items():
        _d = find_dir(_parts)
        for f in os.listdir(_d):
            if f.lower().endswith('.png'):
                _LOC[unicodedata.normalize('NFC', f)] = os.path.join(_d, f)

    def padim(im):
        if not pad:
            return im
        cv = Image.new('RGBA', (im.width + 2 * pad, im.height + 2 * pad), (0, 0, 0, 0))
        cv.paste(im, (pad, pad))
        return cv
    # 일반 프레임 — 7-3 은 _fire 만 · 8-4/9-4 는 뒤 레이어 번호 무시 · 9-1 은 밑줄 1개 · contact 모음은 번호가 없어 안 걸린다
    nf = frames_of(r'^%s(?:_fire)?__?(\d{4})(?:_레이어-\d+)?\.png$' % re.escape(sid))
    assert sorted(nf) == list(range(K['n'])), ('일반 프레임 번호', kid, sorted(nf))
    normal = {i: padim(load(nf[i])) for i in nf}
    n = K['n']
    play = list(range(n - 1, -1, -1))       # 재생 순서(높은 번호 → 낮은 번호)
    size = normal[0].size
    assert all(normal[i].size == size for i in normal), ('일반 프레임 크기가 다름', kid)

    damage = {}
    if K['dmg_attack']:
        df = frames_of(r'^%s_damage-1__(\d{4})\.png$' % re.escape(sid))
        assert sorted(df) == list(range(n)), ('손상 공격 프레임 번호', kid, sorted(df))
        damage = {i: padim(load(df[i])) for i in df}
        assert all(damage[i].size == size for i in damage), ('손상 공격 프레임 크기가 다름', kid)
    d1_name, d2_name = '%s_damage-1.png' % sid, '%s_damage-2.png' % sid
    d1_still, d2_still = load(d1_name), load(d2_name)

    # 기준 피벗 = 대기 프레임(첫 프레임 = 가장 높은 번호)의 바닥선 · 기둥 중심. 다른 프레임과의 흔들림은 manifest 에 적는다.
    fcs = {i: floor_and_center(amask(normal[i])) for i in normal}
    idle = n - 1
    floor, pillar = fcs[idle]
    floor_jit = max(f for f, _ in fcs.values()) - min(f for f, _ in fcs.values())
    pillar_jit = max(c for _, c in fcs.values()) - min(c for _, c in fcs.values())
    idle_mask = amask(normal[idle])
    ex = bbox(idle_mask)
    base_region = (max(0, int(floor - BASE_FRAC * (floor - ex[1]))), min(size[1], floor + MARGIN + 1))

    # 손상 정지 정렬
    pin = K.get('pin', {})
    d1_ref = amask(damage[idle]) if K['dmg_attack'] else idle_mask
    d1_ref_name = ('손상 공격 %04d' % idle) if K['dmg_attack'] else ('일반 %04d' % idle)
    d1_region = None
    if K.get('d1_region'):   # 아래쪽 비율만 비교(8-1 : 석궁이 떨어져 나가 위쪽이 다르다)
        top = ex[1]
        d1_region = (int(floor - K['d1_region'] * (floor - top)), min(size[1], floor + MARGIN + 1))
    if 'd1' in pin:
        d1_fit = pin['d1']
    else:
        d1_fit = fit_still(d1_still, d1_ref, size, K['d1_scale'], 0.08, d1_region, fitD)[1]
    d1_mask, d1_iou = measure_fit(d1_still, d1_fit, d1_ref, size, d1_region)
    d1_iou_full = iou(d1_mask, d1_ref)
    # 완파 정지 정렬 — 손상 스케일 중심 · 아래쪽 영역
    if 'd2' in pin:
        d2_fit = pin['d2']
    else:
        d2_fit = fit_still(d2_still, idle_mask, size, d1_fit[0], 0.06, base_region, fitD)[1]
    d2_mask, d2_iou = measure_fit(d2_still, d2_fit, idle_mask, size, base_region)
    # 규칙 후보(손상 스케일 그대로 + 바닥선 · 기둥 중심 맞춤) 와의 차이 — 어긋남 점검용
    s1 = d1_fit[0]
    d2_raw_floor, d2_raw_c = floor_and_center(amask(d2_still))
    rule_dx = pillar - d2_raw_c * s1
    rule_dy = floor - d2_raw_floor * s1
    d2_rule = (s1, round(rule_dx), round(rule_dy))
    d2_fl, d2_ce = floor_and_center(d2_mask)
    d1_fl, d1_ce = floor_and_center(d1_mask)
    print('[%s] 손상 정지 정렬: 스케일/dx/dy = %s · IoU %.3f(%s)%s' % (kid, d1_fit, d1_iou, d1_ref_name + (' · 아래 %d%%' % int(K['d1_region'] * 100) if d1_region else ''), ' · 고정값' if 'd1' in pin else ''))
    print('[%s] 완파 정지 정렬: 스케일/dx/dy = %s · 아래쪽 IoU %.3f · 규칙 후보 %s%s' % (kid, d2_fit, d2_iou, d2_rule, ' · 고정값' if 'd2' in pin else ''))

    items = []  # (이름, 상태, 프레임 번호, 원본 파일 이름, 그림, 정렬 정보)
    for i in play:
        items.append(('normal_%04d' % i, 'normal', i, nf[i], normal[i], None))
    if K['dmg_attack']:
        for i in play:
            items.append(('damage1_%04d' % i, 'damage1', i, '%s_damage-1__%04d.png' % (sid, i), damage[i], None))
    d1_img = place(d1_still, *d1_fit[:1], d1_fit[1], d1_fit[2], size)
    d2_img = place(d2_still, d2_fit[0], d2_fit[1], d2_fit[2], size)
    d1_al = {'iou_vs_ref': round(d1_iou, 4), 'ref': d1_ref_name, 'scale': d1_fit[0], 'dx': d1_fit[1], 'dy': d1_fit[2],
             'floor_diff_px': (d1_fl - floor) * REDUCE, 'pillar_diff_px': (d1_ce - pillar) * REDUCE}
    if d1_region:
        d1_al['region'] = '아래쪽 %d%%만 비교' % int(K['d1_region'] * 100)
        d1_al['iou_full'] = round(d1_iou_full, 4)
    d2_al = {'iou_vs_idle_base': round(d2_iou, 4), 'region': '바닥 위 %d%% 영역(%d..%d행)' % (int(BASE_FRAC * 100), base_region[0], base_region[1]),
             'scale': d2_fit[0], 'dx': d2_fit[1], 'dy': d2_fit[2],
             'floor_diff_px': (d2_fl - floor) * REDUCE, 'pillar_diff_px': (d2_ce - pillar) * REDUCE,
             'rule_candidate': {'scale': d2_rule[0], 'dx': d2_rule[1], 'dy': d2_rule[2]},
             'diff_vs_rule_px': [round((d2_fit[1] - d2_rule[1]) * REDUCE, 1), round((d2_fit[2] - d2_rule[2]) * REDUCE, 1)],
             'iou_full_vs_idle': round(iou(d2_mask, idle_mask), 4)}
    if not K.get('skip_d1_still'):
        items.append(('damage1_still', 'damage1', None, d1_name, d1_img, d1_al))
    items.append(('damage2_still', 'damage2', None, d2_name, d2_img, d2_al))
    # 같은 그림(픽셀이 같은 프레임)은 첫 번째(재생 순서상 앞) 한 장만 올리고 나머지는 aliases 로 가리킨다(7-5 3연사 복제 프레임).
    aliases = {}
    if K.get('dedupe'):
        seen, uniq = {}, []
        for it in items:
            nm_, st_, ix_, sr_, im_, al_ = it
            if ix_ is not None:
                key = (st_, hashlib.md5(im_.tobytes()).hexdigest())
                if key in seen:
                    aliases[nm_] = seen[key]
                    continue
                seen[key] = nm_
            uniq.append(it)
        items = uniq
        print('[%s] 같은 그림 %d장을 건너뜀 → 올릴 고유 프레임 %d장 · aliases %s' % (kid, len(aliases), len(items), aliases))

    # 공통 캔버스: 모든 그림의 불투명 경계 합집합 + 여백, 기둥 중심 기준 좌우 대칭 · 8 의 배수
    boxes = [bbox(amask(im)) for _n, _s, _i, _f, im, _a in items]
    xmin, ymin = min(b[0] for b in boxes), min(b[1] for b in boxes)
    xmax, ymax = max(b[2] for b in boxes), max(b[3] for b in boxes)
    half = max(pillar - xmin, xmax - pillar) + MARGIN
    w = int(np.ceil((2 * half + 1) / 8.0) * 8)
    bottom = ymax + MARGIN + 1
    h = int(np.ceil((bottom - (ymin - MARGIN)) / 8.0) * 8)
    x0 = int(round(pillar - w / 2.0))
    y0 = bottom - h            # 아래 여백이 모자라면 위로 늘린다(바닥을 캔버스 밑에 고정)
    box = (x0, y0, x0 + w, y0 + h)
    rw, rh = int(w * REDUCE), int(h * REDUCE)
    assert rw % 4 == 0 and rh % 4 == 0
    pivot_px = ((pillar - x0) * REDUCE, (floor + 1 - y0) * REDUCE)    # 바닥선 중앙(축소 뒤 px · 위에서부터)
    floor_y = pivot_px[1]
    print('[%s] 공통 크롭(원본 px) x%d..%d y%d..%d = %dx%d → 축소 %dx%d · 기둥 중심 %.1f · 바닥선 %d' % (kid, box[0], box[2], box[1], box[3], w, h, rw, rh, pillar, floor))

    # 발사 좌표(원본 캔버스 px → 축소 뒤 캔버스 px → 피벗 기준 오프셋)
    def fire_of(xy):
        if not xy:
            return None
        fx, fy = xy[0] + pad, xy[1] + pad     # pad 로 둘레를 넓혔으면 같이 민다(기록하는 orig_xy 는 원본 좌표)
        cx, cy = (fx - x0) * REDUCE, (fy - y0) * REDUCE
        return {
            'orig_xy': [fx - pad, fy - pad],
            'canvas_px': [cx, cy],                                            # 축소 뒤 캔버스(왼쪽 위 원점)
            'from_pillar_floor_px': [cx - pivot_px[0], pivot_px[1] - cy],     # 기둥 중심 · 바닥선 기준 · + 오른쪽 · + 위
            'from_center_px': [cx - rw / 2.0, rh / 2.0 - cy],                 # 캔버스 중심 기준(= 가운데 피벗 엔티티 y 기준 · x 는 기둥 중심과 같음)
        }
    fire = {}
    if K.get('fire_n'):
        fire['normal'] = fire_of(K['fire_n'])
    if K.get('fire_d'):
        fire['damage1'] = fire_of(K['fire_d'])

    # 저장
    mf_frames = []
    total = 0
    pngs = {}
    for name, state, idx, src, im, al in items:
        o = im.crop(box).convert('RGBa').resize((rw, rh), Image.LANCZOS).convert('RGBA')
        path = '%s/%s.png' % (out_dir, name)
        o.save(path, optimize=True)
        sz = os.path.getsize(path)
        total += sz
        pngs[name] = o
        mf_frames.append({'name': name, 'state': state, 'frame': idx, 'source': rel(src), 'file': name + '.png', 'bytes': sz, 'align': al})

    # 프레임 간 변화량(일반 · 손상 공격 · 재생 순서)
    nd = frame_diffs([normal[i] for i in play])
    dd = frame_diffs([damage[i] for i in play]) if K['dmg_attack'] else None
    seam = nd[-1]
    maxstep = max(nd[:-1]) if len(nd) > 1 else 0.0

    # 경계 안 불투명 합(저장 점검: 모든 그림이 캔버스 안에 있는가)
    for name, o in pngs.items():
        a = np.array(o)[:, :, 3] > ALPHA
        assert a[0].sum() == 0 and a[-1].sum() == 0 and a[:, 0].sum() == 0 and a[:, -1].sum() == 0, ('그림이 캔버스 가장자리에 닿음', kid, name)

    attacker_once = K['attacker'] or (K['dmg_attack'] and K['id'] == 'E18-7-5')
    mf = {
        'kind': kid, 'village': K['village'], 'facility': K['fac'], 'note': K['note'],
        'reduce': REDUCE, 'alpha_threshold': ALPHA, 'margin_px': MARGIN,
        'source_canvas': list(size), 'crop_box_orig': list(box), 'canvas_orig': [w, h], 'canvas': [rw, rh],
        'pillar_center_orig_x': pillar, 'floor_orig_y': floor,
        'pivot_px_from_top_left': [pivot_px[0], pivot_px[1]],
        'pivot_norm_x': pivot_px[0] / rw,
        'pivot_norm_y_from_bottom': 1.0 - pivot_px[1] / rh,
        'pivot_used_for_upload': {'x': round(pivot_px[0] / rw, 4), 'y': 0.5, 'meaning': 'x = 기둥 중심 · y = 캔버스 가운데(좌표계 왼쪽 아래 (0,0))'},
        'floor_y_px': floor_y, 'floor_y_norm_from_bottom': 1.0 - floor_y / rh,
        'floor_offset_from_center_px': floor_y - rh / 2.0,        # 가운데 피벗 기준 바닥선이 아래로 몇 px(축소 뒤) — GroundOffset = 이 값 × 엔티티 Scale ÷ 100
        'opaque_union_orig': [xmin, ymin, xmax, ymax],
        'height_above_floor_px': (floor + 1 - ymin) * REDUCE,     # 불투명 최고점 ~ 바닥선(축소 뒤)
        'play_order': '%04d → 0000 (번호 높은 것 → 낮은 것)' % idle, 'play_frames': play, 'idle_frame': idle,
        'idle_frame_name': 'normal_%04d' % idle,
        'style': 'attack_once' if attacker_once else 'loop',
        'faces': 'left' if K['attacker'] or K['id'] == 'E18-7-5' else 'symmetric_or_none',
        'has_damage_attack': K['dmg_attack'],
        'damage_attack_allowed': False if kid == 'E18-8-1' else (True if (K['attacker'] or K['dmg_attack']) else None),
        'fire_frame': K.get('fire_frame_n'), 'fire_frame_index_in_play': (idle - K['fire_frame_n']) if K.get('fire_frame_n') is not None else None,
        'fire_frame_damage1': K.get('fire_frame_d'),
        'fire_frames_normal': K.get('fire_frames_n'), 'fire_frames_damage1': K.get('fire_frames_d'),
        'aliases': aliases, 'pad_orig_px': pad, 'dedupe': bool(K.get('dedupe')),
        'fire': fire,
        'motion': {
            'normal_step_diff': [round(x, 2) for x in nd[:-1]], 'normal_max_step_diff': round(maxstep, 2), 'normal_loop_seam_diff': round(seam, 2),
            'nearly_static': bool(maxstep <= STATIC_DIFF),
            'damage_step_diff': [round(x, 2) for x in dd[:-1]] if dd else None, 'damage_loop_seam_diff': round(dd[-1], 2) if dd else None,
        },
        'jitter_between_frames_orig_px': {'floor': floor_jit, 'pillar': pillar_jit},
        'still_alignment': {'damage1': d1_al, 'damage2': d2_al},
        'frames': mf_frames, 'total_bytes': total,
    }
    with open(out_dir + '/manifest.json', 'w', encoding='utf-8') as f:
        json.dump(mf, f, ensure_ascii=False, indent=1)
    print('[%s] 저장 %d장 · 합계 %.2f MB · 변화량 최대 %.1f(이음매 %.1f)%s' % (kid, len(items), total / 1048576.0, maxstep, seam, ' · 거의 정지' if maxstep <= STATIC_DIFF else ''))

    if want_sheet:
        sheet(kid, mf, pngs, play, bool(damage), floor_y, pivot_px[0])
    return mf


def process_proj(P):
    """발사체 그림 한 장: 알파>0 상자 + 여백으로 크롭(상자 가운데 기준 · 8 의 배수) → 축소 → manifest(upload.cjs 가 읽는 모양)."""
    pid = P['id']
    out_dir = '%s/%s' % (UP, pid)
    os.makedirs(out_dir, exist_ok=True)
    im = load(P['src'])
    m = np.array(im)[:, :, 3] > 0
    x0, y0, x1, y1 = bbox(m)
    cx, cy = (x0 + x1 + 1) / 2.0, (y0 + y1 + 1) / 2.0
    red = P['reduce']
    # 축소 뒤 크기를 4 의 배수로(업로드 최적화) — 원본 크롭 크기는 거기서 거꾸로(소수 오차는 resize 가 흡수 · 0.3% 미만)
    rw = int(np.ceil((x1 - x0 + 1 + 2 * P['margin']) * red / 4.0) * 4)
    rh = int(np.ceil((y1 - y0 + 1 + 2 * P['margin']) * red / 4.0) * 4)
    w, h = int(round(rw / red)), int(round(rh / red))
    bx, by = int(round(cx - w / 2.0)), int(round(cy - h / 2.0))
    box = (bx, by, bx + w, by + h)
    assert rw % 4 == 0 and rh % 4 == 0
    o = im.crop(box).convert('RGBa').resize((rw, rh), Image.LANCZOS).convert('RGBA')
    path = '%s/%s.png' % (out_dir, P['name'])
    o.save(path, optimize=True)
    a = np.array(o)[:, :, 3] > 0
    assert a[0].sum() == 0 and a[-1].sum() == 0 and a[:, 0].sum() == 0 and a[:, -1].sum() == 0, ('그림이 캔버스 가장자리에 닿음', pid)
    sz = os.path.getsize(path)
    mf = {
        'kind': pid, 'village': P['village'], 'facility': P['fac'], 'note': P['note'], 'projectile': True,
        'reduce': red, 'alpha_threshold': 0, 'margin_px': P['margin'], 'source': rel(P['src']), 'source_canvas': list(im.size),
        'opaque_box_orig': [x0, y0, x1, y1], 'crop_box_orig': list(box), 'canvas_orig': [w, h], 'canvas': [rw, rh],
        'pivot_norm_x': 0.5, 'pivot_norm_y_from_bottom': 0.5,
        'pivot_used_for_upload': {'x': 0.5, 'y': 0.5, 'meaning': '가운데'},
        'frames': [{'name': P['name'], 'state': 'projectile', 'frame': None, 'source': rel(P['src']), 'file': P['name'] + '.png', 'bytes': sz, 'align': None}],
        'total_bytes': sz,
    }
    with open(out_dir + '/manifest.json', 'w', encoding='utf-8') as f:
        json.dump(mf, f, ensure_ascii=False, indent=1)
    print('[%s] 발사체 크롭(원본 px) %s = %dx%d → 축소 %dx%d · %d bytes' % (pid, box, w, h, rw, rh, sz))
    return mf


# ---------------------------------------------------------------- 접촉 시트
def sheet(kid, mf, pngs, play, has_dmg, floor_y, pivot_x):
    """일반 프레임 전부 + 손상 공격 첫 프레임 + 손상 정지 + 완파 정지를 같은 배율 · 같은 바닥선으로 나란히. 바닥선(하늘색) · 피벗 x(자홍) 표시."""
    rw, rh = mf['canvas']
    al = mf.get('aliases', {})
    names = ['normal_%04d' % i for i in play]
    names = [al.get(nm, nm) for nm in names]
    if has_dmg:
        names.append(al.get('damage1_%04d' % play[0], 'damage1_%04d' % play[0]))
    names += [nm for nm in ('damage1_still', 'damage2_still') if nm in pngs]
    tw = 300                                     # 칸 너비(화면 px)
    sc = tw / float(rw)
    th = int(round(rh * sc))
    cols = min(len(names), 6)
    rows = (len(names) + cols - 1) // cols
    sh = Image.new('RGB', (cols * tw, rows * (th + 14)), (60, 100, 60))
    dr = ImageDraw.Draw(sh)
    for k, nm in enumerate(names):
        t = pngs[nm].resize((tw, th), Image.LANCZOS)
        ox, oy = (k % cols) * tw, (k // cols) * (th + 14)
        cell = Image.new('RGBA', (tw, th), (60, 100, 60, 255))
        cell.alpha_composite(t)
        sh.paste(cell.convert('RGB'), (ox, oy + 14))
        dr.text((ox + 3, oy + 1), nm, fill=(255, 255, 255))
        fy = oy + 14 + floor_y * sc
        dr.line([(ox, fy), (ox + tw, fy)], fill=(0, 255, 255), width=1)
        px = ox + pivot_x * sc
        dr.line([(px, oy + 14), (px, oy + 14 + th)], fill=(255, 0, 255), width=1)
    os.makedirs(UP + '/_sheets', exist_ok=True)
    sh.save('%s/_sheets/%s.png' % (UP, kid))


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    want_sheet = '--no-sheet' not in sys.argv
    ks = [k for k in KINDS if not args or k['id'] in args]
    ps = [q for q in PROJECTILES if not args or q['id'] in args]
    assert ks or ps, '종류 없음'
    result = {}
    projs = {}
    if os.path.exists(REPO_MANIFEST):
        try:
            old = json.load(open(REPO_MANIFEST, encoding='utf-8'))
            result = old.get('kinds', {})
            projs = old.get('projectiles', {})
        except Exception:
            result = {}
    for K in ks:
        result[K['id']] = process(K, want_sheet)
    for P in ps:
        projs[P['id']] = process_proj(P)
    order = [k['id'] for k in KINDS]
    kinds = {k: result[k] for k in order if k in result}
    # 저장소 manifest 는 프레임 목록의 원본 경로 · 변화량 배열 등을 그대로 담는다(용량 작음)
    combined = {
        'doc': 'WO-040 조각 1 — 방어 시설 새 그림 가공 결과(prep.py). 종류별 상세 · 피벗 · 발사 좌표 · 정렬 수치. 그림 파일은 리소스파일/포탑관련 모든것/_upload/<종류>/ (저장소 밖) · RUID 는 ruid-map.json.',
        'reduce': REDUCE, 'alpha_threshold': ALPHA, 'static_diff_threshold': STATIC_DIFF,
        'total_bytes': sum(v['total_bytes'] for v in kinds.values()), 'total_frames': sum(len(v['frames']) for v in kinds.values()),
        'kinds': kinds,
        'projectiles': {q['id']: projs[q['id']] for q in PROJECTILES if q['id'] in projs},
    }
    with open(REPO_MANIFEST, 'w', encoding='utf-8') as f:
        json.dump(combined, f, ensure_ascii=False, indent=1)
        f.write('\n')
    print('끝 — %d종 + 발사체 %d · 저장소 manifest %s' % (len(ks), len(ps), REPO_MANIFEST))


if __name__ == '__main__':
    main()
