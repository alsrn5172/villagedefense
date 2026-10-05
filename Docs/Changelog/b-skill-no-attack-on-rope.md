# b/skill-no-attack-on-rope

## 2026-10-05 — 줄 · 사다리 위 공격 금지 (사용자 결정)

줄 · 사다리에 매달린 캐릭터는 피격되지 않는다 → 거기서 공격하면 일방적으로 때리는 악용이 된다.
규칙: 매달린 동안 **공격**(모든 직업의 피해 스킬 · 궁 5종 · 기본 공격)은 시전되지 않고 피해도 들어가지 않는다. 버프 · 이동 스킬은 바꾸지 않는다.

| 곳 | 무엇 |
|---|---|
| `Skill/SkillCaster.mlua` (B) | 판정 한 곳: 클라 = 로컬 플레이어 상태기가 `CLIMB`(줄) / `LADDER`(사다리) · 서버 = 클라가 바뀔 때마다 알리는 값(`ReportClimbing`) 또는 서버 상태기. 공격 시전 = `IsAttackCast`(= `IsDamagingCast` + 궁 전부 · 재시전 주먹 포함). 클라 `Cast` · 서버 `RequestCast`(4-1b · MP · 쿨다운 · 영혼석 앞) 둘 다 거절. 기본 공격 = 클라 `OnUpdate` 가 `PlayerControllerComponent:AddCondition("Attack", …)` 를 건다. 피해 게이트 `BlocksDamageWhileClimbing`(이동 스킬 예외 · 0.5s 에 로그 한 줄) |
| `Skill/SkillAttack.mlua` (B) | `IsAttackTarget`: 시전자가 매달려 있으면 타격 없음(아이언 바디 반사 `FlatTag` 제외) — 시전 뒤 매달린 늦은 타격 · 궁 후속 파 |
| `Skill/SkillProjectile.mlua` (B) | `IsAttackTarget`: 시전자가 매달려 있으면 날아가던 투사체 · 폭발도 피해 없음 |
| `PlayerAttack.mlua` (B · 협업-규칙 :91) | `AttackNormal` 첫 줄: 매달려 있으면 모션 · 소리 · 판정 없이 끝(서버 판정본) |

- 예외(그대로): 버프(하이퍼 바디 · 매직 가드 · 다크 사이트 · 쉐도우 파트너 · 에너지 쉴드 · 에너지 차지 1단 · 닷지) · 이동(텔레포트 · 텔레포트 강화 도착 광역 피해 포함) · 도발(피해 없음) · 패시브.
- 로그: 클라 `SkillCaster: climbing=true (state CLIMB) — reported to server` · `cast(pred) <id> ok=false reason='on a rope or ladder'` · 서버 `[Skill] climbing=true` · `[Skill] on rope/ladder — <id> refused` · `[Skill] on rope/ladder — hit refused (<id>)` · `[PlayerAttack] on rope/ladder — basic attack refused`.
- 런타임 미검증: 상태 이름 `CLIMB` / `LADDER` 와 입력 조건 이름 `"Attack"` — 숫자 줄(RUN-rope.md)과 사용자 눈(RELOOK)으로 확인한다.
