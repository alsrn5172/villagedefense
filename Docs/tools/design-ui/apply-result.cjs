// 매치 결과 창(MatchResultGroup)에 디자이너 시안(17-result)을 입힌다 — 창틀 · 사유 칩 · 표 머리줄 · 순위 5줄 · 내 보상 띠 · 로비로 버튼.
// 실행(월드 루트에서): node Docs/tools/design-ui/apply-result.cjs
// 다시 돌려도 같은 결과가 나온다. 기존 엔티티는 지우지 않고 이름도 안 바꾼다(Match/MatchResultUIController.mlua 가 UUID · 이름으로 잡는다).
//
// 줄 상태 그림(기본 · 내 줄 · 탈락 · 빈 줄)과 순위 칩(금 · 은 · 동)은 스프라이트를 갈아 끼우지 않고
// "겹쳐 깔아 둔 그림을 켜고 끄는" 방식이다 — 컨트롤러가 Enable 만 만진다.
//   - 덮는 그림은 S.back 으로 형제 맨 뒤(글자 밑)에 깐다.
//   - 보상은 서버가 준 한 줄 글 그대로(RewardText) 보여 주고, 칸(slot_frame) 두 개는 "심장 · 경험치" 아이콘 표식으로만 둔다.
const path = require('path');
const S = require('./skin.cjs');
const WORLD = path.resolve(__dirname, '..', '..', '..');
const b = S.open(WORLD, 'MatchResultGroup');
const C = S.COLOR;

// ── 시안 캔버스 좌표(왼쪽 위 기준 x,y,w,h · 1200x900 캔버스) ──
const WIN = [110, 100, 980, 700];
const BAND = [198, 122, 804, 64];
const HEAD = [146, 244, 908, 40];
const ROWS = [146, 294, 908, 352];
const ROWBOX = [146, 294, 908, 64];      // 첫 줄(나머지 줄은 같은 모양 · 세로로 72씩)
const MYREW = [146, 662, 908, 96];
const at = (r, parent) => S.at(r[0], r[1], r[2], r[3], parent);
const ctr = (p, r, parent, extra) => S.place(b, p, Object.assign({ anchor: 'middle-center', pivot: [0.5, 0.5], pos: at(r, parent), size: [r[2], r[3]] }, extra || {}));
const noBg = (p) => S.tint(b, p, C.white, 0);
const W = 'Window';

// ═══════════════════════════════════════════════════════════
// 화면 막 · 창틀
// ═══════════════════════════════════════════════════════════
S.tint(b, 'Bg', C.veil, 0.85);
b.patchComponent('Bg', S.SPR, { Type: 1 }); // 기본 그림을 Simple 로 두면 안 그려진다(실측)
S.place(b, W, { pos: [0, 0], size: [980, 700] }); // 켜짐 여부(Enable)는 컨트롤러가 정한다 — 건드리지 않는다
S.image(b, W, 'panel_window');

// 제목 띠: TitleBar 엔티티가 그림과 글자("매치 결과" · 컨트롤러가 Text 대입)를 같이 가진다.
ctr(W + '/TitleBar', BAND, WIN);
S.image(b, W + '/TitleBar', 'panel_title_bar');
S.font(b, W + '/TitleBar', { font: 'Maple', size: 30, color: C.title, h: 'center', v: 'middle', outline: false, shadow: true });
S.newImage(b, W + '/TitleBar/SparkleL', 'deco_sparkle', { pos: at([510.5, 145, 18, 18], BAND), size: [18, 18] });
S.newImage(b, W + '/TitleBar/SparkleR', 'deco_sparkle', { pos: at([671.5, 145, 18, 18], BAND), size: [18, 18] });

S.newImage(b, W + '/Crest', 'deco_crest', { pos: at([450, 48, 300, 88], WIN), size: [300, 88] });

