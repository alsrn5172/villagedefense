// 미니맵 새 그림 (사용자 2026-10-07 "미니맵 배경이 임시 · 펴기/닫기 토글 그림 가져왔음" — 리소스파일/필요에셋).
//   판 = minimap_frame_open/closed (2x 그림 620x444 · 620x168 을 0.55 배 = 341x244 · 341x92 로 · Simple) — 위쪽은 글씨 자리, 아래 어두운 칸이 지도 자리.
//   토글 = 펼침: 접기(위 화살표 · minimap_fold) / 접힘: 펴기(아래 화살표 · minimap_unfold). 기본 = 어두운(흑백) 그림, 올림 · 누름 = 파란 그림.
//   옛 임시 판(Frame · HeadBand · 지도 칸 테두리 · Inner)은 끄거나 투명, N 키 칩은 시안에 없어 끈다(N 키는 그대로 동작).
//   좌표는 시안(minimap_open2x.png)에서 잰 값 × 0.55. MinimapController 의 OpenHeight 244 · FoldedHeight 92 와 맞춘다.
// 실행(월드 루트): node Docs/tools/design-ui/fix-minimap-skin.cjs
const path = require('path');
const S = require('./skin.cjs');
const WORLD = path.resolve(__dirname, '..', '..', '..');
const b = S.open(WORLD, 'MinimapGroup');
const K = 0.55;
const W = Math.round(620 * K), HO = Math.round(444 * K);   // 341 x 244
const M = 'Minimap';

S.place(b, M, { size: [W, HO] });
// 판: 위 모서리 고정(접으면 높이만 바뀐다 · 컨트롤러가 그림 · 높이를 바꾼다)
S.place(b, M + '/Bg', { anchor: 'top-left', pivot: [0, 1], pos: [0, 0], size: [W, HO] });
S.image(b, M + '/Bg', 'minimap_frame_open', { type: 0 });
S.place(b, M + '/Frame', { enable: false });
S.place(b, M + '/HeadBand', { enable: false });
S.place(b, M + '/KeyChip', { enable: false });

// 글씨 자리 (시안 2x: MINI MAP x36 y26~50 · 문장 중심 66,107 지름 76 · 지역 줄 x122 y70~96 · 이름 x122 y100~140)
S.place(b, M + '/Caption', { anchor: 'top-left', pivot: [0, 1], pos: [20, -12], size: [140, 18] });
S.font(b, M + '/Caption', { font: 'Maple', size: 14, color: S.COLOR.gold, h: 'left', text: 'MINI MAP' });
S.place(b, M + '/Emblem', { anchor: 'top-left', pivot: [0.5, 0.5], pos: [36, -59], size: [42, 42] });
S.place(b, M + '/Emblem/Img', { size: [42, 42] });
S.place(b, M + '/Region', { anchor: 'top-left', pivot: [0, 1], pos: [67, -37], size: [236, 18] });
S.font(b, M + '/Region', { size: 13, color: S.COLOR.sub, h: 'left' });
S.place(b, M + '/Title', { anchor: 'top-left', pivot: [0, 1], pos: [67, -54], size: [236, 26] });
S.font(b, M + '/Title', { font: 'Maple', size: 20, color: S.COLOR.title, h: 'left' });

// 지도 자리 = 시안의 어두운 칸(2x x33~587 y168~398 → 18~323 · 92~219) 안쪽 3px
S.place(b, M + '/Box', { anchor: 'top-left', pivot: [0, 1], pos: [21, -95], size: [299, 121] });
S.tint(b, M + '/Box', '#000000', 0);
S.tint(b, M + '/Box/Inner', '#000000', 0);

// 토글 두 개(같은 자리 · 하나만 켜진다) — 시안 2x (538~592, 22~76) → 오른쪽 위에서 중심 (−30, −27) · 30x30
const TOG = { anchor: 'top-right', pivot: [0.5, 0.5], pos: [-30, -27], rect_size: [30, 30], image_ruid: S.R('minimap_fold'), sprite_type: 0, bg_color: '#FFFFFF', font_size: 1, color: '#FFFFFF' };
S.place(b, M + '/BtnFold', { anchor: 'top-right', pivot: [0.5, 0.5], pos: [-30, -27], size: [30, 30] });
S.font(b, M + '/BtnFold', { text: '' });
S.button(b, M + '/BtnFold', { normal: 'minimap_fold', hover: 'minimap_fold_hover', pressed: 'minimap_fold_hover' });
if (!S.has(b, M + '/BtnUnfold')) b.button(M + '/BtnUnfold', '', { ...TOG, image_ruid: S.R('minimap_unfold') });
S.place(b, M + '/BtnUnfold', { anchor: 'top-right', pivot: [0.5, 0.5], pos: [-30, -27], size: [30, 30], enable: false });
S.button(b, M + '/BtnUnfold', { normal: 'minimap_unfold', hover: 'minimap_unfold_hover', pressed: 'minimap_unfold_hover' });

b.write(path.join(WORLD, 'ui', 'MinimapGroup.ui'), {
  lint_verbose: !!process.env.LINT_V,
  bind: { mlua: path.join(WORLD, 'RootDesk/MyDesk/Minimap/MinimapController.mlua'), props: { btnFold: M + '/BtnFold', btnUnfold: M + '/BtnUnfold', bgImg: M + '/Bg' } },
});
console.log('minimap skin applied', W, HO);
