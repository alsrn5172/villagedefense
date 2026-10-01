// 공방 창(VillageWorkshopGroup)에 디자이너 시안(09-workshop)을 입힌다 — 강화 · 강화 장비 고르기 · 보석 고르기 · 제작 · 물약.
// 실행(월드 루트에서): node Docs/tools/design-ui/apply-workshop.cjs
// 다시 돌려도 같은 결과가 나온다. 기존 엔티티는 지우지 않고 이름도 안 바꾼다(스크립트가 UUID · 이름으로 잡는다).
// 글자 · 칸 상태는 Item/WorkshopUIController.mlua 가 채운다(이름 경로로 찾는다 · 아래 이름을 바꾸면 안 된다).
// 수리(Repair) · 장비 상점 자리(ShopEquip)는 시안이 없어 손대지 않고, 창틀이 커진 만큼 제자리로만 돌려 놓는다.
//
// 그림 상태(칸 · 칩 · 카드)는 스프라이트를 갈아 끼우지 않고 "겹쳐 깔아 둔 그림을 켜고 끄는" 방식이다.
//   - 🔴 부모 엔티티에 글자가 있으면 자식 그림이 그 글자를 덮는다 → 글자는 항상 자식 Label 로 옮겨 놓는다.
//   - 덮는 그림(EmptyFrame · DisFrame · On · Sel …)은 형제 중 맨 뒤로 보내(S.back) 아이콘 · 글자 밑에 깔린다.
const path = require('path');
const S = require('./skin.cjs');
const WORLD = path.resolve(__dirname, '..', '..', '..');
const b = S.open(WORLD, 'VillageWorkshopGroup');
const before = b.listEntities().length;
const C = S.COLOR;
const GRID = 'MOD.Core.GridViewComponent';
// 긴 이름 한 줄 자동 축소: BestFit(MinSize 11 ~ MaxSize 시안 크기) + Overflow 0. 컨트롤러는 글자를 자르거나 크기를 어림하지 않는다(사용자 결정 2026-10-01).
const bestFit = (p, max) => b.patchComponent(p, S.TXT, { BestFit: true, MinSize: 11, MaxSize: max, Overflow: 0, FontSize: max });

// ── 시안 캔버스 좌표(왼쪽 위 기준 x,y,w,h · 1200x900 캔버스) ──
const WIN = [110, 110, 980, 720];
const CNT = [134, 210, 932, 604];
const FOOT = [114, 714, 972, 112];
const BAND = [210, 132, 780, 64];

// 기존 엔티티를 가운데 앵커 · 가운데 피벗으로 옮겨 시안 자리에 놓는다.
const at = (r, parent) => S.at(r[0], r[1], r[2], r[3], parent);
const ctr = (p, r, parent, extra) => S.place(b, p, Object.assign({ anchor: 'middle-center', pivot: [0.5, 0.5], pos: at(r, parent), size: [r[2], r[3]] }, extra || {}));
const img = (p, key, r, parent, o) => S.newImage(b, p, key, Object.assign({ pos: at(r, parent), size: [r[2], r[3]] }, o || {}));
const txt = (p, text, r, parent, o) => S.newText(b, p, text, Object.assign({ pos: at(r, parent), rect: [r[2], r[3]] }, o || {}));
const box = (p, r, parent, o) => S.newBox(b, p, Object.assign({ pos: at(r, parent), size: [r[2], r[3]] }, o || {}));
// 단색 판(가는 금선 · 점)
function flat(p, r, parent, color, alpha, enable) {
  b.sprite(p, { anchor: 'middle-center', pos: at(r, parent), rect_size: [r[2], r[3]], pivot: [0.5, 0.5], color, alpha: alpha == null ? 1 : alpha, sprite_type: 0, raycast: false, enable: enable !== false });
}
// 새 버튼(눌러 보는 것): 크리에이터는 새 엔티티에만 부른다.
function newBtn(p, label, r, parent, states, fontOpt, enable) {
  b.button(p, label, { anchor: 'middle-center', pos: at(r, parent), rect_size: [r[2], r[3]], pivot: [0.5, 0.5], enable: enable !== false });
  S.button(b, p, states);
  S.font(b, p, Object.assign({ h: 'center', v: 'middle', outline: false }, fontOpt));
}
// 글자를 덮는 그림을 뒤로: 나열한 순서대로 맨 뒤부터 쌓는다(첫 번째가 가장 뒤).
function backAll(names) { for (let i = names.length - 1; i >= 0; i--) S.back(b, names[i]); }
// 기존 글자 엔티티의 받침 그림을 투명하게(글자만 쓴다)
const noBg = (p) => S.tint(b, p, C.white, 0);
const noTransition = (p) => b.patchComponent(p, S.BTN, { Transition: 0 });
const zero4 = { left: 0, right: 0, top: 0, bottom: 0 };

// ═══════════════════════════════════════════════════════════
// 창틀: 화면 막 · 판 · 문장 · 제목 띠 · 닫기 · 내용 자리 · 바닥 띠
// ═══════════════════════════════════════════════════════════
S.tint(b, 'Dimmer', C.veil, 0.6);
b.patchComponent('Dimmer', S.SPR, { Type: 1 }); // 기본 그림을 Simple 로 두면 안 그려진다(실측)
ctr('Window', WIN, WIN);
S.image(b, 'Window', 'panel_window');

