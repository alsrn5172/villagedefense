// 방어 시설 관리 창(VillageDefenseGroup)에 디자이너 시안(12-defense)을 입힌다 — 방어선 띠 · 시설 카드 3장 · 요약 칩 · 마을 없음.
// 실행(월드 루트에서): node Docs/tools/design-ui/apply-defense.cjs
// 다시 돌려도 같은 결과가 나온다. 기존 엔티티는 지우지 않고 이름도 안 바꾼다(스크립트가 UUID · 이름으로 잡는다).
// 글자 · 칸 상태는 Npc/VillageDefenseUIController.mlua 가 채운다(이름 경로로 찾는다 · 아래 이름을 바꾸면 안 된다).
//
// 기획 결정(사용자 지시): 방어선 띠 · 카드의 시설 그림은 마을별 RUID 대입 유지(공용 fac_* 로 안 바꾼다) · 주화 부족은 비용 글자만 붉게(버튼 켜짐은 서버 판정) ·
//   억제기 설명 문구는 지금 문구 유지 · 마을 없음 안내는 한 색.
const path = require('path');
const S = require('./skin.cjs');
const WORLD = path.resolve(__dirname, '..', '..', '..');
const b = S.open(WORLD, 'VillageDefenseGroup');
const before = b.listEntities().length;
const C = S.COLOR;

// ── 시안 캔버스 좌표(왼쪽 위 기준 x,y,w,h · 1200x900 캔버스) ──
const WIN = [110, 110, 980, 720];
const CNT = [134, 218, 932, 484];
const FOOT = [114, 714, 972, 112];
const BAND = [210, 132, 780, 64];
const STRIP = [134, 218, 932, 132];
const CARDS = [134, 360, 932, 342];

const at = (r, parent) => S.at(r[0], r[1], r[2], r[3], parent);
const ctr = (p, r, parent, extra) => S.place(b, p, Object.assign({ anchor: 'middle-center', pivot: [0.5, 0.5], pos: at(r, parent), size: [r[2], r[3]] }, extra || {}));
const img = (p, key, r, parent, o) => S.newImage(b, p, key, Object.assign({ pos: at(r, parent), size: [r[2], r[3]] }, o || {}));
const txt = (p, text, r, parent, o) => S.newText(b, p, text, Object.assign({ pos: at(r, parent), rect: [r[2], r[3]] }, o || {}));
const box = (p, r, parent, o) => S.newBox(b, p, Object.assign({ pos: at(r, parent), size: [r[2], r[3]] }, o || {}));
function lab(p, r, parent, fo) { ctr(p, r, parent); S.font(b, p, Object.assign({ outline: false, v: 'middle' }, fo)); }

// ═══════════════════════════════════════════════════════════
// 창틀: 화면 막 · 판 · 문장 · 제목 띠(+ 장식) · 닫기 · 내용 자리
// ═══════════════════════════════════════════════════════════
S.tint(b, 'Dimmer', C.veil, 0.6);
b.patchComponent('Dimmer', S.SPR, { Type: 1 }); // 기본 그림을 Simple 로 두면 안 그려진다(실측)
ctr('Window', WIN, WIN);
S.image(b, 'Window', 'panel_window');

// 제목 띠: 기존 TitleBar 가 띠 그림 + 글자(NPC 이름 "방어 시설 관리인" · 스크립트가 Text 대입). 글자는 가운데 → 아이콘 · 반짝이를 글자 폭(시안 실측 210)에 맞춰 흡수.
ctr('Window/TitleBar', BAND, WIN);
S.image(b, 'Window/TitleBar', 'panel_title_bar');
S.font(b, 'Window/TitleBar', { font: 'Maple', size: 30, color: C.title, h: 'center', v: 'middle', outline: false, shadow: true });
{
  const P = 'Window/TitleBar/Deco';
  box(P, BAND, BAND);
  img(P + '/SparkleL', 'deco_sparkle', [600 - 170 - 9, 155, 18, 18], BAND);
  img(P + '/Icon', 'fac_tower', [600 - 132 - 17, 147, 34, 34], BAND);
  img(P + '/SparkleR', 'deco_sparkle', [600 + 126 - 9, 155, 18, 18], BAND);
}
img('Window/Crest', 'deco_crest', [450, 58, 300, 88], WIN);

