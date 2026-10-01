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
  'PERION:TOWER':        { scale: 0.5,   status: 'M2' },
  'PERION:SUPPRESSOR':   { scale: 0.5,   status: 'M2' },
  'PERION:CORE':         { scale: 0.5,   status: 'M2' },
  'ELLINIA:TOWER':       { scale: 0.5,   status: 'M2' },
  'ELLINIA:SUPPRESSOR':  { scale: 0.5,   status: 'M2' },
  'ELLINIA:CORE':        { scale: 0.5,   status: 'M2' },
  'NAUTILUS:TOWER':      { scale: 0.5,   status: 'M2' },
  'NAUTILUS:SUPPRESSOR': { scale: 0.5,   status: 'M2' },
  // NAUTILUS:CORE 는 그림 없음(노틸러스호 자체가 넥서스 · 투명 + 체력 바) — FacilitySprite 행을 건드리지 않는다.
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
const FRAME_SEC = 0.12; // 프레임 한 장 시간 기본값(공격형은 런타임이 쿨 × 0.9 안에 끝나게 줄인다)

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
function framesOf(kind, prefix) {
  const nums = Object.keys(ruidMap[kind].frames)
    .filter((n) => n.startsWith(prefix + '_') && /^\d+$/.test(n.slice(prefix.length + 1)))
    .map((n) => parseInt(n.slice(prefix.length + 1), 10))
    .sort((a, b) => b - a);
  return nums.map((n) => ({ no: n, ruid: ruidOf(kind, `${prefix}_${String(n).padStart(4, '0')}`) }));
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
  if (!it) continue; // 노틸러스 넥서스(HIDDEN) 등 그림 없는 행
  const { kind, m } = it;
  const hasDamageAttack = !!m.has_damage_attack; // 7-1~7-5 만 손상 공격 애니메이션
  const before = JSON.stringify(row);
  const dec = (v) => (v === null || v === undefined ? '' : fmt(v / 100));

  if (row.State === 'NORMAL') {
    const fr = framesOf(kind, 'normal');
    if (fr.length !== m.play_frames.length) throw new Error(`${kind} normal 프레임 수 불일치`);
    row.Frames = fr.map((f) => f.ruid).join('|');
    row.IdleIndex = '0';
    row.FrameSec = String(FRAME_SEC);
    if (m.style === 'attack_once') {
      row.Mode = 'ATTACK';
      const fireIdx = m.fire_frame === null || m.fire_frame === undefined ? -1 : fr.findIndex((f) => f.no === m.fire_frame);
      row.ReleaseIndex = String(fireIdx);
      const f = m.fire && m.fire.normal;
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
      row.Frames = fr.map((f) => f.ruid).join('|');
      row.Mode = 'ATTACK';
      const fireIdx = m.fire_frame_damage1 === null || m.fire_frame_damage1 === undefined ? -1 : fr.findIndex((f) => f.no === m.fire_frame_damage1);
      row.ReleaseIndex = String(fireIdx);
      const f = m.fire && m.fire.damage1;
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
    row.FrameSec = String(FRAME_SEC);
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
    const n = row.Frames.split('|').length;
    const extra = row.State === 'NORMAL' && m.style === 'attack_once' ? ` · 발사 = ${row.ReleaseIndex >= 0 ? (Number(row.ReleaseIndex) + 1) + '번째 프레임' : '없음(발사 효과 없음)'}` : '';
    const noAtk = row.CanAttack === 'false' ? ' · 공격 불가' : '';
    row['#Note'] = `${kind} ${what} ${n}프레임 · gen-rows.cjs 가 manifest · ruid-map 으로 채움${extra}${noAtk}`;
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
    row['#Note'] = `WO-040 새 그림 fac_${kind}_${idleName} (${m.canvas[0]}x${m.canvas[1]} · 50% 축소) · 옛 ${o.ruid} ${o.name} (Scale 0.25 · Ground ${o.ground} · Bar ${o.bar}) · ${fit.status === 'M1' ? 'M1 이 옛 그림과 나란히 놓고 맞춤' : '계산값 · M2 가 맞춤'} · 아이콘은 옛 그림 그대로`;
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
