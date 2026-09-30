// 데미지 숫자 · 이름표(시안 20-damage)는 UI 파일이 아니라 엔진 컴포넌트(DamageSkinSettingComponent · NameTagComponent)가 그린다.
// 1단계에서 확신할 수 없는 것은 하지 않는다 → 기본 실행은 아무것도 고치지 않고 현황만 찍는다.
//
//   node Docs/tools/design-ui/apply-damage.cjs              현황만 출력(고치는 것 없음)
//   node Docs/tools/design-ui/apply-damage.cjs --nametag    NPC 모델(Models/Npcs)의 이름표 판을 초록 칩으로 + 굵게(선택 적용 · 되돌리기는 git checkout)
//
// 못 한 것(보고에 적음):
//  - 데미지 숫자: 엔진 "데미지 스킨"은 아바타 아이템 종류 리소스(기본 스킨 3271c3e7… 이 아바타 카탈로그에 있다). 시안 숫자 22장(dmg_0~9 · dmg_crit_0~9 · burst · miss)을
//    스킨으로 만들려면 Maker 아바타 아이템 편집기 경로가 필요한데 이 저장소에서 확인되지 않았다 → 만들지 않았다. Monster.mlua 의 DamageSkinRUID(02c22d93…)와 플레이어 모델은 그대로.
//  - 플레이어 이름표: NameTagRUID 는 @Sync 가 아니라서 서버(TitleService)가 써도 다른 클라에 안 간다 → Global/Player.model 값을 바꿔야 한다. 판이 9-slice 로 늘어나는지도 미확인이라 안 했다.
//  - 칭호 띠(이름표 위 금 띠): 이름표 컴포넌트 하나로 두 겹을 못 그린다 → 별 엔티티(기능 추가)라 2단계.
const fs = require('fs');
const path = require('path');
const { ModelBuilder, dataRef } = require('C:/Users/mingu/메월드폴더/.claude/skills/msw-general/scripts/model/msw_model_builder.cjs');
const WORLD = path.resolve(__dirname, '..', '..', '..');
const MAP = JSON.parse(fs.readFileSync(path.join(__dirname, 'ruid-map.json'), 'utf8'));
const NPC_DIR = path.join(WORLD, 'RootDesk/MyDesk/Models/Npcs');
const TAG = 'MOD.Core.NameTagComponent';

const files = fs.readdirSync(NPC_DIR).filter((f) => f.endsWith('.model')).map((f) => path.join(NPC_DIR, f));
if (!process.argv.includes('--nametag')) {
  const quiet = console.log; let n = 0;
  for (const f of files) { console.log = () => {}; const b = ModelBuilder.read(f); const has = b.hasComponent(TAG); console.log = quiet; if (has) n++; }
  console.log(`NPC 모델 ${files.length}개 중 이름표 컴포넌트 ${n}개 · 고친 것 없음 (--nametag 로 NPC 이름표 판 교체)`);
  process.exit(0);
}
const plate = MAP.chip_green_dark.ruid; // 9-slice 테두리 10px(올린 그림 기준)
let done = 0;
for (const f of files) {
  const b = ModelBuilder.read(f);
  if (!b.hasComponent(TAG)) continue;
  b.value(TAG, 'NameTagRUID', dataRef(plate), 'data_ref').value(TAG, 'Bold', true, 'bool').write(f);
  done++;
}
console.log(`NPC 이름표 ${done}개 적용`);
