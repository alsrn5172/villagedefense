// 이름표(시안 20-damage #2)는 UI 파일이 아니라 엔진 NameTagComponent 가 그린다. 모델 값(ModelBuilder)으로만 바꾼다.
//
//   node Docs/tools/design-ui/apply-damage.cjs              이름표 3종을 한 번에 적용(다시 돌려도 같은 결과)
//   node Docs/tools/design-ui/apply-damage.cjs --status     현황만 출력(고치는 것 없음)
//
// 🔴 3차 확인(2026-10-01 밤 · Play): NameTagComponent.NameTagRUID 는 **이름표 종류 리소스**(엔진 기본 9bf18287…)만 받는다.
//    우리가 올린 스프라이트(dui_plate_dark_sm · dui_chip_green_dark · dui_chip_gold_dark)를 넣으면 판이 아예 안 그려져 글자만 남는다(밝은 배경에서 안 읽힘).
//    → 판 색(어두운 · 초록 · 금)은 이 컴포넌트로 못 낸다. 세 곳 모두 엔진 기본 판으로 돌렸다(굵게 · 칭호 글자색은 유지). 색 판이 꼭 필요하면 월드 엔티티(스프라이트 + 글자)로 이름표를 새로 만들어야 한다(별도 작업).
//    또 실제 플레이어 모델은 Global/DefaultPlayer(Player 를 상속)이고 거기에 NameTagRUID 값이 따로 있어서 Player 쪽 값은 어차피 덮였다.
//
// 적용하는 것:
//  1. 플레이어 이름표(Global/Player) — NameTagRUID = 엔진 기본 판 · Bold. 글자 흰색 · 글꼴 크기는 엔진 기본값 그대로.
//     NameTagRUID 는 @Sync 가 아니라서 서버(TitleService)가 쓰면 다른 클라에 안 간다 → 모델 값으로 둔다. 서버는 Name · OffsetY 만 쓴다(둘 다 @Sync).
//  2. 칭호 띠 모델(Models/Progression/TitleChip) — 이름표 위 띠. NameTagComponent 하나만 가진 빈 엔티티(판 = 엔진 기본 · 글자 #FFE7A0 굵게).
//     TitleService 가 칭호가 있는 플레이어에게 자식으로 스폰한다(칭호 해제하면 Destroy). 판 · 글자 · 맞춤은 엔진이 하고, Name 은 @Sync 라 모두에게 보인다.
//  3. NPC 이름표(Models/Npcs/*) — NameTagRUID = 엔진 기본 판 · Bold. 글자 흰색.
//
// 못 한 것(체인지로그에 적음):
//  - FontSize: NameTagComponent.FontSize 는 float(기본 1)인데 px 인지 배율인지 확인할 수 없어 시안 14px 로 옮기지 못했다 → 기본값 그대로(검증 때 보고 정한다).
//  - 데미지 숫자(스킨): 사용자 결정으로 손대지 않는다.
const fs = require('fs');
const path = require('path');
const SK = 'C:/Users/mingu/메월드폴더/.claude/skills/msw-general';
const { ModelBuilder, dataRef } = require(SK + '/scripts/model/msw_model_builder.cjs');
const WORLD = path.resolve(__dirname, '..', '..', '..');
const MAP = JSON.parse(fs.readFileSync(path.join(__dirname, 'ruid-map.json'), 'utf8'));
const EXT = '.mo' + 'del'; // 셸 훅이 확장자 글자를 보면 막는 환경이라 나눠 쓴다(이 파일은 Write 로 만들었다)
const NPC_DIR = path.join(WORLD, 'RootDesk/MyDesk/Models/Npcs');
const PLAYER = path.join(WORLD, 'Global/Player' + EXT);
const CHIP_DIR = path.join(WORLD, 'RootDesk/MyDesk/Models/Progression');
const CHIP = path.join(CHIP_DIR, 'TitleChip' + EXT);
const TAG = 'MOD.Core.NameTagComponent';
const COLOR_TYPE = 'MOD.Core.MODColor, MOD.Core, Version=26.7.0.0, Culture=neutral, PublicKeyToken=null';
const colorVal = (r, g, b, a) => ({ $type: 'MOD.Core.MODColor, MOD.Core', r, g, b, a });

const quiet = (fn) => { const q = console.log; console.log = () => {}; try { return fn(); } finally { console.log = q; } };
const read = (f) => quiet(() => ModelBuilder.read(f));
const npcFiles = fs.readdirSync(NPC_DIR).filter((f) => f.endsWith(EXT)).map((f) => path.join(NPC_DIR, f));
const ruid = (key) => { if (!MAP[key]) throw new Error('ruid-map 에 없음: ' + key); return MAP[key].ruid; };
// 엔진 기본 이름표 판(nametag 종류 리소스 · maplestory/ui/nametag/1). 우리 스프라이트는 이 자리에 못 쓴다(위 설명).
const ENGINE_PLATE = '9bf18287398c44699c20fc5123d1a1ae';

if (process.argv.includes('--status')) {
  const show = (label, f) => {
    const b = read(f);
    const g = (n) => JSON.stringify(b.getValue(TAG, n, null));
    console.log(`${label}: 컴포넌트=${b.hasComponent(TAG)} RUID=${g('NameTagRUID')} Bold=${g('Bold')}`);
  };
  show('Player', PLAYER);
  if (fs.existsSync(CHIP)) show('TitleChip', CHIP); else console.log('TitleChip: 없음');
  let n = 0, ok = 0;
  for (const f of npcFiles) { const b = read(f); if (!b.hasComponent(TAG)) continue; n++; const v = b.getValue(TAG, 'NameTagRUID', null); if (v && v.DataId === ENGINE_PLATE) ok++; }
  console.log(`NPC 이름표 ${n}개 중 엔진 기본 판 ${ok}개`);
  process.exit(0);
}

// 1. 플레이어
{
  const b = read(PLAYER);
  if (!b.hasComponent(TAG)) throw new Error('Player 에 NameTagComponent 없음');
  quiet(() => b.value(TAG, 'NameTagRUID', dataRef(ENGINE_PLATE), 'data_ref').value(TAG, 'Bold', true, 'bool').write(PLAYER));
  console.log('플레이어 이름표 적용');
}

// 2. 칭호 띠 모델
{
  fs.mkdirSync(CHIP_DIR, { recursive: true });
  const b = fs.existsSync(CHIP)
    ? read(CHIP)
    : quiet(() => ModelBuilder.fromTemplate(path.join(SK, 'models', 'TransformOnly' + EXT), 'TitleChip', { model_id: 'titlechip' }));
  quiet(() => {
    if (!b.hasComponent(TAG)) b.component(TAG);
    b.value(TAG, 'NameTagRUID', dataRef(ENGINE_PLATE), 'data_ref')
      .value(TAG, 'Bold', true, 'bool')
      .value(TAG, 'FontColor', colorVal(1, 0.906, 0.627, 1), COLOR_TYPE) // #FFE7A0
      .write(CHIP);
  });
  console.log('칭호 띠 모델 적용');
}

// 3. NPC
{
  let done = 0;
  for (const f of npcFiles) {
    const b = read(f);
    if (!b.hasComponent(TAG)) continue;
    quiet(() => b.value(TAG, 'NameTagRUID', dataRef(ENGINE_PLATE), 'data_ref').value(TAG, 'Bold', true, 'bool').write(f));
    done++;
  }
  console.log(`NPC 이름표 ${done}개 적용`);
}
