// 상시 HUD 중 상태창(StatusHUD)에 디자이너 시안(04-hud)을 입힌다: 상태창 판 · 레벨 · 이름판 · 직업 · AP/SP 칩 · HP/MP/EXP 게이지 ·
// 오른쪽 위 바로가기(캐릭터 · 스킬 · 친구 · 메뉴) · 레벨업 알림 · 레벨업 금빛 테두리.
// 실행(월드 루트에서): node Docs/tools/design-ui/apply-hud-status.cjs
// 다시 돌려도 같은 결과가 나온다. 기존 엔티티는 지우지 않고 값만 바꾼다.
// 글자를 채우는 쪽은 Summon/StatusHUDController.mlua (UUID 로 잡는다 · 기존 노드의 이름 · 구조를 바꾸면 안 된다).
// 바로가기 4칸(캐릭터 · 스킬 · 친구 · 메뉴): 친구 · 메뉴는 게임에 기능이 없어 누르면 "준비 중" 토스트(StatusHUDController). 월드맵 버튼(WorldMapGroup)은 apply-worldmap.cjs.
const path = require('path');
const S = require('./skin.cjs');
const WORLD = path.resolve(__dirname, '..', '..', '..');
const b = S.open(WORLD, 'StatusHUD');
const before = b.listEntities().length;
const C = S.COLOR;

// ── 시안 캔버스 좌표(왼쪽 위 기준 x,y,w,h) ──
const BOX = [800, 880, 380, 186];          // 상태창 판 (화면 가운데보다 30px 오른쪽 — 시안 실측 그대로)
const LV = [818, 894, 62, 33.5];           // 레벨 글자 (시안은 글자 폭만큼 · 고정 폭 + 왼쪽 정렬로 단순화)
const NAME = [888, 895, 176, 32];          // 이름판 (시안은 남는 폭을 다 씀 · 직업 칸을 넓히려고 176 으로 고정)
const JOB_ICON = [1072, 898, 26, 26];
const JOB_TXT = [1102, 898, 60, 26];       // 직업 이름: 글자 수에 따라 스크립트가 크기를 줄인다(16 / 14 / 12)
// AP/SP 칩: 시안 98 폭은 "AP 30 · SP 18" 처럼 두 자리만 돼도 게임 글꼴(시안보다 넓음)에서 둘째 줄로 꺾였다(Play 확인 2026-10-01) → 130 폭(가운데 그대로)
const APSP = [925, 934.5, 130, 25];
const ALERT = [1047, 920.5, 24, 24];
const ROWS = { Hp: 966.5, Mp: 999.5, Exp: 1032.5 };
const LABEL_Y = { Hp: 970, Mp: 1003, Exp: 1036 };

// 옛 글자(TextComponent · 스크립트가 UUID 로 잡고 있어 교체하지 않는다)에 글꼴 · 크기 · 색을 입힌다.
// Font 0 기본 · 1 메이플 · 2 배찌 · 3 풋볼 / Alignment 0~8(3 = 왼쪽 가운데 · 4 = 가운데)
function legacyText(p, o) {
  const u = {};
  if (o.font != null) u.Font = o.font;
  if (o.size) u.FontSize = o.size;
  if (o.color) u.FontColor = S.C(o.color, o.alpha);
  if (o.align != null) u.Alignment = o.align;
  if (o.bold != null) u.Bold = o.bold;
  if (o.outline === false) { u.UseOutLine = false; u.OutlineWidth = 0; }
  if (o.outline === true) { u.UseOutLine = true; u.OutlineWidth = 2; u.OutlineColor = S.C('#070B16', 0.9); }
  b.patchComponent(p, 'MOD.Core.TextComponent', u);
}
const ctr = (p, r, parent, extra) => S.place(b, p, Object.assign({ anchor: 'middle-center', pivot: [0.5, 0.5], pos: S.at(r[0], r[1], r[2], r[3], parent), size: [r[2], r[3]] }, extra || {}));

