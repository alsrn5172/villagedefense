# a/stat-spend-sp — SP 원장 API (SpendSp · GrantSp · SpSpentEvent 발행)

> 배경: B(박승현) 스킬 작업(PR #32 feature/skill)이 `SummonManager.econ.sp` 를 쓰려는데 소비 메서드가 없고 `Stat/SpSpentEvent` 도 미사용이었다. 원장·이벤트 발행은 A 계약(계약서 §153)이라 A 가 추가한다. base `main fd3d20f`(PR #29 머지 후).

## 2026-09-08

### `Summon/SummonManager.mlua`
- `SpendSp(userId, skillId, amount) → boolean` (ServerOnly): `amount ≤ 0` 이거나 SP 부족이면 false 리턴 + 로그, 아무것도 안 뺀다. 성공하면 차감 → `Push(userId)`(HUD·캐릭터 창) → `SpSpentEvent{UserId, SkillId, Amount, RemainingSp}` 발행 → true. `SpendCoin` 과 같은 꼴.
- `GrantSp(userId, amount)` (ServerOnly): 스킬 초기화 환불·리모컨·보상용. 레벨업 지급(`ApplyLevelUpRewards` 의 `LevelTable.sp`)은 그대로.
- 규칙: B 는 `econ.sp` 를 직접 쓰지 않고 `SpendSp` 만 부른다. 읽기는 기존 `GetEcon(userId).sp`.

### 문서
- 계약서 B-3 `SpSpentEvent` 행에 발행 주체(A)·호출 API 명시 · 변경 이력. GDD §AP/SP 의 "B 가 SpSpentEvent 로 통보" → "B 는 SpendSp 호출, 발행은 A" 정정.

### 로그 스모크 (Maker Play)
- 서버 스크립트: `GrantSp(uid, 5)` → `SpendSp(uid, "SKILL_TEST", 3)` = true · sp 2 · `[Summon] -sp 3 skill=SKILL_TEST -> sp=2` · `SpendSp(uid, "SKILL_TEST", 3)` = false(부족) · `SpendSp(uid, "X", 0)` = false. 이벤트 수신은 임시 구독으로 `RemainingSp=2` 확인.
