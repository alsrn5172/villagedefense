
local cases = 0
local function check(a, b, m) expect(a, b, m) cases = cases + 1 end
local primary = { WARRIOR="str",MAGICIAN="int",ARCHER="dex",THIEF="luk",PIRATE="str" }
local secondary = { WARRIOR="dex",MAGICIAN="luk",ARCHER="str",THIEF="dex",PIRATE="dex" }
local curves = { [10]={{3,4,5,6},{1,1,2,2}},[15]={{7,9,11,13},{2,3,3,4}},[20]={{14,19,23,28},{5,6,8,9}},[25]={{22,30,37,44},{8,10,13,15}},[30]={{30,40,50,60},{10,13,17,20}} }
for id, def in pairs(_ItemCatalog.items) do
  local tier = def.enhanceTier
  local p = primary[def.reqJob]
  if def.type == "EQUIP" and curves[tier] ~= nil and p ~= nil and def.slot ~= "SUBWEAPON" then
    local s = secondary[def.reqJob]
    local pieces = _ItemCatalog:PieceCount(def) * (def.weaponType == "SWORD_2H" and 2 or 1)
    local curve = curves[tier]
    for lv=0,3 do
      local expectedP = curve[1][lv+1] * pieces
      local expectedS = curve[2][lv+1] * pieces
      if tier == 25 and pieces == 2 then expectedP=({44,59,73,88})[lv+1] expectedS=({15,19,25,29})[lv+1] end
      local out = _ItemCatalog:ComputeEnhance(def, lv, nil)
      if def.reqLevel ~= 0 then
        check(def.stats[p] + (out.fixed[p] or 0), expectedP, id .. " +"..lv.." 주스탯")
        check(def.stats[s] + (out.fixed[s] or 0), expectedS, id .. " +"..lv.." 부스탯")
      end
    end
    if def.reqLevel > 0 then
      local wanted = ({[10]=6,[15]=8,[20]=8,[25]=10,[30]=12})[tier]
      for lv=1,3 do
        for _, gid in ipairs({"STR_CRYSTAL","DEX_CRYSTAL","INT_CRYSTAL","LUK_CRYSTAL"}) do
          check(_ItemCatalog:GemAmount(def,lv,gid),wanted,id.." 보석 "..gid.." +"..lv)
        end
      end
    end
  end
end
-- 특수 장비: 30제/앱솔랩스는 원래 고정 강화량, 방패는 직업 고정/스탯 보석 없음.
for id, def in pairs(_ItemCatalog.items) do
  if def.slot == "SUBWEAPON" then
    local out = _ItemCatalog:ComputeEnhance(def,3,{"STR_CRYSTAL","DEX_CRYSTAL","LUK_CRYSTAL","INT_CRYSTAL","STR_CRYSTAL","DEX_CRYSTAL"})
    for _, k in ipairs({"str","dex","int","luk"}) do check((out.fixed[k] or 0)+(out.gem[k] or 0),0,id.." 방패 "..k) end
  end
  if string.find(id,"ABSOLAB_TOP_",1,true) == 1 then
    for lv=0,3 do check(def.stats.attackspeed,10,id.." 공속 +"..lv) end
  end
end
-- 도적 세트 합계(실제 소비 주스탯12·부스탯6).
for _, tc in ipairs({{25,82,55,466,204},{30,97,65,601,257},{30,158,4,662,196}}) do
  local tier, luk, dex = tc[1],tc[2],tc[3]
  for _, id in ipairs({"WEAPON_THIEF_CLAW_T","TOP_THIEF_T","HAT_THIEF_T","GLOVES_THIEF_T","SHOES_THIEF_T"}) do
    local def = _ItemCatalog:Get(id..tier)
    assert(def~=nil,id..tier)
    local out = _ItemCatalog:ComputeEnhance(def,3,nil)
    luk=luk+def.stats.luk+(out.fixed.luk or 0)
    dex=dex+def.stats.dex+(out.fixed.dex or 0)
  end
  luk=luk+12*({[25]=10,[30]=12})[tier]
  dex=dex+6*({[25]=10,[30]=12})[tier]
  check(luk,tc[4],"도적 Lv"..tier.." LUK") check(dex,tc[5],"도적 Lv"..tier.." DEX")
end
local function setUser(luk,job,learn)
  _StatService.users.test={level=30,job=job,base={str=4,dex=4,int=4,luk=luk,attack=50,magic=30,accuracy=20,speed=100,jump=100},equip={},enhance={},buff={},dev={},mastery=0.5}
  _PlayerSkillState.users.test={jobId=job,tier=2,skillLevels={SK_T11=learn},cooldownEndsAt={},spentByTier={}}
  _SkillBuffs.buffs.test={}
  _StatService:Recalculate("test","CHECK")
  return _StatService.users.test
end
for _, luk in ipairs({100,150,300,399,400,401,500}) do
  for learn=0,5 do
    local u=setUser(luk,"THIEF",learn)
    local raw=0.05+luk*0.003+learn*0.10
    local dmg=2+math.max(luk-400,0)*0.003
    check(u.final.critraw,raw,"LUK"..luk.." Lv"..learn.." 原확률")
    check(u.final.critrate,math.min(1,raw),"실제 확률 상한")
    check(_StatService:GetCritDamageRate("test"),dmg,"확률 초과 전환 없음")
    for lv=1,5 do
      _SkillBuffs:ApplyBuff("test","SK_T22","SHADOW_PARTNER",lv,60)
      check(_StatService:GetCritDamageRate("test"),dmg+lv*0.06,"쉐도우 Lv"..lv)
      check(u.final.critdamage,dmg+lv*0.06,"원장·전투력 입력 일치")
    end
    _SkillBuffs:EndBuffNow("test","SHADOW_PARTNER","check")
    check(_StatService:GetCritDamageRate("test"),dmg,"버프 종료")
  end
