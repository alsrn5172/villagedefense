// 관전 바(SpectateGroup)에 디자이너 시안(18-spectate)을 입힌다.
// 실행(월드 루트에서): node Docs/tools/design-ui/apply-spectate.cjs
// 다시 돌려도 같은 결과가 나온다. 기존 엔티티는 지우지 않고 값만 바꾼다(새 노드 없음).
// 탭 폭 · 바 폭 · 따라가는 사람 칩 · 자유 버튼 금/파랑은 SpectateUIController 가 런타임에 맞춘다(여기는 기본 = 탭 4개 · 자유 켜짐).
const path = require('path');
const S = require('./skin.cjs');
const WORLD = path.resolve(__dirname, '..', '..', '..');
const b = S.open(WORLD, 'SpectateGroup');
const B = 'TopBar';

// 바: 위 가운데 · 위에서 100(시계 아래 22) · 높이 76 · 툴팁 판. 폭은 스크립트가 탭 수에 맞춘다(기본 1140).
S.place(b, B, { pos: [0, -100], size: [1140, 76] });
S.image(b, B, 'panel_tooltip');

// 관전 중 (눈 아이콘은 대응 그림이 없어 생략)
S.place(b, B + '/Label', { pos: [16, 0], size: [100, 28] });
S.font(b, B + '/Label', { font: 'Maple', size: 20, color: S.COLOR.title, h: 'left', v: 'middle', outline: false });

// 생존자 탭 4칸: 왼쪽 기준 · 폭 174 고정(글자 폭을 재지 않는다 · 넘치면 말줄임) · 사이 10 · 첫 칸은 왼쪽에서 125
for (let i = 0; i < 4; i++) {
  const p = `${B}/Tab_${i}`;
  S.place(b, p, { anchor: 'middle-left', pivot: [0, 0.5], pos: [125 + 184 * i, 0], size: [174, 46] });
  S.image(b, p, 'chip_blue_dark');
  S.font(b, p, { font: 'Noto700', size: 16, color: S.COLOR.ivory, h: 'center', v: 'middle', outline: false, overflow: 1 });
  b.patchComponent(p, S.TXT, { Padding: { left: 10, right: 10, top: 0, bottom: 0 } });
}

// 자유 카메라(켜짐 = 금 버튼 · 꺼짐 = 파랑 버튼은 스크립트가 그림을 바꾼다) · 나가기(빨강 칩)
S.place(b, B + '/BtnFreeCam', { pos: [-138, 0], size: [120, 46] });
S.image(b, B + '/BtnFreeCam', 'btn_gold_default');
S.font(b, B + '/BtnFreeCam', { font: 'Noto400', size: 16, color: S.COLOR.goldInk, h: 'center', v: 'middle', outline: false, text: '자유' });
S.place(b, B + '/BtnLeave', { pos: [-16, 0], size: [112, 46] });
S.button(b, B + '/BtnLeave', { normal: 'btn_kick_default', pressed: 'btn_kick_pressed' });
S.font(b, B + '/BtnLeave', { font: 'Noto700', size: 16, color: S.COLOR.white, h: 'center', v: 'middle', outline: false, text: '나가기' });

b.write(path.join(WORLD, 'ui', 'SpectateGroup.ui'));
console.log('SpectateGroup 적용 끝');
