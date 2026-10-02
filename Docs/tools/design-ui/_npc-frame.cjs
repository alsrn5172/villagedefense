// CommonNpcGroup 의 창 틀(Window · TitleBar · BtnClose · Footer · 주 버튼)을 디자이너 시안(13-dispatch · 14-gate 공통)대로 입힌다.
// 파병 접수(apply-dispatch.cjs)와 차원 관문(apply-gate.cjs)이 같이 쓴다 — 둘 다 이 틀을 먼저 입히므로 어느 쪽을 먼저/따로 돌려도 같은 결과.
// 전직관 대화창(NpcTalk)은 건드리지 않는다. 스크립트가 UUID 로 잡는 기존 엔티티는 지우지도 이름을 바꾸지도 않는다.
const S = require('./skin.cjs');
const C = S.COLOR;

// 시안 캔버스 좌표(왼쪽 위 기준 x,y,w,h) — 두 창이 같은 창 틀을 쓴다.
const WIN = [110, 110, 980, 720];
const BAND = [210, 132, 780, 64];
const TITLE = [472, 143, 300, 42];     // 제목 글자 상자(가운데 정렬 · 글자 중심 = 캔버스 x 622)
const CONTENT = [110, 210, 980, 504];  // 창 몸통 — Dispatch / DimensionGate 가 꽉 채운다
const FOOT = [114, 714, 972, 112];
const BTN_PRI = [800, 726.5, 260, 88];

function frame(b) {
  const ctr = (p, r, parent, extra) => S.place(b, p, Object.assign({ anchor: 'middle-center', pivot: [0.5, 0.5], pos: S.at(r[0], r[1], r[2], r[3], parent), size: [r[2], r[3]] }, extra || {}));
  const img = (p, key, r, parent, o) => S.newImage(b, p, key, Object.assign({ pos: S.at(r[0], r[1], r[2], r[3], parent), size: [r[2], r[3]] }, o || {}));
  const txt = (p, text, r, parent, o) => S.newText(b, p, text, Object.assign({ pos: S.at(r[0], r[1], r[2], r[3], parent), rect: [r[2], r[3]] }, o || {}));

  // 화면 막 · 창 판 (Window 는 시안대로 캔버스 가운데보다 20px 아래)
  S.tint(b, 'Dimmer', C.veil, 0.6);
  b.patchComponent('Dimmer', S.SPR, { Type: 1 });
  ctr('Window', WIN, [0, 0, 1200, 900]);
  S.image(b, 'Window', 'panel_window');

  // 창 위 문장 · 제목 띠(글자보다 뒤)
  img('Window/Crest', 'deco_crest', [450, 58, 300, 88], WIN);
  img('Window/Band', 'panel_title_bar', BAND, WIN);

  // 제목: 글자만 남기고 그림은 끈다(띠는 위 Band). 글자는 스크립트가 NPC 이름으로 덮어쓴다.
  ctr('Window/TitleBar', TITLE, WIN);
  S.tint(b, 'Window/TitleBar', C.white, 0);
  S.font(b, 'Window/TitleBar', { font: 'Maple', size: 30, color: C.title, h: 'center', v: 'middle', outline: false, shadow: true });
  img('Window/TitleBar/SparkleL', 'deco_sparkle', [491, 155, 18, 18], TITLE);
  img('Window/TitleBar/SparkleR', 'deco_sparkle', [691, 155, 18, 18], TITLE);

  // 닫기
  ctr('Window/BtnClose', [1018, 138, 52, 52], WIN);
  S.button(b, 'Window/BtnClose', { normal: 'btn_close_default', hover: 'btn_close_hover' });
  S.font(b, 'Window/BtnClose', { text: '' });

  // 몸통
  ctr('Window/Content', CONTENT, WIN);
  // 안쪽 두 컨테이너는 늘림 앵커로 Content 를 꽉 채운다 — 저장된 크기 값도 같이 맞춘다
  S.place(b, 'Window/Content/Dispatch', { size: [CONTENT[2], CONTENT[3]] });
  S.place(b, 'Window/Content/DimensionGate', { size: [CONTENT[2], CONTENT[3]] });

  // 하단 띠
  ctr('Window/Footer', FOOT, WIN);
  img('Window/Footer/Bg', 'plate_dark', FOOT, FOOT);
  b.sprite('Window/Footer/TopLine', { anchor: 'middle-center', pos: [0, 55], rect_size: [972, 1], pivot: [0.5, 0.5], color: '#E9B24A', alpha: 0.35, sprite_type: 0, raycast: false });

  // 주 버튼(파병 / 이동): 그림은 ButtonComponent 전환으로(켜짐 · 눌림 · 꺼짐). 글자 색은 스크립트가 켜짐/꺼짐에 맞춰 바꾼다.
  ctr('Window/Footer/BtnPrimary', BTN_PRI, FOOT);
  S.button(b, 'Window/Footer/BtnPrimary', { normal: 'btn_cta_default', pressed: 'btn_cta_pressed', disabled: 'btn_cta_disabled' });
  S.font(b, 'Window/Footer/BtnPrimary', { font: 'Maple', size: 24, color: C.goldInk, h: 'center', v: 'middle', outline: false, text: '파병' });

  // 하단 문구: 마을을 고르기 전(안내 아이콘 + 글) / 고른 뒤(마을 문장 + 한 줄 · 글자 안 색은 태그). 스크립트가 둘 중 하나만 켠다.
  ctr('Window/Footer/CostLabel', [190, 750.5, 590, 40], FOOT);
  S.font(b, 'Window/Footer/CostLabel', { font: 'Maple', size: 22, color: C.ivory, h: 'left', v: 'middle', outline: false });
  b.patchComponent('Window/Footer/CostLabel', S.TXT, { IsRichText: true });
  img('Window/Footer/CostEmblem', 'emblem_kerning', [140, 750.5, 40, 40], FOOT, { enable: false });
  img('Window/Footer/HintIcon', 'icon_info', [140, 758.5, 24, 24], FOOT);
  txt('Window/Footer/HintLabel', '', [172, 758, 590, 25], FOOT, { font: 'Noto700', size: 18, color: C.sub, h: 'left' });

  // 그리기 순서: 문장 → 띠 → 제목 글자 (문장 밑자락을 띠가 덮는다)
  S.back(b, 'Window/Band');
  S.back(b, 'Window/Crest');
  // 하단 띠: 배경 → 윗선 → 나머지
  S.back(b, 'Window/Footer/TopLine');
  S.back(b, 'Window/Footer/Bg');
}

// 스크립트가 잡는 새 엔티티(틀 쪽)
function frameProps() {
  return {
    hintIcon: 'Window/Footer/HintIcon', hintLabel: 'Window/Footer/HintLabel', costEmblem: 'Window/Footer/CostEmblem',
  };
}

module.exports = { frame, frameProps, WIN, CONTENT, FOOT, TITLE };
