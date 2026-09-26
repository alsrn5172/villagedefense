# b/skill-debug-jobswitch

## 2026-09-24 — DEV 직업 전환 F10 (DevTestMode 전용 · JobChangedEvent 없음)

PR #87. 사용자(박승현) 요청 2026-09-24: 5직업 스킬을 레벨·전직 여부와 무관하게 바로 시험할 수 있게.

**헤더 변경 없음 · 새 CSV 열 없음 · 새 이벤트 없음.** 새 RPC 1개(`PlayerSkillState.RequestDevSwitchJob` · DEV 전용 · `Skill/` 안). `Docs/스키마-계약.md` 는 건드리지 않았다.

### 동작

| `DevTestMode` | F10 |
|---|---|
| **true** (지금 기본값) | 서버가 `DevJobOrder`(마법사 → 전사 → 궁수 → 도적 → 해적 → 마법사) 의 **다음 직업**으로 바꾼다. 초보자면 마법사부터. 레벨·전직 여부 무관 · 차수 = 지금 레벨로(10/20/30) · 이전 직업 스킬 레벨·쿨다운 초기화 · 버프 비움(`SkillBuffs.ResetMatchState`) |
| **false** | 예전과 똑같다 — 클라가 `RequestChooseJob(order[i])` 를 보내고, 서버는 초보자 · Lv10 이상일 때만 1회 전직 |

### 🔴 JobChangedEvent 를 보내지 않는다

정식 경로(`ChangeJob` `:163`)만 `JobChangedEvent` 를 보낸다. DEV 전환은 `ChangeJob` 을 **거치지 않고** `DevSetJobState`(`:411`)로 jobId/tier 를 쓴다 → 구독자(A 의 마을 획득 등 게임플레이 반응)가 반응할 일이 없다.
- 스킬 창 갱신은 `PushState` → 클라 `SyncState` → `NotifyStateChanged("job"/"skill")` — `Skill/` 안 경로
- DEV 세팅 행(`RequestDevSetup` → `DevLearnAll`)의 차수 올림도 예전엔 `TryAdvanceTier` → `ChangeJob` → **이벤트가 나갔다**. 이것도 DEV 경로라 `DevSetJobState` 로 바꿨다(`:342`)
- 정식 전직(`RequestChooseJob`)과 정식 차수 상승(`TryAdvanceTier` — 배우기·시전·동기화 때)은 그대로 `ChangeJob` · 이벤트 발행

### 수정 위치

| 위치 | 변경 |
|---|---|
| `Skill/PlayerSkillState.mlua:44` | `DevJobOrder` 속성 |
| `:342` | `DevLearnAll` 차수 = `DevSetJobState(…, TierForLevel)` (이벤트 없음) |
| `:357` | `RequestDevSwitchJob()` — Server RPC · `DevTestMode` 가 false 면 무시(로그) |
| `:370` | `DevSwitchJob(uid)` — 다음 직업 · 스킬/쿨다운 초기화 · 버프 비움 · 로그 `[Skill] [DEV] job switch A -> B/tier … no JobChangedEvent` |
| `:399` | `TierForLevel(jobId, level)` — `TryAdvanceTier` 와 같은 판정(`JobTier.ReqLevel`) |
| `:411` | `DevSetJobState(uid, jobId, tier, forcePush)` — 이벤트 없이 쓰고 `PushState` |
| `Skill/SkillWindowLogic.mlua:1397-1403` | `OnDevChooseJob`: `DevTestMode` 면 `RequestDevSwitchJob()`, 아니면 예전 코드 그대로 |

### Play 검증

(2026-09-24 · Maker MCP · `Orbis_Lobby_VictoriaStation` · 이 브랜치 `e6d3c44` · Reimport All → `refresh` → `logs(build)` → `play`)

**빌드 경고: 1 before → 1 after** (기존 `LWA-1111` · 에러 0 · Info 182 → 182).

