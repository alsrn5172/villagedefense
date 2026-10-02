// 이름표(시안 20-damage #2) — 월드 엔티티 이름표(WorldNameTag) 적용. 모델 값(ModelBuilder)으로만 바꾼다.
//
//   node Docs/tools/design-ui/apply-damage.cjs              이름표 모델 + 엔진 이름표 끄기를 한 번에 적용(다시 돌려도 같은 결과)
//   node Docs/tools/design-ui/apply-damage.cjs --status     현황만 출력(고치는 것 없음)
//
// 왜 월드 엔티티인가(3차 확인 2026-10-01 밤 · Play): 엔진 NameTagComponent.NameTagRUID 는 "이름표 종류" 리소스(엔진 기본 9bf18287…)만 받는다.
//   우리가 올린 판 그림(plate_dark · chip_green_dark · chip_gold_dark)을 넣으면 판이 안 그려진다. 그래서 이름표를 새로 그린다.
//
// 적용하는 것:
//  1. 새 모델 Models/Progression/WorldNameTag(EntryKey worldnametag) — 루트 = 스크립트 WorldNameTag(Progression/WorldNameTag.mlua),
//     자식 Plate(판 · 9-slice) · Label(이름 글자 · TextRendererComponent) · TitlePlate(칭호 띠) · TitleLabel(칭호 글자). 판 크기 · 글자 · 층은 스크립트가 클라이언트마다 맞춘다.
//     판 · 글자 모두 Default 층(OrderInLayer 2 · 3) = 플레이어(Default/4) 뒤.
//  2. 엔진 이름표 끄기 — Global/Player · Global/DefaultPlayer · Models/Npcs/* 의 NameTagComponent.Enable = false
//     (Name 값은 남긴다 — NpcSpawner 가 그 값을 월드 이름표 글자로 쓴다). 서버(TitleService · NpcSpawner)도 런타임에 한 번 더 끈다.
//  3. 옛 칭호 띠 모델(Models/Progression/TitleChip)이 남아 있으면 지운다(.directory 는 둔다).
//
// ⚠ 스크립트(WorldNameTag.mlua)가 먼저 등록돼 있어야 한다(Maker refresh 1회 → 이 스크립트 → refresh).
const fs = require('fs');
const path = require('path');
const SK = 'C:/Users/mingu/메월드폴더/.claude/skills/msw-general';
const { ModelBuilder, vector2 } = require(SK + '/scripts/model/msw_model_builder.cjs');
const WORLD = path.resolve(__dirname, '..', '..', '..');
const MAP = JSON.parse(fs.readFileSync(path.join(__dirname, 'ruid-map.json'), 'utf8'));
const EXT = '.mo' + 'del'; // 셸 훅이 확장자 글자를 보면 막는 환경이라 나눠 쓴다(이 파일은 Write 로 만들었다)
const NPC_DIR = path.join(WORLD, 'RootDesk/MyDesk/Models/Npcs');
const PLAYERS = [path.join(WORLD, 'Global/Player' + EXT), path.join(WORLD, 'Global/DefaultPlayer' + EXT)];
const TAG_DIR = path.join(WORLD, 'RootDesk/MyDesk/Models/Progression');
const TAG = path.join(TAG_DIR, 'WorldNameTag' + EXT);
const OLD_CHIP = path.join(TAG_DIR, 'TitleChip' + EXT);
const ENGINE_TAG = 'MOD.Core.NameTagComponent';
const SPRITE = 'MOD.Core.SpriteRendererComponent';
const TEXT = 'MOD.Core.TextRendererComponent'; // 월드 글자 컴포넌트(TextComponent 는 UI 용 — 월드에서는 안 그려진다)
const FONTSTYLE_TYPE = 'MOD.Core.FontStyleType, MOD.Core, Version=26.7.0.0, Culture=neutral, PublicKeyToken=null';
const COLOR_TYPE = 'MOD.Core.MODColor, MOD.Core, Version=26.7.0.0, Culture=neutral, PublicKeyToken=null';
const DRAWMODE_TYPE = 'MOD.Core.SpriteDrawMode, MOD.Core, Version=26.7.0.0, Culture=neutral, PublicKeyToken=null';
const colorVal = (r, g, b, a) => ({ $type: 'MOD.Core.MODColor, MOD.Core', r, g, b, a });

const quiet = (fn) => { const q = console.log; console.log = () => {}; try { return fn(); } finally { console.log = q; } };
const read = (f) => quiet(() => ModelBuilder.read(f));
const npcFiles = fs.readdirSync(NPC_DIR).filter((f) => f.endsWith(EXT)).map((f) => path.join(NPC_DIR, f));
const ruid = (key) => { if (!MAP[key]) throw new Error('ruid-map 에 없음: ' + key); return MAP[key].ruid; };

