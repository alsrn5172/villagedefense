// 마을 생활 창(VillageLifeGroup)에 디자이너 시안(10-life)을 입힌다 — 창고 · 모집 · 조련 세 탭 (1단계 = 겉모습).
// 실행(월드 루트에서): node Docs/tools/design-ui/apply-life.cjs
// 다시 돌려도 같은 결과가 나온다. 기존 엔티티는 지우지 않고 이름도 안 바꾼다(스크립트가 UUID · 이름으로 잡는다).
// 글자 · 칸 · 카드 상태는 Npc/VillageLifeUIController.mlua 가 채운다(이름 경로로 찾는다 · 아래 이름을 바꾸면 안 된다):
//   슬롯 InvSlot_N · StoSlot_N (Icon · Name · Count · CountBg · Empty · Sel) · 카드 Card_N (Name · Info · Icon · Frame · StageIcon · MatChip/{Plate,MatIcon,Need,Have} · Bundle · LockChip · Sel · Lock)
//   수비대 Slot_N (Text · Empty) · 조련 Row_N (Name · LvText · CostText · Icon · Seg_0~4 · NextIcon · NextCost · NextMul · MaxGlow · MaxChip · BtnTrain/LackFace)
//   제목 TitleBand/{DecoNarrow,DecoWide}/… · Footer/{StorageBar,RecruitSel,InfoIcon} · Storage/PickBar/… · Recruit/Empty · Train/{Empty,HavePlate}
//
// 그림 상태(칸 · 카드 · 버튼)는 스프라이트를 갈아 끼우지 않고 "겹쳐 깔아 둔 그림을 켜고 끄는" 방식이다(공방과 같다).
//   - 🔴 부모 엔티티에 글자가 있으면 자식 그림이 그 글자를 덮는다 → 덮는 그림(Empty · Sel · Lock · LackFace …)은 형제 중 맨 뒤로 보내 아이콘 · 글자 밑에 깐다.
const path = require('path');
const S = require('./skin.cjs');
const WORLD = path.resolve(__dirname, '..', '..', '..');
const b = S.open(WORLD, 'VillageLifeGroup');
const before = b.listEntities().length;
const C = S.COLOR;
const ROUND = 'f5e5fbd6dd224f2d8a5af320436b95f0'; // 흰 둥근사각 9-slice(틴트용 · 지금 게임이 쓰는 기본 칸)

// ── 시안 캔버스 좌표(왼쪽 위 기준 x,y,w,h · 1200x900 캔버스) ──
const WIN = [110, 110, 980, 720];
const CNT = [134, 218, 932, 594]; // 조련 탭이 창 바닥까지 쓰므로 시안 목록 영역을 다 덮는다(예전 940x460)
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
// 흰 둥근사각을 틴트로(빈 자리 판 · 금빛 행 · 수량 받침)
function round(p, r, parent, hex, alpha, type, enable) {
  b.sprite(p, { anchor: 'middle-center', pos: at(r, parent), rect_size: [r[2], r[3]], pivot: [0.5, 0.5], image_ruid: ROUND, sprite_type: type == null ? 1 : type, color: hex, alpha, raycast: false, enable: enable !== false });
}
// 글자를 덮는 그림을 뒤로: 나열한 순서대로 맨 뒤부터 쌓는다(첫 번째가 가장 뒤).
function backAll(names) { for (let i = names.length - 1; i >= 0; i--) S.back(b, names[i]); }
const noBg = (p) => S.tint(b, p, C.white, 0);

// ═══════════════════════════════════════════════════════════
// 창틀: 화면 막 · 판 · 문장 · 제목 띠 · 닫기 · 내용 자리 · 바닥 띠
// ═══════════════════════════════════════════════════════════
S.tint(b, 'Dimmer', C.veil, 0.6);
b.patchComponent('Dimmer', S.SPR, { Type: 1 }); // 기본 그림을 Simple 로 두면 안 그려진다(실측)
ctr('Window', WIN, WIN);
S.image(b, 'Window', 'panel_window');

