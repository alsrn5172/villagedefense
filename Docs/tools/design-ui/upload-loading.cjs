// WO-050 §2-17 — 로딩 그림 6장을 임시 폴더에 풀고 파일명을 NFC로 맞춘 뒤 그룹 리소스(mIYbC)에 업로드한다.
// 이미지 이름 → RUID 는 ruid-map.json 에 새 키로만 덧붙인다. 토큰은 허브 .mcp.json 헤더로만 쓰며 출력하지 않는다.
// 실행: node Docs/tools/design-ui/upload-loading.cjs
const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');

const ZIP = 'C:/Users/mingu/메월드폴더/리소스파일/로딩창.zip';
const MAP = path.join(__dirname, 'ruid-map.json');
const GROUP = 'mIYbC';
const ROOT = 'C:/Users/mingu/메월드폴더';
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, '.mcp.json'), 'utf8')).mcpServers['msw-mcp'];
const specs = [
  ['로딩창_리스항구에서 헤네시스_낮.png', 'loading_lith_henesys_day', 'dui_loading_lith_henesys_day'],
  ['로딩창_리스항구에서 헤네시스_밤.png', 'loading_lith_henesys_night', 'dui_loading_lith_henesys_night'],
  ['로딩창_커닝시티에서 페리온_낮.png', 'loading_kerning_perion_day', 'dui_loading_kerning_perion_day'],
  ['로딩창_커닝시티에서 페리온_밤.png', 'loading_kerning_perion_night', 'dui_loading_kerning_perion_night'],
  ['로딩창_엘리니아에서 노틸러스_낮.png', 'loading_ellinia_nautilus_day', 'dui_loading_ellinia_nautilus_day'],
  ['로딩창_엘리니아에서 노틸러스_밤.png', 'loading_ellinia_nautilus_night', 'dui_loading_ellinia_nautilus_night'],
];

