// 채팅 창(ChatGroup) 가로 420 → 356(사용자 2026-10-06 "채팅 가로 칸이 길어 네비게이션이랑 겹침").
//   ★ 안내 목표 바(GuideGroup/Bar · 가운데 1120 폭 → 왼쪽 끝 x 400)와 20px 띄운다: 왼쪽 24 + 356 = 380.
//   한 줄 판 · 기록 판 · 입력 줄 셋 다 같은 폭 · 안쪽 글자 칸은 폭 − 24. apply-chat.cjs 의 같은 값도 바꿨다.
// 실행(월드 루트에서): node Docs/tools/design-ui/fix-chat-width.cjs — 다시 돌려도 같다.
const path = require('path');
const S = require('./skin.cjs');
const WORLD = path.resolve(__dirname, '..', '..', '..');
const W = 356;
const LEFT = 24;
const b = S.open(WORLD, 'ChatGroup');
for (const [box, h, inner, ih] of [['Chat/Line', 40, 'Chat/Line/Text', 40], ['Chat/Log', 300, 'Chat/Log/Text', 280], ['Chat/Input', 44, 'Chat/Input/Field', 36]]) {
  const [, y] = S.posOf(b, box);
  b.patch(box, { pos: [LEFT + W / 2, y], rect_size: [W, h] });
  S.setSize(b, inner, W - 24, ih);
  console.log(box + ' → ' + W + 'x' + h + ' · ' + inner + ' → ' + (W - 24) + 'x' + ih);
}
b.write(path.join(WORLD, 'ui', 'ChatGroup.ui'), { lint_verbose: !!process.env.LINT_V });
