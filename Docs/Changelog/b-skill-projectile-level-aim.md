# b/skill-projectile-level-aim — 달팽이 세마리 · 에너지볼트(· 플레임 헤이즈)는 앞쪽 같은 높이 적만 · 곧게

## 2026-10-05 — 사용자 요청

> "Three Snails and Energy Bolt (and Flame Haze, its variant) only go to enemies in FRONT at the SAME HEIGHT as the character, flying straight.
> An enemy above or below is not targeted even if it is nearer."

### 예전(main 1d518c6)

- 조준 상자 = 앞으로 Range · 발부터 **위로 2.5**(`AimSearchHeight`) · 발이 0.6 넘게 낮은 후보만 뺌(`AimFloorTolerance`) → 위 발판의 몬스터가 더 가까우면 그쪽을 골랐다.
- 고른 대상으로 **유도**(수명 × 1.5) → 껍질 · 볼트가 위 · 아래로 꺾여 날았다.
- 원작 데이터(0001000 · 2001004)에는 범위 상자 · 대상 수가 없다(`session-handoff/STATE-after-merges.md` §5).

### 바뀐 것 (전부 B 파일)

| 파일 | 내용 |
|---|---|
| `Skill/SkillAttack.mlua` | `LevelAimSkillIds = "SK_N01,SK_M11"` · `LevelAimTolerance = 0.5` · `IsLevelAimSkill`. `SpawnProjectile`: 이 스킬이면 상자 = 앞으로 Range · 발 − tol ~ 발 + 2.5, 고르는 건 **발 높이 \|dy\| ≤ tol** 만(`FindSkillTarget` 의 `shape.maxDy` · 로그 `offLevel=N`). 고른 대상은 바로 앞 당기기(#163)에만 쓰고 **유도하지 않는다**(곧게 · 수명 = Range / Speed). 투사체에 `LevelOnly` · `LevelTolerance` 를 넘긴다 |
| `Skill/SkillProjectile.mlua` | `LevelOnly` · `LevelTolerance` · `InLevelWindow`. 날아가다 닿아도 발 높이 \|dy\| > tol 이면 안 맞는다(`IsAttackTarget`) · 에너지볼트는 첫 대상 고르기(`TryExplode`)에만 적용 — 폭발 주변 대상(2.0 × 1.1 상자)은 예전대로 |

- 플레임 헤이즈(#157)는 에너지볼트 키(SK_M11)로 `SpawnProjectile` 을 부르므로 #157 이 합쳐지면 같이 적용된다.
- 다른 투사체(더블 샷 · 럭키 세븐 · 스나이핑 …)는 그대로.

### 후보(사용자 Play 선택)

- 높이 허용 `LevelAimTolerance`: **A 0.25 · B 0.5(기본) · C 0.8**. 0.5 = 경사 발판(≈0.3~0.5 낮음)은 허용 · 한 칸 위 발판(≥0.6)은 제외.
- 키트: `villagedefense-harness/pirate-check/r12/level_aim_server.lua` + `level_aim_client.lua` — O = 다음 후보 · P = 예전 조준 켜기/끄기(비교) — F6/F7 은 #166 화질 비교 키트(r11)가 쓴다. 토스트에 지금 값.

### 점검

- LSP(SkillAttack · SkillProjectile) 오류 0 · `check-integrity` 전부 통과(경고 3 = main). **Play 안 함** — RELOOK R17.

## 2026-10-05 (2) — #161(FlightFor · ApplyReach)과 합칠 때

- 시험 병합(`scratch-171x161` `84e77d5` · 푸시 안 함) · 통합 `local/integration-skills` `4bddaf9`: 충돌 1곳 `SkillAttack.SpawnProjectile` 비행 계산.
  해결 = `FlightFor` 를 **대상과 함께** 불러 최소 비행 0.1 s(가까운 대상 → 느리게)는 그대로 받고, 같은 높이 조준이면 유도 없이(`target = nil`) 수명을 대상 없음과 같은
  사거리 멈춤(`untargetedTravel = Range − ox` → `ApplyReach` 가 판정 상자 반을 뺀다)으로 바꾼다. 탐색 상자 앞 끝 = 발 + Range 그대로 → 탐색 끝과 직선 사거리가 같이 간다.
- #161 이 main 에 먼저 들어가면 이 PR 은 main 을 합칠 때 같은 해결을 넣는다(git rerere 에 기록).
