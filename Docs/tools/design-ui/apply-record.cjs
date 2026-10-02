// 마을 기록 창(VillageRecordGroup)에 디자이너 시안(11-record)을 입힌다 — 몬스터 도감 · 마을 통계(생존자 목록 + 상세).
// 실행(월드 루트에서): node Docs/tools/design-ui/apply-record.cjs
// 다시 돌려도 같은 결과가 나온다. 기존 엔티티는 지우지 않고 이름도 안 바꾼다(스크립트가 UUID · 이름으로 잡는다).
// 글자 · 칸 상태는 Npc/VillageRecordUIController.mlua 가 채운다(이름 경로로 찾는다 · 아래 이름을 바꾸면 안 된다).
//
// 그림 상태(칸 · 줄 · 버튼)는 스프라이트를 갈아 끼우지 않고 "겹쳐 깔아 둔 그림을 켜고 끄는" 방식이다
//   - 🔴 글자가 있는 부모에 자식 그림을 얹으면 글자를 덮는다 → 덮는 그림(Sel · Locked …)은 S.back 으로 형제 중 맨 뒤.
// 기획 결정(사용자 지시): 미해금 칸은 지금처럼 그림을 어둡게만(물음표 실루엣 없음) · 영문 이름 줄 없음 · 스크롤바는 GridView 기본 것에 그림만 ·
//   통계에 "전선 비공개" 없음 · 장비 줄은 B안(Gear 한 글자 줄 · 라벨만 회색 태그).
const path = require('path');
const S = require('./skin.cjs');
const WORLD = path.resolve(__dirname, '..', '..', '..');
const b = S.open(WORLD, 'VillageRecordGroup');
const before = b.listEntities().length;
const C = S.COLOR;
const GRID = 'MOD.Core.GridViewComponent';

// ── 시안 캔버스 좌표(왼쪽 위 기준 x,y,w,h · 1200x900 캔버스) ──
const WIN = [110, 110, 980, 720];
const CNT = [134, 218, 932, 596];
const FOOT = [114, 714, 972, 112];
const BAND = [210, 132, 780, 64];

const at = (r, parent) => S.at(r[0], r[1], r[2], r[3], parent);
const ctr = (p, r, parent, extra) => S.place(b, p, Object.assign({ anchor: 'middle-center', pivot: [0.5, 0.5], pos: at(r, parent), size: [r[2], r[3]] }, extra || {}));
const img = (p, key, r, parent, o) => S.newImage(b, p, key, Object.assign({ pos: at(r, parent), size: [r[2], r[3]] }, o || {}));
const txt = (p, text, r, parent, o) => S.newText(b, p, text, Object.assign({ pos: at(r, parent), rect: [r[2], r[3]] }, o || {}));
const box = (p, r, parent, o) => S.newBox(b, p, Object.assign({ pos: at(r, parent), size: [r[2], r[3]] }, o || {}));
const noBg = (p) => S.tint(b, p, C.white, 0);
const noTransition = (p) => b.patchComponent(p, S.BTN, { Transition: 0 });
const zero4 = { left: 0, right: 0, top: 0, bottom: 0 };
// 기존 글자 엔티티의 글꼴 · 자리를 한 번에
function lab(p, r, parent, fo) { ctr(p, r, parent); S.font(b, p, Object.assign({ outline: false, v: 'middle' }, fo)); }

// ═══════════════════════════════════════════════════════════
// 창틀: 화면 막 · 판 · 문장 · 제목 띠(+ 라우트별 장식) · 닫기 · 내용 자리 · 바닥 띠
// ═══════════════════════════════════════════════════════════
S.tint(b, 'Dimmer', C.veil, 0.6);
b.patchComponent('Dimmer', S.SPR, { Type: 1 }); // 기본 그림을 Simple 로 두면 안 그려진다(실측)
ctr('Window', WIN, WIN);
S.image(b, 'Window', 'panel_window');