// 제목 띠: 띠 그림은 새 노드(TitleBand)가 맡고, 글자(NPC 이름 · 스크립트가 Text 대입)는 기존 TitleBar 가 띠 위에서 아이콘 오른쪽으로 치우쳐 쓴다.
img('Window/TitleBand', 'panel_title_bar', BAND, WIN);
img('Window/TitleBand/SparkleL', 'deco_sparkle', [488.5, 155, 18, 18], BAND);
img('Window/TitleBand/SparkleR', 'deco_sparkle', [693.5, 155, 18, 18], BAND);
flat('Window/TitleBand/LineL', [406.5, 163, 70, 2], BAND, C.gold, 0.5);
flat('Window/TitleBand/LineR', [723.5, 163, 70, 2], BAND, C.gold, 0.5);
// NPC 종류별 아이콘 3개(스크립트가 라우트에 따라 하나만 켠다)
img('Window/TitleBand/Icon_enhance', 'act_upgrade', [518.5, 147, 34, 34], BAND);
img('Window/TitleBand/Icon_craft', 'ico_sword', [518.5, 147, 34, 34], BAND, { enable: false });
img('Window/TitleBand/Icon_potion', 'ico_potion', [518.5, 147, 34, 34], BAND, { enable: false });
ctr('Window/TitleBar', [472, 143, 300, 42], WIN);
noBg('Window/TitleBar');
S.font(b, 'Window/TitleBar', { font: 'Maple', size: 30, color: C.title, h: 'center', v: 'middle', outline: false, shadow: true });

img('Window/Crest', 'deco_crest', [450, 58, 300, 88], WIN);

ctr('Window/BtnClose', [1018, 138, 52, 52], WIN);
S.button(b, 'Window/BtnClose', { normal: 'btn_close_default', hover: 'btn_close_hover' });
S.font(b, 'Window/BtnClose', { text: '' });

ctr('Window/Content', CNT, WIN);

// 바닥 띠(시안의 그라데이션 + 금 1px 테두리 배경은 생략 — 창 판 위에 그대로 얹는다)
const F = 'Window/Footer';
ctr(F, FOOT, WIN);
ctr(F + '/BtnPrimary', [800, 726.5, 260, 88], FOOT);
S.button(b, F + '/BtnPrimary', { normal: 'btn_cta_default', pressed: 'btn_cta_pressed', disabled: 'btn_cta_disabled' });
S.font(b, F + '/BtnPrimary', { font: 'Maple', size: 24, color: C.goldInk, h: 'center', v: 'middle', outline: false, text: '강화' });
// 안내 문장(안내 · 메시지 모드에서만 켠다) — 글자는 기존 CostLabel 이 맡는다
img(F + '/InfoIcon', 'icon_info', [140, 758.5, 24, 24], FOOT);
ctr(F + '/CostLabel', [172, 758, 560, 25], FOOT);
S.font(b, F + '/CostLabel', { font: 'Noto700', size: 18, color: C.sub, h: 'left', v: 'middle', outline: false, text: '강화할 장비를 고르세요' });
// 비용 칩 2개(고정 폭 300 · 안 칸은 고정 열): 아이콘 · 이름 · 필요 수 · 보유
[['ChipA', 140], ['ChipB', 450]].forEach(([name, x]) => {
  const P = F + '/' + name;
  const R = [x, 746.5, 300, 48];
  img(P, 'plate_dark', R, FOOT, { enable: false });
  img(P + '/Icon', 'icon_meso', [x + 8, 754.5, 32, 32], R);
  txt(P + '/Label', '메소', [x + 48, 758.5, 96, 28], R, { font: 'Noto700', size: 14, color: C.faint, h: 'left', overflow: 1 });
  txt(P + '/Num', '0', [x + 148, 753.5, 60, 28], R, { font: 'FootballB', size: 20, color: C.ivory, h: 'left' });
  txt(P + '/Hold', '', [x + 212, 758.5, 86, 28], R, { font: 'Noto700', size: 14, color: C.faint, h: 'left' });
});

// 수리 · 장비 상점 자리: 시안이 없다 → 창틀이 커진 만큼만 돌려 원래 자리(940x450 · 창 가운데에서 -18)에 둔다.
['Repair', 'ShopEquip'].forEach((n) => ctr('Window/Content/' + n, [0, 0, 940, 450], [0, 0, 940, 450], { pos: [0, 24] }));

// ═══════════════════════════════════════════════════════════
// 강화 (Content/Enhance)
// ═══════════════════════════════════════════════════════════
const E = 'Window/Content/Enhance';
S.place(b, E + '/ArrowText', { enable: false }); // 글자 화살표는 그림(Arrow)으로 대체 · 스크립트가 안 잡는다
img(E + '/Arrow', 'arrow_enhance', [294, 280, 60, 60], CNT);

// 강화할 장비 칸
const TS = [143, 242.5, 140, 140];
ctr(E + '/TargetSlot', TS, CNT);
S.image(b, E + '/TargetSlot', 'slot_frame');
noTransition(E + '/TargetSlot');
S.font(b, E + '/TargetSlot', { text: '' });
ctr(E + '/TargetSlot/Icon', [169, 268.5, 88, 88], TS);
ctr(E + '/TargetSlot/Text', [148, 324, 130, 23], TS);
S.font(b, E + '/TargetSlot/Text', { font: 'Noto700', size: 16, color: C.sub, h: 'center', v: 'middle', outline: false, text: '장비 선택' });
img(E + '/TargetSlot/EmptyFrame', 'slot_frame_empty', TS, TS);
img(E + '/TargetSlot/Plus', 'icon_plus', [193, 278, 40, 40], TS, { alpha: 0.75 });
for (let n = 1; n <= 3; n++) img(`${E}/TargetSlot/EnhBadge_${n}`, `badge_enh_${n}`, [237, 246.5, 42, 42], TS, { enable: false });
S.back(b, E + '/TargetSlot/EmptyFrame');
txt(E + '/TargetName', '-', [113, 390.5, 200, 30], CNT, { font: 'Maple', size: 18, color: C.faint, overflow: 1 });

