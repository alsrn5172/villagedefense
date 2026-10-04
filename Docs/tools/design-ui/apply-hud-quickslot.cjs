// 상시 HUD 중 퀵슬롯(QuickSlotGroup)에 디자이너 시안(04-hud #15~#20 · 빈 칸 안내)을 입힌다.
// 실행(월드 루트에서): node Docs/tools/design-ui/apply-hud-quickslot.cjs
// 다시 돌려도 같은 결과가 나온다. 기존 엔티티는 지우지 않고 값만 바꾼다.
// 글자 · 칸 그림을 채우는 쪽은 Item/QuickSlotController.mlua (Slot1/Slot2 · Icon · Count · Cool · CoolText 이름 · 구조를 바꾸면 안 된다).
// 덮개(Cool)는 지금 스크립트가 "아래에서 차오르고 위에서 줄어드는" Filled 방식이라 채움 방향은 그대로 두고 크기 · 색만 시안 값으로 맞춘다.
const path = require('path');
const S = require('./skin.cjs');
const WORLD = path.resolve(__dirname, '..', '..', '..');
const b = S.open(WORLD, 'QuickSlotGroup');
const before = b.listEntities().length;
const C = S.COLOR;

const BAR = [24, 940, 200, 116];
const SLOTS = { Slot1: 39, Slot2: 131 };   // 칸 78x78 의 왼쪽 x (y = 959)

// 판
S.place(b, 'Bar', { pos: [24, 24], size: [BAR[2], BAR[3]] });
S.image(b, 'Bar', 'panel_inner');

for (const [name, x] of Object.entries(SLOTS)) {
  const SLOT = [x, 959, 78, 78];
  const P = 'Bar/' + name;
  S.place(b, P, { pos: S.at(...SLOT, BAR), size: [78, 78] });
  // 빈 칸 그림이 기본(등록되면 스크립트가 slot_frame 으로 바꾼다). 전환 없음 — 그림은 스크립트가 고른다.
  S.image(b, P, 'slot_item_drag');
  b.patchComponent(P, S.BTN, { Transition: 0 });

  // 물약 아이콘(게임 그림 자리 · 런타임이 채움): 크기만 54
  S.place(b, P + '/Icon', { pos: [0, 0], size: [54, 54] });
  // 재사용 대기 덮개: 66x66 · #060A14 66% (채움 방향은 스크립트 그대로)
  S.place(b, P + '/Cool', { pos: [0, 0], size: [66, 66] });
  S.tint(b, P + '/Cool', C.veil, 0.66);
  // 남은 초: 풋볼 굵게 24 금색 · 덮개 밖 글자 상자는 칸 전체
  S.place(b, P + '/CoolText', { pos: [0, 0], size: [78, 78] });
  S.font(b, P + '/CoolText', { font: 'FootballB', size: 24, color: C.gold, h: 'center', v: 'middle', outline: false });
  // 수량: 오른쪽 아래 · 풋볼 굵게 16 흰색(어두운 외곽은 그대로 둔다). 0개일 때 붉은 숫자는 스크립트.
  S.place(b, P + '/Count', { pos: [9, -25], size: [44, 18] });
  S.font(b, P + '/Count', { font: 'FootballB', size: 16, color: C.white, h: 'right', v: 'bottom' });
  // 키 번호: 왼쪽 위 금 칩 키캡 22x22 (스크립트가 안 잡는 노드)
  // 🔴 칩 글자 대비(시안 1790844637-7b1e): 글자 좌우 여백 ≥ 테두리 7 + 1 → 숫자 한 자리 칩 22 → 26(왼쪽 끝은 그대로)
  // 🔴 5차: 키 칩 한 글자 = 역할표 key1(34×22 · 스킬 HUD · 상태 HUD 와 같은 크기). 왼쪽 끝(-43)은 그대로.
  const KB = S.roleBox('key1');
  S.place(b, P + '/Key', { pos: [-43 + KB[0] / 2, 34], size: [KB[0], KB[1]] });
  S.image(b, P + '/Key', 'chip_gold_sm');
  b.patchComponent(P + '/Key', S.SPR, { RaycastTarget: false }); // 키캡이 칸 클릭을 가로채지 않게
  S.font(b, P + '/Key', { font: 'FootballB', size: 13, color: C.goldInk, h: 'center', v: 'middle', outline: false });
  // 빈 칸 표시 "+" (흐린 26x26 · 스크립트가 빈 칸일 때만 켠다)
  S.newImage(b, P + '/PlusHint', 'icon_plus', { pos: [0, 0], size: [26, 26], alpha: 0.45 });
  S.back(b, P + '/PlusHint'); // 칸 자식 중 맨 뒤 — 아이콘 · 글자 · 덮개가 그 위에 온다
}

// 빈 칸을 눌렀을 때 화면 위에 뜨는 안내(평소 꺼둠 · 스크립트가 2초 켠다). 그룹 루트 직속의 "표시용" 판이라 클릭 요소가 아니다.
const HINT = [710, 96, 364, 50];
S.newImage(b, 'EmptyHint', 'panel_tooltip', { anchor: 'top-center', pivot: [0.5, 1], pos: [-68, -96], size: [HINT[2], HINT[3]], enable: false });
S.newImage(b, 'EmptyHint/Icon', 'icon_info', { pos: S.at(732, 108, 28, 26, HINT), size: [28, 26] });
S.newText(b, 'EmptyHint/Text', '인벤토리에서 물약을 끌어다 놓으세요', { font: 'Noto700', size: 18, color: C.ivory, pos: [18, 0], rect: [300, 26] });

// 🔴 칩 글자 대비(시안 1790844637-7b1e): 키 칩(금 · 잉크 글자)
const touched = S.chipText(b);
console.log('chipText', touched.length, touched.map((t) => t.kind + ':' + t.path.replace('/ui/', '')).join(' '));

b.write(path.join(WORLD, 'ui', 'QuickSlotGroup.ui'), {
  bind: {
    mlua: path.join(WORLD, 'RootDesk/MyDesk/Item/QuickSlotController.mlua'),
    props: {
      slotImg1: 'Bar/Slot1', slotImg2: 'Bar/Slot2',
      plus1: 'Bar/Slot1/PlusHint', plus2: 'Bar/Slot2/PlusHint',
      emptyHint: 'EmptyHint',
    },
  },
  lint_verbose: !!process.env.LINT_V,
});
console.log(`QuickSlotGroup(퀵슬롯) 적용 끝 — 새 엔티티 ${b.listEntities().length - before}개`);
