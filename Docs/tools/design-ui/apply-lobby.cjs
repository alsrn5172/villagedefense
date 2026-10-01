// 매치 로비(LobbyGroup/Window)에 디자이너 시안(01-lobby)을 입힌다.
// 실행(월드 루트에서): node Docs/tools/design-ui/apply-lobby.cjs
// 다시 돌려도 같은 결과가 나온다. 기존 엔티티는 지우지 않고 값만 바꾼다.
// 방 대기 패널(RoomHud)은 apply-room.cjs 가 맡는다 — 같은 UI 파일을 차례로 고쳐도 서로 덮지 않는다(각자 자기 자식만 만지고, 묶는 property 도 각자 것만).
// 글자를 채우는 쪽은 Match/LobbyUIController.mlua (이름 경로로 찾는다 · 아래 이름을 바꾸면 안 된다).
const path = require('path');
const S = require('./skin.cjs');
const WORLD = path.resolve(__dirname, '..', '..', '..');
const b = S.open(WORLD, 'LobbyGroup');
const before = b.listEntities().length;
const C = S.COLOR;

// ── 시안 캔버스 좌표(왼쪽 위 기준 x,y,w,h) ──
const WIN = [40, 56, 1180, 850];
const BAND = [220, 78, 820, 64];
const BTN_REC = [60, 87, 140, 46];
const MATCH = [64, 168, 470, 600];
const DIFF = [554, 168, 642, 600];
const SEL = [572, 242, 606, 140];
const DESC = [572, 394, 606, 358];
const FOOT = [44, 786, 1172, 116];
const BTN_PRI = [890, 794, 300, 101];
const W = 'Window';

// 기존 엔티티를 가운데 앵커 · 가운데 피벗으로 옮겨 시안 자리에 놓는다.
const ctr = (p, r, parent, extra) => S.place(b, p, Object.assign({ anchor: 'middle-center', pivot: [0.5, 0.5], pos: S.at(r[0], r[1], r[2], r[3], parent), size: [r[2], r[3]] }, extra || {}));
// 새 그림 · 새 글자 (가운데 앵커)
const img = (p, key, r, parent, o) => S.newImage(b, p, key, Object.assign({ pos: S.at(r[0], r[1], r[2], r[3], parent), size: [r[2], r[3]] }, o || {}));
const txt = (p, text, r, parent, o) => S.newText(b, p, text, Object.assign({ pos: S.at(r[0], r[1], r[2], r[3], parent), rect: [r[2], r[3]] }, o || {}));
// 부모 왼쪽 위 기준 배치(설명 판 안쪽 · 줄 수에 따라 스크립트가 y 만 바꾼다): 부모 상자의 (x0,y0) 에서 잰다.
const tl = (x, y, w, h, o0) => ({ anchor: 'top-left', pivot: [0, 1], pos: [x - o0[0], o0[1] - y], size: [w, h] });
const tlImg = (p, key, x, y, w, h, o0, o) => S.newImage(b, p, key, Object.assign(tl(x, y, w, h, o0), o || {}));
const tlTxt = (p, text, x, y, w, h, o0, o) => { const g = tl(x, y, w, h, o0); return S.newText(b, p, text, Object.assign({ anchor: g.anchor, pivot: g.pivot, pos: g.pos, rect: g.size }, o || {})); };
// 단색 판(시안의 세로선 · 가는 금선). 기본 그림을 색으로 칠한다.
function flat(p, r, parent, color, alpha) {
  b.sprite(p, { anchor: 'middle-center', pos: S.at(r[0], r[1], r[2], r[3], parent), rect_size: [r[2], r[3]], pivot: [0.5, 0.5], color, alpha: alpha == null ? 1 : alpha, sprite_type: 0, raycast: false });
}