// 강화 결과 칸
const RS = [365, 242.5, 140, 140];
ctr(E + '/ResultSlot', RS, CNT);
S.image(b, E + '/ResultSlot', 'slot_frame_hover');
ctr(E + '/ResultSlot/Icon', [391, 268.5, 88, 88], RS);
ctr(E + '/ResultSlot/Text', [370, 301, 130, 23], RS);
S.font(b, E + '/ResultSlot/Text', { font: 'Noto700', size: 16, color: C.off, h: 'center', v: 'middle', outline: false, text: '강화 후' });
img(E + '/ResultSlot/EmptyFrame', 'slot_frame_empty', RS, RS, { enable: false });
img(E + '/ResultSlot/MaxFrame', 'slot_frame', RS, RS, { enable: false });
img(E + '/ResultSlot/MaxShade', 'plate_dark', [371, 248.5, 128, 128], RS, { color: '#080C16', alpha: 0.45, enable: false });
img(E + '/ResultSlot/UpBadge', 'act_upgrade', [355, 232.5, 30, 30], RS, { enable: false });
for (let n = 1; n <= 3; n++) img(`${E}/ResultSlot/EnhBadge_${n}`, `badge_enh_${n}`, [459, 246.5, 42, 42], RS, { enable: false });
img(E + '/ResultSlot/MaxChip', 'chip_gold', [463.5, 228.5, 59.5, 30], RS, { enable: false });
txt(E + '/ResultSlot/MaxChip/Text', 'MAX', [0, 0, 59.5, 30], [0, 0, 59.5, 30], { font: 'Maple', size: 16, color: C.goldInk });
backAll([E + '/ResultSlot/EmptyFrame', E + '/ResultSlot/MaxFrame']);
txt(E + '/ResultName', '-', [335, 390.5, 200, 30], CNT, { font: 'Maple', size: 18, color: C.faint, overflow: 1 });

// 오를 능력치 판
const SP = [534, 220, 532, 212];
ctr(E + '/StatPreview', SP, CNT);
S.image(b, E + '/StatPreview', 'panel_inner');
ctr(E + '/StatPreview/PreviewTitle', [558, 238, 110, 28], SP);
S.font(b, E + '/StatPreview/PreviewTitle', { font: 'Maple', size: 18, color: C.title, h: 'left', v: 'middle', outline: false, text: '상승 능력치' });
txt(E + '/StatPreview/PreviewRange', '', [651, 240, 90, 24], SP, { font: 'FootballB', size: 14, color: C.faint, h: 'left' });
txt(E + '/StatPreview/PreviewDesc', '', [558, 264, 484, 24], SP, { font: 'Noto700', size: 14, color: C.ivory, h: 'left' });
for (let i = 0; i < 4; i++) {
  const RB = [558, 296 + 54 * i, 484, 46];
  const P = `${E}/StatPreview/PRow${i}`;
  ctr(P, RB, SP);
  const loc = [0, 0, 484, 46];
  img(P + '/Plate', 'plate_dark', loc, loc);
  img(P + '/Icon', 'icon_stat_attack', [12, 10, 26, 26], loc);
  ctr(P + '/Chip', [46, 0, 104, 46], loc);
  noBg(P + '/Chip');
  S.font(b, P + '/Chip', { font: 'Noto700', size: 18, color: C.sub, h: 'left', v: 'middle', outline: false });
  ctr(P + '/Cell', [150, 0, 326, 46], loc);
  noBg(P + '/Cell');
  S.font(b, P + '/Cell', { font: 'FootballB', size: 18, color: C.ivory, h: 'left', v: 'middle', outline: false });
  S.back(b, P + '/Plate');
}
txt(E + '/StatPreview/PreviewEmpty', '장비를 고르면 오를 능력치가 나와요', [558, 296, 484, 118], SP, { font: 'Noto700', size: 16, color: C.faint });
img(E + '/StatPreview/PreviewMaxChip', 'chip_gold', [770.5, 326, 59.5, 30], SP, { enable: false });
txt(E + '/StatPreview/PreviewMaxChip/Text', 'MAX', [0, 0, 59.5, 30], [0, 0, 59.5, 30], { font: 'Maple', size: 16, color: C.goldInk });
txt(E + '/StatPreview/PreviewMaxText', '더 오를 능력치가 없어요', [558, 366, 484, 28], SP, { font: 'Noto700', size: 16, color: C.faint, enable: false });

// 보석 넣는 곳
const GB = [134, 450, 932, 130];
ctr(E + '/GemBar', GB, CNT);
S.image(b, E + '/GemBar', 'panel_inner');
img(E + '/GemBar/GemTitleIcon', 'ico_gem', [156, 465, 28, 28], GB); // 그림은 런타임에 GemInfo 의 다이아 아이콘으로
txt(E + '/GemBar/GemTitle', '보석 넣는 곳', [190, 465, 196, 28], GB, { font: 'Maple', size: 18, color: C.title, h: 'left' });
ctr(E + '/GemBar/GemHint', [156, 499, 230, 41], GB);
S.font(b, E + '/GemBar/GemHint', { font: 'Noto500', size: 14, color: C.sub, h: 'left', v: 'top', outline: false, text: '넣은 보석이 오르는\n능력치를 정합니다' });
txt(E + '/GemBar/GemNeed', '', [156, 545.5, 230, 22], GB, { font: 'Noto700', size: 14, color: C.green, h: 'left' });
for (let i = 0; i < 3; i++) {
  const GS = [400 + 114 * i, 465, 100, 100];
  const P = `${E}/GemBar/GemSlot_${i}`;
  ctr(P, GS, GB);
  S.image(b, P, 'slot_frame');
  noTransition(P);
  S.font(b, P, { text: '' });
  ctr(P + '/Icon', [GS[0] + 20, GS[1] + 20, 60, 60], GS);
  ctr(P + '/Text', [GS[0], GS[1] + 78, 100, 22], GS);
  S.font(b, P + '/Text', { font: 'Noto700', size: 13, color: C.sub, h: 'center', v: 'middle', outline: false, text: '' });
  img(P + '/EmptyFrame', 'slot_frame_empty', GS, GS, { enable: false });
  img(P + '/DisFrame', 'slot_frame_disabled', GS, GS, { alpha: 0.7, enable: false });
  img(P + '/Plus', 'icon_plus', [GS[0] + 33, GS[1] + 23, 34, 34], GS, { enable: false });
  flat(P + '/Dash', [GS[0] + 37, GS[1] + 37.5, 26, 3], GS, '#6B7896', 1, false);
  backAll([P + '/EmptyFrame', P + '/DisFrame']);
}
// 자동 채우기(시안 #36 제안 · 새 기능이라 이번 단계에서는 자리만 만들고 꺼 둔다)
newBtn(E + '/GemBar/AutoFill', '자동 채우기', [894, 493, 150, 44], GB, { normal: 'btn_blue_default_sm', pressed: 'btn_blue_pressed', disabled: 'btn_blue_disabled_sm' }, { font: 'Maple', size: 16, color: C.ivory }, false);

