// CommonNpcGroup(공용 NPC 창 · 차원의 거울 · 파병 · 전직관 대화)의 GroupOrder 를 튜토리얼 막(CoachMark 18 · Tutorial 19)보다 아래로 (사용자 2026-10-07).
//   26 이면 튜토리얼 막 · 손가락이 거울 창 뒤에 깔려 아무 마을이나 눌려 이동됐다. 16 = 월드맵(15) 바로 위 · 도움말(17) 아래.
// 실행(월드 루트): node Docs/tools/design-ui/fix-npc-group-order.cjs   → 그 뒤 Maker refresh
const path = require('path');
const S = require('./skin.cjs');
const WORLD = path.resolve(__dirname, '..', '..', '..');
const ORDER = 16;
const b = S.open(WORLD, 'CommonNpcGroup');
b.patchComponent('CommonNpcGroup', 'MOD.Core.UIGroupComponent', { GroupOrder: ORDER });
b.write(path.join(WORLD, 'ui', 'CommonNpcGroup.ui'), { lint_verbose: !!process.env.LINT_V });
console.log('CommonNpcGroup GroupOrder = ' + ORDER);
