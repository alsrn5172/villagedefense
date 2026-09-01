# 팩션(진영) 전투 시스템 — 구현 위치 맵

몬스터가 자동으로 움직이며 **몬스터끼리 싸우고**, 팀별 **포탑**이 주변에 버프/디버프 오라를 까는
시스템. 어느 기능이 어느 파일 어느 메서드에 있는지 정확히 짚어두는 문서다.
코드를 고치기 전에 여기서 위치부터 찾는다.

## 진영 규칙

| 관계 | 공격 | 버프 | 디버프 |
|---|:--:|:--:|:--:|
| 아군 (같은 팀) | ❌ 불가 | ✅ 받음 | ❌ |
| 적군 (다른 팀) | ✅ 가능 | ❌ | ✅ 받음 |
| 중립 | ❌ 불가 | ❌ | ❌ |

- 팀 종류: `TeamA` / `TeamB` / `Neutral`
- 플레이어는 **TeamA 소속** (맵 인스펙터의 `FactionAuraController.PlayerTeam`)
- 오라는 **포탑만** 낸다. 몬스터는 받기만 한다.
- 오라 판정 범위: **가로로 긴 직사각형** (원형 아님)

---

## ① 기능 → 위치 매핑 표

모든 경로는 `RootDesk/MyDesk/` 기준.

| 기능 | 파일 | 메서드 / 프로퍼티 | 비고 |
|---|---|---|---|
| **팀 태그 보유** | `Faction/Faction.mlua` | `Team` | 모델 값으로 팀 지정. 판정은 안 함 |
| **아군/적군/중립 판정** | `Faction/FactionLogic.mlua` | `GetRelation(a, b)` | **판정 규칙의 단일 진실 공급원.** 규칙 변경은 여기만 |
| 팀 문자열 조회 | `Faction/FactionLogic.mlua` | `GetTeam(entity)` | Faction 없으면 PlayerComponent 확인 → 없으면 중립 |
| 적 여부 단축 판정 | `Faction/FactionLogic.mlua` | `IsEnemy(a, b)` | |
| **플레이어 팀 결정** | `Faction/FactionLogic.mlua` | `PlayerTeam` | 실제 설정은 맵 인스펙터에서 (③ 참고) |
| **아군 공격 차단** | `Faction/FactionAttack.mlua` | `IsAttackTarget()` | 네이티브 훅. false = 대상 제외 |
| 중복타 방지 | `Faction/FactionAttack.mlua` | `IsAttackTarget()` + `SwingHits` | 그룹별 2회 호출 대비 |
| **공격력 버프 반영** | `Faction/FactionAttack.mlua` | `CalcDamage()` | `BaseDamage × Buff.AtkMul` |
| 공격 판정 발생 | `Faction/FactionAttack.mlua` | `DoAttack()` | Monster/Player 두 그룹에 각각 `Attack()` |
| **몬스터 이동 / 추격** | `Faction/FactionAI.mlua` | `OnUpdate()` | 매 프레임. ROAM/STAND/CHASE/ATTACK |
| 몬스터 적 탐색 | `Faction/FactionAI.mlua` | `FindNearestEnemy()` | 맵 자식 순회 (충돌그룹 비의존) |
| 넉백 중 이동 잠금 | `Faction/FactionAI.mlua` | `OnUpdate()` 최상단 게이트 | `MonsterHit.StaggerUntil` 참조 |
| **포탑 제자리 공격** | `Faction/TurretAI.mlua` | `OnUpdate()` | 이동 없음. IDLE / ATTACK 뿐 |
| 포탑 적 탐색 | `Faction/TurretAI.mlua` | `FindNearestEnemy()` | `AttackRange` 안에서만 |
| 포탑 조준 방향 | `Faction/TurretAI.mlua` | `FaceTo()` | `Scale.x` 부호 (FactionAttack 과 같은 규칙) |
| **무적시간 (i-frame)** | `Faction/MonsterHit.mlua` | `IsHitTarget()` | **방어자 쪽** 판정 |
| **피격 넉백** | `Faction/MonsterHit.mlua` | `HandleHitEvent()` | `Rigidbody:AddForce`. **바라보는 방향 반대**로 밀림. 포탑은 Body 가 없어 자동 skip |
| 버프 수치 보관 | `Faction/Buff.mlua` | `AtkMul` `SpeedMul` `DmgTakenMul` `RegenPerSec` | 계산 안 하고 저장만 |
| 원본 이동속도 보관 | `Faction/Buff.mlua` | `BaseSpeed` / `CaptureBaseSpeed()` | 배율 누적 폭주 방지 |
| **오라 소스 표식 + 표시** | `Faction/AuraEmitter.mlua` | 컴포넌트 존재 자체 | **이게 붙은 엔티티만 오라를 낸다** (= 포탑) |
| 오라 직사각형 크기 계산 | `Faction/AuraEmitter.mlua` | `ApplySize()` | 원본 크기에서 역산 + pivot 보정 |
| 스프라이트/클립 크기 읽기 | `Faction/AuraEmitter.mlua` | `LoadSpriteMetrics()` | sprite / animationclip 양쪽 지원 |
| **오라 계산 / 커밋** | `Faction/FactionAuraController.mlua` | `Tick()` | 0.25초 주기. **맵 루트에 부착** |
| 오라 소스 추출 | `Faction/FactionAuraController.mlua` | `CollectSources()` | `script.AuraEmitter` 보유자만 |
| 오라 대상 수집 | `Faction/FactionAuraController.mlua` | `CollectTargets()` | 팩션 엔티티 + 이 맵의 플레이어 |
| **이동속도 버프 반영** | `Faction/FactionAuraController.mlua` | `Commit()` | `InputSpeed = BaseSpeed × SpeedMul` |
| **HP 재생 / 지속 피해** | `Faction/FactionAuraController.mlua` | `ApplyRegen()` | 몬스터 `Monster.Hp` / 플레이어 `PlayerComponent.Hp` |
| 플레이어에 Buff 부착 | `Faction/FactionAuraController.mlua` | `EnsureBuff()` | 런타임 `AddComponent` (모델 무수정) |
| **받는 피해 배율** | `Monster.mlua` (기존 수정) | `HandleHitEvent()` | Buff 없으면 1.0 |
| HP / 사망 / 리스폰 | `Monster.mlua` (기존) | `Dead()` / `Respawn()` | 몬스터·포탑 공용 |

