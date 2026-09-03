#!/usr/bin/env node
/**
 * 정합성 검사 — 조용히 실패하는 사고를 커밋 전에 시끄럽게 만든다.
 *
 *   node Docs/tools/check-integrity.cjs
 *
 * 규칙: Docs/협업-규칙.md 11 / Docs/스키마-계약.md 0
 *
 * 왜 필요한가 — .gitattributes 가 CSV 를 merge=union 으로 두기 때문에
 * git 은 "성공적으로" 머지하면서 중복 행·깨진 참조를 만들 수 있다.
 * 이 검사가 없으면 union 은 순손해다.
 *
 * 각 검사는 실제로 겪은 사고에서 나왔다:
 *   C1 헤더 드리프트   두 월드의 MonsterInfo 가 9열/10열로 갈렸다
 *   C2 죽은 MapName    맵 개명 뒤 CSV 가 안 따라가 스포너가 조용히 멈췄다
 *   C3 기본 키 중복    merge=union 이 같은 행을 두 줄로 남긴다
 *   C4 userdataset 짝  csv 만 있으면 런타임이 표를 못 읽는다
 *   C5 이중 스폰       맵에 박힌 몹 + CSV 스포너가 같이 돌아 2배로 떴다
 *   C6 모델 누락       도감이 없는 ModelId 를 가리켜 스폰이 nil 을 반환했다
 */

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const CSV_DIR = path.join(ROOT, "RootDesk/MyDesk");
const MAP_DIR = path.join(ROOT, "map");

let failed = 0;
let warned = 0;

function fail(check, msg) {
  console.log(`  [31mFAIL[0m [${check}] ${msg}`);
  failed++;
}
function warn(check, msg) {
  console.log(`  [33mWARN[0m [${check}] ${msg}`);
  warned++;
}
function ok(check, msg) {
  console.log(`  [32mOK[0m   [${check}] ${msg}`);
}

function readCsv(name) {
  const p = path.join(CSV_DIR, name + ".csv");
  if (!fs.existsSync(p)) return null;
  const lines = fs
    .readFileSync(p, "utf8")
    .replace(/^﻿/, "")
    .split(/\r?\n/)
    .filter((l) => l.trim() !== "");
  return { header: lines[0].split(","), rows: lines.slice(1).map((l) => l.split(",")), path: p };
}

function mapNames() {
  if (!fs.existsSync(MAP_DIR)) return [];
  return fs
    .readdirSync(MAP_DIR)
    .filter((f) => f.endsWith(".map"))
    .map((f) => f.replace(/\.map$/, ""));
}

// ─────────────────────────────────────────────────────────
// C1. CSV 헤더가 계약서 정본과 글자 단위로 같은가
// ─────────────────────────────────────────────────────────
const CANONICAL = {
  MonsterInfo: "Id,Name,Level,MaxHp,Exp,CoinMin,CoinMax,ModelId,MoveType,AiType,MoveSpeed,JumpForce",
  MapMonsters: "MapName,MonsterId,X,Y,SpawnerId,SpawnId,SpawnCount,RespawnSeconds,Enabled,#Note",
  NpcInfo: "Id,Name,ModelId",
  MapNpcs: "MapName,NpcId,X,Y,#Note",
  PortalRoutes: "RouteId,FromMap,FromPortal,ToMap,ToPortal,Enabled,#Note",
  ItemInfo: "ItemId,Name,ItemType,EquipSlot,ReqLevel,ReqJob,IconRUID,BaseStr,BaseDex,BaseInt,BaseLuk,BaseAttack,BaseMagic,BaseDefense,BaseSpeed,BaseJump,BaseAccuracy,BaseAvoid,BaseMaxHp,BaseMaxMp,Mastery,MaxDurability,MaxEnhanceLevel,Stackable,MaxStack,SellMeso,Enabled,#Note",
  EnhanceTable: "EnhanceLevel,MesoCost,GemCount,SuccessRate,DestroyRate,DowngradeOnFail,AddDefense,Enabled,#Note",
  GemInfo: "GemId,StatId,AddPerLevel,DisplayName,IconRUID,Enabled,#Note",
  GemDropTable: "SourceId,SourceKind,GemId,Chance,CountMin,CountMax,Enabled,#Note",
  VillageNpcSector: "VillageId,SectorId,AnchorX,AnchorY,SlotDX,SlotDY,SlotPerRow,FlipX,Enabled,#Note",
  FunctionalNpcCatalog: "CatalogNpcId,RoleKey,DisplayName,UiGroupName,UiRoute,ActionRoute,OwnershipMode,SectorId,SlotOrder,Enabled,#Note",
};