**이벤트 감시:** 서버 콘솔에서 `_PlayerSkillState:ConnectEvent(JobChangedEvent, …)` 로 발행 횟수를 세는 테스트 리스너를 붙였다(`[T] SPY` 로그 · 코드 변경 아님). 입력은 실제 F10 키(`maker_keyboard_input`) · DEV 세팅은 행 버튼이 부르는 같은 메서드 `_SkillWindowLogic:OnDevSetupClicked()` (MCP 마우스는 엔진 UI 버튼을 못 누른다).

| # | 단계 | 결과 | 로그 |
|---|---|:--:|---|
| 1 | Lv1 초보자 F10 ① | PASS | `[Skill] [DEV] job switch NOVICE -> MAGICIAN/0 (level 1) skills cleared=0 · no JobChangedEvent` · `ShowTab(0) jobLine=MAGICIAN tier=1 rows=3` |
| 2 | F10 ② | PASS | `MAGICIAN -> WARRIOR/0` · `ShowTab(0) jobLine=WARRIOR … rows=2` |
| 3 | F10 ③ | PASS | `WARRIOR -> ARCHER/0` · `ShowTab(0) jobLine=ARCHER … rows=2` |
| 4 | F10 ④ | PASS | `ARCHER -> THIEF/0` · `ShowTab(0) jobLine=THIEF … rows=2` |
| 5 | F10 ⑤ | PASS | `THIEF -> PIRATE/0` · `ShowTab(0) jobLine=PIRATE … rows=2` (스크린샷: 해적 1차 탭 섬머솔트 킥 Lv.0 · DEV 세팅 행) |
| 6 | DEV 세팅 (해적) | PASS | `[DevRemote] +level 29 -> Lv30`(20:21:35) → `[Skill] [DEV] job state PIRATE/0 -> PIRATE/3 (no event)` → `learn-all PIRATE skills=5 tier=3 level=30`(20:21:36) · 확인 `lv=30 job=PIRATE/3 SK_P11=5/5 SK_P12=5/5 SK_P21=5/5 SK_P22=5/5 SK_P31=1/1 spy=0` |
| 7 | Lv30 F10 ① | PASS | `PIRATE -> MAGICIAN/3 (level 30) skills cleared=5` · `learned=0` |
| 8 | 전환 뒤 DEV 세팅 (마법사) | PASS | `learn-all MAGICIAN skills=6 tier=3 level=30` · `SK_M11=5/5 SK_M12=5/5 SK_M13=5/5 SK_M21=5/5 SK_M22=5/5 SK_M31=1/1` |
| 9 | Lv30 F10 ②~⑤ | PASS | `MAGICIAN -> WARRIOR/3 … cleared=6` → `WARRIOR -> ARCHER/3` → `ARCHER -> THIEF/3` → `THIEF -> PIRATE/3` · 차수 3 유지 · 마지막 `job=PIRATE/3 lv=30 learned=0` |
| 10 | 이벤트·부작용 | PASS | 세션 내내 `spy=0`(JobChangedEvent 0 회) · `[Skill] JOB `(ChangeJob) 로그 0 · Village/Claim 로그 0 · 에러 0 |

**DEV 세팅 타이밍:** A 의 레벨 RPC 가 Lv1 → Lv30 을 한 서버 틱(20:21:35) 안에 끝내고, `DevLearnAll` 은 `DevSetupDelay` 0.5s 뒤(20:21:36) `level=30 tier=3` 으로 돌았다 → 모든 스킬 MAX. 수정 필요 없음. (예전 세션에서 레벨업이 느렸던 것은 콘솔 스크립트 실행 속도였고 이 RPC 경로와 무관하다.)

**Lv30 에서 직업별 스킬 MAX 까지 키 순서** (새로 입장한 Lv1 초보자 · K 로 스킬 창 열기):
- 마법사: F10 ×1 → DEV 세팅
- 전사: F10 ×2 → DEV 세팅
- 궁수: F10 ×3 → DEV 세팅
- 도적: F10 ×4 → DEV 세팅
- 해적: F10 ×5 → DEV 세팅
- 이미 Lv30 이면: F10 을 원하는 직업까지 누른 뒤 DEV 세팅 (순서 마법사 → 전사 → 궁수 → 도적 → 해적 → 마법사)

**판정: PASS** (10 단계 전부).