ctr('Window/BtnClose', [1018, 138, 52, 52], WIN);
S.button(b, 'Window/BtnClose', { normal: 'btn_close_default', hover: 'btn_close_hover' });
S.font(b, 'Window/BtnClose', { text: '' });

ctr('Window/Content', CNT, WIN);
S.place(b, 'Window/Content/Tower', { size: [CNT[2], CNT[3]] }); // 늘림 앵커 · 저장된 크기 값도 맞춘다

// ═══════════════════════════════════════════════════════════
// 방어선 띠 (Tower/LaneStrip): 안내 한 줄 · 노드 3개(아이콘 틀 · 이름 · 레벨 칩 · 위치 · 체력 게이지 · 수비대 표식) · 화살표 2개
// ═══════════════════════════════════════════════════════════
const T = 'Window/Content/Tower';
const LS = T + '/LaneStrip';
ctr(T + '/Cards', CARDS, CNT);
ctr(LS, STRIP, CNT);
S.image(b, LS, 'panel_inner');
lab(LS + '/Title', [182, 228, 864, 20], STRIP, { font: 'Noto700', size: 14, color: C.faint, h: 'left', text: '미니언은 사냥터2 → 사냥터1 → 마을 순서로 밀고 와요 · 수비대는 맨 앞 시설에 모여요' });
img(LS + '/HelpIcon', 'icon_help', [154, 228, 20, 20], STRIP);
// 진행 화살표: 기존 글자 엔티티(▶)를 그림으로 — 글자를 비우고 자체 스프라이트에 그림을 넣는다
[['ArrowA', 416.5, 277], ['ArrowB', 747.5, 279]].forEach(([n, x, y]) => {
  ctr(`${LS}/${n}`, [x, y, 36, 36], STRIP);
  S.image(b, `${LS}/${n}`, 'icon_advance');
  S.font(b, `${LS}/${n}`, { text: '' });
});
// 노드: 시안 3칸 피치 331 (포탑 154 · 억제기 485 · 넥서스 816) · 230x64
[['TOWER', 154, 105.5], ['SUPPRESSOR', 485, 120], ['CORE', 816, 120]].forEach(([stage, x, chipX]) => {
  const NR = [x, 265, 230, 64];
  const NL = [0, 0, 230, 64];
  const N = `${LS}/Node_${stage}`;
  ctr(N, NR, STRIP);
  img(N + '/IconFrame', 'slot_frame', [0, 2, 60, 60], NL);
  ctr(N + '/Icon', [8, 10, 44, 44], NL); // 그림은 마을별 RUID(스크립트가 대입) — 칸 크기만
  S.before(b, N + '/IconFrame', N + '/Icon');
  lab(N + '/Label', [70, 0, 50, 22.5], NL, { font: 'Maple', size: 16, color: C.ivory, h: 'left' });
  img(N + '/LvChip', 'chip_blue_dark_sm', [chipX, 1, 46, 19.5], NL);
  txt(N + '/LvChip/Text', 'Lv1', [0, 0, 46, 19.5], [0, 0, 46, 19.5], { font: 'FootballB', size: 13, color: C.white });
  img(N + '/MaxChip', 'chip_gold', [chipX, -2, 51, 26], NL, { enable: false });
  txt(N + '/MaxChip/Text', 'MAX', [0, 0, 51, 26], [0, 0, 51, 26], { font: 'Maple', size: 14, color: C.goldInk });
  lab(N + '/Place', [170, 2, 60, 18], NL, { font: 'Noto700', size: 13, color: C.faint, h: 'right' });
  // 체력 게이지: 트랙 + 채움(스크립트가 폭 · 그림 교체 · 안쪽 폭 138)
  ctr(N + '/HpBar', [70, 25, 160, 16], NL);
  S.image(b, N + '/HpBar', 'gauge_track_sm');
  S.place(b, N + '/HpBar/Fill', { pos: [11, 0], size: [138, 6] });
  S.image(b, N + '/HpBar/Fill', 'gauge_fill_green');
  // 수비대 표식(최전방 노드만 · 스크립트가 켠다): 깃발 + 글자, 받침 그림은 끈다
  const MK = [91, 45, 175, 18];
  ctr(N + '/Mark', MK, NL);
  S.tint(b, N + '/Mark', C.white, 0);
  S.font(b, N + '/Mark', { font: 'Noto700', size: 12, color: C.blue, h: 'left', v: 'middle', outline: false }); // 13 · 139 폭에서 "… · 0마리" 가 둘째 줄로 꺾였다(Play 확인 2026-10-01)
  img(N + '/Mark/Flag', 'flag_guard', [70, 44, 17, 20], MK);
});