// 성공 확률
const RR = [134, 598, 932, 54];
ctr(E + '/RateRow', RR, CNT);
img(E + '/RateRow/Plate', 'plate_dark', RR, RR);
ctr(E + '/RateRow/RateLabel', [154, 612.5, 100, 25], RR);
S.font(b, E + '/RateRow/RateLabel', { font: 'Noto700', size: 18, color: C.sub, h: 'left', v: 'middle', outline: false });
img(E + '/RateRow/Gauge', 'gauge_track', [237.5, 615, 714.5, 20], RR);
// 채움은 Filled 가로 · 왼쪽에서 시작. 트랙 안쪽 폭 682.5
S.newImage(b, E + '/RateRow/Gauge/Fill', 'gauge_fill_gold', { anchor: 'middle-left', pivot: [0, 0.5], pos: [16, 0], size: [682.5, 8], type: 3 });
// 🔴 "100%" 는 게임 글꼴(Football 30)에선 폭 82 에 안 들어가 "%" 가 둘째 줄로 꺾인다(2차 묶음 실측) → 오른쪽 끝(1046)은 그대로 두고 왼쪽으로 넓힌다
ctr(E + '/RateRow/RateValue', [926, 604, 120, 42], RR);
S.font(b, E + '/RateRow/RateValue', { font: 'FootballB', size: 30, color: C.gold, h: 'right', v: 'middle', outline: false });
S.back(b, E + '/RateRow/Plate');

// 결과 문구 줄 (성공 = 금색 배찌체 + 양옆 반짝이 · 실패 = 빨강 + 경고 · 진행 = 회색)
ctr(E + '/StatusText', [134, 670, 932, 34], CNT);
S.font(b, E + '/StatusText', { font: 'Noto700', size: 18, color: C.sub, h: 'center', v: 'middle', outline: false });
img(E + '/StatusSparkleL', 'deco_sparkle', [457, 676, 22, 22], CNT, { enable: false });
img(E + '/StatusSparkleR', 'deco_sparkle', [721, 676, 22, 22], CNT, { enable: false });
img(E + '/StatusWarn', 'icon_warn', [457, 676, 22, 22], CNT, { enable: false });

// ═══════════════════════════════════════════════════════════
// 강화 장비 고르기 (Content/EnhancePick)
// ═══════════════════════════════════════════════════════════
const P1 = 'Window/Content/EnhancePick';
img(P1 + '/ListPane', 'panel_inner', [134, 274, 932, 460], CNT);
img(P1 + '/TitleIcon', 'ico_shield', [134, 220.5, 26, 26], CNT);
ctr(P1 + '/PickTitle', [170, 219.5, 200, 28], CNT);
S.font(b, P1 + '/PickTitle', { font: 'Maple', size: 20, color: C.title, h: 'left', v: 'middle', outline: false, text: '강화할 장비 선택' });
img(P1 + '/LegendChip', 'chip_blue', [957.5, 223, 48, 22], CNT);
txt(P1 + '/LegendChip/Text', '착용', [0, 0, 48, 22], [0, 0, 48, 22], { font: 'Noto700', size: 13, color: C.white });
txt(P1 + '/LegendText', '= 착용 중', [1010, 223, 76, 22], CNT, { font: 'Noto700', size: 14, color: C.faint, h: 'left' });
img(P1 + '/NoteIcon', 'icon_info', [156, 692, 22, 22], CNT);
txt(P1 + '/NoteText', '착용 중인 장비도 강화할 수 있어요 · 인벤토리에 있는 장비가 모두 나와요', [182, 692, 862, 24], CNT, { font: 'Noto700', size: 14, color: C.faint, h: 'left' });
txt(P1 + '/EmptyText', '강화할 장비가 없어요', [134, 274, 932, 460], CNT, { font: 'Noto700', size: 18, color: C.sub, enable: false });
// 목록: 칸 110 · 가로 24 · 세로 40(이름 줄 자리 · 시안에 둘째 줄이 없어 간격은 추정)
ctr(P1 + '/PickGrid', [161, 296, 780, 390], CNT);
b.patchComponent(P1 + '/PickGrid', GRID, { CellSize: { x: 110, y: 110 }, FixedCount: 6, FixedType: 0, Spacing: { x: 24, y: 40 }, Padding: zero4, ScrollBarThickness: 10, ScrollBarHandleColor: S.C(C.gold, 0.9) });
S.place(b, P1 + '/PickTemplate', { size: [110, 110] });
S.button(b, P1 + '/PickTemplate', { normal: 'slot_frame', hover: 'slot_frame_hover', pressed: 'slot_frame_hover' });
S.font(b, P1 + '/PickTemplate', { text: '' });
const PT = [0, 0, 110, 110];
ctr(P1 + '/PickTemplate/Icon', [18, 18, 74, 74], PT);
// 🔴 이름 상자가 칸(110)보다 넓으면 첫 열 칸의 이름이 그리드 왼쪽 경계에서 잘린다(2차 묶음 실측 · "갈색 고급 가죽 모자 +3") → 칸 폭 그대로(넘치면 말줄임)
ctr(P1 + '/PickTemplate/Name', [0, 112, 110, 26], PT);
S.font(b, P1 + '/PickTemplate/Name', { font: 'Noto700', size: 14, color: C.ivory, h: 'center', v: 'middle', outline: false, overflow: 0, text: '' });
bestFit(P1 + '/PickTemplate/Name', 14);
for (let n = 1; n <= 3; n++) img(`${P1}/PickTemplate/EnhBadge_${n}`, `badge_enh_${n}`, [74, 2, 34, 34], PT, { enable: false });
img(P1 + '/PickTemplate/EquipChip', 'chip_blue', [3, 4, 48, 22], PT, { enable: false });
txt(P1 + '/PickTemplate/EquipChip/Text', '착용', [0, 0, 48, 22], [0, 0, 48, 22], { font: 'Noto700', size: 13, color: C.white });
// 뒤로 버튼: 글자 "뒤로" 는 아이콘 오른쪽으로 치우쳐서 자식 Label 이 쓴다
function backButton(root) {
  ctr(root + '/BtnBack', [490, 750, 220, 62], CNT);
  S.button(b, root + '/BtnBack', { normal: 'btn_blue_default', hover: 'btn_blue_hover', pressed: 'btn_blue_pressed', disabled: 'btn_blue_disabled' });
  S.font(b, root + '/BtnBack', { text: '' });
  const BR = [490, 750, 220, 62];
  img(root + '/BtnBack/BackIcon', 'icon_back', [558, 766, 30, 30], BR);
  txt(root + '/BtnBack/Label', '뒤로', [590, 764, 60, 34], BR, { font: 'Maple', size: 24, color: C.ivory });
}
backButton(P1);
backAll([P1 + '/ListPane']);

