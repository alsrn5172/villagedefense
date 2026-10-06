// 월드맵 왼쪽 아래 범례(여섯갈래길 · 마을 · 사냥터 · 보스 · 내 위치 · 목표)를 없앤다 (사용자 2026-10-07 "필요 없다 그냥 없애라").
//   지도 그림에 점 · 길 · 마을 이름이 이미 그려져 있다. apply-worldmap.cjs 도 범례를 더는 만들지 않는다(같은 결과).
// 실행(월드 루트): node Docs/tools/design-ui/fix-worldmap-no-legend.cjs
const path = require('path');
const S = require('./skin.cjs');
const WORLD = path.resolve(__dirname, '..', '..', '..');
const b = S.open(WORLD, 'WorldMapGroup');
const before = b.listEntities().length;
const LGN = 'MapPanel/Board/Legend';
if (b.find(LGN)) b.remove(LGN);
b.write(path.join(WORLD, 'ui', 'WorldMapGroup.ui'), { lint_verbose: !!process.env.LINT_V });
console.log(`world map legend removed: ${before} -> ${b.listEntities().length} entities`);