console.log("\nC1. CSV 헤더 ↔ 계약서 정본");
for (const [name, expect] of Object.entries(CANONICAL)) {
  const t = readCsv(name);
  if (!t) {
    warn("C1", `${name}.csv 가 없다`);
    continue;
  }
  const actual = t.header.join(",");
  if (actual !== expect) {
    fail("C1", `${name} 헤더 불일치\n         기대: ${expect}\n         실제: ${actual}`);
  } else {
    ok("C1", `${name} (${t.rows.length}행)`);
  }
}

// ─────────────────────────────────────────────────────────
// C2. MapName 이 실제 .map 파일을 가리키는가 (죽은 참조)
// ─────────────────────────────────────────────────────────
console.log("\nC2. MapName ↔ 실제 맵");
const maps = new Set(mapNames());
for (const [name, col] of [["MapMonsters", "MapName"], ["MapNpcs", "MapName"]]) {
  const t = readCsv(name);
  if (!t) continue;
  const i = t.header.indexOf(col);
  const dead = new Map();
  for (const r of t.rows) {
    const v = (r[i] || "").trim();
    if (v && !maps.has(v)) dead.set(v, (dead.get(v) || 0) + 1);
  }
  if (dead.size) {
    for (const [v, n] of dead) fail("C2", `${name}: "${v}" 에 해당하는 맵이 없다 (${n}행) — 스포너가 조용히 안 돈다`);
  } else {
    ok("C2", `${name} 전 행이 실제 맵을 가리킨다`);
  }
}
// PortalRoutes 는 From/To 양쪽
{
  const t = readCsv("PortalRoutes");
  if (t) {
    const dead = new Map();
    for (const col of ["FromMap", "ToMap"]) {
      const i = t.header.indexOf(col);
      if (i < 0) continue;
      for (const r of t.rows) {
        const v = (r[i] || "").trim();
        if (v && !maps.has(v)) dead.set(`${col}=${v}`, (dead.get(`${col}=${v}`) || 0) + 1);
      }
    }
    if (dead.size) for (const [v, n] of dead) fail("C2", `PortalRoutes: ${v} 에 해당하는 맵이 없다 (${n}행)`);
    else ok("C2", "PortalRoutes 전 행이 실제 맵을 가리킨다");
  }
}

// ─────────────────────────────────────────────────────────
// C3. 기본 키 중복 (merge=union 이 만드는 사고)
// ─────────────────────────────────────────────────────────
console.log("\nC3. 기본 키 중복");
const PK = {
  MonsterInfo: ["Id"],
  NpcInfo: ["Id"],
  PortalRoutes: ["RouteId"],
  MapMonsters: ["MapName", "SpawnId"],
  LevelTable: ["Level"],
  SummonUnits: ["Key"],
  WorldMapNodes: ["MapName"],
  ItemInfo: ["ItemId"],
  EnhanceTable: ["EnhanceLevel"],
  GemInfo: ["GemId"],
  GemDropTable: ["SourceKind", "SourceId", "GemId"],
  VillageNpcSector: ["VillageId", "SectorId"],
  FunctionalNpcCatalog: ["CatalogNpcId"],
};
for (const [name, cols] of Object.entries(PK)) {
  const t = readCsv(name);
  if (!t) continue;
  const idx = cols.map((c) => t.header.indexOf(c));
  if (idx.some((i) => i < 0)) {
    warn("C3", `${name}: 기본 키 열(${cols.join("+")})을 찾지 못했다`);
    continue;
  }
  const seen = new Map();
  for (const r of t.rows) {
    const k = idx.map((i) => (r[i] || "").trim()).join("|");
    if (k.replace(/\|/g, "") === "") continue;
    seen.set(k, (seen.get(k) || 0) + 1);
  }
  const dup = [...seen].filter(([, n]) => n > 1);
  if (dup.length) {
    for (const [k, n] of dup.slice(0, 5)) fail("C3", `${name}: 키 "${k}" 가 ${n}번 나온다`);
    if (dup.length > 5) fail("C3", `${name}: 그 외 ${dup.length - 5}건 더`);
  } else {
    ok("C3", `${name} (${cols.join("+")})`);
  }
}

