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
- ✅ Maker Play 2판(2026-09-29 · 개인 월드에 이 워크트리 · Reimport All · 빌드 경고 이전 1 → 이후 1 · 로그 판독까지 · 눈 확인 아님):

| 무엇 | 결과(로그) |
|---|---|
| 사냥 — 에너지볼트(SK_M11) 처치 | `[FarmReward] …SP001… lasthit=<uid> top=<uid> dmg=123 exp=8` · `[Summon] +exp 8` · `[Tally] kill <uid> n=1` · `[Coll] tier MONSTER 발견 (T1 at 1) exp+5` · `dropped 3 meso … for <uid>` · `[DropOwner] Meso owner=<uid> mine=true` (2건) |
| 사냥 — 근접(회귀) | 파워 스트라이크(SK_W11) `dealt … amount=168` → `[FarmReward] … lasthit=<uid> top=<uid> dmg=168 exp=8` · 아이언 바디 반사 처치도 같은 귀속(`dmg=50362`) |
| 시설 — 3페이즈 전 | 남의 포탑(ELLINIA · FAKE_P2)에 에너지볼트 2발 · PHASE2 → 원장 60000 → 59988 (발당 6 = 123 × 0.05) |
| 시설 — 3페이즈 | 같은 포탑에 1발 · PHASE3 → 59988 → 59865 (123 전액) |
| 보스 — 누적 피해 원장 | 마노(2220000)에 에너지볼트 → `BossSpawner.dmg[<uid>]` 123 → 246 → 369 → 492 (보스 HP 938 → 446) |

- 못 본 것: 보스를 투사체로 끝까지 잡았을 때의 최다 피해 보상(원장까지만 확인) · 침범 안내 토스트(순차 무적에 막히는 상황을 만들지 않음) · 다인 세션.
- ⚠ 검증 중 발견(이 PR 범위 밖 · main 에 이미 있음): 계정 기록 자동 저장이 `LEA-3001 LuaTableToJsonType.UnknownType` 로 실패한다. `_HttpService:JSONEncode` 가 **빈 자식 표**(`boss = {}` · `d = {}` · `r = {}`)를 못 바꾼다(실험: `{ v = 1, r = {} }` 실패 · `{ v = 1 }` 성공). `AccountRecordData.SaveToDB` 에서 예외가 나 `PlayerDBManager.SaveForUser` 가 통째로 멈춘다 → 보스를 잡기 전·업적을 달성하기 전인 계정은 저장이 안 된다. 따로 고친다.
