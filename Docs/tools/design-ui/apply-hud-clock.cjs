// 상시 HUD 중 매치 시계(MatchClockGroup)에 디자이너 시안(04-hud #2~#5 · #23 파병 배지)을 입힌다.
// 실행(월드 루트에서): node Docs/tools/design-ui/apply-hud-clock.cjs
// 다시 돌려도 같은 결과가 나온다. 기존 엔티티는 지우지 않고 값만 바꾼다.
// 글자 · 칩 색을 채우는 쪽은 Match/MatchClockUIController.mlua (Panel · PhaseText · TimeText · NextText · DispatchBadge 이름 · UUID 를 바꾸면 안 된다).
// 페이즈 칩은 PhaseText 자신의 그림(기본은 칩 · 스크립트가 페이즈마다 그림 · 글자색을 바꾼다), 칩 폭은 가장 긴 문구("0.5페이즈 전직")에 맞춘 고정 폭이다.
const path = require('path');
const S = require('./skin.cjs');
const WORLD = path.resolve(__dirname, '..', '..', '..');
const b = S.open(WORLD, 'MatchClockGroup');
const before = b.listEntities().length;
const C = S.COLOR;

// 시계 판 (시안 캔버스 좌표 · 화면 위 가운데)
const PANEL = [680, 14, 560, 64];
S.place(b, 'Panel', { pos: [0, -14], size: [PANEL[2], PANEL[3]] });
S.image(b, 'Panel', 'panel_title_bar');

// 페이즈 칩: 왼쪽에서 64 · 폭 152 · 높이 34(시안 1790844637-7b1e: height 34 · 좌우 여백 14). 그림 · 글자는 스크립트가 페이즈별로 바꾼다(기본 = 개척 초록).
// 폭: 가장 긴 문구 "0.5페이즈 전직"이 게임 글꼴(시안보다 10~15% 넓음)에서 안쪽(폭 − 2 × 14 = 124)에 한 줄로 들어가게 136 → 152. 시간 글자(왼쪽 237)와는 21 떨어진다.
S.place(b, 'Panel/PhaseText', { pos: [64, 0], size: [152, 34] });
S.image(b, 'Panel/PhaseText', 'chip_green');
S.font(b, 'Panel/PhaseText', { font: 'Maple', size: 16, color: C.white, h: 'center', v: 'middle', outline: false });

// 경과 시간: 가운데에서 17 오른쪽 · 풋볼 굵게 30 금색
S.place(b, 'Panel/TimeText', { pos: [17, 0], size: [120, 44] });
S.font(b, 'Panel/TimeText', { font: 'FootballB', size: 30, color: C.gold, h: 'center', v: 'middle', outline: false });

// 다음 투입: 오른쪽 끝에서 50.5 안쪽 · 고딕 굵게 16 하늘색 · 오른쪽 정렬
S.place(b, 'Panel/NextText', { pos: [-50.5, 0], size: [170, 40] });
S.font(b, 'Panel/NextText', { font: 'Noto700', size: 16, color: '#9CC8FF', h: 'right', v: 'middle', outline: false });

// 파병 배지: 시계 판 바로 아래 6px · 280x40. 그림(소 = 어두운 금 · 중/대 = 빨강)과 눈금은 스크립트가 등급별로 바꾼다.
const BADGE = [820, 84, 280, 40];
S.place(b, 'Panel/DispatchBadge', { pos: S.at(...BADGE, PANEL), size: [BADGE[2], BADGE[3]] });
S.image(b, 'Panel/DispatchBadge', 'chip_red');
// 글자 16(시안 18): 게임 글꼴이 시안보다 10~15% 넓어 18 이면 "총량 중" 끝이 눈금에 닿았다(Play 확인 2026-10-01).
S.font(b, 'Panel/DispatchBadge', { font: 'Maple', size: 16, color: C.white, h: 'center', v: 'middle', outline: false });
S.newImage(b, 'Panel/DispatchBadge/Flag', 'icon_flag_warn', { pos: S.at(846, 92, 24, 24, BADGE), size: [24, 24] });
// 눈금 3칸(13x14): 켜짐 #FFE2A8 · 꺼짐 검정 35%. 시안의 둥근 모서리(2px)는 생략. 글자와 띄우려고 시안보다 6 오른쪽.
[1042.5, 1055.5, 1068.5].forEach((x, i) => {
  b.sprite(`Panel/DispatchBadge/Tick${i + 1}`, { anchor: 'middle-center', pos: S.at(x, 97, 13, 14, BADGE), rect_size: [13, 14], pivot: [0.5, 0.5], color: '#FFE2A8', alpha: 1, sprite_type: 1, raycast: false });
});

// 🔴 칩 글자 대비(시안 1790844637-7b1e): 칩 위 글자 규칙. 페이즈 칩은 그림이 런타임에 바뀌므로 여기선 기본(개척 초록 = 보석 규칙)만 박히고, 페이즈마다 MatchClockUIController 가 _UiChipText 로 다시 건다.
const touched = S.chipText(b);
console.log('chipText', touched.length, touched.map((t) => t.kind + ':' + t.path.replace('/ui/', '')).join(' '));
// 페이즈 칩 글자 좌우 여백은 시안 그대로 14(chipText 가 건 테두리+1 = 12 보다 크다)
b.patchComponent('Panel/PhaseText', S.TXT, { Padding: { left: 14, right: 14, top: 0, bottom: 0 } });

b.write(path.join(WORLD, 'ui', 'MatchClockGroup.ui'), {
  lint_verbose: !!process.env.LINT_V,
});
console.log(`MatchClockGroup(매치 시계) 적용 끝 — 새 엔티티 ${b.listEntities().length - before}개`);
