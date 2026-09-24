# b/skill-attack-faction-filter

## 2026-09-24 — 스킬이 우리 편을 때리지 않게 (진영 필터)

PR #91. skill-maker 점검(2026-09-24)에서 발견: 스킬 타격 경로(`SkillAttack` · `SkillProjectile`)에 진영 판정이 없어, `CollisionGroups.Monster` 에 있는 우리 편(수비대 · 우리 미니언 · 우리 시설)과 중립까지 맞을 수 있었다. 기본 공격은 이미 거른다(`PlayerAttack.mlua:91` `_FactionLogic:IsEnemy`).

**헤더 변경 없음 · 새 CSV 열 · 이벤트 · RPC 없음.** `PlayerAttack.mlua` · `Faction/FactionLogic.mlua`(A)는 건드리지 않았다 — `IsEnemy` 호출만.

### 수정

| 위치 | 변경 |
|---|---|
| `Skill/SkillAttack.mlua:248-250` `IsAttackTarget` | 맨 앞에 `_FactionLogic:IsEnemy(self.Entity, defender)` 가 false 면 false. 모든 스킬 타격(상자 · 원 · 단일 대상 · 평값 반사)과 후보 수집(probe · `FindSkillTarget(s)`)에 걸린다 |
| `Skill/SkillProjectile.mlua:282-288` `IsAttackTarget` | 같은 규칙. 공격자는 투사체가 아니라 **시전자**(`_UserService:GetUserEntityByUserId(CasterUserId)`) — 투사체 엔티티엔 진영이 없어 `FactionLogic` 이 중립으로 본다. 시전자를 못 찾으면 아무도 안 맞는다 |

- 스킬 피해는 전부 `AttackFast` → `IsAttackTarget` 을 지난다(`SkillAttack` 6곳 · `SkillProjectile` 1곳 · 직접 HP 쓰기 없음) → 두 곳으로 전부 덮인다.
- 도발(SK_W22)은 이미 `SkillExecutors:2277` 에서 `IsEnemy` 로 걸렀다 — 이제 후보 수집 단계에서도 빠진다.
- #83 도 `SkillAttack.IsAttackTarget` 을 고친다(시체 제외 · `__base` 줄 뒤). 이 PR 은 그 두 줄 **앞**에 넣어 두 PR 의 변경이 겹치지 않는다.

### Play 검증

(재입장 · Reimport All 뒤 추가) — 수비대 옆에서 스킬 → 수비대 피해 0 · 몬스터는 그대로 피해 · 빌드 경고 N → N
