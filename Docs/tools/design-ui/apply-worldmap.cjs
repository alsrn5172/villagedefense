// 월드맵(WorldMapGroup)에 디자이너 시안(15-worldmap)을 입힌다 (1단계 = 겉모습).
// 실행(월드 루트에서): node Docs/tools/design-ui/apply-worldmap.cjs
// 다시 돌려도 같은 결과가 나온다. 기존 엔티티는 지우지 않고 값만 바꾼다(이름도 그대로).
// 글자·그림을 채우는 쪽은 WorldMap/WorldMapController.mlua — 아래 이름을 이름 경로로 찾는다(바꾸면 안 된다):
//   노드 Node_*/Dot · Node_*/DotHover · Board/Title · Board/TitleIcon · Board/HereChip/Text
//   Tooltip/Caption · Tooltip/Divider · Tooltip/BossBand · Tooltip/BossChip/Text · Tooltip/KindDot_Hub|Town|Hunt|Boss
//   Tooltip/Row1~5/{Badge · Icon · Name · LvChip/Text} · HereMarker·GoalMarker_*/{Flag · Label}
//
// 🔴 미리 정해 둔 것(지시): 지도 판 그림은 시안에서도 임시 그림이라 **지금 그림 · 크기 · 위치를 그대로** 두고 노드 좌표도 옮기지 않는다
//    (WorldMapNodes 의 X,Y 변경 없음). 그래서 Board 가 들고 있는 지도 그림(1294x950)은 손대지 않고,
//    창 테두리(panel_window)는 가운데를 비운 테두리 고리(FillCenter=false)로 그림 위에 얹는다.
//    새 지도 그림을 받으면(1098x806 · 0,-28) 그때 Board 그림을 판으로 바꾸고 MapArt 를 새로 놓고 노드 좌표를 x0.8485 · y-28 로 옮긴다.
const fs = require('fs');
const path = require('path');
const S = require('./skin.cjs');
const WORLD = path.resolve(__dirname, '..', '..', '..');
const b = S.open(WORLD, 'WorldMapGroup');
const before = b.listEntities().length;
const C = S.COLOR;
const ROUND = 'f5e5fbd6dd224f2d8a5af320436b95f0'; // 흰 둥근사각 9-slice(틴트용 · 지금 게임이 쓰는 기본 칸)

const BD = 'MapPanel/Board';
const TIP = BD + '/Tooltip';
const NODES = BD + '/Nodes';

// ── 시안 좌표 → Board 가운데 기준(가운데 앵커) ──
// 시안 캔버스에서 Board 가운데 = (700, 525).  x = 중심x − 700 · y = −(중심y − 525)
const ctrX = (x, w) => x + w / 2 - 700;
const ctrY = (y, h) => -(y + h / 2 - 525);

// 새 단색 둥근 판(틴트)
function round(p, o) {
  b.sprite(p, { anchor: o.anchor || 'middle-center', pos: o.pos || [0, 0], rect_size: o.size, pivot: o.pivot || [0.5, 0.5], image_ruid: ROUND, sprite_type: 1, color: o.color, alpha: o.alpha == null ? 1 : o.alpha, raycast: false, enable: o.enable !== false });
}
// 기존 엔티티를 가운데 앵커 · 가운데 피벗으로
const ctr = (p, x, y, w, h) => S.place(b, p, { anchor: 'middle-center', pivot: [0.5, 0.5], pos: [x, y], size: [w, h] });

// ═══ 화면 막: 시안은 뒤 화면이 어두워지지 않는다. 클릭 막이 역할(ray)은 그대로 둔다 ═══
S.tint(b, 'MapPanel/Dimmer', '#000000', 0);
b.patchComponent('MapPanel/Dimmer', S.SPR, { Type: 1 });

// ═══ 창 테두리(고리) · 문장 · 제목 띠 · 지도 아이콘 · 제목 · 닫기 ═══
// 테두리: 1294x950 panel_window 를 가운데 비워서 지도 그림 위에 얹는다. 위 100 · 좌우/아래 44 가 테두리다.
S.newImage(b, BD + '/Frame', 'panel_window', { size: [1294, 950], pos: [0, 0] });
b.patchComponent(BD + '/Frame', S.SPR, { FillCenter: false });

S.newImage(b, BD + '/Crest', 'deco_crest', { pos: [0, ctrY(-2, 88)], size: [300, 88] });
S.newImage(b, BD + '/TitleBand', 'panel_title_bar', { pos: [0, ctrY(72, 64)], size: [1094, 64] });
S.newImage(b, BD + '/TitleIcon', 'ico_map', { pos: [ctrX(635.5, 34), ctrY(87, 34)], size: [34, 34] });
// (띠 안 양쪽 가는 금선 = 그라데이션 → 생략)