// ─────────────────────────────────────────────────────────
// C4. .csv ↔ .userdataset 짝
// ─────────────────────────────────────────────────────────
console.log("\nC4. csv ↔ userdataset 짝");
{
  const missing = [];
  for (const f of fs.readdirSync(CSV_DIR)) {
    if (!f.endsWith(".csv")) continue;
    const pair = path.join(CSV_DIR, f.replace(/\.csv$/, ".userdataset"));
    if (!fs.existsSync(pair)) missing.push(f);
  }
  if (missing.length) fail("C4", `짝 없는 csv: ${missing.join(", ")} — 런타임에서 표를 못 읽는다`);
  else ok("C4", "전 csv 에 userdataset 이 있다");
}

// ─────────────────────────────────────────────────────────
// C5. 이중 스폰 — 맵에 박힌 몹/NPC 와 CSV 스포너가 겹치는가
// ─────────────────────────────────────────────────────────
console.log("\nC5. 이중 스폰 (맵 박제 ↔ CSV)");
{
  const mm = readCsv("MapMonsters");
  const mn = readCsv("MapNpcs");
  const csvCount = (t, prefixCol) => {
    const m = new Map();
    if (!t) return m;
    const i = t.header.indexOf(prefixCol);
    for (const r of t.rows) {
      const v = (r[i] || "").trim();
      if (v) m.set(v, (m.get(v) || 0) + 1);
    }
    return m;
  };
  const monCsv = csvCount(mm, "MapName");
  const npcCsv = csvCount(mn, "MapName");

  let any = false;
  for (const name of mapNames()) {
    const txt = fs.readFileSync(path.join(MAP_DIR, name + ".map"), "utf8");
    const mon = (txt.match(/"name"\s*:\s*"monster-[^"]*"/g) || []).length;
    const npc = (txt.match(/"name"\s*:\s*"npc-[^"]*"/g) || []).length;
    if (mon && monCsv.get(name)) {
      fail("C5", `${name}: 맵에 몹 ${mon}마리가 박혀 있는데 CSV 에도 ${monCsv.get(name)}행 — 이중 스폰`);
      any = true;
    } else if (mon) {
      warn("C5", `${name}: 맵에 몹 ${mon}마리 박제 (CSV 행 없음) — 범용 템플릿으로 뜬다`);
      any = true;
    }
    if (npc && npcCsv.get(name)) {
      fail("C5", `${name}: 맵에 NPC ${npc}명이 박혀 있는데 CSV 에도 ${npcCsv.get(name)}행 — 이중 스폰`);
      any = true;
    } else if (npc) {
      warn("C5", `${name}: 맵에 NPC ${npc}명 박제 (CSV 행 없음)`);
      any = true;
    }
  }
  if (!any) ok("C5", "맵 박제 없음 — CSV 가 단일 진상");
}

// ─────────────────────────────────────────────────────────
// C6. 도감의 ModelId 에 대응하는 .model 이 있는가
// ─────────────────────────────────────────────────────────
console.log("\nC6. 도감 ModelId ↔ 실제 모델");
{
  const keys = new Set();
  const walk = (d) => {
    if (!fs.existsSync(d)) return;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith(".model")) {
        try {
          const j = JSON.parse(fs.readFileSync(p, "utf8"));
          keys.add(String(j.EntryKey || "").replace("model://", "").toLowerCase());
        } catch (_) {}
      }
    }
  };
  walk(path.join(ROOT, "RootDesk/MyDesk/Models"));
  walk(path.join(ROOT, "Global"));

  // 모델이 없어도 "실제로 스폰되는지"에 따라 심각도가 다르다.
  // 스폰표가 그 Id 를 참조하면 런타임에 SpawnByModelId 가 nil 을 반환한다 -> FAIL.
  // 아무도 참조하지 않으면 아직 안 붙은 데이터일 뿐이다 -> WARN.
  const referenced = (spawnTable, idCol) => {
    const s = readCsv(spawnTable);
    const set = new Set();
    if (!s) return set;
    const i = s.header.indexOf(idCol);
    if (i < 0) return set;
    for (const r of s.rows) {
      const v = (r[i] || "").trim();
      if (v) set.add(v);
    }
    return set;
  };

  // 스폰표에 행이 있어도 그걸 읽는 스포너가 없으면 아무 일도 안 일어난다.
  // 로더가 생기는 순간 이 검사는 저절로 FAIL 로 바뀌어 모델을 요구한다.
  const loaderExists = (globs) =>
    globs.some((g) => fs.existsSync(path.join(ROOT, g)));

  for (const [name, col, spawnTable, spawnIdCol, loaders] of [
    ["MonsterInfo", "ModelId", "MapMonsters", "MonsterId",
      ["RootDesk/MyDesk/Spawn/MonsterSpawner.mlua", "RootDesk/MyDesk/Catalog/MonsterCatalog.mlua"]],
    ["NpcInfo", "ModelId", "MapNpcs", "NpcId",
      ["RootDesk/MyDesk/Spawn/NpcSpawner.mlua", "RootDesk/MyDesk/Catalog/NpcCatalog.mlua"]],
  ]) {
    const t = readCsv(name);
    if (!t) continue;
    const i = t.header.indexOf(col);
    const iId = t.header.indexOf("Id");
    const iNm = t.header.indexOf("Name");
    const wired = loaderExists(loaders);
    const used = wired ? referenced(spawnTable, spawnIdCol) : new Set();
    if (!wired) {
      warn("C6", `${name}: ${spawnTable} 를 읽는 스포너/카탈로그가 아직 없다 — 이 표는 런타임에 안 돈다`);
    }

    const live = [];   // 스폰표가 가리키는데 모델이 없다 — 진짜 고장
    const dormant = []; // 도감에만 있고 아무도 안 쓴다
    for (const r of t.rows) {
      const v = (r[i] || "").trim().toLowerCase();
      if (!v || keys.has(v)) continue;
      (used.has((r[iId] || "").trim()) ? live : dormant).push(r);
    }

    for (const r of live.slice(0, 8))
      fail("C6", `${name}: ${r[iId]} ${r[iNm]} -> "${r[i]}" 모델이 없는데 ${spawnTable} 가 스폰한다 (SpawnByModelId 가 nil 을 반환한다)`);
    if (live.length > 8) fail("C6", `${name}: 그 외 ${live.length - 8}건 더`);

    if (dormant.length) {
      const sample = dormant.slice(0, 3).map((r) => `${r[iId]} ${r[iNm]}`).join(" / ");
      warn("C6", `${name}: 모델 없는 행 ${dormant.length}건 — 단 ${spawnTable} 가 참조하지 않아 런타임 영향 없음 (${sample}${dormant.length > 3 ? " …" : ""})`);
    }
    if (!live.length && !dormant.length) ok("C6", `${name} 전 행에 모델이 있다`);
    else if (!live.length) ok("C6", `${name} 스폰되는 행은 전부 모델이 있다`);
  }
}

// ─────────────────────────────────────────────────────────
console.log("");
console.log("─".repeat(60));
if (failed) {
  console.log(`[31m실패 ${failed}건[0m / 경고 ${warned}건 — 커밋 전에 고칠 것`);
  process.exit(1);
} else {
  console.log(`[32m전부 통과[0m (경고 ${warned}건)`);
  process.exit(0);
}
