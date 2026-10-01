// S.chipText 의 "글자 상자 줄이기"를 되돌려 주는 감싸개 (G2 묶음 · 칩 글자 대비 2단계).
// 왜: skin.cjs chipText 는 칩 안 글자 상자를 `칩 폭 - 2 x (테두리 + 1)` 까지 줄인다. 시안의 칩 폭은 "시안 글꼴 글자 폭 + 좌우 여백"이라
//     줄인 상자 = 시안 글자 폭 그대로인데, 게임 글꼴은 10~15% 넓어서 상자 안에서 줄이 꺾이거나 잘린다(예: 교환 배지 44 -> 글자 상자 22).
//     글자는 가운데 정렬이라 상자를 칩 폭 그대로 두어도 좌우 여백 = (칩 폭 - 글자 폭) / 2 로 같은 값이다 -> 상자 크기만 원래대로 되돌린다.
// 쓰는 법: const touched = require('./chiptext-keeprect.cjs')(S, b, opts);   // S.chipText 와 같은 인자 · 같은 반환값
const UIT = 'MOD.Core.UITransformComponent';

module.exports = function chipTextKeepRect(S, b, opts) {
  const quiet = console.log; console.log = () => {};
  const rects = new Map();
  try {
    for (const e of b.entities) {
      if (!b.hasComponent(e.path, S.TXT)) continue;
      const t = b.getComponent(e.path, UIT);
      if (t && t.RectSize) rects.set(e.path, { x: t.RectSize.x, y: t.RectSize.y });
    }
  } finally { console.log = quiet; }
  const touched = S.chipText(b, opts);
  console.log = () => {};
  try {
    for (const t of touched) {
      const was = rects.get(t.path); if (!was) continue;
      const now = b.getComponent(t.path, UIT);
      if (now && now.RectSize && (now.RectSize.x !== was.x || now.RectSize.y !== was.y)) b.patchComponent(t.path, UIT, { RectSize: was });
    }
  } finally { console.log = quiet; }
  return touched;
};