// ═══════════════════════════════════════════════════════════
// 시설 카드 3장 (Tower/Cards): 302.5x342 · 그림 · 이름 + 레벨 칩 · 체력 게이지 · 설명 · 버튼 3개
// ═══════════════════════════════════════════════════════════
[['TOWER', 134, 35, 103, 148], ['SUPPRESSOR', 448.5, 26, 94, 157.5], ['CORE', 763.5, 26, 94, 157.5]].forEach(([stage, x, frontX, nameX, lvX]) => {
  const CR = [x, 360, 302.5, 342];
  const CL = [0, 0, 302.5, 342];
  const K = `${T}/Cards/Card_${stage}`;
  ctr(K, CR, CARDS);
  S.image(b, K, 'panel_row');
  // 상태 덮개: 최전방 = Sel · 파괴 = Dead (스크립트가 켜고 끈다 · 맨 뒤)
  img(K + '/Sel', 'panel_row_selected', CL, CL, { enable: false });
  img(K + '/Dead', 'panel_row_locked', CL, CL, { enable: false });
  // 시설 그림(마을별 RUID · 스크립트가 대입) + 파괴 잔해
  ctr(K + '/Icon', [118.25, 12, 66, 66], CL);
  img(K + '/Rubble', 'fx_rubble', [91.5, 30, 120, 48], CL, { enable: false });
  // 이름 줄: [최전방 칩] 이름 [레벨 칩 / MAX]
  img(K + '/FrontChip', 'chip_blue', [frontX, 86, 60, 22], CL, { enable: false });
  txt(K + '/FrontChip/Text', '최전방', [0, 0, 60, 22], [0, 0, 60, 22], { font: 'Noto700', size: 13, color: C.white });
  lab(K + '/Name', [nameX, 83, lvX - nameX - 2, 28], CL, { font: 'Maple', size: 20, color: C.ivory, h: 'left' });
  ctr(K + '/LvText', [lvX, 86.5, 51.5, 21], CL);
  S.image(b, K + '/LvText', 'chip_blue_dark_sm');
  S.font(b, K + '/LvText', { font: 'FootballB', size: 14, color: C.white, h: 'center', v: 'middle', outline: false });
  img(K + '/MaxChip', 'chip_gold', [lvX, 83, 59.5, 30], CL, { enable: false });
  txt(K + '/MaxChip/Text', 'MAX', [0, 0, 59.5, 30], [0, 0, 59.5, 30], { font: 'Maple', size: 16, color: C.goldInk });
  // 체력 게이지(트랙 + 채움 · 안쪽 폭 234.5) · 숫자 · 파괴됨
  ctr(K + '/HpBar', [18, 116, 266.5, 26], CL);
  S.image(b, K + '/HpBar', 'gauge_track');
  S.place(b, K + '/HpBar/Fill', { pos: [16, 0], size: [234.5, 12] });
  S.image(b, K + '/HpBar/Fill', 'gauge_fill_green');
  ctr(K + '/HpText', [18, 116, 266.5, 26], CL);
  S.font(b, K + '/HpText', { font: 'FootballB', size: 14, color: C.white, h: 'center', v: 'middle', shadow: true }); // 금색 채움 위 흰 글자가 안 읽혀("21,000" 앞 두 글자) 어두운 그림자를 깐다(Play 확인 2026-10-01)
  txt(K + '/DeadText', '파괴됨', [18, 116, 266.5, 26], CL, { font: 'Maple', size: 14, color: C.coral, enable: false });
  // 설명 줄(넥서스만 붉게)
  lab(K + '/StatText', [18, 147, 266.5, 22], CL, { font: 'Noto700', size: 14, color: stage === 'CORE' ? C.coral : C.sub, h: 'center' });
  // 버튼 3개: 꺼짐/켜짐 그림은 ButtonComponent 전환(서버 판정 canUp / canRep / canReb). 안쪽 = 행동 아이콘 · 이름 · 주화 · 비용 (MAX · 필요 없음 대체)
  const BY = { BtnUpgrade: 214, BtnRepair: stage === 'CORE' ? 292 : 253, BtnRebuild: 292 };
  [['BtnUpgrade', 'act_upgrade', '강화'], ['BtnRepair', 'act_repair', '수리'], ['BtnRebuild', 'act_rebuild', '재건']].forEach(([n, icon, label]) => {
    const BR = [18, BY[n], 266.5, 34];
    const BL = [0, 0, 266.5, 34];
    const B = `${K}/${n}`;
    ctr(B, BR, CL);
    S.button(b, B, { normal: 'btn_gold_default_sm', disabled: 'btn_blue_disabled_sm' });
    S.font(b, B, { text: '' });
    img(B + '/ActIcon', icon, [12, 6, 22, 22], BL);
    txt(B + '/Label', label, [42, 5.75, 60, 22.5], BL, { font: 'Noto700', size: 16, color: C.goldInk, h: 'left' });
    img(B + '/CoinIcon', 'icon_victoria_coin', [212, 7, 20, 20], BL);
    txt(B + '/Cost', '0', [236, 5.75, 30, 22.5], BL, { font: 'FootballB', size: 16, color: C.goldInk, h: 'left' });
    img(B + '/MaxChip', 'chip_gold', [203.5, 4.5, 51, 25], BL, { enable: false });
    txt(B + '/MaxChip/Text', 'MAX', [0, 0, 51, 25], [0, 0, 51, 25], { font: 'Maple', size: 14, color: C.goldInk });
    if (n === 'BtnRepair') txt(B + '/NoNeed', '필요 없음', [203, 8, 60, 18], BL, { font: 'Noto700', size: 13, color: '#9AA6C0', enable: false });
  });
  // 그리기 순서: 덮개(Dead · Sel)는 카드 맨 뒤
  S.back(b, K + '/Dead');
  S.back(b, K + '/Sel');
});

