# b/respawn-choice-hp0

## 2026-09-26 — 부활 팝업 선택 부활이 HP 0 → 시간 부활처럼 HP 최대치 · 만렙 경험치 페널티 표시 0

PR #98. **출처: #40 comment 5831420626 (A 결정 · 사용자 강민구 2026-09-25)** — A 파일 `Match/PlayerRespawnService.mlua` 를 B 가 이 PR 에서 고치고 A 가 리뷰한다(협업-규칙 §3-3 경계면 PR · A 승인 필요). 증상 보고: #40 comment 5830769756 (B · 2026-09-25 Play).

**헤더 변경 없음 · 새 CSV · 열 · 이벤트 · 열거값 · 상태 필드 없음.** 기존 메서드 시그니처 · `@ExecSpace` 변경 없음.

### 증상 (2026-09-25 Play · 메모리만)

- 2P 이후 사망 → 부활 팝업에서 메소/경험치를 고르면 `Choose` → `ProcessRevive` 로 곧바로 살아나는데 `IsDead()=false` · 상태 IDLE · **HP 0/최대** 그대로(서버 · 클라 · HUD · 1s · 3s 뒤에도).
- 고르지 않고 기다린 시간 부활(엔진 · `RespawnDuration` 15s)은 HP 를 최대치로 채운다.
- 결과: 페널티를 내고 부활했는데 한 대에 다시 쓰러져 페널티를 또 낸다.
- 만렙(30) 팝업: 경험치 −1250 을 보였지만 실제 차감(`SummonManager.DeductExpInLevel`)은 0.

### 수정 (`Match/PlayerRespawnService.mlua`)

| 위치 | 변경 |
|---|---|
| `Choose` (`:170` 부근) | `ProcessRevive` 바로 뒤 `pc.Hp = pc.MaxHp`. 폴링 `OnRevive` 까지 기다리지 않는 이유: 폴링 간격(`PollInterval` 0.25s) 동안 HP 0 으로 살아 있어 그 사이 맞으면 또 쓰러진다. 로그 `[Death] user=… revive=choice hp=H/H mp=M/MM` |
| `ExpCutOf` (`:126`) | ~~레벨이 `_MonsterCatalog:GetMaxLevel()` 이상이면 0~~ → **2026-09-26 (2차) 실제 차감과 같은 식**(아래 절). `ExpProgress` 는 만렙에서 바를 가득 채워(within = need) 보여 주는 표시용이라 팝업만 −(need × 0.5)를 보였다 |
| `OnRevive` 마지막 로그 | 끝에 `revive=timed/choice hp=… mp=…` — 두 부활 경로의 HP · MP 를 같은 꼴로 비교 |
| 새 `MpText(userId)` (ServerOnly) | 로그용 `"mp/maxMp"` (`SummonManager` econ · 없으면 `?`) |

**MP 는 바꾸지 않는다 — "시간 부활과 같게"(A 요청)의 뜻대로.** 이 프로젝트의 MP 는 엔진에 없고 `Summon/SummonManager.mlua` econ 이 진상이다(`:439`). econ.mp 를 쓰는 곳은 `SpendMp` · `GrantMp` · 회복 틱 · 레벨업(`OnLevelUp` `:465`)뿐이고, 사망 · 시간 부활 어느 쪽도 MP 를 건드리지 않는다(코드 읽기 · 2026-09-26). 그래서 선택 부활도 MP 를 그대로 둔다. Play 에서 두 부활의 `mp=` 로그로 확인한다. 부활 때 MP 도 채우기로 정하면 `OnRevive` 한 곳에서 두 경로를 같이 바꾸면 된다(설계 변경 · 이 PR 범위 밖).

### 계약서 (`Docs/스키마-계약.md`)

- 스킬 등록서 8번에 이 A 파일 한 줄 — **표 칸이 아니라 표 아래 인용 줄**로 넣었다. 8번 표 칸(`:274`)은 #86 이 고치고, #86 머지 뒤 #83 · #85 가 한 줄씩 더 넣는 줄이라 같은 줄을 고치면 머지 충돌이 난다.
- 변경 이력 1행 — #83(표 맨 위) · #86(2026-09-23 행 아래) · #97(2026-09-22 행 아래)이 넣는 자리와 떨어진 곳(2026-09-17 (2차) 행 아래)에 넣었다. 머지 순서 자유.

### 검증