---

## ② 데이터 흐름

**공격 1회가 거치는 경로**
```
FactionAI.OnUpdate()  또는  TurretAI.OnUpdate()      적 발견 + 사거리 진입
  └▶ FactionAttack.DoAttack()                        공격 판정 시작 (2개 그룹)
       ├▶ FactionAttack.IsAttackTarget()              진영 필터 (아군·중립·자기자신 제외)
       │    └▶ FactionLogic.GetRelation()               ← 판정 규칙은 여기 하나뿐
       ├▶ FactionAttack.CalcDamage()                  공격력 버프 적용 (Buff.AtkMul)
       └▶ MonsterHit.IsHitTarget()                    무적시간 판정 (방어자 쪽)
            └▶ HitEvent 발생
                 ├▶ Monster.HandleHitEvent()           HP 차감 (Buff.DmgTakenMul 반영)
                 └▶ MonsterHit.HandleHitEvent()        넉백 + 경직 (포탑은 Body 없어 skip)
```

**오라는 위 흐름과 별개로 0.25초마다 독립적으로 돈다**
```
FactionAuraController.Tick()
  ├▶ CollectTargets()      몬스터 + 포탑 + 플레이어
  ├▶ CollectSources()      그중 AuraEmitter 보유자(포탑)만
  ├▶ 직사각형 판정          |dx| ≤ W/2  and  |dy − OffsetY| ≤ H/2
  ├▶ FactionLogic.GetRelation()   소스 × 대상 관계
  └▶ Commit()              Buff 커밋 + InputSpeed 반영 + ApplyRegen()
```

---

## ③ 튜닝 값 위치표