// 통계 줄이 있던 자리: 요약 칩이 대신한다 → 끔(스크립트는 Text 만 대입하므로 죽지 않는다)
S.place(b, T + '/StatusText', { enable: false });

// ═══════════════════════════════════════════════════════════
// 마을 없음 (Tower/NoVillage): 빈 안내 판 — 스크립트가 카드 · 방어선을 끄고 이걸 켠다
// ═══════════════════════════════════════════════════════════
{
  const NV = T + '/NoVillage';
  box(NV, CNT, CNT, { enable: false });
  img(NV + '/Pane', 'panel_inner', [134, 218, 932, 480], CNT);
  [['IconA', 'fac_tower', 498], ['IconB', 'fac_inhibitor', 572], ['IconC', 'fac_nexus', 646]].forEach(([n, key, x]) =>
    img(`${NV}/${n}`, key, [x, 377, 56, 56], CNT, { color: '#9AA0AA', alpha: 0.55 }));
  txt(NV + '/Title', '아직 연결한 마을이 없어요', [435, 445, 330, 33.5], CNT, { font: 'Maple', size: 24, color: C.title });
  txt(NV + '/Line1', '빈 마을의 넥서스를 눌러 마을을 연결하세요', [440, 491, 320, 24], CNT, { font: 'Noto700', size: 16, color: C.sub });
  txt(NV + '/Line2', '10레벨부터 연결할 수 있어요', [440, 515, 320, 24], CNT, { font: 'Noto700', size: 16, color: C.faint });
  S.back(b, NV + '/Pane');
}

