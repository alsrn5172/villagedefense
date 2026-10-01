// 스킬창(SkillWindow)에 디자이너 시안(08-skill)을 입힌다 — 창틀 · 차수 탭 · 스킬 행 · 스킬 포인트 띠 · 툴팁 판.
// 실행(월드 루트에서): node Docs/tools/design-ui/apply-skill.cjs
// 다시 돌려도 같은 결과가 나온다. 기존 엔티티는 지우지 않고 이름도 안 바꾼다(스크립트가 UUID · 이름으로 잡는다).
// 글자 · 상태는 Skill/SkillWindowLogic.mlua 가 채운다(자식 이름으로 찾는다 · 아래 이름을 바꾸면 안 된다).
//
// 상태 그림(탭 선택/잠김 · 종류 칩 · MAX 받침 · 잠금 뱃지 · 비활성 +)은 스프라이트를 갈아 끼우지 않고
// "겹쳐 깔아 둔 그림을 켜고 끄는" 방식이다. 행 배경(기본 · 올림 · 잠김)만 스크립트가 ImageRUID 를 바꾼다.
//   - 🔴 부모 엔티티에 글자가 있으면 자식 그림이 그 글자를 덮는다 → 탭 글자는 자식 Label 로 둔다.
const path = require('path');
const S = require('./skin.cjs');
const WORLD = path.resolve(__dirname, '..', '..', '..');
const b = S.open(WORLD, 'SkillWindow');
const C = S.COLOR;

// ── 시안 캔버스 좌표(왼쪽 위 기준 x,y,w,h · 1060x780 캔버스) ──
const WIN = [40, 56, 480, 690];
const BAND = [128, 78, 304, 64];
const TABROW = [60, 166, 440, 66];
const LIST = [40, 232, 480, 434];
const FOOT = [44, 666, 472, 76];
const ROW = [60, 246, 444, 112];
const ROW_MID = ROW[1] + ROW[3] / 2;      // 행 가운데 y(302)
const at = (r, parent) => S.at(r[0], r[1], r[2], r[3], parent);
const ctr = (p, r, parent, extra) => S.place(b, p, Object.assign({ anchor: 'middle-center', pivot: [0.5, 0.5], pos: at(r, parent), size: [r[2], r[3]] }, extra || {}));
// 행 안: 왼쪽 끝 기준 배치(글자 폭이 달라도 왼쪽 끝이 고정) — x = 시안 왼쪽 끝, cy = 시안 세로 가운데
const leftOf = (x) => x - ROW[0];
const rowY = (cy) => Math.round((ROW_MID - cy) * 2) / 2;
const lft = (p, x, cy, w, h) => S.place(b, p, { anchor: 'middle-left', pivot: [0, 0.5], pos: [leftOf(x), rowY(cy)], size: [w, h] });
const noBg = (p) => S.tint(b, p, C.white, 0);
const RT = 'Window/ListArea/RowTemplate';

// ═══════════════════════════════════════════════════════════
// 창틀: 판 · 문장 · 제목 띠 · 닫기
// ═══════════════════════════════════════════════════════════
S.place(b, 'Window', { pos: [0, 0], size: [480, 690] });
S.image(b, 'Window', 'panel_window');

// 제목 띠: TitleText 엔티티가 그림과 글자를 같이 가진다(글자는 스크립트가 안 건드림 → 고정 문구).
ctr('Window/TitleText', BAND, WIN);
S.image(b, 'Window/TitleText', 'panel_title_bar');
S.font(b, 'Window/TitleText', { font: 'Maple', size: 30, color: C.title, h: 'center', v: 'middle', text: '스킬', outline: false, shadow: true });
S.newImage(b, 'Window/TitleText/SparkleL', 'deco_sparkle', { pos: at([222.5, 101, 18, 18], BAND), size: [18, 18] });
S.newImage(b, 'Window/TitleText/SparkleR', 'deco_sparkle', { pos: at([319.5, 101, 18, 18], BAND), size: [18, 18] });
S.place(b, 'Window/TitleText/Title', { enable: false }); // 옛 제목 받침(스크립트가 안 잡음) → 끔

