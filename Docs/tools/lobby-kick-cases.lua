-- 실제 MatchLobbyGateway 메서드의 오프라인 서버 상태 회귀 검사.
local checks = 0
local function eq(actual, expected, why)
  checks = checks + 1
  assert(actual == expected, why .. ': ' .. tostring(actual) .. ' ~= ' .. tostring(expected))
end
local function yes(value, why) eq(not not value, true, why) end
local function no(value, why) eq(not not value, false, why) end
local entities, moves, toasts, browse, hooks = {}, {}, {}, {}, {}
local clock = '20261016213000123'
local guid = 0
local enabled, unlocked = true, true
local g = MatchLobbyGateway
Vector2 = Vector2 or function(x,y) return {x=x,y=y} end
UserLeaveEvent = {}
_DataService = { GetTable=function() return nil end }
_RoomService = { IsInstanceRoom=function() return false end }
_WorldInstanceService = { WorldInstanceId='instance-A' }
DateTime = { UtcNow={ToFormattedString=function(self, format)
  assert(format=='yyyyMMddHHmmssfff', 'UTC 형식') return clock
end} }
_UtilLogic = { NewGuid=function() guid=guid+1 return 'fallback-'..guid end }
_UserService = {
  GetUserEntityByUserId=function(self,id) return entities[id] end,
  ConnectEvent=function() return 1 end, DisconnectEvent=function() end
}
_AccountData = {GetBalrogHeart=function() return 100 end, GetLevel=function()return 100 end}
_BalrogHeartService = {CostOf=function()return 1 end}
_DifficultyService = {IsEnabled=function()return enabled end,IsUnlocked=function()return unlocked end,UnlockLevelFor=function()return 1 end,Describe=function()return '난이도' end}
_UIToast = {ShowMessage=function(self,text,id)
  toasts[id]=text
  if hooks.toast then hooks.toast(id,text) end
end}
_LobbyUIController = {
  ShowLobby=function()end, SetRoomCsv=function()end,
  SetBrowseCsv=function(self,csv,id)browse[id]=csv end
}
_TimerService = {ClearTimer=function()end}
local function connect(id)
  entities[id]={Name=id,PlayerComponent={Nickname=id,MoveToMapPosition=function(self,map,pos)
    table.insert(moves,{id=id,map=map})
    if hooks.move then hooks.move(id,map) end
  end}}
end
local function call(id,method,...)
  local old=senderUserId senderUserId=id
  g[method](g,...)
  senderUserId=old
end
local function reset()
  entities,moves,toasts,browse,hooks={},{},{},{},{}
  enabled,unlocked=true,true
  _MatchSessionLogic=nil
  _WorldInstanceService={WorldInstanceId='instance-A'}
  clock='20261016213000123'
  g:OnBeginPlay()
end
local function make(host)
  connect(host)
  call(host,'RequestCreateMatch',1)
  local m=g:MatchOfUser(host)
  assert(m~=nil,'방 생성')
  return m
end
local function join(id,m)
  connect(id) call(id,'RequestJoinMatch',m.id)
end
local function visible(id)
  local out={}
  for key,value in string.gmatch(g:BuildBrowseCsv(id),'([^;=]+)=([^;]*)') do
    if string.match(key,'^m%d+$') then table.insert(out,string.match(value,'^([^|]+)')) end
  end
  return out