// 제목 띠: 띠 그림은 새 노드(TitleBand)가 맡고, 글자(NPC 이름 · 스크립트가 Text 대입)는 기존 TitleBar 가 띠 위에서 아이콘 오른쪽으로 치우쳐 쓴다.
// 글자 폭을 재지 않으므로 장식(양옆 선 · 반짝이 · 종류 아이콘)은 글자 폭 두 벌(창고지기 110 / 몬스터 모집관·조련사 174)로 나눠 깔고 스크립트가 라우트로 하나만 켠다.
img('Window/TitleBand', 'panel_title_bar', BAND, WIN);
box('Window/TitleBand/DecoNarrow', BAND, BAND, { enable: false });
const DN = 'Window/TitleBand/DecoNarrow';
flat(DN + '/LineL', [411, 163, 70, 2], BAND, C.gold, 0.5);
img(DN + '/SparkL', 'deco_sparkle', [493, 155, 18, 18], BAND);
img(DN + '/IconBag', 'ico_bag', [523, 147, 34, 34], BAND);
img(DN + '/SparkR', 'deco_sparkle', [689, 155, 18, 18], BAND);
flat(DN + '/LineR', [719, 163, 70, 2], BAND, C.gold, 0.5);
box('Window/TitleBand/DecoWide', BAND, BAND);
const DW = 'Window/TitleBand/DecoWide';
flat(DW + '/LineL', [379, 163, 70, 2], BAND, C.gold, 0.5);
img(DW + '/SparkL', 'deco_sparkle', [461, 155, 18, 18], BAND);
img(DW + '/IconFlag', 'flag_guard', [493, 147, 30, 34], BAND);
img(DW + '/IconShard', 'icon_gem', [491, 147, 34, 34], BAND, { enable: false }); // 그림은 런타임에 ItemCatalog 의 꿈의 조각 아이콘
img(DW + '/SparkR', 'deco_sparkle', [721, 155, 18, 18], BAND);
flat(DW + '/LineR', [751, 163, 70, 2], BAND, C.gold, 0.5);
ctr('Window/TitleBar', [472, 143, 300, 42], WIN);
noBg('Window/TitleBar');
S.font(b, 'Window/TitleBar', { font: 'Maple', size: 30, color: C.title, h: 'center', v: 'middle', outline: false, shadow: true });

img('Window/Crest', 'deco_crest', [450, 58, 300, 88], WIN);

ctr('Window/BtnClose', [1018, 138, 52, 52], WIN);
S.button(b, 'Window/BtnClose', { normal: 'btn_close_default', hover: 'btn_close_hover' });
S.font(b, 'Window/BtnClose', { text: '' });

ctr('Window/Content', CNT, WIN);

// ═══════════════════════════════════════════════════════════
// 바닥 띠 (창고 · 모집 탭에서만 켠다 — 조련 탭엔 없다)
// ═══════════════════════════════════════════════════════════
const F = 'Window/Footer';
ctr(F, FOOT, WIN);
// 시안의 그라데이션 + 금 1px 테두리는 단색 어두운 판 + 위쪽 금선으로 대체
flat(F + '/Bg', FOOT, FOOT, '#0B1533', 0.55);
flat(F + '/Line', [114, 714, 972, 1], FOOT, '#E9B24A', 0.35);

// 모집 버튼
ctr(F + '/BtnPrimary', [800, 726.5, 260, 88], FOOT);
S.button(b, F + '/BtnPrimary', { normal: 'btn_cta_default', pressed: 'btn_cta_pressed', disabled: 'btn_cta_disabled' });
S.font(b, F + '/BtnPrimary', { font: 'Maple', size: 24, color: C.goldInk, h: 'center', v: 'middle', outline: false, text: '모집' });
// 안 골랐을 때 · 해금 없을 때: i 아이콘 + 회색 문장(글자는 기존 CostLabel)
img(F + '/InfoIcon', 'icon_info', [140, 758.5, 24, 24], FOOT);
ctr(F + '/CostLabel', [172, 758, 560, 25], FOOT);
S.font(b, F + '/CostLabel', { font: 'Noto700', size: 18, color: C.sub, h: 'left', v: 'middle', outline: false, text: '' });
// 골랐을 때: 이름 · 묶음 요약 + 비용 칩(영문 이름 줄은 데이터가 없어 생략)
const RS = [140, 746.5, 644, 48];
const RSP = F + '/RecruitSel';
box(RSP, RS, FOOT, { enable: false });
txt(RSP + '/SelName', '', [140, 746, 144, 32], RS, { font: 'Maple', size: 20, color: C.ivory, h: 'left', overflow: 1 });
txt(RSP + '/SelBundle', '', [140, 772, 144, 22], RS, { font: 'Noto700', size: 14, color: C.sub, h: 'left' });
// 🔴 칩 크기 규칙(5차): 칩 폭 = 왼쪽 부분(아이콘 · 재료 · 필요 숫자 118) + 보유 글자 실측 + 오른쪽 여백 14. "보유 999 · 부족"(Noto 14 · 102.75) 최대 → 236. 정상("보유 999" 57.75)은 190. 판 폭은 컨트롤러가 글자 폭으로 계산한다.
const CCR = [284.5, 746.5, 236, 48];
const CC = RSP + '/CostChip';
box(CC, CCR, RS);
S.newImage(b, CC + '/Plate', 'plate_dark', { anchor: 'middle-left', pivot: [0, 0.5], pos: [0, 0], size: [190, 48] });
img(CC + '/MatIcon', 'icon_meso', [292.5, 754.5, 32, 32], CCR); // 그림은 런타임에 ItemCatalog 재료 아이콘
txt(CC + '/Label', '재료', [332.5, 760.5, 34, 19.5], CCR, { font: 'Noto700', size: 14, color: C.faint, h: 'left' }); // 26 폭에서 "재 / 료" 로 꺾였다
txt(CC + '/Need', '', [370.5, 756.5, 26, 28], CCR, { font: 'FootballB', size: 20, color: C.ivory, h: 'left' }); // 두 자리("99" 23.41)까지
txt(CC + '/Have', '', [402.5, 760.5, 106, 19.5], CCR, { font: 'Noto700', size: 14, color: C.faint, h: 'left' }); // "보유 999 · 부족" 102.75 · 컨트롤러가 글자 폭에 맞춘다

