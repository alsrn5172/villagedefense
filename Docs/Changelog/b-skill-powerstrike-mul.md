# b/skill-powerstrike-mul

## 2026-09-24 — 파워 스트라이크가 표의 2배로 들어가던 것 수정 (`BeginPass` 클램프)

PR #83. PR #81(`GetAttackPower` → `_StatService`) 검증 중에 발견했다.

**헤더 변경 없음 · 새 CSV 열 없음 · 새 이벤트 없음 · 새 RPC 없음.** `Docs/스키마-계약.md` 는 건드리지 않았다.

### 원인

`Skill/SkillAttack.BeginPass`(`:133`)의 가드가 **1 미만 배율을 1 로 올렸다.**

```lua
if mul == nil or mul < 1 then mul = 1 end   -- 0.5 → 1
```

`CalcDamage`(`:198`)는 `DamageAt × PendingDamageMul` 이므로, 파워 스트라이크 2단 콤보가
`strike(1, 0.5)` / `strike(2, 0.5)`(`SkillExecutors.mlua:2171`·`:2193`)로 넣는 0.5 가 둘 다 1 이 되어
**한 시전에 `DamageAt` 2회분**이 들어갔다. 표의 "두 타의 합 = 150%"(`SkillExecutors.mlua:2136`)가 300% 로 나간 셈이다.

- 클램프 자체는 `45a744e`(2026-09-12) 에 들어왔다. 그때 `mul` 은 N타 배율이라 **항상 ≥ 1** 이었으므로 맞는 가드였다.
- 1 미만을 처음 넘긴 호출부가 `6c2c31a`(2026-09-13 · 파워 스트라이크 2단 콤보)다. **2026-09-13 부터 2배**였다.
- 같은 인자를 받는 `DealSkillDamageToTargetScaled`(`:395`)는 이미 `mul <= 0` 으로 제대로 걸렀지만,
  바로 뒤 `BeginPass` 가 다시 1 로 올려 무의미했다.

### 수정

두 줄. 1 미만도 그대로 쓰고 `<= 0` 만 1 로 바꾼다.

| 위치 | 변경 |
|---|---|
| `SkillAttack.BeginPass` (`:133`) | `mul < 1` → `mul <= 0` — 실제 수정 |
| `SkillAttack.DealSkillDamageCircleScaled` (`:356`) | `mul < 1` → `mul <= 0` — 기준 통일. 현재 호출부는 전부 `n`·`hits` ≥ 1 이라 **동작 변화 없음** |

호출부(`strike(1, 0.5)` / `strike(2, 0.5)`)와 CSV 값은 그대로 뒀다.

### 🔴 밸런스 — 파워 스트라이크 피해가 절반이 된다

고치면 `SK_W11` 이 **표대로** 들어간다. 즉 지금 대비 **절반**이다. PR #81 과 **겹친다**:

| | 공격력 출처 | `SK_W11` lv1 1시전 (Lv10 맨손) |
|---|---|---|
| 지금 (`main`) | `JobTier.BaseAttack` 75 | `DamageAt` 112 × 2 = **224** |
| #83 만 머지 | 75 | **112** |
| #81 만 머지 | `_StatService` 19 | 28 × 2 = **56** |
| **#81 + #83 둘 다** | `_StatService` 19 | **28** |