### 맵 인스펙터 — `map01` 엔티티 → Property → `FactionAuraController`

**여기가 오라 전체와 플레이어 팀의 설정 지점이다.**

| 값 | 현재값 | 의미 |
|---|---|---|
| **`PlayerTeam`** | `"TeamA"` | **플레이어 소속 팀** (공격 가능/불가 판정용) |
| **`AffectPlayer`** | `false` | **플레이어가 오라 영향을 받을지.** false = 버프·디버프 전혀 안 받음 |
| **`AuraWidth`** | `8.0` | 직사각형 가로 (소스 중심 ±4) |
| **`AuraHeight`** | `3.0` | 직사각형 세로 |
| **`AuraOffsetY`** | `1.0` | 직사각형 중심을 발밑에서 위로 올리는 양 |
| `TickInterval` | `0.25` | 재계산 주기(초) |
| `AllyAtkBonus` | `0.25` | 아군 1명당 공격력 +25%p |
| `AllySpeedBonus` | `0.15` | 아군 1명당 이동속도 +15%p |
| `AllyDmgTakenReduce` | `0.15` | 아군 1명당 받는 피해 −15%p |
| `AllyRegenPerSec` | `2.0` | 아군 1명당 초당 HP 회복 |
| `EnemyAtkPenalty` | `0.15` | 적군 1명당 공격력 −15%p |
| `EnemySpeedPenalty` | `0.1` | 적군 1명당 이동속도 −10%p |
| `EnemyDmgTakenIncrease` | `0.15` | 적군 1명당 받는 피해 +15%p |
| `EnemyDotPerSec` | `2.0` | 적군 1명당 초당 지속 피해 |
| `MinMultiplier` | `0.2` | 배율 하한 |
| `AuraLogInterval` | `2.0` | 검증 로그 주기(초). 0 이면 로그 끔 |

> ⚠ `FactionLogic.PlayerTeam` 을 직접 고치지 말 것. `FactionLogic` 은 `@Logic` 이라 엔티티에
> 붙지 않아 **Maker Property 패널에 뜨지 않는다.** 컨트롤러의 `OnBeginPlay()` 가 인스펙터 값을
> `_FactionLogic.PlayerTeam` 으로 밀어 넣는 구조다.

### 오라 그림 — `RootDesk/MyDesk/Models/Effects/AuraCircle.model`

| 값 | 현재값 |
|---|---|
| `SpriteRendererComponent.SpriteRUID` | `04170bdb50384b0c8adf7ed96c1dcf5a` (**animationclip**) |
| `SpriteRendererComponent.OrderInLayer` | `3` (지형 타일 위에 그려져야 보임) |

> 이름이 `AuraCircle` 이지만 실제로는 **가로로 긴 직사각형** 이펙트다. 초기 원형 시안의 이름이 남은 것.

### 오라 색 / 렌더 순서 — `RootDesk/MyDesk/Faction/AuraEmitter.mlua`

| 값 | 현재값 |
|---|---|
| `TeamAColor` | `Color(0.3, 0.65, 1.0, 0.75)` 파랑 |
| `TeamBColor` | `Color(1.0, 0.35, 0.3, 0.75)` 빨강 |
| `AuraOrderInLayer` | `3` |

### 포탑 — `RootDesk/MyDesk/Models/Structures/TurretA|B.model`

| 값 | 현재값 |
|---|---|
| `script.Monster.MaxHp` | `500` (몬스터 200보다 단단) |
| `script.Monster.RespawnOn` / `RespawnDelay` | `true` / `15초` |
| `script.Faction.Team` | `TeamA` / `TeamB` |
| `script.FactionAttack.BaseDamage` | `20` |
| `script.TurretAI.AttackRange` | `3.0` |
| `script.TurretAI.AttackCooldown` | `1.5` |
| `script.MonsterHit.ImmuneCooldown` | `0.4` |

### 몬스터 — `RootDesk/MyDesk/Models/Monsters/FactionMonsterA|B|N.model`

