// 월드맵 노드 세로 위치 고침 + 내 위치 · 목표 핀을 안내창 뒤로 (사용자 2026-10-06 "페리온 쪽 점이 어색함" · "내 위치가 맵 설명 UI 보다 앞").
//   원인: 지도 그림(dui_worldmap_f01)은 원본 2095x1614 의 위아래 38px 를 잘라(2095x1538) 1098x806 에 띄우는데,
//   노드 Y 는 자르기 전 높이(1614)로 환산돼 있었다 → 가운데(원본 y 807)에서 멀수록 어긋남(페리온 보스 −12px · 머쉬맘 +13px 화면 기준).
//   고침: 옛 환산을 거꾸로 풀어 원본 y 를 되찾고(y = (375 − Y) × 1614/806) 잘린 높이로 다시 환산(Y = −28 + 403 − (y − 38) × 806/1538). X 는 그대로(가로는 안 잘림).
//   사용자 실측 좌표(30곳)와 대조해 차이를 찍는다 · 북쪽 언덕은 사용자 값 x 가 골렘의 사원 x 와 섞여 있어(화면 실측 938,1066) 옛 X 그대로.
//   그리기 순서: Board 자식에서 HereMarker · GoalMarker_* 를 Tooltip · InfoPanel 앞(=아래)으로.
// 실행(월드 루트에서): node Docs/tools/design-ui/fix-worldmap-node-y.cjs — 다시 돌려도 같다(이미 고친 CSV 는 환산을 건너뛴다).
const fs = require('fs');
const path = require('path');
const S = require('./skin.cjs');
const WORLD = path.resolve(__dirname, '..', '..', '..');
const CSV = path.join(WORLD, 'RootDesk/MyDesk/WorldMapNodes.csv');
const BD = 'MapPanel/Board';
const NODES = BD + '/Nodes';

const ART_Y = -28, ART_W = 1098, ART_H = 806, OW = 2095, OH = 1614, CROP = 38;
const oldToOrigY = (Y) => (ART_Y + ART_H / 2 - Y) * OH / ART_H;
const origToNewY = (y) => ART_Y + ART_H / 2 - (y - CROP) * ART_H / (OH - CROP * 2);
const toImgX = (X) => (X + ART_W / 2) * OW / ART_W;

// 사용자 실측(원본 2095x1614 · 2026-10-06) — 대조용
const USER = [[788, 881], [687, 909], [593, 948], [527, 1022], [455, 1091], [367, 503], [947, 290], [980, 835], [1512, 693], [799, 1363], [1335, 1362],
  [549, 591], [789, 755], [1020, 498], [1352, 815], [1229, 1097], [880, 1187], [469, 545], [674, 697], [885, 792], [1027, 605], [1011, 688], [1138, 836],
  [1250, 837], [1438, 758], [1108, 954], [1183, 1023], [970, 1074], [845, 1275], [1275, 1228]];

const raw = fs.readFileSync(CSV);
const bom = raw[0] === 0xef && raw[1] === 0xbb && raw[2] === 0xbf;
const crlf = raw.includes('\r\n');
const lines = raw.toString('utf8').replace(new RegExp('^' + String.fromCharCode(0xfeff)), '').split(/\r?\n/);
const head = lines[0].split(',');
const iMap = head.indexOf('MapName'), iEnt = head.indexOf('NodeEntity'), iX = head.indexOf('X'), iY = head.indexOf('Y'), iEn = head.indexOf('Enabled');
const posOf = {};
// 이미 고친 CSV 면(여섯갈래길 Y 가 옛 값 −42 가 아니면) 다시 환산하지 않고 노드 자리 · 핀 순서만 맞춘다(두 번 돌려도 같게).
const hub = lines.find((l) => l.startsWith('SixPathCrossway,'));
const already = hub && Math.abs(Number(hub.split(',')[iY]) - (-42)) > 0.05;
if (already) console.log('CSV 는 이미 고침 — 환산 건너뜀');
for (let i = 1; i < lines.length; i++) {
  if (!lines[i]) continue;
  const c = lines[i].split(',');
  const X = Number(c[iX]), Y = Number(c[iY]);
  if (!Number.isFinite(X) || !Number.isFinite(Y) || c[iEn] === 'false') continue;
  if (already) { if (c[iEnt]) posOf[c[iEnt]] = [X, Y]; continue; }
  const oy = oldToOrigY(Y);
  const NY = Math.round(origToNewY(oy) * 10) / 10;
  const ox = toImgX(X);
  let best = 1e9;
  for (const u of USER) best = Math.min(best, Math.hypot(u[0] - ox, u[1] - oy * 1));
  // 새 Y 로 환산한 원본 좌표와 사용자 실측의 가장 가까운 거리
  const ny = (ART_Y + ART_H / 2 - NY) * (OH - CROP * 2) / ART_H + CROP;
  let bestNew = 1e9;
  for (const u of USER) bestNew = Math.min(bestNew, Math.hypot(u[0] - ox, u[1] - ny));
  console.log(c[iMap].padEnd(40), 'Y', String(Y).padStart(7), '→', String(NY).padStart(7), ' 실측까지(원본 px) 옛', best.toFixed(0).padStart(3), '→ 새', bestNew.toFixed(0).padStart(3));
  c[iY] = String(NY);
  lines[i] = c.join(',');
  if (c[iEnt]) posOf[c[iEnt]] = [X, NY];
}
if (!already) {
  const out = lines.join(crlf ? '\r\n' : '\n');
  fs.writeFileSync(CSV, (bom ? String.fromCharCode(0xfeff) : '') + out, 'utf8');
}

const b = S.open(WORLD, 'WorldMapGroup');
let moved = 0;
for (const [ent, p] of Object.entries(posOf)) {
  const np = NODES + '/' + ent;
  if (S.has(b, np)) { S.place(b, np, { pos: p }); moved++; }
}
// 내 위치 · 목표 핀은 안내창(Tooltip) · 정보판(InfoPanel) 뒤
const firstPanel = S.has(b, BD + '/InfoPanel') ? BD + '/InfoPanel' : BD + '/Tooltip';
S.before(b, BD + '/HereMarker', firstPanel);
for (let i = 0; i < 6; i++) if (S.has(b, BD + '/GoalMarker_' + i)) S.before(b, BD + '/GoalMarker_' + i, firstPanel);
b.write(path.join(WORLD, 'ui', 'WorldMapGroup.ui'), { lint_verbose: !!process.env.LINT_V });
console.log('노드 ' + moved + '곳 옮김 · 핀 순서 → ' + firstPanel + ' 앞');