end
-- 서버 RPC에서 기록, 통보·이동 중의 재입장, 오래된 참가 요청까지 모두 거절.
reset()
local m=make('host') join('guest',m) join('other',m)
eq(#m.members,3,'정상 입장')
local token=m.tokens.guest
local before=#moves
hooks.toast=function(id,text)
  if id=='guest' and string.find(text,'내보내졌습니다',1,true) then
    yes(g:WasKicked(m,'guest'),'통보 전에 강퇴 기록')
    call('guest','RequestJoinMatch',m.id)
  end
end
hooks.move=function(id,map)
  if id=='guest' and map==g.StationMapId then yes(g:WasKicked(m,'guest'),'이동 전에 강퇴 기록') end
end
call('host','RequestKickMember',token)
hooks={}
eq(#m.members,2,'강퇴 후 정원') eq(g:MatchOfUser('guest'),nil,'강퇴 후 원장 제거')
eq(m.tokens.guest,nil,'옛 토큰 제거') yes(g:WasKicked(m,'guest'),'방별 기록 유지')
eq(#moves,before+1,'강퇴 이동만 발생')
local kickedMoves=#moves
for i=1,5 do call('guest','RequestJoinMatch',m.id) end
eq(#moves,kickedMoves,'반복 RPC로 배 이동 없음') eq(g:IndexIn(m,'guest'),0,'재입장 없음')
yes(string.find(toasts.guest,'강퇴된 방',1,true),'거절 안내')
eq(#visible('guest'),0,'본인 목록에서 숨김') eq(#visible('other'),1,'다른 유저 목록 유지')
g:AddMember(m,'guest') eq(g:IndexIn(m,'guest'),0,'서버 합류 헬퍼도 차단')
call('host','RequestKickMember',token) eq(#m.members,2,'옛 강퇴 토큰 재사용 무시')
-- 출발 실패로 방이 다시 열려도 같은 방의 강퇴 기록은 유지한다.
m.starting=true m.locked=true
g:AbortStart(m,'','','시험 중단',false)
yes(g:WasKicked(m,'guest'),'출발 실패 후 강퇴 기록 유지')
call('guest','RequestJoinMatch',m.id) eq(g:IndexIn(m,'guest'),0,'출발 실패 후 재입장 거절')
-- 닉네임/엔티티 교체 및 재접속으로도 같은 userId의 기록을 지울 수 없다.
entities.guest=nil g:OnUserLeave({UserId='guest'})
connect('guest') entities.guest.PlayerComponent.Nickname='다른 이름'
call('guest','RequestOpenLobby') eq(#visible('guest'),0,'재접속 뒤 목록 숨김')
call('guest','RequestJoinMatch',m.id) eq(g:IndexIn(m,'guest'),0,'재접속 뒤 직접 참가 거절')
-- 강퇴된 방만 제한. 다른 방·새로 만든 방·본인 방 생성은 가능.
local otherRoom=make('host2') join('guest',otherRoom)
eq(g:MatchOfUser('guest'),otherRoom,'다른 방 입장 허용')
call('guest','RequestLeaveMatch') no(g:WasKicked(otherRoom,'guest'),'자진 이탈은 강퇴가 아님')
join('guest',otherRoom) eq(g:MatchOfUser('guest'),otherRoom,'자진 이탈 후 재입장')
call('guest','RequestLeaveMatch')
call('host','RequestLeaveMatch') eq(g:GetMatch(m.id),nil,'원래 방 해산')
local replacement=make('host')
no(replacement.id==m.id,'같은 시각 재생성도 새 ID')
no(g:WasKicked(replacement,'guest'),'새 방에 강퇴 기록 없음')
join('guest',replacement) eq(g:MatchOfUser('guest'),replacement,'새 방 재입장 허용')
call('guest','RequestLeaveMatch') call('guest','RequestCreateMatch',1)
eq(g:MatchOfUser('guest').host,'guest','강퇴됐던 사용자의 방 생성 허용')
-- 일반 접속 종료는 재입장 금지를 만들지 않는다.
reset() m=make('host') join('guest',m)
entities.guest=nil g:OnUserLeave({UserId='guest'})
no(g:WasKicked(m,'guest'),'접속 종료는 강퇴 아님')
join('guest',m) eq(g:MatchOfUser('guest'),m,'일반 재접속 참가 허용')
-- 권한·자기 자신·잘못된 토큰·잠금·출발 처리 중에는 강퇴/기록 모두 금지.
reset() m=make('host') join('guest',m) join('other',m)
call('guest','RequestKickMember',m.tokens.other) eq(g:IndexIn(m,'other'),3,'비주인 강퇴 거절')
no(g:WasKicked(m,'other'),'비주인 요청 기록 없음')
call('host','RequestKickMember',m.tokens.host) eq(g:IndexIn(m,'host'),1,'자기 강퇴 거절')
call('host','RequestKickMember','invalid') eq(#m.members,3,'없는 토큰 거절')
for _,flag in ipairs({'locked','starting','charged'}) do
  m[flag]=true call('host','RequestKickMember',m.tokens.guest)
  eq(g:IndexIn(m,'guest'),2,flag..' 중 강퇴 거절') no(g:WasKicked(m,'guest'),flag..' 기록 없음')
  m[flag]=false
end
call('host','RequestKickMember',m.tokens.guest) yes(g:WasKicked(m,'guest'),'잠금 전 정상 강퇴')
-- 기존 입장 제한(정원/잠금/차감/해금/진행 중)도 유지.
reset() m=make('host')
for i=1,4 do join('member'..i,m) end
join('extra',m) eq(g:MatchOfUser('extra'),nil,'정원 제한 유지')
call('member4','RequestLeaveMatch')
for _,flag in ipairs({'locked','charged'}) do
  m[flag]=true call('extra','RequestJoinMatch',m.id)
  eq(g:MatchOfUser('extra'),nil,flag..' 참가 거절') m[flag]=false
end
enabled=false call('extra','RequestJoinMatch',m.id) eq(g:MatchOfUser('extra'),nil,'닫힌 난이도 거절') enabled=true
unlocked=false call('extra','RequestJoinMatch',m.id) eq(g:MatchOfUser('extra'),nil,'미해금 난이도 거절') unlocked=true
_MatchSessionLogic={Running=true,IsParticipant=function(self,id)return id=='extra' end}
call('extra','RequestJoinMatch',m.id) eq(g:MatchOfUser('extra'),nil,'진행 중 참가자 거절') _MatchSessionLogic=nil
join('extra',m) eq(g:MatchOfUser('extra'),m,'모든 조건 충족 후 입장')
call('extra','RequestJoinMatch',m.id) eq(#m.members,5,'중복 참가 무시')
call('extra','RequestJoinMatch','deleted-room') eq(#m.members,5,'참가 중 타 방 RPC 무시')
connect('outsider') call('outsider','RequestJoinMatch','deleted-room') eq(g:MatchOfUser('outsider'),nil,'오래된 방 ID 거절')
-- 긴 ID에서도 순번 정렬과 사용자별 숨김/더보기 수가 정확하다.
reset()
local rooms={}
for i=1,9 do rooms[i]=make('host'..i) end
for _,i in ipairs({1,3,8}) do rooms[i].kicked.viewer=true end
local list=visible('viewer') eq(#list,6,'차단 방을 제외한 6개 표시')
for i,index in ipairs({2,4,5,6,7,9}) do eq(list[i],rooms[index].id,'생성 순서 정렬 '..i) end
yes(string.find(g:BuildBrowseCsv('viewer'),'more=0',1,true),'차단 방은 더보기에서 제외')
yes(string.find(g:BuildBrowseCsv('normal'),'more=3',1,true),'정상 유저 더보기 유지')
for _,flag in ipairs({'locked','charged'})do rooms[2][flag]=true end
eq(#visible('viewer'),5,'출발 준비 방 숨김도 유지')
-- 시각이 같아도 순번으로 구분, 다른 인스턴스/시각도 분리. 구분자 안전.
reset()
local seen={}
for i=1,50 do
  local id=g:NewMatchId()
  no(seen[id],'동일 밀리초 ID 중복 없음 '..i) seen[id]=true
  no(string.find(id,'[;=|]'),'전송 구분자 없음 '..i)
  yes(string.find(id,'instance-A_20261016213000123_',1,true),'인스턴스·UTC 시각 포함 '..i)
end
local first
reset() first=g:NewMatchId()
reset() _WorldInstanceService.WorldInstanceId='instance-B'
no(g:NewMatchId()==first,'다른 인스턴스 ID 구분')
reset() clock='20261016213000124'
no(g:NewMatchId()==first,'다른 생성 시각 구분')
reset() _WorldInstanceService=nil
local fallback=g:NewMatchId() yes(string.find(fallback,'fallback-',1,true),'인스턴스 ID 부재 시 GUID 대체')
reset() _WorldInstanceService.WorldInstanceId='instance;=|A'
no(string.find(g:NewMatchId(),'[;=|]'),'서버 식별자 구분자 정규화')
reset() m=make('host')
local key1=g:RoomKeyFor(m.id) local key2=g:RoomKeyFor(m.id)
no(key1==key2,'출발 재시도 룸 키 세대 구분') yes(string.find(key1,m.id,1,true),'실제 룸 키에 고유 방 ID 포함')
return '강퇴/재입장·권한·방 ID·목록 회귀 검증 '..checks..'건 통과'
