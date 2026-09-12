# b/skill-archer-thief-pirate — 궁수·도적·해적 스킬 15종 (B)

> Draft PR `[b/skill-archer-thief-pirate] 궁수·도적·해적 스킬 15종` · base `b/skill-warrior`(PR #48 · 스택 · 분기점 `515853e` + `origin/main` 90b0d92 병합). 이 브랜치의 조각 로그. 릴리스 때 `Docs/CHANGELOG.md` 로 합친다(협업-규칙 §11).
> 근거: 추가기획1 궁수·도적·해적 표 **2026-09-12 사용자 제공 이미지판**(Notion) · `Docs/추가기획1/구현항목-결정.md` §3(A 훅 목록) · `Docs/스킬-모션-구현맵.md`.
> 사용자 요구(2026-09-12): 원작 메이플 스킬과 같거나 비슷한 모습 · 다른 직업의 이펙트와 겹치지 않을 것.
> 계약 변경 없음: 새 표·열·열거값·이벤트 없음. `SkillBehavior`(PROJECTILE·PASSIVE·BLINK·ORIGIN·BUFF_SELF·MELEE_ARC) · `BuffTag`(GUARANTEED_CRIT·DARK_SIGHT·SHADOW_PARTNER·ENERGY_SHIELD·SUPER_TRANSFORM·STACK_GAIN·DROP_RATE_DREAM_SHARD·COST_REDUCE_RECRUIT) · `EffectUnit`(ATK_PCT·RATIO·SEC·FLAT·HP_PCT) 전부 계약서 §0-2 값. A 파일 편집 없음 — A 의 공개 API·모델만(`mesocoin` 모델 + `DropOwner` · `BossSpawner` 속성 읽기 · `UIToast.ShowMessage` · `AvatarRendererComponent.SetAlpha/SetColor`).
> 이 브랜치의 첫 커밋은 `강화하고살아남기` 폴더에 미커밋으로 남아 있던 b/skill-warrior 의 원작화 SkillExecutors 변경(noFlip/offsetY/scale · PlayBuffLoop · 마법사·전사 RUID)을 그대로 옮긴 것이다 — #48 이 같은 내용을 커밋하면 병합은 동일 변경으로 충돌 없이 합쳐진다.

## 2026-09-12

### 표 대조 (이미지판 · Lv.1→5) → `RootDesk/MyDesk/SkillInfo.csv` 15행 값·IconRUID·`#Note` (헤더 불변 · 행 추가 없음)
| 직업 | 슬롯 · 키 | SkillId | 표 | CSV | 비고 |
|---|---|---|---|---|---|
| 궁수 | A Q | `SK_A11` 더블 샷 | 60x2% → 100x2% | 60 · +10 · HitCount 2 | 볼리(첫 발 ×2 · 표시 2타) |
| 궁수 | B 패시브 | `SK_A12` 포커스 | 10% → 30% + 보스 리젠 표시 | 10 · +5 | 리젠 표시 = `JobPassiveLogic.TickFocusBossTimer` 토스트 |
| 궁수 | C W | `SK_A21` 스나이핑 | 300% → 500% · 선딜 1초 | 300 · +50 · **Duration 0 → 1**(선딜) | 보스 우선 조준 |
| 궁수 | D E(=Shift) | `SK_A22` 닷지 | 스폰 로케이션 이동 · 6~10초 확정 크리 · 쿨 30 | Duration 6 · +1 · Cooldown 30 | 클라 우선 이동(`SkillMovement.TryDodge`) |
| 궁수 | 궁 R | `SK_A31` 폭풍의 화살 | 4000% · 직선 관통 · 컷신 | 4000 · Range 15 · **Duration 0 → 1.5**(컷신 뒤 발사) · UseLimit 1 | 파이널 에임 screen |
| 도적 | A Q | `SK_T11` 럭키 세븐 | 80x2% → 120x2% | 80 · +10 · HitCount 2 | 표창 스프라이트 = 수비 표창 |
| 도적 | B 패시브 | `SK_T12` 픽파켓 | 1~2 메소 즉시 드랍 | 1 · +0.25(FLAT) | 소수점 = 확률 |
| 도적 | C W | `SK_T21` 다크 사이트 | 10초 은신 · 1회 회피 · 쿨 50→30 | Duration 10 · Cooldown 50 · −5/lv | 알파 0.35 |
| 도적 | D E | `SK_T22` 쉐도우 파트너 | 화력 2배 · 1분 · 쿨 2분→1분 · **해금 30** | 100(RATIO) · Duration 60 · Cooldown 120 · −15/lv · **ReqLevel 20 → 30** | ⚠ 구현항목-결정 §4-5 는 20 — 이미지판을 따랐다(기획 확인) |
| 도적 | 궁 R | `SK_T31` 메소 익스플로전 | 50% × 주변 메소 개수 · 컷신 | 50 · Range 6 · **EffectUnit STACK_PCT → ATK_PCT** · **Duration 0 → 0.6** · UseLimit 1 | 실제 바닥 동전 N 개 소모 · 0 개면 거절 |
| 해적 | A Q | `SK_P11` 섬머솔트 킥 | 125% → 275% | 125 · +37.5 | 상자 전부 · 타격마다 hit |
| 해적 | B 패시브 | `SK_P12` 선원 관리 | 15% → 35% | 15 · +5 | 배율만(A CostResolver) |
| 해적 | C W | `SK_P21` 슈퍼 트랜스폼 | 변신 30초 · 쿨 60 · 재시전 주먹 300~500% | 300 · +50 · Duration 30 · Cooldown 60 · **Secondary 0 → 30**(속도·점프 +30% · TENTATIVE) · Range 3 | 변신 중 W = 주먹(쿨 무시) |
| 해적 | D E | `SK_P22` 에너지 쉴드 | 최대 HP 10~30% 보호막 · 쿨 30 | 10 · +5(HP_PCT) · Duration 0(깨질 때까지) · Cooldown 30 | 자가 배선 |
| 해적 | 궁 R | `SK_P31` 함포 사격 | 150% × 30회 · 컷신 | 150 · HitCount 30 · Range 8 · **Duration 0 → 1**(컷신 뒤 첫 파) · UseLimit 1 | 6파 × 5타 |

표에 없는 값(쿨·MP)은 이전 값 그대로 TENTATIVE: 더블 샷 MP 6 · 스나이핑 쿨 8·MP 18 · 닷지 MP 15 · 폭풍의 화살 MP 55 · 럭키 세븐 MP 6 · 다크 사이트 MP 15 · 쉐도우 파트너 MP 25 · 메소 익스플로전 MP 50 · 섬머솔트 킥 MP 8 · 슈퍼 트랜스폼 MP 20(주먹도 20) · 에너지 쉴드 MP 18 · 함포 사격 MP 55.

### 원작 리소스 (msw-search 리소스 API · 팩 `payload.elements` 의 rel_path 로 icon/effect/hit/screen/_audio 확인)
색인에 없는 원작(궁수 300.img 더블 샷·포커스 · 신궁 스나이핑 3221001 · 도적 400.img 다크 사이트 · 해적 500.img 섬머솔트 킥 · 슈퍼 트랜스포메이션 512.img/511.img · 메소 익스플로전 421.img)은 **같은 계열의 현행 팩**으로 대체했다. 다섯 직업 사이에 같은 RUID 는 없다(같은 직업 안의 재사용 = 스나이핑 화살 스프라이트뿐). 엔진 파티클 폴백은 세 직업 어디에도 쓰지 않는다(닷지 도착 링도 없음).

| 스킬 | 팩 | 쓰는 요소 |
|---|---|---|
| 더블 샷 | `skill/3300.img/skill/33001105` 더블 샷(와일드헌터) | icon · effect(cast) · ball/0(화살) · hit/0 · Use/Hit |
| 포커스 | `skill/322.img/skill/3220050` 스나이핑-보스 킬러 | icon(조준경) |
| 스나이핑 | `skill/324.img/skill/3241004` 얼티밋 스나이핑 | icon · special(cast · 640×294) · hit/0 · 오디오 검색 "스나이핑" 1순위 |
| 닷지 | `skill/1311.img/skill/13110008` 닷지 + `skill/40000.img/skill/400004147` 백스텝샷 | icon(닷지) · effect(depart · 출발 지점) · Use(백스텝샷) |
| 폭풍의 화살 | `skill/324.img/skill/3241500` 파이널 에임(신궁 오리진) | icon · screen(컷신 1456×860 · 세이크리드 바스티온과 같은 보정 offsetY 1.0 scale 1.4) · hit/0 · 오디오 "파이널 에임" 1순위 |
| 럭키 세븐 | `skill/400.img/skill/4001344` 럭키 세븐 + 수비 표창 아이템 sprite `5d2441df…` | icon · effect · hit/0 · Use/Hit · 표창 |
| 픽파켓 | `skill/421.img/skill/4211003` 픽 파킷 | icon · Use(드랍음 · 0.3s 제한) |
| 다크 사이트 | `skill/1400.img/skill/14001003` 다크 사이트(나이트워커) | icon · effect · Use |
| 쉐도우 파트너 | `skill/411.img/skill/4111002` 쉐도우 파트너 | icon · effect(cast · noFlip) · special/stand1(분신 루프 · 시전자 뒤 offsetX −0.45) · Use |
| 메소 익스플로전 | `skill/424.img/skill/4241500` 일도양단(섀도어 오리진 · 2026-09-13 추가) + `skill/424.img/skill/4241006` 메소 익스플로젼 VI + `skill/40000.img/skill/400004110` 메소 익스플로젼 | screen(컷신 1455×858 · cast) · icon(4241006) · effect0(impact 중심) · hit/0~8(동전마다 순환 · 컷신 중) · 오디오 "일도양단" 1순위(시전음) |
| 섬머솔트 킥 | `skill/1500.img/skill/15001002` 섬머솔트 킥(스트라이커) | icon · effect · hit/0 · Use/Hit |
| 선원 관리 | `skill/520.img/skill/5201012` 서먼 크루 | icon |
| 슈퍼 트랜스폼 | `skill/40005.img/skill/400051004` 라이트닝 폼 + `skill/40000.img/skill/400004139` 스크류 펀치 | icon · effect(cast) · special(변신 루프) · Use · 주먹: effect(punchCast) · hit(punchImpact) · Use(punch) |
| 에너지 쉴드 | `skill/14210.img/skill/142100004` 싸이킥 실드 + `skill/5111.img/skill/51111004` | icon(싸이킥 실드) · special(보호막 루프 · offsetY 0.6) · effect(cast · 51111004) · Use(51111004) |
| 함포 사격 | `skill/524.img/skill/5241500` 드레드노트(캡틴 오리진) + `skill/522.img/skill/5221022` 배틀쉽 봄버 | icon · screen(컷신 1434×835) · hit/0(폭탄 · 파마다 3발) · Attack1(파) · 오디오 "드레드노트" 1순위(시전) |

🟡 눈으로 맞출 것(Play): 얼티밋 스나이핑 special 의 pivot(화살 궤적이 캐릭터 앞에서 시작하는지) · 분신 클립의 pivot/높이 · 싸이킥 실드 special 의 크기 · 라이트닝 폼 special 이 변신 오라로 보이는지 · 두 컷신(파이널 에임·드레드노트)의 offsetY/scale.

### `RootDesk/MyDesk/Skill/SkillExecutors.mlua`
- **원작화 carry-over(b/skill-warrior 폴더 미커밋분)**: `PlayStageEffect` cast spec 에 `noFlip/offsetY/scale` · `PlayBuffLoop`(loop spec) · `PlayMobEffect` · 마법사(SK_M13/M21/M22/M31)·전사(SK_W11/W21/W22/W31) 원작 RUID·사운드.
- **PROJECTILE**: `projectileDelayFromDuration = { SK_A21 }` → `ExecuteProjectile` 이 CSV Duration 뒤 `FireProjectile`(연출+스폰). `projectilePreferBoss = { SK_A21 }`. `SpawnProjectile` 에 `spriteRuid(ball)` · `hitSoundRuid(extraSounds.hit)` · `preferBoss` 를 넘긴다.
- **BLINK**: `depart` spec 이 RUID 면 그것을 출발 지점에(닷지 백스텝샷). BuffTag 가 있는 BLINK 행(닷지)은 도착 확인 뒤 `ApplyBuff` + `PlayBuffLoop`, 도착 링(CircleBurst · 마법사 텔레포트 연출)은 재생하지 않는다.
- **BUFF_SELF**: `recastAttack = { SK_P21 }` — 그 BuffTag 가 활성이면 `ExecuteTransformPunch`(앞쪽 Range × `MeleeArcHeight` 상자 전부 · `punchCast/punchImpact` · `extraSounds.punch`). Duration 0 이면 루프를 `SkillBuffs.NoExpireSeconds` 로.
- **ORIGIN** `originModes`: `line`(SK_A31 · `ExecuteLineOrigin`: Duration 뒤 앞쪽 가로 Range × 세로 `LineHeight` 2.5 상자 1회 + 직선 위 hit 4곳 순차) · `meso`(SK_T31 · `ExecuteMesoOrigin`: `FindMesoCoins` 로 반경 안 동전 N → `Collected` 잠금 → `MesoExplodeInterval` 0.06s 간격 coinHits 순환 + 소멸 → Duration 뒤 `DealSkillDamageCircleScaled(mul=N · 표시 min(N,15))`) · `barrage`(SK_P31 · `ExecuteBarrageOrigin`: Duration 뒤 `BarrageWaves` 6파 × `BarrageInterval` 0.45s · 파당 HitCount/6 = 5타 · 파마다 폭탄 hit 3발 + wave 사운드 · 합계 30 × 150%).
- **PreCheck(skillId, skill, caster)** (ServerOnly · SkillCaster 가 MP 앞에서 호출): meso 모드에서 동전 0 개면 `{ ok=false }` → 소모 없이 거절.
- `StopBuffLoop(userId, tag)`(SkillBuffs.OnBuffEnded 가 호출) · `GetSpecRuid` · `GetExtraSound` · `PlaySoundRuid` · `extraSounds` 표. `PlayStageEffect` 는 `punchCast` 도 부착+뒤집기, cast/loop 에 `offsetX`(바라보는 쪽 +).
- **MELEE_ARC** 상자 전부 경로(섬머솔트 킥)는 `PendingImpactRuid/PendingHitSound` 를 걸어 맞은 대상마다 hit 클립·소리.

### `RootDesk/MyDesk/Skill/SkillAttack.mlua`
- **N타 = AttackFast 1회 × 피해 N배 · 표시 N타**(`BeginPass/EndPass` · `PendingDamageMul` · `PendingDisplayHits` · `GetDisplayHitCount`). 이전엔 같은 프레임에 N회 호출했는데 `MonsterHit.ImmuneCooldown`(0.4s) 때문에 2회째부터 전부 무효였다(HitCount 1 이던 기존 스킬은 결과 동일).
- `DealSkillDamageCircleScaled(skillId, level, cx, cy, r, mul, displayHits)` — `DealSkillDamageCircle` 은 이것을 (hitCount, hitCount) 로 부른다.
- `OnAttack(defender)`: `PendingImpactRuid`/`PendingHitSound` 재생 + `_SkillBuffs:OnSkillHitMonster`(픽파켓). `CalcCritical` = `_SkillBuffs:IsGuaranteedCrit`(닷지) · `GetCriticalDamageRate` 2.0. 평값(flat)·probe 패스는 제외.
- `SpawnProjectile(… spriteRuid, hitSoundRuid, preferBoss)` + `SpawnOneProjectile`: 스프라이트(`SpriteRendererComponent.SpriteRUID` · @Sync) · 볼리(2발째부터 `VolleyInterval` 0.12s · `VisualOnly`).

### `RootDesk/MyDesk/Skill/SkillProjectile.mlua`
- `DamageMul` · `DisplayHits` · `VisualOnly` · `HitSoundRUID` · `CritDamageRate`. `CalcCritical` = 닷지 확정 크리. `OnAttack` = hit 사운드 + 픽파켓 훅.

### `RootDesk/MyDesk/Skill/SkillBuffs.mlua`
- 태그 5종 처리: `OnBuffStarted`(보호막 값 = MaxHp × ratio · 다크 사이트 `SetAvatarAlpha` 0.35 · 변신 `SetAvatarTint`) / `OnBuffEnded`(복구 + `StopBuffLoop`) / `EndBuffNow`(조기 종료).
- 피격 파이프라인: `ConsumeEvadeOnce`(다크 사이트 1회 회피 + 종료) · `GetShield`/`AbsorbByShield`(0 이면 "shield broken" 종료) · `ModifyIncomingDamage` 순서 = 무적 → 회피 → 보호막 → 하이퍼 바디 → 매직 가드 · `GetDamageMul` 은 다크 사이트도 0.
- **자가 배선(A `PlayerHit` 연결 전)**: `OnPlayerHitEvent` 가 ① 다크 사이트 전액 되돌림+종료 ② 보호막 흡수분 되돌림 ③ 매직 가드 ④ 반사 순으로. 스위치 `DarkSightSelfWire` · `EnergyShieldSelfWire`(정식 연결 시 false).
- `GetOutgoingDamageMul`(쉐도우 파트너 ×2 → `SkillDatabase.DamageAt`) · `IsGuaranteedCrit` · `IsRecastActive/LocalIsRecastActive` + `RecastTagOf`(SK_P21 → SUPER_TRANSFORM).
- 슈퍼 트랜스폼 로컬 스탯: 미러 갱신(`SyncBuffs`) 때 `ApplyLocalTransformStats` 가 소유 클라 `InputSpeed`·`JumpForce` ×(1 + Secondary%) / 복구. 시전 락이 InputSpeed 를 캐시해 둔 동안엔 캐시를 바꾼다(`SetLocalInputSpeed`). 미러 문자열에 skillId 필드 추가(`TAG:lv:endsAt:skillId`).
- 픽파켓 `OnSkillHitMonster(userId, target, skillId)`: `PassiveRatio(STACK_GAIN)` = 타격당 메소(1~2 · 소수점 확률) → `mesocoin` 스폰 + `DropOwner.OwnerUserId` = 시전자(FarmReward.DropCoins 와 같은 경로) · 같은 대상 0.5s 중복 방지 · 드랍음.
- ENERGY_SHIELD 는 `ApplyBuff(duration 0)` 을 `NoExpireSeconds`(100000) 로 넣는다. `ResetMatchState` 가 태그마다 `OnBuffEnded`.

### `RootDesk/MyDesk/Skill/SkillCaster.mlua`
- 재시전 게이트: 클라 `LocalIsRecastActive` · 서버 `IsRecastActive` 면 쿨다운 검사·`StartCooldown` 생략(클라엔 남은 쿨 반환). MP 는 든다.
- `PreCheck` 를 사용 제한(5) 뒤 · MP(6) 앞에서 호출. `castLockOverrides` += 궁수·도적·해적 12종(표 위).

### `RootDesk/MyDesk/Skill/SkillMovement.mlua`
- `spawnBlinkSkills = { SK_A22 }` → `TryDodge`: `map:GetChildComponentsByTypeName("SpawnLocationComponent", true)` 중 **이 맵에 들어온 지점**(`OnUpdate` 가 맵 이름 변화 순간 기록)에 가장 가까운 것으로 `MovementComponent:SetWorldPosition`. 없으면 입장 위치 · 그것도 없으면 취소(부작용 0). 🟡 컴포넌트 이름 문자열은 `FootholdComponent` 조회와 같은 규칙으로 추정.

### `RootDesk/MyDesk/Skill/SkillHotbar.mlua` — 직업별 슬롯 (규칙 Q = A · W = C · E = D · R = 궁 · Shift = 이동기)
- 궁수 Q 더블 샷 · W 스나이핑 · E/Shift 닷지 · R 폭풍의 화살. 도적 Q 럭키 세븐 · W 다크 사이트 · E 쉐도우 파트너 · R 메소 익스플로전. 해적 Q 섬머솔트 킥 · W 슈퍼 트랜스폼(변신 중 W = 주먹) · E 에너지 쉴드 · R 함포 사격.

### `RootDesk/MyDesk/Skill/SkillDatabase.mlua`
- `DamageAt` 에 `GetOutgoingDamageMul`(쉐도우 파트너) 곱 — 매직 가드 추가 피해 앞.

### `RootDesk/MyDesk/Job/JobPassiveLogic.mlua`
- 포커스 "보스 리젠 표시": 서버 2s 타이머 `TickFocusBossTimer` — 포커스를 배운 유저의 현재 맵 `script.BossSpawner` 들의 `deadSeen/respawnAt/elapsed/bossRow.name`(읽기만)을 보고 보스 사망 직후 "[포커스] {보스} 리젠까지 N초" · 10초 전 "N초 후 리젠" 을 `_UIToast:ShowMessage(text, uid)` 로 그 유저에게만. 살아나면 상태 초기화.
- `LogPassives` 에 MONSTER_TRAIN · pickpocket · focus 추가.

### 해석 메모 (표와 코드가 어긋날 수 있는 곳 · 기획 확인 항목)
- **쉐도우 파트너 해금 30**(이미지판) vs 구현항목-결정 §4-5 "20". 이미지판을 따랐다(ReqTier 2 그대로 · Lv30 이면 3차라 게이트 통과).
- **메소 익스플로전 = 실제 바닥 동전**: "갑자기 메소를 소환" 은 연출(동전 연쇄 폭발 + 중심 폭발)로 두고 피해는 "50% × 주변 메소 개수" 를 문자 그대로(시전자가 주울 수 있는 동전만). 픽파켓 → 동전 → 폭발 콤보. 자동획득이 켜져 있으면 동전이 곧 빨려 오므로 A 의 자동획득 토글(`SummonManager.RequestSetAutoPickup` · MesoCoin 주석 "보스전에서 픽파켓류를 쓰려고 끄는 용도")을 끄고 쓴다. 동전 0 개 = 거절(소모 없음).
- **더블 샷·럭키 세븐 "2발"**: 2발 다 피해를 주면 몬스터 무적 0.4s 에 둘째 발이 무효라, 첫 발이 ×2 피해(표시 2타)를 지고 둘째 발은 연출만.
- **함포 사격 30회**: 같은 이유로 6파 × 5타(0.45s 간격 · 표시 5타). 합계 4500% 는 표와 같다.
- **닷지 "가장 안전한 구역"** = 맵의 SpawnLocation(입장 지점 기준 최근접). 크리 배율 2.0(A PlayerAttack 과 같음). 기본 공격 확정 크리는 A 의 `PlayerAttack.CalcCritical` 이 `IsGuaranteedCrit` 를 보면 된다.
- **다크 사이트 "은신"**: 아바타 알파만. 몬스터 어그로 해제는 A 의 `IsTargetable` 필터(구현항목-결정 §3) 대기. 회피는 자가 배선(HP 되돌림) — 치명타 한 방은 못 살린다.
- **슈퍼 트랜스폼 속도·점프 +30%** 는 표에 없어 TENTATIVE(Secondary 열). 변신 외형 = 라이트닝 폼 루프 + 푸른 틴트(원작 팩 미색인). 주먹 MP 20 도 TENTATIVE.
- **에너지 쉴드 지속**: 표에 지속이 없어 "깨질 때까지"(재시전 = 새로 채움). 시전 시점 MaxHp 기준(하이퍼 바디 중이면 그 값).
- **픽파켓은 스킬 타격만**: 기본 공격(A `PlayerAttack`)에서도 떨어지게 하려면 A 가 `PlayerAttack.OnAttack` 에서 `_SkillBuffs:OnSkillHitMonster(uid, defender, "basic")` 한 줄.
- **포커스 드랍율**: 배율은 `GetJobDropMul`(BOSS_KILL·ELITE_KILL) 로 이미 나간다 — 실제 적용은 A `CostResolver`.

### A 에게 (이 PR 로 열리는 연결점 · A 파일 편집 없음)
1. `PlayerHit.OnHit` 오버라이드에서 `damage = _SkillBuffs:ModifyIncomingDamage(uid, damage)` — 이제 다크 사이트 회피·에너지 쉴드까지 한 줄에 산다. 연결 후 `SkillBuffs.DarkSightSelfWire/EnergyShieldSelfWire/MagicGuardSelfWire = false`.
2. `FactionLogic`/`StateChaseMonster` 에 은신 필터가 생기면 `_SkillBuffs:IsActive(uid, "DARK_SIGHT")` 를 본다.
3. `PlayerAttack.CalcCritical` 에 `_SkillBuffs:IsGuaranteedCrit(uid)` · `PlayerAttack.OnAttack` 에 `_SkillBuffs:OnSkillHitMonster(uid, defender, "basic")` (선택 · 기본 공격에도 닷지/픽파켓).
4. `BossSpawner` 의 `deadSeen/respawnAt/elapsed/bossRow` 를 B 가 읽는다 — 이름을 바꾸면 통보 부탁(`BossRespawnScheduledEvent` 가 생기면 그 구독으로 바꾼다).
5. 메소 동전: `mesocoin` 모델 + `DropOwner` 를 B 가 스폰하고(픽파켓) `MesoCoin.Collected` 를 세워 소멸시킨다(메소 익스플로전).

### 검증
- `node Docs/tools/check-integrity.cjs` — (아래 커밋 시점 결과 참조).
- Maker 런타임: 🟡 **미검증** — 이 워크트리를 Maker 로 열고 `Reimport All` → 빌드 경고 수 N → N 기록 → Play(여섯갈래길 달팽이 · 보스맵):
  - 준비: 서버 스크립트 `_PlayerSkillState:ChangeJob(uid,"ARCHER",1)` (THIEF · PIRATE 도) → K 창 DEV 행 → `[Skill] [DEV] learn-all ARCHER skills=5 tier=3` · `[JobPassive] … focus 30%` / `pickpocket 2 meso/hit` / `MONSTER_TRAIN x0.65`
  - **궁수 Q**: `SkillAttack: spawned projectile SK_A11 … volley=2 sprite=true` · 화살 2발 · `dealt`(75×100%×2 = 150 · 표시 2타)
  - **궁수 W**: `SkillExecutors: PROJECTILE SK_A21 aiming 1s` → 1초 뒤 `FindSkillTarget SK_A21 … preferBoss=true` · 500% = 375
  - **궁수 E**: `SkillMovement: SK_A22 dodge from=… to=… branch=spawn-location(N)` · 서버 `BLINK SK_A22 … buff=GUARANTEED_CRIT` · `[Buff] ON GUARANTEED_CRIT … dur=10` · 이후 Q 피해가 2배(크리)
  - **궁수 R**: 컷신 → 1.5초 뒤 `SkillExecutors: LINE SK_A31 dir=… range=15` · `dealt SK_A31 lv=1 hits=1`(3000)
  - **도적 Q**: `spawned projectile SK_T11 … volley=2` · 표창 스프라이트 · 맞을 때마다 `[Buff] PICKPOCKET +N meso at …` + 동전 드랍
  - **도적 W**: `[Buff] ON DARK_SIGHT` · `avatar alpha=0.35` · 맞으면 `[Buff] OFF DARK_SIGHT (evaded)` · `DARK_SIGHT evade hp refund +N` · `alpha=1`
  - **도적 E**: `[Buff] ON SHADOW_PARTNER … ratio=100` · 분신 루프 · Q 피해 로그 `x2 (shadowPartner)`
  - **도적 R**(자동획득 OFF · 동전 여러 개 근처): `MESO SK_T31 detonating N coins` → `dealt SK_T31 circle … mul=N` · 동전 0 개면 `server result … reason='no meso nearby'`
  - **해적 Q**: `dealt SK_P11 lv=… hits=1` · 맞은 대상마다 hit 클립
  - **해적 W**: `[Buff] ON SUPER_TRANSFORM … secondary=30` · `[Buff] SUPER_TRANSFORM local stats ON x1.3` · 틴트 · W 재입력 `cast … recast=true` · `TRANSFORM PUNCH SK_P21` · 30초 뒤 `OFF` · `local stats OFF` · 그 뒤 W 는 `on cooldown`
  - **해적 E**: `[Buff] ENERGY_SHIELD shield=N (10% of maxHp …)` · 맞으면 `ENERGY_SHIELD absorb …` · `hp refund` · 0 이면 `OFF ENERGY_SHIELD (shield broken)`
  - **해적 R**: 컷신 → `BARRAGE SK_P31 scheduled 6 waves x5` · `wave 1/6 hits=5` … `dealt SK_P31 circle … mul=5 display=5` ×6
  - **포커스**(궁수 · 보스맵에서 보스 처치): `[JobPassive] FOCUS toast -> … 리젠까지 N초` · 10초 전 토스트
- 🟡 런타임 미검증 API(근거 `.d.mlua`·팀 코드): `GetChildComponentsByTypeName("SpawnLocationComponent")` · `_EntityService:GetEntitiesSpawnedByModelId("mesocoin")` · `AvatarRendererComponent:SetAlpha/SetColor` 서버 호출의 전 클라 반영 · `MovementComponent.JumpForce` 클라 쓰기 · `SpriteRendererComponent.SpriteRUID` 서버 쓰기 반영 · `GetDisplayHitCount` 의 표시 분할(피해 합이 N배인지).

## 2026-09-12 — Maker Play 검증 (Maker MCP 자동 조작 · 15종 전부 실행 확인)

- **build: 오류 0 · 경고 1**(A `ParseStatCsv` LWA-1111 · 기준선과 같음) · 린트 정보 120 — Maker `refresh` 직후 · 새 `.codeblock` 없음.
- 방법: Maker 가 `강화하고살아남기`(b/skill-warrior) 폴더를 연 채였고 사용자가 폴더 전환을 원치 않아, **이 브랜치의 B 파일 10개 + A 의 `Match/SpectateService.mlua`(#46 `Blocked` · 그 폴더엔 아직 없음)를 임시 복사 → refresh → Play → 검증 뒤 백업으로 원복**(git 조작 없음 · 원복 후 `git status` 동일 확인 · 백업 `메월드폴더/usual-folder-backup-20260912`). 키 입력·서버/클라 스크립트·스크린샷·로그 채집 전부 MCP 도구 호출. 여섯갈래길 달팽이. 테스트 임시값 없음(직업 = 서버 `ChangeJob` · Lv30/전 스킬/MP = `DevStatRemote.RequestLevel(29)` + `RequestDevSetup` · 자동획득 OFF = `RequestSetAutoPickup(false)`). userId 20372100010310953.
- 부팅: `SkillDatabase: resolved dataset 'SkillInfo', loaded 26 rows` · `[Buff] SkillBuffs ready (hit listener for reflect)` · `[JobPassive] focus boss timer started (2.0s)` · `SkillHotbar: wired 8 hotbar keys` · 오류·`Symbol not found` 0.
- **궁수 Q**: `SkillAttack: spawned projectile SK_A11 speed=12 … target=Monster_SixPathCrossway_SP001_… volley=2 sprite=true` · 화살 2발·2타 표시(스크린샷) · 달팽이 처치.
- **궁수 W**: `SkillExecutors: PROJECTILE SK_A21 aiming 1s` → 1초 뒤 `FindSkillTarget SK_A21 candidates=2 preferBoss=true -> Monster_…` · `spawned projectile SK_A21 speed=20 … preferBoss=true` · 375 표시(75×500%).
- **궁수 E**: `SkillMovement: SK_A22 dodge from=(-15.9,-3.9) to=(-5.7,0.6) branch=spawn-location(1) map=SixPathCrossway` · `BLINK SK_A22 depart particle=ruid` · `… buff=GUARANTEED_CRIT` · `[Buff] ON GUARANTEED_CRIT skill=SK_A22 lv=5 dur=10` · 서버 조회 `IsGuaranteedCrit=true remain=8.2`.
- **궁수 R**: `cast effect SK_A31 attached`(파이널 에임 화면 컷신 · 스크린샷) → 1.5초 뒤 `SkillAttack: dealt SK_A31 lv=1 hits=1` · `SkillExecutors: LINE SK_A31 dir=-1 range=15 height=2.5`. ⚠ 첫 재생은 에셋 로딩으로 컷신이 피해보다 늦게 떴다(2회차 확인 필요).
- **도적 Q**: `spawned projectile SK_T11 speed=14 … volley=2 sprite=true`(수비 표창) · 타격마다 `[Buff] PICKPOCKET +2 meso at Monster_… (perHit=2.0 skill=SK_T11)` · 동전 바닥 드랍(스크린샷 · 자동획득 OFF) · 볼리 2발에 드랍 1회(중복 방지).
- **도적 W**: `[Buff] ON DARK_SIGHT skill=SK_T21 lv=5 dur=10` · `avatar alpha=0.35`(반투명 스크린샷) · 서버 `ModifyIncomingDamage(1000)` 1회차 → `[Buff] DARK_SIGHT evaded 1000` · 0 · `[Buff] OFF DARK_SIGHT (evaded)` · `alpha=1` · 2회차 1000 그대로(회피는 1회).
- **도적 E**: `[Buff] ON SHADOW_PARTNER skill=SK_T22 lv=5 dur=60 ratio=100` · `buff loop effect SK_T22 SHADOW_PARTNER`(시전자 뒤 검은 분신 스크린샷) · 이후 Q `SkillDatabase: DamageAt SK_T11 base=90 x2.0 (shadowPartner) -> 180`.
- **도적 R**: 동전 0개 → `server result SK_T31 … ok=false reason='no meso nearby (r=6)'`(MP·쿨·사용 횟수 소모 없음) · 동전 4개 → `[Summon] -mp 50` · `MESO SK_T31 detonating 4 coins over 0.24s, damage at +0.6s` → `dealt SK_T31 circle r=6 … mul=4 display=4` · `MESO SK_T31 coins=4 r=6 -> 200%`.
- **해적 Q**: `cast effect SK_P11` · `dealt SK_P11 lv=5 hits=1` · `[FarmReward] Monster_… top=2037… dmg=206`(75×275%) · `dropped 1 coins`.
- **해적 W**: `[Buff] ON SUPER_TRANSFORM skill=SK_P21 lv=5 dur=30 ratio=500 secondary=30` · `avatar tint=true`(푸른 틴트 스크린샷) · `buff loop effect SK_P21` · 클라 `[Buff] SUPER_TRANSFORM local stats ON x1.3 speed 2.0 -> 2.6 jump 0.9 -> 1.17` · W 재입력 `punchCast effect SK_P21` · `dealt SK_P21 lv=5` · `TRANSFORM PUNCH SK_P21 range=3` · `cast SK_P21 ok=true … cd=58.301 … recast=true`(쿨 유지).
- **해적 E**: `[Buff] ON ENERGY_SHIELD … dur=100000.0 ratio=30` · `ENERGY_SHIELD shield=60435 (30% of maxHp 201450)` · 서버 `ModifyIncomingDamage(5000)` → `absorb 5000/5000 -> shield 55435` · HP 0 · `(70000)` → `absorb 55435/70000 -> shield 0` · `[Buff] OFF ENERGY_SHIELD (shield broken)` · `buff loop effect stopped` · HP 14565.
- **해적 R**: `cast effect SK_P31`(드레드노트 컷신) · `BARRAGE SK_P31 scheduled 6 waves x5(+0) hits from +1s every 0.45s` → `wave 1/6 hits=5 r=8` … `wave 6/6`(각 `dealt SK_P31 circle r=8 … mul=5 display=5`) · 스크린샷에 5타 표시.
- 핫바: 세 직업 Q/W/E/R 전부 `HOTBAR: slot… cast ok=true`(직업별 byJob).
- Play 에서 잡아 고친 것 1건(`361ea2e`): 메소 익스플로전 동전 탐색 — `_EntityService:GetEntitiesSpawnedByModelId("mesocoin")` 은 0(`"model://mesocoin"` 이어야 잡힘) → 맵 자식 `script.MesoCoin` 컴포넌트로.
- 🟡 미확인: 포커스 보스 리젠 토스트(여섯갈래길에 보스 없음 · 보스맵 Play 필요) · 다크 사이트·에너지 쉴드 **자가 배선**(HitEvent 뒤 HP 되돌림 · 접촉 피격이 안 나서 `ModifyIncomingDamage` 경로만 확인) · 얼티밋 스나이핑 `special` 의 pivot/방향 · 두 컷신의 offsetY/scale 미세 조정.
- ⚠ 발견(기존 구조 · 이 PR 밖): **투사체 스킬로 잡은 몬스터는 보상이 없다** — `[FarmReward] Monster_… killed with no player damage — 보상 없음`. 투사체 엔티티가 공격자라 A 의 `FarmReward.HandleHitEvent` 가 플레이어 피해로 안 센다(에너지볼트도 같음 · feature/skill 때부터). 근접(섬머솔트 킥·파워 스트라이크)은 정상. 후속 PR 안: `SkillProjectile.OnUpdate` 의 명중을 시전자의 `SkillAttack.DealSkillDamageToTarget` 로 넘겨 공격자 = 플레이어로 만든다(크리·픽파켓 훅도 한곳으로 모인다).

## 2026-09-13 — 메소 익스플로전 컷신 (사용자 질문 "도적은 컷신이 없나")

- 추가기획1 표의 "(컷신 제작)" 을 섀도어 오리진 **일도양단**(`skill/424.img/skill/4241500` · screen 85프레임 1455×858)으로 채웠다. 도적 오리진 팩은 6차 img 규칙(`X24.img` 섀도어 · `X14.img` 나이트로드 = 생사여탈 `skill/414.img/skill/4141500`)으로 찾았다.
- `SkillExecutors.effectOverrides.SK_T31.cast` = 일도양단 screen(noFlip · offsetY 1.0 · scale 1.4 · 다른 두 컷신과 같은 보정) · `impact` 는 메소 익스플로젼 VI effect0 그대로 · `castSounds.SK_T31` = 오디오 검색 "일도양단" 1순위.
- 타이밍: CSV `SK_T31` Duration 0.6 → **1.6**(컷신 뒤 피해) · `ExecuteMesoOrigin` 이 동전 연쇄 폭발을 피해 시점 0.15s 전에 끝나도록 역산해 시작(컷신 중 터진다) · `SkillCaster.castLockOverrides.SK_T31` 2.5 → 3.5.
- Play 확인(같은 방식 · 폴더 임시 복사): 2회차 시전에서 일도양단 컷신(먹 베기 → 파란 메소 폭발) 정상 · `dealt SK_T31 circle r=6 … mul=4` · 피해가 컷신 1.6s 시점에 맞음. **첫 시전은 컷신이 아예 안 떴다**(파이널 에임과 같은 세션 첫 재생 에셋 로딩) → 아래 예열.
- **컷신 예열**(`SkillExecutors.StartCutscenePrewarm` · `CutscenePrewarm` 스위치): `UserEnterEvent`(+ 이미 입장한 유저) 3s 뒤 `effectOverrides` 의 화면 컷신 cast 5종(불굴의 진·대마법·폭풍의 화살·메소 익스플로전·함포 사격 = `noFlip + scale` 인 항목)을 그 유저 발밑 −40 에 scale 0.01 로 한 번 재생(피해·소리 없음). Play 확인: `cutscene prewarm x5` 뒤 **첫 시전에 컷신 즉시**(0.6s 스크린샷에 이미 화면 가득). 마법사·전사 컷신에도 같은 효과.

## 2026-09-13 — 스킬별 캐릭터 모션 (사용자 제보 "전사가 검을 들면 애니메이션이 이상하다")

- 원인: `WeaponMotion.csv`(A 표)에 무기별 기본 행만 있어 **모든 스킬이 그 무기의 기본 공격 모션**(한손검 swingO1)을 재생했다 — 하이퍼 바디·도발·불굴의 진 같은 버프도 검을 휘둘렀다. `PlayerMotion.Find` 는 `<SkillId>|<WeaponType>` 행이 있으면 그것을 먼저 쓴다(구현맵 §2 "B 가 표만 채운다").
- **`RootDesk/MyDesk/WeaponMotion.csv` 에 스킬별 행 20개 추가**(행 추가만 · 헤더·A 행 불변 · 협업-규칙 §2-1): 파워 스트라이크 swingO2(한손)/swingT2(두손)(→ 같은 날 아래 "2단 콤보" 절에서 alert + `SK_W11_1`/`SK_W11_2` 로 바뀜) · 버프·컷신(하이퍼 바디·도발·불굴의 진·매직 가드·대마법·다크 사이트·쉐도우 파트너·메소 익스플로전·슈퍼 트랜스폼·에너지 쉴드·함포 사격) = **alert**(원작 버프 자세) · 스나이핑 shoot2 · 폭풍의 화살 shootF · 섬머솔트 킥 swingPF · 변신 중 주먹 `SK_P21_RECAST` swingP2. 기본 공격 행이 이미 맞는 것(더블 샷 shoot1 · 럭키 세븐 swingO3 · 에너지볼트 swingO1)은 행을 안 넣었다. 액션 이름은 원작 아바타 액션 집합(쉐도우 파트너 팩의 special/* 목록 = alert·swingO1~3·swingOF·swingP1/2/PF·swingT1~3/TF·stabO/T·shoot1/2/F)에서 골랐다.
- `SkillCaster.RequestCast`: 재시전(변신 중 주먹)이면 `_PlayerMotion:PlaySkill(uid, skillId .. "_RECAST")` — 행이 없으면 `PlayerMotion.Find` 가 무기 기본 행으로 폴백.
- Play 확인(무기 장착 = 서버 스크립트로 `InventoryService.GiveItem` + `EquipService.Apply` · 확대 스크린샷): `[Motion] weapon motion table loaded: 27 rows` · `no row` 경고 0 · 파워 스트라이크 = 한손검 큰 휘두르기 · 하이퍼 바디 = 서 있는 자세(alert) · 럭키 세븐 = 아대 던지기(표창 날아감) · 다크 사이트 = 반투명 서 있기 · 섬머솔트 킥 = 발차기 + 206 · K 창 아이콘 전부 표시(해적·전사 탭 스크린샷).
- 🟡 A 에게: 너클 기본 행 `MOTION_KNUCKLE` 이 swingO1(검 휘두르기)이다 — A 행이라 손대지 않았다. swingP1(주먹)로 바꾸는 것을 권한다. 아이콘 4종(포커스·선원 관리·슈퍼 트랜스폼·에너지 쉴드)은 원작이 색인에 없어 같은 계열 팩 아이콘 — 바꿀 것이 있으면 CSV `IconRUID` 한 칸.

## 2026-09-13 — 파워 스트라이크 2단 콤보 (사용자 영상 "파워스트라이크 should do like this")

- 사용자 제공 원작 영상(히어로 · 두손검 · 1.62s)의 순서: 충전 섬광(0.45) → 검을 든 채 멈춤 → 머리 위 내려찍기(0.90 착지) → 앞으로 찌르기 + 붉은 잔상(1.35) → 끝(1.62). 이전 구현은 큰 휘두르기 한 번(swingO2/T2)에 피해 1회였다.
- `SkillExecutors.ExecuteMeleeArc` 가 `SK_W11` 이면 **`ExecutePowerStrikeCombo`** 로 넘긴다: t=0 섬광(cast effect · 기존 그대로) + Use 사운드 + 전투 자세(alert) → **0.2** 내려찍기 모션(`_PlayerMotion:PlaySkill(uid, "SK_W11_1")`) → **0.5** 1타(앞쪽 상자 최근접 하나 · 표 피해의 0.5배 · hit/0) → **0.75** 찌르기 모션(`SK_W11_2`) → **0.85** 찌르기 잔상(`effectOverrides.SK_W11.thrust[무기 종류]` · 팩 afterimage/stabOF · 두손검 swordTL `d0515d7c8aef446d98e553a7f7c02696` · 한손검 swordTS `84edb5f7381c47fcb18dccd7c0a12c81` · FlipX = 바라보는 방향 · offset 은 Play 프레임으로 검 선에 맞춘 보정값) → **0.95** 2타(0.5배). 두 타의 합 = 표의 150→300% 그대로(CSV 불변 · HitCount 1 유지). 대상이 없으면 두 타 모두 `no target in front — consumed`(원작 헛스윙처럼 MP·쿨은 소모). 시전 락 0.5 → **1.2**(`SkillCaster.castLockOverrides`).
- `SkillAttack.DealSkillDamageToTargetScaled(skillId, level, target, mul, displayHits)` 추가 — 단일 대상 + 배율 + 표시 타수. `DealSkillDamageToTarget` 과 같은 경로(BeginPass → AttackFast(SingleTarget) → EndPass).
- `WeaponMotion.csv`(A 표 · B 가 추가한 행 안에서만 변경 · 헤더·A 행 불변): `SK_W11` = **alert**(섬광 동안 검을 들고 멈춤 · swingO2/T2 에서 변경) · 새 행 `SK_W11_1` = swingO1(한손)/swingT1(두손) 내려찍기 · 새 행 `SK_W11_2` = stabOF 찌르기(한손·두손). 합계 24행(이전 20).
- 컷신 예열(`PrewarmCutscenesFor`)에 찌르기 잔상 RUID 2종을 포함(같은 RUID 는 1회) — 첫 시전에서 잔상이 한 박자 늦게 뜨던 것(세션 첫 재생 로딩) 대책. Play: `cutscene prewarm x7`.
- Play 확인(폴더 임시 복사 · 두손검 `WEAPON_WARRIOR_2H_T10` · 한손검 `WEAPON_WARRIOR_T10` · 2타까지 보려고 서버 스크립트로 주황버섯 HP 를 크게 올림 = Play 메모리뿐, 커밋 없음): `POWER STRIKE combo SK_W11 chop@0.2 hit1@0.5 thrust@0.75 hit2@0.95` · `SkillAttack: dealt SK_W11 to Monster_… mul=0.5 display=1` **×2**(225 + 225 표시 · 크리) · `POWER STRIKE thrust weapon=SWORD_2H afterimage=true`(한손검 SWORD_1H 도 같음) · `[Motion] weapon motion table loaded: 31 rows` · `no row` 경고 0 · 빌드 오류 0. 확대 스크린샷: 섬광 + 검 든 자세 → 머리 위 내려찍기(붉은 hit) → 찌르기 + 검 선에 맞은 붉은 잔상(두손검 긴 잔상 · 한손검 짧은 잔상).
- ~~내려찍기 잔상(팩 afterimage/swordTL/swingT1)은 sprite 로만 있어 EffectService 로 재생할 수 없다 → 1단은 아바타 모션 + hit/0 만~~ → 아래 "불꽃 잔상" 절에서 해결.

### 2026-09-13 — 파워 스트라이크 불꽃 잔상 (사용자 요청 "마지막 찌르기의 불꽃을 조금 더 크게 · 그 전 한 번 휘두를 때 휘두르는 자리에도 불꽃")

- **찌르기 잔상 확대**: `effectOverrides.SK_W11.thrust[*].scale` 1 → **1.3**(두손검·한손검). pivot 이 아래쪽이라 키우면 살짝 내려가 `offsetY` −0.15 → −0.05.
- **내려찍기 잔상 추가**: 같은 파워 스트라이크 팩(`skill/800033.img/skill/80003316`)의 `afterimage/swordTL/swingT1/2/0`(두손검 · 168×120 · `98d2124f4c2740758a7ed92fb5aa3af1`) · `afterimage/swordTS/swingT1/2/0`(한손검 · 136×84 · `32aff8b26faa43ec9fb143f97a52ad73`) = 원작이 내려찍기에 그리는 붉은 호 잔상 그대로(영상 t=0.90 프레임). 다른 직업 팩을 빌리지 않았다.
- 이 둘은 팩에 **1프레임 sprite** 로만 있다(2프레임인 찌르기는 animationclip). `_EffectService:PlayEffectAttached` 에 sprite RUID 를 넘기면 아무것도 안 뜬다(Play 확인 · 로그·오류 없음) → **`SkillExecutors.PlaySpriteFlash`**: B 의 투사체 모델 `model://skillprojectile`(SpriteRenderer + `script.SkillProjectile` · `Models/Skills`)을 시전자 위치(+무기별 offset)에 스폰해 `SpriteRUID` 를 잔상 sprite 로 바꾸고 `VisualOnly`(판정 없음) · `Speed 0` · `MaxLifetime = seconds`(0.25s 뒤 스스로 Destroy) · 방향은 `SetDirection`(Scale.x 부호 · 팩 sprite 는 왼쪽 보기) · pivot 은 sprite 자산(WZ 원점) 그대로. 새 모델·A 파일 없음.
- 순서(콤보 상수): 0.2 내려찍기 모션 → **0.45 내려찍기 잔상 + 1타**(`effectOverrides.SK_W11.swing[무기]` · `PickWeaponSpec`) → 0.75 찌르기 → **0.85 찌르기 잔상(1.3배) + 2타**.
- 사용자 제보(같은 날) "마지막 찌르기에서 이펙트가 먼저 뜨고 공격이 뒤에 온다": 처음엔 잔상 0.85 · 2타 0.95 로 타이머가 따로였다 → **잔상과 타격을 한 타이머(같은 프레임)** 로 합쳤다(1타·내려찍기 잔상도 같이 0.42/0.5 → 0.45 한 타이머). Play: `hit1+arc@0.45 … hit2+flame@0.85` · 스크린샷에서 잔상과 225 표시가 같은 프레임.
- 그래도 사용자 눈에는 잔상이 먼저(피해 숫자·피격 반응이 클라에 그려지기까지 한 박자 더) → 사용자 제안 "이펙트를 조금 늦추면 같아진다": **2타를 먼저 부르고 찌르기 잔상은 `thrustFxDelay`(0.1s) 뒤**(0.85 타격 · 0.95 잔상). 상수 하나로 조정. Play: `dealt SK_W11` 다음에 `thrust flame … (+0.1s after hit2)` · 두손검·한손검 · 빌드 0.
- Play 확인(두손검·한손검 · 같은 방법): `sprite flash SK_W11_swing ruid=98d2124f… facing=-1 scale=1 0.25s` / `…32aff8b2…` · `dealt SK_W11 … mul=0.5` ×2 · `thrust … afterimage=true` · 빌드 오류 0. 확대 스크린샷: 내려찍기 착지에 붉은 호(캐릭터 앞 · 발끝에서 머리 위까지) → 찌르기에 더 커진 붉은 잔상(검 선 위).
