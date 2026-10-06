// 몬스터 도감 창(VillageRecordGroup) 손질 (사용자 2026-10-06)
//  ① 해금할 수 있는 칸 = 노란 테두리 불빛(CollTemplate/Glow). 평소 꺼 둔다 · VillageRecordUIController 가 켜고 알파를 사인파로 깜빡인다.
//  ② 잠긴 칸: 자물쇠를 왼쪽으로 옮기고 "잠김 · Lv N" 글자 상자를 넓힌다(한 줄에 들어가게).
//  ③ 푸터의 보유 재화 칩(HoldPlate = 다이아 · 꿈의 조각)을 끈다 — 이 창은 그 몬스터의 재료(StateLocked/CostPlate)만 보인다.
// 실행(월드 루트에서): node Docs/tools/design-ui/fix-record-card-glow.cjs — 다시 돌려도 같다. apply-record.cjs 도 같은 값.
const path = require('path');
const S = require('./skin.cjs');
const WORLD = path.resolve(__dirname, '..', '..', '..');
const b = S.open(WORLD, 'VillageRecordGroup');

const ROUND = 'f5e5fbd6dd224f2d8a5af320436b95f0'; // 흰 둥근사각 9-slice(틴트용 · 테두리 14)
const GLOW_COLOR = '#FFD84A';                      // 노랑(컨트롤러 GlowYellow 와 같은 값)
const GLOW_ALPHA0 = 0.15;                          // 켜질 때 첫 알파(컨트롤러 GlowMinAlpha)
const CO = 'Window/Content/Collection';
const T = CO + '/CollTemplate';
const L = [0, 0, 139.5, 134];                      // 칸 안 좌표계(왼쪽 위 기준 x,y,w,h)

// ① 불빛: 칸과 같은 크기의 노란 고리(가운데 비움 · FillCenter=false). 클릭은 통과(raycast 꺼짐).
//   그리기 순서 = Locked · Sel 바로 뒤, 이름(Name) · 칸 그림틀(Slot) · 아이콘 · 글자보다 앞서 → 글자는 불빛 위에 그려진다.
b.sprite(T + '/Glow', { anchor: 'middle-center', pos: [0, 0], rect_size: [L[2], L[3]], pivot: [0.5, 0.5], image_ruid: ROUND, sprite_type: 1, color: GLOW_COLOR, alpha: GLOW_ALPHA0, raycast: false, enable: false });
b.patchComponent(T + '/Glow', S.SPR, { FillCenter: false });
S.before(b, T + '/Glow', T + '/Name');

// ② 자물쇠 14x14: 왼쪽 끝 x 30.5 → 10(20.5px 왼쪽) · 글자 상자 86 → 108 (왼쪽 끝 48 → 27, 오른쪽 끝은 칸 안쪽 135)
S.place(b, T + '/LockIcon', { pos: S.at(10, 99, 14, 14, L) });
S.place(b, T + '/Sub', { pos: S.at(27, 97, 108, 18, L), size: [108, 18] });

// ③ 보유 재화 칩 끔(안 골랐을 때 "몬스터를 고르면 필요한 재료가 나와요" 안내만 남는다)
b.patch('Window/Footer/StateHint/HoldPlate', { enable: false });

b.write(path.join(WORLD, 'ui', 'VillageRecordGroup.ui'), { lint_verbose: !!process.env.LINT_V });
console.log('도감 창 손질 끝 — 칸 불빛 · 자물쇠/글자 상자 · 재화 칩 끔');