| 값 | 현재값 |
|---|---|
| `script.Monster.MaxHp` | `200` |
| `script.FactionAttack.BaseDamage` | `15` |
| `script.FactionAI.DetectRange` / `AttackRange` | `6.0` / `1.1` |
| `script.MonsterHit.KnockbackPower` / `KnockbackLift` / `StaggerDuration` | `2.5` / `1.0` / `0.25` |
| `MovementComponent.InputSpeed` | `1.2` |

---

## ④ 배치 현황 (`map/map01.map`)

지반 foothold y = −0.04 → 스폰 Y = **0.36**

| 엔티티 | 모델 | 팀 | x | 비고 |
|---|---|---|---|---|
| `TurretA` | `TurretA` | TeamA | **−5.54** | 맵 폭 0~10 중 **2 지점** |
| `TurretB` | `TurretB` | TeamB | **+4.64** | 맵 폭 0~10 중 **8 지점** |
| `TeamA_1~3` | `FactionMonsterA` (변형된 슬라임) | TeamA | −6.0 / −4.6 / −3.2 | |
| `Neutral_1` | `FactionMonsterN` (좀비버섯) | Neutral | 0.0 | |
| `TeamB_1~3` | `FactionMonsterB` (뿔버섯) | TeamB | 3.2 / 4.6 / 6.0 | |

- 맵 루트 `map01` 에 `script.FactionAuraController` 부착
- 좌표 계산: 맵 x 범위 `−8.93 ~ 8.03` (폭 16.96) → `2/10` = −5.54, `8/10` = +4.64

---

## ⑤ 사용자가 직접 결정 / 적용한 이력

**AI가 한 게 아니라 사용자가 직접 정하거나 Maker 에서 손댄 것들.** 나중에 "이건 왜 이렇게 됐지"를
추적할 때 여기부터 본다.

### 설계 결정

| 결정 | 내용 |
|---|---|
| 진영 구성 | **2팀 + 중립** (TeamA / TeamB / Neutral) |
| 버프 효과 | **4종 전부** — 공격력 · 이동속도 · 받는 피해량 · HP재생/지속피해 |
| 발동 방식 | **자동 오라** (범위 밖이면 자동 해제, 쿨타임 방식 아님) |
| 플레이어 소속 | **한 팀에 소속** → TeamA |
| 플레이어 강화 | **오라 영향 안 받음.** "플레이어는 강화 안 되어야 하는 게 맞음" — 진영 소속은 유지하되 버프/디버프에서 제외 |
| 플레이어 공격 규칙 | 플레이어도 **아군은 못 때린다.** 초기엔 `PlayerAttack` 에 진영 필터가 없어 TeamA 를 때릴 수 있었고, 사용자가 발견해 정정 |
| 넉백 방향 | **바라보는 방향의 반대** (공격자 위치 기준 아님) — 최초 구현을 사용자가 정정 |
| 오라 소유 주체 | **몬스터 → 포탑으로 이전.** "몬스터 하나가 이펙트를 갖고 있는 게 이상하다" |
| 포탑 위치 | 맵 폭을 **0~10 으로 나눈 2 / 8 지점** |
| 오라 모양 | **가로로 긴 직사각형** (원형에서 변경) |
| 판정 모양 | **표시만이 아니라 판정도 직사각형** |
| 포탑 역할 | **오라 + 공격** |
| 포탑 내구 | **공격 받고 파괴 가능** |

### Maker 에서 직접 작업한 것

| 작업 | 내용 |
|---|---|
| **좌우 벽** | 양쪽 끝에서 떨어지지 않도록 직접 그림. 타일 629 → **712**, foothold 34 → **69** |
| **SpawnLocation** | 위로 올림 → `y = 2.08` |
| **오라 스프라이트 RUID** | `AuraCircle.model` 의 `SpriteRUID` 를 직접 `c8cd9484...` 로 교체 |

> ⚠ **AI 가 `.map` 을 덮어써 사용자 편집분(SpawnLocation)을 한 번 날린 사고가 있었다.**
> 이후 규칙: `.map` 쓰기 전에 **반드시 "Maker 저장" 확인**을 받는다.
> `refresh` 도 디스크에서 다시 읽으므로 저장 안 된 편집을 날릴 수 있다.

