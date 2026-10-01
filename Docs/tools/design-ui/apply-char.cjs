// 캐릭터 창(CharacterGroup)에 디자이너 시안(07-char)을 입힌다 (1단계 = 겉모습).
// 실행(월드 루트에서): node Docs/tools/design-ui/apply-char.cjs
// 다시 돌려도 같은 결과가 나온다. 기존 엔티티는 지우지 않고 값만 바꾼다(이름도 그대로).
// 글자·그림을 상태별로 바꾸는 쪽은 Stat/StatUIController.mlua · Item/InventoryUIController.mlua (이름 경로로 찾는 자식이 있다 — 아래 이름을 바꾸면 안 된다:
//   Slot_*/EnhBadge · LockLabel · SlotLabel · Icon · 가방 칸 KindBadge · EnhBadge · Count · Name · 툴팁 Divider · 툴팁 줄 Row0~4/Chip · Cell · Icon · BtnAutoPickup/Toggle · Magnet).
const path = require('path');
const S = require('./skin.cjs');
const WORLD = path.resolve(__dirname, '..', '..', '..');
const b = S.open(WORLD, 'CharacterGroup');
const before = b.listEntities().length;
const C = S.COLOR;
const DEFAULT_RUID = '2860136c06ab075439721c027de365af';
const ROUND = 'f5e5fbd6dd224f2d8a5af320436b95f0'; // 흰 둥근사각 9-slice(틴트용 · 지금 게임이 쓰는 기본 칸)

// 아바타 원본 컴포넌트 · 스프라이트 컴포넌트 원본을 바꾸기 전에 복사해 둔다.
const clone = (o) => JSON.parse(JSON.stringify(o));
const TPL_SPR = clone(b.getComponent('Window/Content/Equip/SlotArea/Slot_HAT/Icon', S.SPR));
const AVATAR_SRC = 'Window/Content/Stat/Left/Portrait/Avatar';
const AV_COMPS = ['MOD.Core.AvatarGUIRendererComponent', 'MOD.Core.CostumeManagerComponent'].map((t) => [t, clone(b.getComponent(AVATAR_SRC, t))]);

// ── 시안 캔버스 좌표(왼쪽 위 기준 x,y,w,h) ──
const WIN = [40, 56, 1000, 800];
const BAND = [128, 78, 824, 64];
const TABS = [64, 166, 952, 56];
const CONT = [64, 236, 952, 534];
const FOOT = [64, 782, 952, 56];
const W = 'Window';

// 기존 엔티티를 가운데 앵커 · 가운데 피벗으로 옮겨 시안 자리에 놓는다.
const ctr = (p, r, parent, extra) => S.place(b, p, Object.assign({ anchor: 'middle-center', pivot: [0.5, 0.5], pos: S.at(r[0], r[1], r[2], r[3], parent), size: [r[2], r[3]] }, extra || {}));
// 새 그림 · 새 글자 (가운데 앵커)
const img = (p, key, r, parent, o) => S.newImage(b, p, key, Object.assign({ pos: S.at(r[0], r[1], r[2], r[3], parent), size: [r[2], r[3]] }, o || {}));
const txt = (p, text, r, parent, o) => S.newText(b, p, text, Object.assign({ pos: S.at(r[0], r[1], r[2], r[3], parent), rect: [r[2], r[3]] }, o || {}));
// 기존 엔티티에 스프라이트가 없으면 붙이고(컴포넌트 원본을 복사) 있으면 값만 맞춘다.
function sprite(p, o) {
  const ruid = o.key ? S.R(o.key) : (o.ruid || ROUND);
  const type = o.type != null ? o.type : (o.key ? (S.isSliced(o.key) ? 1 : 0) : 1);
  const color = S.C(o.color || '#FFFFFF', o.alpha);
  if (b.hasComponent(p, S.SPR)) b.patchComponent(p, S.SPR, { ImageRUID: { DataId: ruid }, Type: type, Color: color });
  else b.addComponent(p, S.SPR, Object.assign(clone(TPL_SPR), { ImageRUID: { DataId: ruid }, Type: type, Color: color, RaycastTarget: false, Enable: true }));
}
// 새 단색 둥근 판(틴트)
function round(p, r, parent, hex, alpha) {
  b.sprite(p, { anchor: 'middle-center', pos: S.at(r[0], r[1], r[2], r[3], parent), rect_size: [r[2], r[3]], pivot: [0.5, 0.5], image_ruid: ROUND, sprite_type: 1, color: hex, alpha, raycast: false });
}
// 글자만 남기고 그림은 안 보이게(Chip · Cell 배경 — 시안은 줄 전체가 받침 하나)
const noBg = (p) => S.tint(b, p, '#FFFFFF', 0);
// 상태 그림을 스크립트가 바꾸는 버튼은 ButtonComponent 전환을 끈다(틴트 · 그림 교체와 싸우지 않게)
const noTransition = (p) => b.patchComponent(p, S.BTN, { Transition: 0 });
const font = (p, o) => S.font(b, p, Object.assign({ outline: false }, o));

