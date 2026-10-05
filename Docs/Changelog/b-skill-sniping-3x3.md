# b/skill-sniping-3x3 — 스나이핑 3타 · 가까운 3명 (A 요청 · #171 위)

## 2026-10-05

요청(A · 기획): 스나이핑 = 3타(타당 피해는 지금 그대로 → 합계 ×3) · 앞쪽 가까운 3명. #171(투사체 조준 v2 · 몸 띠)의 `SkillAttack.SpawnProjectile` 조준 자리를 같이 고쳐야 해서 #171 head `3de1d45` 위에 만든다 — **#171 머지 뒤에 연다.** 근접 4종은 `b/skill-balance-x3`(main 기준).

| 파일 | 내용 |
|---|---|
| `RootDesk/MyDesk/SkillInfo.csv` | SK_A21 `HitCount` 1 → **3** · 설명(단일 대상 → 앞쪽 가까운 적 3명에게 각각 3번) · #Note 꼬리 |
| `RootDesk/MyDesk/Skill/SkillExecutors.mlua` | `projectileTargetCount = { SK_A21 = 3 }` · `FireProjectile`: 앞쪽 상자(Range 10 × AimSearchHeight · 몸 띠) 안 가까운 순 3명에게 화살 한 발씩(`PendingProjectileTarget` · `PendingProjectileSingleArrow`) · 대상이 없으면 예전처럼 한 발(바라보는 방향) · 로그 `PROJECTILE SK_A21 multi-target N/3 x3 hits each` |
| `RootDesk/MyDesk/Skill/SkillAttack.mlua` | `PendingProjectileTarget` · `PendingProjectileSingleArrow`(다음 SpawnProjectile 한 번에만 · 읽고 비움) · `FindSkillTargetsNearest(skillId, shape, count)` — FindSkillTarget 과 같은 거름(몸 띠 · 뒤쪽 제외) · 가까운 순 · 보스 우선 없음 |

- 발마다 피해: 지금 경로 그대로 — 첫 발 ×HitCount · 표시 HitCount 타(= 타당 DamageAt × 3 · 숫자 3개). 2발째 VisualOnly 화살은 띄우지 않는다(한 대상에 화살 한 발). 유도 대상만 맞음(HomingTargetOnly) · 선딜 1.15 s · 조준 연출 · 소리 그대로.
- 바뀐 점: 예전 = 보스 우선 한 명 → 지금 = 가까운 순 3명(보스도 가까우면 포함). 대상이 없을 때의 한 발만 보스 우선 조준을 그대로 쓴다.
- 점검: LSP · `check-integrity` — 로그 `villagedefense-harness/pirate-check/after-maker-free/sniping-3x3-*.txt`. **Play 안 함** — RELOOK R31 · 숫자 N11.
