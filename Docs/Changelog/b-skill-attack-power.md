# b/skill-attack-power

## 2026-09-23 — 스킬 피해가 장비·강화를 탄다: `GetAttackPower` 를 `_StatService` 로

A 요청 #40 [comment 5794751478](https://github.com/alsrn5172/villagedefense/issues/40#issuecomment-5794751478) · B 수락 [comment 5794891849](https://github.com/alsrn5172/villagedefense/issues/40#issuecomment-5794891849) · 9/14 기획 WO-029 §3 · PR #81.

**헤더 변경 없음 · 새 CSV 열 없음 · 새 이벤트 없음.** `Docs/스키마-계약.md` 는 건드리지 않았다.

### 무엇이 바뀌었나

`Skill/SkillDatabase.GetAttackPower(userId)` 가 두 곳을 순서대로 본다.

1. `_StatService:GetAttackPower(userId)` — A 의 최종 총공격력(무기 + 강화 + 버프 · `Stat/StatService.mlua:363`). `> 0` 이면 이 값.
2. 폴백 = 기존 `JobTier.BaseAttack` 경로(`_PlayerSkillState:GetJobId` → `GetTier` → `jobsByKey`). 전 직업·전 차수 **75 고정**이었다.
3. `JobTier` 행도 없으면 기존대로 `log_warning` 후 `0`.

A 제안은 "`_StatService` 가 없거나 0 이면 `JobTier.BaseAttack` 폴백" 이었는데, **기존 코드의 마지막 폴백은 `BaseAttack` 이 아니라 `0`** 이었다(행을 못 찾으면 `return 0`). 그 `0` 과 경고는 그대로 뒀다 — 조용히 0 딜이 나가는 것보다 로그가 남는 게 낫다.

메서드 머리 주석도 현재 동작에 맞게 고쳤다. 예전 주석은 "`PlayerSkillState` 에 per-user job/tier 접근자가 없어 항상 경고만 내고 0 을 돌려준다"고 적혀 있었는데, `GetJobId`/`GetTier` 가 생긴 뒤로 사실이 아니다.

### 실행 공간 — RPC 를 새로 만들지 않았다

- `_StatService:GetAttackPower` 에는 `@ExecSpace` 가 없다(`StatService.mlua:363`). 원장 `users` 는 `EnsureUser`(`:92`)가 `ServerOnly` 로만 채우므로, 클라에서 불리면 `:365~367` 가드가 **0** 을 돌려준다 — "계정 로드 전"과 같은 값이라 두 경우 모두 폴백으로 내려간다.
- `GetAttackPower` 의 유일한 소비자는 `DamageAt`(`:293`)이고 호출부는 `SkillAttack.CalcDamage`(`:198`) · `SkillProjectile.CalcDamage`(`:276`) 둘뿐이다. 둘 다 **서버에서 돈다**(`SkillAttack.mlua:22~23` 에 `isGeneratedFromServer=true` 로 확인된 기록).
- `AttackComponent` 의 `CalcDamage` 에는 `@ExecSpace` 를 붙이면 안 된다(LEA-3014). 붙이지 않았다.

### 밸런스 영향 — 맨손 수치는 내려간다

교체 전은 **75 고정**(`JobTier.csv` 16행 전부 `BaseAttack=75` · `#Note` 도 전부 `placeholder atk, uniform`). 교체 후는 실제 원장이고, **무기가 없으면** `base.attack = BaseAttack(10) + AttackPerLevel(1) × (레벨−1)`(`StatService.mlua:133`).

| 스킬 | lv1 비율 | 교체 전 (75) | 교체 후 · 1레벨 맨손 (10) | 교체 후 · 10레벨 맨손 (19) |
|---|---|---|---|---|
| `SK_W11` 파워 스트라이크 | 150% | 112 | 15 | 28 |
| `SK_M11` 에너지볼트 | 140% | 105 | 14 | 26 |
| `SK_A11` 더블 샷 | 60% | 45 | 6 | 11 |

75 는 스탯이 없던 시절의 임시 상수였고 이제 그 자리를 장비·강화가 채운다. 맨손 하향은 의도된 결과다.

**타격 수(계산값 · `MonsterInfo.csv` HP ÷ 피해).** `MonsterInfo` 에 방어 열이 없어 몬스터 쪽 감산은 없다 — 플레이어가 **받는** 피해만 `DamageFormula.ApplyPlayerDefense` 를 탄다.

| 몬스터 | Lv | HP | `SK_W11` 교체 전(112) | 교체 후 맨손(15) |
|---|---|---|---|---|
| 달팽이 | 1 | 17 | 1타 | **2타** |
| 파란 달팽이 | 1 | 23 | 1타 | **2타** |
| 스포아 | 3 | 32 | 1타 | **3타** |
| 빨간 달팽이 | 4 | 45 | 1타 | **3타** |
| 아이언호그 | 7 | 90 | 1타 | **6타** |
| 돼지 | 10 | 120 | 2타 | **8타** |
| 초록버섯 | 10 | 140 | 2타 | **10타** |

