// WO-040 — 가공한 시설 프레임(`리소스파일/포탑관련 모든것/_upload/<종류>/*.png` + manifest.json)을 그룹 리소스에 올리고
// 이름 → RUID 표(`Docs/tools/facility-art/ruid-map.json`)를 만든다.
// MCP 도구(asset_create_group_resource_storage_item · asset_update_resource_storage_info · asset_update_resource_storage_data)를
// 허브 .mcp.json 의 msw-mcp 서버로 직접 부른다. 토큰은 읽어서 헤더로만 쓰고 출력 · 기록하지 않는다.
// (구조는 디자인인계/디자이너-시안-2026-10-01/_tools/upload.cjs 를 따랐다.)
//
// 실행:
//   node Docs/tools/facility-art/upload.cjs E18-7-1                  # 아직 RUID 가 없는 프레임만 올림(있으면 건너뜀)
//   node Docs/tools/facility-art/upload.cjs E18-7-1 --update <이름..>  # 같은 RUID 의 그림만 교체 + 속성 다시 적음
//   node Docs/tools/facility-art/upload.cjs E18-7-1 --props <이름..> pivot_x=0.5 pivot_y=0.5   # 속성만 바꿈(여러 장 · 키=값)
//   node Docs/tools/facility-art/upload.cjs E18-7-1 --list           # 표 출력(RUID 앞 8자리)
//   node Docs/tools/facility-art/upload.cjs E18-7-1 --fixprops       # 속성 등록에 실패한(propsOk=false) 장만 속성 다시 적음
// 종류마다 따로 돌린다(종류별 manifest = _upload/<종류>/manifest.json · 같은 ruid-map.json 에 합치므로 한 번에 하나씩만).
// 이름 = manifest 의 name (예: normal_0007) · 그룹 리소스 이름은 `fac_<종류>_<이름>`.
const fs = require('fs');
const path = require('path');

const KIND = process.argv[2];
if (!KIND || KIND.startsWith('-')) { console.error('사용: node upload.cjs <종류 예 E18-7-1> [--update|--props|--list ...]'); process.exit(1); }
const SRC = 'C:/Users/mingu/메월드폴더/리소스파일/포탑관련 모든것/_upload/' + KIND;
const MAP = path.join(__dirname, 'ruid-map.json');
const GROUP = 'mIYbC';
const PREFIX = 'fac_' + KIND + '_';
const cfg = JSON.parse(fs.readFileSync('C:/Users/mingu/메월드폴더/.mcp.json', 'utf8')).mcpServers['msw-mcp'];
const mf = JSON.parse(fs.readFileSync(path.join(SRC, 'manifest.json'), 'utf8'));
const maps = fs.existsSync(MAP) ? JSON.parse(fs.readFileSync(MAP, 'utf8')) : {};
if (!maps[KIND]) maps[KIND] = { frames: {} };
const map = maps[KIND];
map.group = GROUP;
map.canvas = mf.canvas;
map.pivot_norm = [mf.pivot_norm_x, mf.pivot_norm_y_from_bottom];
map.village = mf.village; map.facility = mf.facility;
const save = () => fs.writeFileSync(MAP, JSON.stringify(maps, null, 1) + '\n');

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
// 일시 오류(네트워크 · 5xx)는 단계마다 3번까지 다시 시도한다(만들기 단계가 끝난 뒤 실패해도 중복 항목이 안 생기게 단계별로).
async function retry(label, fn) {
  let last;
  for (let t = 1; t <= 3; t++) {
    try { return await fn(); } catch (e) { last = e; await new Promise((r) => setTimeout(r, 800 * t)); }
  }
  throw new Error(label + ': ' + String(last && last.message).slice(0, 200));
}
async function init() {
  await rpc('initialize', { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'vd-facility-art-upload', version: '1.0' } });
  await rpc('notifications/initialized', {}, true);
}
// 피벗: 기본 = manifest(기둥 중심 x / 가운데 y). 엔티티 피벗이 그림 중심이라는 지금 시설 규칙(GroundOffset)을 따른다.
function defaultProps() {
  return [
    { key: 'pivot_x', value: String(Math.round(mf.pivot_norm_x * 10000) / 10000) }, { key: 'pivot_y', value: '0.5' },
    { key: 'filter_mode', value: 'Bilinear' }, { key: 'wrap_mode', value: 'Clamp' },
  ];
}
const entryOf = (name) => mf.frames.find((f) => f.name === name);
// 축소 배율은 종류마다 다르다(기본 0.5 · 7-5 새 그림은 원본이 작아 1.0 = 축소 없음). 같은 그림 복사 프레임(manifest.aliases)은 manifest.frames 에 없으므로 올라가지 않는다 — 표는 gen-rows.cjs 가 aliases 로 같은 RUID 를 가리킨다.
const desc = (f) => `WO-040 시설 그림 ${KIND} ${f.state}${f.frame === null ? ' 정지' : ' ' + String(f.frame).padStart(4, '0')} · ${mf.canvas[0]}x${mf.canvas[1]} ${mf.reduce === 1 ? '축소 없음' : Math.round(mf.reduce * 100) + '% 축소'}`;