// 가는 테두리(시안 border=1px): 부모 상자 안(왼쪽 위 기준 w x h)에 단색 선 4개. 둥근 모서리(radius)는 못 한다.
function border(parentPath, w, h, color, alpha) {
  const line = (n, x, y, lw, lh) => b.sprite(`${parentPath}/${n}`, { anchor: 'top-left', pivot: [0, 1], pos: [x, -y], rect_size: [lw, lh], color, alpha: alpha == null ? 1 : alpha, sprite_type: 0, raycast: false });
  line('Top', 0, 0, w, 1);
  line('Bottom', 0, h - 1, w, 1);
  line('Left', 0, 0, 1, h);
  line('Right', w - 1, 0, 1, h);
}

// ═══ 창 판 · 문장 · 제목 띠 · 닫기 · 내 기록 ═══
ctr(W, WIN, WIN);
S.image(b, W, 'panel_window');

img(W + '/Crest', 'deco_crest', [480, 4, 300, 88], WIN);

ctr(W + '/TitleBar', BAND, WIN);
S.image(b, W + '/TitleBar', 'panel_title_bar');
S.font(b, W + '/TitleBar', { font: 'Maple', size: 30, color: C.title, h: 'center', v: 'middle', outline: false, shadow: true });
img(W + '/TitleBar/SparkleL', 'deco_sparkle', [499, 101, 18, 18], BAND);
img(W + '/TitleBar/SparkleR', 'deco_sparkle', [743, 101, 18, 18], BAND);
flat(W + '/TitleBar/LineL', [417, 109, 70, 2], BAND, C.gold, 0.5);
flat(W + '/TitleBar/LineR', [773, 109, 70, 2], BAND, C.gold, 0.5);

ctr(W + '/BtnClose', [1148, 84, 52, 52], WIN);
S.button(b, W + '/BtnClose', { normal: 'btn_close_default', hover: 'btn_close_hover' });
S.font(b, W + '/BtnClose', { text: '' });

// 내 기록: 기능은 AccountRecordUIController 가 이 버튼에 클릭만 건다. 글자는 책 아이콘 오른쪽으로 치우쳐서 자식 Label 이 쓴다.
ctr(W + '/BtnRecord', BTN_REC, WIN);
S.button(b, W + '/BtnRecord', { normal: 'btn_blue_default_sm', pressed: 'btn_blue_pressed', disabled: 'btn_blue_disabled' });
S.font(b, W + '/BtnRecord', { text: '' });
img(W + '/BtnRecord/Icon', 'icon_book', [88.5, 99, 22, 22], BTN_REC);
txt(W + '/BtnRecord/Label', '내 기록', [104, 98, 80, 24], BTN_REC, { font: 'Noto700', size: 18, color: C.ivory });

// ═══ 왼쪽 판: 대기 중인 매치 ═══
const M = W + '/Matches';
ctr(M, MATCH, WIN);
S.image(b, M, 'panel_inner');
img(M + '/HeadIcon', 'icon_users', [82, 190.5, 22, 22], MATCH);
ctr(M + '/MatchTitle', [114, 184.5, 170, 33.5], MATCH);
S.font(b, M + '/MatchTitle', { font: 'Maple', size: 24, color: C.title, h: 'left', v: 'middle', outline: false });
img(M + '/CountChip', 'chip_gray_dark', [270, 189, 34, 25], MATCH, { enable: false });
txt(M + '/CountChip/Text', '0', [0, 0, 34, 25], [0, 0, 34, 25], { font: 'FootballB', size: 14, color: C.white });
txt(M + '/HintText', '', [344, 190.5, 172, 22.5], MATCH, { font: 'Noto400', size: 16, color: C.faint, h: 'right' });

