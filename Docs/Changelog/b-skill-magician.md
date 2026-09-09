# b/skill-magician — 마법사 스킬 5종 (B)

> Draft PR `[b/skill-magician] 마법사 스킬 5종 — 연성·텔레포트·텔레포트 강화·매직 가드·대마법` · base `feature/skill`(PR #32 · 스택). 이 브랜치의 조각 로그. 릴리스 때 `Docs/CHANGELOG.md` 로 합친다(협업-규칙 §11).
> 근거: `Docs/추가기획1/기획 정리 ….md` 마법사 표(A 에너지볼트는 feature/skill `54d781b` 에서 완료) · `Docs/추가기획1/구현항목-결정.md` §3(A 가 제공할 훅 · B 가 제공할 배율/조회) · `.claude/skills/maplestory-skill-maker/references/movement/{skills,teleport,common}.md`.
> 계약 변경 없음: 새 표·열·열거값·이벤트 없음. `SkillBehavior`(BLINK·BUFF_SELF·ORIGIN·PASSIVE) · `BuffTag`(MAGIC_GUARD·COST_REDUCE_UPGRADE) · `SinkType`/`SourceType` 은 계약서 §0-2 값 그대로.

## 2026-09-09

### 신규 `RootDesk/MyDesk/Skill/SkillBuffs.mlua` — 버프 원장 + 피격·비용 조회 API (D 매직 가드)
- 서버 `buffs[userId][buffTag] = { skillId, level, endsAt, stamp, ratio, secondary }`. `ApplyBuff`(BUFF_SELF 실행기가 호출 · 재시전 = 갱신) → `SetTimerOnce` 만료(`stamp` 로 옛 타이머 무시). 조회는 항상 `GetBuff` 가 만료 시각을 재검사.
- **A 가 연결할 조회 API(구현항목-결정 §3 "피격 파이프라인")** — 전부 ServerOnly · userId 기준: `GetDamageMul(userId)`(= 1 − 흡수율) · `AbsorbDamage(userId, damage) → HP 가 받을 피해`(흡수분은 MP 가 있는 만큼만 · 차감은 `SummonManager.SpendMp` — `SkillCaster.UseSpendMp` 가 false 인 동안 로그만) · `IsInvincible(userId)`(INVULNERABLE 값만) · `GetShield` · `GetReflectRatio` · `ConsumeEvadeOnce`(후속 태그 자리 · 기본값).
- 스킬 시스템 내부: `GetMpCostMul(userId)`(매직 가드 활성 = ×1.5 · `MagicGuardMpCostMul`) · `GetOnHitBonusDamage(userId)`(현재 MP × Secondary 5%).
- 클라 미러 `SyncBuffs("TAG:lv:endsAt,…", userId)` → `LocalIsActive` · `LocalRemaining` · `LocalMpCostMul`(시전 예측). `SkillStateChangedEvent.What` 은 계약 값 4종 그대로(새 값 안 넣음).

### 신규 `RootDesk/MyDesk/Skill/SkillMovement.mlua` — 텔레포트 클라 실행기 (특이사항 텔레포트 · C 텔레포트 강화)
- **클라 우선**: 위치 소유자인 클라가 `TryTeleport(skillId, skill)` 로 목적지를 풀고 `MovementComponent:SetWorldPosition(Vector2)` 로 즉시 옮긴다. 성공했을 때만 `SkillCaster.Cast` 가 `RequestCast` 를 보낸다. 취소는 부작용 0(쿨다운·MP·이펙트·서버 요청 없음). 서버는 옮기지 않는다(목적지·방향을 서버로 안 보낸다 — movement/skills.md "forbidden topology").
- 방향: 시전 순간 `_InputService:IsKeyPressed` 로 방향키 4방향. 없으면 `LookDirectionX`. 좌우+상하 동시면 좌우 우선(레퍼런스는 거절 — 핫바 W 한 키로도 나가야 해서 완화).
- MapleTile 착지(`FootholdComponent:RaycastAll` · `Foothold:GetYByX/IsVertical` · `Next/PreviousFootholdId` 체인): 좌우 = `direct`(목적지 아래 발판 · 경로 벽 통과) → `wall`(경로 벽 앞 · 가장 먼 벽) → `edge`(현재 발판 체인의 진행 방향 끝) → `raw-fall`(그대로 이동 · 낙하). 상하 = 그 방향 안 가장 먼 수평 발판, 없으면 취소. 분기 이름이 로그에 남는다.
- 🟡 런타임 미검증 API: `MovementComponent:SetWorldPosition` 클라 쓰기 · `RaycastAll` 반환(순서 무시) · 발판 체인 · 공중 `GetCurrentFoothold`.

### 신규 `RootDesk/MyDesk/Job/JobPassiveLogic.mlua` — 직업 패시브 배율 (B 연성)
- 구현항목-결정 §3: A 의 `Economy/CostResolver` 가 "난이도 × `_JobPassiveLogic`" 로 곱한다. **B 의 심볼을 아는 A 파일은 CostResolver 하나뿐 → 이 스텁이 먼저 머지돼야 A 브랜치가 빌드된다.**
- `GetJobCostMul(userId, sinkType)`: `COST_REDUCE_UPGRADE`(연성 SK_M12) → `ENHANCE` **메소만**(보석 개수 그대로). `COST_REDUCE_RECRUIT`(선원 관리 SK_P12) → `MONSTER_RECRUIT` · `MONSTER_TRAIN`. 값 = 1 − RatioAt/100 (30%→50% = ×0.7→×0.5).
- `GetJobDropMul(userId, sourceType)`: `DROP_RATE_DREAM_SHARD`(포커스 SK_A12) → `BOSS_KILL` · `ELITE_KILL`(잠정). 값 = 1 + RatioAt/100.
- ExecSpace 없음(양쪽): 서버 = `PlayerSkillState.GetSkillLevel`, 클라 = 로컬 유저 미러(`IsServer()` 콜론 호출로 분기). 숫자는 전부 `SkillInfo.csv` PASSIVE 행.
- `LogPassives(userId)`: 배운 직후 배율 로그(검증 증거).

### `RootDesk/MyDesk/Skill/SkillCaster.mlua`
- MP 게이트 양쪽에 `SkillBuffs` 배율: 클라 `LocalMpCostMul()` · 서버 `GetMpCostMul(uid)` → `mpCost = floor(MpCost × 배율)`. `SpendMp` 도 `mpCost` 로. 거절 사유에 필요 MP 표기. 성공 로그에 `mpCost=`.
- 이동 스킬(BLINK) 클라 분기: `_SkillMovement:TryTeleport` 성공 → `RequestCast`, 실패 → `teleport cancelled: <사유>` 로 끝(서버 요청 없음). 락 규칙은 그대로(이동 스킬은 락 없음).
- `castLockOverrides` += `SK_M22 = 0.6`, `SK_M31 = 1.2`(Duration 1.0 텔레그래프 동안 서 있기 = 컷신 박자).

### `RootDesk/MyDesk/Skill/SkillExecutors.mlua`
- `ExecuteBlink`: 출발 이펙트·사운드 즉시 → `BlinkArrivalDelay`(0.15s · 위치 동기화 대기) 뒤 도착 이펙트 + **도착 지점 광역 피해**(`EffectUnit ATK_PCT` 이고 `BaseEffect > 0` 인 BLINK 행 = SK_M21 · 상자 `BlinkArrivalAoeSize` 2.4×1.6 · HitCount). 서버가 본 from/to 를 로그.
- `ExecuteBuff`: BuffTag 가 있으면 `_SkillBuffs:ApplyBuff(userId, skillId, tag, level, DurationAt)`.
- `ExecuteOrigin`: `originSingleTarget = { SK_M31 }` → 화면 상자(`ScreenBoxSize` 12.8×7.2)에서 `SkillAttack.FindSkillTarget(preferBoss=true)` → 보스 우선 · 없으면 최근접 하나에 `DealSkillDamageToTarget` HitCount 회. 대상 없음 = 소모 유지 + 로그. 나머지 ORIGIN 은 기존과 같음(화면 전체 1회).
- `effectOverrides`: 새 스킬 4종은 RUID 미조사(msw-search 없음) → 파티클 폴백(EnergyExplosion/CircleBurst/Buff/Charge/LightningStrikeTall). RUID 확인 시 항목만 추가.

### `RootDesk/MyDesk/Skill/SkillAttack.mlua`
- `IsAttackTarget` 오버라이드(부모와 같은 무주석 시그니처 · LEA-3014 회피): `__base` 통과 후 `probe` 면 `Candidates` 수집만(피해 없음), `SingleTarget` 이 있으면 그 하나만. `PlayerAttack.AttackNormal` 의 2패스와 같은 꼴.
- `FindSkillTarget(skillId, shape, preferBoss)`(ServerOnly): `Attack(shape, "probe")` → 보스(`script.BossSkillRunner`) 우선 · 최근접. `DealSkillDamageToTarget(skillId, level, target, hitCount)`: 대상 위치 `SingleTargetBoxSize` 1.5×2.0 상자 + `SingleTarget` 필터.

### `RootDesk/MyDesk/Skill/SkillDatabase.mlua`
- `DamageAt` = 기존 값 + `_SkillBuffs:GetOnHitBonusDamage(userId)`(매직 가드 활성 시 현재 MP 5%). 0 이 아니면 로그. 기본 공격(A · `StatService.CalcPlayerDamage`)에 얹는 건 A 가 같은 메서드를 부르면 된다.

### `RootDesk/MyDesk/Skill/SkillHotbar.mlua`
- **키 배치 (사용자 결정 2026-09-09)**: **Q** 에너지볼트(SK_M11) · **Shift** 텔레포트(이동기 공통 · `LeftShift`+`RightShift` 둘 다 `Skill2`) · **E** 매직 가드(SK_M22) · **R** 대마법(SK_M31). W/A/S/D 는 빈 슬롯(`Skill5~8` · "empty" 로그만). F 해제. 연성(SK_M12)은 패시브라 키 없음.
- **텔레포트 강화(SK_M21)는 별도 키가 아니다** — "기존 텔레포트의 변화". Shift 슬롯은 `resolver = "TELEPORT"` 이고, 누르는 순간 `ResolveTeleportSkillId()` 가 SK_M21 을 배웠으면 SK_M21, 아니면 SK_M13 을 고른다. 배운 뒤엔 SK_M13 은 더 이상 시전되지 않고 거리 3.9 · 쿨 2→1s · MP 12 · 도착 광역 피해가 전부 SK_M21 행에서 온다. `SkillMovement`/`SkillCaster` 는 바뀌지 않는다(받은 행만 본다).
- "초보자 스킬의 더블 점프가 텔레포트로 바뀐다": `PlayerActionEvent.ActionName == "Jump"` 이고 공중(`RigidbodyComponent:IsOnGround() == false`)이고 그 텔레포트를 배웠으면 같은 `ResolveTeleportSkillId()` 결과를 `Cast`. 지상 점프·미학습은 무시. `TeleportOnAirJump` 로 끌 수 있다. 🟡 액션 이름 "Jump" 미검증.
- 🟡 `SetActionKey(KeyboardKey.LeftShift/RightShift, "Skill2")` — 수식 키가 `PlayerActionEvent` 를 내는지 런타임 미검증. 안 나오면 다른 키로 바꾸는 건 슬롯 표 한 줄.

### `RootDesk/MyDesk/Skill/PlayerSkillState.mlua`
- `RequestLearn` 성공 시 PASSIVE 면 `_JobPassiveLogic:LogPassives(uid)` 한 줄(검증 증거). 원장·동기화 변경 없음.

### `RootDesk/MyDesk/SkillInfo.csv` — B 소유 4행의 값·`#Note` 만 (헤더 불변 · 행 추가 없음)
- `SK_M21` Range 4 → **3.9**(= 텔레포트 3 × 1.3 "이동 거리 30% 증가") · HitCount 0 → 1(도착 광역). 쿨 2 → 1(−0.25/lv) 그대로. 피해 100→200% 는 표에 없어 TENTATIVE 유지.
- `SK_M31` Duration 0 → **1**(컷신 텔레그래프). 6000% 고정 · UseLimit 1 그대로.
- `SK_M13` · `SK_M22` `#Note` 갱신(구현 위치).

### 해석 메모 (표와 코드가 어긋날 수 있는 곳)
- 텔레포트 강화(C)는 **키 없이 Shift 텔레포트를 대체**한다(사용자 결정 2026-09-09 "기존 텔레포트 변화"). 구현은 핫바 resolver 한 곳 — SK_M21 행이 통째로 SK_M13 행을 대신하므로 MP 12(vs 5)도 같이 바뀐다. 텔레포트 MP 를 5 로 유지하고 싶으면 `SkillInfo.csv` SK_M21 `MpCost` 만 고친다.
- 매직 가드 "피해의 35~75% 를 MP 가 대신": HP 감산은 A 의 `PlayerHit`(등록서 8번 · 루트 파일)라 **B 는 `AbsorbDamage` 제공까지**. 연결 전엔 Play 에서 흡수가 보이지 않는다.

### A 에게 (이 PR 로 열리는 연결점 · A 파일 편집 없음)
1. `Economy/CostResolver`(WP2) 에서 `_JobPassiveLogic:GetJobCostMul(userId, "ENHANCE")` 를 `EnhanceService.RequestEnhance` 의 `row.mesoCost` 에 곱하면 연성이 산다(파일 주석 그대로 "여기 한 곳만").
2. `PlayerHit`(또는 A 의 피격 훅)에서 HP 감산 전에 `damage = _SkillBuffs:AbsorbDamage(userId, damage)` 한 줄 → 매직 가드 흡수. `IsInvincible` 도 같은 자리.
3. 기본 공격에 매직 가드 추가 피해를 얹으려면 `StatService.CalcPlayerDamage` 에서 `_SkillBuffs:GetOnHitBonusDamage(userId)` 를 더한다(선택).
4. #41(`b/summon-mp-ledger`) 머지 후 `SkillCaster.UseSpendMp = true` 로 바꾸면 흡수분 MP 차감·스킬 MP 차감이 같이 켜진다.

### 검증
- `node Docs/tools/check-integrity.cjs` — **통과** (경고 3건 = 기존 A 쪽 C5×2 · C6×1 · 기준선과 같음). `SkillInfo.csv` 편집 행 4개 전부 30열 · BOM/CRLF 유지.
- Maker 런타임: 🟡 **미검증** — 이 워크트리를 Maker 로 열어(Maker 닫고 폴더 전환) `Reimport All` → 새 `.codeblock` 3개 생성 확인 → 빌드 경고 수 N → N 기록 → Play:
  - K 창 → F10(마법사) → `+` 로 SK_M12·SK_M13·SK_M21·SK_M22·SK_M31 배우기(DevStatRemote 로 레벨 30) → `[JobPassive] … cost ENHANCE x0.7`
  - Shift(+방향키 · SK_M21 배우기 전): `HOTBAR: slot2 Shift SK_M13 cast ok=true` · `SkillMovement: SK_M13 right from=… to=… branch=direct` · 서버 `SkillExecutors: BLINK SK_M13 server saw from=… to=…` · 공중 점프 키 → `HOTBAR: air-jump -> SK_M13`
  - Shift(SK_M21 배운 뒤): `HOTBAR: slot2 Shift SK_M21 cast ok=true` · `SkillMovement: SK_M21 …` + `SkillAttack: dealt SK_M21 … hits=1`(도착 지점에 몬스터가 있을 때) · 쿨다운 로그 `cd=2`(Lv1)
  - E: `[Buff] ON MAGIC_GUARD … ratio=35` · `[Buff] mirror <- 'MAGIC_GUARD:1:…'` · 이후 Q 시전 로그 `mpCost=12`(8×1.5) · 에너지볼트 피해 로그 `+magicGuard=N` · 45초 뒤 `[Buff] OFF MAGIC_GUARD`
  - R: `SkillCaster: cast lock ON … SK_M31` → 1초 뒤 `SkillAttack: FindSkillTarget SK_M31 candidates=N preferBoss=true -> <이름>` · `dealt SK_M31 to <이름> … hits=1` · 재시전 `use limit reached (1)`

## 2026-09-09 (2차) — 테스트 값 · 원작화 (사용자 요청 · Play 검증 중)

### ⚠ `RootDesk/MyDesk/SkillInfo.csv` — 임시 테스트 값 (리뷰 전 복구)
| 행 | 열 | 원값 → 테스트 | 이유 |
|---|---|---|---|
| `SK_M22` 매직 가드 | Cooldown | **60 → 5** | 반복 시전 테스트 |
| `SK_M31` 대마법 | UseLimit | **1 → 0** | 매치당 1회 제한 해제 (`ResetMatchState` 호출처가 아직 없어 세션당 1회였다) |
`#Note` 에 `⚠TEST` 표기. **Ready for review 전에 원값으로 되돌린다.**

### `SkillInfo.csv` — 원작 근접 (유지)
- `SK_M13` Range **3 → 2.5**, `SK_M21` Range **3.9 → 3.25**(2.5×1.3). 원작 텔레포트는 ≈150px(=1.5) — 더 줄이려면 두 셀만.
- `SK_M11` Speed **6 → 8**(원작 볼트는 빠르다).

### ⚠ `Skill/PlayerSkillState.mlua` — DEV 직업 전환 허용 (리뷰 전 false)
- `DevAllowJobSwitch = true`(기본): `RequestChooseJob` 이 초보자가 아니어도 직업을 바꿔 준다 → F10 이 누를 때마다 MAGICIAN → WARRIOR → ARCHER → THIEF → PIRATE 순환. 같은 직업 재요청은 무시. 레벨 조건(JobTier ReqLevel 10)은 그대로. 실제 규칙(초보자에서 1회)은 `false` 로 되돌리면 복구. 배운 스킬·쓴 SP 는 유지(타 직업 스킬은 CanUse 가 막는다).

### `Skill/SkillCaster.mlua` — 대마법 시전 락 1.2 → 2.5s (원작 오리진 스킬: 컷신 끝까지 이동 불가)
- 제보: 이펙트가 아직 나오는데 캐릭터가 움직인다. 락이 텔레그래프(1.0s)만 덮고 낙뢰 임팩트 파티클 동안은 풀려 있었다. `castLockOverrides.SK_M31 = 2.5`(텔레그래프 1.0 + 임팩트 ≈1.5). 서버 재시전 게이트도 같은 값(×0.9)을 쓴다. 원작의 컷신 중 무적은 A 의 PlayerHit 연결(`_SkillBuffs:IsInvincible`) 뒤에나 가능.

### `Skill/SkillExecutors.mlua` — 시전 파티클이 캐릭터 뒤에 뜨던 문제 (대마법 R 제보)
- 원인: 파티클 폴백은 `PlayBasicParticle` 고정 좌표였고, 그 좌표는 서버가 `RequestCast` 때 읽은 위치 — 이동 중 시전하면 클라보다 왕복 지연만큼 뒤. RUID 이펙트는 이미 `PlayEffectAttached` 로 붙여 둔 상태였다.
- 수정: `PlayParticle(type, stage, caster, pos)` 로 묶고 **"cast" 단계 파티클은 `PlayBasicParticleAttached`(시전자에 부착)**. `impact`(대상·지면) 는 고정 유지. 텔레포트 출발 이펙트는 새 stage 이름 `"depart"`(고정) — 붙이면 이미 옮겨진 클라에서 도착점에 떠 버리므로.

### `Skill/SkillProjectile.mlua` · `Skill/SkillAttack.mlua` — 에너지볼트 조준·유도 (원작: 지정한 적에게 날아가 맞는다)
- `SkillAttack.SpawnProjectile`: 발사 직후 앞쪽 상자(앞으로 Range · 발부터 위로 `AimSearchHeight` 2.5) 안 최근접 몬스터를 `FindSkillTarget(preferBoss=false)` 로 고르고 `mover:SetTarget(target)`. 없으면 예전 그대로 직선. `AimProjectileAtTarget=false` 로 끌 수 있다. 유도 시 수명 ×`HomingLifetimeMul`(1.5). 로그에 `target=<이름|none>`.
- `SkillProjectile`: `TargetEntity`(유도 대상) · `SetDirection2D(dx,dy)`(정규화 2D 방향 + 좌우 뒤집기) · `SetTarget` · `AimAtTarget`(대상 발 + `TargetAimOffsetY` 0.5). `OnUpdate` 가 대상이 유효한 동안 매 프레임 재조준(유도), 대상 소멸 시 마지막 방향 유지. `DirectionY` 가 실제로 쓰인다.
- 🟡 미검증: 위/아래 발판의 몬스터로 날아갈 때 히트박스(0.8×0.8) 통과 여부 · `Scale.x` 뒤집기가 대각선에서도 자연스러운지.
