# b/skill-magician-effects — 마법사 스킬 연출 정리 + 에너지볼트 폭발 판정 (B)

> Draft PR #100 `[b/skill-magician-effects] 마법사 스킬 연출 정리 + 에너지볼트 폭발 판정` · base `main`(`286f17a`). 이 브랜치의 조각 로그. 릴리스 때 `Docs/CHANGELOG.md` 로 합친다(협업-규칙 §11).
> 근거: 사용자 박승현 결정 2026-09-26 · 기획표(`Docs/추가기획1/기획 정리 ….md` 마법사 A "지정 위치 광역 공격" 140% → 220%) · 기획 확인(에너지볼트 = 처음 맞은 적 자리에서 폭발 · 최대 6명).
> 계약 변경 없음: 새 표 · 열 · 열거값 · 이벤트 없음. 폭발 범위 · 최대 대상 수는 코드 데이터(`SkillExecutors.effectOverrides.SK_M11.explode`). A 파일 편집 없음.

## 2026-09-26

### 에너지볼트(SK_M11) — 처음 닿은 적 자리에서 폭발 · 최대 6명

- `Skill/SkillProjectile.mlua`: 폭발형 투사체. `ExplodeSizeX/Y > 0` 이면 날아가는 상자(0.8 × 0.8)에 닿은 몬스터를 피해 없이 모으고(`TryExplode` · probe 패스), **첫 대상**(유도 대상이 닿았으면 그것, 아니면 볼트에서 가장 가까운 것) 발 기준 폭발 상자(중심 = 발 + `ExplodeCenterY`)를 한 번 더 모은 뒤 `Explode` 가 **첫 대상 + 폭발 중심에서 가까운 순으로 최대 `ExplodeMaxTargets` 명**만 `AttackFast` 로 때린다(`AllowedTargets` 필터 · `IsAttackTarget`). 피해 · 크리 · 픽파켓 · 명중 이펙트는 보통 명중과 같은 길(`CalcDamage` = `DamageAt` · `OnAttack`). 폭발 상자가 첫 대상 콜라이더에 안 닿으면(키 큰 몬스터) 닿았던 비행 상자로 첫 대상만 한 번 더. 볼트는 터지면 사라진다.
- 같은 층 판정(`SameFloorOnly`)은 폭발에도 그대로 — 아래층 몬스터는 폭발 상자 안이어도 안 맞는다.
- 명중 사운드는 폭발 한 번에 **한 번**(대상마다 같은 소리가 겹치지 않게). 명중 이펙트는 대상마다(원작처럼).
- 로그: `[SkillProjectile] EXPLODE SK_M11 first=… at (x,y) box 2x1.1 inBox=N firstInBox=… chosen=M/6 hit=H (uid)` + 맞은 대상마다 `EXPLODE hit #k …`. `SkillAttack: spawned projectile … explode=2x1.1@0.25 max=6`.
- `Skill/SkillAttack.mlua`: `SpawnProjectile` 마지막 인자 `table explode`(`{ sizeX, sizeY, centerY, maxTargets }`) → 첫 발 투사체에 넣는다(볼리 2발째부터는 VisualOnly 라 없음). 빈 표 = 예전처럼 닿은 것만(다른 투사체 스킬 그대로).
- `Skill/SkillExecutors.mlua`: `effectOverrides.SK_M11.explode = { sizeX 2.0, sizeY 1.1, centerY 0.25, maxTargets 6 }` · `GetProjectileExplode(skillId)` · `FireProjectile` 이 넘긴다.
- **폭발 범위 출처(임시값):** KMS 클라이언트 스킬 데이터 `Skill/200.img/skill/2001008/common` — `info/rectBasedOnTarget = 1`(맞은 적 기준 상자).
  - v359(리마스터 직전 · 우리가 쓰는 레드 팩과 같은 시기): `lt(-100,-80)` `rb(100,30)` = 200 × 110 px → **2.0 × 1.1 unit, 발 아래 0.3 ~ 위 0.8** ← 채택.
  - v360(2022-01-27 리마스터) ~ v389: `lt(-120,-75)` `rb(120,75)` = 2.4 × 1.5 unit.
  - 원작 `mobCount` 는 4 — 우리는 기획 확정 6.
  - 출처: `https://maplestory.io/api/wz/KMS/359/Skill/200.img/skill/2001008/common/lt` (· `/rb` · v360 · v389 같은 경로). 기획 반경 답(#40)이 오면 `explode` 값만 바꾼다.
- 피해는 기획표 그대로 140% → 220%(대상마다 같음 · `SkillInfo.csv` 변경 없음).

### 에너지볼트 명중 사운드

- `extraSounds.SK_M11.hit = ab4202ad4cac42a397a120a335bb038f` — 같은 레드 팩(`200.img/2001008`)의 `_audio/Hit`(쓰지 않던 것). 한 모습 규칙(같은 버전 부품).

## Play 체크 (예정 · 이 PR 본문에도 같은 표)

| # | 확인 | 기대 |
|---|---|---|
| E1 | 달팽이 1마리 · Q | `EXPLODE … inBox=1 chosen=1/6 hit=1` · 피해 = 예전과 같음(Lv5 220%) |
| E2 | 달팽이 8마리 한 무더기 · Q | `inBox=8 chosen=6/6 hit=6` · 6마리만 HP 감소 · 명중 이펙트 6개 · 사운드 1번 |
| E3 | 폭발 상자 크기 vs 명중 이펙트(hit/0 222×174 px) | 가장자리 달팽이가 맞는/안 맞는 위치를 눈으로 — 사용자 판단 |
| E4 | 아래층 달팽이 | 폭발 상자 안이어도 안 맞는다 |
| E5 | 앞에 아무도 없음 | 볼트가 직선으로 날아가 사라짐 · EXPLODE 로그 없음 |
| E6 | 가는 길에 다른 몬스터 | 유도 대상 전에 닿은 몬스터에서 터진다 |
| E7 | 다른 투사체(더블 샷 · 럭키 세븐 · 스나이핑) | `explode=none` · 예전과 같음 |