// 창고 사용량 칩 + 도움말
const SB = [140, 746.5, 920, 48];
const SBP = F + '/StorageBar';
box(SBP, SB, FOOT, { enable: false });
const UP = [140, 748.5, 245, 44];
img(SBP + '/UsagePlate', 'plate_dark', UP, SB);
// 글자 칸 폭은 게임 글꼴(시안보다 10~15% 넓음)에 맞춰 넉넉히: "창고" 가 26 폭에서 "창 / 고" 로 꺾였다(Play 확인 2026-10-01)
txt(SBP + '/UsagePlate/Label', '창고', [156, 760.5, 34, 19.5], UP, { font: 'Noto700', size: 13, color: C.sub, h: 'left' });
txt(SBP + '/UsagePlate/Used', '0', [162, 756.5, 48, 28], UP, { font: 'FootballB', size: 20, color: C.gold, h: 'right' });
txt(SBP + '/UsagePlate/Cap', '/ 20', [214, 759.5, 36, 24], UP, { font: 'FootballB', size: 16, color: C.faint, h: 'left' });
img(SBP + '/UsagePlate/Gauge', 'gauge_track', [249, 761.5, 120, 18], UP);
// 채움은 Filled 가로 · 왼쪽에서 시작(스크립트가 FillAmount). 트랙 안쪽 폭 88
S.newImage(b, SBP + '/UsagePlate/Gauge/Fill', 'gauge_fill_gold', { anchor: 'middle-left', pivot: [0, 0.5], pos: [16, 0], size: [88, 6], type: 3 });
img(SBP + '/HelpIcon', 'icon_help', [399, 758.5, 24, 24], SB);
txt(SBP + '/Help', '재료·소비 아이템만(장비 제외) · 칸을 고르고 화살표를 누르세요', [431, 758.5, 500, 24], SB, { font: 'Noto700', size: 14, color: C.faint, h: 'left' });