end
local u=setUser(500,"ARCHER",0)
_SkillBuffs:ApplyBuff("test","SK_A22","GUARANTEED_CRIT",1,10)
check(u.final.critrate,1,"닷지 확정 치명타 규칙")
check(_StatService:GetCritDamageRate("test"),2,"닷지 200% 고정")
_SkillBuffs:EndBuffNow("test","GUARANTEED_CRIT","check")
u=setUser(500,"WARRIOR",0)
check(_StatService:GetCritDamageRate("test"),2.03,"비주력 10%는 LUK400 차감 뒤 적용")
_PlayerSkillState.users.test.skillLevels.SK_T11=5
_StatService:Recalculate("test","STALE_SKILLS")
check(u.final.critskill,0,"다른 직업 잔존 학습 차단")
u=setUser(500,"THIEF",0)
local cp=u.combatPower
_PlayerSkillState.users.test.skillLevels.SK_T11=5
_PlayerSkillState:PushState("test")
check(u.final.critskill,0.5,"학습 PushState 재계산")
_SkillBuffs:ApplyBuff("test","SK_T22","SHADOW_PARTNER",5,60)
check(_StatService:GetCritDamageRate("test"),2.6,"LUK500 + 쉐도우5")
_SkillBuffs:ApplyBuff("test","SK_T22","SHADOW_PARTNER",1,60)
check(_StatService:GetCritDamageRate("test"),2.36,"재시전은 누적 아닌 교체")
-- 이전 타이머가 새 버프를 지우지 않는다.
_SkillBuffs:ExpireBuff("test","SHADOW_PARTNER",_SkillBuffs.buffStamp-1)
check(_StatService:GetCritDamageRate("test"),2.36,"옛 타이머 무시")
_SkillBuffs:ResetMatchState("test")
check(_StatService:GetCritDamageRate("test"),2.3,"매치 버프 초기화")
_SkillBuffs:ApplyBuff("test","SK_T22","SHADOW_PARTNER",5,60)
_UtilLogic.ServerElapsedSeconds=100
check(_StatService:GetCritDamageRate("test"),2.3,"활성 레벨 스냅샷 만료")
_UtilLogic.ServerElapsedSeconds=10
u.equip.attackspeed=10
_StatService:Recalculate("test","EQUIP")
check(_SkillBuffs:GetAttackSpeedMul("test"),1.1,"옷 공속 서버")
check(_SkillBuffs:LocalAttackSpeedMul(),1.1,"옷 공속 클라 미러")
check(_SkillBuffs:GetAttackSpeedMul("test")*_SkillBuffs.AvengerAttackSpeedMul,0.66,"어벤저 최신값 조합")
u.equip.attackspeed=0
_StatService:Recalculate("test","UNEQUIP")
check(_SkillBuffs:GetAttackSpeedMul("test"),1,"공속 해제")
check(_SkillBuffs:LocalAttackSpeedMul(),1,"공속 미러 해제")
local help=_StatService:BuildStatHelpCsv("test")
local count=0 for k,v in string.gmatch(help,"([^;=]+)=([^;]*)") do count=count+1 end
check(count,15,"스탯 설명 15개")
check(string.find(help,"400",1,true)~=nil,true,"LUK 문턱 설명")
-- gearlevel 서버 분기와 표시 직전 조건은 다른 알림을 가로막지 않는다.
local level=15
local notifications={}
_MatchSessionLogic={Running=true,IsParticipant=function()return true end,IsTutorial=function()return false end}
_SummonManager={GetEcon=function()return {level=level,coin=0} end}
_EquipService={slots={"WEAPON"},EnsureUser=function()return {} end,EquippedItemId=function()return "WEAPON_WOODEN" end}
_GuideService=GuideService
_GuideService.st={test={tips={}}}
_GuideService.itemIds={mats={}}
_GuideService.MaxCountOf=function()return 40 end
_TipController={NotifyTip=function(self,k)notifications[k]=(notifications[k]or 0)+1 end}
_GuideService:EvaluateTips("test")
check(_GuideService.st.test.tips.gearlevel,nil,"Lv15은 gearlevel 발송 기록 안 씀")
check(notifications.recruit40,1,"Lv15 다른 알림 유지")
-- 실제 존재하는 초보자 무기 이름을 선택한다.
local novice
for id,d in pairs(_ItemCatalog.items)do if d.slot=="WEAPON" and d.reqLevel==1 and d.reqJob=="" then novice=id break end end
assert(novice,"초보자 무기 필요")
_EquipService.EquippedItemId=function()return novice end
level=16
_GuideService:EvaluateTips("test")
check(notifications.gearlevel,1,"Lv16 gearlevel 허용")
_StatusHUDController={statsReady=true,curLevel=15}
_InventoryUIController={equipped={WEAPON={itemId=novice}}}
check(TipController:StillTrue("gearlevel"),false,"표시 전 Lv15 차단")
_StatusHUDController.curLevel=16
check(TipController:StillTrue("gearlevel"),true,"표시 전 Lv16 허용")
_InventoryUIController.equipped.WEAPON={itemId="WEAPON_THIEF_CLAW_T10"}
check(TipController:StillTrue("gearlevel"),false,"대기 중 장비 교체 재검사")
return "실제 Lua 수치/상태 검증 " .. tostring(cases) .. "건 통과"
