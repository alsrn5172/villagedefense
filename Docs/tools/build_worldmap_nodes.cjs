/*
  WorldMapGroup.ui 에 빅토리아 노드를 만든다 (Phase 0 배경 교체 + Phase 2 노드 생성).

  🔴 기존 엔티티는 "추가/패치"만 한다. Region1~3 을 포함해 사용자가 Maker 에서 잡은 좌표는 손대지 않는다.
     (Board 만 예외 — 배경 이미지가 640x472 라 비율을 맞추려면 RectSize 를 바꿔야 한다. 계획 승인됨)

  노드 생김새는 기존 Region1 을 그대로 본떴다:
    UISprite(48x48, 원형 마커 RUID) + UITouchReceiveComponent
      └ Label  UITextGUIRenderer(200x50, Maple 25pt, 검은 플레이트 배경)
*/
const fs = require('fs');
const path = require('path');
const { UIBuilder } = require('C:/Users/mingu/메월드폴더/밍키타연습월드1/.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');

const WORLD = 'C:/Users/mingu/메월드폴더/밍키타연습월드1';
const UI = WORLD + '/ui/WorldMapGroup.ui';
const CSV = WORLD + '/RootDesk/MyDesk/WorldMapNodes.csv';
const MLUA = WORLD + '/RootDesk/MyDesk/WorldMap/WorldMapController.mlua';

const BOARD = '/ui/WorldMapGroup/MapPanel/Board';
const NODES = BOARD + '/Nodes';

// 배경 — 사용자가 편집한 빅토리아 지도(원본 worldmap010 에서 커닝타워·엘리넬·마법사협회·에우렐·
//        골드비치·엘로딘·파르템·버섯의 성을 지우고 길을 다시 그림). 637x475.
//        초안에 그려져 있던 마커는 지우고 올렸다 — UI 노드가 그 위에 올라가므로 두 겹이 되면 안 된다.
const VICTORIA_RUID = 'b93bf4b11ba14b6e8b8cc9977e40e084';
const BOARD_SIZE = [1274, 950]; // 637x475 의 정확히 2배.

// Region1 에서 실측한 값 — 새 노드도 같은 그림·같은 폰트를 쓴다.
// 🔴 마커는 **흰색**이어야 한다. Color 는 곱셈이라 원본이 빨간 핀이면 파랑·노랑을 못 낸다
//    (실측: ca124a50 = maplestory/effect/basiceff/nored2 는 빨간 원이라 어떤 색을 곱해도 빨강).
//    그래서 흰 채움 + 어두운 테두리 마커를 직접 그려 계정 리소스로 올렸다 (Docs/tools/node_marker.png).
const NODE_RUID = 'a4498657d6fa4179894b9ddf76b905d9';  // WorldMapNodeDot (흰색, 틴트용)
const PLATE_RUID = '7f7a6b14e4e6e704a8e7d8ad0278fe66'; // 라벨 뒤 검은 플레이트

// Type 별 노드 색·크기·글자 크기. 지도 위에서 마을/보스/사냥터가 한눈에 구분되게.
// 레퍼런스(메이플 원본 월드맵 오버레이) 규칙 — 사용자 확정:
//   노랑 작은 점 = 사냥터 / 파랑 원 = 마을 / 분홍 원 = 보스 / 금색 = 여섯갈래길
//   글자 라벨은 쓰지 않는다(지도에 지역명이 이미 인쇄돼 있다). 이름은 hover 툴팁이 보여준다.
// 색은 사용자가 초안에 직접 찍은 픽셀값 그대로다(추측 아님).
//   파랑 = 맵/마을 · 노랑 = 사냥터 · 보라 = 보스맵
// ⚠ 이전 판에서는 여섯갈래길을 금색, 보스를 분홍으로 뒀는데 둘 다 틀렸다.
//   여섯갈래길은 그냥 일반 맵(파랑)이고, 초안의 분홍은 전부 보스맵이다(사용자 확인).
const STYLE = {
	Hub:     { color: '#17B4FA', size: 34, font: 22 },
	Village: { color: '#17B4FA', size: 30, font: 20 },
	Boss:    { color: '#E92BE3', size: 30, font: 20 },
	Hunt:    { color: '#FAD54A', size: 18, font: 17 },
	Temp:    { color: '#BBBBBB', size: 30, font: 20 },
};
const LABEL_PAD = 22, LABEL_H = 30, LABEL_GAP = 14, LABEL_RECT_H = 50;
// 마커가 지도의 마을 그림을 완전히 덮지 않게 살짝 비친다.
const NODE_ALPHA = 1.0;