// ═══════════════════════════════════════════════════════════
// 창고 (Content/Storage)
// ═══════════════════════════════════════════════════════════
const ST = 'Window/Content/Storage';
const PANES = [
  { name: 'InvPanel', rect: [134, 218, 428, 369], slot: 'InvSlot_', x0: 168, title: '내 가방', sub: '재료 · 소비', icon: 'ico_bag', iconX: 146, titleX: 182, subRect: [420, 236, 130, 22] },
  { name: 'StoPanel', rect: [638, 218, 428, 369], slot: 'StoSlot_', x0: 672, title: '마을 창고', sub: '마을 주인 전용', icon: 'ico_home', iconX: 650, titleX: 686, subRect: [924, 236, 130, 22] },
];
PANES.forEach((pn) => {
  const P = `${ST}/${pn.name}`;
  ctr(P, pn.rect, CNT);
  S.image(b, P, 'panel_inner'); // 창고 쪽 옅은 초록 기운(그라데이션)은 생략
  img(P + '/HeadIcon', pn.icon, [pn.iconX, 234.5, 26, 26], pn.rect);
  ctr(P + '/Title', [pn.titleX, 232, 200, 32], pn.rect);
  S.font(b, P + '/Title', { font: 'Maple', size: 20, color: C.title, h: 'left', v: 'middle', outline: false, text: pn.title });
  txt(P + '/Sub', pn.sub, pn.subRect, pn.rect, { font: 'Noto700', size: 14, color: C.faint, h: 'right' });
  ctr(P + '/Root', pn.rect, pn.rect);
  for (let i = 0; i < 20; i++) {
    const r = [pn.x0 + 73 * (i % 5), 284 + 73 * Math.floor(i / 5), 68, 68];
    const sp = `${P}/Root/${pn.slot}${i}`;
    ctr(sp, r, pn.rect);
    S.button(b, sp, { normal: 'slot_frame', hover: 'slot_frame_hover', pressed: 'slot_frame_hover' });
    S.font(b, sp, { text: '' });
    ctr(sp + '/Icon', [r[0] + 10, r[1] + 10, 48, 48], r);
    ctr(sp + '/Name', [r[0] + 4, r[1] + 14, 60, 40], r);
    // 수량: 오른쪽 아래 · 흰 풋볼고딕 + 어두운 받침(받침 폭은 스크립트가 자릿수로 RectSize)
    S.place(b, sp + '/Count', { pos: [-6, 4], size: [40, 14] });
    S.font(b, sp + '/Count', { font: 'FootballB', size: 14, color: C.white, h: 'right', v: 'middle', outline: false });
    img(sp + '/Empty', 'slot_frame_empty', r, r); // 빈 칸(아이템이 있으면 스크립트가 끈다)
    img(sp + '/Sel', 'slot_frame_selected', r, r, { enable: false });
    b.sprite(sp + '/CountBg', { anchor: 'bottom-right', pos: [-6, 4], rect_size: [24.5, 14], pivot: [1, 0], image_ruid: ROUND, sprite_type: 0, color: '#070B16', alpha: 0.72, raycast: false, enable: false });
    S.before(b, sp + '/CountBg', sp + '/Count');
    backAll([sp + '/Empty', sp + '/Sel']);
  }
});

// 넣기 · 꺼내기 (금 버튼 + 화살표 그림 · 꺼졌을 땐 스크립트가 화살표를 회색 · 반투명으로)
[['BtnMoveIn', 339.5, 'icon_arrow_right'], ['BtnMoveOut', 409.5, 'icon_arrow_left']].forEach(([n, y, icon]) => {
  const r = [572, y, 56, 56];
  ctr(`${ST}/${n}`, r, CNT);
  S.button(b, `${ST}/${n}`, { normal: 'btn_gold_default', pressed: 'btn_gold_pressed', disabled: 'btn_gold_disabled' });
  S.font(b, `${ST}/${n}`, { text: '' });
  img(`${ST}/${n}/Arrow`, icon, [584, y + 12, 32, 32], r);
});

// 고른 아이템 줄(시안 #30 "제안"): 안 골랐을 때 옅은 판 + 안내 · 골랐을 때 짙은 판 + 아이콘 · 이름 × 수량 · 설명 · 결과 안내
const PB = [134, 599, 932, 64];
const PBP = ST + '/PickBar';
box(PBP, PB, CNT);
round(PBP + '/PlateOff', PB, PB, '#AEB8CF', 0.10); // 점선 · 1px 테두리는 에셋이 없어 옅은 판으로
img(PBP + '/PlateOn', 'plate_dark', PB, PB, { enable: false });
txt(PBP + '/Hint', '칸을 고르면 이름 · 설명 · 옮길 수량이 여기 나와요', [134, 611, 932, 40], PB, { font: 'Noto700', size: 16, color: C.faint, h: 'center' }); // 시안은 가운데 정렬
img(PBP + '/Icon', 'icon_info', [144, 609, 44, 44], PB, { enable: false }); // 그림은 런타임에 원작 아이콘
txt(PBP + '/Name', '', [202, 607, 400, 30], PB, { font: 'Maple', size: 18, color: C.ivory, h: 'left', overflow: 1, enable: false });
txt(PBP + '/Desc', '', [202, 631, 400, 23], PB, { font: 'Noto700', size: 14, color: C.faint, h: 'left', overflow: 1, enable: false });
img(PBP + '/ResultIconR', 'icon_arrow_right', [826, 620, 22, 22], PB, { enable: false });
img(PBP + '/ResultIconL', 'icon_arrow_left', [826, 620, 22, 22], PB, { enable: false });
txt(PBP + '/Result', '', [852, 619, 200, 24], PB, { font: 'Noto700', size: 14, color: C.gold, h: 'left', enable: false });

