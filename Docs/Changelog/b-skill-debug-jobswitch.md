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

(Maker 재입장 · Reimport All 뒤 추가)
