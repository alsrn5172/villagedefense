// NPC 대화창(CommonNpcGroup/NpcTalk · 전직관 "새로운 모험의 시작" 등)의 임시 판 두 개를 시안 스킨으로 (사용자 2026-10-07 "나중에 · NPC 이름 배경도 UI 처리").
//   나중에(BtnEnd) = 흰 둥근 사각형 + 회색 틴트 → 파란 버튼(btn_blue_*) · 글자는 그대로(Maple 26 상아색)
//   이름 칸(PortraitBg/NamePlate) = 흰 둥근 사각형 + 남색 틴트 → 어두운 판(plate_dark · 9-slice) · 금색 이름 글자 그대로
// 실행(월드 루트): node Docs/tools/design-ui/fix-npc-talk-skin.cjs
const path = require('path');
const S = require('./skin.cjs');
const WORLD = path.resolve(__dirname, '..', '..', '..');
const b = S.open(WORLD, 'CommonNpcGroup');
S.button(b, 'NpcTalk/BtnEnd', { normal: 'btn_blue_default', hover: 'btn_blue_hover', pressed: 'btn_blue_pressed', disabled: 'btn_blue_disabled' });
S.image(b, 'NpcTalk/PortraitBg/NamePlate', 'plate_dark');
b.write(path.join(WORLD, 'ui', 'CommonNpcGroup.ui'), { lint_verbose: !!process.env.LINT_V });
console.log('npc talk skin: BtnEnd = btn_blue · NamePlate = plate_dark');