let sid = null;
let rpcId = 0;
function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) {
    c ^= byte;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ ((c & 1) ? 0xedb88320 : 0);
  }
  return (c ^ 0xffffffff) >>> 0;
}
function unzipNfc() {
  const zip = fs.readFileSync(ZIP);
  let end = -1;
  for (let i = zip.length - 22; i >= Math.max(0, zip.length - 65558); i--) {
    if (zip.readUInt32LE(i) === 0x06054b50) { end = i; break; }
  }
  if (end < 0) throw new Error('ZIP 중앙 디렉터리를 찾지 못했습니다');
  const count = zip.readUInt16LE(end + 10);
  let cursor = zip.readUInt32LE(end + 16);
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'msw-loading-'));
  const wanted = new Map(specs.map((s) => [s[0], s]));
  for (let i = 0; i < count; i++) {
    if (zip.readUInt32LE(cursor) !== 0x02014b50) throw new Error('ZIP 중앙 디렉터리 형식이 올바르지 않습니다');
    const flags = zip.readUInt16LE(cursor + 8);
    const method = zip.readUInt16LE(cursor + 10);
    const expectedCrc = zip.readUInt32LE(cursor + 16);
    const packedSize = zip.readUInt32LE(cursor + 20);
    const size = zip.readUInt32LE(cursor + 24);
    const nameLength = zip.readUInt16LE(cursor + 28);
    const extraLength = zip.readUInt16LE(cursor + 30);
    const commentLength = zip.readUInt16LE(cursor + 32);
    const localOffset = zip.readUInt32LE(cursor + 42);
    const rawName = zip.subarray(cursor + 46, cursor + 46 + nameLength).toString((flags & 0x800) ? 'utf8' : 'latin1');
    const name = rawName.normalize('NFC');
    const spec = wanted.get(name);
    if (spec) {
      if (zip.readUInt32LE(localOffset) !== 0x04034b50) throw new Error('ZIP 파일 헤더가 올바르지 않습니다: ' + name);
      const localNameLength = zip.readUInt16LE(localOffset + 26);
      const localExtraLength = zip.readUInt16LE(localOffset + 28);
      const dataStart = localOffset + 30 + localNameLength + localExtraLength;
      const packed = zip.subarray(dataStart, dataStart + packedSize);
      let image;
      if (method === 8) image = zlib.inflateRawSync(packed);
      else if (method === 0) image = Buffer.from(packed);
      else throw new Error('지원하지 않는 ZIP 압축 방식 ' + method + ': ' + name);
      if (image.length !== size || crc32(image) !== expectedCrc) throw new Error('ZIP 이미지 검증 실패: ' + name);
      if (image.toString('ascii', 1, 4) !== 'PNG' || image.readUInt32BE(16) !== 1672 || image.readUInt32BE(20) !== 941) {
        throw new Error('PNG 크기가 예상과 다릅니다(1672×941): ' + name);
      }
      const normalizedPath = path.join(scratch, name);
      fs.writeFileSync(normalizedPath, image);
      spec.file = normalizedPath;
      spec.buffer = image;
    }
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  for (const spec of specs) if (!spec.file) throw new Error('ZIP에서 파일을 찾지 못했습니다(NFC): ' + spec[0]);
  return scratch;
}
async function rpc(method, params, notify) {
  const headers = Object.assign({ 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' }, cfg.headers || {});
  if (sid) headers['Mcp-Session-Id'] = sid;
  const body = notify ? { jsonrpc: '2.0', method, params } : { jsonrpc: '2.0', id: ++rpcId, method, params };
  const response = await fetch(cfg.url, { method: 'POST', headers, body: JSON.stringify(body) });
  const newSid = response.headers.get('mcp-session-id');
  if (newSid) sid = newSid;
  if (notify) return null;
  const text = await response.text();
  if (!response.ok) throw new Error('MCP ' + method + ' HTTP ' + response.status + ': ' + text.slice(0, 200));
  let message;
  if ((response.headers.get('content-type') || '').includes('text/event-stream')) {
    const data = text.split('\n').filter((line) => line.startsWith('data:')).map((line) => line.slice(5).trim());
    message = JSON.parse(data[data.length - 1]);
  } else message = JSON.parse(text);
  if (message.error) throw new Error('MCP ' + method + ': ' + JSON.stringify(message.error).slice(0, 300));
  return message.result;
}
async function call(name, args) {
  const result = await rpc('tools/call', { name, arguments: args });
  const content = (result.content || []).map((item) => item.text || '').join('');
  if (result.isError) throw new Error(name + ': ' + content.slice(0, 300));
  try { return JSON.parse(content); } catch (_) { return { raw: content }; }
}
function findRuid(value) {
  if (!value || typeof value !== 'object') return null;
  for (const key of Object.keys(value)) if (/^(ruid|guid)$/i.test(key) && typeof value[key] === 'string' && /^[0-9a-f]{32}$/i.test(value[key])) return value[key];
  for (const key of Object.keys(value)) { const result = findRuid(value[key]); if (result) return result; }
  return null;
}
async function retry(label, fn) {
  let last;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try { return await fn(); } catch (error) { last = error; await new Promise((resolve) => setTimeout(resolve, attempt * 800)); }
  }
  throw new Error(label + ': ' + String(last && last.message).slice(0, 200));
}
function appendMapKey(key, value) {
  const current = fs.readFileSync(MAP, 'utf8');
  const table = JSON.parse(current);
  if (Object.prototype.hasOwnProperty.call(table, key)) return false;
  const end = current.lastIndexOf('}');
  if (end < 0) throw new Error('ruid-map.json 최상위 객체를 찾지 못했습니다');
  const prefix = current.slice(0, end).trimEnd();
  const comma = prefix.endsWith('{') ? '' : ',';
  const entry = JSON.stringify({ [key]: value }, null, 1).slice(1, -1).split('\n').map((line) => ' ' + line).join('\n');
  const separator = prefix.endsWith('{') ? '\n' : '\n';
  fs.writeFileSync(MAP, prefix + comma + separator + entry + '\n' + current.slice(end), 'utf8');
  return true;
}

(async () => {
  const scratch = unzipNfc();
  const existing = JSON.parse(fs.readFileSync(MAP, 'utf8'));
  const todo = specs.filter((spec) => !existing[spec[1]]);
  console.log('임시 추출 완료: NFC 파일 6장, 1672×941 · 올릴 그림 ' + todo.length + '장');
  if (!todo.length) return;
  await rpc('initialize', { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'vd-loading-upload', version: '1.0' } });
  await rpc('notifications/initialized', {}, true);
  for (const spec of todo) {
    const key = spec[1];
    const name = spec[2];
    const data = spec.buffer;
    const base = { groupCode: GROUP, category: 'sprite', subcategory: 'object', name,
      description: 'WO-050 마을 이동 로딩 그림 · 1672x941 · 피벗 가운데', contentLength: data.length };
    try {
      const first = await retry('presigned URL', () => call('asset_create_group_resource_storage_item', base));
      if (!first.presignedUrl) throw new Error('presignedUrl 없음');
      await retry('presigned PUT', async () => {
        const put = await fetch(first.presignedUrl, { method: 'PUT', body: data });
        if (!put.ok) throw new Error('PUT HTTP ' + put.status);
      });
      const finish = await retry('리소스 등록', () => call('asset_create_group_resource_storage_item', Object.assign({}, base, { fileUrl: first.presignedUrl })));
      const ruid = findRuid(finish);
      if (!ruid) throw new Error('RUID 없음');
      const properties = [
        { key: 'pivot_x', value: '0.5' }, { key: 'pivot_y', value: '0.5' },
        { key: 'filter_mode', value: 'Bilinear' }, { key: 'wrap_mode', value: 'Clamp' },
      ];
      await retry('리소스 속성', () => call('asset_update_resource_storage_info', { guid: ruid, properties }));
      appendMapKey(key, { ruid, name, mode: 'simple', size: [1672, 941], border_trbl: null, propsOk: true });
      console.log('등록 완료 ' + name + ' ' + ruid.slice(0, 8));
    } catch (error) {
      console.error('등록 실패 ' + name + ': ' + String(error.message).slice(0, 220));
      process.exitCode = 1;
      break;
    }
  }
  console.log('임시 추출 폴더: ' + scratch);
})().catch((error) => { console.error('실패: ' + String(error.message).slice(0, 300)); process.exit(1); });