### 사용자가 지정한 RUID 관련 정정

사용자가 지정한 `c8cd9484b6094f4caa0a6eb711966029` 는 **sprite 타입인데 화면에 아무것도 안 그려졌다.**
조회해 보니 `in_animationclip: 04170bdb50384b0c8adf7ed96c1dcf5a` — **멀티레이어 이펙트의 프레임 한 장**이었다.
같은 자산의 **animationclip RUID 로 바꾸니 정상 렌더링**되어 그 값을 쓰고 있다.
(가로 61 × 세로 30 px, 8프레임)

---

## ⑥ 이 시스템이 건드리지 않는 것

| 대상 | 이유 |
|---|---|
| `Global/` 전체 (`DefaultPlayer.model` 포함) | 읽기 전용 원칙. 플레이어 팀은 `FactionLogic.GetTeam()` 이 `PlayerComponent` 유무로 판정 |
| `PlayerAttack.mlua` | 기존 플레이어 공격 동작 유지 |
| `PlayerHit.mlua` | 기존 플레이어 무적시간 동작 유지 |

### 플레이어는 오라 영향을 받지 않는다 — 설계 결정

**사용자 결정: "플레이어는 강화 안 되어야 하는 게 맞음".**
`FactionAuraController.AffectPlayer = false` 로 플레이어를 오라 **대상 목록에서 제외**한다.

| 항목 | 플레이어 |
|---|---|
| 공격력 / 이동속도 / 받는 피해 / HP재생 | ❌ 전부 안 받음 |
| 진영 소속 (`TeamA`) | ✅ 유지 |
| 아군 공격 차단 / 적군 공격 가능 | ✅ 그대로 적용 |

검증(런타임 조회): `targets` 10 → **9**, 플레이어에 `Buff` 컴포넌트 없음,
`InputSpeed = 1.0`(기본값), `TeamA_1 공격가능=false` / `TeamB_1 공격가능=true`.

> 디버프만 받게 하고 싶어지면 `AffectPlayer = true` 로 켠 뒤
> `Commit()` 에서 배율이 1.0 을 넘는 항목만 걸러내면 된다.

---

## ⑦ 알아둘 함정 (다시 안 밟기 위해)

| 함정 | 내용 |
|---|---|
| **내장 AI 금지** | `AIChaseComponent` / `AIWanderComponent` 는 매 프레임 Body 속도를 덮어써 커스텀 이동을 뭉갠다. 또 플레이어만 추격해 몬스터끼리 싸울 수 없다 |
| **히트박스 중복 금지** | `script.MonsterHit` 이 `HitComponent` 를 상속하므로 `MOD.Core.HitComponent` 를 같이 넣으면 안 된다. 히트박스 값도 TargetType 을 `script.MonsterHit` 으로 |
| **넉백이 안 보이는 이유** | AI가 매 프레임 `MoveToDirection` 을 호출하면 `AddForce` 가 즉시 덮어써진다. 경직 구간엔 `MoveToDirection` **과 `Stop()` 둘 다** 건너뛴다 |
| **방향 판정 규칙 통일** | 바라보는 방향은 `Scale.x` 부호로만 읽는다. **`Scale.x < 0` = 오른쪽**. `FactionAI.FaceTo` / `TurretAI.FaceTo` / `FactionAttack.DoAttack` / `MonsterHit.HandleHitEvent` 가 같은 규칙을 쓴다 |
| **오버라이드 `@ExecSpace` 금지** | `IsAttackTarget` / `IsHitTarget` / `CalcDamage` 는 부모에 `@ExecSpace` 가 없다. 붙이면 `LEA-3014 SignatureMismatch` |
| **오버라이드 반환 타입** | `CalcDamage` 는 `integer`, `GetCriticalDamageRate` 는 `float` |
| **주석 위치** | mlua 는 선언 **위** 주석을 이전 선언에 묶는다. 메서드 설명은 **본문 첫 줄** |
| **무적시간은 방어자 쪽** | 공격자 쪽에 두면 공격자마다 쿨타임이 따로 돌아 다구리에서 무력화된다 |
| **스크립트 등록 순서** | `.mlua` 작성 → `refresh`(`.codeblock` 생성) → 그 다음 `.model` 에 `script.*` 포함 → `refresh` |
| **sprite vs animationclip** | `SpriteRUID` 는 둘 다 받지만 **멀티레이어 이펙트의 프레임 한 장을 sprite 로 쓰면 아무것도 안 그려진다.** 크기를 읽는 API 도 다르다 (`LoadSpriteAndWait` vs `LoadAnimationClipAndWait().Frames[1].FrameSprite`) — `AuraEmitter.LoadSpriteMetrics()` 가 둘 다 처리 |
| **오라 알파** | `0.35` 로는 배경에 묻혀 사실상 안 보였다. `0.75` 정도는 되어야 읽힌다 |
| **`AuraOffsetY` 를 `AuraHeight/2` 로 두지 말 것** | 띠의 아래 경계가 정확히 발밑(dy=0)에 놓여, 지면 몬스터가 `|0 − offset| == halfH` 경계에 걸린다. 부동소수점 때문에 판정 탈락 → **아무도 버프를 못 받는다**(실제로 겪음) |
| **오라 렌더 순서** | `OrderInLayer` 가 낮으면 지형 타일 뒤로 그려져 안 보인다. `3` 이상으로 |