// 제목 "월드맵": 기존 글자를 가운데 앵커로 옮기고 시안 글꼴로. (지도 밖이면 스크립트가 x 만 옮긴다)
ctr(BD + '/Title', ctrX(681.5, 83), ctrY(83, 42), 100, 42);
S.font(b, BD + '/Title', { font: 'Maple', size: 30, color: C.title, h: 'center', v: 'middle', outline: false, shadow: true });
b.patchComponent(BD + '/Title', S.TXT, { BestFit: false });

// 닫기: 오른쪽 위 앵커였던 것을 가운데 앵커로(Board 가운데 기준 +601,+421)
ctr(BD + '/CloseBtn', ctrX(1275, 52), ctrY(78, 52), 52, 52);
S.button(b, BD + '/CloseBtn', { normal: 'btn_close_default', hover: 'btn_close_hover' });
S.font(b, BD + '/CloseBtn', { text: '' });

// 지도 밖(지금 위치: 로비) 칩: 스크립트가 글자 · 너비 · 켜고 끄기를 맡는다
S.newImage(b, BD + '/HereChip', 'chip_blue', { pos: [70.25, ctrY(91.5, 25)], size: [113.5, 25], enable: false });
S.newText(b, BD + '/HereChip/Text', '지금 위치: 로비', { font: 'Maple', size: 14, color: C.white, rect: [113.5, 25], overflow: 0 });

// ═══ 범례 (번호 없음 · 시안 s0~s5 전부에 있음) ═══
const LG = [119, 908, 457, 34];
const LGN = BD + '/Legend';
round(LGN, { pos: [ctrX(LG[0], LG[2]), ctrY(LG[1], LG[3])], size: [LG[2], LG[3]], color: C.navy900, alpha: 0.82 });
const at = (x, y, w, h) => S.at(x, y, w, h, LG);
[
  ['Hub', 'map_dot_hub', [133, 914, 22, 22], '여섯갈래길', 91.5],
  ['Town', 'map_dot_town', [238.5, 915, 20, 20], '마을', 51],
  ['Hunt', 'map_dot_hunt', [303, 917, 16, 16], '사냥터', 59.5],
  ['Boss', 'map_dot_boss', [377, 915, 20, 20], '보스', 51],
  ['Me', 'map_pin_me', [441.5, 915, 15, 20], '내 위치', 61.5],
  ['Goal', 'map_pin_goal', [517, 915, 15, 20], '목표', 45],
].forEach(([name, key, r, label, spanW]) => {
  S.newImage(b, `${LGN}/Icon${name}`, key, { pos: at(r[0], r[1], r[2], r[3]), size: [r[2], r[3]] });
  // 글자는 아이콘 오른쪽 6px 뒤에서 시작(시안 글자 폭은 런타임 값이라 고정 폭 + 왼쪽 정렬)
  const tx = r[0] + r[2] + 6, tw = spanW - r[2] - 6 + 8;
  S.newText(b, `${LGN}/Text${name}`, label, { font: 'Noto700', size: 14, color: C.ivory, h: 'left', pos: at(tx, 915, tw, 20), rect: [tw, 20] });
});

// ═══ 지도 점 33개: 노드(크기 · 터치)는 그대로 두고 자식으로 그림만 얹는다 ═══
// 종류는 WorldMapNodes.csv 의 Type 열(NodeEntity 이름으로 찾는다).
const csv = fs.readFileSync(path.join(WORLD, 'RootDesk/MyDesk/WorldMapNodes.csv'), 'utf8').replace(/^﻿/, '').split(/\r?\n/).filter(Boolean);
const head = csv[0].split(',');
const iEnt = head.indexOf('NodeEntity'), iType = head.indexOf('Type');
const kindOf = {};
csv.slice(1).forEach((ln) => { const c = ln.split(','); if (c[iEnt]) kindOf[c[iEnt]] = c[iType]; });
const DOT = {
  Hub: ['map_dot_hub', 'map_dot_hub_hover', 42, 54],
  Village: ['map_dot_town', 'map_dot_town_hover', 38, 50],
  Hunt: ['map_dot_hunt', 'map_dot_hunt_hover', 26, 38],
  Boss: ['map_dot_boss', 'map_dot_boss_hover', 38, 50],
};
let dots = 0;
b.entities.filter((e) => e.path.startsWith('/ui/WorldMapGroup/' + NODES + '/') && e.path.split('/').length === 4 + NODES.split('/').length).forEach((e) => {
  const name = e.path.split('/').pop();
  const kind = kindOf[name] || 'Hunt';
  const d = DOT[kind] || DOT.Hunt; // Temp 등 모르는 종류는 사냥터 점
  const np = `${NODES}/${name}`;
  S.newImage(b, `${np}/Dot`, d[0], { size: [d[2], d[2]], pos: [0, 0] });
  S.newImage(b, `${np}/DotHover`, d[1], { size: [d[3], d[3]], pos: [0, 0], enable: false });
  dots++;
});