// ═══════════════════════════════════════════════════════════
// 보석 고르기 (Content/EnhanceGemPick)
// ═══════════════════════════════════════════════════════════
const G = 'Window/Content/EnhanceGemPick';
img(G + '/TitleIcon', 'ico_gem', [134, 220.5, 26, 26], CNT);
ctr(G + '/PickTitle', [170, 219.5, 200, 28], CNT);
S.font(b, G + '/PickTitle', { font: 'Maple', size: 20, color: C.title, h: 'left', v: 'middle', outline: false, text: '보석 선택' });
// 🔴 게임 글꼴에선 Legend2 가 왼쪽으로 번져 Legend1 과 붙어 "흐리게이 장비에" 로 읽힌다(2차 묶음 실측) → Legend1 을 왼쪽으로 14 옮겨 사이를 벌린다
txt(G + '/Legend1', '보유 0 = 흐리게', [726, 223.5, 138.5, 22], CNT, { font: 'Noto700', size: 14, color: C.faint, h: 'right' });
txt(G + '/Legend2', '이 장비에 효과 없음 = 회색 칩', [880, 223.5, 186, 22], CNT, { font: 'Noto700', size: 14, color: C.faint, h: 'right' });
backButton(G);
const GEM_ORDER = [
  ['DIAMOND', 'AQUAMARINE', 'AMETHYST', 'SAPPHIRE', 'GARNET', 'OPAL'],
  ['TOPAZ', 'EMERALD', 'STR_CRYSTAL', 'DEX_CRYSTAL', 'LUK_CRYSTAL', 'INT_CRYSTAL'],
];
GEM_ORDER.forEach((names, row) => names.forEach((id, col) => {
  const SB = [134 + 157 * col, 272 + 186 * row, 147, 176];
  const P = `${G}/Slot_${id}`;
  ctr(P, SB, CNT);
  S.button(b, P, { normal: 'panel_row', hover: 'panel_row_hover', pressed: 'panel_row_hover', disabled: 'panel_row' });
  S.font(b, P, { text: '' });
  const L = [0, 0, 147, 176];
  ctr(P + '/Icon', [42.5, 16, 62, 62], L);
  ctr(P + '/Name', [3.5, 82, 140, 26], L);
  S.font(b, P + '/Name', { font: 'Noto700', size: 14, color: C.ivory, h: 'center', v: 'middle', outline: false, overflow: 0 });
  bestFit(P + '/Name', 14);
  ctr(P + '/StatLabel', [8.5, 104.5, 130, 26], L);
  S.font(b, P + '/StatLabel', { font: 'Noto700', size: 14, color: C.green, h: 'center', v: 'middle', outline: false, overflow: 1 });
  ctr(P + '/Count', [23.5, 128, 100, 26], L);
  S.font(b, P + '/Count', { font: 'Noto700', size: 14, color: C.faint, h: 'center', v: 'middle', outline: false });
  img(P + '/BgZero', 'slot_frame_disabled', L, L, { enable: false });
  img(P + '/BgLocked', 'panel_row_locked', L, L, { enable: false });
  img(P + '/NoFx', 'chip_gray_dark', [5.5, 105, 136, 24], L, { enable: false });
  txt(P + '/NoFx/Text', '', [0, 0, 136, 24], [0, 0, 136, 24], { font: 'Noto700', size: 13, color: '#C9D2E3', overflow: 1 });
  backAll([P + '/BgZero', P + '/BgLocked']);
}));

