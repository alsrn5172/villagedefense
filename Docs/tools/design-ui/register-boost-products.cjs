// 이용권 상품 3종(1/3/7일)을 월드에 **미공개**로 등록한다 (WO-053 §3 · 사용자 승인 2026-10-07).
// 썸네일 120×120 = 메월드폴더/handoff/wo053-상품썸네일/thumb_pass_{1,3,7}d.png
// 결과(상품 ID)는 boost-products.json 에 월드별로 적는다. 이미 그 월드에 같은 일수가 있으면 건너뛴다.
// 실행: node Docs/tools/design-ui/register-boost-products.cjs <worldId> <group|personal>
// 🔴 공개(판매 시작) 전환은 사람이 한다. 이 스크립트는 isPublished=false 로만 만든다.
const fs = require('fs');
const path = require('path');

const [WORLD, KIND] = process.argv.slice(2);
if (!/^[0-9a-f]{32}$/.test(WORLD || '') || !['group', 'personal'].includes(KIND)) { console.error('usage: <worldId> <group|personal>'); process.exit(2); }
const THUMB = 'C:/Users/mingu/메월드폴더/handoff/wo053-상품썸네일';
const OUT = path.join(__dirname, 'boost-products.json');
const PRODUCTS = [
  { days: 1, price: 200 },
  { days: 3, price: 400 },
  { days: 7, price: 600 },
];
const desc = (d) => `매치 순위 보상의 계정 경험치와 발록의 심장을 2배로 받아요. 산 즉시 ${d * 24}시간(${d}일) 동안 실제 시간으로 줄어들고(접속하지 않아도 줄어듦), 사용 중에 또 사면 남은 기간 뒤에 더해져요.`;
const cfg = JSON.parse(fs.readFileSync('C:/Users/mingu/메월드폴더/.mcp.json', 'utf8')).mcpServers['msw-mcp'];
const out = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
const save = () => fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n');

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
const redact = (o) => JSON.stringify(o).replace(/https?:[^"\\ ]+/g, '<url>');
function dig(o, re) {
  if (!o || typeof o !== 'object') return null;
  for (const k of Object.keys(o)) if (re.test(k) && (typeof o[k] === 'string' || typeof o[k] === 'number')) return String(o[k]);
  for (const k of Object.keys(o)) { const r = dig(o[k], re); if (r) return r; }
  return null;
}

(async () => {
  out[WORLD] = out[WORLD] || { kind: KIND, items: {} };
  await rpc('initialize', { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'vd-boost-products', version: '1.0' } });
  await rpc('notifications/initialized', {}, true);
  for (const p of PRODUCTS) {
    if (out[WORLD].items[p.days]) { console.log('건너뜀(이미 있음)', p.days + '일', out[WORLD].items[p.days].itemId); continue; }
    const buf = fs.readFileSync(path.join(THUMB, `thumb_pass_${p.days}d.png`));
    const t1 = await tool('world_item_upload_thumbnail', { worldId: WORLD, fileExtension: 'png', contentLength: buf.length });
    const purl = t1.presignedUrl || dig(t1, /presigned/i);
    if (!purl) throw new Error('presignedUrl 없음: ' + redact(t1).slice(0, 300));
    const put = await fetch(purl, { method: 'PUT', body: buf });
    if (!put.ok) throw new Error(`PUT ${put.status}`);
    const t2 = await tool('world_item_upload_thumbnail', { worldId: WORLD, fileExtension: 'png', contentLength: buf.length, fileUrl: purl });
    const thumbUrl = dig(t2, /thumbnail.*url|^url$|fileurl|imageurl/i);
    // 2단계 응답은 itemThumbnailUrl 하나뿐이다(2026-10-07 실측) → 파일 이름은 그 주소의 마지막 조각.
    const thumbName = dig(t2, /file.*name|^name$/i) || (thumbUrl ? decodeURIComponent(new URL(thumbUrl).pathname.split('/').pop()) : null);
    if (!thumbUrl || !thumbName) throw new Error('썸네일 응답 모양 다름: ' + redact(t2).slice(0, 400));
    const c = await tool('world_item_create', {
      worldId: WORLD, itemType: 'ITEM', itemName: `${p.days}일 이용권`, hasItemPrice: true, itemPrice: p.price,
      itemThumbnailUrl: thumbUrl, itemThumbnailFileName: thumbName, hasSalesPeriod: false,
      itemDescription: desc(p.days), isPublished: false, language: 'ko',
    });
    const itemId = dig(c, /^itemId$|^id$|productId/i);
    console.log('등록', p.days + '일', 'itemId=' + itemId, '응답', redact(c).slice(0, 300));
    if (!itemId) throw new Error('itemId 없음');
    out[WORLD].items[p.days] = { itemId, price: p.price, name: `${p.days}일 이용권`, published: false, at: new Date().toISOString() };
    save();
  }
  console.log('끝', JSON.stringify(out[WORLD].items));
})().catch((e) => { console.error('FAIL', String(e.message).slice(0, 400)); process.exit(1); });
