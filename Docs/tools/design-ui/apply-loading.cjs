// WO-050 §2-17 — 전체 화면 로딩 그룹. UIBuilder로만 생성하며 ExitWarnGroup(40)보다 위에 둔다.
// 이동 입력은 가리지 않는다(blocks_raycasts=false). 화면 전환 중에도 포탈 연타는 PortalNetwork가 별도로 막는다.
// 실행: node Docs/tools/design-ui/apply-loading.cjs
const fs = require('fs');
const path = require('path');
const { UIBuilder } = require('C:/Users/mingu/메월드폴더/.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const OUT = path.join(ROOT, 'ui', 'LoadingGroup.ui');
const SCRIPT = path.join(ROOT, 'RootDesk', 'MyDesk', 'Map', 'LoadingScreenController.mlua');
const RUIDS = JSON.parse(fs.readFileSync(path.join(__dirname, 'ruid-map.json'), 'utf8'));
const keys = [
  'loading_lith_henesys_day', 'loading_lith_henesys_night',
  'loading_kerning_perion_day', 'loading_kerning_perion_night',
  'loading_ellinia_nautilus_day', 'loading_ellinia_nautilus_night',
];
for (const key of keys) if (!RUIDS[key] || !/^[0-9a-f]{32}$/i.test(RUIDS[key].ruid || '')) throw new Error('ruid-map에 로딩 그림 키가 없습니다: ' + key);
const ruidProps = {
  RuidLithDay: 'loading_lith_henesys_day', RuidLithNight: 'loading_lith_henesys_night',
  RuidKerningDay: 'loading_kerning_perion_day', RuidKerningNight: 'loading_kerning_perion_night',
  RuidElliniaDay: 'loading_ellinia_nautilus_day', RuidElliniaNight: 'loading_ellinia_nautilus_night',
};

function injectResourceRuids() {
  let lua = fs.readFileSync(SCRIPT, 'utf8');
  for (const [prop, key] of Object.entries(ruidProps)) {
    const line = new RegExp(`(^[\\t ]*property string ${prop} = ")[^"]*("[\\t ]*$)`, 'm');
    if (!line.test(lua)) throw new Error('LoadingScreenController.mlua 속성을 찾지 못했습니다: ' + prop);
    lua = lua.replace(line, `$1${RUIDS[key].ruid}$2`);
  }
  fs.writeFileSync(SCRIPT, lua, 'utf8');
}

const b = fs.existsSync(OUT) ? UIBuilder.load(OUT) : new UIBuilder('LoadingGroup');
b.group('LoadingGroup', { default_show: true, group_order: 41, group_type: 1, blocks_raycasts: false, interactable: false });
b.sprite('BlackBase', { anchor: 'stretch', pos: [0, 0], rect_size: [1920, 1080], image_ruid: RUIDS[keys[0]].ruid, sprite_type: 0, color: '#000000', alpha: 1, raycast: false });
b.sprite('Background', { anchor: 'stretch', pos: [0, 0], rect_size: [1920, 1080], image_ruid: RUIDS[keys[0]].ruid, sprite_type: 0, color: '#FFFFFF', alpha: 1, raycast: false });
b.script('Controller', 'script.LoadingScreenController', { anchor: 'stretch', pos: [0, 0], rect_size: [1920, 1080] });
b.patchComponent('LoadingGroup', 'MOD.Core.CanvasGroupComponent', { GroupAlpha: 0, BlocksRaycasts: false, Interactable: false });
b.patch('BlackBase', { display_order: 0 });
b.patch('Background', { display_order: 1 });
b.patch('Controller', { display_order: 2 });
b.write(OUT, {
  bind: {
    mlua: SCRIPT,
    props: {
      loadingGroup: 'LoadingGroup',
      canvasGroup: 'LoadingGroup',
      background: 'Background',
    },
  },
});
injectResourceRuids();
console.log('wrote', OUT);
