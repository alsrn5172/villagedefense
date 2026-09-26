# b/skill-ult-soulstone-cost

## 2026-09-24 — 궁극기 공통 규칙: 낙인의 영혼석 5개 · 쿨타임 2분 · 어디서나

PR #86. **출처: #40 5813232188 (A 결정 · 사용자 확정 2026-09-24).** 기획 답변 1번(★ 입장권 기준 개수 · 도전 1번마다 1번)을 **대체한다** — 같은 날 먼저 넣은 "★ 입장권 기준(일반 궁 3/15/100 · 대마법 5/30/200)" 구현은 이 커밋에서 걷어냈다.

**헤더 변경 없음 · 새 CSV 열 없음 · 새 이벤트 없음 · 새 RPC 없음.** A 파일 수정 없음 — `Item/InventoryService` · `UIToast` 는 **호출만** 한다. A 요청(#40 5813235746)대로 `Docs/스키마-계약.md` 스킬 등록서 8번에 호출 API 를 적고 변경 이력 1행을 넣었다.

### 규칙 (궁 5종 공통 · Behavior `ORIGIN`)

| 항목 | 값 |
|---|---|
| 비용 | 시전마다 **낙인의 영혼석(`BRAND_SOULSTONE`) 5개** — ★1/★3/★5 무관 · 대마법(SK_M31)도 5개 |
| 사용 제한 | **쿨타임 120초** 하나. 판당 횟수 제한 없음(`UseLimit` 1 → 0) |
| 장소 | 어디서나 — 발록 방 밖(마을 방어 중) · 매치 밖도 같은 규칙 |
| 부족 | 시전 거절 + 토스트 "낙인의 영혼석이 부족합니다 (필요 5개 · 보유 N개)" · 아무것도 소모하지 않는다 |
| 차감 시점 | 실행기(`_SkillExecutors:Execute`)가 돈 **뒤에만** `RemoveItem` + `PushInventory` |
| 툴팁 | 소모 줄에 "낙인의 영혼석 5개 소모" · "쿨타임 120초" |

### 수정 위치

| 위치 | 변경 |
|---|---|
| `Skill/SkillCaster.mlua:22-31` | 속성 `UltimateCostItemId = "BRAND_SOULSTONE"` · `UltimateCostItemName = "낙인의 영혼석"` · `UltimateStoneCount = 5` (`UltimateFullTicketSkills` 삭제) |
| `:408-418` 게이트 5-2 | PreCheck(5-1) 뒤 · MP(6) 앞에서 개수만 센다. 부족하면 `RejectToast` + `CastResult(false, "not enough BRAND_SOULSTONE (need 5, have N)")` |
| `:507-515` | 실행기 뒤 차감(변경 없음) |
| `:534` `UltimateStoneCost` | ★ 입장권 계산 삭제 → ORIGIN 이면 `UltimateStoneCount`. 로그 `[Skill] ultimate … cost BRAND_SOULSTONE x5 (flat)` (2026-09-26 부터 ★ 없음 — 아래 절) |
| `:544` `RejectToast` | 신규. `_UIToast:ShowMessage(message, userId)` + 로그 `[Skill] reject toast -> …` |
| `Skill/SkillWindowLogic.mlua:1353-1356` `FormatCost` | ORIGIN 이면 "낙인의 영혼석 5개 소모" (값은 `_SkillCaster` 속성) |
| `SkillInfo.csv` 궁 5행(SK_W31 · SK_M31 · SK_A31 · SK_T31 · SK_P31) | `Cooldown` 0 → **120** · `UseLimit` 1 → **0** · `#Note` 끝에 규칙 한 줄(옛 "UseLimit 1" 문구 제거). 헤더 변경 없음 |
| `Skill/SkillExecutors.mlua:849` | 주석만(메소 익스플로전 동전 0 거절 이유) |
| `Docs/스키마-계약.md` | 스킬 등록서 8번 + 변경 이력 1행 |

- 메소 익스플로전(SK_T31) 동전 0 개 거절은 5-1 `PreCheck` 에서 먼저 나므로 영혼석도 쿨타임도 안 쓴다.
- 5-2 에서 센 뒤 차감까지 대기(`wait`·타이머)가 없어 개수가 바뀌지 않는다.
- `SkillCaster.codeblock` 은 새 속성·메서드 때문에 Maker Refresh 재생성분이 생긴다(재입장 뒤 커밋).

### Play 검증 (2026-09-25 · Maker MCP · `Orbis_Lobby_VictoriaStation` · 이 브랜치 `74fb76d` · Reimport All → refresh → play)

**빌드 경고: 1 before → 1 after** (기존 `LWA-1111` `ParseStatCsv` · 에러 0 · Info 182 → 182).

입력은 실제 요청 경로: 클라에서 `_SkillCaster:RequestCast` · `_PlayerSkillState:RequestChooseJob` / `RequestLearn`. 레벨은 A 의 DEV 리모컨 `_DevStatRemote:RequestLevel`(정식 경험치 경로 `GrantKillReward`). 영혼석은 `_InventoryService:GiveItem`.
**★ 하네스:** 로비라 매치가 없어 서버 테스트 스크립트로 `_MatchSessionLogic.Running = true` · `Difficulty = d` 를 잠시 세웠다(코드 변경 아님). ⚠ 이 플래그가 로비에서 TEST 프로필 매치 시계를 실제로 돌렸다(웨이브 로그 #1~#11 · `[Match] EXPIRED at 225.0s` · 마을 0 이라 스폰 없음). 보상 · 순위 · DataStorage 기록 로그는 없었고 플레이어 상태도 초기화되지 않았다. 이후 ★3/★5 대마법은 시전 직전에 세우고 직후 `Running = false` 로 되돌렸다. 쿨타임 2분 재시전은 **실제로 기다려** 확인했고, ★5 케이스들만 `StartCooldown(uid, skill, 0)` 으로 쿨타임을 비웠다.

#### 궁극기 비용 (전사 불굴의 진 SK_W31 · 마법사 대마법 SK_M31 · 도적 메소 익스플로전 SK_T31)

| # | 경우 | 결과 | 증거 (로그) |
|---|---|:--:|---|
| 1 | 영혼석 0 · SK_W31 | PASS | `reject toast -> …: 낙인의 영혼석이 부족합니다 (필요 5개 · 보유 0개)` · `server result SK_W31 cast#9001 ok=false reason='not enough BRAND_SOULSTONE (need 5, have 0)'` · 클라 `toast text='낙인의 영혼석이 부족합니다 (필요 5개 · 보유 0개)' visible=true` · 뒤 `stones=0 cd=0 unyielding=false` |
| 2 | 영혼석 4 (5 미만) | PASS | `… (필요 5개 · 보유 4개)` · `ok=false reason='not enough BRAND_SOULSTONE (need 5, have 4)'` · 뒤 `stones=4 cd=0` |
| 3 | ★1 · 영혼석 7 · SK_W31 | PASS | `cost BRAND_SOULSTONE x5 (★1 · flat)` → `x5 consumed` · `cast SK_W31 ok=true … cd=120` · 뒤 `stones=2 cd=118 useCount=0`(판당 제한 없음) |
| 4 | 쿨타임 중 재시전 | PASS | `ok=false reason='on cooldown (97.6s left)'` · `stones=10` 그대로 |
| 5 | **2분 뒤 두 번째 시전** · ★3 · SK_W31 | PASS | 실제 대기 뒤 `cd=0 stones=10` → `cost … x5 (★3 · flat)` → `consumed` · `ok=true cd=120` · 뒤 `stones=5` |
| 6 | ★5 · 영혼석 정확히 5 · SK_W31 | PASS | `cost … x5 (★5 · flat)` → `consumed` · 뒤 `stones=0` |
| 7 | **대마법** SK_M31 · ★1 | PASS | `cost … x5 (★1 · flat)` · 12 → `stones=7` |
| 8 | 대마법 · ★3 | PASS | `cost … x5 (★3 · flat)` · 6 → `stones=1` |
| 9 | 대마법 · ★5 | PASS | `G5-SET ★5 stones=11` → `cost … x5 (★5 · flat)` → `consumed` · `ok=true cd=120` · 뒤 `stones=6` |
| 10 | 대마법 · 매치 밖(★0) | PASS | `cost … x5 (★0 · flat)` · 7 → 2 (★ 와 무관하게 5) |
| 11 | **발록 방 밖** | PASS | 위 전부 로비 맵 `Orbis_Lobby_VictoriaStation` 에서 시전됨 |
| 12 | 메소 익스플로전 · 메소 0 · 영혼석 11 | PASS | `server result SK_T31 cast#9201 ok=false reason='no meso nearby (r=6)'` · 뒤 `stones=11 mp=500000 cd=0` (아무것도 안 씀) |
| 13 | 툴팁 | PASS | `SK_M31 cost='MP 60 · 낙인의 영혼석 5개 소모 · 쿨타임 120초 · SP 1'` · `SK_W31 cost='낙인의 영혼석 5개 소모 · 쿨타임 120초 · SP 1'` · `SK_M11 cost='MP 8 · 쿨타임 1.5초 · SP 1'`(궁 아님 → 줄 없음) |

#### 해금 레벨 (정식 경로 · DEV 직업 전환 아님)

| 레벨 | 요청 | 결과 | 증거 |
|---|---|:--:|---|
| Lv9 | 전직 WARRIOR · SK_W11/SK_W12 배우기 | 거절 PASS | `choose job rejected: level 9 < 10` · `learn result SK_W11 ok=false reason='requires job line WARRIOR'` (W12 같음) |
| Lv10 | 같은 요청 + SK_W21 | 전직 · 1차 배움 PASS · 2차 거절 | `JOB NOVICE -> WARRIOR/1 (level 10)` · `learn SK_W11 -> Lv.1` · `learn SK_W12 -> Lv.1` · `SK_W21 ok=false reason='requires tier 2'` |
| Lv19 | SK_W21/SK_W22 | 거절 PASS | `ok=false reason='requires tier 2'` ×2 · `job=WARRIOR/1` |
| Lv20 | SK_W21/SK_W22 · SK_W31 | 2차 배움 PASS · 궁 거절 | `JOB WARRIOR -> WARRIOR/2 (level 20)` · `learn SK_W21 -> Lv.1` · `learn SK_W22 -> Lv.1` · `SK_W31 ok=false reason='requires tier 3'` |
| Lv29 | SK_W31 | 거절 PASS | `ok=false reason='requires tier 3'` · `job=WARRIOR/2` |
| Lv30 | SK_W31 | 배움 PASS | `JOB WARRIOR -> WARRIOR/3 (level 30)` · `learn SK_W31 -> Lv.1` |

차수 변화: 10 → 1차 · 20 → 2차 · 30 → 3차 (`[Skill] JOB` 로그 3줄).

**판정: PASS** (비용 13 · 해금 6 · 전부).

## 2026-09-25 — 계약서 변경 이력 행 위치만 옮김

- `Docs/스키마-계약.md` 변경 이력 표: 이 PR 의 2026-09-24 행을 표 맨 위(머리줄 바로 아래)에서 **2026-09-23 행 바로 아래**로 한 줄 내렸다. 내용은 그대로.
- 이유: #83 도 같은 자리(표 맨 위)에 행을 넣어 둘째 머지 때 충돌했다. 사이에 안 바뀐 줄이 생겨 #83 · #86 을 어느 순서로 합쳐도 충돌하지 않는다(3-way 병합 두 순서 확인). **#83 과 머지 순서 자유.**

## 2026-09-26 — A 리뷰 요청 반영: `_DifficultyService:Current()` 호출 삭제

- 출처: A 리뷰 코멘트 5831421482 — `UltimateStoneCost` 가 로그 한 줄 때문에 A API `_DifficultyService:Current()` 를 불렀다. 로직에 안 쓰이고 계약서 스킬 등록서 8번 목록에도 없다.
- `Skill/SkillCaster.mlua` `UltimateStoneCost`(`:534`): `local d` · `_DifficultyService:Current()` 두 줄 삭제. 로그는 그대로 남기고 ★ 만 뺐다 → `[Skill] ultimate <SkillId> cost BRAND_SOULSTONE x5 (flat)`.
- 동작 변화 없음: 반환값은 전과 같이 `UltimateStoneCount`(5). 위 Play 표의 `(★d · flat)` 로그는 이 수정 전 기록이다.
- LSP 진단: 에러 0 · 경고 0. Maker Play 재검증은 하지 않았다(로그 문자열 · 사용하지 않던 지역 변수만 바뀜).