// 예전 안내 줄(글자 하나)은 새 칩 · 도움말 줄로 갈렸다 — 스크립트가 잡고 있어 지우지 않고 끈다
S.place(b, ST + '/StorageStatus', { enable: false });

// ═══════════════════════════════════════════════════════════
// 모집 (Content/Recruit)
// ═══════════════════════════════════════════════════════════
const RC = 'Window/Content/Recruit';
const DP = [134, 218, 932, 122];
const DPP = RC + '/DefensePreview';
ctr(DPP, DP, CNT);
S.image(b, DPP, 'panel_inner');
flat(DPP + '/Divider', [574, 239, 1, 80], DP, C.gold, 0.30);
img(DPP + '/PreviewFrame', 'slot_frame', [156, 237, 84, 84], DP);
// 시설 그림: 서버가 마을별 RUID · 상하반전을 실어 보낸다 — 공용 fac_* 로 바꾸지 않고 자리만 58x58 로
ctr(DPP + '/PreviewIcon', [169, 250, 58, 58], DP);
ctr(DPP + '/PreviewName', [254, 238, 144, 32], DP);
S.font(b, DPP + '/PreviewName', { font: 'Maple', size: 20, color: C.ivory, h: 'left', v: 'middle', outline: false, text: '최전방 · 포탑' });
ctr(DPP + '/PreviewHint', [400, 246, 170, 22], DP); // 시안은 이름 오른쪽에 붙는다 → 가장 긴 이름(억제기) 기준 고정
S.font(b, DPP + '/PreviewHint', { font: 'Noto700', size: 14, color: C.faint, h: 'left', v: 'middle', outline: false, text: '모집하면 여기 바로 집결' });
ctr(DPP + '/PreviewHp', [254, 274, 302, 20], DP);
S.image(b, DPP + '/PreviewHp', 'gauge_track');
// 채움: 기존 스크립트가 폭을 줄이는 방식 → 그대로 두고 만땅 폭만 270(트랙 안쪽)으로 · 그림은 스크립트가 초록 · 금 · 빨강
S.place(b, DPP + '/PreviewHp/Fill', { pos: [16, 0], size: [270, 8] });
S.image(b, DPP + '/PreviewHp/Fill', 'gauge_fill_green');
ctr(DPP + '/PreviewHpText', [254, 298, 302, 19.5], DP);
S.font(b, DPP + '/PreviewHpText', { font: 'FootballB', size: 14, color: C.sub, h: 'right', v: 'middle', outline: false });
S.before(b, DPP + '/PreviewFrame', DPP + '/PreviewIcon');

// 수비대
const DR = [593, 239, 451, 80];
const DRP = DPP + '/DefenderRow';
ctr(DRP, DR, DP);
txt(DRP + '/Label', '수비대', [593, 244, 60, 24], DR, { font: 'Maple', size: 16, color: C.title, h: 'left' });
ctr(DRP + '/CountText', [776, 243.5, 200, 22.5], DR);
S.font(b, DRP + '/CountText', { font: 'Noto700', size: 14, color: C.sub, h: 'right', v: 'middle', outline: false, text: '0묶음 · 0마리 ·' });
txt(DRP + '/CountCap', '0 / 10칸', [976, 242.5, 68, 24], DR, { font: 'Maple', size: 16, color: C.gold, h: 'right' });
for (let i = 0; i < 10; i++) {
  const r = [593 + 45 * i, 274.5, 40, 40];
  const sp = `${DRP}/Slot_${i}`;
  ctr(sp, r, DR);
  S.image(b, sp, 'slot_frame_sm');
  ctr(sp + '/Text', r, r);
  S.font(b, sp + '/Text', { font: 'FootballB', size: 16, color: C.gold, h: 'center', v: 'middle', outline: false });
  img(sp + '/Empty', 'slot_frame_empty_sm', r, r);
  S.back(b, sp + '/Empty');
}

