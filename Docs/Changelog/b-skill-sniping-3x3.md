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

## 2026-10-05 2차 — 시전 시간 반 · 타당 피해 반 (A 요청)

| 값 | old → new | 파일 |
|---|---|---|
| 선딜(발사까지) | CSV `Duration` 1 → **0.5** · `projectileReleaseExtra.SK_A21` 0.15 → **0.075** → 발사 1.15 s → **0.575 s** (발사 자세 SK_A21_2 도 같은 시각 · `GetMotionSequence`) | SkillInfo.csv · SkillExecutors.mlua |
| 시전 락 | `castLockOverrides.SK_A21` 1.35 → **0.675** (= 발사 + 0.1 · 예전 발사 + 0.2) | Skill/SkillCaster.mlua |
| 조준 자세(활 당기기) | `WeaponMotion.csv` MOTION_SK_A21_BOW `PlayRate` 0.4 → **0.8** — **2배속**(잘라내지 않음 · 0.5 s 동안 끝까지 당긴다) · 발사 스냅(SK_A21_2 · 1.5배속)은 그대로 | WeaponMotion.csv(B 스킬 행) |
| 조준 연출 클립 · Use 소리 | `aim.delay` 0.43 → **0** — 클립 속도는 그대로(배속 안 함) · 클립 속 발사 섬광(≈0.567 s)이 새 발사 0.575 s 와 맞는다 | SkillExecutors.mlua |
| 타당 피해 | `BaseEffect` 300 → **150** · `EffectPerLevel` 50 → **25** (HitCount 3 그대로 → 대상당 합계 = 원래 1타의 1.5배) | SkillInfo.csv |

- 툴팁 "선딜 {v}초" 는 Duration 을 읽어 0.5 로 바뀐다(코드 변경 없음).
- 점검: LSP · `check-integrity` — 로그 `villagedefense-harness/pirate-check/after-maker-free/sniping-3x3-v2-*.txt`. **Play 안 함.**
- **겹쳐 쏘기(A 요청 3 · 사용자 선택 "락 0.675 그대로")**: 다음 시전을 막는 것은 모든 스킬에서 시전 락 하나뿐이다(클라 `castLockActive` · 서버 `castLockUntil` ×0.9 · 날아가는 투사체를 보는 게이트는 없다). 더블 샷 · 에너지볼트 · 럭키 세븐은 0~0.15 s 에 쏘고 락 0.4 s 가 끝날 때 투사체가 아직 날아간다 → 다음 시전이 겹친다. 스나이핑도 같은 방식 — 발사 0.575 s · 락 0.675 s(발사 + 0.1)라 화살(속도 20)이 2 유닛보다 먼 대상으로 날아가는 동안 다음 스나이핑이 나간다. 예전(발사 1.15 · 락 1.35)은 4 유닛보다 먼 대상일 때만 겹쳤다. 코드 추가 없음.
