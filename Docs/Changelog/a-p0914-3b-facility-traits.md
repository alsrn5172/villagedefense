# a/p0914-3b-facility-traits (B3b · 통합 브랜치 `a/plan-0914` · B3 위 stacked · PR #72)

마을별 시설 특성 S2: 엘리니아 공격 오라 · 노틸러스 회복 오라(본인 포함) · 노틸러스 포탑 스플래시. 값 정본 = 계약 A-2-17 S2(사용자 2026-09-22) · WO-029 B3b.

| 항목 | 내용 | 파일 |
|---|---|---|
| 표 행 3개 | `ELLINIA SUPPRESSOR AURA_ATK 0.10/0.20/0.30` · `NAUTILUS SUPPRESSOR AURA_REGEN 25/50/100` · `NAUTILUS TOWER TOWER_SPLASH 1.5/1.5/1.5`(값 = 반경) | `VillageFacilityTrait.csv` |
| 공격 오라 → 플레이어 | 오라가 플레이어에게 붙인 `Buff.AtkMul` 을 `CalcPlayerDamage` 가 곱한다(수비대는 `FactionAttack.CalcDamage` 가 이미 곱함) | `Stat/StatService.mlua` |
| 회복 오라 본인 포함 | `FactionAuraController.RegenSelf`(시설 오라만 켬) → 소스 자신에게 회복 누적 → `ApplyRegen` 시설 경로 → `LaneStateService.HealFacility`(원장 HP · 소수 이월 · 만피/파괴 0 · `[Regen]` 2초 누적 로그 · `Changed` 로 HP바 갱신) | `Faction/FactionAuraController.mlua` · `Lane/LaneStateService.mlua` · `Lane/LaneFacilityService.mlua` |
| 스플래시 | `FactionAttack.SplashRadius/SplashPrimaryMul(2)/SplashMul(1)` · `HitTarget` → `HitOne`(주 표적 ×2) → `SplashAround`(주 표적 중심 원 안 다른 적 ×1 · `[Splash]` 로그) · `DoAttack` 즉시 경로도 동일 · `ApplyCombat` 이 `TOWER_SPLASH>0` 이면 표적 1 + 반경 전달 | `Faction/FactionAttack.mlua` · `Lane/LaneFacilityService.mlua` |
| 포탄 분할 끔 | NAUTILUS TOWER 3행 `SplitHits=false` — 3발이 전부 주 표적에 도착, 피해는 표적당 1회(스플래시 1회) | `FacilityAttackFx.csv` |
| 넥서스 | 특성 없음 · Lv1 유지(변경 없음) | — |

## 검증

- `node Docs/tools/check-integrity.cjs` 통과 여부는 PR 본문.
- 런타임(Test_Lane_Fx · 개인 월드): `[Facility] combat NAUTILUS:TOWER … maxTargets=1 splash=1.5` · 달팽이 웨이브에 `[Splash] … primary= splash=<n>` · 억제기 HP 를 깎은 뒤 `[Regen] NAUTILUS SUPPRESSOR +50 -> …`(Lv1 25/초 × 2초) · `[Aura] … atk=1.10` · `CalcPlayerDamage` 가 `Buff.AtkMul` 을 곱하는지 스크립트로 대조.
