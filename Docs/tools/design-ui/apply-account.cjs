// 계정 창(AccountRecordGroup · "내 기록")에 디자이너 시안(03-account)을 입힌다.
// 실행(월드 루트에서): node Docs/tools/design-ui/apply-account.cjs
// 다시 돌려도 같은 결과가 나온다. 기존 엔티티는 지우지 않고 값만 바꾼다(Grid · Template · Name · Sub · Icon · Desc · Progress · Reward · State · Line1 · Line2 · 탭 · BtnUnequip · Status 는 스크립트가 잡는다).
// 글자를 채우고 상태(그림 켜고 끄기)를 바꾸는 쪽은 Progression/AccountRecordUIController.mlua — 새 칸은 전부 "이름으로 찾는 자식"이라 새 property 는 없다.
// 칸 템플릿(도감 · 업적 · 칭호 · 기록)은 GridView 가 복제하므로 템플릿 1개만 고친다.
const path = require('path');
const S = require('./skin.cjs');
const MAP = require('./ruid-map.json');
const WORLD = path.resolve(__dirname, '..', '..', '..');
const b = S.open(WORLD, 'AccountRecordGroup');
const before = b.listEntities().length;
const C = S.COLOR;

// ── 시안 캔버스 좌표(왼쪽 위 기준 x,y,w,h) ──
const CANVAS = [0, 0, 1200, 900];
const WIN = [50, 90, 1100, 760];
const BAND = [150, 112, 900, 64];
const TB = [471, 123, 300, 42];          // 제목 글자 상자(글자 중심 = 캔버스 x 621)
const TABS = [74, 196, 1052, 56];
const PANE = [74, 264, 1052, 498];       // 탭 아래 안쪽 판(페이지 4개가 같은 자리)
const FOOT = [54, 776, 1092, 70];
const W = 'Window';

const ctr = (p, r, parent, extra) => S.place(b, p, Object.assign({ anchor: 'middle-center', pivot: [0.5, 0.5], pos: S.at(r[0], r[1], r[2], r[3], parent), size: [r[2], r[3]] }, extra || {}));
// 작은 아이콘은 정사각 상자에 "맞춰 넣는다"(시안은 contain) — 가로세로 비가 다른 그림이 찌그러지지 않게 그림 크기 비로 줄인다
function fit(key, r) {
  const m = MAP[key];
  if (!m || m.mode !== 'simple' || !/^(ico_|icon_|flag_|stage_|mon_)/.test(key)) return r;
  const s = Math.min(r[2] / m.size[0], r[3] / m.size[1]);
  const w = Math.round(m.size[0] * s * 2) / 2, h = Math.round(m.size[1] * s * 2) / 2;
  return [r[0] + (r[2] - w) / 2, r[1] + (r[3] - h) / 2, w, h];
}
const img = (p, key, r0, parent, o) => { const r = fit(key, r0); return S.newImage(b, p, key, Object.assign({ pos: S.at(r[0], r[1], r[2], r[3], parent), size: [r[2], r[3]] }, o || {})); };
const txt = (p, text, r, parent, o) => S.newText(b, p, text, Object.assign({ pos: S.at(r[0], r[1], r[2], r[3], parent), rect: [r[2], r[3]] }, o || {}));
const rich = (p) => b.patchComponent(p, S.TXT, { IsRichText: true });
// 기존 글자 한 줄을 시안 자리 · 글꼴로
function text(p, r, parent, o) { ctr(p, r, parent); S.font(b, p, Object.assign({ outline: false, v: 'middle' }, o)); }

// ═══ 창 틀 ═══
S.tint(b, 'Dimmer', C.veil, 0.6);
b.patchComponent('Dimmer', S.SPR, { Type: 1 });
ctr(W, WIN, CANVAS);
S.image(b, W, 'panel_window');
img(W + '/Crest', 'deco_crest', [450, 38, 300, 88], WIN);
img(W + '/Band', 'panel_title_bar', BAND, WIN);

