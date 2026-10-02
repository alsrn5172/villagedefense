// 칩 크기 규칙 점검 (5차 · 2026-10-02): 모든 .ui 의 칩(chip_* 그림)에서 글자가 칩 테두리 안쪽 여백에 들어가는지, 같은 글자 칩이 창마다 크기가 다른지 본다.
// 실행(월드 루트에서): node Docs/tools/design-ui/chip-audit.cjs [ui 이름] [--json 출력경로]
// - 글자 폭은 chip-text-width.json(게임 글꼴 실측)을 쓴다. 표에 없는 글자는 "측정 없음" 으로 센다.
// - 칩 하나의 필요 폭 = chipWidth(칩 그림 키, 높이, 글자 폭, 아이콘 폭). 지금 폭이 그보다 작으면 "좁음".
// - 같은 글자(공백 정리 후)가 2가지 이상의 크기(w×h · 글꼴 · 글자 크기)로 나오면 "통일 안 됨".
const fs = require('fs');
const path = require('path');
const S = require('./skin.cjs');
const WORLD = path.resolve(__dirname, '..', '..', '..');
const MAP = JSON.parse(fs.readFileSync(path.join(__dirname, 'ruid-map.json'), 'utf8'));
const RK = {}; Object.keys(MAP).forEach((k) => { RK[MAP[k].ruid] = k; });
const UIT = 'MOD.Core.UITransformComponent';
const only = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : null;
const jsonOut = process.argv.includes('--json') ? process.argv[process.argv.indexOf('--json') + 1] : null;
const files = fs.readdirSync(path.join(WORLD, 'ui')).filter((f) => f.endsWith('.ui')).map((f) => f.replace(/\.ui$/, ''));
const FONTKEY = { Default: 'Noto700', Maple: 'Maple', Football: 'FootballB', Bazzi: 'Bazzi' };
const rows = []; const miss = [];
for (const name of files) {
  if (only && name !== only) continue;
  let b; try { b = S.open(WORLD, name); } catch (e) { continue; }
  const ents = b.entities.map((e) => e.path);
  const rect = (abs) => { const t = b.getComponent(abs, UIT); return t && t.RectSize ? [t.RectSize.x, t.RectSize.y] : null; };
  for (const abs of ents) {
    const c = b.getComponent(abs, S.SPR); if (!c || !c.ImageRUID) continue;
    const key = RK[c.ImageRUID.DataId || c.ImageRUID];
    if (!key || !/^chip_/.test(key)) continue;
    const parent = abs.slice(0, abs.lastIndexOf('/'));
    const texts = [];
    const own = b.getComponent(abs, S.TXT); if (own) texts.push([abs, own, 0]);
    let icon = 0;
    for (const e2 of ents) {
      if (!e2.startsWith(abs + '/') || e2.slice(abs.length + 1).includes('/')) continue;
      const t = b.getComponent(e2, S.TXT);
      if (t) texts.push([e2, t, 0]);
      else if (b.getComponent(e2, S.SPR)) { const r = rect(e2); const cs = rect(abs); if (r && cs && r[0] < cs[0] * 0.5) icon = Math.max(icon, r[0] + 4); } // 칩 폭의 절반 이상인 자식 그림은 덮개(On · 선택)라 아이콘이 아니다
    }
    // 칩의 형제인 글자(한 칩 그림 + 따로 있는 글자): 같은 부모 아래 같은 이름의 접두 글자는 여기서 안 센다(직접 칩 자식 글자가 없을 때만 "형제" 표시)
    if (!texts.length) continue;
    const sz = rect(abs); if (!sz) continue;
    for (const [tp, t] of texts) {
      const text = (t.Text || '').trim(); if (!text) continue;
      const fk = FONTKEY[t.Font] || t.Font;
      let tw = null; try { tw = S.textW(fk, t.FontSize, text); } catch (e) { miss.push(`${name}|${abs.replace('/ui/' + name + '/', '')}|${t.Font}${t.FontSize}|${text}`); }
      const need = tw == null ? null : S.chipWidth(key, sz[1], tw, icon);
      rows.push({ ui: name, chip: abs.replace('/ui/' + name + '/', ''), key, w: sz[0], h: sz[1], text, font: `${t.Font}${t.FontSize}`, tw, icon, need, slack: tw == null ? null : (sz[0] - icon - tw) / 2 - S.chipBorder(key) });
    }
  }
}
const bad = rows.filter((r) => r.need != null && r.w + 0.01 < r.need);
console.log(`칩+글자 ${rows.length}건 · 좁음 ${bad.length}건 · 측정 없음 ${miss.length}건`);
for (const r of bad) console.log(`  좁음  ${r.ui}  ${r.chip}  ${r.key}  ${r.w}x${r.h}  "${r.text}" ${r.font}  글자 ${r.tw}  필요 ${r.need}  (여백 ${r.slack.toFixed(1)} < 테두리+${S.chipPad(r.h)})`);
// 같은 글자 · 같은 칩 그림 계열이 크기가 다른 곳
const by = {};
for (const r of rows) { if (/^[0-9]+$/.test(r.text)) continue; const k = r.text; (by[k] = by[k] || new Set()).add(`${r.w}x${r.h} ${r.font}`); }
const uni = Object.keys(by).filter((k) => by[k].size > 1);
console.log(`같은 글자인데 크기가 둘 이상: ${uni.length}건`);
for (const k of uni) console.log(`  "${k}" → ${[...by[k]].join(' | ')}`);
if (miss.length) { const u = [...new Set(miss.map((m) => m.split('|').slice(2).join('|')))]; console.log('측정 없음 글자: ' + u.join(' ; ')); }
if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify({ rows, bad, uni: uni.map((k) => ({ text: k, sizes: [...by[k]] })), miss }, null, 1));
