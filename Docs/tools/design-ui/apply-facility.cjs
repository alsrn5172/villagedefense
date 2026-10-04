// 방어 시설 HP 바(시안 19-facility #16)를 입힌다: lanehpbar 모델에 틀(Track) + 채움(Fill) 스프라이트 자식 2개를 붙인다.
// 오라 띠(#17)는 모델이 아니라 Faction/AuraEmitter.mlua 가 런타임에 RUID 를 바꾼다(이 스크립트는 안 건드린다).
// 실행(월드 루트에서): node Docs/tools/design-ui/apply-facility.cjs   — 두 번 돌려도 같은 결과.
// 스크립트(Lane/LaneHpBar.mlua)가 자식을 이름(Track / Fill)으로 찾는다 → 이름을 바꾸지 않는다.
const fs = require('fs');
const path = require('path');
const { ModelBuilder, vector3 } = require('C:/Users/mingu/메월드폴더/.claude/skills/msw-general/scripts/model/msw_model_builder.cjs');
const WORLD = path.resolve(__dirname, '..', '..', '..');
const MAP = JSON.parse(fs.readFileSync(path.join(__dirname, 'ruid-map.json'), 'utf8'));
const R = (k) => { if (!MAP[k]) throw new Error('ruid-map 에 없는 그림: ' + k); return MAP[k].ruid; };
const PIXEL = 'MOD.Core.PixelRendererComponent';
const TF = 'MOD.Core.TransformComponent';
const SR = 'MOD.Core.SpriteRendererComponent';

const FILE = path.join(WORLD, 'RootDesk/MyDesk/Models/Structures/LaneHpBar.model');
const b = ModelBuilder.read(FILE);

// 옛 픽셀 렌더러(16×3 계단)는 끈다. 컴포넌트는 지우지 않는다(다른 곳이 잡고 있을 수 있다).
if (b.hasComponent(PIXEL)) b.enable(PIXEL, false);

function ensureChild(name, id, ruid, order) {
  if (!b.hasChild(name)) b.child(name, { components: [TF, SR], id, enable: true, visible: true });
  b.childValue(name, SR, 'SpriteRUID', ruid, 'string');
  b.childValue(name, SR, 'OrderInLayer', order, 'int');
  b.childValue(name, TF, 'Position', vector3(0, 0, 0), 'vector3');
  b.childValue(name, TF, 'Scale', vector3(1, 1, 1), 'vector3');
}
// 틀 = 시안 gauge_track(흰 틀 + 금 테) · 채움 = hpbar_fill(흰 · 스크립트가 색과 폭을 준다). 그리기 순서: 틀(160) 뒤 · 채움(161) 앞.
ensureChild('Track', 'lanehpbar_track', R('gauge_track'), 160);
ensureChild('Fill', 'lanehpbar_fill', R('hpbar_fill'), 161);

b.write(FILE);
console.log('LaneHpBar 모델 적용 끝 — 자식 ' + b.listChildren().length + '개');