// 제목: 띠는 위 Band, 이 엔티티는 글자만(그림 끔)
ctr(W + '/TitleBar', TB, WIN);
S.tint(b, W + '/TitleBar', C.white, 0);
S.font(b, W + '/TitleBar', { font: 'Maple', size: 30, color: C.title, h: 'center', v: 'middle', outline: false, shadow: true, text: '내 기록' });
img(W + '/TitleBar/TitleIcon', 'ico_scroll', [533.5, 128, 32, 32], TB);
img(W + '/TitleBar/SparkleL', 'deco_sparkle', [503.5, 135, 18, 18], TB);
img(W + '/TitleBar/SparkleR', 'deco_sparkle', [678.5, 135, 18, 18], TB);

ctr(W + '/BtnClose', [1078, 118, 52, 52], WIN);
S.button(b, W + '/BtnClose', { normal: 'btn_close_default', hover: 'btn_close_hover' });
S.font(b, W + '/BtnClose', { text: '' });

// 아래 안내 띠(각 페이지의 Status 글자가 이 위에 놓인다)
img(W + '/Foot', 'plate_dark', FOOT, WIN);

// ═══ 탭 4개: 파랑 버튼 + (고르면 켜지는) 금색 덮개 + 아이콘 + 글자 ═══
ctr(W + '/Tabs', TABS, WIN);
const TAB = [['Tab_collection', 74, 'ico_book', '도감'], ['Tab_achievement', 339, 'ico_trophy', '업적'], ['Tab_title', 604, 'icon_title', '칭호'], ['Tab_history', 869, 'ico_scroll', '기록']];
for (const [name, x, icon, label] of TAB) {
  const T = [x, 196, 257, 56];
  const p = `${W}/Tabs/${name}`;
  ctr(p, T, TABS);
  S.button(b, p, { normal: 'btn_blue_default', pressed: 'btn_blue_pressed' });
  S.font(b, p, { text: '' });
  img(p + '/SelBg', 'btn_gold_default', T, T, { enable: false });
  img(p + '/Icon', icon, [x + 89.5, 211, 26, 26], T);
  txt(p + '/Label', label, [x + 123.5, 196, 80, 56], T, { font: 'Maple', size: 24, color: C.ivory, h: 'left' });
}

// ═══ 안쪽 판 + 페이지 4개 ═══
ctr(W + '/Pages', PANE, WIN);
S.image(b, W + '/Pages', 'panel_inner');
const PAGES = ['Collection', 'Achievement', 'Title', 'History'];
for (const pg of PAGES) ctr(`${W}/Pages/${pg}`, PANE, PANE);

// 세로 스크롤바: 그림만(트랙 · 손잡이). 그리드 오른쪽 20px 을 스크롤바 자리로 비운다.
function grid(p, r, cell, fixed, spacing, padRight, visible) {
  ctr(p, r, PANE);
  b.patchComponent(p, 'MOD.Core.GridViewComponent', {
    CellSize: { x: cell[0], y: cell[1] }, FixedCount: fixed, FixedType: 0, Spacing: { x: spacing[0], y: spacing[1] },
    Padding: { left: 0, right: padRight, top: 0, bottom: 0 }, ScrollBarThickness: 16, ScrollBarVisible: visible,
    ScrollBarBackgroundImageRUID: { DataId: S.R('scroll_track') }, ScrollBarHandleImageRUID: { DataId: S.R('scroll_thumb') },
    ScrollBarBackgroundColor: S.C(C.white, 1), ScrollBarHandleColor: S.C(C.white, 1),
  });
}
// 페이지 아래 안내 줄(아래 띠 위 · 금색 강조는 태그)
function status(p, r, o) {
  text(p, r || [80, 800.5, 1040, 22.5], PANE, Object.assign({ font: 'Noto700', size: 16, color: C.sub, h: 'left' }, o || {}));
  rich(p);
}
// 칸 템플릿 공통: 기본 판 + 켜고 끄는 Sel(고름) · Locked(잠김) 덮개(맨 뒤)
function cellBase(tpl, R, o) {
  S.place(b, tpl, { size: [R[2], R[3]] });
  S.image(b, tpl, 'panel_row');
  if (b.hasComponent(tpl, S.BTN)) b.patchComponent(tpl, S.BTN, { Transition: 0 });
  img(tpl + '/Sel', 'panel_row_selected', R, R, { enable: false });
  if (o && o.locked) img(tpl + '/Locked', 'panel_row_locked', R, R, { enable: false });
}
function cellBack(tpl, locked) { if (locked) S.back(b, tpl + '/Locked'); S.back(b, tpl + '/Sel'); }