---

## ⑧ 알려진 미해결 경고

### ~~`LWA-3019` (StateComponent)~~ — **2026-08-19 해결**

`StateComponent.IsLegacy` 기본값(`true`) 때문에 몬스터 전체에 반복 출력되던
`NotRecommendedValue : Legacy 기능은 더 이상 지원하지 않으므로...` 경고.

**해결**: 몬스터·포탑 모델 10개 + `map01/02/03` 인스턴스 27개에 `StateComponent.IsLegacy = false` 적용.

예전엔 "파이프라인이 켜지면 `FactionAI` 의 직접 대입과 충돌한다"는 이유로 보류했는데, 실제로 대조해 보니
**ActionSheet 의 stand/move/attack/die RUID 가 `FactionAI`/`TurretAI` 가 대입하는 RUID 와 전부 동일**해서
충돌이 성립하지 않았다(파이프라인이 켜져도 같은 클립을 재생한다). 게다가 파이프라인은 `StateChangeEvent`
에만 반응하므로, 상태 전이가 없는 ROAM/전진 중에는 스크립트 대입을 건드리지 않는다.

검증(플레이): 경고 0건, 런타임 에러 0건, `TeamB_1` 이 `state=IDLE` 인데 `sprite=move RUID` 로
스크립트 대입이 그대로 유지됨. 포탑 `stand` 정상. 팩션 몹 사망·제거 정상.

> 부수 효과(개선): 포탑은 ActionSheet 에 `hit` 키가 있어 피격 시 hit 클립이 재생된다(이전엔 무시됨).
> `MonsterHit.IsLegacy` 는 원래부터 `false` 로 잘 설정돼 있어 추가 작업 없음.

### ~~`LWA-4012 ModelComponentPropertyValueTypeMismatch`~~ — **2026-08-19 해결**

`모델에서 'X' 의 프로퍼티 'Y' 의 값이 올바르지 않습니다` = **`.model` 의 `ValueType` 서술자가 실제
프로퍼티 타입과 다르다**는 뜻(값 자체는 맞아도 경고). 두 건 다 `ModelBuilder.value()` 의 `typeKey` 실수였다.

| 대상 | 잘못된 타입 | 올바른 타입 | 근거 |
|---|---|---|---|
| `script.FarmReward.MonsterId` (mlua `integer`) | `System.Int32` (`typeKey:"int"`) | **`System.Int64`** (`typeKey:"long"`) | 같은 mlua `integer` 인 `ExpAmount`/`CoinMin` 이 Int64 로 저장돼 있고 경고가 없었다 |
| `SpriteRendererComponent.DrawMode` (`SpriteDrawMode` **enum**) | `System.Int32` | **`MOD.Core.SpriteDrawMode, MOD.Core, Version=26.7.0.0, ...`** | 엔진 저작 모델이 enum 을 이렇게 직렬화한다(`ClimbableType`, `AlignmentType` 동일 패턴). 값은 정수 그대로 |