// 빈 목록: 일러스트(액자 380x140 · 시안 s0 #7) + 제목 + 안내 글. 모두 MatchEmpty 아래라 목록이 비었을 때만 같이 켜진다.
// 일러스트 그림은 시안의 CSS cover 대로 가운데를 같은 비율로 잘라 올린 것(empty_match_illust · 760x280) · 액자는 slot_frame 을 위에 얹는다.
const MEB = [199, 560, 200, 54];
ctr(M + '/MatchEmpty', MEB, MATCH);
img(M + '/MatchEmpty/Illu', 'empty_match_illust', [109, 360, 380, 140], MEB);
img(M + '/MatchEmpty/IlluFrame', 'slot_frame', [109, 360, 380, 140], MEB);
// 🔴 액자(slot_frame · 9-slice)는 가운데도 그리므로 뒤의 일러스트를 통째로 덮는다(3차 확인 · A01) → 가운데를 비운 테두리로.
b.patchComponent(M + '/MatchEmpty/IlluFrame', S.SPR, { FillCenter: false });
S.font(b, M + '/MatchEmpty', { font: 'Noto400', size: 18, color: C.faint, h: 'center', v: 'top', outline: false, text: '<color=#E8B64C>★</color> 로 난이도를 골라\n새로 만들 수 있습니다' });
b.patchComponent(M + '/MatchEmpty', S.TXT, { IsRichText: true });
txt(M + '/MatchEmpty/Title', '대기 중인 매치가 없습니다', [149, 516, 300, 33.5], MEB, { font: 'Maple', size: 24, color: C.ivory });

// 매치 한 줄 6개 (이름 MatchRow_i 는 스크립트가 잡는다)
for (let i = 0; i < 6; i++) {
  const R = [82, 242 + 70 * i, 410, 62];
  const P = `${M}/MatchRow_${i}`;
  ctr(P, R, MATCH);
  S.image(b, P, 'panel_row');
  b.patchComponent(P, S.BTN, { Transition: 0 }); // 선택 표시는 Sel 을 켜고 끄는 걸로(그림 교체)
  S.font(b, P, { text: '' });
  img(P + '/Sel', 'panel_row_selected', [82, R[1], 410, 62], R, { enable: false });
  img(P + '/Emblem', 'emblem_1', [94, R[1] + 7, 48, 48], R);
  txt(P + '/Host', '', [152, R[1] + 18.5, 210, 25], R, { font: 'Noto700', size: 18, color: C.ivory, h: 'left', overflow: 2 });
  // 상태 칩: 줄 오른쪽에서 67 안쪽. 가득 참 / 잠김 중 하나만 켠다.
  S.newImage(b, P + '/ChipFull', 'chip_gray_dark', { anchor: 'middle-right', pivot: [1, 0.5], pos: [-67, 0], size: [60, 21], enable: false });
  S.newText(b, P + '/ChipFull/Text', '가득 참', { font: 'Noto700', size: 14, color: C.white, rect: [60, 21] });
  // 🔴 칩 글자 대비(시안 1790844637-7b1e): 보석 칩 글자는 좌우 여백 ≥ 테두리(11)+1. 시안 폭은 Lv 5 = 51.5 · Lv 13 = 60 → 게임 글꼴이 10~15% 넓어 66(안쪽 42)으로.
  S.newImage(b, P + '/ChipLock', 'chip_red', { anchor: 'middle-right', pivot: [1, 0.5], pos: [-67, 0], size: [66, 21], enable: false });
  S.newText(b, P + '/ChipLock/Text', 'Lv 5', { font: 'FootballB', size: 14, color: C.white, rect: [42, 21] });
  txt(P + '/CountNum', '0', [420, R[1] + 14, 30, 33.5], R, { font: 'FootballB', size: 24, color: C.ivory, h: 'right' });
  txt(P + '/CountMax', '/ 5', [449, R[1] + 22, 34, 24], R, { font: 'FootballB', size: 16, color: C.faint, h: 'left' });
  S.back(b, P + '/Sel');
}

// 스크롤 막대(시안 s5 #9): 줄이 6개를 넘을 때만 스크립트가 켜고, 막대 길이 = 보이는 줄 / 전체 줄. 진짜 스크롤은 안 된다(표시용 · 2단계).
// 위쪽 왼쪽 기준(트랙 x512 y242 16x510 · 막대 x514 y242 12x377.5).
const sbTrack = tl(512 - MATCH[0], 242 - MATCH[1], 16, 510, [0, 0]);
S.newImage(b, M + '/ScrollTrack', 'scroll_track', Object.assign({}, sbTrack, { enable: false }));
S.newImage(b, M + '/ScrollThumb', 'scroll_thumb', Object.assign({}, tl(514 - MATCH[0], 242 - MATCH[1], 12, 377.5, [0, 0]), { enable: false }));