// 제목 띠: 기존 TitleBar 가 띠 그림 + 글자. 글자는 가운데(시안은 묶음 전체 가운데라 글자가 22px 오른쪽) → 아이콘 · 반짝이를 글자 폭 기준으로 옮겨 흡수한다.
ctr('Window/TitleBar', BAND, WIN);
S.image(b, 'Window/TitleBar', 'panel_title_bar');
S.font(b, 'Window/TitleBar', { font: 'Maple', size: 30, color: C.title, h: 'center', v: 'middle', outline: false, shadow: true });
// 라우트별 장식(스크립트가 하나만 켠다): 글자 폭(시안 실측) 기준 · 몬스터 도감 146.5 / 마을 통계 119
function deco(name, icon, iconCx, sparkLCx, sparkRCx) {
  const P = 'Window/TitleBar/' + name;
  box(P, BAND, BAND);
  img(P + '/SparkleL', 'deco_sparkle', [600 + sparkLCx - 9, 155, 18, 18], BAND);
  img(P + '/Icon', icon, [600 + iconCx - 17, 147, 34, 34], BAND);
  img(P + '/SparkleR', 'deco_sparkle', [600 + sparkRCx - 9, 155, 18, 18], BAND);
}
deco('DecoCollection', 'ico_book', -100, -138, 94);
deco('DecoStats', 'ico_trophy', -87, -125, 81, true);
b.patch('Window/TitleBar/DecoStats', { enable: false });

// 문장: 제목 띠 뒤(맨 뒤)
img('Window/Crest', 'deco_crest', [450, 58, 300, 88], WIN);

ctr('Window/BtnClose', [1018, 138, 52, 52], WIN);
S.button(b, 'Window/BtnClose', { normal: 'btn_close_default', hover: 'btn_close_hover' });
S.font(b, 'Window/BtnClose', { text: '' });

ctr('Window/Content', CNT, WIN);
// 안쪽 두 컨테이너는 늘림 앵커로 Content 를 꽉 채운다 — 저장된 크기 값도 같이 맞춘다
S.place(b, 'Window/Content/Collection', { size: [CNT[2], CNT[3]] });
S.place(b, 'Window/Content/Stats', { size: [CNT[2], CNT[3]] });

// ═══════════════════════════════════════════════════════════
// 도감 (Content/Collection)
// ═══════════════════════════════════════════════════════════
const CO = 'Window/Content/Collection';
img(CO + '/CollPane', 'panel_inner', [134, 218, 932, 444], CNT);

// 목록: 6열 · 칸 139.5x134 · 가로 9.7 · 세로 10. 오른쪽 20px 은 스크롤바 자리(GridView 기본 스크롤바에 그림만).
const GR = [150, 234, 906, 422];
ctr(CO + '/CollGrid', GR, CNT);
b.patchComponent(CO + '/CollGrid', GRID, {
  CellSize: { x: 139.5, y: 134 }, FixedCount: 6, FixedType: 0, Spacing: { x: 9.7, y: 10 }, Padding: { left: 0, right: 20, top: 0, bottom: 0 },
  ScrollBarThickness: 16, ScrollBarVisible: 0,
  ScrollBarBackgroundImageRUID: { DataId: S.R('scroll_track') }, ScrollBarHandleImageRUID: { DataId: S.R('scroll_thumb') },
  ScrollBarBackgroundColor: S.C(C.white, 1), ScrollBarHandleColor: S.C(C.white, 1),
});

// 칸 템플릿(복제 1개만 고치면 된다): 기본 판 + 겹쳐 둔 덮개(Sel 고름 · Locked 잠김) · 그림 틀 · 이름 · 눈금 5칸 + 배율 / 잠김 줄
{
  const T = CO + '/CollTemplate';
  const L = [0, 0, 139.5, 134];
  S.place(b, T, { size: [139.5, 134] });
  S.button(b, T, { normal: 'panel_row', hover: 'panel_row_hover', pressed: 'panel_row_hover' });
  img(T + '/Sel', 'panel_row_selected', L, L, { enable: false });
  img(T + '/Locked', 'panel_row_locked', L, L, { enable: false });
  img(T + '/Slot', 'slot_frame', [43.5, 9, 52, 52], L);
  img(T + '/SlotLocked', 'slot_frame_locked', [43.5, 9, 52, 52], L, { enable: false });
  ctr(T + '/Icon', [49.5, 15, 40, 40], L);
  S.tint(b, T + '/Icon', C.white, 1);
  img(T + '/LockBadge', 'badge_lock', [81.5, 1, 24, 22], L, { enable: false });
  lab(T + '/Name', [10, 63, 119.5, 16], L, { font: 'Noto700', size: 14, color: C.ivory, h: 'center', overflow: 1 });
  // 해금: 도감 레벨 5칸 눈금 + 금색 배율
  for (let k = 0; k < 5; k++) img(`${T}/Seg${k + 1}`, 'gauge_seg_off', [33 + 15 * k, 97, 13, 13], L);
  txt(T + '/Mul', '×1.0', [39.75, 111, 60, 18], L, { font: 'FootballB', size: 13, color: C.gold });
  // 잠김: 자물쇠 + "잠김 · Lv N"(기존 Sub 를 이 자리로)
  lab(T + '/Sub', [48, 97, 86, 18], L, { font: 'Noto700', size: 13, color: C.faint, h: 'left' });
  img(T + '/LockIcon', 'icon_lock', [30.5, 99, 14, 14], L, { enable: false });
  // 그리기 순서: 덮개 · 틀은 그림 · 글자 뒤(맨 뒤) — Locked 보다 Sel 이 앞
  S.before(b, T + '/Slot', T + '/Icon');
  S.before(b, T + '/SlotLocked', T + '/Icon');
  S.back(b, T + '/Sel');
  S.back(b, T + '/Locked'); // 순서 주의: 나중에 보낸 것이 더 뒤 → Locked 가 맨 뒤, Sel 이 그 앞(잠긴 칸을 골라도 금테가 보이게)
}

