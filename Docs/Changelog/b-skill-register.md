# b/skill-register — 스킬·전직 시스템 등록서 (문서만)

> 배경: B(박승현) 스킬 작업(PR #32 `feature/skill`)은 개인 월드 스냅샷(`b/skill-raw`)을 팀 월드로 옮기는 일이다. 계약서 §1 은 새 시스템을 **코드보다 먼저 등록**하라고 하고, 스킬·전직은 "등록서 대기"였다. 이 PR 은 등록서와 그에 딸린 계약 항목만 넣는다. base `main a1ab351`(PR #34 머지 후).

## 2026-09-09

### `Docs/스키마-계약.md`
- §0-2: `JobId` 6종 확정 제안 — `NOVICE · WARRIOR · MAGICIAN · ARCHER · THIEF · PIRATE`. A 의 `ItemInfo.ReqJob` 임시값(117행)과 `StatService` 폴백 `NOVICE` 를 그대로 쓰고, 스냅샷의 `BEGINNER`/`MAGE` 는 B 가 치환한다. `JobTier` · `SkillBehavior` 9종(CSV 행 7 + 실행기 전용 `AOE`·`BUFF_ALLY`) · `EffectUnit` 6종 · `BuffTag` 13종 추가. 스냅샷 공백 기록: `SkillExecutors` 에 `MELEE_ARC`·`TAUNT` 핸들러가 없다(feature/skill 에서 추가).
- §1: 등록서 8항목(스킬 시전·스킬 UI·전직). 상태 ⬜ → 🟡 진행 중. 8번 = `Summon/SummonManager.mlua`(`SpendMp`) · `Stat/StatUIController.mlua`(`OnClickSkill` 1줄) · `WeaponMotion.csv`(행 추가) → 경계면 PR, A 승인 필요.
- A-2-16: 신규 표 3종 헤더 확정 — `SkillInfo`(30열, 키 `SkillId`) · `JobInfo`(A 의 `StatService.LoadJobs` 가 읽는 열 그대로, 키 `JobId`) · `JobTier`(키 `JobId`+`Tier`). 스냅샷 `SkillDataSet`/`JobDataSet` 의 snake_case 를 §0-1 PascalCase 로 바꿨다.
- B-3 `Skill/` `Job/`: `JobChangedEvent(UserId, PrevJobId, NewJobId, Tier)` · `SkillUsedEvent(UserId, SkillId, MapName)` · 내부 `SkillStateChangedEvent(What)`. 구독은 `SpSpentEvent` 뿐, 레벨은 `curLevel`/`GetEcon().level` 을 읽는다.

### `Docs/tools/check-integrity.cjs`
- CANONICAL 에 `SkillInfo` · `JobInfo` · `JobTier`, PK 에 키 3종. ⚠️ CSV 파일은 아직 없어 C1 이 **경고 3건**(`*.csv 가 없다`)을 더 낸다. fail 아님. `feature/skill` 에서 파일이 들어오면 사라진다.

### A 와 정할 것 (PR 코멘트로)
1. `JobId` 값 — A 임시값(`MAGICIAN` · `NOVICE`)으로 확정할지.
2. `JobChangedEvent` 에 `Tier` append.
3. **MP 회복** — `SummonManager` 에는 `OnLevelUp` 리필만 있고 회복 틱이 없다. `SpendMp` 가 들어가면 서버 틱 또는 `GrantMp` 가 필요하다. A 파일이라 A 가 정한다.

### 검증
- `node Docs/tools/check-integrity.cjs` — FAIL 0. 경고는 기존 3건 + 신규 C1 3건(파일 미생성). 런타임 변경 없음(문서·검사 목록만).
