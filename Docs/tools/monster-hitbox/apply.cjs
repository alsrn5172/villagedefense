// 몬스터 피격 판정 사전 계산값(mob_hitbox.json) → 74개 모델의 HitComponent.BoxSize / ColliderOffset 에 기록.
// 런타임(Monster.FitHitboxToSprite)에서 매번 클립을 재지 않도록 미리 박아 둔다 (사용자 지시 2026-09-05).
//
//   node Docs/tools/monster-hitbox/apply.cjs
//
// 절차: Maker stop → 이 스크립트 → refresh → play. 🔴 첫 refresh 뒤 스폰이 (0,0) 을 읽으면 stop→refresh 를 한 번 더
// (Maker 모델 캐시 — 형식 문제가 아니다). 검증: 서버에서 SpawnByModelId 직후 HitComponent.BoxSize 되읽기.
// ModelBuilder 경로는 허브 스킬 기준. 다른 위치면 MSW_MODEL_BUILDER 환경변수로 넘긴다.
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..", "..", "..");
const BUILDER = process.env.MSW_MODEL_BUILDER
  || path.resolve(ROOT, "..", ".claude", "skills", "msw-general", "scripts", "model", "msw_model_builder.cjs");
const { ModelBuilder, vector2 } = require(BUILDER);
process.chdir(ROOT);
const data = JSON.parse(fs.readFileSync(path.join(__dirname, "mob_hitbox.json"), "utf8"));
const dir = "RootDesk/MyDesk/Models/Monsters";
const origLog = console.log;
let n = 0, fail = 0;
for (const [id, e] of Object.entries(data)) {
  if (!e.size) { fail++; console.log(`${id} ${e.name}: no size (harvest 실패분)`); continue; }
  try {
    console.log = () => {};
    const b = ModelBuilder.read(path.join(dir, e.file));
    b.value("MOD.Core.HitComponent", "BoxSize", vector2(e.size.x, e.size.y), "vector2")
     .value("MOD.Core.HitComponent", "ColliderOffset", vector2(e.off.x, e.off.y), "vector2")
     .write(path.join(dir, e.file));
    console.log = origLog;
    n++;
  } catch (err) { console.log = origLog; fail++; console.log(`${id} ${e.name}: FAIL ${err.message}`); }
}
console.log(`hitbox written to ${n} models, failed ${fail}`);