// 해금 진행: 받침 + "해금" + 숫자 + "/ 24" + 게이지 + 도움말
{
  const PP = [134, 672, 265.5, 42];
  const P = CO + '/ProgressPlate';
  img(P, 'plate_dark', PP, CNT);
  txt(P + '/Label', '해금', [148, 683, 34, 20], PP, { font: 'Noto700', size: 13, color: C.sub, h: 'left' }); // 26 폭 14 글자에서 "해 / 금" 으로 꺾였다(Play 확인 2026-10-01)
  txt(P + '/Count', '0', [174, 680.5, 26, 25], PP, { font: 'FootballB', size: 18, color: C.gold, h: 'right' });
  txt(P + '/Total', '/ 24', [204, 684.5, 34, 20], PP, { font: 'FootballB', size: 14, color: C.faint, h: 'left' });
  const TR = [235.5, 684, 150, 18];
  img(P + '/Track', 'gauge_track', TR, PP);
  // 채움: Filled 가로 · 왼쪽에서 시작. 트랙 안쪽 폭 118 (스크립트가 FillAmount)
  S.newImage(b, P + '/Track/Fill', 'gauge_fill_gold', { anchor: 'middle-left', pivot: [0, 0.5], pos: [16, 0], size: [118, 6], type: 3 });
  img(CO + '/HelpIcon', 'icon_help', [413.5, 681, 24, 24], CNT);
  lab(CO + '/CollStatus', [445, 681, 560, 24], CNT, { font: 'Noto700', size: 14, color: C.faint, h: 'left', text: '해금 = 모집 가능(Lv1) · 조련으로 Lv5까지' });
}

// ═══════════════════════════════════════════════════════════
// 도감 바닥 띠 (Footer): 해금 버튼 · 안내 · 고른 몬스터 · 비용
// ═══════════════════════════════════════════════════════════
const F = 'Window/Footer';
ctr(F, FOOT, WIN);
// 해금 버튼: 그림은 ButtonComponent 전환(켜짐 · 눌림 · 꺼짐). 글자 색은 스크립트가 켜짐/꺼짐에 맞춰 바꾼다.
const BTN = [800, 726.5, 260, 88];
ctr(F + '/BtnPrimary', BTN, FOOT);
S.button(b, F + '/BtnPrimary', { normal: 'btn_cta_default', pressed: 'btn_cta_pressed', disabled: 'btn_cta_disabled' });
S.font(b, F + '/BtnPrimary', { font: 'Maple', size: 24, color: C.goldInk, h: 'center', v: 'middle', outline: false, text: '해금' });
// "해금됨" 상태: 체크 + 글자(글자가 체크 오른쪽으로 치우쳐서 버튼 글자 대신 자식 글자를 쓴다)
img(F + '/BtnPrimary/CheckIcon', 'icon_check_ok', [879, 759, 28, 28], BTN, { enable: false });
txt(F + '/BtnPrimary/DoneLabel', '해금됨', [915, 756, 100, 34], BTN, { font: 'Maple', size: 24, color: '#E4E8EF', h: 'left', enable: false });

