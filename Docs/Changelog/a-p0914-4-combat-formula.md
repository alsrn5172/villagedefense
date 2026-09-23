# a/p0914-4-combat-formula (B4 · 통합 브랜치 `a/plan-0914` · B3b 위 stacked · PR #73)

전투 공식 (WO-029 B4 · WO-027 §9-0 · 사용자 2026-09-19/22 결정). 표·헤더 변경 없음.

| 항목 | 내용 | 파일 |
|---|---|---|
| 명중 | `DamageFormula.HitCheck(accuracy, attackerLevel, targetLevel, avoid)` — gap = 대상 Lv − 내 Lv − floor(명중 ÷ `AccuracyPerLevel`(15)). gap ≤ 0 → 100%, 아니면 1 − `HitPenaltyPerLevel`(0.10) × gap, 바닥 `HitFloor`(0.10). 옛 `HitBase/HitPerLevel` 제거. 회피는 후순위(받기만) | `Stat/DamageFormula.mlua` · `Stat/StatService.mlua`(호출부에 레벨 전달) |
| 치명 | `CritPerLuk` 0.001 → **0.00265**(만렙 도적 올-LUK 보석 LUK 358 → 95%p 역산) · `CritCap` 0.5 → **1.0** | `Stat/DamageFormula.mlua` |
| 방어 | `Recalculate`: 최종 방어 += floor(STR × `DefensePerStr`(0.2)) | `Stat/StatService.mlua` |
| 받는 피해 공용 헬퍼 | `DamageFormula.ApplyPlayerDefense(defender, raw)` = raw × 100/(100+방어) · 최소 1 · 플레이어 아니면 그대로. 적용점: 일반몹 접촉 `MonsterAttack.CalcDamage`(신규 · `MonsterInfo.Attack` = `MonsterCatalog.GetAttack` · 미니언은 그 개체의 `FactionAttack.BaseDamage`) · 보스 스킬/접촉 `BossSkillRunner.CalcDamage` · 보스 투사체 `BossProjectileAttack.CalcDamage` · 시설/수비대 `FactionAttack.CalcDamage`(×PlayerDamageMul 먼저 → 감산). `PlayerHit`(B) 무수정 | 위 파일들 + `Catalog/MonsterCatalog.mlua` |
| B 조율 API | `StatService.GetAttackPower(userId)`(최종 총공격) · `GetDefense` · `GetPlayerLevel`. B 는 `SkillDatabase.GetAttackPower` 를 `_StatService:GetAttackPower(userId)` 로 교체하면 스킬이 장비·강화를 탄다 | `Stat/StatService.mlua` |
| 부수 수정 | `LaneStateService.ApplyDamage`: 피격마다 `Changed`(→ `ApplyCombat` + combat 로그)를 돌리던 것을 파괴 때만으로, 평소엔 `ApplyVisual`(색·HP바) — 미니언 8마리가 초당 수십 줄을 만들던 스팸 제거(2026-09-23 실측) | `Lane/LaneStateService.mlua` |

- MISS 표시: 명중 실패는 피해 0 → 기존 표시 경로 그대로(눈 확인은 사용자).

## 검증

- `node Docs/tools/check-integrity.cjs` 통과 여부는 PR 본문.
- 런타임(개인 월드): `HitCheck` 표본(레벨차 0/5/10 · 명중 0 → 100/50/10%) · `ApplyDefense(1000,100)=500` · `GetDefense` = STR 규칙 반영 · 시설 `CalcDamage` = 125×12 → 감산 · `GetAttack(100000)`=150.