// ═══════════════════════════════════════════════════════════
// 결과 사유: 칩(승리 금 · 시간 종료 회 · 전원 탈락 빨강) + 문장. 칩 셋을 깔아 두고 컨트롤러가 하나만 켜고
// 칩 폭(글자 폭 + 24 · 최소 53.5 · 시안 1790844637-7b1e 로 +2) + 12 + 문장 폭을 재서 가운데로 놓는다(세로는 같은 줄: 창 중심 위로 230).
// ═══════════════════════════════════════════════════════════
const CHIPY = at([439, 206, 51.5, 28], WIN)[1];
// 🔴 칩 크기 규칙(5차 · skin.cjs): 칩 폭 = 글자 실측(Maple 16) + 2 × (테두리 + 여백 5 · 높이 28) → 승리 60 · 시간 종료 94 · 전원 탈락 98. 컨트롤러(ApplyReason)가 같은 식으로 다시 잰다.
for (const [name, key, label, ink] of [['ReasonChipWin', 'chip_gold', '승리', C.goldInk], ['ReasonChipTime', 'chip_gray', '시간 종료', C.goldInk], ['ReasonChipOut', 'chip_red', '전원 탈락', C.white]]) {
  const w = S.chipWidth(key, 28, S.textW('Maple', 16, label));
  S.newImage(b, W + '/' + name, key, { pos: [0, CHIPY], size: [w, 28], enable: name === 'ReasonChipTime' });
  S.newText(b, W + '/' + name + '/Text', label, { font: 'Maple', size: 16, color: ink, pos: [0, 0], rect: [w, 28] });
}
// 기존 문장 글자(컨트롤러가 Text 대입 · 위치는 칩과 함께 런타임에 잡는다)
S.place(b, W + '/ReasonText', { anchor: 'middle-center', pivot: [0.5, 0.5], pos: [0, CHIPY], size: [400, 30] });
S.font(b, W + '/ReasonText', { font: 'Noto700', size: 18, color: C.ivory, h: 'left', v: 'middle', outline: false });

// ═══════════════════════════════════════════════════════════
// 표 머리줄
// ═══════════════════════════════════════════════════════════
ctr(W + '/RankHeader', HEAD, WIN);
S.image(b, W + '/RankHeader', 'plate_dark');
const heads = [
  ['H_Rank', [158, 254, 64, 20], 'center', '순위'],
  ['H_Name', [228, 254, 326, 20], 'left', '칭호 · 이름'],
  ['H_Damage', [560, 254, 124, 20], 'right', '발록 피해'],
  ['H_CoreHp', [690, 254, 116, 20], 'right', '넥서스 HP'],
  ['H_Level', [812, 254, 60, 20], 'right', '레벨'],
  ['H_Kills', [878, 254, 84, 20], 'right', '처치'],
];
for (const [n, r, h, text] of heads) {
  ctr(W + '/RankHeader/' + n, r, HEAD);
  S.font(b, W + '/RankHeader/' + n, { font: 'Noto700', size: 14, color: C.sub, h, v: 'middle', text, outline: false });
}
S.newText(b, W + '/RankHeader/H_State', '상태', { font: 'Noto700', size: 14, color: C.sub, h: 'right', pos: at([968, 254, 70, 20], HEAD), rect: [70, 20] });