// ═══ 상태창 판 ═══
S.place(b, 'UIMyInfo', { pos: [30, 107], size: [BOX[2], BOX[3]] });
S.newImage(b, 'UIMyInfo/Bg', 'panel_tooltip', { size: [BOX[2], BOX[3]] }); // 시안의 그림자(drop-shadow)는 생략
ctr('UIMyInfo/info_top', BOX, BOX);
ctr('UIMyInfo/info_bottom', BOX, BOX);
b.patchComponent('UIMyInfo/info_top', S.SPR, { RaycastTarget: false }); // 투명 덮개가 판 클릭(캐릭터 창 열기)을 막지 않게

// ═══ 윗줄: 레벨 · 이름판 · 직업 ═══
ctr('UIMyInfo/info_top/text_level', LV, BOX);
legacyText('UIMyInfo/info_top/text_level', { font: 3, size: 24, color: C.gold, align: 3, bold: true, outline: false });

ctr('UIMyInfo/info_top/text_name', NAME, BOX);
S.image(b, 'UIMyInfo/info_top/text_name', 'plate_dark');
legacyText('UIMyInfo/info_top/text_name', { font: 1, size: 16, color: C.ivory, align: 4, bold: true, outline: false });

S.newImage(b, 'UIMyInfo/info_top/JobIcon', 'icon_info_job', { pos: S.at(...JOB_ICON, BOX), size: [JOB_ICON[2], JOB_ICON[3]] });
ctr('UIMyInfo/info_top/text_class', JOB_TXT, BOX);
legacyText('UIMyInfo/info_top/text_class', { font: 0, size: 16, color: C.ivory, align: 3, bold: true, outline: false });

// ═══ AP · SP 칩 (남으면 금 칩 · 없으면 회색 칩은 스크립트가 그림을 바꾼다) ═══
ctr('UIMyInfo/text_apsp', APSP, BOX);
S.image(b, 'UIMyInfo/text_apsp', 'chip_gray_dark');
S.font(b, 'UIMyInfo/text_apsp', { font: 'Maple', size: 14, color: C.white, h: 'center', v: 'middle', outline: false });
S.newImage(b, 'UIMyInfo/ApSpAlert', 'badge_alert', { pos: S.at(...ALERT, BOX), size: [24, 24], enable: false });

// ═══ 게이지 3줄 (HP · MP · EXP) — 줄 전체를 트랙 자리로 쓰고, 채움 폭은 스크립트가 줄인다 ═══
const FILL = { Hp: 'gauge_fill_red', Mp: 'gauge_fill_blue', Exp: 'gauge_fill_gold' };
for (const k of ['Hp', 'Mp', 'Exp']) {
  const row = [868, ROWS[k], 294, 26];
  const P = 'UIMyInfo/info_bottom/' + k;
  ctr(P, row, BOX);
  S.image(b, P + '/img_background', 'gauge_track');
  // 채움: 왼쪽 가운데 앵커 · 트랙 왼쪽에서 16 안쪽 · 262x12 가 만땅 폭(스크립트가 OnBeginPlay 에서 이 폭을 읽어 둔다)
  S.place(b, P + '/img_bar', { pos: [16, 0], size: [262, 12] });
  S.image(b, P + '/img_bar', FILL[k]);
  S.place(b, P + '/text_value', { pos: [0, 0], size: [294, 26] });
  legacyText(P + '/text_value', { font: 3, size: 14, color: C.white, align: 4, bold: true, outline: true });
}
for (const k of ['Hp', 'Mp', 'Exp']) {
  const lbl = k === 'Exp' ? 'EXP' : k.toUpperCase();
  S.newText(b, 'UIMyInfo/info_bottom/' + k + 'Label', lbl, { font: 'Maple', size: 14, color: C.sub, h: 'left', pos: S.at(818, LABEL_Y[k], 44, 19.5, BOX), rect: [44, 20] });
}

