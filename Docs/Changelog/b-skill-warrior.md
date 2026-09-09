# b/skill-warrior — 전사 스킬 5종 (B)

> Draft PR #48 `[b/skill-warrior] 전사 스킬 5종 — 파워 스트라이크·아이언 바디·하이퍼 바디·도발·불굴의 진` · base `b/skill-magician`(PR #47 · 스택 · 분기점 `62bfb18` = #47 + `main` 24204a3). 이 브랜치의 조각 로그. 릴리스 때 `Docs/CHANGELOG.md` 로 합친다(협업-규칙 §11).
> 근거: `Docs/추가기획1/기획 정리 ….md` 전사 표 · `Docs/추가기획1/구현항목-결정.md` §3(피격 파이프라인 훅 · `Taunt` 훅) · `Docs/스킬-모션-구현맵.md`(모션은 `PlayerMotion.PlaySkill` 이 시전마다 이미 호출 · `WeaponMotion` 행은 액션명 미검증이라 추가 안 함).
> 계약 변경 없음: 새 표·열·열거값·이벤트 없음. `SkillBehavior`(MELEE_ARC·PASSIVE·BUFF_SELF·TAUNT·ORIGIN) · `BuffTag`(REFLECT_HP_PCT·HYPER_BODY·INVULNERABLE) 은 계약서 §0-2 값 그대로. A 파일 편집 없음 — A 의 공개 API 호출만(`StatService.SetLayerCsv` BUFF 레이어 = 계약상 B 몫 · `StateChaseMonster.SetTarget` · `UserEnterEvent` · 플레이어 `HitEvent`).

## 2026-09-09

### `RootDesk/MyDesk/Skill/SkillBuffs.mlua` — 반사·최대 HP·피해 감소·무적
- **아이언 바디(SK_W12 · B 패시브) — A 연결 없이 동작.** 서버 `OnBeginPlay` 가 `UserEnterEvent` + 이미 들어온 유저에 대해 `AttachHitListener(uid)` → 플레이어 엔티티 `HitEvent`(엔진 · `HitComponent.OnHit` 기본 동작이 발행 · `AttackerEntity`/`TotalDamage`) 구독. `OnPlayerHitEvent`: 공격자가 플레이어가 아니고 `_FactionLogic:IsEnemy` 인 몬스터면 `floor(PlayerComponent.MaxHp × 반사율/100)` 을 `SkillAttack.DealFlatDamageToTarget` 로 되돌린다. 반사율 = `GetReflectRatio(uid)` = `_JobPassiveLogic:PassiveRatio(uid, "REFLECT_HP_PCT")`(스킬 레벨 · 5~25%). 들어오는 피해는 건드리지 않는다(그건 A 의 `PlayerHit`). `OnEndPlay` 가 핸들러를 전부 끊는다. `ReflectEnabled=false` 로 로그만 남길 수 있다.
- **하이퍼 바디(SK_W21 · C):** `ApplyBuff` 가 `HYPER_BODY` 면 `ApplyHyperBodyHp(uid, ratio)` — 기준(현재 MaxHp − 이미 넣은 보너스) × 20~60% 를 **A 의 `StatService.SetLayerCsv(uid, "BUFF", "maxhp=N")`** 로 넣는다(`StatService.ApplyToEntity` 가 차이만큼 `PlayerComponent.MaxHp` 에 더하고 `StatRecalculatedEvent` 도 낸다). 현재 HP 도 같은 양만큼 올린다(원작). 재시전은 차이만. `ExpireBuff`/`ResetMatchState` → `ClearHyperBodyHp`(레이어 "" · StatService 가 Hp clamp). StatService 가 없으면 `MaxHp` 직접 쓰기 폴백(경고 로그).
- **피격 파이프라인 조회 API(A 가 `PlayerHit` 에 연결 · 전부 ServerOnly):** `GetDamageMul(uid)` = 무적 0 · ×(1 − 하이퍼 바디 Secondary 20~40%) · ×(1 − 매직 가드 흡수율). `ReduceDamage(uid, dmg)`(하이퍼 바디만). **`ModifyIncomingDamage(uid, dmg)` = 무적 → 0 · 하이퍼 바디 감소 · 매직 가드 흡수(MP 차감 포함)** 한 줄 진입점 — `PlayerHit.OnHit` 오버라이드가 `__base:OnHit` 전에 한 번 부르면 된다. `IsInvincible(uid)` 는 `PlayerHit.IsHitTarget` 에서 false 반환용(넉백까지 없음 = "아무 영향도 안 받음").
- 새 property: `TagHyperBody` · `TagReflect` · `ReflectEnabled` · `hyperBodyBonus` · `hitHandlers` · `userEnterHandler`.