S.newImage(b, 'Window/Crest', 'deco_crest', { pos: at([130, 4, 300, 88], WIN), size: [300, 88] });

ctr('Window/BtnClose', [448, 84, 52, 52], WIN);
S.button(b, 'Window/BtnClose', { normal: 'btn_close_default', hover: 'btn_close_hover', pressed: 'btn_close_hover' });
S.font(b, 'Window/BtnClose', { text: '' });

// ═══════════════════════════════════════════════════════════
// 차수 탭 3개 — 기본 그림(off + 올림) 위에 On(선택) · Locked(잠김) 을 겹쳐 두고 스크립트가 켜고 끈다. 글자는 Label.
// ═══════════════════════════════════════════════════════════
ctr('Window/TabRow', TABROW, WIN);
noBg('Window/TabRow');
const TABS = [['TabBtn0', [60, 166, 141.5, 66], '1차'], ['TabBtn1', [209.5, 166, 141.5, 66], '2차'], ['TabBtn2', [358.5, 166, 141.5, 66], '3차']];
for (const [name, r, label] of TABS) {
  const T = 'Window/TabRow/' + name;
  ctr(T, r, TABROW);
  S.button(b, T, { normal: 'tab_crest_off', hover: 'tab_crest_hover', pressed: 'tab_crest_hover' });
  S.font(b, T, { text: '' });
  S.newImage(b, T + '/On', 'tab_crest_on', { pos: [0, 0], size: [r[2], r[3]], enable: false });
  S.newImage(b, T + '/Locked', 'tab_crest_locked', { pos: [0, 0], size: [r[2], r[3]], enable: false });
  S.newText(b, T + '/Label', label, { font: 'Maple', size: 20, color: C.ivory, pos: [0, -7], rect: [r[2], 40] });
}

// ═══════════════════════════════════════════════════════════
// 목록 영역 + 행 템플릿(런타임에 복제되는 것 — 이 1개만 고치면 복제본에 다 반영된다)
// ═══════════════════════════════════════════════════════════
ctr('Window/ListArea', LIST, WIN);
noBg('Window/ListArea'); // Mask 컴포넌트는 그대로 둔다
// 첫 행 위 14 · 행 간격 10 · 왼쪽 20 · 오른쪽 16
// 스크롤바: 시안에 없다. 기본 회색 막대가 창 오른쪽 · 아래에 그려졌다(Play 확인 2026-10-01 · DEV 세팅 행 때문에 넘칠 때) → 숨김(2). 휠 · 끌기로는 그대로 스크롤된다.
b.patchComponent('Window/ListArea', 'MOD.Core.ScrollLayoutGroupComponent', { Spacing: 10, Padding: { left: 20, right: 16, top: 14, bottom: 14 }, ScrollBarVisible: 2 });

S.place(b, RT, { size: [444, 112] }); // 앵커(0,1)·피벗(0.5,1)은 스크롤 레이아웃이 다루니 그대로
S.image(b, RT, 'panel_row_slot');
b.patchComponent(RT, S.BTN, { Transition: 0 }); // 행 그림은 스크립트가 직접 갈아 끼운다(올림 · 잠김)

// 아이콘(게임 그림 자리 — 런타임이 ImageRUID 를 넣는다 · 칸 크기와 위치만 맞춘다)
ctr(RT + '/Icon', [89, 273, 58, 58], ROW);
b.patchComponent(RT + '/Icon', S.SPR, { Type: 0 });

