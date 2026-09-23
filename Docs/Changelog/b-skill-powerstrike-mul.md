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