// ───────── 도감 ─────────
const CO = W + '/Pages/Collection';
grid(CO + '/Grid', [86, 276, 1030, 474], [160, 148], 6, [10, 10], 20, 0);
status(CO + '/Status');
{
  const R = [86, 276, 160, 148];
  const t = CO + '/Template';
  cellBase(t, R, { locked: true });
  img(t + '/Slot', 'slot_frame', [134, 288, 64, 64], R);
  img(t + '/SlotLocked', 'slot_frame_locked', [134, 288, 64, 64], R, { enable: false });
  ctr(t + '/Icon', [143, 297, 46, 46], R);
  S.tint(b, t + '/Icon', C.white, 1);
  img(t + '/IconUnknown', 'mon_unknown', [146, 300, 40, 40], R, { alpha: 0.55, enable: false });
  text(t + '/Name', [92, 356, 148, 20], R, { font: 'Noto700', size: 16, color: C.ivory, h: 'center' });
  // 긴 이름은 한 줄에 자동 축소(BestFit · 사용자 결정 2026-10-01) — 글자를 자르지 않는다
  b.patchComponent(t + '/Name', S.TXT, { BestFit: true, MinSize: 11, MaxSize: 16, Overflow: 0 });
  text(t + '/Sub', [128, 376, 104, 16.5], R, { font: 'Noto700', size: 13, color: C.sub, h: 'left' });
  rich(t + '/Sub');
  // 단계 아이콘(TierIcon_1~3 · stage_1~3)은 넣지 않는다(사용자 결정 2026-10-01) — 이미 있으면 지운다. Sub 글자 x 는 시안 자리 그대로.
  for (let i = 1; i <= 3; i++) if (S.has(b, `${t}/TierIcon_${i}`)) b.remove(`${t}/TierIcon_${i}`);
  // 🔴 칩 크기 규칙(5차 · skin.cjs): 칩 폭 = 글자 실측 + 2 × (테두리 10 + 여백 4). "자이언트 1"(한 자리) 기준 92 · 왼쪽 끝 124.5 고정. 처치 수가 커지면 컨트롤러가 같은 식으로 다시 잰다.
  const ELW = S.chipWidth('chip_red_dark', 19.5, S.textW('Noto700', 13, '자이언트 1'));
  img(t + '/EliteChip', 'chip_red_dark', [124.5, 392.5, ELW, 19.5], R, { enable: false });
  txt(t + '/EliteChip/Text', '자이언트 1', [0, 0, ELW, 19.5], [0, 0, ELW, 19.5], { font: 'Noto700', size: 13, color: C.white });
  S.before(b, t + '/Slot', t + '/Icon');
  S.before(b, t + '/SlotLocked', t + '/Icon');
  cellBack(t, true);
}

