// 읽기 전용: UI 파일 하나의 엔티티 컴포넌트 원본 모양을 찍는다.
// 실행(월드 루트에서): node Docs/tools/design-ui/probe.cjs <UI이름> <엔티티 경로> [컴포넌트]
const path = require('path');
const { UIBuilder } = require('C:/Users/mingu/메월드폴더/.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const [name, ent, comp] = process.argv.slice(2);
const quiet = console.log; console.log = () => {};
const b = UIBuilder.read(path.join('ui', name + '.ui'));
console.log = quiet;
if (comp) console.log(JSON.stringify(b.getComponent(ent, comp)));
else { const e = b.find(ent); console.log(e ? e.componentNames : 'NOT FOUND'); console.log(JSON.stringify((e.jsonString['@components'] || []).map((c) => c['@type']))); }
