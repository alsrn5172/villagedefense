# b/skill-hit-miss — 스킬 명중/회피 (MISS)

## 2026-10-06 — A #40 6005930861 "스킬 명중/회피는 B 가 계산한다"

> 스킬 경로에 `_DamageFormula:HitCheck(accuracy, attackerLevel, targetLevel)` 판정과 빗나갔을 때 `_DamageFormula:ShowMiss(defender)` 를 B 가 넣는다. A 쪽 변경은 없다.

**#183(`a/patch-1005` · 77b6f20) 위에 쌓았다** — 3인자 `HitCheck` 와 `ShowMiss` 는 #183 에만 있다(main `f4b76dd` 의 `HitCheck` 는 4인자 · `ShowMiss` 없음). #183 머지 뒤에 머지한다(B 가 main 을 합친다).

### 지금까지

- 기본 공격: `PlayerAttack.CalcDamage` → `StatService.CalcPlayerDamage` → `HitCheck` → 빗나가면 0 + (#183) `ShowMiss`.
- 스킬: 판정 없음 — `SkillAttack.CalcDamage` · `SkillProjectile.CalcDamage` 가 `SkillDatabase:DamageAt` 을 바로 불러 늘 맞았다.

### 바뀐 것 (B 파일 셋 · A 파일 변경 없음)

| 파일 | 내용 |
|---|---|
| `Skill/SkillDatabase.mlua` | `RollSkillHit(userId, defender, skillId)` — 기본 공격과 같은 식(`_DamageFormula:HitCheck`(명중 = StatService 원장 `final.accuracy` · 내 레벨 = `GetPlayerLevel` · 대상 레벨 = SpawnLevel > MonsterCatalog > 1)) · 빗나가면 `_DamageFormula:ShowMiss` · 로그 `[SkillHit] <스킬> HIT/MISS vs <대상> Lv<n> (acc · Lv · uid)` · 켜기/끄기 `SkillHitCheckEnabled`(기본 true) · `LogHitRolls`(기본 true) |
| `Skill/SkillAttack.mlua` | `IsAttackTarget` 이 다른 판정을 다 통과한 대상마다 `PassHitRoll` → `RollSkillHit`(패스당 대상마다 한 번). 빗나간 대상은 그 패스에서 안 맞는다. 연속 타격(`DealSequenceHit` · 피스트인레인지 10타)은 1타째 판정을 남은 타가 그대로 쓴다 |
| `Skill/SkillProjectile.mlua` | 같은 판정을 투사체마다 대상당 한 번(`_T.hitRolls` · 비행 중 틱마다 다시 굴리지 않게). 맞으면 사라지는 투사체는 빗나가도 사라진다(폭발 패스 제외) |

### 범위 (사용자 결정 2026-10-06)

- **굴리는 것**: 공격 스킬 — 대상마다 패스당 한 번(N타 한 패스 = 통째로 맞거나 빗나감 · 연속 타격도 시전당 한 번 · 투사체는 발마다 한 패스).
- **늘 명중**: 궁(Behavior ORIGIN) · 평값 패스(아이언 바디 반사 = 버프로 나는 피해). 소환 피해는 지금 없다.
- 빗나가면: 피해 0 이 아니라 **그 대상은 안 맞음** — 피해 숫자 · 크리 · 넉백 · OnAttack(impact · 명중음) · 픽파켓 동전 · 궁 합계 없음 · MISS 글자만(기본 공격과 같은 스킨 `DamageFormula.MissSkinId`).

### 남은 것 / 확인 못 한 것

- **Play 안 함.** 숫자 N12 · 모습 R32.
- 실행기가 따로 그리는 연출은 판정 전이라 빗나간 대상에도 나온다: 파워 스트라이크 접촉 순간 명중 그림 · 명중음, 피스트인레인지 펀치 impact · 1타 명중음 등. 바꿀지는 모습 확인 뒤.
- 엔진이 한 패스에서 같은 대상에 `IsAttackTarget` 을 두 번 부르면 판정도 두 번(MISS 두 번)이다 — N12 에서 `[SkillHit]` 줄 수로 확인.
- 볼리(더블 샷 등 발마다 1타)는 발마다 따로 굴린다 — 앞 화살이 빗나가도 뒤 화살은 따로 맞을 수 있다.