// ───────── 업적 ─────────
const AC = W + '/Pages/Achievement';
grid(AC + '/Grid', [86, 276, 1030, 474], [1010, 88], 1, [0, 10], 20, 0);
status(AC + '/Status');
{
  const R = [86, 276, 1010, 88];
  const t = AC + '/Template';
  cellBase(t, R);
  img(t + '/Slot', 'slot_frame', [116, 296, 48, 48], R);
  img(t + '/TrophyIcon', 'ico_trophy', [125, 306, 30, 28], R);
  text(t + '/Name', [178, 298, 380, 26], R, { font: 'Maple', size: 20, color: C.ivory, h: 'left' });
  text(t + '/Desc', [178, 324, 380, 18], R, { font: 'Noto500', size: 14, color: C.faint, h: 'left' });
  const G = [572, 298, 190, 18];
  img(t + '/Gauge', 'gauge_track', G, R);
  // 채움: 트랙 안쪽 폭 158 · Filled 가로 · 왼쪽에서 시작(스크립트가 FillAmount). 진행 중 = 파랑 · 달성 = 금색
  img(t + '/Gauge/FillBlue', 'gauge_fill_blue', [588, 304, 158, 6], G, { type: 3 });
  img(t + '/Gauge/FillGold', 'gauge_fill_gold', [588, 304, 158, 6], G, { type: 3, enable: false });
  text(t + '/Progress', [572, 320, 190, 22.5], R, { font: 'FootballB', size: 16, color: C.ivory, h: 'center' });
  rich(t + '/Progress');
  // 보상: 경험치 아이콘 + "+N" + 칭호 아이콘 + 칭호 이름(고정 칸 · 글자 길이에 따라 칸 사이가 조금 벌어진다)
  img(t + '/RewardExpIcon', 'icon_account_exp', [858, 298.5, 20, 20], R);
  text(t + '/Reward', [882, 298.5, 36, 20], R, { font: 'Noto700', size: 14, color: C.sub, h: 'left' });
  img(t + '/RewardTitleIcon', 'icon_title', [920, 298.5, 20, 20], R);
  txt(t + '/RewardTitle', '', [944, 298.5, 112, 20], R, { font: 'Noto700', size: 14, color: C.sub, h: 'left', overflow: 1 });
  // 상태: 진행 중 = 파랑 글자 · 달성 = 금색 칩
  text(t + '/State', [966, 322, 90, 19.5], R, { font: 'Noto700', size: 14, color: C.blue, h: 'right' });
  const DNW = S.chipWidth('chip_gold', 19.5, S.textW('Noto700', 13, '달성 · 받음')); // 96 (오른쪽 끝 1056 고정)
  img(t + '/DoneChip', 'chip_gold', [1056 - DNW, 322.5, DNW, 19.5], R, { enable: false });
  txt(t + '/DoneChip/Text', '달성 · 받음', [0, 0, DNW, 19.5], [0, 0, DNW, 19.5], { font: 'Noto700', size: 13, color: C.goldInk });
  cellBack(t, false);
}

// ───────── 칭호 ─────────
const TI = W + '/Pages/Title';
grid(TI + '/Grid', [88, 278, 1024, 400], [334.5, 88], 3, [10, 10], 0, 1);
{
  const R = [88, 278, 334.5, 88];
  const t = TI + '/Template';
  cellBase(t, R, { locked: true });
  img(t + '/IconTitle', 'icon_title', [120, 304, 36, 36], R);
  img(t + '/IconLock', 'icon_lock', [120, 307, 32, 30], R, { alpha: 0.7, enable: false });
  text(t + '/Name', [172, 301, 220.5, 24.5], R, { font: 'Maple', size: 18, color: C.ivory, h: 'left' });
  text(t + '/Sub', [172, 325.5, 220.5, 17.5], R, { font: 'Noto700', size: 13, color: C.sub, h: 'left' });
  cellBack(t, true);
}
ctr(TI + '/BtnUnequip', [912, 692, 200, 56], PANE);
S.button(b, TI + '/BtnUnequip', { normal: 'btn_blue_default', pressed: 'btn_blue_pressed', disabled: 'btn_blue_disabled' });
S.font(b, TI + '/BtnUnequip', { font: 'Maple', size: 20, color: C.ivory, h: 'center', v: 'middle', outline: false, text: '칭호 해제' });
status(TI + '/Status', [118, 708, 770, 24]);
img(TI + '/StatusIcon', 'icon_title', [88, 708, 24, 24], PANE);
txt(TI + '/FootNote', '칭호는 매치 결과 · 마을 통계 · 머리 위 이름표에서 닉네임 위에 작게 붙어요', [80, 800.5, 1040, 22.5], PANE, { font: 'Noto700', size: 16, color: C.sub, h: 'left' });