// 이름 · 레벨
lft(RT + '/NameText', 200, 271.75, 190, 34);
S.font(b, RT + '/NameText', { font: 'Maple', size: 24, color: C.ivory, h: 'left', v: 'middle', outline: false });
lft(RT + '/LevelText', 200, 309, 56, 28);
S.font(b, RT + '/LevelText', { font: 'FootballB', size: 20, color: C.gold, h: 'left', v: 'middle', outline: false });
S.newText(b, RT + '/LevelMax', '/ 5', { font: 'FootballB', size: 16, color: C.faint, h: 'left', anchor: 'middle-left', pivot: [0, 0.5], pos: [leftOf(256), rowY(310)], rect: [40, 24] });

// 종류 칩(액티브 파랑 · 패시브 초록) — 둘 다 깔아 두고 스크립트가 하나만 켠다
for (const [name, key, label] of [['ChipAct', 'chip_blue', '액티브'], ['ChipPas', 'chip_green', '패시브']]) {
  S.newImage(b, RT + '/' + name, key, { anchor: 'middle-left', pivot: [0, 0.5], pos: [leftOf(300), rowY(309)], size: [62.5, 25] });
  S.newText(b, RT + '/' + name + '/Text', label, { font: 'Noto700', size: 14, color: C.white, pos: [0, 0], rect: [62.5, 25] });
}

// 진행 막대: 받침 190x20 · 채움 최대 158x8(=190-32 · 시안 실측) · FillAmount = 레벨/최대
S.newImage(b, RT + '/GaugeTrack', 'gauge_track', { anchor: 'middle-left', pivot: [0, 0.5], pos: [leftOf(200), rowY(339)], size: [190, 20] });
S.newImage(b, RT + '/GaugeTrack/GaugeFill', 'gauge_fill_gold', { anchor: 'middle-left', pivot: [0, 0.5], pos: [16, 0], size: [158, 8], type: 3 });

// + 버튼(기본 · 눌림은 버튼 전환, 비활성 그림은 위에 겹쳐 둔 DisImg — 눌러서 실패 사유를 보는 동작은 그대로 살린다)
S.place(b, RT + '/BtnPlus', { pos: [-20, 0], size: [64, 64] });
S.button(b, RT + '/BtnPlus', { normal: 'btn_plus_default', hover: 'btn_plus_default', pressed: 'btn_plus_pressed' });
S.font(b, RT + '/BtnPlus', { text: '' });
S.place(b, RT + '/BtnPlus/BtnImg', { enable: false }); // 옛 + 글리프(새 그림에 이미 그려져 있다)
S.newImage(b, RT + '/BtnPlus/DisImg', 'btn_plus_disabled', { pos: [0, 0], size: [64, 64], enable: false });

// 최대 레벨 받침(MAX) · 잠금 뱃지 · 잠금 조건 한 줄 — 해당 행에서만 켠다
S.newImage(b, RT + '/MaxPlate', 'plate_dark', { anchor: 'middle-right', pivot: [1, 0.5], pos: [-20, 0], size: [64, 56], enable: false });
S.newText(b, RT + '/MaxPlate/Label', 'MAX', { font: 'Maple', size: 20, color: C.gold, pos: [0, 0], rect: [64, 56] });
S.newImage(b, RT + '/LockBadge', 'badge_lock', { pos: at([130, 312, 36, 36], ROW), size: [36, 36], enable: false });
S.newText(b, RT + '/LockText', '', { font: 'Noto700', size: 16, color: C.coral, h: 'left', overflow: 1, anchor: 'middle-left', pivot: [0, 0.5], pos: [leftOf(200), rowY(321.75)], rect: [186, 26], enable: false });