// 한글은 글자당 대략 폰트 크기만큼, 공백은 그 40% (생성기와 동일한 근사).
function textWidth(text, font) {
	let n = 0;
	for (const ch of text) n += (ch === ' ' ? 0.4 : 1.0);
	return n * font;
}

// ── CSV 읽기 ─────────────────────────────────────────────────────────────
const lines = fs.readFileSync(CSV, 'utf8').split(/\r?\n/).filter(l => l.trim() !== '');
const head = lines[0].split(',');
const col = (n) => head.indexOf(n);
const rows = lines.slice(1).map(l => {
	const c = l.split(',');
	return {
		mapName: c[col('MapName')],
		label: c[col('Label')],
		region: c[col('Region')],
		type: c[col('Type')],
		node: c[col('NodeEntity')],
		x: parseFloat(c[col('X')]),
		y: parseFloat(c[col('Y')]),
		showLabel: (c[col('ShowLabel')] || 'true').toLowerCase() !== 'false',
		// 라벨 오프셋은 표가 갖는다. 비어 있으면 아래(-)로 계산해 넣는다.
		labelDX: parseFloat(c[col('LabelDX')]),
		labelDY: parseFloat(c[col('LabelDY')]),
		enabled: (c[col('Enabled')] || 'true').toLowerCase() !== 'false',
	};
});

const b = UIBuilder.read(UI);
const before = b.entities.length;

// 작업 전 Region1~3 좌표를 찍어 둔다(검증 V2 — 보존 증명용).
const snap = {};
for (const n of ['Region1', 'Region2', 'Region3']) {
	if (!b.find(`${BOARD}/${n}`)) continue;
	const t = b.getComponent(`${BOARD}/${n}`, 'MOD.Core.UITransformComponent');
	snap[n] = `${t.anchoredPosition.x},${t.anchoredPosition.y}`;
}

// ── Phase 0 · 배경 교체 + 비율 보정 ───────────────────────────────────────
const boardT = b.getComponent(BOARD, 'MOD.Core.UITransformComponent');
const keepPos = [boardT.anchoredPosition.x, boardT.anchoredPosition.y]; // 사용자가 잡은 위치 유지
b.patchComponent(BOARD, 'MOD.Core.SpriteGUIRendererComponent', { ImageRUID: { DataId: VICTORIA_RUID } });
b.patch(BOARD, { rect_size: BOARD_SIZE, pos: keepPos });

// ── Phase 2 · 노드 컨테이너 + 노드들 ──────────────────────────────────────
// Board 에 딱 맞게 늘어나는 빈 컨테이너. 자식 좌표가 곧 Board 기준 좌표가 된다.
b.empty(NODES, { anchor: 'stretch', pos: [0, 0] });

let made = 0;
for (const r of rows) {
	if (!r.enabled) continue;
	if (!r.node.startsWith('Node_')) continue; // Region1~3 은 기존 것을 그대로 쓴다

	const st = STYLE[r.type] || STYLE.Hunt;
	const p = `${NODES}/${r.node}`;

	// 마커 본체 — Region1 과 동일 구성(UISprite + UITouchReceive).
	b.sprite(p, {
		rect_size: [st.size, st.size],
		pos: [r.x, r.y],
		image_ruid: NODE_RUID,
		color: st.color,
		alpha: NODE_ALPHA,
		raycast: true,
	});
	b.addComponent(p, 'MOD.Core.UITouchReceiveComponent');

	// 라벨 — 노드 바로 아래.
	// ⚠ 배경 월드맵에는 마을 이름이 이미 인쇄돼 있다. 대표 마을·여섯갈래길은 ShowLabel=false 로
	//   꺼서 글자가 겹치지 않게 한다(엔티티는 만들어 두고 Enable 만 끈다 — 되돌리기 쉽게).
	// ⚠ 라벨판(뒤 검은 배경)은 RectSize 에 LocalScale 을 곱한 크기로 그려진다.
	//    예전엔 rect 200 고정 + LocalScale.x 0.4 라 판이 항상 80px 이었고, 긴 이름
	//    ("와일드보어의 땅" ≈ 150px)이 판 밖으로 삐져나가 잘려 보였다(실측).
	//    → rect 를 글자 길이에 맞추고 LocalScale.x = 1 로 둔다.
	const labelW = Math.round(textWidth(r.label, st.font) + LABEL_PAD);
	// 🔴 사용자가 Maker 에서 라벨을 옮겼으면 sync 가 그 값을 표에 적어 둔다. 그대로 복원한다.
	const labelDX = Number.isFinite(r.labelDX) ? r.labelDX : 0;
	const labelDY = Number.isFinite(r.labelDY) ? r.labelDY : -(st.size / 2 + LABEL_GAP + LABEL_H / 2);
	const lp = `${p}/Label`;
	b.text(lp, r.label, {
		enable: r.showLabel,
		rect_size: [labelW, LABEL_RECT_H],
		pos: [labelDX, labelDY],
		size: st.font,
		// ⚠ alignment 는 MSW enum 이 아니라 0~8 조합 인덱스다(h = [Left,Center,Right][a%3],
		//   v = [Top,Middle,Bottom][a/3]). 4 = 가운데·중앙. 2 를 넣으면 오른쪽 정렬이 된다(실측).
		alignment: 4,
		color: '#FFFFFF',
	});
	b.patchComponent(lp, 'MOD.Core.TextGUIRendererComponent', {
		Font: 'Maple', FontStyle: 1, HorizontalAlignment: 2, VerticalAlignment: 512, MaxSize: 42,
		Underlay: true, UnderlayColor: { r: 0, g: 0, b: 0, a: 0.9 },
	});
	b.patchComponent(lp, 'MOD.Core.SpriteGUIRendererComponent', {
		ImageRUID: { DataId: PLATE_RUID },
		LocalScale: { x: 1.0, y: LABEL_H / LABEL_RECT_H },
		Color: { r: 0, g: 0, b: 0, a: 0.82 },
	});
	made++;
}

