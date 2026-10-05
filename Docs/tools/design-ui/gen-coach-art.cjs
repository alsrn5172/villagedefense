// 처음 하는 사람 안내(시안 WIN_COACH)에서 그림 파일이 없는 두 장을 PNG 로 그린다 — 의존성 없음(Node 내장 zlib).
//   coach_ring   : 누르기 유도 고리. 시안 pulse() = 지름 68 원 + 금 고리 4 + 반투명 12 · 22 (CSS box-shadow) → 화면 112 × 112, 2배로 그림
//   coach_finger : 손가락 커서. 시안 I.cursor SVG(24 상자 · M4 3 18 11 12 12.5 9 19 · 흰 칠 + #111 테두리 1.4) + 그림자(0 3px 4px α0.6) → 화면 44 × 44, 2배로 그림
// 실행: node Docs/tools/design-ui/gen-coach-art.cjs <출력 폴더>
// 올리기는 Claude 세션의 msw-mcp(asset_create_group_resource_storage_item)로 한다 — 결과 RUID 는 ruid-map.json 의 coach_* 행.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const OUT = process.argv[2];
if (!OUT) { console.error('사용: node gen-coach-art.cjs <출력 폴더>'); process.exit(1); }
fs.mkdirSync(OUT, { recursive: true });

// ── PNG 쓰기 (RGBA 8bit · 필터 0) ──
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(buf) { let c = 0xffffffff; for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function writePng(file, w, h, px) { // px: Float32Array w*h*4 (0..1, 곱하지 않은 알파)
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    for (let x = 0; x < w * 4; x++) raw[y * (w * 4 + 1) + 1 + x] = Math.max(0, Math.min(255, Math.round(px[y * w * 4 + x] * 255)));
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
  fs.writeFileSync(file, png);
  return file;
}
// 위에 덮어 그리기(보통 알파 합성)
function over(px, i, r, g, b, a) {
  if (a <= 0) return;
  const da = px[i + 3]; const oa = a + da * (1 - a);
  if (oa <= 0) return;
  px[i] = (r * a + px[i] * da * (1 - a)) / oa; px[i + 1] = (g * a + px[i + 1] * da * (1 - a)) / oa; px[i + 2] = (b * a + px[i + 2] * da * (1 - a)) / oa; px[i + 3] = oa;
}
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const hex = (h) => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];

// ── 1) 고리: 화면 px 기준 반지름 34(안) · 38(금) · 46(α.35) · 56(α.15) — 2배로 그린다 ──
{
  const S = 2; const R = 56; const W = R * 2 * S; const px = new Float32Array(W * W * 4);
  const gold = hex('#F2CD72');
  const bands = [[46, 56, 0.15], [38, 46, 0.35], [34, 38, 1.0]]; // 바깥부터 그린다
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
    const d = Math.hypot((x + 0.5) / S - R, (y + 0.5) / S - R); // 화면 px 단위 거리
    const i = (y * W + x) * 4;
    for (const [r0, r1, a] of bands) {
      const cov = clamp01((d - r0) * S + 0.5) * clamp01((r1 - d) * S + 0.5); // 가장자리 1px 부드럽게
      over(px, i, gold[0], gold[1], gold[2], a * cov);
    }
  }
  console.log(writePng(path.join(OUT, 'coach_ring.png'), W, W, px), `${W}x${W}`);
}

// ── 2) 손가락(화살표 커서): 24 상자를 44 화면 px 에 맞춘 시안 SVG 를 2배(88 px)로 ──
{
  const S = 88 / 24; // 상자 1 = 3.667 px
  const W = 88; const px = new Float32Array(W * W * 4);
  const P = [[4, 3], [18, 11], [12, 12.5], [9, 19]];
  // 다각형까지의 부호 거리(상자 단위 · 안 = 음수)
  function sdf(x, y) {
    let d = Infinity; let inside = false;
    for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
      const [ax, ay] = P[j]; const [bx, by] = P[i];
      const ex = bx - ax, ey = by - ay; const t = clamp01(((x - ax) * ex + (y - ay) * ey) / (ex * ex + ey * ey));
      d = Math.min(d, Math.hypot(x - (ax + ex * t), y - (ay + ey * t)));
      if (((ay > y) !== (by > y)) && (x < (bx - ax) * (y - ay) / (by - ay) + ax)) inside = !inside;
    }
    return inside ? -d : d;
  }
  const stroke = 1.4 / 2; const aa = 1 / S; // 반 두께 · 1px
  const shOff = 3 * 2 / S; const shBlur = 4 * 2 / S; // 그림자 0 3px 4px (화면 px 를 2배로 그린다)
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
    const ux = (x + 0.5) / S; const uy = (y + 0.5) / S; const i = (y * W + x) * 4;
    // 그림자: 아래로 3px · 퍼짐 4px
    const ds = sdf(ux, uy - shOff) - stroke;
    over(px, i, 0, 0, 0, 0.6 * clamp01(1 - (ds + 0.2) / shBlur) * (ds < shBlur ? 1 : 0));
    const d = sdf(ux, uy);
    // 테두리(#111) — 선 바깥 끝까지
    over(px, i, 0x11 / 255, 0x11 / 255, 0x11 / 255, clamp01((stroke - d) / aa + 0.5));
    // 흰 칠 — 선 안쪽
    over(px, i, 1, 1, 1, clamp01((-stroke - d) / aa + 0.5));
  }
  console.log(writePng(path.join(OUT, 'coach_finger.png'), W, W, px), `${W}x${W}`);
}