// ═══ 화면 막 · 창 판 · 문장 · 제목 띠 · 닫기 ═══
S.tint(b, 'Dimmer', C.veil, 0.6);
b.patchComponent('Dimmer', S.SPR, { Type: 1 }); // 기본 그림을 Simple 로 두면 안 그려진다(실측)

S.place(b, W, { pos: [0, 0], size: [1000, 800] });
S.image(b, W, 'panel_window');

ctr(W + '/TitleBar', BAND, WIN);
S.image(b, W + '/TitleBar', 'panel_title_bar');
font(W + '/TitleBar', { font: 'Maple', size: 30, color: C.title, h: 'center', v: 'middle', shadow: true });
img(W + '/TitleBar/SparkleL', 'deco_sparkle', [468.5, 101, 18, 18], BAND);
img(W + '/TitleBar/SparkleR', 'deco_sparkle', [593.5, 101, 18, 18], BAND);

ctr(W + '/BtnClose', [968, 84, 52, 52], WIN);
S.button(b, W + '/BtnClose', { normal: 'btn_close_default', hover: 'btn_close_hover' });
font(W + '/BtnClose', { text: '' });

img(W + '/Crest', 'deco_crest', [390, 4, 300, 88], WIN);

// ═══ 탭 2개 (선택 = 금 · 아닌 것 = 파랑 · 스크립트가 고를 때 그림을 바꾼다) ═══
ctr(W + '/TabBar', TABS, WIN);
const TAB0 = [64, 166, 472, 56];
const TAB1 = [544, 166, 472, 56];
ctr(W + '/TabBar/Tab0', TAB0, TABS);
S.image(b, W + '/TabBar/Tab0', 'btn_gold_default');
noTransition(W + '/TabBar/Tab0');
ctr(W + '/TabBar/Tab1', TAB1, TABS);
S.image(b, W + '/TabBar/Tab1', 'btn_blue_default');
noTransition(W + '/TabBar/Tab1');
for (const t of ['Tab0', 'Tab1']) {
  // 글자 폭은 재지 않는다: 아이콘 자리만큼 왼쪽 여백을 줘서 글자를 오른쪽으로 민다(시안은 아이콘 + 글자 한 덩어리가 가운데).
  font(W + '/TabBar/' + t, { font: 'Maple', size: 24, color: t === 'Tab0' ? C.goldInk : C.ivory, h: 'center', v: 'middle' });
  b.patchComponent(W + '/TabBar/' + t, S.TXT, { Padding: { left: 30, right: 0, top: 0, bottom: 0 } });
}
img(W + '/TabBar/Tab0/Icon', 'ico_user', [261, 181, 26, 26], TAB0);
img(W + '/TabBar/Tab1/Icon', 'ico_bag', [683.5, 181, 26, 26], TAB1);

ctr(W + '/Content', CONT, WIN);

// ═══ 스탯 탭 ═══
const ST = W + '/Content/Stat';
const LEFT = [64, 236, 440, 534];
const RIGHT = [522, 236, 494, 534];
ctr(ST + '/Left', LEFT, CONT);
ctr(ST + '/Right', RIGHT, CONT);

// 초상화: 금테 액자 + 안쪽 판(무대 그림은 시안용 임시라 panel_inner 채움으로) + 기존 아바타 + 이름 받침
const PORT = [64, 236, 440, 200];
const P = ST + '/Left/Portrait';
ctr(P, PORT, LEFT);
S.image(b, P, 'slot_frame_sm');
img(P + '/Stage', 'panel_inner', [74, 246, 420, 180], PORT);
ctr(P + '/NameText', [184, 416, 200, 36], PORT);
sprite(P + '/NameText', { key: 'plate_dark' });
font(P + '/NameText', { font: 'Maple', size: 20, color: C.ivory, h: 'center', v: 'middle' });
S.back(b, P + '/Stage');

