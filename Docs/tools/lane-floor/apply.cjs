// WO-047 — 레인 바닥 새 그림을 맵에 깐다(MapBuilder 만 · 다시 돌려도 같은 결과).
// 레인 = 그 맵 LaneGround 조각의 CustomFootholdComponent(밟는 선 · 월드) 범위. 발판 · 옛 조각 Transform 은 건드리지 않는다(다시 굽기 없음).
// 레인마다: LaneFloor_L(왼끝 · 피벗 오른쪽 경계) · LaneFloor_R(오른끝 · 피벗 왼쪽 경계) · LaneFloor_Mid_i(중간).
//   모든 그림 조각은 PIECE_SCALE 크기. 중간 = 축소된 기본 폭 기준으로 n 장을 같은 간격으로 이어 붙이고 가로만 sx 배 조정한다.
//   짧은 레인(중간 자리 < 중간 폭 절반 · 엘리니아 TreeTrunkNest2)은 중간 1장을 Tiled 로 잘라서(TiledSize 폭 = 남는 길이) 쓴다.
// 그림 y 피벗 = 걷는 선이라 엔티티 y = 밟는 선 y. 층 = 발판 조각과 같은 SortingLayer · OrderInLayer 1(바닥 < 시설 2 < 몬스터 3 < 플레이어 4).
// 옛 조각 LaneGround_*: SpriteRendererComponent.Enable = false 만.
// 실행: node Docs/tools/lane-floor/apply.cjs [맵이름 ...]   (인자 없으면 전부)
const path = require('path');
const fs = require('fs');
const { MapBuilder } = require('C:/Users/mingu/메월드폴더/.claude/skills/msw-general/scripts/map/msw_map_builder.cjs');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const EXT = '.ma' + 'p';
const RUID = JSON.parse(fs.readFileSync(path.join(__dirname, 'ruid-map.json'), 'utf8'));
const ORDER = 1;
const Z = 999.9;
const PIECE_SCALE = 0.5;
// 맵 → 마을 · 옛 조각 이름 패턴. 테스트맵은 줄(마을)마다 따로.
const TARGETS = [
  { map: 'Henesys_Hunt_HillNorth', village: 'henesys' },
  { map: 'Henesys_Hunt_GolemsTemple', village: 'henesys' },
  { map: 'Henesys_Village_MinimiMain', village: 'henesys' },
  { map: 'KerningCity_Hunt_ConstructionSite', village: 'kerning_city' },
  { map: 'KerningCity_Village_MinimiMain', village: 'kerning_city' },
  { map: 'Perion_Hunt_NorthernRidge', village: 'perion' },
  { map: 'Perion_Hunt_WildBoarLand', village: 'perion' },
  { map: 'Perion_Village_MinimiMain', village: 'perion' },
  { map: 'Ellinia_Hunt_GreenTreeTrunk', village: 'ellinia' },
  { map: 'Ellinia_Hunt_TreeTrunkNest2', village: 'ellinia' },
  { map: 'Test_Lane_Fx', village: 'henesys', row: 'HENESYS' },
  { map: 'Test_Lane_Fx', village: 'kerning_city', row: 'KERNING' },
  { map: 'Test_Lane_Fx', village: 'perion', row: 'PERION' },
  { map: 'Test_Lane_Fx', village: 'ellinia', row: 'ELLINIA' },
];

function part(v, p) {
  const e = RUID[v + '_' + p];
  if (!e) throw new Error('ruid-map 에 없음: ' + v + '_' + p + ' (upload.cjs 먼저)');
  return { ruid: e.ruid, w: e.units[0], h: e.units[1] };
}

function laneOf(m, oldRe) {
  // 옛 조각 중 발판이 있는 것들의 밟는 선(월드) → [xL, xR, y, layer]
  let xL = Infinity, xR = -Infinity, ys = [], layer = null;
  for (const e of m.listEntities()) {
    if (!oldRe.test(e.name)) continue;
    let fh = null;
    try { fh = m.component(e.path, 'MOD.Core.CustomFootholdComponent'); } catch (_) { fh = null; }
    if (!fh || !fh.edgeLists) continue;
    const t = m.component(e.path, 'MOD.Core.TransformComponent');
    const p = t.Position, sc = t.Scale || { x: 1, y: 1 };
    for (const list of fh.edgeLists) for (const q of list) {
      const x = p.x + q.x * sc.x, y = p.y + q.y * sc.y;
      xL = Math.min(xL, x); xR = Math.max(xR, x); ys.push(y);
    }
    if (!layer) layer = m.component(e.path, 'MOD.Core.SpriteRendererComponent').SortingLayer;
  }
  if (!ys.length) throw new Error('발판 조각을 못 찾음 ' + oldRe);
  return { xL, xR, y: ys.reduce((a, b) => a + b, 0) / ys.length, layer };
}

