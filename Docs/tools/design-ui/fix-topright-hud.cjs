// 오른쪽 위 HUD 를 MSW 기본 버튼(캔버스 x 1725~1897) 바로 왼쪽에 붙인다 (WO-051 · 사용자 2026-10-06 "공중에 둥둥 뜬 것 같음 → 우측으로 잘 붙여").
//   원인: 친구 · 메뉴 칸(WO-046 에서 런타임에 끔)이 비어 캐릭터 · 스킬 · 도움말이 그 폭(152)만큼 왼쪽에 떠 있었고, 높이도 기본 버튼보다 17 위였다.
//   고침(좌표만 · 다른 값은 그대로): 캐릭터 · 스킬 = 친구 · 메뉴 자리로(+152) · 도움말 칸 +152 · 두 묶음 모두 위에서 37(기본 버튼 가운데 높이에 맞춤).
//   apply-hud-status.cjs · apply-intro-coach.cjs(buildHelp) 의 좌표도 같은 값으로 고쳐 다시 만들어도 같게 했다.
// 실행(월드 루트): node Docs/tools/design-ui/fix-topright-hud.cjs
const path = require('path');
const WORLD = path.resolve(__dirname, '..', '..', '..');
const { UIBuilder } = require(path.join(WORLD, '..', '..', '.claude', 'skills', 'msw-ui-system', 'scripts', 'msw_ui_builder.cjs'));
const TOP = -37;

const hud = UIBuilder.load(path.join(WORLD, 'ui', 'StatusHUD.ui'));
const pos = (b, p) => { const t = b.getComponent(p, 'MOD.Core.UITransformComponent'); return t.anchoredPosition; };
hud.patch('Shortcuts', { pos: [pos(hud, 'Shortcuts').x, TOP] });
hud.patch('Shortcuts/BtnCharacter', { pos: [38, pos(hud, 'Shortcuts/BtnCharacter').y] });
hud.patch('Shortcuts/BtnSkill', { pos: [114, pos(hud, 'Shortcuts/BtnSkill').y] });
hud.write(path.join(WORLD, 'ui', 'StatusHUD.ui'));

const help = UIBuilder.load(path.join(WORLD, 'ui', 'HelpHudGroup.ui'));
help.patch('Shortcut', { pos: [-355, TOP] });
help.write(path.join(WORLD, 'ui', 'HelpHudGroup.ui'));
console.log('top-right HUD moved: Character/Skill +152 · Help +152 · top', TOP);
