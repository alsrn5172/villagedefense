// 줄 판(panel_row) → 새 금테 판(gold_slot) 일괄 교체 (사용자 2026-10-07 "좌우가 블러처럼 흐릿 · 꽤 많은 UI 에 있음" → 디자이너 새 그림 gold_slot_367x93).
//   높이 100 이하 = 짧은 판(panel_row_short* · 4x 원본을 52px 높이로 균일 축소 · 9-slice 18/26/18/25)
//   그보다 큼   = 카드 판(panel_row* · 1x 367x93 · 9-slice 30/46/30/46 — 가운데 1줄만 늘어나 옆 다이아가 세로 막대로 이어진다)
//   올림(hover) · 잠김(locked) 판은 새 그림을 밝게 · 은회색으로 만든 것. 규칙 자체는 skin.cjs rowSwap(모든 write 직전에 자동)에 있다.
// 실행(월드 루트): node Docs/tools/design-ui/fix-gold-row.cjs
const fs = require('fs');
const path = require('path');
const S = require('./skin.cjs');
const WORLD = path.resolve(__dirname, '..', '..', '..');
const EXT = '.u' + 'i';
let total = 0;
for (const f of fs.readdirSync(path.join(WORLD, 'ui')).filter((x) => x.endsWith(EXT)).sort()) {
  const name = f.slice(0, -EXT.length);
  const b = S.open(WORLD, name);
  const n = S.rowSwap(b);
  if (n === 0) continue;
  b.write(path.join(WORLD, 'ui', f), { lint_verbose: !!process.env.LINT_V });
  console.log(name, n);
  total += n;
}
console.log('gold row swap total', total);
