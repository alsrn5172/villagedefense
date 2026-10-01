// 공용 창(CommonNpcGroup) 중 차원 관문(Content/DimensionGate)에 디자이너 시안(14-gate)을 입힌다. 창 틀은 _npc-frame.cjs(파병 접수와 공용).
// 실행(월드 루트에서): node Docs/tools/design-ui/apply-gate.cjs
// 다시 돌려도 같은 결과가 나온다. 기존 엔티티는 지우지 않고 값만 바꾼다(Gate_<마을> · Village · Boss · Mat · MatIcon 은 스크립트가 이름으로 잡는다).
// 글자를 채우는 쪽은 Npc/CommonNpcUIController.mlua. 이 창은 FunctionalNpcCatalog.csv 15행에서 Hidden=true 라 지금은 게임에서 안 열린다.
const path = require('path');
const S = require('./skin.cjs');
const F = require('./_npc-frame.cjs');
const WORLD = path.resolve(__dirname, '..', '..', '..');
const b = S.open(WORLD, 'CommonNpcGroup');
const before = b.listEntities().length;
const C = S.COLOR;

F.frame(b);

const WIN = F.WIN;
const FOOT = F.FOOT;
const GATE = F.CONTENT;                 // DimensionGate = Content 와 같은 상자
const G = 'Window/Content/DimensionGate';
const GR = [150, 298, 860, 334];        // 카드 다섯 장 컨테이너
const ENERGY_CORE_RUID = '4570b3929b524c19b1f4c60d4a4c7c95'; // ItemInfo.csv ENERGY_CORE 아이콘(게임 그림 자리 · 스크립트가 카탈로그에서 다시 읽어 덮는다)

const ctr = (p, r, parent, extra) => S.place(b, p, Object.assign({ anchor: 'middle-center', pivot: [0.5, 0.5], pos: S.at(r[0], r[1], r[2], r[3], parent), size: [r[2], r[3]] }, extra || {}));
const img = (p, key, r, parent, o) => S.newImage(b, p, key, Object.assign({ pos: S.at(r[0], r[1], r[2], r[3], parent), size: [r[2], r[3]] }, o || {}));
const txt = (p, text, r, parent, o) => S.newText(b, p, text, Object.assign({ pos: S.at(r[0], r[1], r[2], r[3], parent), rect: [r[2], r[3]] }, o || {}));
// 게임 그림(원작 아이콘) 자리: 그림 이름표가 없어 RUID 를 직접 준다
// 🔴 color/alpha 를 안 주면 빌더 기본 틴트(어두운 회색 · 알파 0.24)가 그림에 곱해져 에너지 코어가 거의 안 보였다(사용자 지적 2026-10-01 E12 · 원인 = probe 로 Color 확인) → 흰색 알파 1.
const gameIcon = (p, ruid, r, parent, o) => b.sprite(p, Object.assign({ anchor: 'middle-center', pos: S.at(r[0], r[1], r[2], r[3], parent), rect_size: [r[2], r[3]], pivot: [0.5, 0.5], image_ruid: ruid, sprite_type: 0, raycast: false, color: '#FFFFFF', alpha: 1 }, o || {}));

// 차원 관문 창에서만 보이는 제목 아이콘(에너지 코어 · 게임 그림 자리)
gameIcon('Window/TitleBar/TitleIconCore', ENERGY_CORE_RUID, [518.5, 147, 34, 34], F.TITLE, { enable: false });

// ═══ 에너지 코어 보유 칩 ═══
const CPLATE = [493, 218, 214, 52];
img(G + '/CorePlate', 'plate_dark', CPLATE, GATE);
gameIcon(G + '/CorePlate/Icon', ENERGY_CORE_RUID, [503, 225, 38, 38], CPLATE);
// 🔴 "에너지 코어 보유" 는 게임 글꼴에선 폭 112 에 안 들어가 "유" 가 둘째 줄로 꺾인다(2차 묶음 실측) → 폭 128 · 숫자는 그만큼 오른쪽으로
ctr(G + '/CoreText', [551, 233, 128, 22.5], GATE);
S.font(b, G + '/CoreText', { font: 'Noto700', size: 16, color: C.sub, h: 'left', v: 'middle', outline: false, text: '에너지 코어 보유' });
txt(G + '/CoreCount', '0', [681, 227, 50, 33.5], GATE, { font: 'FootballB', size: 24, color: C.gold, h: 'left' });
S.before(b, G + '/CorePlate', G + '/CoreText');