// 정보 행 5개: 직업 · 레벨 · 경험치 · SP · AP
const INFO = [
  { icon: 'icon_info_job', cell: [214, 282], f: ['Noto700', 18, 'left'] },
  { icon: 'icon_info_level', cell: [214, 282], f: ['FootballB', 18, 'left'] },
  { icon: 'icon_info_exp', cell: [382, 100], f: ['FootballB', 16, 'right'] },
  { icon: 'icon_info_sp', cell: [214, 162], f: ['FootballB', 18, 'left'] },
  { icon: 'icon_info_ap', cell: [214, 162], f: ['FootballB', 18, 'left'] },
];
INFO.forEach((it, i) => {
  const ry = 458 + 54 * i;
  const R = [64, ry, 440, 46];
  const rp = ST + '/Left/Row' + i;
  ctr(rp, R, LEFT);
  sprite(rp, { key: 'plate_dark' });
  ctr(rp + '/Chip', [114, ry, 100, 46], R);
  noBg(rp + '/Chip');
  font(rp + '/Chip', { font: 'Noto700', size: 18, color: C.sub, h: 'left', v: 'middle' });
  ctr(rp + '/Cell', [it.cell[0], ry, it.cell[1], 46], R);
  noBg(rp + '/Cell');
  font(rp + '/Cell', { font: it.f[0], size: it.f[1], color: C.ivory, h: it.f[2], v: 'middle' });
  img(rp + '/Icon', it.icon, [76, ry + 10, 26, 26], R);
});
// 경험치 막대(트랙 + 채움 · 채움은 스크립트가 FillAmount)
const R2 = [64, 566, 440, 46];
img(ST + '/Left/Row2/Gauge', 'gauge_track', [228, 579, 140, 20], R2);
S.newImage(b, ST + '/Left/Row2/Gauge/Fill', 'gauge_fill_blue', { anchor: 'middle-left', pivot: [0, 0.5], pos: [16, 0], size: [108, 8], type: 3 });
// 스킬 버튼 (SP 에 따라 금 / 파랑 · 스크립트가 바꾼다) + 알림 마름모
const R3 = [64, 620, 440, 46];
const BSK = [376, 625, 120, 36];
ctr(ST + '/Left/Row3/BtnSkill', BSK, R3);
S.image(b, ST + '/Left/Row3/BtnSkill', 'btn_blue_default_sm');
noTransition(ST + '/Left/Row3/BtnSkill');
font(ST + '/Left/Row3/BtnSkill', { font: 'Maple', size: 16, color: C.ivory, h: 'center', v: 'middle' });
img(ST + '/Left/Row3/BtnSkill/Alert', 'badge_alert', [481, 615, 24, 24], BSK, { enable: false });
// 자동 분배 (비활성 그림은 ButtonComponent 전환 + 스크립트가 그림도 바꾼다)
const R4 = [64, 674, 440, 46];
ctr(ST + '/Left/Row4/BtnAuto', [376, 679, 120, 36], R4);
S.button(b, ST + '/Left/Row4/BtnAuto', { normal: 'btn_gold_default_sm', disabled: 'btn_gold_disabled_sm' });
font(ST + '/Left/Row4/BtnAuto', { font: 'Maple', size: 16, color: C.goldInk, h: 'center', v: 'middle' });

