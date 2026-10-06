// "내 기록"(AccountRecordGroup) 업적 · 칭호 탭에 새로 얻은 것 알림(빨간 ! 배지)을 단다 (사용자 2026-10-07 "칭호 같은 거 새로 얻으면 그 탭 느낌표 · 확인하면 사라지게").
//   배지 = 캐릭터 · 스킬 버튼과 같은 badge_alert(24) · 탭 오른쪽 위 · 처음엔 꺼 둔다. 켜고 끄는 쪽은 Progression/AccountRecordUIController.mlua(이름으로 찾는 자식 "Alert").
//   apply-account.cjs 를 다시 돌려도 같은 값이 나오게 그쪽 탭 반복문에도 같은 줄이 있다.
// 실행(월드 루트): node Docs/tools/design-ui/fix-account-tab-alert.cjs
const path = require('path');
const S = require('./skin.cjs');
const WORLD = path.resolve(__dirname, '..', '..', '..');
const b = S.open(WORLD, 'AccountRecordGroup');
const W = 'Window';
for (const [name, x] of [['Tab_achievement', 339], ['Tab_title', 604]]) {
  const T = [x, 196, 257, 56];
  S.newImage(b, `${W}/Tabs/${name}/Alert`, 'badge_alert', { pos: S.at(x + 231, 188, 24, 24, T), size: [24, 24], enable: false });
}
b.write(path.join(WORLD, 'ui', 'AccountRecordGroup.ui'), { lint_verbose: !!process.env.LINT_V });
console.log('account tab alerts: Tab_achievement · Tab_title');