// ═══ 오른쪽 위 바로가기: 캐릭터(C) · 스킬(K) · 친구(F) · 메뉴 — 시안 4칸 292 폭 ═══
const CONT = [1604, 20, 292, 85];
// 🔴 오른쪽 끝 자리는 MSW 엔진 기본 버튼(친구 · 더보기 · 캔버스 x 1725~1897)이 차지한다(스크립트로 못 숨기고 못 바꾼다) → 시안 좌표(오른쪽 여백 24)를 그대로 쓰면 그 위에 겹친다.
//    그래서 4칸 묶음 전체를 엔진 버튼 왼쪽(오른쪽 끝 1717 = 오른쪽 여백 203)으로 옮긴다. 칸 사이 간격 · 칩 · 이름 위치는 시안 그대로.
S.newBox(b, 'Shortcuts', { anchor: 'top-right', pivot: [1, 1], pos: [-203, -20], size: [CONT[2], CONT[3]] });
const SHORT = [
  { id: 'BtnCharacter', x: 1604, icon: 'ico_user', key: 'C', label: '캐릭터', alert: true },
  { id: 'BtnSkill', x: 1680, icon: 'ico_star', key: 'K', label: '스킬', alert: true },
  { id: 'BtnFriend', x: 1756, icon: 'ico_party', key: 'F', label: '친구' },          // 기능 없음 → 누르면 "준비 중" 토스트
  { id: 'BtnMenu', x: 1832, icon: null, key: null, label: '메뉴' },                    // 틀 없이 btn_icon_more 그림 하나 · 기능 없음 → "준비 중" 토스트
];
for (const s of SHORT) {
  const BTN = [s.x, 20, 64, 64];
  const P = 'Shortcuts/' + s.id;
  const frame = s.icon ? 'slot_frame' : 'btn_icon_more';
  b.button(P, '', { anchor: 'middle-center', pos: S.at(...BTN, CONT), rect_size: [64, 64], pivot: [0.5, 0.5], image_ruid: S.R(frame) });
  if (s.icon) S.button(b, P, { normal: 'slot_frame', hover: 'slot_frame_hover', pressed: 'slot_frame_hover' });
  else S.button(b, P, { normal: 'btn_icon_more' }); // 그림 자체가 칸 — 올림/누름 그림이 시안에 없다
  S.font(b, P, { text: '' });
  if (s.icon) S.newImage(b, P + '/Icon', s.icon, { pos: S.at(s.x + 14, 34, 36, 36, BTN), size: [36, 36] });
  if (s.key) {
    S.newImage(b, P + '/KeyChip', 'chip_gold_sm', { pos: S.at(s.x + 48, 68, 22, 22, BTN), size: [22, 22] });
    S.newText(b, P + '/KeyChip/Text', s.key, { font: 'Maple', size: 13, color: C.goldInk, pos: [0, 0], rect: [22, 22] });
  }
  S.newText(b, P + '/Label', s.label, { font: 'Noto700', size: 13, color: C.ivory, shadow: true, pos: S.at(s.x - 4, 87, 72, 18, BTN), rect: [72, 18] }); // 칸 아래 글자는 구름 같은 밝은 배경 위에서 안 보여 그림자를 깐다(Play 확인 2026-10-01)
  if (s.alert) S.newImage(b, P + '/Alert', 'badge_alert', { pos: S.at(s.x + 49, 10, 24, 24, BTN), size: [24, 24], enable: false });
}