// 안 골랐을 때: 안내 + 보유 재화 칩
{
  const H = F + '/StateHint';
  box(H, FOOT, FOOT);
  img(H + '/HintIcon', 'icon_info', [140, 758.5, 24, 24], FOOT);
  txt(H + '/HintText', '몬스터를 고르면 필요한 재료가 나와요', [172, 758, 410, 25], FOOT, { font: 'Noto700', size: 18, color: C.sub, h: 'left' });
  // 🔴 칩 크기 규칙(5차 · skin.cjs): 재화 숫자는 네 자리("9,999" Football 18 · 49 → 칸 48)까지. 판 폭 = 8 + 아이콘 30 + 4 + 숫자 칸 + 8 + 아이콘 30 + 4 + 숫자 칸 + 14 = 190 (오른쪽 끝 784.5 고정).
  const HW = 8 + 30 + 4 + 48 + 8 + 30 + 4 + 48 + 14;
  const HP = [784.5 - HW, 746.5, HW, 48];
  img(H + '/HoldPlate', 'plate_dark', HP, FOOT);
  // 재화 그림 칸(지역재화 · 꿈의 조각)은 런타임에 원작 아이콘을 넣는다 — 칸 크기만 잡는다
  img(H + '/HoldPlate/GemIcon', 'icon_info_exp', [HP[0] + 8, 755.5, 30, 30], HP, { enable: false });
  txt(H + '/HoldPlate/GemNum', '0', [HP[0] + 42, 758, 48, 25], HP, { font: 'FootballB', size: 18, color: C.ivory, h: 'left' });
  img(H + '/HoldPlate/DreamIcon', 'icon_info_exp', [HP[0] + 98, 755.5, 30, 30], HP, { enable: false });
  txt(H + '/HoldPlate/DreamNum', '0', [HP[0] + 132, 758, 48, 25], HP, { font: 'FootballB', size: 18, color: C.ivory, h: 'left' });
}
// 고른 몬스터: 이름(한글만 · 영문 줄 없음) + 해금된 것 = 초록 요약(기존 CostLabel) / 안 된 것 = 해금 비용 칩
lab(F + '/CostLabel', [140, 774.5, 644, 18], FOOT, { font: 'Noto700', size: 14, color: C.green, h: 'left' });
txt(F + '/SelName', '', [140, 748.5, 180, 26], FOOT, { font: 'Maple', size: 20, color: C.ivory, h: 'left', overflow: 1, enable: false });
{
  const K = F + '/StateLocked';
  box(K, FOOT, FOOT, { enable: false });
  txt(K + '/CostCaption', '해금 비용', [140, 774.5, 173, 18], FOOT, { font: 'Noto700', size: 14, color: C.faint, h: 'left' });
  const CP = [325, 746.5, 233.5, 48];
  img(K + '/CostPlate', 'plate_dark', CP, FOOT);
  img(K + '/CostPlate/MatIcon', 'icon_info_exp', [333, 754.5, 32, 32], CP, { enable: false });
  txt(K + '/CostPlate/MatName', '재료', [373, 760.5, 82, 19.5], CP, { font: 'Noto700', size: 13, color: C.faint, h: 'left', overflow: 1 }); // "다이아몬드" 가 72 폭에서 "다이아몬…" 로 잘렸다
  txt(K + '/CostPlate/MatNum', '8', [459, 756.5, 24, 28], CP, { font: 'FootballB', size: 20, color: C.ivory, h: 'left' });
  txt(K + '/CostPlate/MatHave', '보유 0', [487, 760.5, 70, 19.5], CP, { font: 'Noto700', size: 14, color: C.faint, h: 'left' });
}

// ═══════════════════════════════════════════════════════════
// 통계 (Content/Stats): 생존자 판(목록) + 상세 판
// ═══════════════════════════════════════════════════════════
const ST = 'Window/Content/Stats';
const P1 = [134, 218, 458, 596];
const P2 = [608, 218, 458, 596];
const PP1 = ST + '/PlayerPanel';
const PD = ST + '/DetailPanel';
ctr(PP1, P1, CNT);
S.image(b, PP1, 'panel_inner');
ctr(PP1 + '/PlayerRoot', P1, P1);
ctr(PP1 + '/Title', [186, 233.5, 200, 28], P1);
S.font(b, PP1 + '/Title', { font: 'Maple', size: 20, color: C.title, h: 'left', v: 'middle', outline: false });
img(PP1 + '/HeaderIcon', 'ico_party', [150, 234.5, 26, 26], P1);
const CNB = S.chipWidth('chip_gray_dark', 19.5, S.textW('Noto700', 13, '0명 · 나 제외')); // 5차: 글자 실측 78.77 + 2 × (테두리 9 + 여백 4) = 106 · 오른쪽 끝 576 고정
img(PP1 + '/CountChip', 'chip_gray_dark', [576 - CNB, 238, CNB, 19.5], P1);
txt(PP1 + '/CountChip/Text', '0명 · 나 제외', [0, 0, CNB, 19.5], [0, 0, CNB, 19.5], { font: 'Noto700', size: 13, color: C.white });