// 오른쪽: 소제목 · 남은 AP 칩 · 기본 능력치 4줄 · 전투 능력치 판 + 6줄
txt(ST + '/Right/HeadBasic', '기본 능력치', [522, 238.5, 160, 25], RIGHT, { font: 'Maple', size: 18, color: C.title, h: 'left' });
round(ST + '/Right/ApChip', [918, 239, 98, 24.5], RIGHT, C.gold, 0.12);
txt(ST + '/Right/ApChip/Text', '남은 AP 0', [918, 239, 98, 24.5], [918, 239, 98, 24.5], { font: 'Noto700', size: 16, color: C.gold });
['str', 'dex', 'int', 'luk'].forEach((k, i) => {
  const ry = 274 + 54 * i;
  const R = [522, ry, 494, 46];
  const rp = ST + '/Right/Row' + i;
  ctr(rp, R, RIGHT);
  sprite(rp, { key: 'plate_dark' });
  ctr(rp + '/Chip', [572, ry, 100, 46], R);
  noBg(rp + '/Chip');
  font(rp + '/Chip', { font: 'Noto700', size: 18, color: C.sub, h: 'left', v: 'middle' });
  ctr(rp + '/Cell', [672, ry, 296, 46], R);
  noBg(rp + '/Cell');
  font(rp + '/Cell', { font: 'FootballB', size: 18, color: C.ivory, h: 'left', v: 'middle' });
  ctr(rp + '/BtnPlus', [968, ry + 3, 40, 40], R);
  S.button(b, rp + '/BtnPlus', { normal: 'btn_plus_default', pressed: 'btn_plus_pressed', disabled: 'btn_plus_disabled' });
  font(rp + '/BtnPlus', { text: '' });
  img(rp + '/Icon', 'icon_stat_' + k, [534, ry + 10, 26, 26], R);
});
txt(ST + '/Right/HeadCombat', '전투 능력치', [522, 492.5, 160, 25], RIGHT, { font: 'Maple', size: 18, color: C.title, h: 'left' });
img(ST + '/Right/CombatPane', 'panel_inner', [522, 528, 494, 236], RIGHT);
// 시안 순서: 공격력 · 방어력 · 점프력 · 이동속도 · 명중률 · 회피율 (지금 줄 번호: 4 · 5 · 7 · 6 · 8 · 9 → 점프력과 이동속도 자리만 맞바뀐다)
[[4, 'attack'], [5, 'defense'], [7, 'jump'], [6, 'speed'], [8, 'accuracy'], [9, 'evasion']].forEach(([row, k], slot) => {
  const ry = 538 + 36 * slot;
  const R = [534, ry, 470, 36];
  const rp = ST + '/Right/Row' + row;
  ctr(rp, R, RIGHT);
  if (slot % 2 === 1) sprite(rp, { ruid: ROUND, type: 1, color: '#24468C', alpha: 0.25 });
  ctr(rp + '/Chip', [578, ry, 106, 36], R);
  noBg(rp + '/Chip');
  font(rp + '/Chip', { font: 'Noto700', size: 16, color: C.sub, h: 'left', v: 'middle' });
  ctr(rp + '/Cell', [684, ry, 320, 36], R);
  noBg(rp + '/Cell');
  font(rp + '/Cell', { font: 'FootballB', size: 18, color: C.ivory, h: 'left', v: 'middle' });
  img(rp + '/Icon', 'icon_stat_' + k, [546, ry + 6, 24, 24], R);
});
S.back(b, ST + '/Right/CombatPane'); // 전투 줄들 뒤에 깔린다

// ═══ 장비 칸 (왼쪽 판 400x534) ═══
const EQ = W + '/Content/Equip/SlotArea';
const SA = [64, 236, 400, 534];
ctr(EQ, SA, CONT);
ctr(EQ + '/SlotBg', SA, SA);
S.image(b, EQ + '/SlotBg', 'panel_inner');
// 판 안 캐릭터 미리보기: 스탯 탭 아바타와 같은 컴포넌트 2개를 복사한다(값은 스크립트가 월드 아바타에서 복사).
const AV = EQ + '/SlotBg/Avatar';
if (!S.has(b, AV)) b.empty(AV, { anchor: 'middle-center', pos: [0, 0], rect_size: [160, 240] });
for (const [t, data] of AV_COMPS) if (!b.hasComponent(AV, t)) b.addComponent(AV, t, clone(data));
S.place(b, AV, { anchor: 'middle-center', pivot: [0.5, 0.5], pos: [0, 0], size: [160, 240] });

const SLOTS = { HAT: [80, 252], TOP: [80, 362], BOTTOM: [80, 472], SHOES: [80, 582], WEAPON: [348, 252], SUBWEAPON: [348, 362], GLOVES: [348, 472] };
for (const [name, [x, y]] of Object.entries(SLOTS)) {
  const sp = EQ + '/Slot_' + name;
  const box = [x, y, 100, 100];
  ctr(sp, box, SA);
  S.image(b, sp, 'slot_frame'); // 기본(착용) 모양 · 빈 칸 실루엣 · 마우스 올림 · 잠김은 스크립트가 그림을 바꾼다
  noTransition(sp);
  ctr(sp + '/Icon', [x + 19, y + 12, 62, 62], box);
  ctr(sp + '/SlotLabel', [x, y + 70.5, 100, 19.5], box);
  font(sp + '/SlotLabel', { font: 'Noto700', size: 14, color: C.sub, h: 'center', v: 'middle' });
  img(sp + '/EnhBadge', 'badge_enh_1', [x + 64, y + 2, 34, 34], box, { enable: false });
  if (name === 'BOTTOM') txt(sp + '/LockLabel', '한벌옷', [x, y + 5, 100, 18], box, { font: 'Noto700', size: 13, color: C.gold, enable: false });
}

