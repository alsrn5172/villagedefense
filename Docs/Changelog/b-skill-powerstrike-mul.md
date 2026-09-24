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
