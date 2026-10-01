// 부활 팝업(RevivePopupGroup)에 디자이너 시안(16-revive)을 입힌다.
// 실행(월드 루트에서): node Docs/tools/design-ui/apply-revive.cjs
// 다시 돌려도 같은 결과가 나온다. 기존 엔티티는 지우지 않고 값만 바꾼다.
const path = require('path');
const S = require('./skin.cjs');
const WORLD = path.resolve(__dirname, '..', '..', '..');
const b = S.open(WORLD, 'RevivePopupGroup');

const PANEL = [260, 220, 680, 370];      // 시안 캔버스에서 창 상자
const BTN_M = [300, 448, 291, 96];
const BTN_E = [609, 448, 291, 96];
const BAND = [280, 242, 640, 64];
const TRACK = [377.5, 400, 466.5, 20];
const P = 'Dim/Panel';

// 화면 막 · 창 판
S.tint(b, 'Dim', S.COLOR.veil, 0.6);
b.patchComponent('Dim', S.SPR, { Type: 1 }); // 기본 그림은 Simple 로 두면 안 그려진다(실측) → Sliced
S.place(b, P, { pos: [0, -5], size: [680, 370] });
S.image(b, P, 'panel_window');

// 제목 띠(글자보다 뒤) · 경고 아이콘 · 제목
S.newImage(b, P + '/TitleBand', 'panel_title_bar', { pos: S.at(...BAND, PANEL), size: [640, 64] });
S.newImage(b, P + '/TitleBand/Icon', 'icon_warn', { pos: S.at(494, 258, 34, 32, BAND), size: [34, 32] });
S.place(b, P + '/Title', { pos: [S.at(540, 253, 165.5, 42, PANEL)[0], S.at(...BAND, PANEL)[1]], size: [260, 42] });
S.font(b, P + '/Title', { font: 'Maple', size: 30, color: '#FFD0C8', h: 'center', v: 'middle', outline: false, shadow: true });

// 안내 문구 · 남은 시간
S.place(b, P + '/Message', { pos: S.at(304, 324, 592, 62, PANEL), size: [592, 62] });
S.font(b, P + '/Message', { font: 'Maple', size: 20, color: S.COLOR.ivory, h: 'center', v: 'middle', outline: false, shadow: true });
S.newText(b, P + '/TimeLabel', '남은 시간', { font: 'Noto700', size: 16, color: S.COLOR.sub, pos: S.at(304, 399, 63.5, 22.5, PANEL), rect: [80, 24] });
S.newImage(b, P + '/TimeTrack', 'gauge_track', { pos: S.at(...TRACK, PANEL), size: [466.5, 20] });
S.newImage(b, P + '/TimeTrack/Fill', 'gauge_fill_red', { pos: [0, 0], size: [434.5, 8], type: 3 });
S.newText(b, P + '/TimeSec', '15초', { font: 'Maple', size: 20, color: '#FFB3A6', pos: S.at(854, 396, 42, 28, PANEL), rect: [60, 28] });

// 메소로 부활
S.place(b, P + '/BtnMeso', { pos: S.at(...BTN_M, PANEL), size: [291, 96] });
S.button(b, P + '/BtnMeso', { normal: 'btn_blue_default', hover: 'btn_blue_hover', pressed: 'btn_blue_pressed', disabled: 'btn_blue_disabled' });
S.font(b, P + '/BtnMeso', { text: '' });
S.newImage(b, P + '/BtnMeso/Icon', 'icon_meso', { pos: S.at(366, 468, 34, 32, BTN_M), size: [34, 32] });
S.newText(b, P + '/BtnMeso/Title', '메소로 부활', { font: 'Maple', size: 24, color: S.COLOR.ivory, pos: S.at(407, 467, 118, 33.5, BTN_M), rect: [150, 34], shadow: true });
S.newText(b, P + '/BtnMeso/Sub', '5,000 메소', { font: 'Noto700', size: 16, color: '#CFE3FF', pos: S.at(300, 502.5, 291, 22.5, BTN_M), rect: [270, 24] });

// 경험치로 부활
S.place(b, P + '/BtnExp', { pos: S.at(...BTN_E, PANEL), size: [291, 96] });
S.button(b, P + '/BtnExp', { normal: 'btn_gold_default', pressed: 'btn_gold_pressed', disabled: 'btn_gold_disabled' });
S.font(b, P + '/BtnExp', { text: '' });
S.newImage(b, P + '/BtnExp/Icon', 'icon_info_exp', { pos: S.at(664, 468, 34, 32, BTN_E), size: [34, 32] });
S.newText(b, P + '/BtnExp/Title', '경험치로 부활', { font: 'Maple', size: 24, color: S.COLOR.goldInk, pos: S.at(705, 467, 140, 33.5, BTN_E), rect: [170, 34] });
S.newText(b, P + '/BtnExp/Sub', '경험치 -375 · 레벨 유지', { font: 'Noto700', size: 16, color: '#5A3A08', pos: S.at(609, 502.5, 291, 22.5, BTN_E), rect: [270, 24] });
// 🔴 칩 글자 대비(시안 1790844637-7b1e): 시안 98 → 100 이지만 게임 글꼴이 넓어 '15초 뒤 자동'이 안쪽(폭 − 2 × (테두리 11 + 1))에 한 줄로 들어가게 112(안쪽 88 · 오른쪽 끝 890 은 그대로).
S.newImage(b, P + '/BtnExp/AutoChip', 'chip_red', { pos: S.at(778, 432, 112, 25, BTN_E), size: [112, 25] });
S.newText(b, P + '/BtnExp/AutoChip/Text', '15초 뒤 자동', { font: 'Maple', size: 14, color: S.COLOR.white, pos: [0, 0], rect: [88, 25] });

// 창 위 문장(맨 앞)
S.newImage(b, P + '/Crest', 'deco_crest', { pos: S.at(450, 168, 300, 88, PANEL), size: [300, 88] });

// 그리기 순서: 제목 띠는 제목 글자보다 뒤, 문장은 맨 앞
S.before(b, P + '/TitleBand', P + '/Title');
S.front(b, P + '/Crest');

// 🔴 칩 글자 대비(시안 1790844637-7b1e): 글자를 다 맞춘 뒤에 건다
const touched = S.chipText(b);
console.log('chipText', touched.length, touched.map((t) => t.kind + ':' + t.path.replace('/ui/', '')).join(' '));

b.write(path.join(WORLD, 'ui', 'RevivePopupGroup.ui'), {
  bind: {
    mlua: path.join(WORLD, 'RootDesk/MyDesk/Match/PlayerRespawnUIController.mlua'),
    props: {
      timeFill: P + '/TimeTrack/Fill', timeSec: P + '/TimeSec',
      mesoIcon: P + '/BtnMeso/Icon', mesoTitle: P + '/BtnMeso/Title', mesoSub: P + '/BtnMeso/Sub',
      expSub: P + '/BtnExp/Sub', autoText: P + '/BtnExp/AutoChip/Text',
    },
  },
});
console.log('RevivePopupGroup 적용 끝');