// ═══════════════════════════════════════════════════════════
// 제작 (Content/Craft) — 직업 분류 5개 · 부위 분류 7개(10/1 사용자 지시로 남김) · 카드 목록 · 상세
// ═══════════════════════════════════════════════════════════
const CR = 'Window/Content/Craft';
// 직업 분류: 시안 위치 그대로(111x40 · 목록 폭 586)
const JOBS = [['WARRIOR', '전사', 134, 'job_warrior'], ['MAGICIAN', '마법사', 253, 'job_magician'], ['ARCHER', '궁수', 371.5, 'job_archer'], ['THIEF', '도적', 490.5, 'job_thief'], ['PIRATE', '해적', 609, 'job_pirate']];
JOBS.forEach(([id, label, x, icon]) => {
  const JR = [x, 218, 111, 40];
  const P = `${CR}/Job_${id}`;
  ctr(P, JR, CNT);
  S.image(b, P, 'chip_blue_dark');
  noTransition(P);
  S.font(b, P, { text: '' });
  const L = [0, 0, 111, 40];
  img(P + '/On', 'chip_gold', L, L, { enable: false });
  img(P + '/Icon', icon, [26.5, 9, 22, 22], L);
  txt(P + '/Label', label, [48, 0, 60, 40], L, { font: 'Noto700', size: 16, color: C.ivory });
  S.back(b, P + '/On');
});
// 부위 분류: 시안에 없다 → 직업 분류 바로 아래 한 줄(26 높이)에 두고 목록 판을 그만큼 낮춘다.
const PARTS = [['ALL', '전체'], ['WEAPON', '무기'], ['HAT', '모자'], ['CLOTH', '옷'], ['GLOVES', '장갑'], ['SHOES', '신발'], ['SPECIAL', '특수']];
PARTS.forEach(([id, label], i) => {
  const PR = [134 + 85 * i, 264, 76, 26];
  const P = `${CR}/Slot_${id}`;
  ctr(P, PR, CNT);
  S.image(b, P, 'chip_blue_dark_sm');
  noTransition(P);
  S.font(b, P, { text: '' });
  const L = [0, 0, 76, 26];
  img(P + '/On', 'chip_gold_sm', L, L, { enable: false });
  txt(P + '/Label', label, L, L, { font: 'Noto700', size: 14, color: C.ivory });
  S.back(b, P + '/On');
});
img(CR + '/ListPane', 'panel_inner', [134, 296, 586, 404], CNT);
// 카드 3열: 174 · 가로 10 · 세로 10. 부위 분류 줄 때문에 카드 높이는 시안 128 → 118 (3줄이 한 번에 보이게)
ctr(CR + '/Grid', [148, 310, 542, 376], CNT);
b.patchComponent(CR + '/Grid', GRID, { CellSize: { x: 174, y: 118 }, FixedCount: 3, FixedType: 0, Spacing: { x: 10, y: 10 }, Padding: zero4, ScrollBarThickness: 10, ScrollBarHandleColor: S.C(C.gold, 0.9) });
const CW = 174, CH = 118;
S.place(b, CR + '/CardTemplate', { size: [CW, CH] });
S.button(b, CR + '/CardTemplate', { normal: 'panel_row', hover: 'panel_row_hover', pressed: 'panel_row_hover' });
S.font(b, CR + '/CardTemplate', { text: '' });
const CB = [0, 0, CW, CH];
img(CR + '/CardTemplate/Sel', 'panel_row_selected', CB, CB, { enable: false });
ctr(CR + '/CardTemplate/Icon', [65, 20, 44, 44], CB);
ctr(CR + '/CardTemplate/Name', [3, 65, 168, 26], CB);
S.font(b, CR + '/CardTemplate/Name', { font: 'Noto700', size: 16, color: C.ivory, h: 'center', v: 'middle', outline: false, overflow: 0 });
bestFit(CR + '/CardTemplate/Name', 16);
// 직업 태그: 직업별 색 칩 6장 중 하나만 켠다 · 글자(Job)는 그 위
const JR2 = [86, 10, 72, 22];
box(CR + '/CardTemplate/JobChip', JR2, CB);
const JOB_CHIP = [['WARRIOR', 'chip_red'], ['MAGICIAN', 'chip_blue'], ['ARCHER', 'chip_green'], ['THIEF', 'chip_gold_dark'], ['PIRATE', 'chip_blue_dark_sm'], ['ALL', 'chip_gray_dark']];
JOB_CHIP.forEach(([id, key]) => img(`${CR}/CardTemplate/JobChip/Bg_${id}`, key, [0, 0, 72, 22], [0, 0, 72, 22], { enable: false }));
ctr(CR + '/CardTemplate/Job', JR2, CB);
S.font(b, CR + '/CardTemplate/Job', { font: 'Noto700', size: 13, color: C.white, h: 'center', v: 'middle', outline: false, text: '' });
S.before(b, CR + '/CardTemplate/JobChip', CR + '/CardTemplate/Job');
// 교환 배지
img(CR + '/CardTemplate/ExchBadge', 'chip_gold', [18, 10, 44, 22], CB, { enable: false });
txt(CR + '/CardTemplate/ExchBadge/Text', '교환', [0, 0, 44, 22], [0, 0, 44, 22], { font: 'Maple', size: 13, color: '#1B1030' });
// 값 줄: 재료 아이콘 · 수 · 점 · 메소 아이콘 · 수 (스크립트가 1개/2개 모양으로 자리를 바꾼다 · 기존 Price 글자는 끈다)
S.place(b, CR + '/CardTemplate/Price', { enable: false });
priceRow(CR + '/CardTemplate', CB);
backAll([CR + '/CardTemplate/Sel']);
function priceRow(root, cb) {
  // 2개 모양(기본): 재료 아이콘 중심 -52 · 수 왼쪽 -36 · 점 -7 · 메소 아이콘 +9 · 수 왼쪽 +25 (카드 가운데 기준)
  const cx = cb[2] / 2, y = cb[3] - 27; // 값 줄 위 가장자리(아래에서 27)
  img(root + '/P1Icon', 'icon_info', [cx - 62, y, 20, 20], cb);
  txt(root + '/P1Num', '', [cx - 36, y - 1, 34, 22], cb, { font: 'FootballB', size: 14, color: C.gold, h: 'left' });
  txt(root + '/PDot', '·', [cx - 12, y - 1, 10, 22], cb, { font: 'Noto700', size: 14, color: C.off });
  img(root + '/P2Icon', 'icon_meso', [cx - 1, y, 20, 20], cb);
  txt(root + '/P2Num', '', [cx + 25, y - 1, 50, 22], cb, { font: 'FootballB', size: 14, color: C.gold, h: 'left' });
}

