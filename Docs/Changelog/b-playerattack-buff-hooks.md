# b/playerattack-buff-hooks — 기본 공격 버프 훅 (PR #114)

## 1차 (2026-09-26)

배경: #88 머지로 `MyDesk/PlayerAttack.mlua` 가 B 담당(`Docs/협업-규칙.md:91`). A 가 #40 5844560359 에서 "PlayerAttack.mlua 작업(버프 훅 3곳 등)을 시작해도 된다". 스킬에는 이미 붙어 있던 버프 4개가 기본 공격에는 빠져 있었다(궁수 스펙 대조 2026-09-26 · 기획 답 #7 "닷지 = 모든 공격 확정 크리").

| 훅 | 위치 | 동작 |
|---|---|---|
| 닷지 확정 크리 | `PlayerAttack.CalcCritical` | `_SkillBuffs:IsGuaranteedCrit(userId)` 가 참이면 `true`(배율 2.0) · 아니면 예전대로 `_StatService:RollCritical` · 로그 `[PlayerAttack] guaranteed crit` |
| 쉐도우 파트너 배율 | `PlayerAttack.CalcDamage` | `_StatService:CalcPlayerDamage` × `_SkillBuffs:GetOutgoingDamageMul(userId)` (활성 = 2배) |
| 매직 가드 추가 피해 | `PlayerAttack.CalcDamage` | + `_SkillBuffs:GetOnHitBonusDamage(userId)` (현재 MP 5% · 타격마다). 순서는 스킬 `SkillDatabase.DamageAt` 과 같다(배율 → 더하기). MISS(0)에는 얹지 않는다. 로그 `[PlayerAttack] buff dmg a -> b (shadowPartner xM · magicGuard +N)` |
| 픽파켓 | ~~새 `PlayerAttack.OnAttack`~~ → `PlayerAttack.CalcDamage`(2차) | **명중(피해 > 0)일 때만** `_SkillBuffs:OnSkillHitMonster(userId, defender, "BASIC")` — 같은 대상 중복 방지 · 로그(`[Buff] PICKPOCKET … skill=BASIC`)는 SkillBuffs 쪽 그대로 |

- 세 메서드 모두 부모(`AttackComponent`)에 ExecSpace 가 없어 붙이지 않았다(LEA-3014). `SkillBuffs` 메서드가 ServerOnly 라 `self:IsServer()` 일 때만 부른다.
- `SkillBuffs.mlua` · `StatService.mlua` 는 호출만(수정 없음). A 파일 · 계약서 변경 없음.
- LSP 깨끗 · `check-integrity` 통과. **Play 확인 전 → Draft.**

### Play 체크리스트 (다음 라운드)

1. 궁수 닷지(E) 뒤 6초 안 기본 공격(Ctrl) → `[PlayerAttack] guaranteed crit` · 크리 표시. 버프 끝난 뒤 → 로그 없음(LUK 확률).
2. 도적 쉐도우 파트너(W) 중 기본 공격 → `buff dmg a -> 2a (shadowPartner x2 …)`.
3. 마법사 매직 가드(E) 중 기본 공격 → `buff dmg a -> a + floor(MP × 5%)`. MP 가 줄면 추가분도 준다.
4. 도적 픽파켓(패시브) 배운 상태로 기본 공격 → `[Buff] PICKPOCKET +N meso … skill=BASIC` · 동전 드랍. 같은 대상 연타는 `PickpocketDedupeSeconds` 안에서 한 번. **MISS(피해 0 · 표시 MISS) 타격 → PICKPOCKET 로그·동전 없음**(2차).
5. 버프 없음 → 로그 없음 · 피해 = 예전 값(회귀 없음). 빌드 경고 before → after.

## 2차 (2026-09-27) — 픽파켓 MISS 가드

- #40 5813243717 A 결정 "MISS 면 픽파켓 메소 없음 · 명중 조건을 코드로 보장" 을 반영한다. 1차의 `PlayerAttack.OnAttack` 훅은 엔진이 MISS(피해 0)에도 부르는지 확인이 안 됐다(#40 5813000490 "확인 못 함"). → `OnAttack` 을 지우고 같은 호출을 `PlayerAttack.CalcDamage` 안, MISS(0)를 거르는 줄 **뒤**로 옮겼다 — 명중일 때만 부른다. 호출 인자·중복 방지(`SkillBuffs.PickpocketDedupeSeconds`)·로그는 그대로.
- 스킬 타격의 픽파켓(`SkillAttack.OnAttack` · `SkillProjectile.OnAttack`)은 이 PR 밖이라 그대로.
- 이 변경은 처음 도적 브랜치(`b/skill-thief-effects` · 로컬)에 넣었다가 사용자 지시(2026-09-27 · Round 9 H 재확인용)로 #114 로 옮겼다. 도적 브랜치는 이 커밋 위로 rebase.
- LSP(mlua diagnose `PlayerAttack.mlua`) 깨끗(진단 0) · `check-integrity` 전부 통과(경고 4건 = main 과 같음). Play 확인 = Round 9 H4 에 MISS 항목 추가(체크리스트 4번).