// ═══════════════════════════════════════════════════════════
// 순위 5줄(미리 깔린 5개 · 컨트롤러가 이름으로 찾는다 · 전부 같은 값)
// ═══════════════════════════════════════════════════════════
ctr(W + '/RankRows', ROWS, WIN);
const DMG = at([560, 313.5, 124, 25], ROWBOX);
for (let i = 0; i < 5; i++) {
  const R = W + '/RankRows/RankRow_' + i;
  const rowY = 294 + 72 * i;
  ctr(R, [146, rowY, 908, 64], ROWS, { enable: true });
  noBg(R); // 받침은 겹친 그림이 맡는다

  // 기존 칸(글자)
  ctr(R + '/Rank', [168, 310.5, 44, 31], ROWBOX);
  S.font(b, R + '/Rank', { font: 'FootballB', size: 18, color: C.sub, h: 'center', v: 'middle', outline: false });
  S.place(b, R + '/Name', { anchor: 'middle-left', pivot: [0, 0.5], pos: [82, 0], size: [326, 30] });
  S.font(b, R + '/Name', { font: 'Noto700', size: 18, color: C.ivory, h: 'left', v: 'middle', overflow: 1, outline: false });
  ctr(R + '/Damage', [560, 313.5, 124, 25], ROWBOX);
  S.font(b, R + '/Damage', { font: 'FootballB', size: 18, color: C.ivory, h: 'right', v: 'middle', outline: false });
  ctr(R + '/CoreHp', [690, 313.5, 116, 25], ROWBOX);
  S.font(b, R + '/CoreHp', { font: 'FootballB', size: 18, color: C.ivory, h: 'right', v: 'middle', outline: false });
  ctr(R + '/Level', [812, 313.5, 60, 25], ROWBOX);
  S.font(b, R + '/Level', { font: 'FootballB', size: 18, color: C.ivory, h: 'right', v: 'middle', outline: false });
  ctr(R + '/Kills', [878, 313.5, 84, 25], ROWBOX);
  S.font(b, R + '/Kills', { font: 'FootballB', size: 18, color: C.ivory, h: 'right', v: 'middle', outline: false });
  // 🔴 칩 크기 규칙(5차): 탈락 칩 = 역할표 elim(60×25 · 오른쪽 끝 1038 고정). 글자는 칩의 자식이 아니라 형제(EliminatedMark) → chipText extra.
  const ELB = S.roleBox('elim');
  ctr(R + '/EliminatedMark', [1038 - ELB[0], 313.5, ELB[0], ELB[1]], ROWBOX);
  S.font(b, R + '/EliminatedMark', { font: 'Noto700', size: 14, color: C.white, h: 'center', v: 'middle', outline: false });

  // 새 글자 · 그림(컨트롤러가 켜고 끈다 · 기본은 꺼 둠)
  S.newText(b, R + '/CoreHpBroken', '파괴', { font: 'Maple', size: 18, color: '#FF8A7A', h: 'right', pos: at([690, 313.5, 116, 25], ROWBOX), rect: [116, 25], enable: false });
  S.newText(b, R + '/TitleLine', '', { font: 'Noto700', size: 14, color: '#E8C77A', h: 'left', overflow: 1, anchor: 'middle-left', pivot: [0, 0.5], pos: [82, 10.5], rect: [326, 23], enable: false });
  S.newImage(b, R + '/Crown', 'icon_crown', { anchor: 'middle-left', pivot: [0, 0.5], pos: [82, 0], size: [28, 26], enable: false });
  // 🔴 칩 크기 규칙(5차): "나" = 역할표 me(44×21 · 방 줄과 같은 크기). 스크립트(PlaceNode)도 같은 폭으로 놓는다.
  const MEB = S.roleBox('me');
  S.newImage(b, R + '/MeChip', 'chip_blue', { anchor: 'middle-left', pivot: [0, 0.5], pos: [200, 0], size: [MEB[0], MEB[1]], enable: false });
  S.newText(b, R + '/MeChip/Text', '나', { font: 'Noto700', size: 14, color: C.white, pos: [0, 0], rect: [MEB[0], MEB[1]] });
  S.newText(b, R + '/EmptyText', '빈 자리', { font: 'Noto700', size: 14, color: C.off, pos: [0, 0], rect: [908, 30], enable: false });

  // 깔아 두는 그림: 순위 칩 셋 · 탈락 칩 · 줄 바탕 넷(맨 뒤 → 글자 밑)
  const chipPos = at([168, 310.5, 44, 31], ROWBOX);
  S.newImage(b, R + '/RankChipGold', 'chip_gold', { pos: chipPos, size: [44, 31], enable: false });
  S.newImage(b, R + '/RankChipGray', 'chip_gray', { pos: chipPos, size: [44, 31], enable: false });
  S.newImage(b, R + '/RankChipDark', 'chip_gold_dark', { pos: chipPos, size: [44, 31], enable: false });
  S.newImage(b, R + '/ElimChip', 'chip_red', { pos: at([1038 - ELB[0], 313.5, ELB[0], ELB[1]], ROWBOX), size: [ELB[0], ELB[1]], enable: false });
  S.newImage(b, R + '/BgRow', 'panel_row', { pos: [0, 0], size: [908, 64], enable: true });
  S.newImage(b, R + '/BgSel', 'panel_row_selected', { pos: [0, 0], size: [908, 64], enable: false });
  S.newImage(b, R + '/BgLock', 'panel_row_locked', { pos: [0, 0], size: [908, 64], alpha: 0.75, enable: false });
  S.newImage(b, R + '/BgEmpty', 'slot_item_drag', { pos: [0, 0], size: [908, 64], alpha: 0.35, enable: false });
  // 나중에 부른 것이 맨 뒤 → 줄 바탕이 가장 뒤, 그 위에 칩
  for (const n of ['ElimChip', 'RankChipDark', 'RankChipGray', 'RankChipGold', 'BgEmpty', 'BgLock', 'BgSel', 'BgRow']) S.back(b, R + '/' + n);
}