// 카드 5장 (178.5x262 · 기본 행 판 / 올림 / 선택 금테 / 재료 부족 잠김 판)
const CR0 = [134, 352, 932, 262];
ctr(RC + '/Cards', CR0, CNT);
for (let i = 0; i < 5; i++) {
  const cr = [134 + 188.375 * i, 352, 178.5, 262];
  const c = `${RC}/Cards/Card_${i}`;
  const L = [0, 0, 178.5, 262];
  ctr(c, cr, CR0);
  S.button(b, c, { normal: 'panel_row', hover: 'panel_row_hover', pressed: 'panel_row_hover' });
  S.font(b, c, { text: '' });
  S.place(b, c + '/Hint', { enable: false }); // "터치해서 선택" — 시안에 없다(스크립트가 안 잡는다)
  S.place(b, c + '/Price', { enable: false }); // 재료 글자 한 줄 — 재료 칩으로 갈렸다(스크립트가 이름으로 잡던 것 · 이제 안 쓴다)
  img(c + '/Frame', 'slot_frame', [51, 22, 76, 76], L);
  ctr(c + '/Icon', [63, 34, 52, 52], L);
  // 이름: 한글 한 줄 + 영문 작은 줄(시안) — 서버 이름 "한글 (English)" 를 스크립트가 "한글\n<size=12>영문</size>" 로 나눈다(한 줄로 두면 "(Orange / Mushroom)" 으로 꺾였다 · Play 확인 2026-10-01)
  ctr(c + '/Name', [4, 98, 170.5, 46], L);
  S.font(b, c + '/Name', { font: 'Noto700', size: 16, color: C.ivory, h: 'center', v: 'middle', outline: false });
  b.patchComponent(c + '/Name', S.TXT, { IsRichText: true });
  ctr(c + '/Info', [49, 150, 126, 18], L); // 100 폭에서 "도감 Lv5 · / ×5.0" 으로 꺾였다
  S.font(b, c + '/Info', { font: 'Noto700', size: 13, color: C.sub, h: 'left', v: 'middle', outline: false });
  // 단계 아이콘(StageIcon · stage_1~3)은 넣지 않는다(사용자 결정 2026-10-01 "stage123 같은 거 안 넣는다") — 이미 있으면 지운다. 글자 x(Info)는 시안 자리 그대로.
  if (S.has(b, c + '/StageIcon')) b.remove(c + '/StageIcon');
  // 🔴 칩 크기 규칙(5차): 재료 칩 = 아이콘 24 + 필요 "99"(Football 14 · 16.39) + 보유 "/ 999"(Football 13 · ≈34.5) + 양쪽 여백. 카드 가운데(89.25)에 맞춘다.
  const MCW = 102;
  const MC = [89.25 - MCW / 2, 174, MCW, 32];
  box(c + '/MatChip', MC, L);
  const ML = [0, 0, MCW, 32];
  img(c + '/MatChip/Plate', 'plate_dark', ML, ML);
  img(c + '/MatChip/MatIcon', 'icon_meso', [4, 4, 24, 24], ML); // 그림은 런타임에 원작 재료 아이콘
  txt(c + '/MatChip/Need', '', [32, 6, 18, 20], ML, { font: 'FootballB', size: 14, color: C.ivory, h: 'left' });
  txt(c + '/MatChip/Have', '', [52, 7, 38, 18], ML, { font: 'FootballB', size: 13, color: C.faint, h: 'left' });
  txt(c + '/Bundle', '', [4, 211, 170.5, 20], L, { font: 'Noto700', size: 13, color: C.faint, h: 'center' });
  const LKB = S.roleBox('lack'); // 재료 부족 = 보석 칩 · Noto 13 · 22 높이 → 86×22 (카드 가운데 89.25 고정)
  img(c + '/LockChip', 'chip_red', [89.25 - LKB[0] / 2, 211, LKB[0], LKB[1]], L, { enable: false });
  txt(c + '/LockChip/Label', '재료 부족', [0, 0, LKB[0], LKB[1]], [0, 0, LKB[0], LKB[1]], { font: 'Noto700', size: 13, color: C.white });
  img(c + '/Sel', 'panel_row_selected', L, L, { enable: false });
  img(c + '/Lock', 'panel_row_locked', L, L, { enable: false });
  S.before(b, c + '/Frame', c + '/Icon');
  backAll([c + '/Lock', c + '/Sel']); // 첫 번째가 가장 뒤: 재료 부족 카드를 골라도 금테(Sel)가 잠김 덮개(Lock) 위에 보이게(시안 s6)
}

// 모집 빈 상태(해금한 몬스터 없음) — 점선 빈 카드 윤곽 5장은 에셋이 없어 생략
const EP = RC + '/Empty';
box(EP, CR0, CNT, { enable: false });
img(EP + '/Icon', 'mon_unknown', [568, 420.5, 64, 64], CR0);
txt(EP + '/Title', '아직 해금한 몬스터가 없어요', [463, 492.5, 274, 25], CR0, { font: 'Noto700', size: 18, color: C.sub });
txt(EP + '/Sub', '마을 기록의 <color=#E8B64C>도감 관리인</color>에게서 몬스터를 먼저 해금하세요', [400, 524, 400, 24], CR0, { font: 'Noto400', size: 14, color: C.faint });

