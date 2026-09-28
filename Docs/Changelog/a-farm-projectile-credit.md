# a/farm-projectile-credit — 투사체 스킬 처치 보상·집계 귀속 (PR #119)

base `main` 776ab4f · 2026-09-29 머지 검증 보고서(`메월드폴더/handoff/검증보고서-2026-09-29`) 후속 1번.

## 증상

에너지볼트(B `Skill/SkillProjectile`)로 죽인 몬스터가 `[FarmReward] … killed by non-player — 보상 없음`. A 쪽 피격 귀속 세 곳이 전부 `AttackerEntity.PlayerComponent` 만 봐서, 공격자가 투사체 엔티티(`SkillProj_<uid>_<skill>_n` · `CasterUserId` 보유)면 플레이어가 아닌 것으로 처리됐다.

- 사냥: 경험치 · 메소 동전 · 동전 소유권 · M1 처치 수(`MatchTallyService.OnMonsterKill`) · 도감 · 업적 카운터 전부 누락. 근접·반사(`DealFlatDamageToTarget` · 플레이어가 공격자)는 정상.
- 보스: `BossSpawner.OnBossHit` 누적 피해 원장에 투사체 피해가 안 쌓임 → 최다 피해 보상·도감 인정에서 불리.
- 시설: `LaneFacility.HandleHitEvent` 가 투사체를 플레이어 공격으로 안 봐서 **3페이즈 전 저항(PlayerDamageMulBeforePhase3)을 투사체로는 피할 수 있었고**, 침범 안내도 안 나갔다.

## 바뀐 것

| 무엇 | 어떻게 | 파일 |
|---|---|---|
| 귀속 규칙 한 곳 | 새 `@Logic` **`AttackCredit`** — `UserIdOf(attacker)`: 플레이어 엔티티 → 그 유저 · `attacker.SkillProjectile.CasterUserId` → 시전자 · 그 밖 "" · `IsPlayerAttack` | `Farm/AttackCredit.mlua` (신규 · `.codeblock` 은 Maker 검증 때 생성해 커밋) |
| 사냥 보상·집계 | `LastHitter` → `CreditOf(LastAttacker)` · `HandleHitEvent` 누적 피해도 같은 귀속. `_AttackCredit` 이 없으면 예전 규칙(플레이어 엔티티만)으로 폴백 | `Farm/FarmReward.mlua` |
| 보스 누적 피해 | `OnBossHit` 원장 키 = `AttackCredit.UserIdOf` | `Boss/BossSpawner.mlua` |
| 시설 피해 | `isPlayer` = 귀속 유저가 있는가 · 침범 안내는 그 유저에게 | `Lane/LaneFacility.mlua` |

B 파일은 읽기만(`SkillProjectile.CasterUserId` 속성). 계약서 변경 없음(새 표·열·이벤트·저장 없음 · Logic 은 내부 헬퍼).

## 검증

- LSP 4파일 깨끗 · `check-integrity` 전부 통과(경고 3 = 기존 박제 NPC).
- 🟡 Maker Play(개인 월드에 이 워크트리 · Reimport All): 마법사 에너지볼트로 달팽이 처치 → `[FarmReward] … lasthit=<uid> top=<uid>` · `[Tally] kill … n=1` · `[Coll] tier …` · 동전 `[DropOwner] Meso owner=<uid>` 확인 예정. 근접 처치(회귀 없음)도 한 번.
