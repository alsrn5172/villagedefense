'use strict';
// WO-055: CSV 보호 옵션·원본 스냅샷·구문·실제 Lua 계산 검증. Maker 실행 검증은 별도다.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const root = process.cwd();
const desk = path.join(root, 'RootDesk/MyDesk');
const here = __dirname;
const baseline = JSON.parse(fs.readFileSync(path.join(here, 'fixtures/wo055-baseline.json'), 'utf8'));
const hash = text => crypto.createHash('sha256').update(text).digest('hex');
function csv(text) {
  const rows = []; let row = [], cell = '', quoted = false;
  text = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') { if (quoted && text[i + 1] === '"') { cell += '"'; i++; } else quoted = !quoted; }
    else if (c === ',' && !quoted) { row.push(cell); cell = ''; }
    else if ((c === '\n' || c === '\r') && !quoted) {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); if (row.some(Boolean)) rows.push(row); row = []; cell = '';
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  assert(!quoted, 'CSV 인용부호가 닫히지 않음');
  const header = rows.shift();
  for (const row of rows) assert.equal(row.length, header.length, 'CSV 열 개수');
  return { header, rows: rows.map(r => Object.fromEntries(header.map((h,i) => [h,r[i]]))) };
}
const table = name => csv(fs.readFileSync(path.join(desk, name + '.csv'), 'utf8'));
const items = table('ItemInfo');
const bonus = table('EnhanceSlotBonus');
const skills = table('SkillInfo');
const four = ['BaseStr','BaseDex','BaseInt','BaseLuk'];
// 1.0.18 WO-057: 맨 뒤 StarTier 열 추가 · MaxEnhanceLevel 은 티어별 상한(1제·10제 0 · 15제 1 · 20제 2)으로 값이 바뀌어 보호 해시에서 뺀다.
assert.deepEqual(items.header, [...baseline.itemHeader, 'BaseAttackSpeed', 'StarTier']);
const protectedSkip = [...four, 'MaxEnhanceLevel'];
assert.equal(items.rows.length, baseline.items.length);
const primary = { WARRIOR:'BaseStr',MAGICIAN:'BaseInt',ARCHER:'BaseDex',THIEF:'BaseLuk',PIRATE:'BaseStr' };
const secondary = { WARRIOR:'BaseDex',MAGICIAN:'BaseLuk',ARCHER:'BaseStr',THIEF:'BaseDex',PIRATE:'BaseDex' };
const basic = {10:[3,1],15:[7,2],20:[14,5],25:[22,8]};
for (let i = 0; i < items.rows.length; i++) {
  const it = items.rows[i], before = baseline.items[i];
  assert.equal(it.ItemId, before.id, '아이템 순서');
  assert.equal(hash(JSON.stringify(baseline.itemHeader.filter(k => !protectedSkip.includes(k)).map(k => it[k]))), before.protectedHash, it.ItemId + ' 보호 옵션');
  const tier = Number(it.ReqLevel), count = (it.AvatarSlot === 'LONGCOAT' ? 2 : 1) * (it.WeaponType === 'SWORD_2H' ? 2 : 1);
  const eligible = it.ItemType === 'EQUIP' && it.EquipSlot !== 'SUBWEAPON' && basic[tier] && primary[it.ReqJob];
  for (let j = 0; j < four.length; j++) {
    const k = four[j]; let wanted = before.stats[j];
    if (eligible && Number(before.stats[j])) {
      if (k === primary[it.ReqJob]) wanted = String(tier === 25 && count === 2 ? 44 : basic[tier][0] * count);
      if (k === secondary[it.ReqJob]) wanted = String(tier === 25 && count === 2 ? 15 : basic[tier][1] * count);
    }
    assert.equal(it[k], wanted, it.ItemId + ' ' + k);
  }
  assert.equal(Number(it.BaseAttackSpeed), /^ABSOLAB_TOP_(WARRIOR|MAGICIAN|ARCHER|THIEF|PIRATE)$/.test(it.ItemId) ? 10 : 0, it.ItemId + ' 공속');
}
assert.deepEqual(bonus.header, baseline.bonusHeader);
for (const r of bonus.rows) {
  const tier = Number(r.ReqLevel), lv = Number(r.EnhanceLevel);
  const before = baseline.bonus.filter(b => b.slot === r.EquipSlot && b.level === lv && b.tier <= tier).sort((a,b)=>b.tier-a.tier)[0];
  assert(before, r.EquipSlot + ' 원본 강화 티어');
  assert.deepEqual(bonus.header.filter(k => !['ReqLevel','AddStr','AddDex','AddInt','AddLuk','#Note'].includes(k)).map(k=>r[k]), before.nonStat, r.EquipSlot + '/' + tier + '/' + lv + ' 비스탯 강화 옵션');
  if ([10,15,20,25,30].includes(tier)) for (const k of ['AddStr','AddDex','AddInt','AddLuk']) assert.equal(Number(r[k]), r.EquipSlot === 'SUBWEAPON' ? 0 : ({10:3,15:4,20:4,25:5,30:6})[tier], r.EquipSlot + '/' + tier + '/' + k);
}
for (const slot of new Set(baseline.bonus.map(r=>r.slot))) for (const tier of [15,25]) for (const lv of [1,2,3]) assert(bonus.rows.some(r=>r.EquipSlot===slot&&Number(r.ReqLevel)===tier&&Number(r.EnhanceLevel)===lv), '15/25 티어 누락');
assert.equal(hash(fs.readFileSync(path.join(desk,'ItemInfo.userdataset'),'utf8')),baseline.userdatasetHash,'기존 데이터셋 UUID/쌍 보존');
for (const [id, value] of [['SK_T11',10],['SK_T22',6]]) {
  const s = skills.rows.find(r=>r.SkillId===id); assert(s);
  assert.equal(Number(s.SecondaryEffect),value); assert.equal(Number(s.SecondaryPerLevel),value);
  assert.equal(s.Behavior,id==='SK_T11'?'PROJECTILE':'BUFF_SELF');
}
console.log('✅ CSV 보호 옵션·등급 이동·보석·데이터셋 쌍 검사 통과');
function transpile(src) {
  const name = src.match(/script\s+(\w+)\s+extends/)[1];
  const args = a => a.split(',').map(s=>s.trim().split(/\s+/).at(-1)).filter(Boolean).join(',');
  return name + ' = {}\n' + src.replace(/\r\n/g,'\n').replace(/^\s*@[^\n]*$/gm,'')
    .replace(/script\s+\w+\s+extends\s+\w+/, 'do\nlocal self = '+name+'\n')
    .replace(/^\s*property\s+(?:\w+(?:<[^>]+>)?)\s+(\w+)\s*=\s*/gm,name+'.$1 = ')
    .replace(/^\s*method\s+\w+\s+(\w+)\(([^)]*)\)/gm,(_,m,a)=>'function '+name+':'+m+'('+args(a)+')')
    .replace(/^\s*handler\s+(\w+)\(([^)]*)\)/gm,(_,m,a)=>'function '+name+':'+m+'('+args(a)+')');
}
function toLua(value) {
  if (value == null) return 'nil';
  if (typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '{'+value.map(toLua).join(',')+'}';
  return '{'+Object.entries(value).map(([k,v])=>'['+JSON.stringify(k)+']='+toLua(v)).join(',')+'}';
}
const moduleAt = process.argv.indexOf('--lua-module');
if (moduleAt < 0) { console.log('ℹ️ 실제 Lua 계산은 --lua-module <fengari 경로> 지정 시 검사'); process.exit(0); }
const { lua,lauxlib,lualib,to_luastring,to_jsstring } = require(path.resolve(process.argv[moduleAt+1]));
function execute(source) {
  const L = lauxlib.luaL_newstate(); lualib.luaL_openlibs(L);
  const status = lauxlib.luaL_dostring(L,to_luastring(source));
  if (status !== lua.LUA_OK) throw Error(to_jsstring(lua.lua_tostring(L,-1)));
  return to_jsstring(lua.lua_tostring(L,-1));
}
let prelude = 'log = function(...) end\nlog_warning=log\nisvalid=function(v)return v~=nil and v~=false end\n_UtilLogic={ServerElapsedSeconds=10,RandomDouble=function()return 0.5 end}\n';
const files = ['Stat/DamageFormula','Item/ItemCatalog','Stat/StatService','Job/JobPassiveLogic','Skill/SkillBuffs','Skill/PlayerSkillState','Skill/SkillDatabase','Onboarding/TipController','Guide/GuideService','Stat/StatUIController'];
for (const f of files) {
  const source=fs.readFileSync(path.join(desk,f+'.mlua'),'utf8');
  assert(!source.includes('\uFFFD'),f+' UTF-8');
  prelude += transpile(source)+'\n';
}
const data = Object.fromEntries(['ItemInfo','EnhanceSlotBonus','SkillInfo','GemInfo','EnhanceTable','JobInfo','JobTier'].map(name=>[name,table(name).rows]));
prelude += '\nlocal data = '+toLua(data)+ '\n' +
  '_DataService={GetTable=function(self,name)local rows=data[name] if rows==nil then return nil end return {GetRowCount=function()return #rows end,GetCell=function(self,i,col)return rows[i][col]or "" end}end}\n' +
  'function expect(a,b,m)if type(a)=="number" and type(b)=="number" then assert(math.abs(a-b)<0.00001,m..": "..tostring(a).." ~= "..tostring(b))else assert(a==b,m)end end\n' +
  '_ItemCatalog=ItemCatalog _SkillDatabase=SkillDatabase _StatService=StatService _JobPassiveLogic=JobPassiveLogic _PlayerSkillState=PlayerSkillState _SkillBuffs=SkillBuffs _DamageFormula=DamageFormula\n' +
  '_ItemCatalog:EnsureLoaded() _SkillDatabase:EnsureLoaded() _StatService.jobs={} _StatService:LoadJobs() _StatService.users={} _PlayerSkillState.users={}\n' +
  '_JobPassiveLogic.IsServer=function()return true end _StatService.ApplyToEntity=function()end _StatService.SendEvent=function()end _StatService.PushToClient=function()end _SkillBuffs.SyncBuffs=function()end\n' +
  'local timers={} _TimerService={SetTimerOnce=function(self,fn,delay)table.insert(timers,fn)return #timers end} _PlayerSkillState.SyncState=function()end function StatRecalculatedEvent()return {} end\n';
console.log('✅ '+execute(prelude+fs.readFileSync(path.join(here,'wo055-cases.lua'),'utf8')));
const actual = execute(prelude+fs.readFileSync(path.join(here,'wo055-nonstat.lua'),'utf8'));
assert.equal(hash(actual),baseline.nonStatEnhanceHash,'변경 전 816개 장비/강화 조합의 비스탯 효과 보존');
console.log('✅ 변경 전후 816개 장비/강화 조합의 비스탯 효과 일치');
