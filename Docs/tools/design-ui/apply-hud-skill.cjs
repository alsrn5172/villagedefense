// 상시 HUD 중 우하단 스킬 칸(SkillHudGroup)에 디자이너 시안(04-hud #24~#28)을 입힌다.
// 실행(월드 루트에서): node Docs/tools/design-ui/apply-hud-skill.cjs
// 다시 돌려도 같은 결과가 나온다. 기존 엔티티는 지우지 않고 값만 바꾼다.
// 칸 · 자식 이름(Slot_Q~Shift · Icon · Cool · CoolText · M_*)은 Stat/SkillHudController.mlua 가 이름으로 찾는다 → 바꾸지 않는다.
// 판 폭(5칸 452 / 4칸 368) · 칸 x 위치 · 칸 틀 그림(빈 칸 ↔ 스킬 있음)은 스크립트가 직업(Shift 칸 유무)에 따라 바꾼다.
// 모바일 5칸(Mobile/M_*)은 시안에 실측이 없어 위치 · 크기는 그대로 두고 그림 · 덮개 · 글자만 맞춘다.
const path = require('path');
const S = require('./skin.cjs');
const WORLD = path.resolve(__dirname, '..', '..', '..');
const b = S.open(WORLD, 'SkillHudGroup');
const C = S.COLOR;

// ── PC: 5칸 기준 판 [1440,856,452,100] · 칸 72x72 ──
const BAR = [1440, 856, 452, 100];
S.place(b, 'Bar', { pos: [-28, 124], size: [BAR[2], BAR[3]] });
S.image(b, 'Bar', 'panel_inner');

const CELLS = [['Q', 1462], ['W', 1546], ['E', 1630], ['R', 1714], ['Shift', 1798]];
for (const [key, x] of CELLS) {
  const SLOT = [x, 873, 72, 72];
  const P = 'Bar/Slot_' + key;
  S.place(b, P, { pos: S.at(...SLOT, BAR), size: [72, 72] });
  S.image(b, P, 'slot_frame_empty'); // 기본은 빈 칸(안 배움) · 스킬이 있으면 스크립트가 slot_frame 으로 바꾼다
  b.patchComponent(P, S.BTN, { Transition: 0 });
  // 스킬 아이콘(게임 그림 자리): 52 그대로
  S.place(b, P + '/Icon', { pos: [0, 0], size: [52, 52] });
  // 쿨 덮개: 56x56 · #060A14 70% (채움 방향은 스크립트 그대로 — 아래에서 위로 줄어듦)
  S.place(b, P + '/Cool', { pos: [0, 0], size: [56, 56] });
  S.tint(b, P + '/Cool', C.veil, 0.70);
  S.place(b, P + '/CoolText', { pos: [0, 0], size: [72, 72] });
  S.font(b, P + '/CoolText', { font: 'FootballB', size: 24, color: C.gold, h: 'center', v: 'middle', outline: false });
  // 키 글자 배지: 왼쪽 위 금 칩 22x22 (Shift 는 가로로 40.5)
  // 🔴 칩 글자 대비(시안 1790844637-7b1e): 글자 좌우 여백 ≥ 테두리 7 + 1 → 한 글자 22 → 28(W 는 32) · Shift 40.5 → 54(게임 글꼴이 시안보다 넓다). 왼쪽 끝(-41)은 그대로.
  // 🔴 칩 크기 규칙(5차 · skin.cjs 역할표 key1 · keyShift): 한 글자 키 칩은 가장 넓은 글자("W")에 맞춘 34 로 전부 같게(Q · W · E · R · C · K · F · 숫자), Shift 는 58. 왼쪽 끝(-41)은 그대로.
  const wide = key === 'Shift';
  const kw = S.roleBox(wide ? 'keyShift' : 'key1')[0];
  S.place(b, P + '/Key', { pos: [-41 + kw / 2, 32], size: [kw, 22] });
  S.image(b, P + '/Key', 'chip_gold_sm');
  b.patchComponent(P + '/Key', S.SPR, { RaycastTarget: false });
  S.font(b, P + '/Key', { font: 'Maple', size: 13, color: C.goldInk, h: 'center', v: 'middle', outline: false });
}

// ── 모바일: 위치 · 크기 그대로, 그림만 ──
for (const key of ['Q', 'W', 'E', 'R', 'Shift']) {
  const P = 'Mobile/M_' + key;
  S.image(b, P, 'slot_frame_empty');
  b.patchComponent(P, S.BTN, { Transition: 0 });
  S.tint(b, P + '/Cool', C.veil, 0.70);
  S.font(b, P + '/CoolText', { font: 'FootballB', size: 28, color: C.gold, h: 'center', v: 'middle', outline: false });
}

// 🔴 칩 글자 대비(시안 1790844637-7b1e): 키 칩(금 · 잉크 글자)
const touched = S.chipText(b);
console.log('chipText', touched.length, touched.map((t) => t.kind + ':' + t.path.replace('/ui/', '')).join(' '));

b.write(path.join(WORLD, 'ui', 'SkillHudGroup.ui'), {
  lint_verbose: !!process.env.LINT_V,
});
console.log('SkillHudGroup(스킬 칸) 적용 끝');
