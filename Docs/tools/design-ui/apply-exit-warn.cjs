// WO-046 — 게임 종료 경고 띠(ExitWarnGroup). 엔진 나가기 창이 열릴 때 매치 중이면 화면 위쪽에 같이 뜬다(Match/ExitWarnController).
// 그림은 이미 있는 디자이너 시안 조각을 그대로 쓴다(부활 창 RevivePopupGroup 과 같은 틀 · 제목 띠 · 경고 아이콘 · 글자 색).
// 클릭을 막지 않는다(그룹 blocks_raycasts false) — 실제 나가기 버튼은 엔진 창에 있다. 다시 돌려도 같은 결과.
// 실행: node Docs/tools/design-ui/apply-exit-warn.cjs
const path = require('path');
const { UIBuilder } = require('C:/Users/mingu/메월드폴더/.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const OUT = path.join(ROOT, 'ui', 'ExitWarnGroup.ui');
const RUID = {
  panel: 'b3bc892e452f4d1caa603520cf61f4c8', // 부활 창 판(Sliced)
  band: 'd43b23d1acc147d58f63f89de7a38731', // 제목 띠(Sliced)
  icon: 'fe93d5758bfb4bc195d38af013192973', // 제목 띠 경고 아이콘
};
const CORAL = { r: 1, g: 0.8157, b: 0.7843, a: 1 };
const IVORY = { r: 0.9529, g: 0.9333, b: 0.8863, a: 1 };
const SUB = { r: 0.6824, g: 0.7216, b: 0.8118, a: 1 };
const SHADOW = { r: 0.0275, g: 0.0431, b: 0.0863, a: 1 };

const b = new UIBuilder('ExitWarnGroup');
b.group('ExitWarnGroup', { default_show: true, group_order: 40, blocks_raycasts: false, interactable: false });
b.sprite('Panel', { anchor: 'middle-center', pos: [0, 330], rect_size: [700, 196], image_ruid: RUID.panel, sprite_type: 1, color: '#FFFFFF', alpha: 1, raycast: false });
b.sprite('Panel/TitleBand', { anchor: 'middle-center', pos: [0, 50], rect_size: [660, 64], image_ruid: RUID.band, sprite_type: 1, color: '#FFFFFF', alpha: 1, raycast: false });
b.sprite('Panel/TitleBand/Icon', { anchor: 'middle-center', pos: [-236, 0], rect_size: [34, 32], image_ruid: RUID.icon, sprite_type: 0, color: '#FFFFFF', alpha: 1, raycast: false });
b.text('Panel/TitleBand/Title', '매치 중에 나가면 불이익이 있어요', { size: 28, alignment: 4, anchor: 'middle-center', pos: [20, 0], rect_size: [460, 40] });
b.patchComponent('Panel/TitleBand/Title', 'MOD.Core.TextGUIRendererComponent', { Font: 'Maple', FontColor: CORAL, Underlay: true, UnderlayColor: SHADOW });
b.text('Panel/Message', '지금 나가면 포기로 처리됩니다 — 넥서스가 0 이 되어 탈락하고 순위 보상을 받을 수 없어요.', { size: 19, alignment: 4, anchor: 'middle-center', pos: [0, -14], rect_size: [640, 30] });
b.patchComponent('Panel/Message', 'MOD.Core.TextGUIRendererComponent', { Font: 'Maple', FontColor: IVORY, Underlay: true, UnderlayColor: SHADOW });
b.text('Panel/Hint', '그래도 나가려면 나가기 창에서 계속 진행하세요', { size: 16, alignment: 4, anchor: 'middle-center', pos: [0, -52], rect_size: [640, 24] });
b.patchComponent('Panel/Hint', 'MOD.Core.TextGUIRendererComponent', { Font: 'Default', FontColor: SUB });
b.patch('Panel', { enable: false }); // 처음엔 꺼 둔다(컨트롤러가 켠다 · 로드 순간 깜빡임 방지)
b.write(OUT, {
  bind: {
    mlua: path.join(ROOT, 'RootDesk', 'MyDesk', 'Match', 'ExitWarnController.mlua'),
    props: { panel: 'Panel' },
  },
});
console.log('wrote', OUT);