// ═══════════════════════════════════════════════════════════
// 내 보상 띠: 서버가 준 한 줄 글(RewardText) + 아이콘 표식 칸 둘 · 로비로 버튼
// ═══════════════════════════════════════════════════════════
ctr(W + '/MyReward', MYREW, WIN);
S.image(b, W + '/MyReward', 'panel_inner');
S.newImage(b, W + '/MyReward/Slot1', 'slot_frame', { pos: at([172, 679, 62, 62], MYREW), size: [62, 62] });
S.newImage(b, W + '/MyReward/Slot1/Icon', 'icon_balrog_heart', { pos: at([184, 692, 38, 36], [172, 679, 62, 62]), size: [38, 36] });
S.newImage(b, W + '/MyReward/Slot2', 'slot_frame', { pos: at([242, 679, 62, 62], MYREW), size: [62, 62] });
S.newImage(b, W + '/MyReward/Slot2/Icon', 'icon_info_exp', { pos: at([254, 692, 38, 36], [242, 679, 62, 62]), size: [38, 36] });
ctr(W + '/MyReward/RewardText', [320, 670, 470, 80], MYREW);
S.font(b, W + '/MyReward/RewardText', { font: 'Noto700', size: 16, color: C.ivory, h: 'left', v: 'middle', outline: false });
// 옛 받침 그림(꺼져 있음 · 스크립트가 안 잡음)은 그대로 둔다.

ctr(W + '/Footer', MYREW, WIN);
ctr(W + '/Footer/BtnPrimary', [808, 673, 220, 74], MYREW);
S.button(b, W + '/Footer/BtnPrimary', { normal: 'btn_cta_default', pressed: 'btn_cta_pressed', disabled: 'btn_cta_disabled' });
S.font(b, W + '/Footer/BtnPrimary', { font: 'Maple', size: 24, color: C.goldInk, h: 'center', v: 'middle', text: '로비로', outline: false });

// 그리기 순서: 내 보상 판이 로비로 버튼(Footer)을 덮지 않게 판을 Footer 앞(= 더 먼저 그림)으로 · 문장은 제목 띠보다 뒤
S.before(b, W + '/MyReward', W + '/Footer');
S.back(b, W + '/Crest');

// 🔴 칩 글자 대비(시안 1790844637-7b1e): 글자가 칩의 형제인 곳 = 순위 글자(Rank · 금/은 칩 위 잉크 · 동메달은 어두운 칩이라 스크립트가 흰색으로) · 탈락 표시(EliminatedMark).
const extra = {};
for (let i = 0; i < 5; i++) {
  const R = W + '/RankRows/RankRow_' + i;
  extra[R + '/RankChipGold'] = [R + '/Rank'];
  extra[R + '/ElimChip'] = [R + '/EliminatedMark'];
}
const touched = S.chipText(b, { extra });
console.log('chipText', touched.length, touched.map((t) => t.kind + ':' + t.path.replace('/ui/', '')).join(' '));

b.write(path.join(WORLD, 'ui', 'MatchResultGroup.ui'));
console.log('MatchResultGroup 적용 끝');
