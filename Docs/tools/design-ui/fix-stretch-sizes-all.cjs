// 모든 UI 그룹의 "부모에 맞춰 늘이기" 앵커 엔티티 RectSize 를 실제 크기로 맞춘다 (fix-minimap-stretch-sizes.cjs 를 전 그룹으로).
//   2026-10-07 사용자 "HUD 칸 공간이 갑자기 이상해짐": 상태창 게이지 틀(img_background · 늘이기)의 파일 RectSize 가 옛 334x30 이라
//   Play 에서 줄(294x26)보다 좌우 20 · 위아래 2 크게 그려졌고, 채움 막대는 그대로라 양끝에 빈칸이 생겼다.
//   Maker 저장은 이 값을 다시 계산해 써 주지만(그래서 평소엔 멀쩡해 보임), 저장분을 git 으로 되돌리면 옛 값이 살아난다.
//   부모 크기 × (AnchorsMax − AnchorsMin) + (OffsetMax − OffsetMin) 을 위에서부터 계산해 넣는다. 바뀐 그룹만 쓴다 · 다시 돌려도 같다.
// 실행(월드 루트): node Docs/tools/design-ui/fix-stretch-sizes-all.cjs [그룹 …]   (그룹을 안 주면 ui/ 전체)
const fs = require('fs');
const path = require('path');
const S = require('./skin.cjs');
const WORLD = path.resolve(__dirname, '..', '..', '..');
const EXT = '.u' + 'i';
const UIT = 'MOD.Core.UITransformComponent';
const groups = process.argv.slice(2).length ? process.argv.slice(2)
  : fs.readdirSync(path.join(WORLD, 'ui')).filter((f) => f.endsWith(EXT)).map((f) => f.slice(0, -EXT.length)).sort();
let total = 0;
for (const GROUP of groups) {
  const b = S.open(WORLD, GROUP);
  const sizeOf = {};
  const ents = b.entities.slice().sort((a, c) => a.path.split('/').length - c.path.split('/').length);
  const lines = [];
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
        lines.push('  ' + e.path.replace('/ui/' + GROUP + '/', '') + ': ' + w + 'x' + h + ' → ' + +nw.toFixed(2) + 'x' + +nh.toFixed(2));
      }
      w = nw; h = nh;
    }
    sizeOf[e.path] = { w, h };
  }
  if (lines.length === 0) continue;
  const q = console.log; console.log = () => {};
  b.write(path.join(WORLD, 'ui', GROUP + EXT), { lint_verbose: !!process.env.LINT_V });
  console.log = q;
  console.log(GROUP + ' ' + lines.length);
  if (process.env.V) console.log(lines.join('\n'));
  total += lines.length;
}
console.log('stretch size fix total ' + total);
