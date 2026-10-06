// 마을 창고 판 부제 "마을 주인 공용" → "마을 주인 전용"(주인은 한 명 · 사용자 2026-10-06). apply-life.cjs 의 같은 줄도 바꿨다.
// 실행(월드 루트에서): node Docs/tools/design-ui/fix-storage-owner-label.cjs — 다시 돌려도 같다.
const path = require('path');
const S = require('./skin.cjs');
const WORLD = path.resolve(__dirname, '..', '..', '..');
const b = S.open(WORLD, 'VillageLifeGroup');
let n = 0;
for (const e of b.entities) {
  const t = b.getComponent(e.path, S.TXT);
  if (t && t.Text === '마을 주인 공용') { b.patchComponent(e.path, S.TXT, { Text: '마을 주인 전용' }); n++; console.log('고침: ' + e.path); }
}
if (n === 0) console.log('바꿀 글자 없음(이미 전용)');
b.write(path.join(WORLD, 'ui', 'VillageLifeGroup.ui'), { lint_verbose: !!process.env.LINT_V });