// ───────── 기록 ─────────
const HI = W + '/Pages/History';
grid(HI + '/Grid', [86, 276, 1030, 474], [1010, 78], 1, [0, 8], 20, 0);
status(HI + '/Status');
{
  const R = [86, 276, 1010, 78];
  const t = HI + '/Template';
  cellBase(t, R);
  for (const d of [1, 3, 5]) img(`${t}/Emblem_${d}`, `emblem_${d}`, [118, 291, 48, 48], R, { enable: false });
  // 날짜 "09/26 21:14" 는 게임 글꼴(Football)이 시안 글꼴보다 넓어 14px 에선 80 안에 안 들어가 두 줄로 꺾인다(2차 묶음 실측) → 13px · 폭 90(순위 글자 274 앞까지)
  text(t + '/Line1', [184, 293, 90, 19.5], R, { font: 'FootballB', size: 13, color: C.faint, h: 'left' });
  txt(t + '/Rank', '', [274, 289, 36, 28], R, { font: 'Maple', size: 20, color: C.ivory, h: 'left' });
  rich(t + '/Rank');
  txt(t + '/RankOf', '', [312, 295, 50, 20], R, { font: 'Maple', size: 14, color: C.faint, h: 'left' });
  // 결과 칩 4종(하나만 켠다)
  // 결과 칩 4종은 같은 자리 · 같은 글자 수 → 같은 폭. 가장 넓은 전원 탈락(빨강 테두리 11)의 규칙 폭 88 로 통일(5차 · 왼쪽 끝 350.5 고정).
  const CHIP = [350.5, 291, S.chipWidth('chip_red', 24, S.textW('Noto700', 13, '전원 탈락')), 24];
  [['ChipBalrog', 'chip_gold', C.goldInk, '발록 처치'], ['ChipTimeout', 'chip_gray', S.CHIP_INK, '시간 종료'], ['ChipAllOut', 'chip_red', C.white, '전원 탈락'], ['ChipLeft', 'chip_gray_dark', '#C9D2E3', '중도 이탈']].forEach(([n, key, col, label]) => {
    img(`${t}/${n}`, key, CHIP, R, { enable: false });
    txt(`${t}/${n}/Text`, label, [0, 0, CHIP[2], CHIP[3]], [0, 0, CHIP[2], CHIP[3]], { font: 'Noto700', size: 13, color: col });
  });
  // 둘째 줄: 심장 · 계정 경험치 · 처치/레벨 · 칭호(고정 칸)
  img(t + '/HeartIcon', 'icon_balrog_heart', [184, 321, 20, 20], R);
  txt(t + '/HeartText', '', [208, 321, 36, 19.5], R, { font: 'Noto700', size: 14, color: C.sub, h: 'left' });
  img(t + '/ExpIcon', 'icon_account_exp', [246, 321, 20, 20], R);
  txt(t + '/ExpText', '', [270, 321, 40, 19.5], R, { font: 'Noto700', size: 14, color: C.sub, h: 'left' });
  text(t + '/Line2', [314, 321, 120, 19.5], R, { font: 'Noto700', size: 14, color: C.faint, h: 'left' });
  img(t + '/TitleIcon', 'icon_title', [440, 322, 18, 18], R, { enable: false });
  txt(t + '/TitleText', '', [462, 321, 160, 19.5], R, { font: 'Noto700', size: 14, color: '#E8C77A', h: 'left', enable: false });
  cellBack(t, false);
}

// ═══ 그리기 순서 ═══
S.back(b, W + '/Band');
S.back(b, W + '/Crest'); // 문장 → 띠 → 제목 글자
S.before(b, W + '/Foot', W + '/Pages'); // 아래 띠가 페이지 안내 글자보다 뒤

// 칩 위 글자 대비 규칙(시안 1790844637-7b1e): 달성 · 발록 처치(금) · 시간 종료(회색) = 잉크색 / 전원 탈락(빨강) = 흰 글자 + 짙은 외곽선. 중도 이탈 · 자이언트(어두운 칩)는 대상 아님. 맨 끝에 건다.
const touched = S.chipText(b);
console.log('chipText', touched.length, touched.map((t) => t.kind + ':' + t.path.replace('/ui/', '')).join(' '));
b.write(path.join(WORLD, 'ui', 'AccountRecordGroup.ui'), { lint_verbose: !!process.env.LINT_V });
console.log(`AccountRecordGroup(계정 창) 적용 끝 — 새 엔티티 ${b.listEntities().length - before}개`);