// 생존자 줄(5개 미리 깔림 · 스크립트가 Enable): 기본 판 + 호버(ButtonComponent 전환) + 고름 덮개(Sel · 맨 뒤) · 이름 · 칭호 · 레벨 칩
for (let k = 0; k < 5; k++) {
  const R = [150, 280 + 74 * k, 426, 66];
  const L = [0, 0, 426, 66];
  const P = `${PP1}/PlayerRoot/PlayerRow_${k}`;
  ctr(P, R, P1);
  S.button(b, P, { normal: 'panel_row', hover: 'panel_row_hover', pressed: 'panel_row_hover' });
  S.font(b, P, { text: '' });
  img(P + '/Sel', 'panel_row_selected', L, L, { enable: false });
  // 칭호 없는 줄 = Name 한 줄 가운데 / 칭호 있는 줄 = TitleLine + NameT 두 줄(스크립트가 둘 중 하나만 켠다)
  lab(P + '/Name', [28, 22, 300, 21.5], L, { font: 'Noto700', size: 18, color: C.ivory, h: 'left', overflow: 1 });
  txt(P + '/TitleLine', '', [28, 14.5, 300, 15.5], L, { font: 'Noto700', size: 13, color: '#E8C77A', h: 'left', overflow: 1, enable: false });
  txt(P + '/NameT', '', [28, 30, 300, 21.5], L, { font: 'Noto700', size: 18, color: C.ivory, h: 'left', overflow: 1, enable: false });
  const LVB = S.roleBox('lvBadge'); // 5차: 레벨 배지 = 역할표 lvBadge2(62×21 · 월드맵과 같은 크기) · 오른쪽 끝 398 고정
  ctr(P + '/Level', [398 - LVB[0], 22.5, LVB[0], LVB[1]], L);
  S.image(b, P + '/Level', 'chip_blue_dark_sm');
  S.font(b, P + '/Level', { font: 'FootballB', size: 14, color: C.white, h: 'center', v: 'middle', outline: false });
  S.back(b, P + '/Sel');
}
// 빈 목록 안내(혼자 · 생존자 없음)
{
  const PE = [150, 280, 426, 520];
  box(PP1 + '/PlayerEmpty', PE, P1, { enable: false });
  img(PP1 + '/PlayerEmpty/Icon', 'ico_party', [345, 491.5, 36, 36], PE, { alpha: 0.6 });
  txt(PP1 + '/PlayerEmpty/Text1', '살아 있는 다른 참가자가 없어요', [218.25, 535.5, 290, 25], PE, { font: 'Noto700', size: 18, color: C.sub });
  txt(PP1 + '/PlayerEmpty/Text2', '혼자 남았거나 혼자 참가한 매치예요', [258.5, 569, 209, 19.5], PE, { font: 'Noto400', size: 14, color: C.faint });
}