async function one(f, verbose) {
  const buf = fs.readFileSync(path.join(SRC, f.file));
  const base = { groupCode: GROUP, category: 'sprite', subcategory: 'object', name: PREFIX + f.name, description: desc(f), contentLength: buf.length };
  const s1 = await retry('create1', () => tool('asset_create_group_resource_storage_item', base));
  if (!s1.presignedUrl) throw new Error('presignedUrl 없음: ' + JSON.stringify(s1).slice(0, 200));
  await retry('put', async () => { const put = await fetch(s1.presignedUrl, { method: 'PUT', body: buf }); if (!put.ok) throw new Error(`PUT ${put.status}`); });
  const s2 = await retry('create2', () => tool('asset_create_group_resource_storage_item', Object.assign({}, base, { fileUrl: s1.presignedUrl })));
  if (verbose) console.log('step2 응답 모양:', JSON.stringify(s2).replace(/https?:\/\/[^"\\]+/g, '<url>').slice(0, 400));
  const ruid = findRuid(s2);
  if (!ruid) throw new Error('RUID 없음: ' + JSON.stringify(s2).slice(0, 200));
  const props = defaultProps();
  let propsOk = true;
  try { await retry('props', () => tool('asset_update_resource_storage_info', { guid: ruid, properties: props })); } catch (e) { propsOk = false; console.log('  속성 등록 실패', f.name, String(e.message).slice(0, 160)); }
  map.frames[f.name] = { ruid, name: base.name, bytes: buf.length, props: Object.fromEntries(props.map((p) => [p.key, p.value])), propsOk };
  save();
  return ruid;
}

async function updateOne(f) {
  const ent = map.frames[f.name]; if (!ent) throw new Error('ruid-map 에 없는 이름(먼저 올려야 함): ' + f.name);
  const buf = fs.readFileSync(path.join(SRC, f.file));
  const s1 = await tool('asset_update_resource_storage_data', { guid: ent.ruid, contentLength: buf.length });
  if (!s1.presignedUrl) throw new Error('presignedUrl 없음: ' + JSON.stringify(s1).slice(0, 200));
  const put = await fetch(s1.presignedUrl, { method: 'PUT', body: buf });
  if (!put.ok) throw new Error(`PUT ${put.status}`);
  await tool('asset_update_resource_storage_data', { guid: ent.ruid, contentLength: buf.length, fileUrl: s1.presignedUrl });
  const props = defaultProps();
  await tool('asset_update_resource_storage_info', { guid: ent.ruid, properties: props });
  ent.bytes = buf.length; ent.props = Object.fromEntries(props.map((p) => [p.key, p.value])); ent.propsOk = true; ent.updated = new Date().toISOString(); save();
  return ent.ruid;
}

(async () => {
  const mode = process.argv[3] || '';
  if (mode === '--list') {
    for (const f of mf.frames) { const e = map.frames[f.name]; console.log(f.name.padEnd(16), e ? e.ruid.slice(0, 8) : '(없음)', e ? JSON.stringify(e.props) : ''); }
    return;
  }
  if (mode === '--update') {
    const names = process.argv.slice(4); const fs_ = names.map(entryOf);
    if (fs_.some((x) => !x)) throw new Error('manifest 에 없는 이름 있음');
    await init();
    for (const f of fs_) { try { const r = await updateOne(f); console.log('교체 성공', f.name, r.slice(0, 8)); } catch (e) { console.log('교체 실패', f.name, String(e.message).slice(0, 300)); process.exitCode = 1; } }
    return;
  }
  if (mode === '--props') {
    const rest = process.argv.slice(4);
    const kv = rest.filter((a) => a.includes('=')); const names = rest.filter((a) => !a.includes('='));
    const given = Object.fromEntries(kv.map((a) => { const i = a.indexOf('='); return [a.slice(0, i), a.slice(i + 1)]; }));
    await init();
    for (const n of names) {
      const ent = map.frames[n]; if (!ent) { console.log('표에 없음', n); process.exitCode = 1; continue; }
      // 🔴 asset_update_resource_storage_info 는 속성 목록을 **통째로 바꾼다**(안 적은 키는 사라짐 · 2026-10-02 실측) → 기록해 둔 속성에 합쳐서 전부 보낸다.
      const merged = Object.assign({}, ent.props, given);
      const props = Object.entries(merged).map(([key, value]) => ({ key, value }));
      await tool('asset_update_resource_storage_info', { guid: ent.ruid, properties: props });
      ent.props = merged; save();
      console.log('속성 변경', n, JSON.stringify(props));
    }
    return;
  }
  if (mode === '--fixprops') {
    // propsOk 가 false 인 장의 속성만 다시 적는다
    await init();
    for (const [n, ent] of Object.entries(map.frames)) {
      if (ent.propsOk !== false) continue;
      try { await retry('props', () => tool('asset_update_resource_storage_info', { guid: ent.ruid, properties: Object.entries(ent.props).map(([key, value]) => ({ key, value })) })); ent.propsOk = true; save(); console.log('속성 다시 적음', n); } catch (e) { console.log('실패', n, String(e.message).slice(0, 160)); process.exitCode = 1; }
    }
    return;
  }
  if (mode === '--probe') {
    // 시험용 복제: manifest 의 그림 하나를 다른 이름 · 다른 피벗으로 새로 올린다. 사용: --probe <원본이름> <새이름> key=값 ...  (표의 _probe 칸에 기록)
    const src = entryOf(process.argv[4]); const nm = process.argv[5];
    const given = Object.fromEntries(process.argv.slice(6).map((a) => { const i = a.indexOf('='); return [a.slice(0, i), a.slice(i + 1)]; }));
    if (!src || !nm) throw new Error('--probe <원본이름> <새이름> key=값 ...');
    await init();
    const buf = fs.readFileSync(path.join(SRC, src.file));
    const base = { groupCode: GROUP, category: 'sprite', subcategory: 'object', name: PREFIX + 'probe_' + nm, description: 'WO-040 피벗 시험용 복제(' + src.name + ') · 쓰지 않음', contentLength: buf.length };
    const s1 = await tool('asset_create_group_resource_storage_item', base);
    const put = await fetch(s1.presignedUrl, { method: 'PUT', body: buf }); if (!put.ok) throw new Error('PUT ' + put.status);
    const s2 = await tool('asset_create_group_resource_storage_item', Object.assign({}, base, { fileUrl: s1.presignedUrl }));
    const ruid = findRuid(s2); if (!ruid) throw new Error('RUID 없음');
    const merged = Object.assign({ filter_mode: 'Bilinear', wrap_mode: 'Clamp' }, given);
    await tool('asset_update_resource_storage_info', { guid: ruid, properties: Object.entries(merged).map(([key, value]) => ({ key, value })) });
    if (!map._probe) map._probe = {};
    map._probe[nm] = { ruid, name: base.name, props: merged }; save();
    console.log('시험 복제', nm, ruid, JSON.stringify(merged));
    return;
  }
  const items = mf.frames.filter((f) => !map.frames[f.name]);
  console.log('올릴 것', items.length, '· 이미 있음', Object.keys(map.frames).length);
  if (!items.length) return;
  await init();
  let i = 0; let ok = 0; let fail = 0;
  async function run(it, verbose) { try { await one(it, verbose); ok++; } catch (e) { fail++; console.log('실패', it.name, String(e.message).slice(0, 200)); } }
  async function worker() { while (i < items.length) await run(items[i++], false); }
  await run(items[i++], true); // 첫 장은 혼자 올려 응답 모양을 확인한다
  await Promise.all([worker(), worker(), worker()]);
  console.log('끝 — 성공', ok, '실패', fail, '· 표', Object.keys(map.frames).length);
})().catch((e) => { console.error('FAIL', String(e.message).slice(0, 300)); process.exit(1); });
