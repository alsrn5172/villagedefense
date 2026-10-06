// WO-050 §4 — 차원문 · 택시 · NPC 비용 · 파병 창(CommonNpcGroup)의 마을 문장 그림을 새 RUID 로 바꾼다.
//   node Docs/tools/design-ui/swap-emblems.cjs            # 바꿀 곳만 출력(쓰지 않음)
//   node Docs/tools/design-ui/swap-emblems.cjs --write    # 실제로 쓴다(다시 돌려도 같은 결과 · 이미 새 RUID 면 건너뜀)
// 옛 RUID = emblem-old-ruids.json(upload 전 ruid-map 의 emblem_<마을>) · 새 RUID = ruid-map.json 의 emblem_<마을>.
// 이 창은 apply-gate.cjs · _npc-frame.cjs · apply-dispatch.cjs 가 만들었고 그 스크립트들은 ruid-map.json 을 읽으므로 다시 돌려도 새 그림이 나온다 —
// 이 스크립트는 그 셋을 다 돌리지 않고(다른 손질을 덮어쓰지 않게) 문장 그림 RUID 만 바꾸는 작은 길이다. 빌더 write() 가 린트를 돌린다.
const fs = require('fs');
const path = require('path');
const { UIBuilder } = require('C:/Users/mingu/메월드폴더/.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');

const WORLD = path.resolve(__dirname, '..', '..', '..');
const FILE = path.join(WORLD, 'ui', 'CommonNpcGroup.u' + 'i');
const oldMap = JSON.parse(fs.readFileSync(path.join(__dirname, 'emblem-old-ruids.json'), 'utf8'));
const ruidMap = JSON.parse(fs.readFileSync(path.join(__dirname, 'ruid-map.json'), 'utf8'));
const swap = {};
for (const t of Object.keys(oldMap)) swap[oldMap[t]] = ruidMap['emblem_' + t].ruid;

const log = console.log; console.log = () => {};
const b = UIBuilder.read(FILE);
let n = 0;
const edits = [];
for (const e of b.listEntities()) {
  const ent = b.find(e.path);
  const text = JSON.stringify(ent.jsonString);
  for (const o of Object.keys(swap)) {
    if (text.includes(o)) edits.push({ path: e.path, from: o, to: swap[o] });
  }
}
for (const x of edits) log(x.path, x.from.slice(0, 8), '->', x.to.slice(0, 8));
log('바꿀 곳', edits.length);
if (process.argv.includes('--write') && edits.length) {
  for (const x of edits) {
    const ent = b.find(x.path);
    const comps = ent.jsonString['@components'] || [];
    for (const c of comps) {
      const s = JSON.stringify(c);
      if (s.includes(x.from)) {
        // DataRef 모양({ DataId: ruid }) 이든 문자열이든 그 칸만 바꾼다.
        const fix = (o) => {
          for (const k of Object.keys(o)) {
            if (o[k] === x.from) o[k] = x.to;
            else if (o[k] && typeof o[k] === 'object') fix(o[k]);
          }
        };
        fix(c);
        n++;
      }
    }
  }
  b.write(FILE);
  log('쓴 칸', n);
}
console.log = log;