// ═══ 내 위치 · 목표 핀 ═══
// 컨테이너(48x70)는 스크립트가 노드 위 31 에 두고 둥둥 띄운다. 자식 좌표는 컨테이너 기준(스크립트가 같은 값을 다시 준다).
function marker(name, pinKey, tagColor, tagText, tagW) {
  const P = `${BD}/${name}`;
  ['Down', 'Left', 'Right', 'Up'].forEach((d) => S.place(b, `${P}/Outline${d}`, { enable: false })); // 새 핀 그림에 테가 있다
  S.place(b, P + '/Flag', { anchor: 'middle-center', pivot: [0.5, 0.5], pos: [0, -13], size: [36, 48] });
  S.image(b, P + '/Flag', pinKey);
  if (b.find(P + '/Label')) {
    S.place(b, P + '/Label', { anchor: 'middle-center', pivot: [0.5, 0.5], pos: [0, 23], size: [tagW, 20] });
    S.font(b, P + '/Label', { font: 'Maple', size: 13, color: C.white, h: 'center', v: 'middle', outline: false, text: tagText });
    b.patchComponent(P + '/Label', S.TXT, { Underlay: false });
    b.patchComponent(P + '/Label', S.SPR, { ImageRUID: { DataId: ROUND }, Type: 1, Color: S.C(tagColor, 1) });
  }
}
marker('HereMarker', 'map_pin_me', '#0F5E8A', '내 위치', 54);
for (let i = 0; i < 6; i++) marker('GoalMarker_' + i, 'map_pin_goal', '#6E4508', '목표', 38);

// ═══ 지점 안내창 ═══
// 안내창 왼쪽 위 기준 좌표 → 위 가운데 앵커 · 가운데 피벗
const tip = (x, y, w, h) => ({ anchor: 'top-center', pivot: [0.5, 0.5], pos: [x + w / 2 - 310, -(y + h / 2)], size: [w, h] });
const tipImg = (p, key, r) => S.newImage(b, p, key, tip(...r));
S.place(b, TIP, { size: [620, 125.5] });
S.image(b, TIP, 'panel_tooltip');

// 머리줄: 종류 색 점(종류마다 미리 깔아 두고 하나만 켠다) · 이름 · 지역·종류 · 보스 띠/칩
[['Hub', 'map_dot_hub'], ['Town', 'map_dot_town'], ['Hunt', 'map_dot_hunt'], ['Boss', 'map_dot_boss']].forEach(([k, key]) => {
  tipImg(`${TIP}/KindDot_${k}`, key, [19, 22.5, 16, 16]);
  if (k !== 'Hunt') S.place(b, `${TIP}/KindDot_${k}`, { enable: false });
});
S.place(b, TIP + '/Title', tip(44, 14, 300, 33.5));
S.font(b, TIP + '/Title', { font: 'Maple', size: 24, color: C.ivory, h: 'left', v: 'middle', outline: false, overflow: 0 });
b.patchComponent(TIP + '/Title', S.TXT, { BestFit: false });
// 지역·종류는 이름 글자 폭 뒤에 못 붙인다(런타임 글자 폭을 재지 않는다) → 오른쪽 끝에 붙여 오른쪽 정렬
S.newText(b, TIP + '/Caption', '', { font: 'Noto700', size: 14, color: C.faint, h: 'right', overflow: 0, anchor: 'top-center', pos: tip(360, 21, 240, 20).pos, rect: [240, 20] });
// 보스 띠(그라데이션 → 단색 둥근 판) · 보스 칩
round(TIP + '/BossBand', Object.assign(tip(12, 10, 596, 41.5), { color: '#FF46AA', alpha: 0.22, enable: false }));
S.newImage(b, TIP + '/BossChip', 'chip_red', Object.assign(tip(550, 19.75, 48, 22), { enable: false }));
S.newText(b, TIP + '/BossChip/Text', '보스', { font: 'Noto700', size: 13, color: C.white, rect: [48, 22] });