- LSP 진단(`mlua-diagnose`): 에러 0 · 경고 0.
- `node Docs/tools/check-integrity.cjs`: 통과.
- **Maker Play: 아직 안 했다** (사용자 복귀 뒤 · 로컬 테스트 브랜치 #83 + #98 + #84 한 번에). A 리뷰 부탁은 Play 통과 뒤 이 PR 에서.

#### Play 체크리스트 (예정)

| # | 경우 | 기대 |
|---|---|---|
| 1 | 2P 이후 사망 → 팝업 **메소** 선택 | `chose MESO` → `revive=choice hp=최대/최대` → `penalty=MESO:5000 … revive=choice hp=최대` · 클라 HUD HP 최대 · 1s · 3s 뒤에도 최대 |
| 2 | 같은 경우 **경험치** 선택 | 1번과 같게 HP 최대 · `penalty=EXP:N` |
| 3 | 고르지 않고 15s 시간 부활 | `revive=timed hp=최대/최대` (전과 같음) |
| 4 | MP 비교 | 사망 직전 MP 를 반쯤 쓴 상태에서 3번(시간) · 1번(선택) 각각 `mp=` 가 사망 직전 값(+회복 틱)과 같다 — 두 경로 차이 없음 |
| 5 | 선택 부활 직후 한 대 맞기 | 다시 쓰러지지 않는다(HP 최대에서 깎인다) · 추가 `[Death] … choice?` 없음 |
| 6 | 만렙(30) 사망 팝업 | 경험치 쪽 표시 **0** · `[Death] … choice? … expCut=0` · 고르면 `penalty=EXP:0` |
| 7 | 만렙 아래(예 Lv20) 사망 팝업 | 표시 = 지금과 같음(구간 안 경험치와 need × 0.5 중 작은 값) · 실제 차감과 같다 |
| 8 | 1P 이전(무료) 사망 | 기존대로 무료 토스트 · `revive=timed` · HP 최대 |

## 2026-09-26 (2차) — Play 결과 · 팝업 경험치 = 실제 차감과 같은 식 (만렙 "0" 전제가 틀렸다)

### Play (2026-09-26 · 로컬 테스트 브랜치 `local/test-face-hp0-cutscene` = main + #83 + 이 PR `5e25708` + #84 · Maker MCP · 정적 룸 로비 맵 · `_MatchSessionLogic:StartMatch({uid}, 1)`)

빌드: 에러 0 · 경고 1 → 1(기존 `LWA-1111`). 실행: 이 PR 과 무관한 하네스 에러 `[BalrogRoom] 방N 스포너 없음` ×6 / 매치(로비 정적 룸에 발록 맵이 없다) + 기존 경고 9.

| # | 경우 | 결과 |
|---|---|---|
| 1 | PHASE2 사망 → **메소** 선택 | **PASS** — `chose MESO` → `revive=choice hp=201450/201450 mp=100/100` → `-meso 5000 -> meso=15000` · `penalty=MESO:5000 … revive=choice hp=201450/201450` |
| 2 | Lv21 PHASE2 사망 → **경험치** 선택 | **PASS** — `revive=choice hp=201000/201000 mp=400/500` · 서버 +1s/+3s · 클라 모두 `hp=201000/201000` · `penalty=EXP:265` |
| 3 | 고르지 않고 15s 시간 부활 (무료 1P · 유료 PHASE2 · Lv30) | **PASS** — `revive=timed hp=200000/200000` · `hp=201450/201450 mp=440/680` · `hp=201450/201450 mp=89/100` |
| 4 | MP 비교 | **PASS(= 코드 읽기)** — 선택 부활 MP 그대로(400/500 → 400/500) · 시간 부활은 회복 틱만(340 → 440 / 74 → 89). 어느 부활도 MP 를 채우지 않는다 → A 에게 설계 질문 #40 5842209860 |
| 5 | 선택 부활 직후 한 대 | 실제 타격은 안 했다 — 부활 직후 HP 최대(1 · 3s 뒤에도)로 대신 확인 |
| 6 | 만렙(30) 사망 팝업 | **FAIL → 이번 수정.** 팝업 `expCut=0` 인데 실제 `penalty=EXP:1250`(`-exp 1250 … exp=27485 lv=30`) |
| 7 | Lv21 사망 팝업 | **PASS** — 팝업 265 = 실제 265 |
| 8 | 1P 이전(무료) 사망 | **PASS** — `free (deaths=1)` → 15s 뒤 `revive=timed hp=200000/200000` |

### 왜 6번이 틀렸나 — "만렙이면 경험치 획득 0 → 실제 차감 0" 이 코드와 다르다

- 만렙에서도 경험치는 계속 쌓인다: `Farm/FarmReward.GiveRewards`(`:157`) → `Summon/SummonManager.GrantKillReward`(`:386` · `e.exp = e.exp + exp`)에 만렙 상한이 없다.
- 실제 차감 `SummonManager.DeductExpInLevel`(`:354`)은 레벨 시작 경험치부터 쌓인 구간 안 경험치(`within`)와 `need × 0.5` 중 작은 값을 깎는다 → 만렙에서 쌓인 게 있으면 0 이 아니다.
- 2026-09-25 에 "실제 0" 이었던 것은 그 캐릭터가 **레벨 시작 경험치에 딱 맞춰** 만렙이었기 때문(DEV 리모컨이 다음 레벨까지 남은 값만 넣는다)이다.

### 수정 — `ExpCutOf` 가 `DeductExpInLevel` 과 같은 식

- 레벨 시작 경험치 = Σ `_MonsterCatalog:GetNeedExp(1..level-1)` · 구간 필요치 = `GetNeedExp(level)`(0 이면 한 레벨 아래 값) · `within = max(0, exp − 레벨 시작)` · 팝업 = `max(0, min(within, floor(구간 × ExpPenaltyRatio)))`. 도감이 없으면 `SummonManager.ExpPerLevel` 폴백(같은 식). **`SummonManager` 는 고치지 않았다**(호출 · 읽기만).
- Play 로 식 검증(같은 세션 · 메모리만): Lv30 · exp 50000 · 레벨 시작 24595 · within 25405 → **옛 팝업 0 · 새 식 1250 · 실제 `DeductExpInLevel` 1250** (`match new=true`). 레벨 시작 그대로(exp 24595) → **새 식 0 · 실제 0**.
- 만렙이면 실제 차감을 0 으로 하는 것은 **A 의 `SummonManager` 설계 변경**이라 이 PR 범위 밖(A 결정 사항 · PR · #40 에 설명).
- LSP 에러 0. 새 코드 자체의 Maker Play 는 아직(다음 Play 에서 만렙 팝업 표시 = 실제 차감 확인).

## 2026-09-26 (3차) — Play: 새 팝업 코드(`7001307`) 만렙 표시 = 실제 차감 · PASS

### Play (2026-09-26 · 로컬 테스트 브랜치 `c4d35ce` = origin/main + #83 `7078f3e` + 이 PR `7001307` + #84 `47f53c8` + #84 DEV 토글 · Reimport All · Maker MCP · 정적 룸 로비 맵)

- 빌드: 오류 0 · 경고 1 → 1(기존 `LWA-1111`). 실행: 하네스 에러 `[BalrogRoom] 방N 스포너 없음` ×6(로비에서 매치 시작) + 기존 경고 9 — 이 PR 과 무관.
- 준비(메모리만): `_MatchSessionLogic:StartMatch({uid}, 1)` → PHASE3(유료 구간) · `GrantKillReward` 로 Lv30 **레벨 시작 경험치에 딱 맞춤**(exp 24595 = Σ `GetNeedExp(1..29)` · 구간 필요치 `GetNeedExp(30)` = 2500 → 최대 차감 1250) · 메소 105(메소 선택 불가 → 경험치만). 사망 = 서버 `PlayerComponent:ProcessDead(uid)` · 선택 = 클라 `_PlayerRespawnUIController:OnClick("EXP")`(버튼 `ButtonClickEvent` 가 부르는 본체와 같은 메서드). 팝업 표시는 클라에서 `btnExp` 글자를 읽고 스크린샷으로도 봤다.

| # | 경우 | 팝업(클라 버튼 글자) | 실제 차감 | 판정 |
|---|---|---|---|---|
| 6a | Lv30 · **레벨 시작 그대로**(exp 24595 · 구간 안 0) | `경험치 -0 (레벨 유지)` · `[ReviveUI] show … expCut=0` · 서버 `ExpCutOf=0` | `penalty=EXP:0` · exp 24595 그대로 | **PASS** |
| 6b | Lv30 · **레벨 시작 + 1800**(exp 26395 · 구간 안 1800) | `경험치 -1250 (레벨 유지)` · `expCut=1250` · 서버 `ExpCutOf=1250` | `-exp 1250 (death penalty) -> exp=25145 lv=30` · `penalty=EXP:1250` | **PASS** — 팝업 = 실제 |

- 두 번 다 `revive=choice hp=201450/201450 mp=500000/500000` (HP 최대 · MP 그대로 · 레벨 유지 30).
- 남은 것: **A 의 MP 답**(#40 5842209860 — 두 부활 모두 MP 도 채울지) → 그 전까지 Draft. 만렙 실제 차감을 0 으로 할지는 A 의 `SummonManager` 설계 몫(이 PR 은 팝업을 실제와 맞췄다).

## 4차 — MP 도 채움 (2026-09-26 · A 답 #40 5844239483)

- A 결정(사용자 강민구): **두 부활(시간 · 선택) 모두 MP 도 최대치**, 만렙 경험치 차감은 그대로.
- `Match/PlayerRespawnService.mlua` `OnRevive` — 두 부활이 모두 지나가는 곳 — 에서 `_SummonManager:GrantMp(userId, floor(maxMp - mp))` (0 이하면 안 부름 · `GrantMp` 가 maxMp clamp · HUD Push · `[Summon] +mp …` 로그). `Choose` 주석만 고침(HP 는 그대로 즉시 채움 · MP 는 `OnRevive` 에서 — 선택 부활은 최대 `PollInterval` 0.25s 뒤).
- 계약서 8번 추가 줄 · 변경 이력 행 문구 갱신(`GrantMp` 호출만 · `SummonManager` 수정 없음).
- LSP 깨끗 · `check-integrity` 는 아래. **Play 확인 전 → Draft 유지.**
- Play 체크(다음 라운드): 죽기 전 MP 를 줄여 두고(`[Summon] -mp`) ① 시간 부활 ② 선택 부활(메소 · 경험치) 각각 `[Summon] +mp N -> mp=max` + `revive=… hp=max mp=max/max`.