### `RootDesk/MyDesk/Skill/SkillExecutors.mlua`
- `ExecuteMeleeArc`: `meleeSingleTarget = { SK_W11 }` — **파워 스트라이크는 앞쪽 상자(Range × `MeleeArcHeight` 1.5) 안 최근접 하나**에 HitCount 회(`FindSkillTarget(preferBoss=false)` → `DealSkillDamageToTarget`). 대상 없음 = 소모 유지 + 로그(원작 헛스윙). 섬머솔트 킥(SK_P11)은 상자 전부 그대로. 임팩트 파티클 `SparkExplosion`(대상 위치).
- `ExecuteOrigin`: **버프형 분기** — `BuffTag` 가 있고 `EffectUnit ≠ ATK_PCT` 인 행(불굴의 진 SK_W31)은 피해 없이 시전 즉시 `_SkillBuffs:ApplyBuff(INVULNERABLE, DurationAt=8)`. 컷신은 시전 락(아래). 파티클 `Aura`.
- `ExecuteTaunt`: **도발 실구현.** 반경 = `RatioAt`(BaseEffect 3 + 0.5/lv) 상자(시전자 중심 · 2r×2r)에서 `SkillAttack.FindSkillTargets` → `IsEnemy` 인 몬스터마다 ① `StateChaseMonster.SetTarget(caster)`(자동 탐색 잠금 = 시전자 고정 추격) ② 보스(`script.BossSkillRunner`)가 아니면 `RigidbodyComponent:SetWorldPosition(시전자 x ± 0.6·⌈i/2⌉, 시전자 y)` 로 끌어모은다(`TauntPull` 로 끔). `DurationAt`(CSV 5초 · 0 이면 `TauntDefaultSeconds`) 뒤 `ReleaseTaunt(stamp)` 가 그 도발로 잠근 몹만 원래 `IsChaseNearPlayer` 로 되돌린다(연속 도발은 새 stamp). A 의 `Taunt(target, seconds)` 훅이 생기면 ①② 를 그 호출로 바꾸면 된다.
- 새 property: `meleeSingleTarget` · `MeleeArcHeight` · `TauntPull` · `TauntPullSpacing` · `TauntDefaultSeconds` · `tauntRestore` · `tauntStamp`.

### `RootDesk/MyDesk/Skill/SkillAttack.mlua`
- `FindSkillTargets(skillId, shape) → table`(ServerOnly): probe 패스로 상자 안 몬스터 전부(피해 없음 · 정렬 없음). 도발용.
- `DealFlatDamageToTarget(target, amount, sourceSkillId)`(ServerOnly): `FlatTag="flat"` 패스 — `CalcDamage` 가 이 태그면 `PendingFlatDamage` 를 그대로 돌려준다(스킬 표 무시). 아이언 바디 반사용. 몬스터 무적시간(`MonsterHit.ImmuneCooldown` 0.4s)에 걸리면 그 반사는 조용히 빠진다.

### `RootDesk/MyDesk/Skill/SkillHotbar.mlua` — 직업별 슬롯
- 슬롯 표가 `skillId` 하나에서 **`byJob = { MAGICIAN=…, WARRIOR=… }`** 로. `ResolveSlotSkillId` 가 `PlayerSkillState.LocalJobId()`(미러)로 누르는 순간 고른다. `"TELEPORT"` 값이 옛 `resolver` 를 대신한다. 없는 직업/슬롯 = "empty (job=…)" 로그.
- 슬롯 문자 규칙(마법사 배치를 일반화): **Q = A 주력 · W = C · E = D 전투 핵심 · R = 궁 · Shift = 이동기.** 전사: **Q 파워 스트라이크 · W 하이퍼 바디 · E 도발 · R 불굴의 진.** 마법사 배치는 그대로(Q/Shift/E/R · W 비움). 바꾸려면 표 한 줄.

### `RootDesk/MyDesk/Skill/SkillCaster.mlua`
- `castLockOverrides` += `SK_W11 0.5` · `SK_W21 0.6` · `SK_W22 0.6` · `SK_W31 1.5`(컷신 포즈 · 무적 8초는 버프가 따로 센다).

