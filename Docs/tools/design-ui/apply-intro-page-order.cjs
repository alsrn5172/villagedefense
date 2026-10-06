// 도움말(GameIntroGroup) 소개 쪽 순서: 8쪽 "튜토리얼 시작"을 맨 앞 1쪽으로, 나머지(옛 1~7쪽)는 한 쪽씩 뒤로(2~8쪽) (사용자 2026-10-07, WO-054).
//   쪽 노드 이름(P1~P8) · 쪽 번호 글자("N / 8")만 바꾼다. 쪽 안 노드의 UUID 는 그대로라 GameIntroController 바인딩(튜토리얼 버튼 · 질문 글)은 안 깨진다.
//   쪽 점(D1~D8)은 위치 표시라 이름을 바꾸지 않는다. 한 번만 돈다(이미 바뀐 파일에서 다시 돌리면 순서가 또 밀리므로 멈춘다).
// 실행(월드 루트): node Docs/tools/design-ui/apply-intro-page-order.cjs   → 그 뒤 Maker refresh
const path = require('path');
const S = require('./skin.cjs');
const WORLD = path.resolve(__dirname, '..', '..', '..');
const b = S.open(WORLD, 'GameIntroGroup');
const base = 'Root/Window/Pages';

// 이미 적용됐는지: P1 안에 튜토리얼 시작 버튼(BtnStart)이 있으면 적용 끝난 파일
if (S.has(b, `${base}/P1/BtnStart`)) {
  console.log('이미 적용됨: P1 = 튜토리얼 시작 쪽 — 건너뜀');
  process.exit(0);
}
if (!S.has(b, `${base}/P8/BtnStart`)) throw new Error('P8 에 BtnStart 가 없다 — 예상한 옛 순서가 아니다');

b.rename(`${base}/P8`, 'P0');
for (let i = 7; i >= 1; i--) b.rename(`${base}/P${i}`, `P${i + 1}`);
b.rename(`${base}/P0`, 'P1');
for (let i = 1; i <= 8; i++) S.font(b, `${base}/P${i}/Num`, { text: `${i} / 8` });
S.back(b, `${base}/P1`);      // 파일 안 배열에서도 맨 앞(Maker 계층창에서 P1 이 위)

b.write(path.join(WORLD, 'ui', 'GameIntroGroup.ui'), { lint_verbose: !!process.env.LINT_V });
console.log('intro pages: P8 -> P1, P1..P7 -> P2..P8');