몬스터 HP·웨이브를 손대기 전에 A 가 **두 PR 을 같이** 놓고 판단해야 한다(#81 본문에도 적어 뒀다).

### Play 검증 (2026-09-24 · Maker MCP · `Orbis_Lobby_VictoriaStation`)

**빌드 경고: 1 before → 1 after** (기존 `LWA-1111` · 에러 0). `refresh → logs(build) → clear_logs → play`.

**① 파워 스트라이크 — 수정 확인.** 전사 Lv10 · `SK_W11` Lv1 · 정지 더미 HP 1000 · 1회 시전:

```
PS SETUP  dummyHp=1000.0  DamageAt(SK_W11,1)=112  statAtk=19
SkillAttack: dealt SK_W11 to PSDummy lv=1 mul=0.5 display=1   ← hit1
SkillAttack: dealt SK_W11 to PSDummy lv=1 mul=0.5 display=1   ← hit2
PS RESULT hp=888.0/1000 damage=112.0 expected=DamageAt=112
```

두 패스가 **다 맞은** 상태에서 `112` = `DamageAt` 1회분. 수정 전에는 같은 조건에서 2배였다
(#81 브랜치 실측: `DamageAt=28` 에 `damage=56`, 패스 하나만 맞아도 전액 28).

> 이 브랜치는 `main` 기준이라 `GetAttackPower` 가 아직 `JobTier` 75 → `DamageAt` 112 다. #81 이 머지되면 같은 시전이 28 이 된다.

**② `DealSkillDamageCircleScaled` 쓰는 N타 스킬 — 그대로.** 해적/3차 Lv30 · `SK_P31` 함포 사격 · 더미 HP 1,000,000:

```
BARRAGE SK_P31 scheduled 6 waves x5(+0) hits
dealt SK_P31 circle r=8 ... mul=5 display=5     ← 6파 전부 동일
BR RESULT2 hp=996640.0/1000000 damage=3360.0  DamageAt(SK_P31,1)=112
```

`3360 = 6파 × 5 × 112` — 파마다 `mul=5` 가 클램프를 그대로 통과했고 피해도 정확히 `파 × 배율 × DamageAt` 이다.
`<= 0` 로 바꿔도 `n`·`hits` ≥ 1 호출부는 영향이 없다.

### 건드리지 않은 것

- `Skill/` 밖 전부 (A 폴더)
- `Skill/SkillExecutors.mlua` — `strike(1, 0.5)` / `strike(2, 0.5)` 값 그대로
- `SkillInfo.csv` · `.userdataset` · `Docs/스키마-계약.md`
- `.codeblock` — 기존 메서드 본문만 고쳐 재생성 불필요

## 2026-09-24 (2차) — 시전 순간 대상 고정 · 합계 = `DamageAt` 정확히 (나머지는 마지막 타)

사용자(박승현) 결정 2026-09-24. #83 1차 수정 뒤 Play 검증(Warrior Lv30 · ATK 75)에서 두 가지가 더 나왔다.

| 증상 | 실측 |
|---|---|
| 한 시전이 **두 마리**를 때린다 | Lv5 · 몬스터 2마리 · `dealt SK_W11 to T_mob_2` → `dealt SK_W11 to T_mob_1` 각 112. 타마다 `FindSkillTarget` 을 다시 불러 최근접이 바뀌면 대상도 바뀌었다 |
| Lv5 합계가 **224** (표 225) | `DamageAt` 225 × 0.5 = 112.5 → 타마다 내림 → 112 + 112 |

### 수정

| 위치 | 변경 |
|---|---|
| `Skill/SkillExecutors.ExecutePowerStrikeCombo` (`:2147-2169`) | 대상을 **시전 순간 한 번** 고른다(`FindSkillTarget` 1회). 두 타 모두 그 대상에게만. 시전 때 대상이 없거나 사라졌으면 그 타는 소모(재탐색 없음) |
| 같은 곳 (`:2151-2154`) | 합계 `total = DamageAt(skillId, level, uid)` 를 한 번 구해 **1타 = floor(total/2) · 2타 = total − 1타**. 로그 `POWER STRIKE locked target=… total=… split=a+b` (`:2157`) |
| `Skill/SkillAttack` (`:40` · `:148` · `:200-203`) | `PendingDamageOverride`(−1 = 안 씀) — `CalcDamage` 가 이 값이 있으면 그대로 돌려준다. `EndPass` 가 −1 로 되돌린다 |
| `Skill/SkillAttack.DealSkillDamageToTargetAmount` (`:420`) | 신규. `DealSkillDamageToTargetScaled` 와 같은 단일 대상 경로에 **정수 피해만 고정**. 태그는 스킬 id 그대로라 크리·표시 타수·픽파켓 훅은 기존 스킬 타격과 같다 |

기대값(ATK 75): Lv1 `DamageAt` 112 → **56 + 56** · Lv5 225 → **112 + 113**.

**스키마·CSV 열·이벤트·RPC 변경 없음.** `SkillInfo.csv` 값 그대로. `DealSkillDamageToTargetScaled` 는 남겨 뒀다(다른 호출부 없음 · 동작 변화 없음).

### Play 검증

(2026-09-24 · Maker MCP · `Orbis_Lobby_VictoriaStation` · 이 브랜치 · Reimport All → `refresh` → `logs(build)` → `play`)

**빌드 경고: 1 before → 1 after** (기존 `LWA-1111` · 에러 0 · Play 뒤 재확인도 같음 · Info 182 → 182). 처음 refresh 에서 `LIA-1114` Info 2건(`target.Name` · `target.TransformComponent` — `local target = nil` 을 nil 타입으로 본 정적 분석 오탐)이 늘어 `---@type Entity` 한 줄(`:2148`)을 붙였고, 재 refresh 뒤 Info 182 로 원래와 같다. Refresh 뒤 `SkillAttack.codeblock` 재생성 없음.

조건: 전사 Lv30 · 3차 · ATK 75 · 스네일 2마리(HP 100000) 앞쪽 · 아이언 바디 Lv0(반사가 몬스터 HP 를 건드리지 않게).

```
[T] PS setup lv=30 job=WARRIOR/3 W11=1 W12=0 atk=75 DamageAt(1)=112 DamageAt(5)=225 look=-1.0
```

**Lv1 — 실제 시전(`_SkillCaster:Cast`) · 합계 112 · 한 마리만**
```
SkillAttack: FindSkillTarget SK_W11 candidates=1 ... -> T_ps_1
SkillExecutors: POWER STRIKE locked target=T_ps_1 total=112 split=56+56
SkillAttack: dealt SK_W11 to T_ps_1 lv=1 amount=56 display=1   ← 1타
SkillAttack: dealt SK_W11 to T_ps_1 lv=1 amount=56 display=1   ← 2타
[T] PS1 after ps1 dmg=112.0 ps2 dmg=0.0
```

**Lv5 — 시전 뒤 대상 뒤바꾸기 · 합계 225 · 고정 대상만**
두 마리를 앞쪽 0.9 / 1.5 에 두고 `_SkillExecutors:Execute`(시전 비용·쿨다운 게이트만 건너뛰고 같은 `ExecutePowerStrikeCombo`)로 Lv5 시전 → **1타와 2타 사이(+0.6s)에 T_ps_2 를 0.4 로 옮겨 가장 가깝게** 만들었다(예전 코드면 2타가 T_ps_2 로 갔다).
```
[T] PS5swap cast dir=-1.0 ps1 dx=-0.92 ps2 dx=-1.50
SkillAttack: FindSkillTarget SK_W11 candidates=2 ... -> T_ps_1
SkillExecutors: POWER STRIKE locked target=T_ps_1 total=225 split=112+113
SkillAttack: dealt SK_W11 to T_ps_1 lv=5 amount=112 display=1   ← 1타
[T] PS5swap swapped at +0.6 ps1 dx=-1.70 ps2 dx=-0.40 (ps2 now nearest)
SkillAttack: dealt SK_W11 to T_ps_1 lv=5 amount=113 display=1   ← 2타 (나머지)
[T] PS5swap result ps1 dmg=225.0 ps2 dmg=0.0
```

**Lv5 실제 시전 경로**에서도 합계는 같다 — `POWER STRIKE locked target=none total=225 split=112+113`. 이때는 로그와 시전 사이 6초 동안 스네일이 걸어 나가 앞쪽 상자가 비어 있었고(`candidates=0`), 두 타 모두 `no locked target … consumed` 로 **아무도 안 맞았다** — "시전 때 대상이 없으면 소모" 동작 그대로다.

**판정: PASS** — 한 시전의 모든 타 = 시전 순간 고정 대상 · 합계 = `DamageAt`(Lv1 112 · Lv5 225) · 나머지는 2타.

## 2026-09-24 (3차) — 1타로 재구성 · 시전 순간 대상·피해·크리 고정 · 시체 보호 · 원작 1차 팩 연출

**9/13 히어로식 2단 콤보(섬광 → 내려찍기 1타 → 찌르기 2타 · 잔상 2종)를 대체한다.** 사용자 결정 2026-09-24 (skill-maker 원장 `.maplestory-skill-maker-ledger.md` · Task 2/3):

- **1타 · `DamageAt` 전액 · 시전 순간 고정 대상.** 2차의 몫/나머지 분할(2타)은 없어졌다.
- **PAJ-02 (a):** 대상 · 피해 · 크리는 시전 순간에 고정하고, HP 는 **칼이 닿는 순간 한 번** 지금 경로(`SkillAttack` → `AttackFast` → 몬스터 `HitComponent`)로 넣는다. skill-maker 기본(시전 순간 HP · 표시만 지연)과 다르다 — 몬스터 쪽에 표시 지연 `TakeDamage` · death-hold 가 없어서(A · #40 5813562531 대기) 원장에 편차로 기록했다.
- **시체 보호:** 고정 대상이 죽었거나 죽는 중이면(`script.Monster.IsDead` 또는 `Hp <= 0`) 아무것도 안 한다. 범위 스킬 · 후보 수집에서도 뺀다.
- **모션:** 승인 표는 RANDOM(반복 없음 · 한손검 swingO1/O2/O3 · 두손검 swingT1/T2/T3)이다. 표 자리 `Skill/SkillMotionSet.csv` 는 **등록 PR #90** 이 먼저 머지돼야 해서, 그전에는 사용자 결정(DATA-02)대로 `WeaponMotion.csv` **고정 행**(swingO1 / swingT1 · 둘 다 이 월드에서 이미 쓰는 W 모션)으로 나간다.
- **연출:** 원작 1001004 팩은 MSW 인덱스에 없어 가장 가까운 원작 팩 `skill/1100.img/skill/11001002`(1차 파워 스트라이크) — 시전 `aae5027da69747d3b2cd2bd0f26987e0` · 타격 `88a17d40d6e34abd948cac09724b22fa` · 사운드 `e0178f48602742c0bd8b295fdc27261c`. 예전 잔상(내려찍기 · 찌르기)은 뺐고 한손검 잔상은 없다.

### 수정

| 위치 | 변경 |
|---|---|
| `Skill/SkillExecutors.mlua:2114` `ExecutePowerStrike` | `ExecutePowerStrikeCombo` 를 대체. 시전 순간 `FindSkillTarget` · `amount = DamageAt` · `crit = IsGuaranteedCrit` 고정 → `hitAt` 뒤 `DealSkillDamageToTargetAmount` 한 번 · 맞았을 때만 hit/0 한 번(hitEffectPolicy once). 로그 `POWER STRIKE locked target=… amount=… crit=…` · `POWER STRIKE contact target=… hit=…` |
| `:398-404` `effectOverrides.SK_W11` | cast/impact = 11001002 · `hitAt = 0.45`(**잠정 · Play 실측으로 교체**) · `swing`/`thrust` 삭제 |
| `:592` `castSounds.SK_W11` | `e0178f48…`(11001002 `_audio/Use`) |
| `:1984` `ExecuteMeleeArc` | SK_W11 → `ExecutePowerStrike` |
| `Skill/SkillAttack.mlua:45` | `PendingCritOverride`(-1/0/1) — `CalcCritical`(`:223`)이 있으면 그 값을 쓴다 · `EndPass` 가 -1 로 |
| `:271` `IsAttackTarget` | `IsDeadOrDying` 이면 false(probe 후보 · 모든 스킬 타격) |
| `:431` `DealSkillDamageToTargetAmount` | 반환 boolean · 인자 `critLocked` 추가 · 죽은/죽는 중 대상이면 로그만 남기고 false |
| `:460` `IsDeadOrDying` | 신규. `script.Monster` 가 없으면 false(미니언 · 시설은 각자 HitComponent 규칙) |
| `Skill/SkillCaster.mlua:88` | 시전 락 1.2 → **0.6**(잠정 · Play 실측으로 교체) |
| `WeaponMotion.csv:9-10` (B 행) | SK_W11 시전 행 alert → **swingO1 / swingT1** (시전 행이 곧 공격 모션) |
| `:66-67` (B 행) | `SK_W11_2` `Enabled=false`(부르는 코드 없음) · `:11-12` `SK_W11_1` 은 **main 그대로 둔다**(2026-09-25 되돌림 — 아래 "WeaponMotion.csv 줄바꿈 수리" 절) |
| `SkillInfo.csv` SK_W11 `#Note` | 새 팩 · 1타 설명. 수치 열 변경 없음 |

헤더 변경 없음 · 새 CSV 열 · 이벤트 · RPC 없음.

### Play 검증 (3차)

→ **6차 절(2026-09-25)에 결과.** Ctrl 기본 공격은 무작위가 아니다(swingO1 고정) · 휘두르기 6종 실측 → HitTime 0.45 · LockTime 0.80 · Lv1 112 / Lv5 225(한 대상 · 다른 몬스터 0) · 시체 안 맞음 · 보상 1회 · 빌드 경고 1 → 1. **PASS**

## 2026-09-25 (4차) — PR 합치기: #90 · #91 · #92 · #93 → 이 PR · `SkillMotionSet` 구현 (파워 스트라이크 RANDOM)

사용자 지시 2026-09-25: 등록 PR #90(`SkillMotionSet`) · 진영 필터 #91 · 맨손 거절 #92 · 분신 렌더 순서 #93 의 커밋을 이 브랜치로 가져왔다(cherry-pick · 충돌 없음). 각 PR 의 조각은 아래 절로 옮기고 파일은 지웠다(PR 하나 · 조각 하나). A 는 #40 5813661726 에서 "시전 순간 대상 · 피해 · 크리 고정 → 접촉 순간 1회" 를 **정식안**으로 확정했다(3차의 편차 기록이 정식이 됨).

### `SkillMotionSet` 구현 — 3차의 "고정 행 임시" 를 대체

등록(A-2-23)과 구현이 같은 PR 이 됐으므로 3차의 `WeaponMotion.csv` 고정 행(swingO1 / swingT1)을 표로 옮겼다.

| 위치 | 변경 |
|---|---|
| `Skill/SkillMotionSet.csv` + `.userdataset` (신규 · UUID `d01fa504-4b38-42da-8f9a-25f8effe4128`) | SK_W11 × SWORD_1H swingO1/O2/O3 · SWORD_2H swingT1/T2/T3 · `RANDOM` · `HitTime` 0.45 · `LockTime` 0.6 (**잠정 · Play 실측으로 교체**) |
| `Skill/SkillDatabase.mlua` | `LoadMotionSets` · `GetMotionSet(skillId, weaponType)` · `MotionSetLockSeconds(skillId)` — 세트별 행(Seq 순) · Mode 가 섞이면 경고 |
| `Skill/SkillExecutors.mlua` `PickMotionFromSet` | 세트 = (스킬, 장착 무기) → 없으면 (스킬, 직업 기본 무기). FIXED = 첫 행 · **RANDOM = 직전 모션을 뺀 나머지에서 무작위** · SEQUENCE = 다음 순번. 고른 행은 `motionPicks[uid]` · 로그 `[Skill] motion pick …` |
| `PlayMotion` | 세트가 있으면 세트에서 고른 모션을 재생하고 `WeaponMotion` 은 보지 않는다 |
| `ExecutePowerStrike` | 타격 시점 = 고른 모션의 `HitTime`(없으면 `effectOverrides.SK_W11.hitAt`) · 로그에 `motion=` |
| `Skill/SkillCaster.mlua` `GetCastLockSeconds` | 세트에 `LockTime` 이 있으면 그 스킬 세트의 최댓값(클라 예측 락 · 서버 락 같은 값 — 무작위로 고른 모션은 서버만 안다) → 없으면 `castLockOverrides` |
| `WeaponMotion.csv:9-10` (B 행) | SK_W11 SWORD_1H/2H `Enabled=false`(세트로 옮김) |
| `Docs/tools/check-integrity.cjs` | CANONICAL `Skill/SkillMotionSet` · PK `SkillId`+`WeaponType`+`Seq` |
| `Docs/스키마-계약.md` | #90 의 등록(§0-2 `MotionMode` · §1 · 등록서 · A-2-23 · 변경 이력) + 상태를 "등록 + 구현 PR #83" 으로 |

### 계약서 — 아직 넣지 않은 줄

스킬 등록서 8번(`스키마-계약.md:274`)에 맨손 거절의 `EquipService` 호출 한 줄을 적어야 한다. 같은 줄을 #86 이 고치고 있어 지금 넣으면 두 PR 이 같은 줄에서 충돌한다 → **#86 머지 뒤** 추가한다. (변경 이력 첫 행은 이 PR 과 #86 이 둘 다 추가해 어느 쪽이든 뒤에 머지하는 쪽이 한 번 풀어야 한다.)

### 4차 · 등록 문서 (원래 #90) — 2026-09-24 — [등록] 스킬 모션 세트 `SkillMotionSet` (문서만)

계약서 §1 등록 절차 1단계 — **코드 없이 문서만.** 머지된 뒤 구현한다. 사용자 결정 2026-09-24 (skill-maker 원장 DATA-02 · 모션 표 승인).

| 위치 | 변경 |
|---|---|
| `Docs/스키마-계약.md` §0-2 | 열거값 `MotionMode` (`FIXED` · `RANDOM` · `SEQUENCE`) |
| §1 등록된 시스템 | "스킬 모션 세트" 행 |
| §1 등록서 | 8항목 — 8번에 남의 폴더 파일 수정 없음 → §3-3 self-merge 대상 |
| A-2-23 | `SkillMotionSet` 헤더 `SkillId,WeaponType,Seq,Mode,CoreAction,PartsAction,PlayRate,HitTime,LockTime,Enabled,#Note` |
| 변경 이력 | 2026-09-24 행 |

`check-integrity.cjs` CANONICAL · PK 는 구현 PR 에서 CSV 파일과 같이 넣는다(지금 넣으면 "파일 없음" 경고만 는다).

### 4차 · 진영 필터 (원래 #91) — 2026-09-24 — 스킬이 우리 편을 때리지 않게 (진영 필터)

PR #91. skill-maker 점검(2026-09-24)에서 발견: 스킬 타격 경로(`SkillAttack` · `SkillProjectile`)에 진영 판정이 없어, `CollisionGroups.Monster` 에 있는 우리 편(수비대 · 우리 미니언 · 우리 시설)과 중립까지 맞을 수 있었다. 기본 공격은 이미 거른다(`PlayerAttack.mlua:91` `_FactionLogic:IsEnemy`).

**헤더 변경 없음 · 새 CSV 열 · 이벤트 · RPC 없음.** `PlayerAttack.mlua` · `Faction/FactionLogic.mlua`(A)는 건드리지 않았다 — `IsEnemy` 호출만.

#### 수정

| 위치 | 변경 |
|---|---|
| `Skill/SkillAttack.mlua:248-250` `IsAttackTarget` | 맨 앞에 `_FactionLogic:IsEnemy(self.Entity, defender)` 가 false 면 false. 모든 스킬 타격(상자 · 원 · 단일 대상 · 평값 반사)과 후보 수집(probe · `FindSkillTarget(s)`)에 걸린다 |
| `Skill/SkillProjectile.mlua:282-288` `IsAttackTarget` | 같은 규칙. 공격자는 투사체가 아니라 **시전자**(`_UserService:GetUserEntityByUserId(CasterUserId)`) — 투사체 엔티티엔 진영이 없어 `FactionLogic` 이 중립으로 본다. 시전자를 못 찾으면 아무도 안 맞는다 |

- 스킬 피해는 전부 `AttackFast` → `IsAttackTarget` 을 지난다(`SkillAttack` 6곳 · `SkillProjectile` 1곳 · 직접 HP 쓰기 없음) → 두 곳으로 전부 덮인다.
- 도발(SK_W22)은 이미 `SkillExecutors:2277` 에서 `IsEnemy` 로 걸렀다 — 이제 후보 수집 단계에서도 빠진다.
- #83 도 `SkillAttack.IsAttackTarget` 을 고친다(시체 제외 · `__base` 줄 뒤). 이 PR 은 그 두 줄 **앞**에 넣어 두 PR 의 변경이 겹치지 않는다.

#### Play 검증

→ **6차 절(2026-09-25)에 결과.** 우리 편(진영 21) · 중립 스네일이 가장 가까워도 후보에서 빠지고 피해 0 · 적 몬스터는 그대로 피해. **PASS**

### 4차 · 맨손 거절 (원래 #92) — 2026-09-24 — 맨손이면 공격 스킬 거절 + 토스트

PR #92. **출처: #40 5813570100 (A 결정 · 사용자 확정 2026-09-24)** — 맨손 하한을 올리지도 몬스터 HP 를 낮추지도 않고, 대신 무기가 없으면 공격을 못 하게 한다. 이 PR 은 **스킬 쪽**만. 기본 공격 쪽은 `PlayerAttack.mlua` 담당 이관(규칙 PR #88) 머지 뒤 PlayerAttack PR 에서 같은 문구로 한다.

**헤더 변경 없음 · 새 CSV 열 · 이벤트 · RPC 없음.** A 파일 수정 없음 — `Item/EquipService`(`EnsureUser` · `EquippedItemId` `:249`) · `UIToast`(`ShowMessage`) 는 호출만.

#### 규칙

| 시전 | 맨손일 때 |
|---|---|
| `MELEE_ARC` · `PROJECTILE` · `AOE` | 거절 + 토스트 "무기를 장착해야 공격할 수 있습니다" |
| `ORIGIN` 중 피해 궁(`EffectUnit` `ATK_PCT` / `STACK_PCT` — 대마법 · 폭풍의 화살 · 메소 익스플로전 · 함포 사격) | 거절 + 토스트 |
| 에너지 차지 변신 중 재시전(주먹) | 거절 + 토스트 (행은 `BUFF_SELF` 지만 재시전은 공격) |
| 버프(`BUFF_SELF` · 불굴의 진 `ORIGIN`/`SEC`) · 이동(`BLINK`) · 도발(`TAUNT`) | **그대로 시전** |

거절은 MP(6) · 쿨다운 · 사용 횟수 · 영혼석 게이트 앞(4-2)이라 아무것도 소모하지 않는다.

#### 수정 — `Skill/SkillCaster.mlua`

| 위치 | 변경 |
|---|---|
| `:79` | `UnarmedToast` 속성(토스트 문구) |
| `:157` `IsDamagingCast(skill, isRecast)` | 신규 — 위 표 |
| `:171` `HasWeapon(userId)` | 신규 — `EquippedItemId(uid, e, "WEAPON") ~= ""` · `_EquipService` 가 없으면 막지 않는다 |
| `:407-414` `RequestCast` 게이트 4-2 | 시전 락(4-1) 뒤 · 사용 제한(5) 앞. 로그 `[Skill] unarmed — <skill> refused` · `CastResult(false, "no weapon equipped")` |

- 정상 흐름에서는 맨손이 안 생긴다(매치 시작 킷에 몽둥이 · `InventoryService.mlua:50`) — 플레이어가 무기를 직접 뺐을 때뿐. **Maker 에서 매치 없이 로비에서 시험하면 무기가 없을 수 있다** — 공격 스킬 시험 전에 무기를 장착한다.
- 계약서 스킬 등록서 8번에 `EquipService` 호출을 한 줄 적어야 한다 — 같은 칸을 #86 이 고치고 있어 #86 머지 뒤 이 브랜치에서 추가한다.

#### Play 검증

→ **6차 절(2026-09-25)에 결과.** 맨손: 파워 스트라이크 · 에너지볼트 · 에너지 차지 재시전(주먹) 거절 + 토스트 · MP/쿨다운 그대로 · 하이퍼 바디 · 도발 · 텔레포트 · 에너지 차지(변신) 시전됨. **PASS**

### 4차 · 분신 렌더 순서 (원래 #93) — 2026-09-24 — 분신 · 에너지 차지 불꽃 렌더 층 = Default / 플레이어 순서값 − 1

PR #93. **출처: #40 5813565483 (A 답 · 사용자 확정 2026-09-24).** 플레이어는 발판과 무관하게 `Default` / 4 고정(A 의 `Map/PlayerFrontLayer` · 예외 = 포탈 `Default`/5). `Default` 층에서 A 가 쓰는 값은 4 · 5 뿐이고 맵에 박힌 `Default` 오브젝트는 2 이하 → 분신 = `Default` / 3 이면 플레이어 · 포탈 말고는 전부 분신 뒤.

**헤더 변경 없음 · 새 CSV 열 · 이벤트 · RPC 없음.** A 파일 수정 없음 — `_PlayerFrontLayer.PlayerSortingLayer` · `PlayerOrderInLayer` 읽기만.

#### 수정 — `Skill/SkillExecutors.mlua`

| 위치 | 변경 |
|---|---|
| 속성 | `ShadowOrderInLayer = 2` → `ShadowOrderBelowPlayer = 1`(플레이어보다 몇 칸 뒤) |
| `ApplyShadowSorting` | `SortingLayer` = `_PlayerFrontLayer.PlayerSortingLayer` · `OrderInLayer` = `PlayerOrderInLayer − 1`. `_LaneFacilityService.SortingLayerBelow`(밟은 발판 층) 의존 제거 · `_PlayerFrontLayer` 가 없으면 옵션 없음 |
| 주석 3곳 | 새 규칙으로 |

영향: 쉐도우 파트너 분신(서 있기 루프 · 따라하기) · 에너지 차지 불꽃(`loopFlame.sortBehind`) — `ApplyShadowSorting` 을 부르는 곳 전부.

- 예전엔 발판 층 + 2 였다 — 플레이어가 `Default` 로 옮겨 간 뒤(A · 2026-09-22)로는 발판 층이 `Default` **아래**라 분신이 플레이어 뒤에 있긴 했지만 시설 · NPC 뒤로도 숨었고, 공중(발 아래 발판 없음)에서 걸면 옵션이 빠져 플레이어 **앞**에 그려졌다.
- #64(에너지 차지 불꽃 층이 시전한 발판 층에 고정)의 원인이 발판 층이었으므로 이 변경으로 없어질 것으로 본다 — Play 확인 전까지는 #64 를 닫지 않는다.
- ⚠ A 는 "`OrderInLayer` 는 동기화되지 않아 클라에서 써야 한다"(`PlayerFrontLayer.mlua:10`)고 했다. 이 경로는 컴포넌트 속성이 아니라 서버의 `_EffectService:PlayEffectAttached` **재생 옵션**이다 — 옵션이 클라 렌더에 반영되는지 Play 에서 확인한다(안 되면 클라 경로로 옮긴다).

#### Play 검증

→ **6차 절(2026-09-25)에 결과.** 분신 `layer=Default/3` · 플레이어 `Default/4` → 분신 · 에너지 차지 불꽃이 플레이어 바로 뒤 · 맵 난간 앞 · 공중 시전도 뒤. `PlayEffectAttached` 옵션이 클라 렌더에 반영된다(⚠ 우려 해소). **PASS** — #64 의 재현 조건(시전 뒤 다른 발판 층으로 이동)은 따로 돌리지 않았다.

## 2026-09-25 (5차) — 몬스터 피격 연출 3건 (A 파일 · #40 5813661726 2~4번 · A 리뷰 승인 대상)

A 결정(사용자 확정 2026-09-24): 2~4번은 **B 가 SK_W11 PR 에 넣고 A 가 리뷰로 승인한다.** `Monster.mlua` · `StateTypeChase.mlua` 는 A 파일(`MyDesk/` 루트 · 협업-규칙 §3-3 남의 폴더 파일). 1번(시전 순간 고정 → 접촉 순간 1회)은 3차 그대로가 정식안, 5번(미니언 · 수비대 경직 없음 · 보스는 지금대로)은 변경 없음.

| # | 위치 (A 파일) | 변경 |
|---|---|---|
| 2 돌아보기 | `Monster.mlua:470` `FaceAttacker` (신규) · `:505-508` `ReactToHit` | 살아서 맞을 때마다(치명타 포함) 공격자 쪽으로 `SpriteRendererComponent.FlipX` = (왼쪽을 향하나) ~= `SpriteFacesLeftByDefault` — 걷는 AI 와 같은 식(`StateTypeChase:94` · `StateTypeWander:43`). **보스 제외**(BossSkillRunner 가 방향을 잡는다). 켜진 `StateChaseMonster` / `StateMoveMonster` 가 없는 몹(레인 미니언 · 수비대 = FactionAI 가 Scale.x 로 방향)도 건드리지 않는다 |
| 3 멈춤 제거 | `Monster.mlua:84` `lastHitAt` · `:87` `HitResumeWindowSeconds` 1.2 · `:494` `RecentlyHit` · `:503` 기록 / `StateTypeChase.mlua:14-28` `OnEnter` | 피격 뒤 복귀는 HIT → (0.5s) IDLE → CHASE 다(StateSetChaseMonsterAI). `OnEnter` 가 **방금 맞은 몹(1.2초 창)** 이면 1~3초 "서 있기" 를 다시 뽑지 않고 곧바로 걷는다 — 남은 걷기 구간은 두고(다 썼으면 새 걷기 구간만) `jumpArmed = true` · `jumpTimeLeft = 0`. 그 밖의 CHASE 진입은 예전 그대로 |
| 4 사망 즉시 피격 끄기 | `Monster.mlua:315-321` `Dead()` · `:349-355` `Respawn()` | `Dead()` 에서 바로 `HitComponent.Enable = false`(예전엔 숨김 타이머까지 켜져 있어 시체가 또 맞았다) · `Respawn()` 에서 다시 켠다(안 켜면 부활한 몹은 영영 안 맞는다) |

**보상 두 번 지급 점검 (A 요청):** `Farm/FarmReward.mlua:45-66` 이 `Monster.IsDead` 의 **상승엣지에서 1회만** 지급한다(`Rewarded` 플래그 · 부활하면 리셋) — 코드상 두 번 지급은 없다. 대신 예전엔 사망 뒤 · 지급 전(다음 `OnUpdate`) 사이에 시체를 친 공격이 `HandleHitEvent`(`:245`)로 `LastAttacker` · 피해 원장을 바꿀 수 있었다 → 사망 즉시 피격을 끄면 이 틈도 닫힌다. Play 에서 "스킬로 죽인 몹을 다시 쳐도 안 맞고 보상은 한 번" 으로 확인한다.

- 스킬 쪽 시체 제외(`SkillAttack.IsDeadOrDying` · 3차)와 짝이다 — 스킬은 두 겹으로 막히고, 기본 공격은 이 `HitComponent` 끄기로 막힌다(기본 공격 쪽 `IsDead` 제외는 PlayerAttack PR · 규칙 PR #88 머지 뒤).
- skill-maker 규칙("죽이는 타격도 공격자를 본다")은 A 결정 범위(살아 있는 피격 · `ReactToHit`)를 넘어 넣지 않았다 — 필요하면 A 에게 따로 묻는다.
- 계약서 스킬 등록서 8번에 이 두 A 파일을 적어야 하지만 같은 줄(`:274`)을 #86 이 고치고 있어 **#86 머지 뒤** 넣는다(PR 본문에 등록 항목으로 적었다).

## 2026-09-25 (6차) — Play 검증 1차 전체 + 휘두르기 클립 실측 → `HitTime` 0.45 · `LockTime` 0.80

(Maker MCP · `Orbis_Lobby_VictoriaStation` · 이 브랜치 `ddbca97` · 재입장 + Reimport All 뒤)

**빌드 경고: 1 before → 1 after** (기존 `LWA-1111` · 에러 0 · Info 190 → 190). 런타임 에러 0 · 경고는 기존 것뿐(`[BossCatalog]` 6130101 · `LWA-3048` PlayerAttack/SkillAttack 중복 · `LWA-3047` OrderInLayer).

조건: 서버 스크립트로 Lv30 · 전사 3차 · `SK_W11` Lv1 · 무기 `WEAPON_WARRIOR_T30`(SWORD_1H) / `WEAPON_WARRIOR_2H_T30`(SWORD_2H) · 스네일(HP 100000) 스폰. `DamageAt(SK_W11,1)=112` · `DamageAt(5)=225`(이 브랜치는 `JobTier` 공격력 75).

### 휘두르기 6종 클립 실측

body 엔티티의 `SpriteAnimPlayerChangeFrameEvent` / `SpriteAnimPlayerEndEvent` 를 걸고 `ActionStateChangedEvent`(PlayRate 1 · Onetime)로 재생해 보낸 순간부터 잰 시각(초):

| 클립 | 1프레임 | 2프레임(접촉) | 끝 |
|---|---|---|---|
| swingO1 | 0.313 | 0.467 | 0.816 |
| swingO2 | 0.313 | 0.453 | 0.815 |
| swingO3 | 0.311 | 0.451 | 0.811 |
| swingT1 | 0.311 | 0.450 | 0.813 |
| swingT2 | 0.312 | 0.452 | 0.818 |
| swingT3 | 0.309 | 0.462 | 0.809 |

- 6종 모두 **3프레임 · 0.30 / 0.15 / 0.35s**(이벤트는 한 프레임 ≈16ms 늦게 온다).
- **접촉 = 2프레임 시작.** swingT1 을 0.05배속으로 틀어 스크린샷: 0프레임 = 뒤로 젖힘 · 1프레임 = 머리 위 · 2프레임 = 앞으로 내려친 자세. 6종 전부 2프레임만 고정 재생해 봐도 칼이 앞으로 뻗은 자세다.
- → `SkillMotionSet.csv` SK_W11 6행 **`HitTime` 0.45(그대로) · `LockTime` 0.60 → 0.80(클립 끝)** · `#Note` 를 실측으로. 코드 폴백도 같은 값(사용자 지시 2026-09-25 · 둘이 갈라지지 않게): `SkillCaster.castLockOverrides.SK_W11` 0.6 → **0.8** · `SkillExecutors.effectOverrides.SK_W11.hitAt` 0.45(주석만). 시전 락이 0.2s 늘어 칼이 끝까지 휘둘러진 뒤 움직일 수 있다.

### Ctrl 기본 공격은 무작위가 아니다 (증거)

Ctrl 6번(한손검) · body 로 들어온 액션: `alert`(×1.33 Loop · 엔진 ATTACK 매핑) → **`swingO1` Onetime**(`PlayerMotion.PlayAttack` · `WeaponMotion` 고정 행) → `alert`(×1.0 Loop · **+0.55s**) → `stand1`(+0.86s). **6/6 swingO1.** 그리고 +0.55s 의 `alert` 가 swingO1 을 **접촉 프레임(0.45~0.80) 안에서 끊는다.** 기본 공격 쪽(PlayerAttack PR · 규칙 PR #88 머지 뒤)에서 SkillMotionSet RANDOM 으로 바꾸고 이 끊김을 없앤다 — 이 PR 범위 밖.

### 결과

| 항목 | 결과 | 근거 |
|---|---|---|
| Lv1 = 112 · 한 대상 | **PASS** | `POWER STRIKE locked target=T_ps_a amount=112 … motion=swingO3 hit@0.45` → a 100000 → 99888 · b 0 |
| Lv5 = 225 · 한 대상 | **PASS** | `locked target=T_ps_b amount=225` → b 99775 · a 0. 이어서 14회 시전 전부 한 대상 225(a −1125 = 5×225 · b −900 = 4×225) |
| RANDOM · 반복 없음 | **PASS** | 한손검 10회 O3 O1 O3 O1 O3 O2 O3 O2 O3 O2 · 두손검 6회 T1 T2 T1 T2 T3 T1 — 연속 반복 0. 서버 `[Skill] motion pick` 과 클라 body 재생 16/16 일치 |
| 진영 필터 | **PASS** | 우리 편(진영 21 · `rel=ALLY` · 0.45 로 가장 가까움) · 중립(`rel=NEUTRAL` · 0.60) → `FindSkillTarget candidates` 에서 빠짐 · 2회 시전 뒤 둘 다 100000 |
| 시체 — 휘두르는 중 사망 | **PASS** | `locked target=T_ps_c` → +0.19s 다른 경로로 사망(`HitComponent.Enable=false`) → `SK_W11 locked target T_ps_c is dead/dying — hit skipped` · `contact … hit=false` · HP 0 그대로 |
| 보상 1회 | **PASS** | `T_ps_e`(FarmReward · HP 200) 를 파워 스트라이크 225 로 처치 → `[FarmReward] T_ps_e lasthit=… exp=5` **1줄** · exp +5 · 동전 3. 시체에 Ctrl 2번(+0.9s · +2.9s) → 피해 · 보상 없음 |
| 맨손 거절 | **PASS** | `[Skill] unarmed — SK_W11 refused` · `reason='no weapon equipped'` · MP 500000 · 쿨다운 0 그대로 · 토스트 "무기를 장착해야 공격할 수 있습니다"(스크린샷). 마법사 `SK_M11` 거절 · 해적 `SK_P21` 재시전(주먹) 거절 |
| 맨손 — 버프 · 이동 · 도발 | **PASS** | `SK_W21` 하이퍼 바디 · `SK_W22` 도발 · `SK_M13` 텔레포트(2.5 이동) · `SK_P21` 에너지 차지(공중 시전 포함) 시전됨 |
| 분신 · 불꽃 렌더 층 | **PASS** | `shadow mimic … layer=Default/3` · 플레이어 `Default/4` → 분신이 플레이어 뒤 · 난간 앞(스크린샷). 에너지 차지 불꽃 루프 — 땅 · 공중(`grounded=false`) 둘 다 플레이어 뒤. 시전 순간 번개 이펙트(1회)는 앞 — 기존 동작 · 범위 밖 |
| 몬스터 돌아보기 | **PASS** | 스네일을 반대로 돌려 두고(`flip=true` · 공격자 쪽 = false) 때림 → HIT 중 `flip=false`(공격자 쪽) |
| 보스 제외 | **PASS** | 마노(`BossSkillRunner` 있음)를 반대로 돌려 두고 때림 → `flip` 그대로 |
| 피격 뒤 계속 추격 | **PASS** | HIT +0.05 → IDLE +0.48 → CHASE +0.50(`armed=true`) → CHASE 진입 0.12s 뒤 이동 시작(피격 뒤 0.62s). 예전엔 1.3~3.3s 서 있었다 |

### 확인 못 한 것

- 에너지 차지 재시전 거절의 **토스트** 는 스크린샷 타이밍이 빗나갔다(서버 로그 `unarmed — SK_P21 refused` 는 있음 · 파워 스트라이크와 같은 코드 줄).
- 스크립트 스폰 스네일엔 `FarmReward` 가 없다(`MonsterSpawner` 가 붙인다) — 보상 테스트용 한 마리에만 같은 방식으로 붙였다.

### 2차 Play — 새 타이밍 확인 (2026-09-25 · `fae02ad` · 재입장 + Reimport All)

**빌드 경고: 1 before → 1 after** (`LWA-1111` · 에러 0 · Info 190 → 190). 런타임 에러 0 · 경고는 기존 것뿐(`LWA-3047` · `[BossCatalog]` · `LWA-3048`). Reimport 된 값: `GetCastLockSeconds(SK_W11)` = 표 0.8 · 폴백 0.8 · `hitAt` 0.45.

조건: 1차와 같은 세팅(Lv30 전사 3차 · `SK_W11` Lv1) · 스네일 2마리 앞쪽(추격 AI 끔 — 접촉을 늘 고정 대상에서 재려고). 서버: `motion pick` → 고정 대상 HP 감소까지. 클라: 키 입력(`_SkillCaster:Cast`)부터 body 이벤트(`ActionStateChangedEvent` · `SpriteAnimPlayerChangeFrameEvent` · `SpriteAnimPlayerEndEvent`) · `castLockActive` · `InputSpeed` 를 프레임마다.

| 항목 | 한손검 (4회 · swingO2 · O3 · O2 · O3) | 두손검 (7회 · swingT1 · T2 · T3 · T1 · T3 · T1 · T3) | 판정 |
|---|---|---|---|
| 접촉 (서버 · 모션 선택 → 대상 HP 감소) | +0.436 ~ +0.458s · 매번 112 | +0.437 ~ +0.448s (서버 측정 3회) | **PASS** |
| 2프레임이 화면에 (휘두르기 시작 기준) | +0.45 ~ +0.47s | +0.45 ~ +0.47s | **PASS** |
| 휘두르기 끝까지 (끊김 없음) | 끝 +0.80 ~ 0.81s → 다음 `stand1` · `cut=false` 4/4 | 같음 · `cut=false` 7/7 | **PASS** |
| 행동 가능 (클라 락 해제 · `InputSpeed` 복구) | 키 입력 뒤 0.864 ~ 0.871s (첫 시전만 1.015s — 세션 첫 시전 지연) · 마지막 프레임이 끝나기 0 ~ 0.04s 전 | 0.858 ~ 0.867s | **PASS** |

- 실제 입력: → 를 누른 채 시전 → 락 동안 제자리 · 락 해제 +0.867s · **다시 걷기 시작 +0.951s**.
- 클라 락 타이머는 키 입력 순간 0.8s 로 걸린다(`SkillCaster.mlua:278`). 재 보니 0.86s 인 건 타이머 · 프레임 단위 오차이고, 해제는 늘 휘두르기 마지막 프레임 안이다. 서버 락(`castLockUntil`)은 0.70s — 왕복 지연 여유 ×0.9(기존 `:403-404`).
- 두손검 7회 중 앞 4회는 무기 교체 스크립트가 서버 측정 스크립트를 멈춰 서버 접촉을 못 쟀다 → 측정을 다시 걸고 3회 더(클라 측정은 7회 전부).

**판정: PASS** — 접촉 0.45s · 약 0.80s(휘두르기 끝)에 행동 가능 · 한손 · 두손 모두 휘두르기가 끊기지 않는다.

## 2026-09-25 (7차) — 타격 이펙트 두 겹(hit/0 + hit/1) · 휘두르기 잔상(임시 80003316) · 두손검 세트 재확인

### 결정 (사용자 2026-09-25)

- **두손검 세트 = swingT1 · swingT2 · swingT3 그대로**(stabT1 은 넣지 않는다). `SkillMotionSet.csv` 는 바꾸지 않았다.
  - 근거 = 휘두르기 7종을 0.05배속으로 프레임마다 멈춰 다시 찍은 캡처(찍을 때마다 배경색에 프레임 번호를 새겨 스크린샷 지연을 걸러냄 · 저장소 밖 `design-handoff/trails/`).
  - swingT1 · swingT2 는 **접촉 프레임이 픽셀까지 같고** 시작만 다르다(휘두르는 각 136° · 92°). swingT3 는 아래 뒤에서 앞 위로 올려 베기(231°).
  - stabT1 은 전사의 은빛 대검으로 **칼이 어느 프레임에도 그려지지 않는다**.
  - 6차 1차 Play 의 "두손 휘두르기 T1 ≈ T3" 기록은 스크린샷 지연 때문에 **틀렸다**(정정).
- **타격 이펙트** = 11001002 hit/0(`88a17d40…`) + hit/1(`c07906d7…`) 을 같은 자리에 겹쳐 **시전당 한 번**(`hitEffectPolicy` once 그대로).
- **휘두르기 잔상** = 원작 흰 잔상은 디자이너 요청(`trail_swingO1/O2/O3` · `trail_swingT1/T2/T3` · 규격 = 저장소 밖 `design-handoff/trails/spec.md`). 그때까지 80003316 잔상 sprite 를 임시로 쓴다.

### 수정 — `Skill/SkillExecutors.mlua`

- `effectOverrides.SK_W11`: `impact2`(hit/1) · `trail`(모션별 6개) · `trailSeconds` 0.35(접촉 0.45 → 휘두르기 끝 0.80 · 6차 실측).
- `ExecutePowerStrike`: 접촉 순간 hit/0 · hit/1 을 같은 자리(대상 발 +0.5)에 한 번씩 → 로그 `POWER STRIKE contact … hitFx=2`. 시전 순간 `ScheduleSwingTrail` 호출 — 대상이 없어도(헛스윙) 잔상은 뜬다.
- 신규 `ScheduleSwingTrail`: 이번 시전에 고른 모션(`motionPicks`)의 `trail` 항목을 `hitAt` 에 `PlaySpriteFlash`(기존 · B 투사체 모델에 sprite 를 실어 `trailSeconds` 뒤 스스로 사라짐 · 바라보는 쪽으로 뒤집음).

| 모션 | 임시 잔상 (80003316 `afterimage/…/2/0`) | 크기 | offsetY |
|---|---|---|---|
| swingT1 | `swordTL/swingT1` `98d2124f…` | 168×120 | −0.1 |
| swingT2 | `swordTL/swingT2` `447033cc…` | 144×88 | −0.1 |
| swingT3 | `swordTL/swingT3` `64e8406f…` | 164×124 | −0.1 |
| swingO1 | `swordTS/swingT3` `c0ca367e…` | 120×96 | −0.2 |
| swingO2 | `swordTS/swingT1` `32aff8b2…` | 136×84 | −0.2 |
| swingO3 | `swordTS/swingT2` `a654159d…` | 116×84 | −0.2 |

- 한손검: 팩에 한손 잔상이 없어 두손 잔상의 작은 쪽(`swordTS`)을 재사용한다. 모션마다 휘두르는 방향이 가장 가까운 것을 골랐다(swingO1 아래→앞→위 = T3 · swingO2 내려찍기 = T1 · swingO3 앞위→아래 = T2).
- `offsetY` −0.1 / −0.2 = 예전 콤보(`9c5f0b0`)에서 Play 로 맞춘 값 그대로.

### Play 검증 3차 — 연출 (대기 · 재입장 + Reimport All 뒤)

| 항목 | 기대 | 결과 |
|---|---|---|
| 빌드 경고 | 1 → 1 | 대기 |
| hit/0 + hit/1 | 접촉 순간 대상 위에 두 클립 · `hitFx=2` · 시전당 1회 | 대기 |
| 두손 잔상 T1 · T2 · T3 | 모션마다 다른 잔상 · 0.45s 에 떠서 0.35s 뒤 사라짐 · 로그 `sprite flash SK_W11_trail_swingT*` | 대기 |
| 한손 잔상 O1 · O2 · O3 | 위 표의 `swordTS` 잔상 | 대기 |
| 헛스윙 | 대상 없음 → 잔상만 · 타격 이펙트 없음 | 대기 |
| 좌우 | 왼쪽 · 오른쪽 모두 휘두르는 쪽에 잔상 | 대기 |
| 세션 첫 시전 | 첫 잔상이 늦게 뜨지 않는지 | 대기 |

## 2026-09-25 (8차) — 휘두르기 잔상 타이밍 수정: 시전 순간 숨긴 채 스폰 → 접촉 0.45s 에 드러냄 · 0.35s

### 원인 (7차 3차 Play 실측)

- 서버는 접촉 순간(시전 뒤 0.45s)에 잔상 엔티티를 스폰하고 0.35s 뒤 지운다(제때).
- 클라에는 엔티티 생성이 **약 0.2s 늦게** 도착한다(키 입력 뒤 +0.74s · 접촉 프레임은 +0.53s 쯤). 삭제는 거의 바로 도착해서 **0.14~0.18s 만** 보였다(목표 0.35s).
- 잔상 sprite 첫 로드도 0.22~0.27s 걸린다(두 번째부터 0.017s) → 세션 첫 잔상은 더 늦을 수 있었다.

### 수정 — `Skill/SkillExecutors.mlua`

- `PlaySpriteFlash` 에 `showAt` 인자 추가. `showAt > 0` 이면 지금 **알파 0 으로 숨긴 채** 스폰하고, `showAt` 초 뒤 알파를 되돌려 `seconds` 동안 보인다(`MaxLifetime = showAt + seconds`).
  - 클라는 기다리는 동안 엔티티를 받고 sprite 도 미리 불러 둔다. 드러내기는 `Color` 속성 동기화 한 번이다.
  - `Enable` 을 끄지 않고 알파를 쓴다 — 꺼진 렌더러가 sprite 를 미리 불러 둔다는 보장이 없어서.
- `ScheduleSwingTrail`: 타이머로 접촉 순간에 스폰하던 것을 → 시전 순간 `PlaySpriteFlash(…, showAt = hitAt, seconds = trailSeconds, …)`.
- 로그: `sprite flash … hidden until +0.45s then 0.35s` (스폰) · `sprite flash … shown (+0.45s · 0.35s)` (드러냄).
- 잔상 그림 · 모션별 매핑 · offset 은 그대로(파워 스트라이크 연출 변경은 보류 — 원장 "Look decisions").

### Play 검증 4차 — 잔상 타이밍 (대기 · 재입장 + Reimport All 뒤)

| 항목 | 기대 | 결과 |
|---|---|---|
| 빌드 경고 | 1 → 1 | 대기 |
| 클라에 보이기 시작 | 접촉 프레임과 같은 때(키 입력 뒤 +0.5s 안팎) | 대기 |
| 보이는 시간 | 약 0.35s | 대기 |
| 세션 첫 잔상 | 늦지 않게 | 대기 |
| 숨긴 동안 | 안 보임(깜빡임 없음) | 대기 |
| 헛스윙 · 좌우 · 6모션 | 7차와 같다 | 대기 |

## 2026-09-25 (9차) — 파워 스트라이크 연출 확정: 시전 · 타격 = 80003316(모험가) · 한손 잔상 = 80003330 파란 잔상 · 두손 잔상 = 80003316 붉은 잔상

### 결정 (사용자 2026-09-25 · 원장 "Skill look rule")

- 모험가 파워 스트라이크(1001004)는 2010 빅뱅에 라이브에서 없어졌다 → **없어지기 전 마지막 모습**을 쓴다.
- 사용자 영상(power_strike_versions: 모험가 normal · 캐릭터 lv.10/15/20/25 · 소울마스터)과 대조:
  - 80003316 의 시전(주황 광선) · 타격(붉은 X) = "모험가 normal" 줄. 가장 가까운 완성 판.
  - 지금까지 쓴 11001002 = 소울마스터(시그너스) 줄 — 모험가가 아니다.
  - lv.20/25(분홍 · 자홍)는 캐릭터 레벨별 이펙트 단계(라이브 1차 스킬들과 같은 `CharLevel/10~25` 구조)이고 **MSW 인덱스에 없다**.
  - 모든 줄의 휘두르기 잔상은 파란색 — 인덱스엔 `80003330` 의 한손검(swordOL) 잔상으로만 있다 = 우리 swingO1/O2/O3 과 딱 맞는다.
  - 80003316 의 붉은 잔상은 두손검(swordTL/TS) 전용이다. 영상은 두손검을 안 써서 안 보였을 뿐 → 두손은 그대로 둔다.
- 디자이너 잔상 요청은 **취소**(라이브러리 그림으로 충분).

### 수정

- `Skill/SkillExecutors.mlua`
  - `effectOverrides.SK_W11`: cast `522793cef4ff4b79bdf73b9eda9386f8` · impact `dad03b3a528348bf98295b01edd621a4`(시전당 한 번) · `impact2`(11001002 hit/1) 삭제. 소리는 `castSounds.SK_W11` = 11001002 Use 그대로(80003316 팩에 소리 없음 · 허용된 예외).
  - `trail.swingO1/O2/O3` = 80003330 swordOL `3eeb8db9…` · `8b81d1f1…` · `112f2399…` + `holdFrame = 1`. 2프레임 클립인데 0프레임은 4×4 빈칸이라 1프레임만 계속 보인다. offset 은 0 에서 시작(pivot 관례가 swordTS 와 같음) — Play 에서 맞춘다.
  - `PlaySpriteFlash`: `holdFrame` 인자(≥ 0 이면 `StartFrameIndex = EndFrameIndex = holdFrame` · sprite 면 무시).
  - 주석(`ExecutePowerStrike` 머리).
- `SkillInfo.csv` SK_W11 `#Note` 만(연출 RUID 설명 · 열 · 쉼표 변경 없음).

### Play 검증 5차 (2026-09-25 · `8409d99` · 재입장 + Reimport All · PASS)

| 항목 | 기대 | 결과 |
|---|---|---|
| 빌드 경고 | 1 → 1 | 1 → 1 (`LWA-1111` 기존) |
| 시전 | 80003316 주황 광선 · 바라보는 쪽 | PASS (`flipX=true` 오른쪽) · 사용자 확인 OK |
| 타격 | 80003316 붉은 X · 시전당 1회(`hitFx=1`) | PASS 21/21 · 사용자 확인 OK |
| 한손 잔상 O1 · O2 · O3 | 빈 0프레임이 안 보인다 · 위치(오른쪽 · 왼쪽) | PASS(프레임 `1..1` · 6장 홀드 스크린샷 · offset 0) — ⚠ 색은 **주황 · 흰색**(인덱스 설명만 "blue") → 10차 |
| 두손 잔상 T1 · T2 · T3 | 붉은 잔상 그대로 | PASS |
| 잔상 타이밍 | 접촉 프레임에 · 0.35s (4차와 같게) | PASS 1H +0.000~0.036s · 0.325~0.374s / 2H +0.000~0.019s · 0.328~0.383s · 사용자 확인 OK |

## 2026-09-25 (10차) — 잔상 청보라 · 반투명(한손 · 두손 sprite 6장 업로드) · 스폰 첫 프레임 에너지볼트 공 번쩍임 수정

### 결정 (사용자 2026-09-25)

- 5차에서 80003330 한손 잔상이 **주황 · 흰색**으로 나왔다(라이브러리 설명만 "blue" · 다른 swordOL 잔상은 인덱스에 없음). 곱셈 틴트(`SpriteRenderer.Color`)는 가장자리가 붉게 남아 기각.
- 사용자 영상 실측: 잔상 테두리 색상 lv.20 ≈254° · lv.25 ≈267° · 소울마스터 ≈253° / 원화 주황 테두리 ≈16~18°. 불투명도 lv.20 0.5~0.7 · lv.25 0.75~0.9(뒤가 비친다).
- → 원화 PNG 의 **색상(hue)만 +249°** 돌린다(흰 심 · 채도 · 명도 · 알파 그대로 · 테두리 ≈265° = lv.25 최신 판). 알파는 그림에 굽지 않고 드러낼 때 **0.75**(조절 가능).
- 두손검도 같은 색으로(영상에 두손검 화면이 없어 스킬당 한 모습 규칙으로 한손검에 맞춤). 두손 원화도 심이 불투명(중앙값 알파 255 · 한손과 같다).
- Play 메모리 미리보기(60 · 75 · 90) 뒤 **0.75** 로 결정.

### 올린 sprite (팀 저장소 `mIYbC` · subcategory skill · Bilinear · Clamp)

| 이름 | RUID | 원본 | 크기(덧댄 뒤) | pivot(정규화) |
|---|---|---|---|---|
| `SK_W11_trail_swingO1_bv` | `cca9eafd3ad24498a5fed8c462516491` | 80003330 swordOL/swingO1 1프레임 88×84 · pivot (98, 3) | 99×84(오른쪽 +11) | 0.989899, 0.035714 |
| `SK_W11_trail_swingO2_bv` | `11526e1b2139402186ead499db260098` | 80003330 swordOL/swingO2 1프레임 96×96 · pivot (81, 38) | 96×96 | 0.843750, 0.395833 |
| `SK_W11_trail_swingO3_bv` | `93eab70df40a492da810bcc87db9de27` | 80003330 swordOL/swingO3 1프레임 100×60 · pivot (111, 2) | 112×60(오른쪽 +12) | 0.991071, 0.033333 |
| `SK_W11_trail_swingT1_bv` | `c1eb14cb8bae4435a147ae9f5600e70a` | 80003316 swordTL/swingT1 168×120 · pivot (123, −7) | 168×127(아래 +7) | 0.732143, 0.000000 |
| `SK_W11_trail_swingT2_bv` | `7d57f092f304406b8dcc1bccff89329b` | 80003316 swordTL/swingT2 144×88 · pivot (116, −2) | 144×90(아래 +2) | 0.805556, 0.000000 |
| `SK_W11_trail_swingT3_bv` | `56cf907e48934fd795e46f58fa23c7d4` | 80003316 swordTL/swingT3 164×124 · pivot (120, 34) | 164×124 | 0.731707, 0.274194 |

pivot 이 그림 밖이던 원화는 투명 여백을 덧대 pivot 을 그림 안으로 옮겼다(발 기준 위치는 그대로). Play 메모리 확인: O1 · T1 홀드 프레임이 원화와 같은 자리 · 같은 크기.
원본 · 시안 PNG = 저장소 밖 `design-handoff/trail-recolor/`.

### 스폰 첫 프레임 번쩍임 (Play 프레임 실측)

- 잔상 엔티티를 클라에서 매 프레임 관찰: **스폰 프레임(+0.000s)** 엔 모델 기본값(SpriteRUID `d393500f` = 에너지볼트 공 · 알파 1), **다음 프레임(+0.017s)** 에 서버 설정(잔상 sprite · 알파 0)이 온다. 스폰 뒤 속성 쓰기는 첫 복제 상태에 못 들어간다.
- 같은 모델(`model://skillprojectile`)을 쓰는 곳은 B 파일 두 군데뿐:
  - `SkillExecutors.PlaySpriteFlash` — 파워 스트라이크 잔상(SK_W11 · 한손 · 두손 전부).
  - `SkillAttack.SpawnOneProjectile` — 투사체 스킬. 스킬별 sprite 를 스폰 뒤에 넣는 **더블 샷(SK_A11 화살) · 스나이핑(SK_A21 큰 화살) · 럭키 세븐(SK_T11 표창 · 볼리 2발째 포함)** 이 같은 번쩍임. 에너지볼트(SK_M11)는 원래 그 공이라 해당 없음.
  - A 파일(보스 · 레인 투사체)은 각자 다른 모델 — 해당 없음.
- 수정 = 모델 기본 sprite 를 비운다(빈 SpriteRUID = 안 그림). 스폰 프레임엔 아무것도 안 그리고, 다음 프레임에 제 sprite 가 온다.

### 수정

- `Models/Skills/SkillProjectile.model`(ModelBuilder): `SpriteRendererComponent.SpriteRUID` = `""`(예전 `d393500f…`). 컴포넌트 · OrderInLayer 그대로. (빌더가 줄바꿈을 LF 로 저장 — 이 저장소엔 LF · CRLF 모델이 섞여 있다.)
- `Skill/SkillAttack.mlua`: `DefaultProjectileSpriteRUID = "d393500f…"`(에너지볼트 공) 속성 추가 · `SpawnOneProjectile` 이 **항상** sprite 를 넣는다(스킬별 ball 이 없으면 이 값) → 에너지볼트 모습 그대로.
- `Skill/SkillExecutors.mlua`:
  - `effectOverrides.SK_W11.trail` 6개 = 위 `_bv` sprite · `holdFrame` 삭제(1장짜리 sprite) · `trailAlpha = 0.75` 추가.
  - `PlaySpriteFlash(…, holdFrame, alpha)`: 드러낼 때 `alpha`(음수면 모델 기본값). 숨긴 채 스폰 · 타이밍은 8차 그대로.
- `SkillInfo.csv` SK_W11 `#Note` 만(잔상 설명 · 열 · 쉼표 변경 없음).

### Play 검증 6차 (2026-09-25 · `cbe687a` · 재입장 + Reimport All · Maker MCP · PASS · 사용자 시각 확인 OK → Ready)

빌드 경고 1 → 1(`LWA-1111` 기존 · 에러 0). 실행 경고 9건 = 전부 기존(시작 `BossCatalog` 4 · `LWA-3047` 3 · 첫 시전 `LWA-3048` 2) — **빈 SpriteRUID / RUID 경고 0건**(파워 스트라이크 16회 · 투사체 13발).

| 항목 | 기대 | 결과 |
|---|---|---|
| 한손 · 두손 청보라 잔상 | 알파 0.75 로 드러남 · 접촉 프레임에 · 0.35s | PASS 16회(1H · 2H × 좌우 × 4) · 알파 0 → 0.75 바로 · 접촉 뒤 +0.000~0.037s · 0.322~0.363s |
| 위치 swingO2 · O3 · T2 · T3 (좌우) | 원화와 같은 자리 | PASS 8쌍(같은 홀드 포즈에서 `_bv` · 원화 번갈아) — 자리 · 크기 · 모양 같음 |
| 스폰 첫 프레임 — 잔상 | 에너지볼트 공이 안 보인다 | PASS 16/16 · 스폰 프레임 SpriteRUID 빈 값 → +0.017s 잔상 sprite · 알파 0 |
| 더블 샷(SK_A11) · 스나이핑(SK_A21) · 럭키 세븐(SK_T11) | 첫 보이는 프레임부터 제 sprite | PASS — 화살 `3ee73e25`(2회 4발) · 큰 화살 `07a44ad4` · 표창 `5d2441df` ×1.3(2회 4발) · 공 없음 · 빠진 sprite 없음 |
| 에너지볼트(SK_M11) | 공 모습 그대로 | PASS — 빈 값 → +0.018s 공 `d393500f` |
| 사용자 시각 확인 | — | **OK** — 1H · 2H 청보라 0.75 · 좌우 · 발밑 번쩍임 없음 → **Ready**(A 리뷰 대기) |

직업 전환 · 투사체 속도(스크린샷용 1.2) · 홀드 포즈는 전부 메모리만.
별건(무관 · 수정 안 함 · 원장 궁수 라운드 메모): 더블 샷 둘째 화살(VisualOnly)이 첫 화살 명중 뒤 대상 주변을 돌며 매 프레임 좌우로 뒤집힌다(약 0.5s · 유도 로직).

## 2026-09-25 (7차) — WeaponMotion.csv 줄바꿈 수리 · SK_W11_1 행은 main 그대로

#94(`b/skill-warrior-effects`)와 로컬에서 합쳐 보다 찾았다(미리보기 캡처용 로컬 브랜치 · 푸시 안 함).

- **줄바꿈이 깨져 있었다**: 이 PR 이 고친 `WeaponMotion.csv` 행 6개 중 4개(`SK_W11_1` · `SK_W11_2` 1H/2H)는 `#Note` 가운데에 CR 이 하나씩 끼어 있었고, 2개(`SK_W11` 1H/2H)는 줄 끝이 CRLF 가 아니라 LF 였다(main · 다른 행은 전부 CRLF). 내용은 그대로 두고 줄바꿈만 CRLF 로 고쳤다.
- **union 병합 중복**: 이 PR 은 9~12행, #94 는 바로 아래 13~14행을 고친다. `*.csv merge=union`(`.gitattributes`)이라 둘을 어느 순서로 합쳐도 충돌 대신 두 쪽 줄을 다 남겨 `MOTION_SK_W11_*` · `MOTION_SK_W21_SWORD_*` 가 두 줄씩 생기고 줄바꿈이 섞였다(`PlayerMotion` 은 같은 키면 뒤 행이 이겨 머지 순서에 따라 #94 의 하이퍼 바디 한손 자세가 옛 heal 행으로 되돌아갈 수 있었다 · 파워 스트라이크는 `SkillMotionSet` 을 쓰므로 영향 없음). `check-integrity` C3(`WeaponMotion: ["MotionId"]`)는 병합 결과에서 FAIL 6건으로 잡지만, PR 검사는 상대 PR 이 머지되기 전 main 기준이라 다시 돌리지 않으면 통과로 보일 수 있다.
- **수리**: `MOTION_SK_W11_1_SWORD_1H/2H`(11~12행)는 **main 그대로** 둔다 — 부르는 코드가 없어(`SK_W11_1` 호출 없음) 켜져 있어도 무해하고, 이 PR 과 #94 사이에 바뀌지 않은 줄이 생겨 병합이 깨끗해진다. `SK_W11` 1H/2H 끔(9~10행) · `SK_W11_2` 끔(66~67행)은 그대로.
- 확인: 3-way 병합(`git merge-file` · main 기준) — 이 PR → #94 · #94 → 이 PR 둘 다 충돌 0 · 결과 같음 · CRLF 74 · 중복 키 없음. **머지 순서 자유.**