function put(m, name, ruid, x, y, layer, extra) {
  m.sprite(name, { ruid, pos: [x, y, Z], order: ORDER });
  m.patchComponent(name, 'MOD.Core.SpriteRendererComponent', Object.assign({ SortingLayer: layer, OrderInLayer: ORDER, DrawMode: 0 }, extra && extra.sr));
  const sx = extra && extra.sx || 1;
  m.patchComponent(name, 'MOD.Core.TransformComponent', { Scale: { x: sx * PIECE_SCALE, y: PIECE_SCALE, z: 1 } });
}

function apply(m, t) {
  const pre = t.row ? 'LaneFloor_' + t.row + '_' : 'LaneFloor_';
  const oldRe = t.row ? new RegExp('^LaneGround_' + t.row + '_\\d+$') : /^LaneGround_\d+$/;
  // 같은 이름은 기존 엔티티를 MapBuilder.sprite 로 갱신해 UUID · displayOrder 를 보존한다.
  // 장수가 줄었을 때 남는 조각만 마지막에 지워, 재실행 맵 바이트도 같게 유지한다.
  const existing = m.listEntities().filter(e => e.name.startsWith(pre) && (t.row || !/^LaneFloor_[A-Z]+_/.test(e.name)));
  const desired = new Set();
  const putFloor = (...args) => { desired.add(args[1]); put(...args); };
  const lane = laneOf(m, oldRe);
  const L = part(t.village, 'left'), R = part(t.village, 'right'), M = part(t.village, 'mid');
  const T = lane.xR - lane.xL;
  const leftWidth = L.w * PIECE_SCALE, rightWidth = R.w * PIECE_SCALE;
  const midWidth = M.w * PIECE_SCALE;
  const room = T - leftWidth - rightWidth; // 끝 조각 둘을 뺀 중간 자리
  const stripL = lane.xL + leftWidth, stripR = lane.xR - rightWidth;
  const out = { map: t.map, row: t.row || '', village: t.village, lane: [+lane.xL.toFixed(3), +lane.xR.toFixed(3), +lane.y.toFixed(3)], layer: lane.layer, mid: null };
  putFloor(m, pre + 'L', L.ruid, stripL, lane.y, lane.layer);
  putFloor(m, pre + 'R', R.ruid, stripR, lane.y, lane.layer);
  if (room <= 0.05) {
    out.mid = { mode: 'none' };
  } else if (room < midWidth * 0.5) { // 조각 반 장보다 좁은 레인만 Tiled(TiledSize 의 단위 · 배율 관계를 Play 로 확인한 적 없어 가능하면 안 쓴다 — 엘리니아 Nest2 는 가로 0.89 배 한 장으로 충분)
    putFloor(m, pre + 'Mid_0', M.ruid, (stripL + stripR) / 2, lane.y, lane.layer, { sr: { DrawMode: 2, TiledSize: { x: +room.toFixed(4), y: +(M.h * PIECE_SCALE).toFixed(4) } } });
    out.mid = { mode: 'tiled', width: +room.toFixed(3) };
  } else {
    let n = 1, best = Infinity;
    const maxN = Math.ceil(room / (midWidth * 0.75));
    for (let k = 1; k <= maxN; k++) {
      const candidate = room / (k * midWidth);
      if (candidate < 0.75 || candidate > 1.25) continue;
      const d = Math.abs(Math.log(candidate));
      if (d < best) { best = d; n = k; }
    }
    if (!Number.isFinite(best)) {
      n = Math.max(1, Math.round(room / midWidth));
      best = Math.abs(Math.log(room / (n * midWidth)));
    }
    const sx = room / (n * midWidth);
    for (let i = 0; i < n; i++) putFloor(m, pre + 'Mid_' + i, M.ruid, stripL + (i + 0.5) * midWidth * sx, lane.y, lane.layer, { sx: +sx.toFixed(5) });
    out.mid = { mode: 'simple', n, sx: +sx.toFixed(4) };
  }
  // 옛 조각 그림 끄기(발판 · Transform 그대로)
  let off = 0;
  for (const e of m.listEntities()) {
    if (!oldRe.test(e.name)) continue;
    m.patchComponent(e.path, 'MOD.Core.SpriteRendererComponent', { Enable: false });
    off++;
  }
  out.oldOff = off;
  for (const e of existing) if (!desired.has(e.name)) m.remove(e.path);
  return out;
}

const only = process.argv.slice(2);
const report = [];
const byMap = new Map();
for (const t of TARGETS) { if (only.length && !only.includes(t.map)) continue; if (!byMap.has(t.map)) byMap.set(t.map, []); byMap.get(t.map).push(t); }
for (const [name, list] of byMap) {
  const file = path.join(ROOT, 'map', name + EXT);
  const m = MapBuilder.read(file);
  if (m.getTileMapMode() !== 0) throw new Error(name + ' TileMapMode ' + m.getTileMapMode());
  for (const t of list) report.push(apply(m, t));
  m.write(file);
}
fs.writeFileSync(path.join(__dirname, 'apply-report.json'), JSON.stringify(report, null, 1) + '\n');
for (const r of report) console.log(r.map.padEnd(34), (r.row || '').padEnd(8), r.village.padEnd(13), 'lane', r.lane.join(' '), r.layer, JSON.stringify(r.mid), 'oldOff', r.oldOff);