// ═══ 오른쪽 판: 난이도 ═══
const D = W + '/Difficulty';
ctr(D, DIFF, WIN);
S.image(b, D, 'panel_inner');
img(D + '/HeadIcon', 'icon_star', [572, 190.5, 22, 22], DIFF);
ctr(D + '/DiffTitle', [604, 184.5, 120, 33.5], DIFF);
S.font(b, D + '/DiffTitle', { font: 'Maple', size: 24, color: C.title, h: 'left', v: 'middle', outline: false });
txt(D + '/HeadHint', '새 매치 만들기', [978, 190.5, 200, 22.5], DIFF, { font: 'Noto400', size: 16, color: C.faint, h: 'right' });

// 안 쓰게 된 것은 끄고 남긴다(스크립트가 UUID 로 잡고 있다): 통글 설명 · 옛 심장 글 · ★ 버튼 5개 · 옛 엠블럼 자리
S.place(b, D + '/DiffDesc', { enable: false });
S.place(b, D + '/HeartLabel', { enable: false });
for (let s = 1; s <= 5; s++) S.place(b, `${D}/Star_${s}`, { enable: false });
S.place(b, D + '/Select/Emblem', { enable: false });

// 난이도 카드 3장 (Row_1 · Row_3 · Row_5 는 스크립트가 잡는다 · 선택 그림은 Sel 켜고 끄기)
ctr(D + '/Select', SEL, DIFF);
[1, 3, 5].forEach((d, k) => {
  const x0 = 572 + 205.5 * k;
  const CARD = [x0, 242, 195.5, 140];
  const P = `${D}/Select/Row_${d}`;
  ctr(P, CARD, SEL);
  S.image(b, P, 'panel_row');
  b.patchComponent(P, S.BTN, { Transition: 0 });
  S.font(b, P, { text: '' });
  S.place(b, P + '/Cost', { anchor: 'middle-center', pivot: [0.5, 0.5], pos: [64, -41], size: [30, 25] });
  S.font(b, P + '/Cost', { font: 'FootballB', size: 18, color: C.ivory, h: 'right', v: 'middle', outline: false, text: String(d) });
  img(P + '/Sel', 'panel_row_selected', CARD, CARD, { enable: false });
  img(P + '/Emblem', `emblem_${d}`, [x0 + 24, 254, 64, 64], CARD);
  txt(P + '/Name', '', [x0 + 24, 336.5, 110, 34], CARD, { font: 'Maple', size: 24, color: C.ivory, h: 'left' });
  img(P + '/CostIcon', 'icon_balrog_heart', [x0 + 138.5, 341, 24, 24], CARD);
  img(P + '/Check', 'check_on', [x0 + 175.5, 234, 28, 28], CARD, { enable: false });
  // 오른쪽 위 칩: 추천 / 잠김 중 하나만
  // 🔴 칩 글자 대비: 시안 폭 추천 50 · 잠김 Lv 5 69.5 / Lv 13 78 (글자 폭 + 2 × (테두리 + 1)). 게임 글꼴이 10~15% 넓어 추천 54(안쪽 32) · 잠김 84(안쪽 60: 자물쇠 18 + 틈 3 + 글자 39)로.
  S.newImage(b, P + '/ChipRec', 'chip_gold', { anchor: 'top-right', pivot: [1, 1], pos: [-18, -12], size: [54, 25], enable: false });
  S.newText(b, P + '/ChipRec/Text', '추천', { font: 'Noto700', size: 14, color: C.goldInk, rect: [32, 25] });
  S.newImage(b, P + '/ChipLock', 'chip_red', { anchor: 'top-right', pivot: [1, 1], pos: [-18, -12], size: [84, 25], enable: false });
  S.newImage(b, P + '/ChipLock/Lock', 'icon_lock', { pos: [-21, 0], size: [18, 18] });
  S.newText(b, P + '/ChipLock/Text', 'Lv 5', { font: 'FootballB', size: 14, color: C.white, pos: [10.5, 0], rect: [39, 25] });
  S.back(b, P + '/Sel');
});

