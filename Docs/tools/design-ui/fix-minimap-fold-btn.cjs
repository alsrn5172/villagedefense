// 미니맵 머리줄 오른쪽 위에 접기 · 펴기 토글 버튼 (사용자 2026-10-07 "미니맵 우측 위에 토글로 접기 펴기") — N 키와 같은 일(MinimapController.ToggleFold).
//   모양 = 옆 "N" 키 칩과 같은 둥근 사각 · 하늘색(같은 줄 · 칩 왼쪽 6px) · 글자 "접기" / "펴기"(컨트롤러가 바꾼다).
// 실행(월드 루트): node Docs/tools/design-ui/fix-minimap-fold-btn.cjs
const path = require('path');
const S = require('./skin.cjs');
const WORLD = path.resolve(__dirname, '..', '..', '..');
const b = S.open(WORLD, 'MinimapGroup');
b.button('Minimap/BtnFold', '접기', {
  anchor: 'top-right', pivot: [1, 1], pos: [-46, -7], rect_size: [40, 18],
  image_ruid: 'f5e5fbd6dd224f2d8a5af320436b95f0', sprite_type: 0, bg_color: '#8EC5FF',
  font_size: 11, color: '#10203F',
});
b.write(path.join(WORLD, 'ui', 'MinimapGroup.ui'), {
  lint_verbose: !!process.env.LINT_V,
  bind: { mlua: path.join(WORLD, 'RootDesk/MyDesk/Minimap/MinimapController.mlua'), props: { btnFold: 'Minimap/BtnFold' } },
});
console.log('minimap fold button added');
