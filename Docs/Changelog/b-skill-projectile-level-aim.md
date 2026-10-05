# b/skill-projectile-level-aim — 투사체 조준은 시전자 몸 띠(발 ~ 머리)와 겹치는 적만

## 2026-10-05 v2 — 사용자 결정(앞의 v1 "같은 높이 허용치 · 직선 비행"을 바꿈)

> 대상 = 앞쪽(지금처럼) + 몬스터 몸 상자가 시전자의 몸 띠(발 ~ 머리 위끝)와 세로로 겹칠 것. 머리보다 완전히 위 · 발보다 완전히 아래인 몬스터는 고르지 않는다.
> 허용치 후보(0.25 / 0.5 / 0.8)와 그 키는 없앤다. 비행은 예전처럼 대상을 따라간다(#161 FlightFor 그대로). 궁은 건드리지 않는다.

### 범위 (코드로 정함)

- 투사체가 나오는 길은 둘: `SkillAttack.SpawnProjectile`(Behavior = PROJECTILE 인 스킬 → `SkillExecutors.FireProjectile` · 플레임 헤이즈 `ExecuteFlameHaze`) ·
  `SkillAttack.FireBasicProjectile`(#161 · 활 · 아대 기본 공격). 둘 다 조준에 `FindSkillTarget(shape.floorY …)` 를 쓰고 투사체에 `SameFloorOnly` 를 켠다 → 그 두 자리(탐색 · 명중)에 규칙을 넣었다.
- 적용: 달팽이 세마리 SK_N01 · 에너지볼트 SK_M11(+ 플레임 헤이즈 #157) · 더블 샷 SK_A11 · 스나이핑 SK_A21 · 럭키 세븐 SK_T11 · 활 기본 공격 · 아대 기본 공격(#161) · 조준 표시(`PlayAimMarker` · 같은 탐색).
- 안 함: 궁(SK_W31 · M31 · A31 · T31 · P31 = ORIGIN · 이 길을 지나지 않는다) · 근접(MELEE_ARC: 파워 스트라이크 · 섬머솔트 킥 — 탐색에 floorY 없음) · 범위 · 버프 · 이동 스킬 · 에너지볼트 폭발 주변 대상(예전 규칙).

### 바뀐 것 (B 파일)

| 파일 | 내용 |
|---|---|
| `Skill/SkillAttack.mlua` | `AimBodyBand`(true) · `CasterBodyHeightFallback`(0.7) · `BodyBoxBandOf`(몸 상자 세로 범위 · HitComponent → 없으면 script.PlayerHit) · `CasterBandOf`(발 ~ 몸 상자 위끝) · `OverlapsBand`. `FindSkillTarget`: shape.floorY 가 있으면(투사체 조준) 몸 띠와 안 겹치는 후보를 뺀다(로그 `offBand=N band=lo..hi`) · 이때 예전 "발 0.6 아래" 규칙은 쓰지 않는다. 탐색 상자 크기 · 앞 끝은 그대로(FLIGHTFOR-NOTE: 탐색 끝과 대상 없는 사거리가 같이 간다) |
| `Skill/SkillProjectile.mlua` | `UseBodyBand`(true) · `InCasterBand`: `SameFloorOnly` 투사체는 몸 상자가 (발 ~ 발 + 시전자 키)와 겹치는 몬스터만 맞는다(키는 첫 판정 때 한 번 잰다). 에너지볼트 폭발 주변 probe · 폭발 패스는 `bandSkip` 으로 예전 규칙 |

- 시전자 키: 런타임에 시전자 몸 상자(script.PlayerHit)에서 읽는다. 못 읽을 때만 **0.7** — 출처 `Global/DefaultPlayer` 모델의 script.PlayerHit BoxSize (0.45, 0.7) · ColliderOffset (0, 0.35) → 발 0 ~ 머리 0.7.
- 비행 · 최소 비행 · 첫 판정 · 대상 없는 사거리 멈춤은 #161 그대로(이 PR 은 비행을 건드리지 않는다).

### v1 에서 없앤 것

- `LevelAimSkillIds` · `LevelAimTolerance` · `IsLevelAimSkill` · 같은 높이 직선 비행(유도 없음) · `LevelOnly` · `InLevelWindow` — 두 파일을 main(1d518c6) 판으로 되돌린 뒤 v2 를 넣었다.
- 키트(`villagedefense-harness/pirate-check/r12/`): 허용치 키는 없다. O = 고정 장면 다시 놓기 · P = 예전 조준 비교.

### 점검

- LSP(SkillAttack · SkillProjectile) 오류 0(SkillAttack info 18 = main 과 같은 줄들) · `check-integrity` 전부 통과(경고 3 = main). **Play 안 함** — RELOOK R17 · 숫자 N3–N5.

---

## 기록 — v1 (2026-10-05 · v2 로 대체됨)

- 요청: "Three Snails and Energy Bolt (and Flame Haze) only go to enemies in FRONT at the SAME HEIGHT as the character, flying straight."
- 구현: `LevelAimSkillIds = "SK_N01,SK_M11"` · `LevelAimTolerance = 0.5`(후보 0.25 / 0.5 / 0.8 · 키트 O/P) · 발 높이 |dy| ≤ tol 만 조준 · 유도 없이 곧게 · 투사체 `LevelOnly`.
- #161(FlightFor · ApplyReach)과 합칠 때(시험 `scratch-171x161` `84e77d5` · 통합 `4bddaf9`): `FlightFor` 를 대상과 함께 불러 최소 비행 0.1 s 를 받고 수명은 대상 없는 사거리 멈춤으로 — v2 에서는 이 해결이 필요 없다(비행을 건드리지 않음).
