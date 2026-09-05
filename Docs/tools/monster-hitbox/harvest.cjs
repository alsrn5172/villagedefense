// 몬스터 피격 판정 사전 계산: mob_clips.json(몬스터 id → stand 클립 RUID)의 stand 클립 첫 프레임
// width/height/pivot(px · 좌하단 기준 · PPU 100) → BoxSize=(w,h)/100 · ColliderOffset=(w/2−px, h/2−py)/100 → mob_hitbox.json
// 런타임 FrameSprite.PivotPixel 계산과 동일식 (스포아 36×36 pivot(18,0) 실측 일치).
//
//   node Docs/tools/monster-hitbox/harvest.cjs        → 그 다음 apply.cjs
//
// 리소스 API 래퍼는 msw-search 스킬의 것(.claude/skills/msw-search/scripts/msw_resource_api.cjs).
// 다른 위치면 MSW_RESOURCE_API 환경변수로 넘긴다. 클립 RUID 가 바뀐 몬스터만 다시 돌리면 된다.
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..", "..", "..");
const API = process.env.MSW_RESOURCE_API
  || path.resolve(ROOT, ".claude", "skills", "msw-search", "scripts", "msw_resource_api.cjs");
const { getResource } = require(API);
const IN = path.join(__dirname, "mob_clips.json");
const OUT = path.join(__dirname, "mob_hitbox.json");
const data = JSON.parse(fs.readFileSync(IN, "utf8"));
(async () => {
  const out = {};
  let ok = 0, miss = 0;
  for (const [id, e] of Object.entries(data)) {
    if (!e.file || e.skip || !e.clips) continue;
    const stand = e.clips.stand || e.clips.fly || e.clips.move;
    if (!stand) { miss++; continue; }
    try {
      const clip = await getResource(stand);
      const pl = (clip && clip.payload) || {};
      const f0 = pl.frames && pl.frames[0];
      const w = (f0 && f0.width) || pl.width, h = (f0 && f0.height) || pl.height, pivot = f0 && f0.pivot;
      if (!w || !h || !pivot) { miss++; out[id] = { name: e.name, file: e.file, stand, error: "no metrics" }; console.log(`${id} ${e.name}: NO METRICS`); continue; }
      const size = { x: +(w / 100).toFixed(3), y: +(h / 100).toFixed(3) };
      const off = { x: +((w / 2 - pivot.x) / 100).toFixed(3), y: +((h / 2 - pivot.y) / 100).toFixed(3) };
      out[id] = { name: e.name, file: e.file, stand, w, h, pivot, src: "frame0", size, off };
      ok++;
      console.log(`${id} ${e.name}: ${w}x${h} pivot=(${pivot.x},${pivot.y}) -> size=(${size.x},${size.y}) off=(${off.x},${off.y})`);
    } catch (err) { miss++; out[id] = { name: e.name, file: e.file, stand, error: String(err.message).slice(0, 120) }; console.log(`${id} ${e.name}: ERROR ${err.message}`); }
  }
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1), "utf8");
  console.log(`done ok=${ok} miss=${miss}`);
})();
