// 미니맵(MinimapGroup) "부모에 맞춰 늘이기" 앵커 엔티티의 RectSize 를 실제 크기로 채운다(사용자 2026-10-06 "남색 배경이 규격에 딱 안 맞음").
//   원인: 늘이기 앵커(AnchorsMin ≠ AnchorsMax)인데 파일 RectSize 가 빌더 기본 100x100 이라 Play 에서 가운데 100x100 으로만 그려졌다
//   (Maker 편집 화면은 저장할 때 다시 계산해서 멀쩡해 보인다). 부모 크기 × 앵커 폭 + (OffsetMax − OffsetMin) 으로 위에서부터 계산해 넣는다.
// 실행(월드 루트에서): node Docs/tools/design-ui/fix-minimap-stretch-sizes.cjs [그룹이름] — 기본 MinimapGroup · 다시 돌려도 같다.
const path = require('path');
const S = require('./skin.cjs');
const WORLD = path.resolve(__dirname, '..', '..', '..');
const GROUP = process.argv[2] || 'MinimapGroup';
const UIT = 'MOD.Core.UITransformComponent';
const b = S.open(WORLD, GROUP);
const sizeOf = {};
const ents = b.entities.slice().sort((a, c) => a.path.split('/').length - c.path.split('/').length);
let changed = 0;
for (const e of ents) {
  const t = b.getComponent(e.path, UIT);
  if (!t) continue;
  const parentPath = e.path.slice(0, e.path.lastIndexOf('/'));
  const ps = sizeOf[parentPath];
  const aMin = t.AnchorsMin || { x: 0.5, y: 0.5 };
  const aMax = t.AnchorsMax || { x: 0.5, y: 0.5 };
  let w = t.RectSize ? t.RectSize.x : 0;
  let h = t.RectSize ? t.RectSize.y : 0;
  if (ps && (aMin.x !== aMax.x || aMin.y !== aMax.y)) {
    const oMin = t.OffsetMin || { x: 0, y: 0 };
    const oMax = t.OffsetMax || { x: 0, y: 0 };
    const nw = aMin.x !== aMax.x ? ps.w * (aMax.x - aMin.x) + oMax.x - oMin.x : w;
    const nh = aMin.y !== aMax.y ? ps.h * (aMax.y - aMin.y) + oMax.y - oMin.y : h;
    if (Math.abs(nw - w) > 0.01 || Math.abs(nh - h) > 0.01) {
      b.patchComponent(e.path, UIT, { RectSize: { x: nw, y: nh } });
      console.log('크기 ' + e.path.replace('/ui/' + GROUP + '/', '') + ': ' + w + 'x' + h + ' → ' + nw + 'x' + nh);
      changed++;
    }
    w = nw; h = nh;
  }
  sizeOf[e.path] = { w, h };
}
if (changed === 0) console.log('바꿀 것 없음');
b.write(path.join(WORLD, 'ui', GROUP + '.ui'), { lint_verbose: !!process.env.LINT_V });
