// WO-047 — 가공한 레인 바닥 그림(리소스파일/레인-발판/_upload/*.png + manifest.json)을 그룹 리소스(mIYbC)에 올리고
// 이름 → RUID 표(Docs/tools/lane-floor/ruid-map.json)를 만든다. 방식은 Docs/tools/facility-art/upload.cjs 와 같다(presigned PUT).
// 🔴 피벗은 올릴 때 정한다 — 이미 올린 RUID 의 피벗을 나중에 바꾸면 Maker 가 옛 값을 쓴다(WO-040 실측). 그룹 리소스는 지우지 않는다.
// 토큰은 허브 .mcp.json 에서 읽어 헤더로만 쓰고 출력 · 기록하지 않는다.
// 실행: node Docs/tools/lane-floor/upload.cjs          # 표에 없는 것만 올림
//       node Docs/tools/lane-floor/upload.cjs --list   # 표 출력
const fs = require('fs');
const path = require('path');

const SRC = 'C:/Users/mingu/메월드폴더/리소스파일/레인-발판/_upload';
const MAP = path.join(__dirname, 'ruid-map.json');
const GROUP = 'mIYbC';
const cfg = JSON.parse(fs.readFileSync('C:/Users/mingu/메월드폴더/.mcp.json', 'utf8')).mcpServers['msw-mcp'];
const mf = JSON.parse(fs.readFileSync(path.join(SRC, 'manifest.json'), 'utf8'));
const table = fs.existsSync(MAP) ? JSON.parse(fs.readFileSync(MAP, 'utf8')) : {};
const save = () => fs.writeFileSync(MAP, JSON.stringify(table, null, 1) + '\n');

let sid = null; let rpcId = 0;
async function rpc(method, params, notify) {
  const headers = Object.assign({ 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' }, cfg.headers || {});
  if (sid) headers['Mcp-Session-Id'] = sid;
  const body = notify ? { jsonrpc: '2.0', method, params } : { jsonrpc: '2.0', id: ++rpcId, method, params };
  const res = await fetch(cfg.url, { method: 'POST', headers, body: JSON.stringify(body) });
  const s = res.headers.get('mcp-session-id'); if (s) sid = s;
  if (notify) return null;
  const text = await res.text();
  if (!res.ok) throw new Error(`MCP ${method} HTTP ${res.status}: ${text.slice(0, 200)}`);
  let msg;
  if ((res.headers.get('content-type') || '').includes('text/event-stream')) {
    const data = text.split('\n').filter((l) => l.startsWith('data:')).map((l) => l.slice(5).trim());
    msg = JSON.parse(data[data.length - 1]);
  } else msg = JSON.parse(text);
  if (msg.error) throw new Error(`MCP ${method}: ${JSON.stringify(msg.error).slice(0, 300)}`);
  return msg.result;
}
async function tool(name, args) {
  const r = await rpc('tools/call', { name, arguments: args });
  const t = (r.content || []).map((c) => c.text || '').join('');
  if (r.isError) throw new Error(`${name}: ${t.slice(0, 300)}`);
  try { return JSON.parse(t); } catch (_) { return { raw: t }; }
}
function findRuid(o) {
  if (!o || typeof o !== 'object') return null;
  for (const k of Object.keys(o)) { if (/^(ruid|guid)$/i.test(k) && typeof o[k] === 'string' && /^[0-9a-f]{32}$/i.test(o[k])) return o[k]; }
  for (const k of Object.keys(o)) { const r = findRuid(o[k]); if (r) return r; }
  return null;
}
async function retry(label, fn) {
  let last;
  for (let t = 1; t <= 3; t++) {
    try { return await fn(); } catch (e) { last = e; await new Promise((r) => setTimeout(r, 800 * t)); }
  }
  throw new Error(label + ': ' + String(last && last.message).slice(0, 200));
}

const items = [];
for (const [v, ent] of Object.entries(mf.villages)) {
  for (const [part, p] of Object.entries(ent.parts)) items.push({ key: `${v}_${part}`, v, part, p });
}

(async () => {
  if (process.argv[2] === '--list') {
    for (const it of items) { const e = table[it.key]; console.log(it.key.padEnd(22), e ? e.ruid.slice(0, 8) : '(없음)', e ? JSON.stringify(e.props) : ''); }
    return;
  }
  const todo = items.filter((it) => !table[it.key]);
  console.log('올릴 것', todo.length, '· 이미 있음', items.length - todo.length);
  if (!todo.length) return;
  await rpc('initialize', { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'vd-lane-floor-upload', version: '1.0' } });
  await rpc('notifications/initialized', {}, true);
  for (const it of todo) {
    try {
      const buf = fs.readFileSync(path.join(SRC, it.p.file));
      const base = { groupCode: GROUP, category: 'sprite', subcategory: 'object', name: 'lfl_' + it.key,
        description: `WO-047 레인 바닥 ${it.v} ${it.part} · ${it.p.px[0]}x${it.p.px[1]} · 피벗 (${it.p.pivot_x}, ${it.p.pivot_y}) = 걷는 선`, contentLength: buf.length };
      const s1 = await retry('create1', () => tool('asset_create_group_resource_storage_item', base));
      if (!s1.presignedUrl) throw new Error('presignedUrl 없음');
      await retry('put', async () => { const put = await fetch(s1.presignedUrl, { method: 'PUT', body: buf }); if (!put.ok) throw new Error(`PUT ${put.status}`); });
      const s2 = await retry('create2', () => tool('asset_create_group_resource_storage_item', Object.assign({}, base, { fileUrl: s1.presignedUrl })));
      const ruid = findRuid(s2);
      if (!ruid) throw new Error('RUID 없음');
      const props = [
        { key: 'pivot_x', value: String(it.p.pivot_x) }, { key: 'pivot_y', value: String(it.p.pivot_y) },
        { key: 'filter_mode', value: 'Bilinear' }, { key: 'wrap_mode', value: 'Clamp' },
      ];
      let propsOk = true;
      try { await retry('props', () => tool('asset_update_resource_storage_info', { guid: ruid, properties: props })); } catch (e) { propsOk = false; console.log('  속성 실패', it.key, String(e.message).slice(0, 150)); }
      table[it.key] = { ruid, name: base.name, bytes: buf.length, px: it.p.px, units: it.p.units, props: Object.fromEntries(props.map((q) => [q.key, q.value])), propsOk };
      save();
      console.log('올림', it.key.padEnd(22), ruid.slice(0, 8), propsOk ? '' : '(속성 다시 필요)');
    } catch (e) { console.log('실패', it.key, String(e.message).slice(0, 200)); process.exitCode = 1; }
  }
})().catch((e) => { console.error('FAIL', String(e.message).slice(0, 300)); process.exit(1); });