// 제작 상세
const DT = [736, 218, 330, 482];
ctr(CR + '/Detail', DT, CNT);
S.image(b, CR + '/Detail', 'panel_inner');
detailEmpty(CR + '/Detail', '왼쪽에서 장비를 고르세요', '고르면 능력치와 재료가 여기 나와요');
function detailEmpty(root, title, sub) {
  ctr(root + '/Empty', [741, 462.5, 320, 25], DT);
  S.font(b, root + '/Empty', { font: 'Noto700', size: 18, color: C.sub, h: 'center', v: 'middle', outline: false, text: title });
  img(root + '/EmptyArrow', 'icon_arrow_left', [875, 398.5, 52, 52], DT, { alpha: 0.9 });
  txt(root + '/EmptySub', sub, [796.5, 500, 209, 22], DT, { font: 'Noto400', size: 14, color: C.faint });
}
img(CR + '/Detail/Frame', 'slot_frame', [754, 238.5, 84, 84], DT, { enable: false });
ctr(CR + '/Detail/Icon', [765, 249.5, 62, 62], DT);
ctr(CR + '/Detail/Name', [852, 267, 196, 34], DT);
S.font(b, CR + '/Detail/Name', { font: 'Maple', size: 24, color: C.ivory, h: 'left', v: 'bottom', outline: false, overflow: 0 });
bestFit(CR + '/Detail/Name', 24);
S.place(b, CR + '/Detail/Req', { enable: false }); // 요구 조건은 칩(ReqChip) + 글(ReqText) 두 조각으로 — FillItemView 에는 reqT 를 안 넘긴다
const RC = [852, 305, 54, 22];
box(CR + '/Detail/ReqChip', RC, DT, { enable: false });
JOB_CHIP.forEach(([id, key]) => img(`${CR}/Detail/ReqChip/Bg_${id}`, key, [0, 0, 54, 22], [0, 0, 54, 22], { enable: false }));
txt(CR + '/Detail/ReqChip/Label', '', [0, 0, 54, 22], [0, 0, 54, 22], { font: 'Noto700', size: 13, color: C.white });
txt(CR + '/Detail/ReqText', '', [912, 305, 140, 22], DT, { font: 'Noto700', size: 14, color: C.faint, h: 'left', enable: false });
// 능력치 줄 5개(인벤토리 툴팁과 같은 FillItemView 가 Chip · Cell 글자를 쓴다)
const SL = [754, 336.5, 294, 210];
ctr(CR + '/Detail/StatList', SL, DT);
for (let i = 0; i < 5; i++) {
  const RB = [754, 336.5 + 54 * i, 294, 46];
  const P = `${CR}/Detail/StatList/Row${i}`;
  ctr(P, RB, SL);
  S.image(b, P, 'plate_dark');
  const loc = [0, 0, 294, 46];
  img(P + '/Icon', 'icon_stat_attack', [12, 10, 26, 26], loc);
  ctr(P + '/Chip', [46, 0, 104, 46], loc);
  noBg(P + '/Chip');
  S.font(b, P + '/Chip', { font: 'Noto700', size: 18, color: C.sub, h: 'left', v: 'middle', outline: false });
  ctr(P + '/Cell', [150, 0, 136, 46], loc);
  noBg(P + '/Cell');
  S.font(b, P + '/Cell', { font: 'FootballB', size: 18, color: C.ivory, h: 'left', v: 'middle', outline: false });
}
// 재료 제목 · 구분선 · 재료 줄 2개(아래에서부터 쌓인다 · 스크립트가 줄 수로 y 를 정한다)
const MT = [754, 545.5, 294, 22.5];
ctr(CR + '/Detail/MatTitle', MT, DT);
S.font(b, CR + '/Detail/MatTitle', { font: 'Maple', size: 16, color: C.title, h: 'left', v: 'middle', outline: false, text: '재료 · 비용' });
txt(CR + '/Detail/MatTitle/MatHint', '보유 / 필요', [835, 548.5, 80, 22], MT, { font: 'Noto700', size: 13, color: C.faint, h: 'left' });
img(CR + '/Detail/MatTitle/MatDivider', 'deco_divider', [905, 550, 143, 14], MT);
for (let i = 0; i < 2; i++) {
  const MR = [754, 578 + 58 * i, 294, 48];
  const P = `${CR}/Detail/Mat${i}`;
  ctr(P, MR, DT);
  S.image(b, P, 'plate_dark');
  const loc = [0, 0, 294, 48];
  img(P + '/Icon', 'icon_meso', [8, 9, 30, 30], loc);
  ctr(P + '/Chip', [46, 9, 100, 30], loc);
  noBg(P + '/Chip');
  S.font(b, P + '/Chip', { font: 'Noto700', size: 16, color: C.sub, h: 'left', v: 'middle', outline: false, overflow: 1 });
  ctr(P + '/Cell', [144, 9, 136, 30], loc);
  noBg(P + '/Cell');
  S.font(b, P + '/Cell', { font: 'FootballB', size: 16, color: C.ivory, h: 'right', v: 'middle', outline: false });
}
S.back(b, CR + '/Detail/Frame');
backAll([CR + '/ListPane']);