// ═══════════════════════════════════════════════════════════
// 하단 띠: 스킬 포인트 (시안의 그라데이션 배경 + 금 1px 테두리는 생략 — 창 판 위에 그대로 얹는다)
// ═══════════════════════════════════════════════════════════
const F = 'Window/Footer';
ctr(F, FOOT, WIN);
noBg(F);
ctr(F + '/SPLabel', [70, 690.5, 100, 28], FOOT);
S.font(b, F + '/SPLabel', { font: 'Maple', size: 20, color: C.sub, h: 'left', v: 'middle', text: '스킬 포인트', outline: false });
ctr(F + '/SPValue', [380, 680.5, 110, 48], FOOT);
S.image(b, F + '/SPValue', 'plate_dark');
S.font(b, F + '/SPValue', { font: 'FootballB', size: 30, color: C.gold, h: 'center', v: 'middle', outline: false });
S.newImage(b, F + '/SPDivider', 'deco_divider', { pos: at([183.5, 696.5, 180.5, 16], FOOT), size: [180.5, 16] });
S.newImage(b, F + '/SPDividerShort', 'deco_divider', { pos: at([183.5, 696.5, 48, 16], FOOT), size: [48, 16], enable: false });
S.newText(b, F + '/SPHint', '레벨업하면 얻어요', { font: 'Noto400', size: 16, color: C.faint, h: 'left', pos: at([248, 693.5, 123, 23], FOOT), rect: [123, 23], enable: false });

// ═══════════════════════════════════════════════════════════
// 툴팁 판(런타임에 커서를 따라다닌다 — 위치 · 높이는 스크립트가 잡는다). 안쪽 노드는 이름으로 찾는다.
// ═══════════════════════════════════════════════════════════
const D = 'Window/DescPanel';
S.place(b, D, { pos: [0, -40], size: [480, 375] }); // 런타임이 앵커 · 위치 · 높이를 다시 잡는다(저장 값은 캔버스 안에 둔다 · lint L013)
S.image(b, D, 'panel_tooltip');
S.font(b, D + '/DescText', { font: 'Noto400', size: 18, color: C.ivory, h: 'left', v: 'top', outline: false });
const TL = { anchor: 'top-left', pivot: [0, 1] };
S.newText(b, D + '/TipTitle', '', Object.assign({ font: 'Maple', size: 24, color: C.ivory, h: 'left', pos: [22, -18], rect: [330, 36] }, TL));
for (const [name, key, label] of [['TipChipAct', 'chip_blue', '액티브'], ['TipChipPas', 'chip_green', '패시브']]) {
  S.newImage(b, D + '/' + name, key, Object.assign({ pos: [120, -22.5], size: [86, 25] }, TL));
  S.newText(b, D + '/' + name + '/Text', label, { font: 'Noto700', size: 14, color: C.white, pos: [0, 0], rect: [86, 25] });
}
S.newImage(b, D + '/TipSlot', 'slot_frame', Object.assign({ pos: [22, -78.5], size: [78, 78] }, TL));
S.newImage(b, D + '/TipIcon', 'deco_sparkle', Object.assign({ pos: [34, -90.5], size: [54, 54], alpha: 0 }, TL)); // 런타임이 스킬 아이콘 RUID · 색을 넣는다
S.newImage(b, D + '/TipPlate', 'plate_dark', Object.assign({ pos: [22, -200], size: [436, 100] }, TL));
S.newText(b, D + '/TipBottom', '', Object.assign({ font: 'Noto400', size: 18, color: C.ivory, h: 'left', v: 'top', pos: [38, -212], rect: [404, 120] }, TL));

// 그리기 순서: 문장은 제목 띠보다 뒤(시안에서 띠가 문장 아래 14px 를 덮는다)
S.back(b, 'Window/Crest');

// 칩 위 글자 대비 규칙(시안 1790844637-7b1e): 액티브(파랑) · 패시브(초록) 칩 + 툴팁 칩 글자 = 흰 글자 + 짙은 외곽선. 맨 끝에 건다(위에서 글자를 다 맞춘 뒤).
const touched = S.chipText(b);
console.log('chipText', touched.length, touched.map((t) => t.kind + ':' + t.path.replace('/ui/', '')).join(' '));
b.write(path.join(WORLD, 'ui', 'SkillWindow.ui'));
console.log('SkillWindow 적용 끝');
