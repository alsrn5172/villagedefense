# b/skill-taunt-floor — 도발: 끌어온 몬스터를 발판에 · 미니언은 안 끌기

## 2026-10-06 — A 요청 (사용자 승인)

1. 도발(SK_W22)이 끌어온 몬스터를 도착 자리에서 가장 가까운 발판(위 · 아래)에 놓아 더는 떨어지지 않게.
2. 미니언은 도발로 끌지 않는다.
도발의 다른 것(반경 · 지속 · 대상 전환 · 보스 제외 · 간격 0.6 · 연출 · 소리)은 그대로.

### 원인

- 끌어온 자리 = (시전자 x ± 0.6 × ceil(i/2), **시전자 발 높이**) 그대로 `RigidbodyComponent:SetWorldPosition`. 시전자 옆이 절벽 밖이거나 틈 · 다른 높이면 발판이 없는 허공에 놓여 떨어졌다.
- 미니언(레인 유닛 · `script.MinionUnit`)도 적 진영이면 같은 상자 안 후보라 끌려왔다.

### 바뀐 것 (`Skill/SkillExecutors.mlua` · B 파일 하나)

| 곳 | 내용 |
|---|---|
| `ExecuteTaunt` | 미니언(`mob.MinionUnit` 이 있음 · `FactionAttack:119` · `TurretAI:163` · `LaneStateService:938` 과 같은 판정 · 파병 유닛 포함)은 끌지 않는다 · 로그 `TAUNT skip pull <name> (minion)`. 끌어온 자리는 `TauntLandingPoint` |
| `TauntLandingPoint(map, x, y, casterX)` 새 | ① x 에서 위 · 아래 `TauntFloorSearch`(3) 안의 가로 발판 중 높이가 y 에 가장 가까운 것 ② 없으면(절벽 밖 · 틈) 가장 가까운 가로 발판의 안쪽으로 x 를 당겨 그 위 ③ 그것도 없으면 시전자 자리. 세로 발판(벽) 제외. 로그 `TAUNT land (x,y) -> floor y=… (dy …)` |
| `TauntFloorSearch` 새 속성 | 3 (world unit) |

- 미니언은 `StateChaseMonster` 가 없어 예전에도 대상 전환(추격 고정)은 걸리지 않았다 — 끌기만 빠진다. 도발 연출 클립(`PlayMobEffect`)은 미니언에도 예전처럼 붙는다.
- **Play 안 함** — 숫자 N13 · 모습 R34.