// 설명 판 세 가지 (스크립트가 하나만 켠다): 빈 판 · 새 매치 · 고른 매치
const DE = D + '/DescEmpty';
img(DE, 'slot_item_drag', DESC, DIFF);
img(DE + '/Emblem', 'emblem_empty', [819, 482, 112, 112], DESC);
txt(DE + '/T1', '난이도를 고르면 설명이 여기 나와요', [705, 604, 340, 28], DESC, { font: 'Maple', size: 20, color: C.sub });
txt(DE + '/T2', '왼쪽 목록에서 매치를 골라 참여할 수도 있어요', [705, 642, 340, 22.5], DESC, { font: 'Noto400', size: 16, color: C.faint });

const O0 = [572, 394]; // 설명 판 왼쪽 위
const DN = D + '/DescNew';
img(DN, 'panel_inner', DESC, DIFF, { enable: false });
tlImg(DN + '/Emblem', 'emblem_1', 590, 410, 48, 48, O0);
// 제목은 왼쪽 정렬(시안 x 648). 난이도 칩(쉬움/보통/매우 어려움)은 사용자 결정(2026-10-01)으로 아예 없앴다 → 이전 판에 있던 노드도 지운다.
tlTxt(DN + '/Title', '', 648, 417, 520, 33.5, O0, { font: 'Maple', size: 24, color: C.ivory, h: 'left' });
if (S.has(b, DN + '/HardChip')) b.remove(DN + '/HardChip');
tlTxt(DN + '/Intro', '', 590, 468, 570, 25, O0, { font: 'Noto400', size: 18, color: C.ivory, h: 'left', overflow: 2 });
[507, 537.5, 567.5, 598, 628].forEach((y, i) => {
  tlImg(`${DN}/BulletIcon_${i}`, 'icon_plus', 590, y, 18, 18, O0, { enable: false });
  tlTxt(`${DN}/BulletText_${i}`, '', 616, y - 4, 520, 25, O0, { font: 'Noto400', size: 18, color: C.ivory, h: 'left', overflow: 2, enable: false });
});
// 보상 · 권장: 줄 수에 따라 스크립트가 y 를 내린다(처음 자리는 2줄 기준)
tlTxt(DN + '/RewardLabel', '보상', 590, 571, 40, 22.5, O0, { font: 'Noto700', size: 16, color: C.faint, h: 'left' });
// 보상 칩 문구 = DifficultyRule.csv REWARD ("발록의 심장 최대 N개 · 계정 경험치 최대 M") — 게임 글꼴이 시안보다 넓어 칩 폭을 196 / 190 으로 넉넉히.
tlImg(DN + '/RewardChip_0', 'plate_dark', 627.5, 569, 196, 26.5, O0);
S.newText(b, DN + '/RewardChip_0/Text', '', { font: 'Noto700', size: 16, color: C.ivory, rect: [196, 26.5] });
tlImg(DN + '/RewardChip_1', 'plate_dark', 831.5, 569, 190, 26.5, O0);
S.newText(b, DN + '/RewardChip_1/Text', '', { font: 'Noto700', size: 16, color: C.ivory, rect: [190, 26.5] });
// 권장 줄 테두리(시안: 1px #2E3F63 · 570x33.5). 줄 수에 따라 스크립트가 y 를 내린다(보상 줄 + 34).
const TB = DN + '/TipBox';
S.newBox(b, TB, Object.assign(tl(590, 605, 570, 33.5, O0), {}));
border(TB, 570, 33.5, '#2E3F63', 1);
tlImg(DN + '/TipIcon', 'icon_info', 590, 619.5, 18, 18, O0);
tlTxt(DN + '/TipText', '', 616, 616.5, 544, 44, O0, { font: 'Noto400', size: 16, color: C.faint, h: 'left', v: 'top' });
S.back(b, TB);

