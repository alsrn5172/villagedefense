// 월드맵 핀 색 바꾸기(사용자 2026-10-06): 내 위치 = 노랑 · 목표 = 진한 파랑(길 안내 선이 파랑이라 목표도 파랑 계열).
// 내 위치 = 금색 핀(map_pin_goal) + 금색 꼬리표 · 목표 = 하늘색 핀(map_pin_me)을 곱하기 틴트로 진하게 + 남색 꼬리표.
// 실행(월드 루트에서): node Docs/tools/design-ui/fix-worldmap-pin-colors.cjs — 다시 돌려도 같다. apply-worldmap.cjs 의 marker() 줄도 같은 값.
const path = require('path');
const S = require('./skin.cjs');
const WORLD = path.resolve(__dirname, '..', '..', '..');
const b = S.open(WORLD, 'WorldMapGroup');
const BD = 'MapPanel/Board';
const ROUND = 'f5e5fbd6dd224f2d8a5af320436b95f0';
function recolor(name, pinKey, pinTint, tagColor) {
  const P = `${BD}/${name}`;
  S.image(b, P + '/Flag', pinKey, { color: pinTint });
  if (b.find(P + '/Label')) b.patchComponent(P + '/Label', S.SPR, { ImageRUID: { DataId: ROUND }, Type: 1, Color: S.C(tagColor, 1) });
}
recolor('HereMarker', 'map_pin_goal', '#FFFFFF', '#8C6200');
for (let i = 0; i < 6; i++) recolor('GoalMarker_' + i, 'map_pin_me', '#7A8FD9', '#0B3A80');
b.write(path.join(WORLD, 'ui', 'WorldMapGroup.ui'), { lint_verbose: !!process.env.LINT_V });
console.log('핀 색 적용 끝');