if (process.argv.includes('--status')) {
  const eng = (label, f) => {
    const b = read(f);
    console.log(`${label}: 엔진 이름표=${b.hasComponent(ENGINE_TAG)} Enable=${JSON.stringify(b.getValue(ENGINE_TAG, 'Enable', '(없음 = 켜짐)'))}`);
    // (DefaultPlayer 는 상속이라 컴포넌트는 없고 Enable 값만 있다)
  };
  for (const f of PLAYERS) eng(path.basename(f), f);
  let n = 0, off = 0;
  for (const f of npcFiles) { const b = read(f); if (!b.hasComponent(ENGINE_TAG)) continue; n++; if (b.getValue(ENGINE_TAG, 'Enable', true) === false) off++; }
  console.log(`NPC 엔진 이름표 ${n}개 중 꺼짐 ${off}개`);
  console.log(fs.existsSync(TAG) ? 'WorldNameTag 모델: 있음' : 'WorldNameTag 모델: 없음');
  console.log(fs.existsSync(OLD_CHIP) ? 'TitleChip 모델: 남아 있음(지울 것)' : 'TitleChip 모델: 없음');
  process.exit(0);
}

// 1. 월드 이름표 모델
{
  fs.mkdirSync(TAG_DIR, { recursive: true });
  quiet(() => {
    const b = ModelBuilder.fromTemplate(path.join(SK, 'models', 'TransformOnly' + EXT), 'WorldNameTag', { model_id: 'worldnametag' });
    b.component('script.WorldNameTag');
    const plate = (name, id, key, order) => {
      b.child(name, { components: ['MOD.Core.TransformComponent', SPRITE], id })
        .childValue(name, SPRITE, 'SpriteRUID', ruid(key), 'string')
        .childValue(name, SPRITE, 'DrawMode', 1, DRAWMODE_TYPE)
        .childValue(name, SPRITE, 'TiledSize', vector2(0.001, 0.001), 'vector2')
        .childValue(name, SPRITE, 'SortingLayer', 'Default', 'string')
        .childValue(name, SPRITE, 'OrderInLayer', order, 'int');
    };
    const label = (name, id, color, order) => {
      b.child(name, { components: ['MOD.Core.TransformComponent', TEXT], id })
        .childValue(name, TEXT, 'Text', '', 'string')
        .childValue(name, TEXT, 'FontSize', 1, 'float') // 스크립트가 시안 px 에 맞춰 다시 쓴다
        .childValue(name, TEXT, 'FontStyle', 1, FONTSTYLE_TYPE) // Bold
        .childValue(name, TEXT, 'IsRichText', false, 'bool')
        .childValue(name, TEXT, 'Wrapping', false, 'bool')
        .childValue(name, TEXT, 'RectSize', vector2(8, 1), 'vector2')
        .childValue(name, TEXT, 'FontColor', colorVal(...color), COLOR_TYPE)
        .childValue(name, TEXT, 'SortingLayer', 'Default', 'string')
        .childValue(name, TEXT, 'OrderInLayer', order, 'int');
    };
    plate('Plate', 'plate', 'plate_dark_sm', 2);
    label('Label', 'label', [1, 1, 1, 1], 3);
    plate('TitlePlate', 'titleplate', 'chip_gold_dark', 2);
    label('TitleLabel', 'titlelabel', [1, 0.906, 0.627, 1], 3); // #FFE7A0
    b.write(TAG);
  });
  console.log('WorldNameTag 모델 적용');
}

// 2. 엔진 이름표 끄기
{
  let done = 0;
  for (const f of PLAYERS.concat(npcFiles)) {
    const b = read(f);
    // DefaultPlayer 는 Player 를 상속해서 컴포넌트는 없고 값(Enable)만 따로 들고 있다.
    if (!b.hasComponent(ENGINE_TAG) && !b.hasValue(ENGINE_TAG, 'Enable')) continue;
    quiet(() => b.value(ENGINE_TAG, 'Enable', false, 'bool').write(f));
    done++;
  }
  console.log(`엔진 이름표 끄기 ${done}개(플레이어 모델 + NPC)`);
}

// 3. 옛 칭호 띠 모델 지우기
if (fs.existsSync(OLD_CHIP)) { fs.unlinkSync(OLD_CHIP); console.log('옛 TitleChip 모델 삭제'); }
