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
| `:11-12` · `:66-67` (B 행) | `SK_W11_1` · `SK_W11_2` `Enabled=false`(부르는 코드 없음) |
| `SkillInfo.csv` SK_W11 `#Note` | 새 팩 · 1타 설명. 수치 열 변경 없음 |

헤더 변경 없음 · 새 CSV 열 · 이벤트 · RPC 없음.

### Play 검증 (3차)

(재입장 · Reimport All 뒤 추가) — Ctrl 기본 공격이 무기 세트에서 무작위로 고르는지(증거) · swingO1/swingT1 클립 길이 실측 → `hitAt` · 시전 락 교체 · skill-maker 하네스(P · H/D) · Lv1 = 112 · Lv5 = 225 (한 대상 · 다른 몬스터 0) · 시체는 안 맞음 · 빌드 경고 N → N

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

(재입장 · Reimport All 뒤 추가) — 수비대 옆에서 스킬 → 수비대 피해 0 · 몬스터는 그대로 피해 · 빌드 경고 N → N

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

(재입장 · Reimport All 뒤 추가) — 맨손: 파워 스트라이크 · 에너지볼트 거절 + 토스트 · MP/쿨다운 그대로 · 하이퍼 바디 · 텔레포트는 시전됨 / 무기 장착: 전부 정상 · 빌드 경고 N → N

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

(재입장 · Reimport All 뒤 추가) — 쉐도우 파트너 분신 · 에너지 차지 불꽃이 플레이어 바로 뒤 · 시설 · NPC 앞 · 공중 시전도 뒤 · 로그 `layer=Default/3` · 빌드 경고 N → N