const DM = D + '/DescMatch';
img(DM, 'panel_inner', DESC, DIFF, { enable: false });
tlTxt(DM + '/Title', '선택한 매치', 590, 410, 570, 33.5, O0, { font: 'Maple', size: 24, color: C.ivory, h: 'left' });
tlImg(DM + '/HostIcon', 'icon_crown', 590, 458, 20, 20, O0);
tlTxt(DM + '/HostLabel', '주인', 616, 455.5, 40, 25, O0, { font: 'Noto400', size: 18, color: C.ivory, h: 'left' });
tlTxt(DM + '/HostName', '', 659, 455.5, 480, 25, O0, { font: 'Noto700', size: 18, color: C.ivory, h: 'left', overflow: 2 });
tlImg(DM + '/CountIcon', 'icon_users', 590, 491.5, 20, 20, O0);
tlTxt(DM + '/CountText', '', 616, 489, 540, 25, O0, { font: 'Noto400', size: 18, color: C.ivory, h: 'left' });
tlImg(DM + '/CostIcon', 'icon_balrog_heart', 590, 522.5, 24, 24, O0);
tlTxt(DM + '/CostText', '', 618, 522, 540, 25, O0, { font: 'Noto700', size: 18, color: C.ivory, h: 'left' });
// 권장 줄 테두리: 고른 매치 판은 높이가 358 이라 시안(y729)보다 위(703)에 둔다. 글이 있을 때만 스크립트가 켠다.
S.newBox(b, DM + '/TipBox', tl(590, 703, 570, 33.5, O0));
border(DM + '/TipBox', 570, 33.5, '#2E3F63', 1);
tlImg(DM + '/TipIcon', 'icon_info', 590, 717, 18, 18, O0);
tlTxt(DM + '/TipText', '', 616, 714, 544, 25, O0, { font: 'Noto400', size: 16, color: C.faint, h: 'left', overflow: 2 });
S.back(b, DM + '/TipBox');

// ═══ 바닥 띠 ═══
const F = W + '/Footer';
ctr(F, FOOT, WIN);
// 시안 배경은 그라데이션 + 금 1px 테두리(#E9B24A 35%). 그라데이션은 못 해서 단색 반투명 판(#0E1628) + 가는 금선 4개로.
flat(F + '/BgPlate', FOOT, FOOT, C.navy900, 0.5);
flat(F + '/LineTop', [44, 786, 1172, 1], FOOT, '#E9B24A', 0.35);
flat(F + '/LineBottom', [44, 901, 1172, 1], FOOT, '#E9B24A', 0.35);
flat(F + '/LineLeft', [44, 786, 1, 116], FOOT, '#E9B24A', 0.35);
flat(F + '/LineRight', [1215, 786, 1, 116], FOOT, '#E9B24A', 0.35);
['LineRight', 'LineLeft', 'LineBottom', 'LineTop', 'BgPlate'].forEach((n) => S.back(b, F + '/' + n)); // 판 → 선 순서로 맨 뒤
const HP = [70, 818.5, 52, 52];
img(F + '/HeartPlate', 'plate_dark', HP, FOOT);
img(F + '/HeartPlate/Icon', 'icon_balrog_heart', [78, 826.5, 36, 36], HP);
txt(F + '/HeartCap', '발록의 심장', [132, 821.5, 100, 19], FOOT, { font: 'Noto700', size: 16, color: C.faint, h: 'left' });
txt(F + '/HeartCount', '× 0', [132, 841, 100, 26.5], FOOT, { font: 'FootballB', size: 24, color: C.ivory, h: 'left' });
flat(F + '/Div1', [232, 818.5, 1, 52], FOOT, '#2E3F63', 1);