초반 사냥은 성립하지만 체감이 크게 달라진다. 몬스터 HP·웨이브 밸런스가 이 전제로 잡힌 것인지 A 에게 확인 요청했다(PR #81 본문).

### Play 검증 — 완료 (2026-09-23 23:07~23:16 · Maker MCP)

**환경.** 월드 `0c9db25da1104fa097e8d7159bd19c4f` · 맵 `Orbis_Lobby_VictoriaStation` · uid `20372100010310953` ·
`stop → clear_logs → refresh → logs(build) → play` 순서(verify-checklist §1). 빌드 로그 **에러 0**
(Warning 1 = 기존 `LWA-1111`, 나머지 182 건은 `LIA-1114` Info 노이즈).

**측정 방법.** 값 확인은 `maker_execute_script` 의 `server_main` 컨텍스트에서 `_StatService:GetAttackPower` ·
`_SkillDatabase:GetAttackPower` · `_SkillDatabase:DamageAt` 를 직접 불러 `log()` 로 찍었다. 장비·강화는
운영 경로 그대로 `_InventoryService:GiveItem` → `_EquipService:Apply`(→ `RecalcLayer` → `SetLayerCsv`) ·
`_InventoryService:ApplyEnhance` → `RecalcLayer` 를 썼다. 실제 시전은 `client` 컨텍스트의 `_SkillCaster:Cast("SK_W11")`.
인벤토리·스탯·레벨 원장은 전부 메모리라(`InventoryService:6` "영속은 WP1 몫") `stop` 으로 사라진다.

| 확인 | 기대값 | 실측 | 결과 |
|---|---|---|---|
| a. 전사 lv1 맨손 `SK_W11` | `DamageAt SK_W11 base=15` | `PROBE B0 statAtk=10 skillAtk=10 dmgW11=15` (측정 시점 직업 NOVICE/0 · 원장 공격력은 직업과 무관하게 `BaseAttack` 10) | ✅ |
| b. 무기 장착 후 재시전 | base 상승 | 나무 검(`BaseAttack` 17) 장착 → `PROBE B1 equipped statAtk=27 skillAtk=27 dmgW11=40` | ✅ |
| c. 강화 후 재시전 | base 추가 상승 | +3 강화(ENHANCE +6) → `PROBE C1 enh3 statAtk=33 skillAtk=33 dmgW11=49` | ✅ |
| d. 도적 `SK_T22` 뒤 공격 | `base=N x2 (shadowPartner) -> 2N` | `SkillDatabase: DamageAt SK_W11 base=49 x2.0 (shadowPartner) -> 98` · 해제 후 `PROBE D2 shadowOff dmgW11=49` | ✅ |
| e. 맨손·초반 무기로 사냥 가능 | 위 타격 수 표와 일치 | Lv10 맨손(atk 19 · `dmgW11=28`)으로 달팽이(HP 17) **1시전 처치**(`PROBE E6 snail entity gone (killed)`). 사냥은 된다. 단 **표와는 어긋난다** — 아래 ⑴⑵ | ⚠️ 조건부 |
| f. `no JobTier row` 경고 | 로그에 없음 | 세션 전체 **0건** (NOVICE/0 상태에서 `DamageAt` 를 부른 구간 포함) | ✅ |

**폴백도 살아 있다.** 원장이 비어 있는 가짜 userId 로 확인했다 — `PROBE J1 fallback(ledger miss, WARRIOR/1) skillAtk=75 statAtk=0`.
`NOVICE/0` 도 `JobTier.csv` 에 행이 있어(`NOVICE,0,1,초보자,75`) `PROBE J2 ... skillAtk=75` 다.
즉 마지막 `return 0` + 경고는 **JobTier 에 아예 없는 (job_line, tier) 조합에서만** 난다.

**⑴ 1레벨에서는 `SK_W11` 자체를 못 쓴다.** `SkillInfo.ReqLevel` 이 10 이라 Lv1 시전은 게이트에서 막힌다 —
`SkillCaster: cast(pred) SK_W11 ok=false reason='requires level 10' mp=100 cd=0`.
그래서 위 밸런스 표의 "교체 후 · 1레벨 맨손(10)" 열은 **이론값**이고, 실제로 파워 스트라이크를 처음 쓰는 시점(Lv10)의
맨손 공격력은 19 → `dmgW11=28` 이다(`PROBE E3 level=10 statAtk=19 dmgW11=28 equippedWeapon=''`).
초반 사냥의 체감은 기본 공격(A 의 `PlayerAttack`) 쪽이 정한다.

**⑵ 시전 1회가 몬스터에게 넣는 피해는 `DamageAt` 의 2배로 측정됐다.** 파워 스트라이크는 콤보라
`hit1`/`hit2` 두 패스를 `mul=0.5` 로 나눠 때리는데(`SkillExecutors: POWER STRIKE combo ... hit1+arc@0.45 ... hit2@0.85`),
HP 1000 더미로 재보니 **패스 하나당 `DamageAt` 전액**이 빠졌다 — 두 패스 다 맞은 시전은 `PROBE H1 dummyHp=944.0/1000 damage=56.0`,
`DealSkillDamageToTargetScaled(..., mul=0.5, 1)` 를 서버에서 한 번만 직접 불러도 `PROBE I1 ... damageFromOneScaledPass=28.0` 이다
(`floor(28 × 0.5) = 14` 가 기대값). `SkillAttack.CalcDamage` 는 `DamageAt × PendingDamageMul` 로 곱하고 있으니,
어긋나는 곳은 그 뒤 몬스터 피격 처리 쪽이다. **이번 교체와는 무관한 기존 경로**다 — 바뀐 건 공격력의 출처뿐이고 패스 분할·피격 처리는 그대로다.
다만 위 타격 수 표는 "1시전 = `DamageAt` 1회분" 을 전제로 계산한 값이라, 실제로는 그 절반의 타격 수로 잡힌다.
⑵ 는 별도 확인거리로 남긴다(PR #81 본문에 같이 적는다).

### 건드리지 않은 것

- A 폴더 전부 — `Stat/StatService.mlua` 는 읽기만 한다
- `Skill/SkillAttack.mlua` · `Skill/SkillProjectile.mlua` — 호출부는 그대로
- `.codeblock` — 기존 메서드 본문만 고쳐 재생성 불필요
- `JobTier.csv` — 폴백 경로가 계속 읽으므로 75 행을 그대로 둔다
