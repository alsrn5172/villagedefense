#!/usr/bin/env node
/*
 * WO-040 조각 5 — 방어 시설 새 그림 표 값 채우기 (생성 스크립트 · 다시 돌려도 같은 결과)
 *
 *   node Docs/tools/facility-art/gen-rows.cjs            # CSV 두 개를 고쳐 쓴다
 *   node Docs/tools/facility-art/gen-rows.cjs --dry      # 쓰지 않고 바뀔 행만 보여 준다
 *
 * 입력: Docs/tools/facility-art/manifest.json (가공 결과) + ruid-map.json (올린 RUID)
 * 출력:
 *   RootDesk/MyDesk/FacilityArt.csv     — 시설 14종 × 3상태 = 42행의 Frames · Mode · FrameSec · IdleIndex · Release* · CanAttack · Enabled=true
 *                                          (노틸러스 넥서스 HIDDEN 3행은 그림이 없어 건드리지 않는다 — Enabled 는 M2 가 확인한 뒤 켠다)
 *   RootDesk/MyDesk/FacilitySprite.csv  — 14행의 WorldRuid(새 대기 프레임) · Scale · GroundOffset · BarOffset · FlipX 값 셀만
 * 헤더는 건드리지 않는다. BOM + CRLF 를 지킨다. 같은 입력이면 같은 출력(멱등).
 * Play 중에는 돌리지 않는다(Maker 가 메모리 사본으로 되써서 수정이 조용히 사라진다).
 *
 * 🔴 배율 · 바닥 · 체력 바 값은 아래 SPRITE_FIT 표가 정본이다 — Maker 에서 옛 그림과 나란히 놓고 맞춘 결과를 여기에 적는다.
 *    scale 만 적으면 ground · bar 는 가공 수치(manifest)에서 계산한다:
 *      ground = 가운데 피벗 기준 바닥선 px × scale ÷ 100          (그림의 바닥선이 슬롯 바닥에 닿는다)
 *      bar    = (바닥선 위 높이 px − 가운데→바닥선 px) × scale ÷ 100 + BAR_GAP   (체력 바가 그림 머리 위)
 *    Maker 에서 눈으로 맞춘 값이 계산값과 다르면 ground / bar 를 적어 덮는다(overrides).
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const TOOL = __dirname;
const ART_CSV = path.join(ROOT, 'RootDesk', 'MyDesk', 'FacilityArt.csv');
const SPR_CSV = path.join(ROOT, 'RootDesk', 'MyDesk', 'FacilitySprite.csv');
const DRY = process.argv.includes('--dry');

const BAR_GAP = 0.08; // 체력 바 중심이 그림 맨 위보다 이만큼 위(옛 표 규칙 "+~0.08")

// ───────────────────────────── 맞춘 값 표 (Maker 결과를 여기에) ─────────────────────────────
// 키 = 마을:시설. status = 어디까지 맞췄나(M1 = 헤네시스 · 커닝 Maker 확인 끝 / M2 = 계산값 · 페리온 · 엘리니아 · 노틸러스가 맞춘다).
// scale 은 옛 그림의 눈에 보이는 높이(불투명 위~아래)와 새 그림의 바닥선 위 높이를 맞춘 값.
const SPRITE_FIT = {
  'HENESYS:TOWER':       { scale: 0.47,  ground: 1.125, bar: 1.2, status: 'M1' }, // 조각 0 에서 눈으로 맞춘 값(계산값은 1.142 / 1.248 — 차이 0.02 · 그대로 둠)
  'HENESYS:SUPPRESSOR':  { scale: 0.507, status: 'M1' },
  'HENESYS:CORE':        { scale: 0.503, status: 'M1' },
  'KERNING:TOWER':       { scale: 0.509, status: 'M1' },
  'KERNING:SUPPRESSOR':  { scale: 0.501, status: 'M1' },
  'KERNING:CORE':        { scale: 0.507, status: 'M1' },
  // M2 — 옛 그림의 "전체 불투명 높이"(묻힌 부분 포함)에 새 그림의 바닥선 위 높이를 맞춘 값. 옛 크기는 Maker 의 LoadSpriteAndWait 실측 + 옛 시안 PNG 의 불투명 위/아래 비율.
  // 페리온 = 실제 레인 맵 3곳(NorthernRidge · WildBoarLand · 마을)에서 미니언이 오른쪽에서 왼쪽으로 걷는 것을 확인(LaneConfig 와 같다) → 오른쪽을 봐야 하므로 flipX true (새 그림 = 왼쪽을 봄).
  'PERION:TOWER':        { scale: 0.511, flipX: true, status: 'M2' },
  'PERION:SUPPRESSOR':   { scale: 0.518, flipX: true, status: 'M2' },
  'PERION:CORE':         { scale: 0.537, flipX: true, status: 'M2' },
  'ELLINIA:TOWER':       { scale: 0.362, status: 'M2' },
  'ELLINIA:SUPPRESSOR':  { scale: 0.32,  status: 'M2' },
  'ELLINIA:CORE':        { scale: 0.649, status: 'M2' },
  // M3(2026-10-02 사용자 "새 3연사 그림으로 · 지금 화면 크기 · 바닥선과 같게"): 새 그림(362×362 원본 · 축소 없음 → 크롭 376×352)의 바닥선 위 높이 317px 를
  //   옛 M2 그림(508×496 · 바닥선 위 471.5px × Scale 0.55 = 259.3px)과 같게: 259.3 ÷ 317 = 0.818. Ground / Bar 는 이 배율로 계산(옛 1.251 / 1.422 ↔ 새 1.276 / 1.397).
  // WO-040 3차(사용자 2026-10-02 "포탑이 위로 떠 있는 것 같다"): 노틸러스 포탑 · 억제기는 물보라(물 받침) 위에 서 있어 바닥선(불투명 폭 25% 규칙)이 몸체(검은 포드) 바닥보다 아래다 —
  //   확대 스샷(테스트맵 줌 250~300 · 발판 윗면 ↔ 포드 바닥 픽셀 실측)으로 몸체가 발판선보다 약 0.25(포탑) / 0.23(억제기) 떠 있었다 → Ground 를 0.246 / 0.25 줄여 몸체 바닥이 발판선에 닿게 한다(물보라는 발판 쪽으로 내려간다).
  //   BarOffset 은 피벗 기준이라 그대로(그림과 같이 내려간다). 나머지 12종은 바닥선 = 그림 맨 아래라 같은 방식으로 재도 ±0.03 안(Docs/Changelog 조각 8 표).
  'NAUTILUS:TOWER':      { scale: 0.818, ground: 1.03, status: 'M3', note: 'WO-040 3차 Ground 1.276 → 1.03(몸체 바닥을 발판선에 · 물보라는 발판 쪽)' },
  'NAUTILUS:SUPPRESSOR': { scale: 0.575, ground: 1.17, status: 'M2', note: 'WO-040 3차 Ground 1.42 → 1.17(몸체 바닥을 발판선에 · 물보라는 발판 쪽)' },
  // NAUTILUS:CORE 는 그림 없음(노틸러스호 자체가 넥서스 · 투명 + 체력 바) — FacilitySprite 행을 건드리지 않는다.
};

// 그림 없는 넥서스(노틸러스호 자체가 넥서스 · 투명 + 체력 바): 그림이 없어 manifest 에 없다 → 피격 상자 · 클릭 영역(세로 = 2 × GroundOffset) · 체력 바 높이만 여기서 정한다.
// Nautilus_Village_MinimiMain 에서 잰 배(잠수함) 몸통: 세로 −3.6 ~ 2.8 · 가로 18.5 ~ 27.3(넥서스 슬롯 x 20.8 · y −3.05) → 슬롯 바닥에서 위로 5.8(덱 위쪽까지) 덮고(Ground 2.9), 체력 바는 슬롯 y +1.05(배 위쪽 · 갑판 NPC 아래).
const HIDDEN_FIT = {
  'NAUTILUS:CORE': { ground: 2.9, bar: 1.15 },
};

// 옛 그림(교체 전) — 되돌릴 때 쓰는 기록. RUID 앞 8자 · 이름 · 옛 GroundOffset / BarOffset(옛 Scale 은 전부 모델 기본 0.25).
const OLD_SPRITE = {
  'HENESYS:TOWER':       { ruid: 'b772211b', name: 'Henesis_Tower',              ground: 1.125, bar: 1.2 },
  'HENESYS:SUPPRESSOR':  { ruid: 'b3d441e1', name: 'Henesys_Inhibitor_Crossbow', ground: 1.51,  bar: 1.68 },
  'HENESYS:CORE':        { ruid: 'ca23c8d4', name: 'Henesis_Nexus',              ground: 1.125, bar: 1.2 },
  'KERNING:TOWER':       { ruid: '72f6f0c4', name: 'KerningCity_Tower',          ground: 1.125, bar: 1.2 },
  'KERNING:SUPPRESSOR':  { ruid: '2c9da21c', name: 'KerningCity_Inhibitor',      ground: 1.64,  bar: 1.2 },
  'KERNING:CORE':        { ruid: 'ab1b1a77', name: 'KerningCity_Nexus',          ground: 1.44,  bar: 1.55 },
  'PERION:TOWER':        { ruid: '3e9679c4', name: 'Perion_Tower',               ground: 1.125, bar: 1.2 },
  'PERION:SUPPRESSOR':   { ruid: 'dcaedc41', name: 'Perion_Inhibitor',           ground: 1.125, bar: 1.2 },
  'PERION:CORE':         { ruid: '05ca7f97', name: 'Perion_Nexus',               ground: 1.125, bar: 1.2 },
  'ELLINIA:TOWER':       { ruid: 'c581bd55', name: 'Ellinia_Tower',              ground: 1.77,  bar: 1.86 },
  'ELLINIA:SUPPRESSOR':  { ruid: '0784f6d9', name: 'Ellinia_Inhibitor',          ground: 1.35,  bar: 1.5 },
  'ELLINIA:CORE':        { ruid: '6de3ebd1', name: 'Ellinia_Nexus',              ground: 1.65,  bar: 1.78 },
  'NAUTILUS:TOWER':      { ruid: '2cb00b54', name: 'Nautilus_Tower',             ground: 1.36,  bar: 1.16 },
  'NAUTILUS:SUPPRESSOR': { ruid: '0b55fd5e', name: 'Nautilus_Inhibitor',         ground: 1.31,  bar: 1.37 },
};

// 종류(E18-x-y) → 표 키. manifest 의 village/facility 를 그대로 쓴다(마을 영문 이름 KERNING 등).
const HIDDEN_ENABLED = true; // 노틸러스 넥서스 HIDDEN 3행을 켠다(M2 확인 뒤). 끄려면 false 로 하고 다시 돌린다 — 이미 켜진 행은 직접 Enabled=false 로.
const FRAME_SEC = 0.12; //프레임 한 장 시간 기본값(공격형은 런타임이 쿨 × 0.9 안에 끝나게 줄인다)

// 발사 프레임 · 위치를 prep.py 의 기본값(발사체좌표.txt 의 포구 좌표)이 아니라 따로 정하는 종류(WO-040 M3).
//   E18-7-4 엘리니아 새총 — 그림 속 잎이 0002 · 0001 에서 이미 날아간다(발사체 그림 `새총알.png` 와 같은 잎). 엔티티 잎이 그 위에 또 나가면 잎이 둘이라서,
//   **그림 속 잎이 사라진 프레임(0000)에서 그림 속 잎이 날아가던 자리를 이어** 엔티티 잎이 나간다(후보 0002 포구 앞 · 0001 · 0000 을 영상 프레임으로 비교한 근거는 체인지로그 조각 6).
//   잎 머리 끝(원본 2048 캔버스 px · 알파>128 · 잎 머리 띠의 가운데 y): 일반 0002 (429, 426) → 0001 (52, 407) = 프레임당 (−377, −19) · 손상 0002 (391, 403) → 0001 (52, 407) = (−339, +4).
//   0000 의 머리 끝 = 0001 + 한 프레임 이동 · 엔티티 중심 = 머리 끝 + 발사체 그림의 머리→중심 거리(420px × 잎 크기 보정 0.75 = prep.py PROJECTILES 의 reduce 0.375 ÷ 0.5).
const LEAF_HEAD_TO_CENTER = 420 * 0.75;
const RELEASE_OVERRIDE = {
  'E18-7-4': {
    frame: 0,
    normal: { head: [52 - 377, 407 - 19] },
    damage1: { head: [52 - 339, 407 + 4] },
  },
};
// 원본 캔버스 px → 가운데 피벗 엔티티 기준 오프셋(그림 px · 왼쪽 위 원점 → 오른쪽 + 위쪽 +) — prep.py 의 fire_of 와 같은 식.
function offsetFromCenter(m, xy) {
  const b = m.crop_box_orig;
  return [(xy[0] - b[0]) * m.reduce - m.canvas[0] / 2, m.canvas[1] / 2 - (xy[1] - b[1]) * m.reduce];
}

// 프레임 시간이 구간마다 다른 종류(헤더 불변): 한 "칸" = slotSec 로 두고 오래 보여 줄 프레임은 같은 RUID 를 `Frames` 에 여러 번 적는다
// (재생기의 Paint 는 같은 RUID 재대입을 건너뛴다). 발사 시각은 칸 번호(0부터)로 `ReleaseIndex` 에 `|` 로 이어 적는다(여러 발).
//   E18-7-5b(노틸러스 3연사 · 설명서 [9]): 프레임 0011~0003 은 50ms · 나머지 100ms → 칸 50ms · 27칸(1.35초) · 발사 = 0011 / 0008 / 0005 진입 → 12 | 15 | 18.
const TIMING = {
  'E18-7-5b': { slotSec: 0.05, slotsOf: (no) => (no <= 11 && no >= 3 ? 1 : 2) },
};

// ───────────────────────────── CSV 도우미 ─────────────────────────────
function readCsv(file) {
  const raw = fs.readFileSync(file);
  if (!(raw[0] === 0xef && raw[1] === 0xbb && raw[2] === 0xbf)) throw new Error('BOM 없음: ' + file);
  const text = raw.slice(3).toString('utf8');
  if (!text.endsWith('\r\n')) throw new Error('끝에 CRLF 없음: ' + file);
  const lines = text.slice(0, -2).split('\r\n');
  const header = lines[0].split(',');
  const rows = lines.slice(1).map((l, i) => {
    const cells = l.split(',');
    if (cells.length !== header.length) throw new Error(`${path.basename(file)} ${i + 2}행 열 수 ${cells.length} ≠ ${header.length} (쉼표 · 따옴표가 든 칸은 이 스크립트가 못 다룬다)`);
    const o = {};
    header.forEach((h, k) => { o[h] = cells[k]; });
    return o;
  });
  return { header, rows };
}

function writeCsv(file, header, rows) {
  const out = [header.join(',')];
  for (const r of rows) {
    const cells = header.map((h) => {
      const v = r[h] === undefined || r[h] === null ? '' : String(r[h]);
      if (/[,"\r\n]/.test(v)) throw new Error(`${path.basename(file)} 칸에 쉼표 · 따옴표 · 줄바꿈 금지: ${h}=${v}`);
      return v;
    });
    out.push(cells.join(','));
  }
  const buf = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(out.join('\r\n') + '\r\n', 'utf8')]);
  fs.writeFileSync(file, buf);
}

const round = (v, n) => { const f = Math.pow(10, n); return Math.round(v * f) / f; };
const fmt = (v) => String(round(v, 4)); // 1.0 → "1" 이 되도록 JS 기본 표기

// ───────────────────────────── 입력 ─────────────────────────────
const manifest = JSON.parse(fs.readFileSync(path.join(TOOL, 'manifest.json'), 'utf8')).kinds;
const ruidMap = JSON.parse(fs.readFileSync(path.join(TOOL, 'ruid-map.json'), 'utf8'));

function ruidOf(kind, name) {
  const e = ruidMap[kind] && ruidMap[kind].frames && ruidMap[kind].frames[name];
  if (!e || !e.ruid) throw new Error(`ruid-map 에 없음: ${kind} ${name}`);
  return e.ruid;
}

// 재생 순서 = 번호 높은 것 → 낮은 것
// 같은 그림 복사 프레임(manifest.aliases · 예 normal_0008 → normal_0011)은 올리지 않았으므로 원본 이름의 RUID 를 가리킨다.
function framesOf(kind, prefix) {
  const alias = (manifest[kind] && manifest[kind].aliases) || {};
  const names = new Set([...Object.keys(ruidMap[kind].frames), ...Object.keys(alias)]);
  const nums = [...names]
    .filter((n) => n.startsWith(prefix + '_') && /^\d+$/.test(n.slice(prefix.length + 1)))
    .map((n) => parseInt(n.slice(prefix.length + 1), 10))
    .sort((a, b) => b - a);
  return nums.map((n) => {
    const nm = `${prefix}_${String(n).padStart(4, '0')}`;
    return { no: n, ruid: ruidOf(kind, alias[nm] || nm) };
  });
}

// 재생 순서 프레임 목록 → 칸 목록(TIMING 이 있는 종류) · 프레임 번호별 시작 칸.
function expandSlots(kind, fr) {
  const tm = TIMING[kind];
  if (!tm) return { cells: fr.map((f) => f.ruid), startOf: Object.fromEntries(fr.map((f, i) => [f.no, i])), slotSec: null };
  const cells = [];
  const startOf = {};
  for (const f of fr) {
    startOf[f.no] = cells.length;
    for (let k = 0; k < tm.slotsOf(f.no); k++) cells.push(f.ruid);
  }
  return { cells, startOf, slotSec: tm.slotSec };
}

const info = {}; // `${VILLAGE}:${FACILITY}` → { kind, m }
for (const [kind, m] of Object.entries(manifest)) info[`${m.village}:${m.facility}`] = { kind, m };

// ───────────────────────────── FacilityArt.csv ─────────────────────────────
const art = readCsv(ART_CSV);
const artChanged = [];
let artFilled = 0;

for (const row of art.rows) {
  const key = `${row.VillageId}:${row.Stage}`;
  const it = info[key];
  if (!it) {
    // 노틸러스 넥서스(HIDDEN · 그림 없음 — 노틸러스호 자체가 넥서스): 그림은 안 채우고 켜기만 한다(M2 가 알파 0 + 체력 바 + 클릭을 확인한 뒤 켬).
    if (row.Mode === 'HIDDEN' && HIDDEN_ENABLED) {
      const b = JSON.stringify(row);
      row.Enabled = 'true';
      if (JSON.stringify(row) !== b) artChanged.push(`${key}:${row.State}`);
    }
    continue;
  }
  const { kind, m } = it;
  const hasDamageAttack = !!m.has_damage_attack; // 7-1~7-5 만 손상 공격 애니메이션
  const before = JSON.stringify(row);
  const dec = (v) => (v === null || v === undefined ? '' : fmt(v / 100));
  let slotNote = ''; // 칸 단위 표(TIMING)인 종류의 메모용
  // 발사 칸 번호: 발사 프레임이 여러 개면 `12|15|18` 처럼 이어 적는다(없으면 -1). 한 값이면 지금까지와 같다.
  const releaseCell = (sl, mm, st) => {
    const ro = RELEASE_OVERRIDE[kind];
    const list = ro ? null : (st === 'normal' ? mm.fire_frames_normal : mm.fire_frames_damage1);
    const one = ro ? ro.frame : (st === 'normal' ? mm.fire_frame : mm.fire_frame_damage1);
    const nos = list && list.length ? list : (one === null || one === undefined ? [] : [one]);
    if (!nos.length) return '-1';
    return nos.map((no) => (sl.startOf[no] === undefined ? -1 : sl.startOf[no])).join('|');
  };

  if (row.State === 'NORMAL') {
    const fr = framesOf(kind, 'normal');
    if (fr.length !== m.play_frames.length) throw new Error(`${kind} normal 프레임 수 불일치`);
    const sl = expandSlots(kind, fr);
    slotNote = sl.slotSec ? `${sl.cells.length}칸(${fr.length}프레임 · 칸 ${Math.round(sl.slotSec * 1000)}ms)` : '';
    row.Frames = sl.cells.join('|');
    row.IdleIndex = '0';
    row.FrameSec = String(sl.slotSec || FRAME_SEC);
    if (m.style === 'attack_once') {
      row.Mode = 'ATTACK';
      row.ReleaseIndex = releaseCell(sl, m, 'normal');
      let f = m.fire && m.fire.normal;
      const ro = RELEASE_OVERRIDE[kind];
      if (ro) f = { from_center_px: offsetFromCenter(m, [ro.normal.head[0] + LEAF_HEAD_TO_CENTER, ro.normal.head[1]]) };
      row.ReleaseOffsetX = f ? dec(f.from_center_px[0]) : '';
      row.ReleaseOffsetY = f ? dec(f.from_center_px[1]) : '';
      row.CanAttack = 'true';
    } else {
      row.Mode = 'LOOP';
      row.ReleaseIndex = '-1';
      row.ReleaseOffsetX = '';
      row.ReleaseOffsetY = '';
      row.CanAttack = 'true';
    }
  } else if (row.State === 'DAMAGE1') {
    if (hasDamageAttack) {
      const fr = framesOf(kind, 'damage1');
      const sl = expandSlots(kind, fr);
      slotNote = sl.slotSec ? `${sl.cells.length}칸(${fr.length}프레임 · 칸 ${Math.round(sl.slotSec * 1000)}ms)` : '';
      row.Frames = sl.cells.join('|');
      row.Mode = 'ATTACK';
      row.ReleaseIndex = releaseCell(sl, m, 'damage1');
      let f = m.fire && m.fire.damage1;
      const ro = RELEASE_OVERRIDE[kind];
      if (ro) f = { from_center_px: offsetFromCenter(m, [ro.damage1.head[0] + LEAF_HEAD_TO_CENTER, ro.damage1.head[1]]) };
      row.ReleaseOffsetX = f ? dec(f.from_center_px[0]) : '';
      row.ReleaseOffsetY = f ? dec(f.from_center_px[1]) : '';
      row.CanAttack = 'true';
    } else {
      row.Frames = ruidOf(kind, 'damage1_still');
      row.Mode = 'STILL';
      row.ReleaseIndex = '-1';
      row.ReleaseOffsetX = '';
      row.ReleaseOffsetY = '';
      // 8-1(헤네시스 억제기)은 손상되면 석궁이 떨어져 공격 불가(사용자 확정). 나머지는 공격 안 하는 종류라 값이 의미 없지만 true 유지.
      row.CanAttack = key === 'HENESYS:SUPPRESSOR' ? 'false' : 'true';
    }
    row.IdleIndex = '0';
    row.FrameSec = String(hasDamageAttack && TIMING[kind] ? TIMING[kind].slotSec : FRAME_SEC);
  } else if (row.State === 'DAMAGE2') {
    row.Frames = ruidOf(kind, 'damage2_still');
    row.Mode = 'STILL';
    row.IdleIndex = '0';
    row.FrameSec = String(FRAME_SEC);
    row.ReleaseIndex = '-1';
    row.ReleaseOffsetX = '';
    row.ReleaseOffsetY = '';
    row.CanAttack = 'true';
  } else {
    throw new Error('알 수 없는 State ' + row.State);
  }
  row.Enabled = 'true';
  // 틀 행이던 것 · 이 스크립트가 쓴 것은 메모를 (다시) 만든다. 손으로 쓴 7-1 메모는 그대로 둔다.
  const oldArtNote = row['#Note'] || '';
  if (/틀 행/.test(oldArtNote) && !/HIDDEN|노틸러스호/.test(oldArtNote) || /gen-rows\.cjs/.test(oldArtNote)) {
    const what = row.State === 'NORMAL' ? (row.Mode === 'LOOP' ? '일반 상시 반복' : '일반 공격 1회') : row.State === 'DAMAGE1' ? (hasDamageAttack ? '손상 공격' : '손상 정지') : '완파 정지';
    const n = slotNote || (row.Frames.split('|').length + '프레임');
    const rel = String(row.ReleaseIndex).split('|').map(Number);
    const extra = row.State === 'NORMAL' && m.style === 'attack_once'
      ? ` · 발사 = ${rel[0] >= 0 ? rel.map((r) => (r + 1) + '번째').join(' / ') + (slotNote ? ' 칸' : ' 프레임') : '없음(발사 효과 없음)'}` : '';
    const noAtk = row.CanAttack === 'false' ? ' · 공격 불가' : '';
    row['#Note'] = `${kind} ${what} ${n} · gen-rows.cjs 가 manifest · ruid-map 으로 채움${extra}${noAtk}`;
  }
  if (JSON.stringify(row) !== before) { artChanged.push(`${key}:${row.State}`); }
  artFilled++;
}

// ───────────────────────────── FacilitySprite.csv ─────────────────────────────
const spr = readCsv(SPR_CSV);
const sprChanged = [];
const fitReport = [];
for (const row of spr.rows) {
  const key = `${row.VillageId}:${row.Stage}`;
  const it = info[key];
  const fit = SPRITE_FIT[key];
  const hid = HIDDEN_FIT[key];
  if (hid) {
    const b = JSON.stringify(row);
    row.GroundOffset = fmt(hid.ground);
    row.BarOffset = fmt(hid.bar);
    if (!/WO-040 M2/.test(row['#Note'] || '')) row['#Note'] = `${row['#Note'] || ''} · WO-040 M2: 그림은 알파 0(HIDDEN) · Ground ${row.GroundOffset} / Bar ${row.BarOffset} 는 노틸러스호 크기에 맞춘 피격 · 클릭 상자 높이(옛 1.112 / 1.213)`;
    if (JSON.stringify(row) !== b) sprChanged.push(key);
    fitReport.push(`${key.padEnd(20)} (그림 없음 · HIDDEN) ground=${row.GroundOffset} bar=${row.BarOffset}`);
    continue;
  }
  if (!it || !fit) continue;
  const { kind, m } = it;
  const before = JSON.stringify(row);
  const idleName = `normal_${String(m.idle_frame).padStart(4, '0')}`;
  const sc = fit.scale;
  const floorOff = m.floor_offset_from_center_px; // 가운데 피벗 → 바닥선(아래로 px)
  const topOff = m.height_above_floor_px - floorOff; // 가운데 → 그림 맨 위(px)
  const ground = fit.ground !== undefined ? fit.ground : round(floorOff * sc / 100, 3);
  const bar = fit.bar !== undefined ? fit.bar : round(topOff * sc / 100 + BAR_GAP, 3);
  row.WorldRuid = ruidOf(kind, idleName);
  row.Scale = fmt(sc);
  row.GroundOffset = fmt(ground);
  row.BarOffset = fmt(bar);
  if (fit.flipX !== undefined) row.FlipX = String(fit.flipX);
  if (key !== 'HENESYS:TOWER') {
    const o = OLD_SPRITE[key];
    row['#Note'] = `WO-040 새 그림 fac_${kind}_${idleName} (${m.canvas[0]}x${m.canvas[1]} · ${m.reduce === 1 ? '축소 없음' : Math.round(m.reduce * 100) + '% 축소'}) · 옛 ${o.ruid} ${o.name} (Scale 0.25 · Ground ${o.ground} · Bar ${o.bar}) · ${fit.status === 'M1' ? 'M1 이 옛 그림과 나란히 놓고 맞춤' : fit.status === 'M2' ? 'M2 가 옛 그림 전체 높이에 맞춤' : fit.status === 'M3' ? 'M3 가 새 3연사 그림을 지난 M2 그림의 높이 · 바닥선에 맞춤' : '계산값'} · 아이콘은 옛 그림 그대로${fit.note ? ' · ' + fit.note : ''}`;
  }
  fitReport.push(`${key.padEnd(20)} scale=${row.Scale} ground=${row.GroundOffset} bar=${row.BarOffset} flipX=${row.FlipX} [${fit.status}]`);
  if (JSON.stringify(row) !== before) sprChanged.push(key);
}

// ───────────────────────────── 쓰기 ─────────────────────────────
console.log(`FacilityArt  채운 행 ${artFilled} · 바뀐 행 ${artChanged.length}`);
console.log(`FacilitySprite 바뀐 행 ${sprChanged.length}`);
for (const l of fitReport) console.log('  ' + l);
if (DRY) { console.log('--dry : 쓰지 않음'); process.exit(0); }
writeCsv(ART_CSV, art.header, art.rows);
writeCsv(SPR_CSV, spr.header, spr.rows);
console.log('쓴 파일: FacilityArt.csv · FacilitySprite.csv (BOM + CRLF)');
