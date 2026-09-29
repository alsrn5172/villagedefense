# a/farm-projectile-credit-v2 — 투사체 스킬 처치 보상·집계 귀속 (PR #123 · #119 대체)

base `main` 750cbbd · 2026-09-29 머지 검증 보고서(`메월드폴더/handoff/검증보고서-2026-09-29`) 후속 1번.

> #119(`a/farm-projectile-credit` · base 776ab4f)는 #117 이 먼저 머지되면서 `Lane/LaneFacility.mlua` 에서 충돌했다. 사용자 결정("머지된 뒤 새 브랜치로")대로 최신 main 에서 새로 따 #119 의 커밋 두 개를 옮겼다. **시설 파일은 main(#117) 그대로** — #119 의 시설 변경은 버렸다.

## 증상

에너지볼트(B `Skill/SkillProjectile`)로 죽인 몬스터가 `[FarmReward] … killed by non-player — 보상 없음`. A 쪽 피격 귀속이 `AttackerEntity.PlayerComponent` 만 봐서, 공격자가 투사체 엔티티(`SkillProj_<uid>_<skill>_n` · `CasterUserId` 보유)면 플레이어가 아닌 것으로 처리됐다.

- 사냥: 경험치 · 메소 동전 · 동전 소유권 · M1 처치 수(`MatchTallyService.OnMonsterKill`) · 도감 · 업적 카운터 전부 누락. 근접·반사(`DealFlatDamageToTarget` · 플레이어가 공격자)는 정상.
- 보스: `BossSpawner.OnBossHit` 누적 피해 원장에 투사체 피해가 안 쌓임 → 최다 피해 보상·도감 인정에서 불리.
- 시설: 같은 문제가 있었으나 **#117 이 이미 고쳤다**(`LaneFacility.ResolvePlayerAttacker` · 내 시설 무시 · 반사 대상까지).

## 바뀐 것

| 무엇 | 어떻게 | 파일 |
|---|---|---|
| 귀속 규칙 | 새 `@Logic` **`AttackCredit`** — `UserIdOf(attacker)`: 플레이어 엔티티 → 그 유저 · `attacker.SkillProjectile.CasterUserId` → 시전자 · 그 밖 "" · `IsPlayerAttack` | `Farm/AttackCredit.mlua` + codeblock(신규) |
| 사냥 보상·집계 | `LastHitter` → `CreditOf(LastAttacker)` · `HandleHitEvent` 누적 피해도 같은 귀속. `_AttackCredit` 이 없으면 예전 규칙(플레이어 엔티티만)으로 폴백 | `Farm/FarmReward.mlua` |
| 보스 누적 피해 | `OnBossHit` 원장 키 = `AttackCredit.UserIdOf` | `Boss/BossSpawner.mlua` |

B 파일은 읽기만(`SkillProjectile.CasterUserId` 속성). 계약서 변경 없음.

알려진 중복: "투사체 → 시전자" 해석이 `AttackCredit.UserIdOf`(유저 ID)와 `LaneFacility.ResolvePlayerAttacker`(플레이어 엔티티 · #117) 두 곳에 있다. 규칙은 같다. 합치는 건 이 PR 범위 밖.

## 검증

- 이 브랜치: LSP 3파일 깨끗 · `check-integrity` 통과.
- #119 에서 확인한 것(2026-09-29 · 개인 월드 Play 2판 · **같은 코드 · base 는 776ab4f**):

| 무엇 | 결과(로그) |
|---|---|
| 사냥 — 에너지볼트(SK_M11) 처치 | `[FarmReward] …SP001… lasthit=<uid> top=<uid> dmg=123 exp=8` · `[Summon] +exp 8` · `[Tally] kill <uid> n=1` · `[Coll] tier MONSTER 발견 (T1 at 1) exp+5` · `dropped 3 meso … for <uid>` · `[DropOwner] Meso owner=<uid> mine=true` (2건) |
| 사냥 — 근접(회귀) | 파워 스트라이크(SK_W11) `dealt … amount=168` → `[FarmReward] … lasthit=<uid> top=<uid> dmg=168 exp=8` · 아이언 바디 반사 처치도 같은 귀속 |
| 보스 — 누적 피해 원장 | 마노(2220000)에 에너지볼트 → `BossSpawner.dmg[<uid>]` 123 → 246 → 369 → 492 |

- 🟡 최신 main(#117 · #118 · #120 · #121 포함) 위에서는 아직 Play 로 안 봤다 — 사냥 처치 1회 재확인 예정.
- 못 본 것: 보스를 투사체로 끝까지 잡았을 때의 최다 피해 보상(원장까지만) · 다인 세션.
- 검증 중 발견한 계정 저장 실패(`LEA-3001`)는 #122 에서 고친다.
