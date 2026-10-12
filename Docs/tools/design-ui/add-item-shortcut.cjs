// 오른쪽 위 바로가기에 V 아이템 버튼(BtnItem)을 더한다 (1.0.3-M7-03 · 원문 "우측 상단에 스탯창·아이템창에 접근할 수 있는 UI를 추가한다").
//   자리: Shortcuts 가운데 −114 의 빈 슬롯(도움말 H 바로 왼쪽 · 캔버스 x 1425~1489). 캐릭터(C) 버튼과 같은 모양: 아이콘 ico_bag · 키 칩 "V" · 라벨 "아이템". 빨간 알림 배지는 없다.
//   스탯창(C) 쪽은 이미 BtnCharacter 가 있다 — 이 버튼은 장비 · 인벤토리 탭(V 키와 같음)으로 열고, 연결은 Summon/StatusHUDController.mlua (btnItem → ToggleTab(1)).
//   apply-hud-status.cjs 를 다시 돌리면 UUID 가 전부 새로 나오고 Maker 에서 손댄 좌표 · 색이 지워지므로(헤더 주석) 그 스크립트는 사본만 맞추고, 이 파일이 노드만 UIBuilder 로 더한다.
//   다시 돌려도 같은 결과(이미 있으면 같은 값으로 맞춘다) · 기존 노드는 건드리지 않는다. 쓰고 나면 StatusHUDController 의 btnItem 에 UUID 가 주입된다.
// 실행(월드 루트): node Docs/tools/design-ui/add-item-shortcut.cjs
const path = require('path');
const WORLD = path.resolve(__dirname, '..', '..', '..');
const { UIBuilder } = require(path.join(WORLD, '..', '..', '.claude', 'skills', 'msw-ui-system', 'scripts', 'msw_ui_builder.cjs'));

const SRC = 'Shortcuts/BtnCharacter';
const DST = 'Shortcuts/BtnItem';
const POS = [-114, 10.5];                                  // Shortcuts 가운데 기준 (C +38 · K +114 · 빈 슬롯 −114)
const ICO_BAG = '5d612c6dc8de45a5bb628f3c5a34c518';        // ruid-map.json ico_bag (CharacterGroup 탭1 아이콘과 같은 그림)
const clone = (o) => JSON.parse(JSON.stringify(o));
const SPR = 'MOD.Core.SpriteGUIRendererComponent';
const TXT = 'MOD.Core.TextGUIRendererComponent';
const UIT = 'MOD.Core.UITransformComponent';

const b = UIBuilder.load(path.join(WORLD, 'ui', 'StatusHUD.ui'));
if (!b.find(SRC)) throw new Error('본보기 노드가 없다: ' + SRC);

// 본보기 노드 하나를 같은 구성으로 복제한다: 만드는 함수(modelId 별)로 먼저 만들고, 컴포넌트는 본보기 값을 통째로 복사한다.
function cloneNode(srcRel, dstRel) {
  const e = b.find(srcRel);
  const model = e.jsonString.modelId;
  if (model === 'uibutton') b.button(dstRel, '', { rect_size: [64, 64] });
  else if (model === 'uitextguirenderer') b.text(dstRel, '', {});
  else b.sprite(dstRel, {});
  const types = e.jsonString['@components'].map((c) => c['@type']);
  for (const c of e.jsonString['@components']) b.upsertComponent(dstRel, c['@type'], clone(c));
  for (const c of b.find(dstRel).jsonString['@components']) {
    if (!types.includes(c['@type'])) b.removeComponent(dstRel, c['@type']);
  }
}

cloneNode(SRC, DST);
b.patch(DST, { pos: POS });
for (const kid of ['Icon', 'KeyChip', 'KeyChip/Text', 'Label']) cloneNode(SRC + '/' + kid, DST + '/' + kid);   // Alert(빨간 배지)는 복제하지 않는다
b.patchComponent(DST + '/Icon', SPR, { ImageRUID: { DataId: ICO_BAG } });
b.patchComponent(DST + '/KeyChip/Text', TXT, { Text: 'V' });
b.patchComponent(DST + '/Label', TXT, { Text: '아이템' });

// 위치가 Offset 에도 반영됐는지(가운데 앵커 · 64×64 → OffsetMin (−146,−21.5) · OffsetMax (−82,42.5)) 확인한다.
const t = b.getComponent(DST, UIT);
if (t.anchoredPosition.x !== POS[0] || t.anchoredPosition.y !== POS[1]) throw new Error('BtnItem 위치가 어긋났다: ' + JSON.stringify(t.anchoredPosition));

b.write(path.join(WORLD, 'ui', 'StatusHUD.ui'), {
  bind: {
    mlua: path.join(WORLD, 'RootDesk/MyDesk/Summon/StatusHUDController.mlua'),
    props: { btnItem: DST },
  },
});
console.log('BtnItem 추가 끝: ' + JSON.stringify(t.anchoredPosition) + ' size ' + JSON.stringify(t.RectSize) + ' · offset ' + JSON.stringify(t.OffsetMin) + ' ' + JSON.stringify(t.OffsetMax));