img(F + '/AccBadge', 'badge_account', [255, 811.5, 84, 66], FOOT);
const LVC = [314, 857.5, 30, 24];
img(F + '/AccLvChip', 'chip_gold_sm', LVC, FOOT);
// 🔴 칩 글자 대비: chip_gold_sm 테두리 7 → 안쪽 폭 14. 두 자리 레벨은 스크립트(PaintAccount)가 칩 37 · 안쪽 21 로 넓힌다(시안 1 → 28 · 13 → 37).
S.newText(b, F + '/AccLvChip/Text', '1', { font: 'FootballB', size: 16, color: C.goldInk, rect: [14, 24] });
txt(F + '/AccXpLabel', '계정 경험치', [351, 820.5, 100, 22.5], FOOT, { font: 'Noto700', size: 16, color: C.faint, h: 'left' });
txt(F + '/AccXpText', '0 / 80', [451, 820.5, 100, 22.5], FOOT, { font: 'FootballB', size: 16, color: C.sub, h: 'right' });
img(F + '/AccGauge', 'gauge_track', [351, 848.5, 200, 20], FOOT);
// 채움은 Filled 가로 · 왼쪽에서 시작. 트랙 안쪽 폭 168 (시안 200 은 100% 에서 트랙 밖으로 32 넘친다)
S.newImage(b, F + '/AccGauge/Fill', 'gauge_fill_gold', { anchor: 'middle-left', pivot: [0, 0.5], pos: [16, 0], size: [168, 8], type: 3 });
flat(F + '/Div2', [573, 818.5, 1, 52], FOOT, '#2E3F63', 1);

// 안내: 아이콘 3종(정보 · 심장 · 자물쇠) 중 하나 + 글 두 줄
img(F + '/NoteInfo', 'icon_info', [596, 834.5, 20, 20], FOOT);
img(F + '/NoteHeart', 'icon_balrog_heart', [596, 834.5, 20, 20], FOOT, { enable: false });
img(F + '/NoteLock', 'icon_lock', [596, 834.5, 20, 20], FOOT, { enable: false });
ctr(F + '/CostLabel', [624, 821.5, 250, 24.5], FOOT);
S.font(b, F + '/CostLabel', { font: 'Noto700', size: 18, color: C.sub, h: 'left', v: 'middle', outline: false });
txt(F + '/CostLabel2', '', [624, 846, 250, 21.5], FOOT, { font: 'Noto500', size: 16, color: C.faint, h: 'left', enable: false });

// 주 버튼: 늘리지 않는 고정 비율 그림. 아이콘이 있을 땐 글자가 오른쪽으로 19 치우친다(시안) → 자식 Label. 아이콘 위치는 글자 수에 따라 달라 3개를 미리 깔아 둔다.
const BP = F + '/BtnPrimary';
ctr(BP, BTN_PRI, FOOT);
S.button(b, BP, { normal: 'btn_cta_default', pressed: 'btn_cta_pressed', disabled: 'btn_cta_disabled' });
S.font(b, BP, { font: 'Maple', size: 24, color: '#E4E8EF', h: 'center', v: 'middle', outline: false, text: '매치 선택' });
S.newText(b, BP + '/Label', '', { font: 'Maple', size: 24, color: C.goldInk, pos: [19, -3], rect: [200, 34] });
S.newImage(b, BP + '/IconMake', 'icon_sword_gold', { pos: [-63.5, -3], size: [30, 30], enable: false });
S.newImage(b, BP + '/IconJoin', 'icon_sword_gold', { pos: [-49, -3], size: [30, 30], enable: false });
S.newImage(b, BP + '/IconLock', 'icon_lock', { pos: [-27, -3], size: [30, 30], enable: false });

// ═══ 그리기 순서: 문장은 제목 띠보다 뒤(시안도 띠가 문장 밑자락을 덮는다) ═══
S.before(b, W + '/Crest', W + '/TitleBar');

// 🔴 칩 글자 대비(시안 1790844637-7b1e): 밝은 칩 = 잉크 글자 · 보석 칩 = 흰 글자 + 외곽선. 글자를 다 맞춘 뒤에 건다(두 번 돌려도 같은 결과).
const touched = S.chipText(b);
console.log('chipText', touched.length, touched.map((t) => t.kind + ':' + t.path.replace('/ui/', '')).join(' '));

b.write(path.join(WORLD, 'ui', 'LobbyGroup.ui'), {
  bind: {
    mlua: path.join(WORLD, 'RootDesk/MyDesk/Match/LobbyUIController.mlua'),
    props: { heartLabel: F + '/HeartCount' },
  },
  lint_verbose: !!process.env.LINT_V,
});
console.log(`LobbyGroup(로비) 적용 끝 — 새 엔티티 ${b.listEntities().length - before}개`);
