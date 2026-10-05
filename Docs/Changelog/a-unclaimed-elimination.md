# a/unclaimed-elimination — 1페이즈 시작까지 넥서스를 못 잡으면 탈락 (WO-044)

> 배경: 사용자 2026-10-05 "페이즈 시작 전에 넥서스 점령 못 하면 게임 오버". 확정 = 마감은 **`PHASE1` 시작**(전직 유예 30초가 끝나는 순간), 게임 오버는 넥서스 파괴 탈락과 같은 **관전 전환**.
> 지금까지는 탈락 경로가 넥서스 파괴(`LaneStateService.Eliminate(villageId)`) 하나뿐이라 마을이 없는 사람은 끝까지 남았다.

## 2026-10-05

### `Village/VillageOwnership.mlua`
- `EliminateUser(userId) → boolean` (ServerOnly): 마을 없는 유저에게 탈락 표시. 이미 탈락했거나 마을이 있으면 false(마을 주인은 기존 `Eliminate(villageId)` 경로). 탈락 표시가 붙으면 `Claim` 이 `"ELIMINATED"` 로 막으므로 나중에 점령할 수 없다.

### `Match/MatchSessionLogic.mlua`
- 새 속성 `UnclaimedDeadlinePhase = "PHASE1"`(""면 끔) · `UnclaimedWarnSeconds = "30,10"`.
- `ResetUnclaimed()`: 매치 시작 · 프로필 전환(시계 0)마다 마감 페이즈의 시작 초를 페이즈 표에서 찾는다(LIVE 270초 · TEST 34초). 표에 없으면 경고 로그 + 꺼짐.
- `SetPhase` 끝: 마감 페이즈 **이후로** 들어서면 한 번 `SweepUnclaimed()`. 리모컨으로 페이즈를 건너뛰어도 지나친 마감을 놓치지 않는다.
- `SweepUnclaimed()` → `EliminateUnclaimed(uid)`: 남아 있는(탈락 · 이탈 아님) 참가자 중 마을이 없는 사람마다 탈락 표시 → `PlayerEliminatedEvent`(Reason `UNCLAIMED`) → 토스트 "넥서스를 점령하지 못해 탈락했습니다. 관전 모드로 전환합니다" → `_SpectateService:Enter` → ★1 안내 끄기(`_GuideService:RemoveParticipant`) → `_PlayerDBManager:RequestFlush` → `OnPlayerEliminated`(마지막 모습 · 발록 방 · 전원 탈락 판정). 혼자 하는 판이면 그 자리에서 `Expire("전원 탈락")` → 결과 화면.
- `TickUnclaimedWarning()`(OnUpdate): 마감까지 남은 초가 30초 · 10초를 지나면 마을 없는 참가자에게 토스트 "N초 안에 넥서스를 점령하지 않으면 탈락합니다"(레벨이 `ClaimLevel` 미만이면 "(점령은 Lv10부터)" 덧붙임). 여러 값을 한 번에 지나면 한 번만.
- `OnUpdate`: `SetPhase` 안에서 전원 탈락으로 매치가 끝나면 그 프레임의 웨이브 · 시계 방송을 건너뛴다.
- 로그: `[Match] unclaimed warning Ns before PHASE1 -> n user(s)` · `[Match] unclaimed sweep at PHASE1 -> n user(s)` · `[Match] unclaimed elimination <userId> phase=PHASE1` · `[Village] eliminated user <userId> (no village)`.

### 테스트할 때
- TEST 프로필은 마감이 34초다. 웨이브 · 시설 검증(B3 레시피)처럼 마을을 스크립트로 잡는 경우 34초 안에 잡거나, 이번 판만 끄려면 서버에서 `_MatchSessionLogic.unclaimedSwept = true`, 다음 판부터 끄려면 `UnclaimedDeadlinePhase = ""`.

### 로그 확인 (Maker Play) — TODO
- [ ] TEST · 혼자 · 점령 안 함: 4초 `unclaimed warning 30s` · 24초 `unclaimed warning 10s` · 34초 `unclaimed sweep … 1 user(s)` → `unclaimed elimination` → `[Spectate] enter` → `전원 탈락/이탈 — 매치 종료` → 결과 화면.
- [ ] TEST · 34초 전에 점령: 알림 · 탈락 없음(`sweep … 0 user(s)`), 웨이브 정상.
- [ ] 리모컨 "다음 페이즈"로 PHASE0-1 → PHASE0-2 → PHASE1 건너뛰기: PHASE1 진입 때 한 번만 쓸어 낸다.
- [ ] 마감 순간 죽어 있던 사람: 관전으로 들어가고, 부활해도 다시 보이지 않는다.
