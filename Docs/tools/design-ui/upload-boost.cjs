// 이용권 상점(WO-053) 새 그림을 그룹 리소스(mIYbC)에 올리고 boost-ruids.json 에 적는다.
// 쿠폰 3장만 새로 올린다 — 나머지 26장은 WO-039 때 올라간 ruid-map.json 의 RUID 를 그대로 쓴다.
// 🔴 ruid-map.json 은 #202(a/tutorial-3) 가 잡고 있어 건드리지 않는다 → 새 그림 RUID 는 boost-ruids.json 에.
// 실행: node Docs/tools/design-ui/upload-boost.cjs        (이미 RUID 가 있는 키는 건너뛴다)
// MCP(msw-mcp)는 허브 .mcp.json 설정 그대로 부른다. 토큰은 헤더로만 쓰고 출력하지 않는다.
const fs = require('fs');
const path = require('path');

const SRC = 'C:/Users/mingu/메월드폴더/리소스파일/빅토리아마을전_UI_넘김_이용권상점_NPC대화창/01_이용권상점/2x';
const OUT = path.join(__dirname, 'boost-ruids.json');
const GROUP = 'mIYbC';
const ITEMS = [
  { key: 'coupon_pass_1d', label: '이용권 쿠폰 1일 (파랑 · 레어)' },
  { key: 'coupon_pass_3d', label: '이용권 쿠폰 3일 (보라 · 에픽)' },
  { key: 'coupon_pass_7d', label: '이용권 쿠폰 7일 (금 · 유니크)' },
];
const cfg = JSON.parse(fs.readFileSync('C:/Users/mingu/메월드폴더/.mcp.json', 'utf8')).mcpServers['msw-mcp'];
const map = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
const save = () => fs.writeFileSync(OUT, JSON.stringify(map, null, 1) + '\n');

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
function pngSize(buf) { return [buf.readUInt32BE(16), buf.readUInt32BE(20)]; }

(async () => {
  const todo = ITEMS.filter((i) => !map[i.key]);
  console.log('올릴 것', todo.length, '· 이미 있음', Object.keys(map).length);
  if (!todo.length) return;
  await rpc('initialize', { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'vd-boost-upload', version: '1.0' } });
  await rpc('notifications/initialized', {}, true);
  for (const it of todo) {
    const file = path.join(SRC, it.key + '.png');
    const buf = fs.readFileSync(file);
    const base = { groupCode: GROUP, category: 'sprite', subcategory: 'etc', name: 'dui_' + it.key, description: '디자이너 UI · ' + it.label + ' · 2x · WO-053', contentLength: buf.length };
    const s1 = await tool('asset_create_group_resource_storage_item', base);
    if (!s1.presignedUrl) throw new Error('presignedUrl 없음: ' + JSON.stringify(s1).slice(0, 200));
    const put = await fetch(s1.presignedUrl, { method: 'PUT', body: buf });
    if (!put.ok) throw new Error(`PUT ${put.status}`);
    const s2 = await tool('asset_create_group_resource_storage_item', Object.assign({}, base, { fileUrl: s1.presignedUrl.split('?')[0] }));
    const ruid = findRuid(s2);
    if (!ruid) throw new Error('RUID 없음: ' + JSON.stringify(s2).replace(/https?:[^" ]+/g, '<url>').slice(0, 200));
    const props = [{ key: 'pivot_x', value: '0.5' }, { key: 'pivot_y', value: '0.5' }, { key: 'filter_mode', value: 'Bilinear' }, { key: 'wrap_mode', value: 'Clamp' }];
    let propsOk = true;
    try { await tool('asset_update_resource_storage_info', { guid: ruid, properties: props }); } catch (e) { propsOk = false; console.log('  속성 등록 실패', it.key, String(e.message).slice(0, 160)); }
    map[it.key] = { ruid, name: base.name, mode: 'simple', size: pngSize(buf), shown: [160, 112], propsOk };
    save();
    console.log('성공', it.key, ruid, pngSize(buf).join('x'));
  }
})().catch((e) => { console.error('FAIL', String(e.message).slice(0, 300)); process.exit(1); });