// ── 임시 3노드 비키기 ────────────────────────────────────────────────────
// 월드맵이 메이플 아일랜드 → 여섯갈래길+빅토리아로 바뀌었다. map01~03 은 옛 지도 시절의 자리라
// 새 지도 위에 남으면 여섯갈래길 노드와 겹친다. 지우지 않고 끄기만 한다(되돌리기 쉽게).
// ⚠ 사용자가 Maker 에서 지웠을 수 있다. 없는 경로에 patch 하면 throw 하므로 존재 확인 후에만.
for (const n of ['Region1', 'Region2', 'Region3']) {
	if (b.find(`${BOARD}/${n}`)) b.patch(`${BOARD}/${n}`, { enable: false });
	else console.log(`  (없음, 건너뜀) ${n}`);
}

// ── 그리는 순서 ──────────────────────────────────────────────────────────
// Nodes 를 그냥 추가하면 displayOrder 가 제일 뒤(=제일 위)로 붙어 Tooltip·HereMarker 를 덮는다.
// SelectedMarker 바로 위 / InfoPanel·Tooltip·HereMarker 아래가 되도록 다시 번호를 매긴다.
// (displayOrder 는 사용자가 드래그로 잡은 값이 아니라 정렬키라 재배치해도 레이아웃은 안 변한다)
// ⚠ 사용자가 InfoPanel 처럼 일부를 지울 수 있다. 실제로 있는 것만 번호를 다시 매긴다.
const ORDER = ['Title', 'SelectedMarker', 'Nodes', 'Region1', 'Region2', 'Region3',
	'InfoPanel', 'CloseBtn', 'Tooltip', 'HereMarker'];
let ord = 0;
for (const name of ORDER) {
	if (!b.find(`${BOARD}/${name}`)) continue;
	b.patch(`${BOARD}/${name}`, { display_order: ord++ });
}

// ── 쓰기 + 컨트롤러 property UUID 주입 ────────────────────────────────────
b.write(UI, { bind: { mlua: MLUA, props: { board: BOARD, nodesRoot: NODES } } });

// ── 자체 검증 ────────────────────────────────────────────────────────────
const after = UIBuilder.read(UI);
let kept = true;
for (const n of Object.keys(snap)) {
	const t = after.getComponent(`${BOARD}/${n}`, 'MOD.Core.UITransformComponent');
	const now = `${t.anchoredPosition.x},${t.anchoredPosition.y}`;
	if (now !== snap[n]) { kept = false; console.log(`  !! ${n} moved: ${snap[n]} -> ${now}`); }
}
console.log('---');
console.log('nodes created :', made);
console.log('entities      :', before, '->', after.entities.length, `(+${after.entities.length - before})`);
console.log('Region1~3 좌표 보존 :', kept ? 'OK (enable 만 false)' : 'CHANGED');
console.log('validate errors:', after.validate().filter(f => f.severity === 'error').length);
