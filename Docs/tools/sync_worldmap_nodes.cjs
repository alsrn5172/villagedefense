/*
  역기록 — Maker 에서 드래그해 맞춘 노드 위치를 WorldMapNodes.csv 로 되받아 적는다.

    CSV ──(build)──▶ .ui ──(Maker 에서 사람이 드래그 + 저장)──▶ .ui ──(이 스크립트)──▶ CSV

  런타임 진상은 .ui 다. 컨트롤러는 CSV 의 X/Y 를 읽지 않고 엔티티의 실제 좌표를 쓴다.
  CSV 의 X/Y 는 "노드를 처음부터 다시 만들 때 쓰는 백업"이라, 드래그 결과를 여기로 되돌려 놔야
  나중에 build 를 다시 돌려도 배치가 날아가지 않는다.

  X / Y 열만 갱신한다. Label / Region / Type / ShowLabel / Enabled / #Note 는 손대지 않는다.

  사용법:
    1) Maker 에서 노드를 드래그한 뒤 **반드시 저장**한다 (이 스크립트는 디스크의 .ui 를 읽는다)
    2) node "밍키타연습월드1/Docs/tools/sync_worldmap_nodes.cjs"
    3) --dry 를 붙이면 파일을 안 고치고 바뀔 내용만 보여준다
*/
const fs = require('fs');
const { UIBuilder } = require('C:/Users/mingu/메월드폴더/밍키타연습월드1/.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');

const WORLD = 'C:/Users/mingu/메월드폴더/밍키타연습월드1';
const UI = WORLD + '/ui/WorldMapGroup.ui';
const CSV = WORLD + '/RootDesk/MyDesk/WorldMapNodes.csv';
const BOARD = '/ui/WorldMapGroup/MapPanel/Board';
const NODES = BOARD + '/Nodes';

const DRY = process.argv.includes('--dry');

const b = UIBuilder.read(UI);
const lines = fs.readFileSync(CSV, 'utf8').split(/\r?\n/);
let head = lines[0].split(',');

// 구버전 헤더 자동 이관: LabelPos(above/below) → LabelDX,LabelDY(실제 픽셀).
// 라벨을 "위/아래" 두 자리로만 기억하면 사람이 손으로 맞춘 미세 위치가 재빌드 때 날아간다.
if (head.indexOf('LabelDY') < 0) {
	const at = head.indexOf('LabelPos');
	const insertAt = at >= 0 ? at : Math.max(head.indexOf('ShowLabel') + 1, 1);
	const wide = (arr, val) => {
		const a = arr.slice();
		if (at >= 0) a.splice(at, 1, val, val); else a.splice(insertAt, 0, val, val);
		return a;
	};
	head = wide(head, '').map((v, i) => v);
	head[insertAt] = 'LabelDX';
	head[insertAt + 1] = 'LabelDY';
	lines[0] = head.join(',');
	for (let i = 1; i < lines.length; i++) {
		if (lines[i].trim() === '') continue;
		lines[i] = wide(lines[i].split(','), '').join(',');
	}
	console.log(`  헤더 이관: LabelPos -> LabelDX,LabelDY (열 ${insertAt})`);
}

const iNode = head.indexOf('NodeEntity');
const iX = head.indexOf('X');
const iY = head.indexOf('Y');
const iLX = head.indexOf('LabelDX');
const iLY = head.indexOf('LabelDY');
const iMap = head.indexOf('MapName');
if (iNode < 0 || iX < 0 || iY < 0) throw new Error('CSV 헤더에 NodeEntity / X / Y 가 없다');

let changed = 0, missing = 0, dropped = 0;
const seen = new Set();

for (let i = 1; i < lines.length; i++) {
	if (lines[i].trim() === '') continue;
	const c = lines[i].split(',');
	const name = c[iNode];
	seen.add(name);

	// Node_* 는 Board/Nodes 밑, Region1~3 은 Board 직속.
	const p = name.startsWith('Node_') ? `${NODES}/${name}` : `${BOARD}/${name}`;
	if (!b.find(p)) { missing++; console.log(`  - .ui 에 없음: ${name} (${c[iMap]})`); continue; }

	let touched = false;
	const set = (idx, val) => {
		if (idx >= 0 && c[idx] !== val) { c[idx] = val; touched = true; }
	};

	const t = b.getComponent(p, 'MOD.Core.UITransformComponent');
	const nx = Number(t.anchoredPosition.x).toFixed(1);
	const ny = Number(t.anchoredPosition.y).toFixed(1);
	const before = `(${c[iX]},${c[iY]})`;
	set(iX, nx); set(iY, ny);

	// 라벨을 옮겼으면 그 오프셋도 표에 박아 둔다. 없으면(지웠으면) 손대지 않는다.
	const lab = b.find(`${p}/Label`);
	if (lab) {
		const lt = b.getComponent(`${p}/Label`, 'MOD.Core.UITransformComponent');
		set(iLX, Number(lt.anchoredPosition.x).toFixed(1));
		set(iLY, Number(lt.anchoredPosition.y).toFixed(1));
	}

	if (touched) {
		console.log(`  ~ ${c[iMap]}: ${before} -> (${nx},${ny})  label(${c[iLX]},${c[iLY]})`);
		lines[i] = c.join(',');
		changed++;
	}
}

// 표에 없는데 .ui 에만 있는 노드 — 표가 진상이므로 알려만 준다.
for (const e of b.entities) {
	const path = String((e.jsonString || {}).path || '');
	const m = path.match(/^\/ui\/WorldMapGroup\/MapPanel\/Board\/Nodes\/([^/]+)$/);
	if (m && !seen.has(m[1])) { dropped++; console.log(`  + 표에 없는 노드: ${m[1]}`); }
}

console.log('---');
console.log(`changed = ${changed}, missing = ${missing}, 표에 없는 노드 = ${dropped}`
	+ (DRY ? '  (dry run — 파일 안 고침)' : ''));
if (!DRY && (changed > 0 || lines[0] !== fs.readFileSync(CSV, 'utf8').split(/\r?\n/)[0])) {
	fs.writeFileSync(CSV, lines.join('\n'), 'utf8');
	console.log('wrote', CSV);
}