// ═══════════════════════════════════════════════════════════
// 물약 (Content/Potion)
// ═══════════════════════════════════════════════════════════
const PO = 'Window/Content/Potion';
img(PO + '/ListPane', 'panel_inner', [134, 218, 586, 482], CNT);
ctr(PO + '/Grid', [148, 232, 558, 450], CNT);
b.patchComponent(PO + '/Grid', GRID, { CellSize: { x: 180, y: 150 }, FixedCount: 3, FixedType: 0, Spacing: { x: 9, y: 10 }, Padding: zero4, ScrollBarThickness: 10, ScrollBarHandleColor: S.C(C.gold, 0.9) });
S.place(b, PO + '/CardTemplate', { size: [180, 150] });
S.button(b, PO + '/CardTemplate', { normal: 'panel_row', hover: 'panel_row_hover', pressed: 'panel_row_hover' });
S.font(b, PO + '/CardTemplate', { text: '' });
const PB = [0, 0, 180, 150];
img(PO + '/CardTemplate/Sel', 'panel_row_selected', PB, PB, { enable: false });
ctr(PO + '/CardTemplate/Icon', [61, 18, 58, 58], PB);
ctr(PO + '/CardTemplate/Name', [4, 80, 172, 26], PB);
S.font(b, PO + '/CardTemplate/Name', { font: 'Noto700', size: 16, color: C.ivory, h: 'center', v: 'middle', outline: false, overflow: 0 });
bestFit(PO + '/CardTemplate/Name', 16);
S.place(b, PO + '/CardTemplate/Price', { enable: false });
S.place(b, PO + '/CardTemplate/Job', { enable: false }); // 물약 카드에는 직업 태그가 없다
img(PO + '/CardTemplate/MesoIcon', 'icon_meso', [58, 106.5, 20, 20], PB);
txt(PO + '/CardTemplate/MesoNum', '', [84, 105.5, 60, 22], PB, { font: 'FootballB', size: 14, color: C.gold, h: 'left' });
backAll([PO + '/CardTemplate/Sel']);
txt(PO + '/NoticeBox', '이 상인은 2종만 팔아요\n큰 마을 상인은 더 많은 물약을 팔아요', [148, 536, 558, 150], CNT, { font: 'Noto700', size: 14, color: C.off, enable: false });
ctr(PO + '/Detail', DT, CNT);
S.image(b, PO + '/Detail', 'panel_inner');
detailEmpty(PO + '/Detail', '왼쪽에서 물약을 고르세요', '고르면 효과와 수량이 여기 나와요');
img(PO + '/Detail/Frame', 'slot_frame', [855, 236, 92, 92], DT, { enable: false });
ctr(PO + '/Detail/Icon', [868, 249, 66, 66], DT);
ctr(PO + '/Detail/Name', [751, 342, 300, 34], DT);
S.font(b, PO + '/Detail/Name', { font: 'Maple', size: 24, color: C.ivory, h: 'center', v: 'middle', outline: false, overflow: 0 });
bestFit(PO + '/Detail/Name', 24);
ctr(PO + '/Detail/Desc', [751, 377.5, 300, 24], DT);
S.font(b, PO + '/Detail/Desc', { font: 'FootballB', size: 16, color: C.green, h: 'center', v: 'middle', outline: false });
[['BtnMinus', 772, 'icon_minus'], ['BtnPlus', 966, 'icon_plus']].forEach(([n, x, icon]) => {
  const BR = [x, 414, 64, 60];
  ctr(PO + '/Detail/' + n, BR, DT);
  S.button(b, PO + '/Detail/' + n, { normal: 'btn_blue_default', hover: 'btn_blue_hover', pressed: 'btn_blue_pressed', disabled: 'btn_blue_disabled' });
  S.font(b, PO + '/Detail/' + n, { text: '' });
  img(PO + '/Detail/' + n + '/Icon', icon, [x + 18, 430, 28, 28], BR);
});
img(PO + '/Detail/QtyPlate', 'plate_dark', [846, 414, 110, 60], DT);
ctr(PO + '/Detail/QtyText', [846, 414, 110, 60], DT);
S.font(b, PO + '/Detail/QtyText', { font: 'FootballB', size: 30, color: C.ivory, h: 'center', v: 'middle', outline: false });
S.before(b, PO + '/Detail/QtyPlate', PO + '/Detail/QtyText');
txt(PO + '/Detail/QtyHint', '1 ~ 99개', [851, 488, 100, 22], DT, { font: 'Noto700', size: 14, color: C.faint });
// 총액 줄: 총 · 메소 아이콘 · 금색 큰 숫자 · 메소 (스크립트가 숫자 자릿수로 가운데 맞춘다)
txt(PO + '/Detail/TotalLabel', '총', [808.5, 626, 26, 24], DT, { font: 'Noto700', size: 16, color: C.sub });
img(PO + '/Detail/TotalIcon', 'icon_meso', [835.5, 623.5, 28, 28], DT);
ctr(PO + '/Detail/TotalText', [871.5, 616.5, 84, 42], DT);
S.font(b, PO + '/Detail/TotalText', { font: 'FootballB', size: 30, color: C.gold, h: 'left', v: 'middle', outline: false });
txt(PO + '/Detail/TotalUnit', '메소', [960, 626, 44, 24], DT, { font: 'Noto700', size: 16, color: C.sub, h: 'left' });
ctr(PO + '/Detail/HaveText', [754, 662.5, 294, 20], DT);
S.font(b, PO + '/Detail/HaveText', { font: 'Noto700', size: 14, color: C.faint, h: 'center', v: 'middle', outline: false });
S.back(b, PO + '/Detail/Frame');
backAll([PO + '/ListPane']);

// ═══════════════════════════════════════════════════════════
// 그리기 순서: 문장 < 제목 띠 < 제목 글자 (시안도 띠가 문장 밑자락을 덮는다)
// ═══════════════════════════════════════════════════════════
S.before(b, 'Window/TitleBand', 'Window/TitleBar');
S.before(b, 'Window/Crest', 'Window/TitleBand');

b.write(path.join(WORLD, 'ui', 'VillageWorkshopGroup.ui'), { lint_verbose: !!process.env.LINT_V });
console.log(`VillageWorkshopGroup(공방) 적용 끝 — 새 엔티티 ${b.listEntities().length - before}개`);