// ═══════════════════════════════════════════════════════════
// 바닥 띠 (Footer): 요약 칩 3개(최전방 · 수비대 · 빅토리아 주화) / 마을 없음 안내
// ═══════════════════════════════════════════════════════════
const F = 'Window/Footer';
ctr(F, FOOT, WIN);
// 예전 주 버튼 · 문구는 안 쓴다(클릭도 안 이었다) → 끔
S.place(b, F + '/BtnPrimary', { enable: false });
S.place(b, F + '/CostLabel', { enable: false });
{
  const CH = F + '/Chips';
  box(CH, FOOT, FOOT);
  const c1 = [140, 746.5, 172, 48]; // 칩 폭 · 글자 칸은 게임 글꼴에 맞춰 넓힘: "최전방" · "수비대" · "빅토리아 주화" 가 40 · 85 폭에서 꺾였다(Play 확인 2026-10-01)
  img(CH + '/ChipFront', 'plate_dark', c1, FOOT);
  img(CH + '/ChipFront/Icon', 'flag_guard', [148, 756.5, 28, 28], c1);
  txt(CH + '/ChipFront/Label', '최전방', [184, 760.5, 52, 19.5], c1, { font: 'Noto700', size: 14, color: C.faint, h: 'left' });
  txt(CH + '/ChipFront/Name', '포탑', [242, 758, 66, 25], c1, { font: 'Maple', size: 18, color: C.ivory, h: 'left' });
  const c2 = [322, 746.5, 202, 48];
  img(CH + '/ChipGuard', 'plate_dark', c2, FOOT);
  img(CH + '/ChipGuard/Icon', 'ico_party', [330, 756.5, 28, 28], c2);
  txt(CH + '/ChipGuard/Label', '수비대', [366, 760.5, 52, 19.5], c2, { font: 'Noto700', size: 14, color: C.faint, h: 'left' });
  txt(CH + '/ChipGuard/Val', '0 / 10묶음', [424, 758, 100, 25], c2, { font: 'Maple', size: 18, color: C.ivory, h: 'left' });
  const c3 = [534, 746.5, 222, 48];
  img(CH + '/ChipCoin', 'plate_dark', c3, FOOT);
  img(CH + '/ChipCoin/Icon', 'icon_victoria_coin', [542, 756.5, 28, 28], c3);
  txt(CH + '/ChipCoin/Label', '빅토리아 주화', [578, 760.5, 104, 19.5], c3, { font: 'Noto700', size: 14, color: C.faint, h: 'left' });
  txt(CH + '/ChipCoin/Num', '0', [688, 758, 60, 25], c3, { font: 'FootballB', size: 18, color: C.gold, h: 'left' });
  const NVF = F + '/NoVillage';
  box(NVF, FOOT, FOOT, { enable: false });
  img(NVF + '/Icon', 'icon_info', [140, 758.5, 24, 24], FOOT);
  txt(NVF + '/Text', '마을이 없어요 - 넥서스를 눌러 연결하세요 (10레벨)', [172, 758, 560, 25], FOOT, { font: 'Noto700', size: 18, color: C.sub, h: 'left' });
}

// ═══════════════════════════════════════════════════════════
// 그리기 순서: 문장은 제목 띠보다 뒤(띠가 문장 밑자락을 덮는다)
// ═══════════════════════════════════════════════════════════
S.before(b, 'Window/Crest', 'Window/TitleBar');

b.write(path.join(WORLD, 'ui', 'VillageDefenseGroup.ui'), { lint_verbose: !!process.env.LINT_V });
console.log(`VillageDefenseGroup(방어 시설 관리) 적용 끝 — 새 엔티티 ${b.listEntities().length - before}개`);