### `RootDesk/MyDesk/Job/JobPassiveLogic.mlua`
- `LogPassives` 한 줄에 `reflect N%`(아이언 바디) 추가 — 배운 직후 검증 증거.

### `RootDesk/MyDesk/SkillInfo.csv` — B 소유 5행의 값·`#Note` 만 (헤더 불변 · 행 추가 없음)
- `SK_W22` Duration 0 → **5**(도발 고정 추격 시간 · 표에 없어 TENTATIVE).
- `SK_W11` · `SK_W12` · `SK_W21` · `SK_W31` 는 `#Note` 만(구현 위치). `SK_W31` 의 따옴표 노트는 쉼표 없는 노트로 교체(Maker 재이스케이프 방지 · 2026-09-09 교훈).
- 표에 없는 값은 그대로 TENTATIVE: 파워 스트라이크 쿨 3s·MP 10 · 도발 쿨 20·MP 15 · 하이퍼 바디 MP 20 · 불굴의 진 MP 0.

### 해석 메모 (표와 코드가 어긋날 수 있는 곳)
- **"단일 대상 강한 공격"** → 최근접 하나(보스 우선 아님 · 원작 파워 스트라이크). 발록전에서 보스 우선이 필요하면 `FindSkillTarget(…, true)` 한 인자.
- **"본인 HP 에 비례한 반사"** → **최대 HP** 기준(`HP_PCT`). 현재 HP 기준으로 바꾸려면 `OnPlayerHitEvent` 의 `MaxHp` → `Hp` 한 곳.
- **"주변 몬스터를 한곳에 모음"** → 끌어모으기 + 고정 추격 5초. 끌어모으기만 원치 않으면 `TauntPull=false`. 보스는 끌지 않는다(대상만 전환).
- **"8초간 아무 영향도 안 받음"** 의 실제 피격 무효·넉백 무효는 **A 의 `PlayerHit` 연결 뒤에만** 보인다(매직 가드 흡수와 같은 상황). 그 전엔 `[Buff] ON INVULNERABLE` 로그와 무적 중 `IsInvincible=true` 만 확인 가능.
- **"시전 시 특별한 재화 필요"** → 그런 재화가 없어 `UseLimit 1`(매치당 1회 · 대마법과 동일). 재화가 생기면 `SkillCaster.RequestCast` 게이트 한 줄.

### A 에게 (이 PR 로 열리는 연결점 · A 파일 편집 없음)
1. `PlayerHit.mlua`(등록서 8번): `IsHitTarget` 에서 `if _SkillBuffs:IsInvincible(uid) then return false end` · `OnHit` 오버라이드에서 `damage = _SkillBuffs:ModifyIncomingDamage(uid, damage)` 뒤 `__base:OnHit(...)` — 불굴의 진·하이퍼 바디 감소·매직 가드 흡수가 한 번에 산다. (`OnHit` 시그니처는 `HitComponent.d.mlua` 그대로 · ExecSpace 없음 · LEA-3014)
2. `Monster/` 에 `Taunt(target, seconds)` 훅이 생기면 `SkillExecutors.ExecuteTaunt` 의 `SetTarget` + `SetWorldPosition` 두 줄을 그 호출로 바꾼다(B 가 한다 · 통보만).
3. `StatService` BUFF 레이어는 이제 하이퍼 바디가 `maxhp` 한 키로 쓴다 — 다른 B 버프가 레이어를 같이 쓰게 되면 `SkillBuffs` 가 합쳐서 낸다(A 쪽 변경 없음).