// 도움말 줄 (글자는 기존 RecruitStatus — 이제 고정 문구)
img(RC + '/HelpIcon', 'icon_help', [134, 626, 24, 24], CNT);
ctr(RC + '/RecruitStatus', [166, 626, 900, 24], CNT);
S.font(b, RC + '/RecruitStatus', { font: 'Noto700', size: 14, color: C.faint, h: 'left', v: 'middle', outline: false, text: '모집하면 최전방 시설 앞에 바로 모여요 · 시야 안의 적에게만 나가요' });

// ═══════════════════════════════════════════════════════════
// 조련 (Content/Train) — 시안 목록은 6행(62 높이)인데 게임은 8행이라 행 54 · 간격 7 로 줄여 270~751 안에 8행을 넣는다
// ═══════════════════════════════════════════════════════════
const TR = 'Window/Content/Train';
img(TR + '/HeadIcon', 'flag_guard', [136, 220.5, 23, 26], CNT);
txt(TR + '/HeadLabel', '해금한 몬스터', [170, 218, 200, 32], CNT, { font: 'Maple', size: 20, color: C.title, h: 'left' });
txt(TR + '/HeadHint', '강화 = 모집한 수비 몬스터의 HP·공격 배율', [766.5, 223, 299.5, 22], CNT, { font: 'Noto700', size: 14, color: C.faint, h: 'right' });
// 꿈의 조각 보유 칩 + 도움말 (글자는 기존 TrainHave — 고정 문구)
// 🔴 칩 크기 규칙(5차): 판 폭 = 왼쪽 8 + 아이콘 34 + 10 + 라벨(꿈의 조각 Noto 14 · 58.59 → 60) + 6 + 숫자(최대 "9,999" Football 24 · 65.33 → 66) + 오른쪽 14 = 198. 147.5 에서는 두 자리 숫자("14")가 판 밖으로 넘쳤다.
const HP = [134, 764, 198, 48];
img(TR + '/HavePlate', 'plate_dark', HP, CNT);
img(TR + '/HavePlate/Icon', 'icon_gem', [142, 771, 34, 34], HP); // 그림은 런타임에 ItemCatalog 의 꿈의 조각 아이콘
txt(TR + '/HavePlate/Label', '꿈의 조각', [186, 778, 60, 19.5], HP, { font: 'Noto700', size: 14, color: C.sub, h: 'left' });
txt(TR + '/HavePlate/Num', '0', [252, 771, 66, 33.5], HP, { font: 'FootballB', size: 24, color: C.gold, h: 'left' });
img(TR + '/HelpIcon', 'icon_help', [345.5, 776, 24, 24], CNT); // 판이 50.5 넓어진 만큼 오른쪽으로
ctr(TR + '/TrainHave', [377.5, 776, 688, 24], CNT);
S.font(b, TR + '/TrainHave', { font: 'Noto700', size: 14, color: C.faint, h: 'left', v: 'middle', outline: false, text: 'Lv2 ×1.5 · Lv3 ×2.2 · Lv4 ×3.3 · Lv5 ×5.0 - 새로 모집하는 묶음부터 적용' });