// ═══ 가방 (오른쪽 판 548x482 · 5열) ═══
const INV = W + '/Content/Inventory';
const BAR = [482, 236, 548, 42];
ctr(INV + '/FilterBar', BAR, CONT);
[['BtnFilterAll', 482, true], ['BtnFilterEquip', 621, false], ['BtnFilterConsume', 760, false], ['BtnFilterMaterial', 899, false]].forEach(([n, x, on]) => {
  const p = INV + '/FilterBar/' + n;
  ctr(p, [x, 236, 131, 42], BAR);
  S.image(b, p, on ? 'chip_gold' : 'chip_blue_dark');
  noTransition(p);
  font(p, { font: 'Noto700', size: 18, color: on ? C.goldInk : C.ivory, h: 'center', v: 'middle' });
});
img(INV + '/Pane', 'panel_inner', [482, 288, 548, 482], CONT);
ctr(INV + '/Grid', [496, 302, 504, 454], CONT);

// 칸 템플릿(GridView 가 복제 · 이것 하나만 고치면 된다)
const T0 = INV + '/ItemTemplate';
const CELL = [700, 302, 96, 96];
S.image(b, T0, 'slot_frame');
noTransition(T0);
ctr(T0 + '/Icon', [713, 319, 62, 62], CELL);
ctr(T0 + '/Count', [728, 373, 60, 22], CELL);
S.font(b, T0 + '/Count', { font: 'FootballB', size: 16, color: C.white, h: 'right', v: 'middle' }); // 수량은 흰 글자 + 어두운 외곽(기존 외곽선 유지)
img(T0 + '/KindBadge', 'kind_equip', [704, 306, 24, 24], CELL);
S.newImage(b, T0 + '/EnhBadge', 'badge_enh_1', { pos: [29, 29], size: [34, 34], enable: false });

// ═══ 툴팁 (장비 칸 · 가방 칸 공용 · 폭 320 · 높이는 스크립트가 내용에 맞춘다) ═══
const T = INV + '/Tooltip';
S.place(b, T, { size: [320, 271] });
S.image(b, T, 'panel_tooltip');
// 아이템 칸: Icon 자체를 프레임으로, 아이템 그림은 새 자식 Item(50x50)에 — 스크립트 tipIcon 이 Item 을 가리킨다.
S.place(b, T + '/Icon', { pos: [16, -14], size: [64, 64], enable: true });
S.image(b, T + '/Icon', 'slot_frame');
b.sprite(T + '/Icon/Item', { anchor: 'middle-center', pos: [0, 0], rect_size: [50, 50], pivot: [0.5, 0.5], image_ruid: DEFAULT_RUID, sprite_type: 0, color: '#FFFFFF', alpha: 1, raycast: false, enable: false });
S.place(b, T + '/Name', { pos: [92, -22], size: [212, 24] });
font(T + '/Name', { font: 'Maple', size: 20, color: C.ivory, h: 'left', v: 'middle' });
S.place(b, T + '/Req', { pos: [92, -50], size: [212, 20] });
font(T + '/Req', { font: 'Noto700', size: 14, color: C.faint, h: 'left', v: 'middle' });
S.place(b, T + '/Desc', { pos: [16, -213], size: [288, 42] });
font(T + '/Desc', { font: 'Noto500', size: 14, color: C.ivory, h: 'left', v: 'top' });
S.newImage(b, T + '/Divider', 'deco_divider', { anchor: 'top-center', pivot: [0.5, 1], pos: [0, -87], size: [288, 14], enable: false });
S.place(b, T + '/StatList', { pos: [0, -110], size: [288, 160] });
for (let i = 0; i < 5; i++) {
  const rp = T + '/StatList/Row' + i;
  S.place(b, rp, { pos: [0, -33 * i], size: [288, 28] });
  sprite(rp, { ruid: ROUND, type: 1, color: C.veil, alpha: 0.35 });
  S.place(b, rp + '/Chip', { pos: [28, 0], size: [82, 28] });
  noBg(rp + '/Chip');
  font(rp + '/Chip', { font: 'Noto700', size: 14, color: C.sub, h: 'left', v: 'middle' });
  S.place(b, rp + '/Cell', { pos: [0, 0], size: [178, 28] });
  noBg(rp + '/Cell');
  font(rp + '/Cell', { font: 'FootballB', size: 16, color: C.ivory, h: 'left', v: 'middle' });
  b.patchComponent(rp + '/Cell', S.TXT, { IsRichText: true }); // 강화(금) · 보석(보라) 색 태그
  b.sprite(rp + '/Icon', { anchor: 'middle-left', pos: [8, 0], rect_size: [18, 18], pivot: [0, 0.5], image_ruid: S.R('icon_stat_attack'), sprite_type: 0, color: '#FFFFFF', alpha: 1, raycast: false });
}