### 검증
- `node Docs/tools/check-integrity.cjs` — **통과** (경고 3건 = 기존 A 쪽 C5×2 · C6×1 · 기준선과 같음). `SkillInfo.csv` 27행 전부 30열 · BOM/LF 유지.
- Maker 런타임: 🟡 **미검증** — 이 세션엔 Maker MCP 가 없다. Maker 닫고 `강화하고살아남기` 를 `b/skill-warrior` 로 두고(이미 이 브랜치) 열기 → `Reimport All` → 빌드 경고 수 N → N 기록 → Play:
  - 시작: `[Buff] SkillBuffs ready (hit listener for reflect)` · `[Buff] hit listener attached (<uid>)` · `Symbol not found` 없음 · `LEA-3018` 없음
  - ⚠ 테스트 준비(커밋 금지): 전직은 초보자에서 1회라 F10 순환으로 전사를 고르려면 `PlayerSkillState.DevAllowJobSwitch = true` · 반복 시전용 `SK_W31` UseLimit 1→0 · `SK_W21` Cooldown 60→5. 리뷰 전 원복.
  - K 창 → F10 → `[Skill] JOB … -> WARRIOR/1` → `+` 로 SK_W11·SK_W12·SK_W21·SK_W22·SK_W31 배우기(DevStatRemote 로 레벨 30) → SK_W12 직후 `[JobPassive] … reflect 5%`
  - **Q**: `HOTBAR: slot1 Q SK_W11 cast ok=true` · `SkillAttack: FindSkillTarget SK_W11 candidates=N preferBoss=false -> <이름>` · `SkillAttack: dealt SK_W11 to <이름> lv=1 hits=1`(75×150% = 112) · 앞에 아무도 없으면 `MELEE_ARC SK_W11 no target in front — cast consumed`
  - **피격(아이언 바디)**: 몬스터에게 맞을 때 `[Buff] IRON_BODY reflect N -> <몬스터> (ratio=5% maxHp=… took=…)` · `SkillAttack: flat N to <몬스터> (src=SK_W12)` · 몬스터 HP 가 N 만큼 줄어드는지(0.4s 무적에 걸리면 `flat` 로그는 나도 HP 는 그대로 — 정상)
  - **W**: `[Buff] ON HYPER_BODY … ratio=20 secondary=20` · `[Stat] recalculated (<uid>) source=BUFF … maxhp=N` · `[Buff] HYPER_BODY maxHp B +N (20%) -> M hp=…` · HUD 최대 HP 상승 · 45초(테스트 값이면 그대로 45) 뒤 `[Buff] OFF HYPER_BODY` · `[Buff] HYPER_BODY maxHp bonus cleared (-N)` · `[Stat] recalculated … source=BUFF` · HUD 복귀
  - **E**: 몹 무리 근처에서 `SkillExecutors: TAUNT SK_W22 radius=3 candidates=N taunted=M pulled=K for 5s` · 몹들이 발 앞에 모여 시전자를 쫓는지(⚠ 다른 발판 몹은 떨어져 착지하는지) · 5초 뒤 `TAUNT released M`
  - **R**: `SkillCaster: cast lock ON … SK_W31` · `[Buff] ON INVULNERABLE … dur=8` · `SkillExecutors: ORIGIN SK_W31 buff INVULNERABLE for 8s (no damage)` · 8초 뒤 `[Buff] OFF INVULNERABLE` · 재시전 `use limit reached (1)`. **피해는 A 연결 전까지 그대로 들어온다.**
- 🟡 런타임 미검증 API(근거는 `.d.mlua`·팀 코드): 플레이어 `HitEvent` 를 Logic 에서 `ConnectEvent` 로 받는 것 · `RigidbodyComponent:SetWorldPosition` 으로 몬스터 끌기(발판 다른 몹) · `StateChaseMonster` 를 `GetComponent("script.StateChaseMonster")` 로 얻어 `SetTarget`/`IsChaseNearPlayer` 쓰기 · `StatService.SetLayerCsv("BUFF")` 뒤 `PlayerComponent.Hp` 서버 쓰기 반영.

## 2026-09-10 (마법사 세션이 이 브랜치에 얹음) — 매직 가드 임시 자가 배선
- `Skill/SkillBuffs.mlua` `OnPlayerHitEvent` 맨 앞에서 `MagicGuardRefund(userId, TotalDamage)`: 매직 가드 활성이면 `AbsorbDamage`(SpendMp 로 MP 차감) 뒤 흡수분만큼 HP 를 0.05s 뒤 되돌린다(HitEvent 는 피해 확정 뒤라 되돌리는 방식). `MagicGuardSelfWire=true` — A 가 `PlayerHit` 에서 `ModifyIncomingDamage` 를 부르게 되면 false 로(안 끄면 흡수 2회). 한 방 치명 피해는 못 살린다.
- 근거: 사용자 발록전 검증 요청("맞을 때 HP 대신 MP 가 준다" 확인). SkillCaster.UseSpendMp 는 b/skill-magician 에서 true 로 켜졌다.