ctr(TR + '/TrainRoot', CNT, CNT);
for (let i = 0; i < 8; i++) {
  const rr = [134, 270 + 61 * i, 932, 54];
  const R0 = TR + '/TrainRoot/Row_' + i;
  const L = [0, 0, 932, 54];
  ctr(R0, rr, CNT);
  S.image(b, R0, 'panel_row');
  round(R0 + '/MaxGlow', [5, 5, 922, 44], L, '#F7C948', 0.22, 1, false); // 다 키운 줄: 금빛 안쪽 테 + 번지는 금색 → 옅은 금 판으로 대체
  img(R0 + '/Frame', 'slot_frame', [12, 5, 44, 44], L);
  ctr(R0 + '/Icon', [19, 12, 30, 30], L);
  ctr(R0 + '/Name', [68, 6, 210, 42], L); // 한글 한 줄 + 영문 작은 줄(스크립트가 나눈다)
  S.font(b, R0 + '/Name', { font: 'Noto700', size: 16, color: C.ivory, h: 'left', v: 'middle', outline: false });
  b.patchComponent(R0 + '/Name', S.TXT, { IsRichText: true });
  for (let k = 0; k < 5; k++) img(`${R0}/Seg_${k}`, 'gauge_seg_off', [290 + 21 * k, 7.5, 18, 18], L);
  ctr(R0 + '/LvText', [290, 28.5, 170, 18], L);
  S.font(b, R0 + '/LvText', { font: 'Noto700', size: 13, color: C.sub, h: 'left', v: 'middle', outline: false });
  ctr(R0 + '/CostText', [472, 15, 282, 24], L);
  S.font(b, R0 + '/CostText', { font: 'Noto700', size: 14, color: C.sub, h: 'left', v: 'middle', outline: false });
  img(R0 + '/NextIcon', 'icon_gem', [531.5, 15, 24, 24], L); // 그림은 런타임에 꿈의 조각 아이콘
  txt(R0 + '/NextCost', '', [561.5, 16, 19, 22.5], L, { font: 'FootballB', size: 16, color: C.ivory, h: 'left' });
  txt(R0 + '/NextMul', '', [586, 15, 90, 24], L, { font: 'Noto700', size: 14, color: C.sub, h: 'left' });
  // 강화 버튼: 기본 금 → 재료 부족은 겹친 파랑 꺼짐 모양(눌러서 서버가 거절하는 것은 그대로) → 최대는 버튼을 끄고 MAX 배지
  const BR = [766, 5, 150, 44];
  ctr(R0 + '/BtnTrain', BR, L);
  S.button(b, R0 + '/BtnTrain', { normal: 'btn_gold_default_sm', disabled: 'btn_gold_disabled_sm' });
  S.font(b, R0 + '/BtnTrain', { font: 'Maple', size: 16, color: C.goldInk, h: 'center', v: 'middle', outline: false, text: '강화' });
  img(R0 + '/BtnTrain/LackFace', 'btn_blue_disabled_sm', [0, 0, 150, 44], [0, 0, 150, 44], { enable: false });
  txt(R0 + '/BtnTrain/LackFace/Label', '재료 부족', [0, 0, 150, 44], [0, 0, 150, 44], { font: 'Maple', size: 16, color: '#E4E8EF' });
  const MXB = S.roleBox('max'); // MAX = Maple 16 · 30 높이(방어 · 공방과 같은 크기) · 가운데 x 841.25 · y 27 고정
  img(R0 + '/MaxChip', 'chip_gold', [841.25 - MXB[0] / 2, 27 - MXB[1] / 2, MXB[0], MXB[1]], L, { enable: false });
  txt(R0 + '/MaxChip/Label', 'MAX', [0, 0, MXB[0], MXB[1]], [0, 0, MXB[0], MXB[1]], { font: 'Maple', size: 16, color: C.goldInk });
  S.before(b, R0 + '/Frame', R0 + '/Icon');
  backAll([R0 + '/MaxGlow', R0 + '/Frame']);
}

// 조련 빈 상태
const TE = [134, 270, 932, 482];
box(TR + '/Empty', TE, CNT, { enable: false });
img(TR + '/Empty/Icon', 'mon_unknown', [568, 448.5, 64, 64], TE);
txt(TR + '/Empty/Title', '아직 해금한 몬스터가 없어요', [463, 520.5, 274, 25], TE, { font: 'Noto700', size: 18, color: C.sub });
txt(TR + '/Empty/Sub', '마을 기록의 <color=#E8B64C>도감 관리인</color>에게서 먼저 해금하세요', [420, 553, 360, 24], TE, { font: 'Noto400', size: 14, color: C.faint });

// ═══════════════════════════════════════════════════════════
// 그리기 순서: 바닥 띠 바탕 < 글자 · 문장 < 제목 띠 < 제목 글자 (시안도 띠가 문장 밑자락을 덮는다)
// ═══════════════════════════════════════════════════════════
backAll([F + '/Bg', F + '/Line']);
S.before(b, 'Window/TitleBand', 'Window/TitleBar');
S.before(b, 'Window/Crest', 'Window/TitleBand');

// 칩 글자 대비(디자이너 시안 갱신 2026-10-02): 밝은 칩(MAX = chip_gold → 잉크) · 보석 칩(재료 부족 = chip_red → 흰 글자 + 어두운 외곽선). 글자를 다 맞춘 뒤에 부른다.
console.log('chipText', JSON.stringify(S.chipText(b).map((x) => x.path.split('/').slice(-3).join('/') + ':' + x.kind)));

b.write(path.join(WORLD, 'ui', 'VillageLifeGroup.ui'), { lint_verbose: !!process.env.LINT_V });
console.log(`VillageLifeGroup(생활) 적용 끝 — 새 엔티티 ${b.listEntities().length - before}개`);