// 상세 판
ctr(PD, P2, CNT);
S.image(b, PD, 'panel_inner');
ctr(PD + '/DetailRoot', P2, P2);
ctr(PD + '/Title', [660, 233.5, 200, 28], P2);
S.font(b, PD + '/Title', { font: 'Maple', size: 20, color: C.title, h: 'left', v: 'middle', outline: false });
img(PD + '/HeaderIcon', 'ico_user', [624, 234.5, 26, 26], P2);
{
  const D = PD + '/DetailRoot';
  // 모습: 액자(받침) + 기존 아바타. 시안용 무대 배경 그림은 게임 그림 자리라 안 쓴다(액자만).
  ctr(D + '/Avatar', [624, 282, 120, 146], P2);
  img(D + '/AvatarFrame', 'slot_frame', [624, 282, 120, 146], P2);
  // 장비: 받침 + 기존 Gear 글자(한 줄씩 · 부위 라벨만 회색 태그)
  img(D + '/GearPlate', 'plate_dark', [756, 282, 294, 146], P2);
  ctr(D + '/Gear', [766, 290, 274, 126], P2);
  S.font(b, D + '/Gear', { font: 'Noto700', size: 14, color: C.ivory, h: 'left', v: 'top', outline: false });
  b.patchComponent(D + '/Gear', S.TXT, { IsRichText: true });
  // 기록 6줄
  const ICONS = ['icon_title', 'icon_info_level', 'ico_home', 'ico_sword', 'ico_crown', 'ico_shield'];
  const VALUE_FONT = [
    { font: 'Noto700', size: 16 }, { font: 'FootballB', size: 16 }, { font: 'Noto700', size: 16 },
    { font: 'FootballB', size: 16 }, { font: 'Noto700', size: 16 }, { font: 'Noto700', size: 16 },
  ];
  for (let k = 0; k < 6; k++) {
    const R = [624, 438 + 46 * k, 426, 40];
    const L = [0, 0, 426, 40];
    const P = `${D}/DRow${k}`;
    ctr(P, R, P2);
    img(P + '/Plate', 'plate_dark', L, L);
    // 닉네임 줄의 아이콘은 그림 비율(150x72)을 지켜 22x10.5
    if (k === 0) img(P + '/Icon', ICONS[k], [10, 14.75, 22, 10.5], L); else img(P + '/Icon', ICONS[k], [10, 9, 22, 22], L);
    ctr(P + '/Chip', [40, 9, 96, 22], L);
    noBg(P + '/Chip');
    S.font(b, P + '/Chip', { font: 'Noto700', size: 14, color: C.sub, h: 'left', v: 'middle', outline: false });
    const vx = k === 0 ? 148 : 136;
    ctr(P + '/Cell', [vx, 9, 426 - vx - 4, 22.5], L);
    noBg(P + '/Cell');
    S.font(b, P + '/Cell', Object.assign({ color: C.ivory, h: 'left', v: 'middle', outline: false }, VALUE_FONT[k]));
    if (k === 0) {
      // 칭호가 있으면 닉네임 위에 작은 금빛 줄 + 닉네임(두 줄) — 스크립트가 Cell 대신 이 둘을 켠다
      txt(P + '/TitleLine', '', [148, 7, 270, 14.5], L, { font: 'Noto700', size: 13, color: '#E8C77A', h: 'left', overflow: 1, enable: false });
      txt(P + '/CellT', '', [148, 21.5, 270, 17.5], L, { font: 'Noto700', size: 16, color: C.ivory, h: 'left', overflow: 1, enable: false });
    }
    S.back(b, P + '/Plate');
  }
  // 안 골랐을 때 · 생존자 없음 안내(DetailRoot 는 이때 끈다)
  box(PD + '/DetailEmpty', P2, P2, { enable: false });
  img(PD + '/DetailEmpty/Icon', 'icon_arrow_left', [813, 484.5, 48, 48], P2, { alpha: 0.8 });
  txt(PD + '/DetailEmpty/Text', '왼쪽에서 이름을 누르면\n모습 · 장비 · 기록이 나와요', [707, 542.5, 260, 45], P2, { font: 'Noto700', size: 16, color: C.sub });
  // 아바타 액자는 아바타 뒤 · 받침은 Gear 뒤
  S.before(b, D + '/AvatarFrame', D + '/Avatar');
  S.before(b, D + '/GearPlate', D + '/Gear');
}
// 통계 아래 상태줄: 시안에 자리가 없다 → 끔(스크립트는 Text 만 대입하므로 죽지 않는다)
S.place(b, ST + '/StatsStatus', { enable: false });

// ═══════════════════════════════════════════════════════════
// 그리기 순서: 문장은 제목 띠보다 뒤(띠가 문장 밑자락을 덮는다) · 도감 판은 목록 뒤
// ═══════════════════════════════════════════════════════════
S.before(b, 'Window/Crest', 'Window/TitleBar');
S.back(b, CO + '/CollPane');

b.write(path.join(WORLD, 'ui', 'VillageRecordGroup.ui'), { lint_verbose: !!process.env.LINT_V });
console.log(`VillageRecordGroup(마을 기록) 적용 끝 — 새 엔티티 ${b.listEntities().length - before}개`);