// ═══ 레벨업 알림 (평소 꺼둠 · 스크립트가 2초 켠다) ═══
const NOTICE = [660, 330, 600, 190];
S.newBox(b, 'LevelUpNotice', { anchor: 'top-center', pivot: [0.5, 1], pos: [0, -330], size: [NOTICE[2], NOTICE[3]], enable: false });
S.newImage(b, 'LevelUpNotice/Crest', 'deco_crest', { pos: S.at(810, 330, 300, 88, NOTICE), size: [300, 88] });
const BARBOX = [660, 392, 600, 84];
S.newImage(b, 'LevelUpNotice/Bar', 'bar_goal', { pos: S.at(...BARBOX, NOTICE), size: [600, 84] });
S.newText(b, 'LevelUpNotice/Bar/Title', 'LEVEL UP!', { font: 'Bazzi', size: 44, color: '#FFF3C4', pos: [0, 0], rect: [260, 62] });
S.newText(b, 'LevelUpNotice/Line', 'Lv 1 → Lv 2', { font: 'Maple', size: 24, color: C.white, shadow: true, pos: S.at(680, 486, 560, 34, NOTICE), rect: [560, 34] }); // 시안은 어두운 배경 위 · 게임은 밝은 맵 위에서 흰 글자가 묻혀 그림자를 깐다(Play 확인 2026-10-01)
S.newImage(b, 'LevelUpNotice/Sparkle1', 'deco_sparkle', { pos: S.at(700, 400, 34, 34, NOTICE), size: [34, 34] });
S.newImage(b, 'LevelUpNotice/Sparkle2', 'deco_sparkle_2', { pos: S.at(1180, 390, 30, 30, NOTICE), size: [30, 30] });

// ═══ 그리기 순서: 판은 맨 뒤 · 클릭 버튼은 맨 앞(판 전체를 덮는 투명 버튼) ═══
// 레벨업 때 상태창이 한 번 금빛으로 빛난다(시안 s4): 대응 에셋이 없어 금빛 칸 테두리(slot_frame_hover · 가운데 비움)를 판 크기로 얹는다. 평소 꺼둠 · 스크립트가 알림과 같이 켠다.
// 🔴 테두리 두께 18 이 판 안쪽으로 번져 맨 아래 EXP 줄 · 왼쪽 위 레벨 글자를 잘랐다(3차 확인 · B05) → 판보다 한 둘레 크게(바깥 14 · 안쪽으로는 4만 겹침).
S.newImage(b, 'UIMyInfo/LevelUpGlow', 'slot_frame_hover', { size: [BOX[2] + 28, BOX[3] + 28], enable: false });
b.patchComponent('UIMyInfo/LevelUpGlow', S.SPR, { FillCenter: false });
S.back(b, 'UIMyInfo/Bg');
S.front(b, 'UIMyInfo/BtnOpenCharacter');
S.before(b, 'UIMyInfo/LevelUpGlow', 'UIMyInfo/BtnOpenCharacter');

b.write(path.join(WORLD, 'ui', 'StatusHUD.ui'), {
  bind: {
    mlua: path.join(WORLD, 'RootDesk/MyDesk/Summon/StatusHUDController.mlua'),
    props: {
      hpLabel: 'UIMyInfo/info_bottom/HpLabel',
      jobText: 'UIMyInfo/info_top/text_class',
      apSpImage: 'UIMyInfo/text_apsp',
      apAlert: 'UIMyInfo/ApSpAlert',
      btnChar: 'Shortcuts/BtnCharacter',
      btnSkill: 'Shortcuts/BtnSkill',
      alertChar: 'Shortcuts/BtnCharacter/Alert',
      alertSkill: 'Shortcuts/BtnSkill/Alert',
      btnFriend: 'Shortcuts/BtnFriend',
      btnMenu: 'Shortcuts/BtnMenu',
      levelGlow: 'UIMyInfo/LevelUpGlow',
      noticeRoot: 'LevelUpNotice',
      noticeLine: 'LevelUpNotice/Line',
    },
  },
  lint_verbose: !!process.env.LINT_V,
});
console.log(`StatusHUD(상태창) 적용 끝 — 새 엔티티 ${b.listEntities().length - before}개`);