// ═══ 푸터: 메소 · 주화 받침 + 자동획득 ═══
const F = W + '/Footer';
ctr(F, FOOT, WIN);
const MBOX = [64, 782, 339, 56];
ctr(F + '/MesoIcon', MBOX, FOOT);
S.image(b, F + '/MesoIcon', 'plate_dark');
font(F + '/MesoIcon', { text: '' });
img(F + '/MesoIcon/Icon', 'icon_meso', [80, 793, 34, 34], MBOX);
txt(F + '/MesoIcon/Label', '메소', [124, 799, 100, 23], MBOX, { font: 'Noto700', size: 16, color: C.sub, h: 'left' });
ctr(F + '/MesoText', [187, 793, 200, 33.5], FOOT);
font(F + '/MesoText', { font: 'FootballB', size: 24, color: C.ivory, h: 'right', v: 'middle' });
const CBOX = [415, 782, 339, 56];
ctr(F + '/CoinIcon', CBOX, FOOT);
S.image(b, F + '/CoinIcon', 'plate_dark');
font(F + '/CoinIcon', { text: '' });
img(F + '/CoinIcon/Icon', 'icon_victoria_coin', [431, 793, 34, 34], CBOX);
txt(F + '/CoinIcon/Label', '빅토리아 주화', [475, 799, 130, 23], CBOX, { font: 'Noto700', size: 16, color: C.sub, h: 'left' });
ctr(F + '/CoinText', [538, 793, 200, 33.5], FOOT);
font(F + '/CoinText', { font: 'FootballB', size: 24, color: C.ivory, h: 'right', v: 'middle' });
const ABOX = [766, 782, 250, 56];
ctr(F + '/BtnAutoPickup', ABOX, FOOT);
S.image(b, F + '/BtnAutoPickup', 'btn_blue_default');
noTransition(F + '/BtnAutoPickup');
font(F + '/BtnAutoPickup', { font: 'Noto700', size: 18, color: C.ivory, h: 'center', v: 'middle' });
img(F + '/BtnAutoPickup/Magnet', 'icon_magnet', [782, 795, 30, 30], ABOX);
img(F + '/BtnAutoPickup/Toggle', 'toggle_on', [936, 792.5, 64, 35], ABOX);

// ═══ 그리기 순서: 가방 판은 칸 · 칩 뒤 · 툴팁은 칸 위 · 문장은 맨 앞 ═══
S.back(b, INV + '/Pane');
S.front(b, T);
S.front(b, W + '/Crest');

// ═══ 스크립트가 새 칸을 잡게 묶는다 ═══
// 칩 위 글자 대비 규칙(시안 1790844637-7b1e): 기본 상태에서 고른 분류(전체)의 금 칩 글자. 나머지 분류(짙은 파랑 칩)는 대상 아님 — 고르면 InventoryUIController.UpdateFilterChips 가 건다. 맨 끝에 건다.
const touched = S.chipText(b);
console.log('chipText', touched.length, touched.map((t) => t.kind + ':' + t.path.replace('/ui/', '')).join(' '));
b.write(path.join(WORLD, 'ui', 'CharacterGroup.ui'), {
  bind: {
    mlua: path.join(WORLD, 'RootDesk/MyDesk/Stat/StatUIController.mlua'),
    props: {
      expFill: ST + '/Left/Row2/Gauge/Fill',
      skillAlert: ST + '/Left/Row3/BtnSkill/Alert',
      apChipBg: ST + '/Right/ApChip',
      apChipText: ST + '/Right/ApChip/Text',
      avatarPreviewEquip: AV,
    },
  },
});
// 툴팁 아이템 그림은 새 자식 Item 이 받는다(기존 property tipIcon 을 옮겨 묶는다).
b.injectBindings(path.join(WORLD, 'RootDesk/MyDesk/Item/InventoryUIController.mlua'), { tipIcon: T + '/Icon/Item' });
console.log('CharacterGroup 적용 끝 · 엔티티 ' + before + ' → ' + b.listEntities().length);