S.place(b, TIP + '/Divider', tip(20, 55.5, 580, 14));
S.image(b, TIP + '/Divider', 'deco_divider');

// 몬스터 줄 5개: 칸 틀(Badge) · 얼굴(Icon) · 이름(Name) · 레벨 칩(LvChip). 영문 이름은 도감이 한 문자열이라 생략.
for (let i = 1; i <= 5; i++) {
  const R = `${TIP}/Row${i}`;
  S.place(b, R, { anchor: 'top-center', pivot: [0.5, 1], pos: [0, -(77.5 + 44 * (i - 1))], size: [580, 36] });
  if (i % 2 === 0) { // 짝수 줄 줄무늬
    round(R + '/Stripe', { pos: [0, 0], size: [580, 36], color: '#24468C', alpha: 0.25 });
    S.back(b, R + '/Stripe');
  }
  ctr(R + '/Badge', -274, 0, 32, 32);
  S.image(b, R + '/Badge', 'slot_frame_sm');
  S.font(b, R + '/Badge', { text: '' });
  // 얼굴: 런타임이 MonsterCatalog 아이콘을 넣는다(비어 있으면 끔)
  b.sprite(R + '/Icon', { anchor: 'middle-center', pos: [-274, 0], rect_size: [22, 22], pivot: [0.5, 0.5], image_ruid: ROUND, sprite_type: 0, color: '#FFFFFF', alpha: 1, raycast: false, enable: false });
  b.patchComponent(R + '/Icon', S.SPR, { PreserveSprite: 1 });
  ctr(R + '/Name', -98, 0, 300, 34);
  S.font(b, R + '/Name', { font: 'Noto700', size: 16, color: C.ivory, h: 'left', v: 'middle', outline: false, overflow: 0 });
  S.newImage(b, R + '/LvChip', 'chip_blue_dark_sm', { pos: [261.5, 0], size: [57, 19.5] });
  S.newText(b, R + '/LvChip/Text', 'Lv 1', { font: 'FootballB', size: 13, color: C.white, rect: [57, 19.5] });
}
// 그리기 순서: 보스 띠는 머리줄 글자보다 뒤
S.back(b, TIP + '/BossBand');

// ═══ 월드맵 열기 버튼 ═══
const OB = 'Toolbar/OpenBtn';
S.place(b, OB, { size: [230, 72] });
S.button(b, OB, { normal: 'btn_gold_default', pressed: 'btn_gold_pressed' });
S.font(b, OB, { text: '' }); // 글자는 자식 OpenLabel 로(지도 아이콘 때문에 오른쪽으로 치우친다)
// 시안 s0: [지도 아이콘] 월드맵 [M 키 칩]. 게임 글꼴이 시안보다 넓어(글자 폭 약 80) 칩과 안 겹치게 아이콘 -58 · 글자 +5 · 칩 +62 로 모은다(시안은 -55 · +3 · +60).
S.newImage(b, OB + '/Icon', 'ico_map', { pos: [-58, 0], size: [34, 34] });
S.newText(b, OB + '/OpenLabel', '월드맵', { font: 'Maple', size: 24, color: C.goldInk, pos: [5, 0], rect: [84, 34] });
// M 키 칩: 시안은 #1C1405 알파 0.75 24x24 둥근 칩 + 글자 "M" Maple 13 #F7E4B5(에셋 없음 → 흰 둥근사각 틴트 · 모서리 반경 5 는 생략)
round(OB + '/KeyChip', { pos: [62, 0], size: [24, 24], color: C.goldInk, alpha: 0.75 });
S.newText(b, OB + '/KeyChip/Text', 'M', { font: 'Maple', size: 13, color: C.title, pos: [0, 0], rect: [24, 24] });

// ═══ 그리기 순서(Board 자식): 테두리 < 범례 < 문장 < 제목 띠 < 지도 아이콘 < 제목 글자 < 지도 밖 칩 < 선택 링 < 노드 … ═══
S.before(b, BD + '/Frame', BD + '/Title');
S.before(b, BD + '/Legend', BD + '/Title');
S.before(b, BD + '/Crest', BD + '/Title');
S.before(b, BD + '/TitleBand', BD + '/Title');
S.before(b, BD + '/TitleIcon', BD + '/Title');
S.before(b, BD + '/HereChip', BD + '/SelectedMarker');

b.write(path.join(WORLD, 'ui', 'WorldMapGroup.ui'), { lint_verbose: !!process.env.LINT_V });
console.log(`WorldMapGroup(월드맵) 적용 끝 — 점 ${dots}개 · 새 엔티티 ${b.listEntities().length - before}개`);