// ═══ 카드 받침 판 + 카드 5장 ═══
img(G + '/Pane', 'panel_inner', [134, 282, 932, 366], GATE);
ctr(G + '/GateRoot', GR, GATE);
const CARDS = [['HENESYS', 150], ['KERNING', 332], ['ELLINIA', 514], ['NAUTILUS', 696], ['PERION', 878]];
for (const [vid, x] of CARDS) {
  const C0 = [x, 298, 172, 334];
  const p = `${G}/GateRoot/Gate_${vid}`;
  ctr(p, C0, GR);
  S.image(b, p, 'panel_row');
  b.patchComponent(p, S.BTN, { Transition: 0 }); // 고름 · 내 마을 표시는 Sel / Locked 를 켜고 끄는 걸로(그림 교체)
  S.font(b, p, { text: '' });
  img(p + '/Sel', 'panel_row_selected', C0, C0, { enable: false });
  img(p + '/Locked', 'panel_row_locked', C0, C0, { enable: false });
  img(p + '/Emblem', `emblem_${vid.toLowerCase()}`, [x + 44, 324, 84, 84], C0);
  ctr(p + '/Village', [x, 418, 172, 28], C0);
  S.font(b, p + '/Village', { font: 'Maple', size: 20, color: C.ivory, h: 'center', v: 'middle', outline: false });
  ctr(p + '/Boss', [x + 6, 452, 160, 17], C0);
  S.font(b, p + '/Boss', { font: 'Noto700', size: 14, color: '#FFB3A6', h: 'center', v: 'middle', outline: false });
  txt(p + '/BossEn', '', [x + 6, 469, 160, 15.5], C0, { font: 'Noto500', size: 13, color: C.faint });
  img(p + '/MatSlot', 'slot_frame', [x + 58, 496, 56, 56], C0);
  ctr(p + '/MatIcon', [x + 66, 504, 40, 40], C0);
  txt(p + '/MatLabel', '지역재화', [x + 26, 558, 120, 18], C0, { font: 'Noto700', size: 13, color: C.faint });
  ctr(p + '/Mat', [x + 26, 579, 120, 22.5], C0);
  S.font(b, p + '/Mat', { font: 'FootballB', size: 16, color: C.ivory, h: 'center', v: 'middle', outline: false });
  b.patchComponent(p + '/Mat', S.TXT, { IsRichText: true });
  img(p + '/OwnChip', 'chip_gray_dark', [x + 29.25, 500, 113.5, 19.5], C0, { enable: false });
  txt(p + '/OwnChip/Text', '내 마을 · 도보', [0, 0, 113.5, 19.5], [0, 0, 113.5, 19.5], { font: 'Noto700', size: 13, color: '#C9D2E3' });
  S.before(b, p + '/MatSlot', p + '/MatIcon'); // 칸 그림은 지역재화 아이콘보다 뒤
  S.back(b, p + '/Locked');
  S.back(b, p + '/Sel');
}
S.before(b, G + '/Pane', G + '/GateRoot');

// ═══ 아래 안내 ═══
img(G + '/HelpIcon', 'icon_help', [134, 660, 22, 22], GATE);
ctr(G + '/GateStatus', [164, 660, 902, 22], GATE);
S.font(b, G + '/GateStatus', { font: 'Noto700', size: 14, color: C.faint, h: 'left', v: 'middle', outline: false });

// ═══ 하단 띠: 고른 마을로 이동 + 비용 칩(에너지 코어 N · 보유 M) — 칩은 마을 고른 뒤에만 켠다 ═══
// 🔴 "에너지 코어" 가 폭 68.5 에 안 들어가 "어" 가 둘째 줄로 꺾인다(2차 묶음 실측 · 게임 글꼴이 시안보다 넓다) → 칩 196 → 222 · 이름 폭 82 · 숫자 · 보유는 그만큼 오른쪽으로
const CP = [355, 746.5, 222, 48];
img('Window/Footer/CostPlate', 'plate_dark', CP, FOOT, { enable: false });
gameIcon('Window/Footer/CostPlate/Icon', ENERGY_CORE_RUID, [363, 754.5, 32, 32], CP);
txt('Window/Footer/CostPlate/Label', '에너지 코어', [403, 760.5, 84, 19.5], CP, { font: 'Noto700', size: 14, color: C.faint, h: 'left' });
txt('Window/Footer/CostPlate/Num', '1', [493, 756.5, 20, 28], CP, { font: 'FootballB', size: 20, color: C.ivory, h: 'left' });
txt('Window/Footer/CostPlate/Have', '', [518, 760.5, 54, 19.5], CP, { font: 'Noto700', size: 14, color: C.faint, h: 'left' });

b.write(path.join(WORLD, 'ui', 'CommonNpcGroup.ui'), {
  bind: {
    mlua: path.join(WORLD, 'RootDesk/MyDesk/Npc/CommonNpcUIController.mlua'),
    props: Object.assign(F.frameProps(), {
      titleIconCore: 'Window/TitleBar/TitleIconCore',
      coreIcon: G + '/CorePlate/Icon', coreCount: G + '/CoreCount',
      costPlate: 'Window/Footer/CostPlate', costCoreIcon: 'Window/Footer/CostPlate/Icon',
      costNum: 'Window/Footer/CostPlate/Num', costHave: 'Window/Footer/CostPlate/Have',
    }),
  },
  lint_verbose: !!process.env.LINT_V,
});
console.log(`CommonNpcGroup(차원 관문 + 창 틀) 적용 끝 — 새 엔티티 ${b.listEntities().length - before}개`);