⚠ **`typeKey:"integer"` 를 쓰면 안 된다** — 빌더가 `"int"`(Int32)로 정규화해 같은 경고가 난다. `"long"` 을 명시할 것.
⚠ enum 은 `typeKey` 목록에 없지만, 빌더는 **모르는 typeKey 를 타입 문자열로 그대로 사용**하므로 위 전체 문자열을 넘기면 된다.

검증: 4개 모델 재기록 후 refresh — 새 경고 미발생(빌드 콘솔의 기존 항목은 `clear_logs` 로 안 지워져 남아 있음),
런타임 `MonsterId=1001 exp=1 coin=1~1` 정상, 발판 타일링 그대로 유지.

### ~~`LWA-3048 DuplicateComponent` (포탑)~~ — **2026-08-19 재현 안 됨(해결로 판단)**

과거 기록:
```
엔티티 'TurretA'에 'Monster'이 이미 존재하지만 'AuraEmitter'가 추가됐습니다.
향후 추가되지 않도록 변경될 예정입니다.
```

**2026-08-19 조사 결과: 더 이상 발생하지 않는다.** 오라 경로를 전부 실행시킨 새 플레이 세션에서
`3048` / `Duplicate` / `이미 존재` 로그가 **0건**이었다(빌드 콘솔에도 없음 — 그 콘솔은 과거 항목을
보관하므로, 이번 세션 내내 한 번도 발생하지 않았다는 뜻).

같은 세션에서 오라가 정상 동작한 증거:
```
[AuraEmitter] TurretA rect=8.0 x 3.0 native=0.61 x 0.30 ny=0.200 offsetY=1.00 localY=0.10
[AuraEmitter] TurretB rect=8.0 x 3.0 ...
[Aura] targets=9 sources=2 affected=6 | TeamA_1 atk=1.25 spd=1.15 ...
```

조사 과정에서 확인한 것(향후 재발 시 출발점):
- 포탑 모델·맵 인스턴스 12개 컴포넌트에 **타입 중복 없음**. 네이티브 `HitComponent`/`AttackComponent` 를
  `script.MonsterHit`/`script.FactionAttack` 와 같이 넣는 함정도 피해 있다.
- `LWA-3048` 의 일반적 의미는 **"같은 네이티브 베이스에서 파생된 컴포넌트 2개가 한 엔티티에 공존"**
  (예: 네이티브 `PlayerControllerComponent` + 그 서브클래스를 둘 다 붙임 → 하나로 **교체**해야 함).
- 메시지 문구("X가 이미 존재하지만 Y가 추가됐습니다")는 **런타임 `AddComponent`** 경로를 가리킨다.
  현재 유일한 런타임 추가는 `FactionAuraController:EnsureBuff()` 의 `AddComponent("Buff")` 인데,
  **`GetComponent("script.Buff")` 가드로 이미 있으면 조기 반환**한다. 포탑 모델에는 `script.Buff` 가
  들어 있어 애초에 추가 시도가 없다 → 이 경로에서 경고가 날 수 없다.
- 참고: `AuraEmitter` 는 오라 그림을 `SpawnByModelId(..., parent = self.Entity)` 로 **포탑의 자식 엔티티**
  로 스폰한다(컴포넌트 추가가 아니라 자식 생성이라 중복과 무관). 다만 프로젝트 규칙상 `parent` 는
  맵 엔티티를 넘기는 것이 표준이므로, 이 부분은 의도된 예외로 기억해 둘 것.

### 포탑 y 좌표 표기 차이 — 영향 없음

맵 파일엔 `y = 0.36` 으로 기록돼 있고 런타임 조회도 `0.360` 으로 일치한다.
(중간에 `0` 으로 읽힌 적이 있었으나 이후 재확인에서 정상)
