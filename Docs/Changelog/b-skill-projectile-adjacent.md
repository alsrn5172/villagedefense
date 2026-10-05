# b/skill-projectile-adjacent — 바로 앞 대상에게 투사체가 너머에서 생기지 않게

> #115(`b/skill-thief-effects` `d44fb76`) 위에서 만들었다. #115 머지(2026-10-04) 뒤 main `6519369` 을 합쳐 Draft PR 로 열었다.

## 1차 — 투사체 스폰을 대상 앞에서 끊기 (2026-10-03 · 사용자 지시 · 도적 창에서 넘겨받음)

| 무엇 | 어떻게 |
|---|---|
| 조사 | 넘겨받은 설명은 "대상 탐색이 플레이어와 스폰 지점 사이의 몬스터를 빠뜨린다" 였다. 코드상 아니다: `SkillAttack.SpawnProjectile` 의 탐색 상자는 시전자 발에서 앞으로 Range(`posX = casterX + dir·Range/2` · `sizeX = Range`)라 그 사이 몬스터도 후보다. 도적 창 Play(`thief-check/run-1003`)의 "R1 x 0.13 < spawnX 0.18 → R2 조준" 은 킷 배치값(x0+2.0)으로 계산한 R1 위치이고, 그 전 타격의 넉백(0.2씩 오른쪽)으로 R1 이 R2 너머로 밀린 뒤라 R2 가 실제로 가장 가까웠을 수 있다(같은 실행 뒤쪽에 `T115R1 x=0.35`). 로그 `FindSkillTarget SK_T11 candidates=5` 에 R1 도 들어 있었다 |
| 실제로 고친 것 | 대상이 스폰 오프셋보다 가까우면 투사체를 대상 너머에 만들지 않는다 — `ox = max(0, 대상까지 앞쪽 거리)`. 볼리 2발째도 같은 값. 로그 `SkillAttack: projectile <스킬> spawn pulled back to the target — <이름> is <d> ahead (offset <원래> -> <새 값>)` |
| 영향 받는 투사체 | 같은 `SpawnProjectile` 를 쓰는 넷: 럭키 세븐 SK_T11(오프셋 0.95 — 붙어 선 몬스터 너머에서 생겨 되돌아 날던 것이 없어짐) · 에너지볼트 SK_M11(0.41) · 더블 샷 SK_A11 · 스나이핑 SK_A21(기본 0.5). 뒤의 셋은 판정 상자(0.8)가 스폰 때부터 붙어 선 대상과 겹쳐 맞는 결과는 같고, 대상이 0.41 / 0.5 보다 가까울 때만 스폰 자리가 조금 당겨진다 |
| 안 바꾼 것 | 탐색 상자(시전자 발부터 앞으로 Range) · 플레이어 몸과 겹친 채 발 뒤에 선 몬스터는 여전히 후보가 아니다(바꾸려면 상자를 뒤로 조금 늘려야 함 — 결정 필요) |

검사: 스크립트 검사 0 오류 / 0 경고 · `check-integrity.cjs` 통과.

Play 확인(아직 안 함): 도적 Lv30 · 달팽이를 앞 0.3 에 한 마리 · 앞 1.5 에 한 마리(넉백 전 첫 시전) → `FindSkillTarget SK_T11 … -> <0.3 달팽이>` · `spawn pulled back … is 0.30 ahead (offset 0.95 -> 0.30)` · 그 달팽이에 두 발 모두 명중 · 표창이 되돌아 날지 않음 / 앞 1.5 만 있으면 pulled back 줄 없음(오프셋 0.95 그대로) / 에너지볼트 · 더블 샷 붙어 선 대상 회귀.

## 2026-10-04 — main 병합 · Draft PR · A 답 반영

- main `6519369`(#100 · #115 · #116 머지) 병합 `18fd142` — 충돌 없음 · 스크립트 검사 0 오류 / 0 경고(SkillAttack info 15 = #100 줄) · `check-integrity` 통과.
- **탐색 범위는 앞쪽만 그대로** — A [#40 5957804369](https://github.com/alsrn5172/villagedefense/issues/40#issuecomment-5957804369) "안늘림"(질문 5957719766 "조준 범위를 플레이어 뒤쪽으로 조금 늘려야 하는가?"의 답). 위 "안 바꾼 것" 줄이 그대로 확정이다.
- Play 확인은 통합 Play 런시트 `smallprs-check/RUN-combined-1003.md` §F2 A1 ~ A5.

## 2026-10-05 — 뒤쪽 대상은 당기지 않고 버린다 (로컬 · push 전)

| 무엇 | 어떻게 |
|---|---|
| 증상 (Play · 로그) | `FindSkillTarget` 가 시전자보다 살짝 **뒤**의 달팽이를 고를 때가 있다(로그 `ADJnearR is -0.18 ahead` 왼쪽 보기 · `-0.08 ahead` 오른쪽 보기). 1차 규칙이 `ox = max(0, ahead) = 0` 으로 당겨 투사체가 시전자 몸에서 생기고, 판정 상자가 뒤 달팽이와 겹쳐 **뒤 달팽이가 맞는데 그림은 앞으로 날아갔다**. 더블 샷 14번 중 6번 |
| 고친 것 (사용자 결정) | `SkillAttack.SpawnProjectile`: `ahead < 0` 이면 당기지 않고 `target = nil` — 오프셋은 원래 값, 바라보는 방향으로 곧게 쏜다. 그 아래 수명(`HomingLifetimeMul` 안 곱함) · `SetTarget`(안 부름) · 볼리 2발째(`t2 = nil`) · 마지막 `spawned projectile … target=none` 로그가 전부 대상 없음으로 간다. `ahead >= 0` 은 1차 규칙 그대로. 로그 `SkillAttack: projectile <스킬> target <이름> is <d> behind — dropped (straight shot · offset <ox>)` |
| 두 번째 경로 | 같은 당김이 다른 곳에는 없다 — 투사체 스폰은 `SpawnProjectile` 한 곳(볼리도 그 안 타이머). `SkillExecutors` 의 `spec.offsetX` 들은 이펙트 자리일 뿐 |

검사: 스크립트 검사 0 오류 / 0 경고 · `check-integrity.cjs` 통과.

Play 재확인(아직 안 함): 에너지볼트 · 더블 샷 · 럭키 세븐 · 달팽이 세마리 · 플레임 헤이즈 — 각각 달팽이를 바로 앞에 한 마리 · 바로 뒤에 한 마리 두고 양쪽 방향으로 시전 → 뒤 달팽이가 골라지면 `… behind — dropped` 줄 · 뒤 달팽이는 안 맞고 투사체가 앞으로 날아 앞 달팽이가 맞는다 / 앞 달팽이만 골라지면 1차 규칙(`pulled back` 줄) 그대로.
