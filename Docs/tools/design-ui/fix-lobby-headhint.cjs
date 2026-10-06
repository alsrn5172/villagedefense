// 로비 난이도 판 오른쪽 위 '새 매치 만들기' 글자를 지운다(사용자 2026-10-06).
// 실행(월드 루트에서): node Docs/tools/design-ui/fix-lobby-headhint.cjs — 다시 돌려도 같다.
const path = require('path');
const S = require('./skin.cjs');
const WORLD = path.resolve(__dirname, '..', '..', '..');
const b = S.open(WORLD, 'LobbyGroup');
const p = 'Window/Difficulty/HeadHint';
if (S.has(b, p)) { b.remove(p); console.log('지움: ' + p); } else console.log('이미 없음: ' + p);
b.write(path.join(WORLD, 'ui', 'LobbyGroup.ui'), { lint_verbose: !!process.env.LINT_V });
