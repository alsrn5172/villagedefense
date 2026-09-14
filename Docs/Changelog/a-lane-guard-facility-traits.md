## 2026-09-13 — 침범 안정장치(WO-016) + 마을별 시설 특성 S1(WO-021)

### 배경
추가기획2 §"침범 허용 행위와 저항,보상,안정 장치" 의 4가지(순차 무적 · 알림 · 수비대 이속 · 대플레이어 계수)와
§"마을별 넥서스, 억제기, 포탑의 특성" 이 코드에 없었다. WO-014(PR #35)는 페이즈 게이트(3페이즈 전 5%)까지만 넣었다.
두 WO 는 같은 세 함수(`ApplyDamage` · `ApplyCombat` · `FactionAttack`)를 고치므로 **한 브랜치**에서 한다(사용자 결정 2026-09-10 · PR #53).

### 결정
- **게이트는 `FrontStage` 하나로** — 살아 있는 최전방이 아닌 시설은 피해를 안 받는다. 별도 순서 상수 없음. 출처(플레이어·미니언·dev 치트) 안 가림.
- **`ApplyDamage` 가 결과를 돌려준다** — `""` 통과 · `"INVALID"` · 막은 최전방 이름(`"TOWER"`/`"SUPPRESSOR"`). 침범자 안내·반사는 호출부(`LaneFacility`)가 이 값으로 분기 — 최전방을 두 번 계산하지 않는다.
- **마을별 특성은 표 하나(`VillageFacilityTrait`)** — `if villageId == "HENESYS"` 금지. 코드에 마을 이름이 없다.
- **억제기 데미지는 억제기 자신의 Lv 로 포탑 표를 읽는다**(포탑 Lv 무관). 강화가 곧 화력.
- **대상 수 제한은 가까운 순** — `FactionAttack.DoAttack` 이 상자 안 적을 거리순으로 `MaxTargets` 개 골라 `IsAttackTarget` 에서 나머지를 거른다. 기본 0 = 무제한(포탑 광역 그대로).
- **커닝 단일은 상자를 표적 위치에 좁게**(가로 `SingleTargetBoxWidth` 1.2 · **세로 4.0 유지**). 상자를 그냥 좁히면 사거리가 죽는다.
- **반사는 엔진 Attack 파이프라인**(`FactionAttack.DoReflect` · `attackInfo="reflect"` · 대상 1명 고정 · 고정 피해) — HP 직접 대입은 사망 경로를 건너뛴다. 시설끼리는 안 때리므로 재귀 없음. 무적 게이트를 통과한 피해에만.
- **플레이어 이속 오라는 `StatService.SetAuraSpeedMul`** — 플레이어는 `InputSpeed` 가 아니라 `RigidbodyComponent.WalkSpeed`(2026-09-05 실측)라 `FactionAuraController.Commit` 이 값이 바뀔 때만 넘긴다. 맵을 나가면 1.0 으로 되돌린다.
- **미정값은 전부 `property`/CSV 칸** — 10 · 5초 · 3초 · ×2 · 반사 상한 0 · 억제기 사거리/쿨 = 포탑 차용 · 오라 범위 = 컨트롤러 기본. `추가기획2/미정-값.md` E·F 절.
- **S2(엘리니아·노틸러스)는 넣지 않는다** — 지형 0행이라 검증 불가. 오라 2종은 행 추가만으로 켜지고 스플래시만 코드가 남는다.

### 새 표 — `VillageFacilityTrait` (계약서 A-2-17)

```
VillageId,Stage,TraitKey,Lv1,Lv2,Lv3,Enabled,#Note
```

| VillageId | Stage | TraitKey | Lv1/2/3 | 원문 |
|---|---|---|---|---|
| HENESYS | SUPPRESSOR | SUPPRESSOR_ATTACK | 2 | 포탑 데미지 ×2 |
| HENESYS | SUPPRESSOR | MAX_TARGETS | 3 | 3마리만 |
| KERNING | TOWER | TOWER_SINGLE_MUL | 5 | 원거리 단일 5배 |
| KERNING | SUPPRESSOR | AURA_SPEED | 0.10 / 0.20 / 0.30 | 아군 이속 10/20/30% |
| PERION | SUPPRESSOR | REFLECT | 10 | 받은 피해 10배 반사 · 플레이어에게도 |

### 변경 파일

| 파일 | 무엇 |
|---|---|
| `RootDesk/MyDesk/VillageFacilityTrait.csv` + `.userdataset` | **신규.** 위 5행 |
| `Lane/LaneStateService.mlua` | `ApplyDamage` 순차 무적 게이트 + 결과 반환 · 알림 정책(`FacilityAlert`/`HitAlert`/`NoticeInvader`) · 넥서스 파괴 알림 · `LoadTraitDef`/`TraitValue`/`HasTrait` · `PlayerDamageMul`/`HitAlertInterval`/`HitAlertToAll`/`InvaderNoticeInterval` property |
| `Lane/LaneFacility.mlua` | 거절 시 침범자 안내 · 페리온 반사(`REFLECT` × 통과 피해 → `DoReflect`) · `ReflectCap` property |
| `Lane/LaneFacilityService.mlua` | 억제기에도 `FactionAttack`+`TurretAI`(공격 특성 있을 때만 켜짐) · 오라 특성이면 `FactionAuraController`+`AuraEmitter` 부착 · `ApplyCombat` 을 단계 공통 + 단계별 + 특성으로 재구성(대플레이어 계수 · 대상 수 · 단일 5배 · 억제기 공격 · 오라 값) |
| `Lane/DefenderService.mlua` | `MoveSpeedMul`(2.0) 으로 `InputSpeed` 배수 · 수비대 `PlayerDamageMul` |
| `Faction/FactionAttack.mlua` | `PlayerDamageMul`(기본 1.0) · `MaxTargets`(기본 0) + 가까운 순 선별 · 단일 모드 상자 · `DoReflect`(고정 피해 · 대상 1) |
| `Faction/FactionAuraController.mlua` | 플레이어 이속을 `StatService` 로(값 변경 시만) · 맵 이탈/파괴 시 1.0 복귀 |
| `Stat/StatService.mlua` | `SetAuraSpeedMul(userId, mul)` — 스탯 SPEED 와 곱해 `WalkSpeed` 반영 |
| `Docs/스키마-계약.md` | §0-2 `TraitKey` · §1 등록서 · **A-2-17** |
| `Docs/tools/check-integrity.cjs` | `CANONICAL` + `PK(VillageId+Stage+TraitKey)` |
| `Docs/VillageDefense-M1-GDD.md` | §4.7 에 침범 안정장치 + 마을별 특성 표 · §8 "M1 외부" 에서 시설 고유 효과 행 제거 |
| `Docs/추가기획2/미정-값.md` | E 절 잠정값 표시 · **F 절 신설(F-1~F-7)** |

**안 건드림**: `Faction/TurretAI.mlua`(조준 로직) · `MinionFlowService.mlua`(억제기 파괴 버프 · 미니언 계수 1.0) · `TowerConfig.csv`(F-1 미정 · SUPPRESSOR 행 0 유지) · 맵·UI·모델.

### 검증 (2026-09-13)
- `mlua-diagnose`: 수정 7파일 **errors 0 · warnings 0** (남은 `LIA-1114` Info 는 기존 노이즈 · `SetAuraSpeedMul not found` Info 는 교차 파일 인덱스 지연) ✅
- `check-integrity`: **전부 통과** · `[C1] VillageFacilityTrait` · `[C3] VillageFacilityTrait (VillageId+Stage+TraitKey)` · `[C4]` 짝 OK · 경고 4건 = `main` 기준선 4건(신규 0) ✅
- Maker 빌드 로그: refresh 2회 · 에러 0 ✅
- ✅ **런타임 검증 (2026-09-13 · 워크트리를 개인 월드에 물려 Play · 서버 스크립트로 시나리오 구동 · 로그 증거)**

| # | 확인 | 증거 |
|---|---|---|
| 로드 | 표 로드 | `[Lane] VillageFacilityTrait loaded: 5/5 rows` |
| WO-016 3·4 | 포탑 생존 시 억제기·넥서스 무적 | `ApplyDamage` 반환 `TOWER`/`TOWER` · `hit REJECTED (front=TOWER alive)` · HP 1200/1200 · 2000/2000 그대로 · 포탑만 700/800 |
| WO-016 5 | 순서대로는 뚫림 | 포탑 파괴 → `front TOWER -> SUPPRESSOR` → 억제기 파괴 → `front -> CORE` → 넥서스 파괴 → `HENESYS ELIMINATED` (수비대 despawn 2) |
| WO-016 7·8·9 | 알림 정책·도배 방지 | 포탑 피격 무알림 · 억제기 연타 3회 → `hit alert 99%` **1회** · 5초 뒤 재타 → `hit alert 96%` · 넥서스 피격 → `CORE hit alert 95%` · 파괴 알림 3단계 전부(`FacilityAlert`) |
| WO-016 10 | 수비대 이속 ×2 | `Defender_… InputSpeed=1.3 (x2.0)` = 도감 0.65 × 2 · `Buff.BaseSpeed=1.3`(오라가 되돌리지 않음) |
| WO-016 12·13 | 대플레이어 계수 | 수비대·포탑·억제기 `playerMul=10.0` · 미니언 경로(`MinionFlowService`) 무수정 = 1.0 (코드 확인) |
| WO-016 14 | dev 치트 경로 | `RequestDevHit` → 같은 `ApplyDamage` 관문 (코드 경로 · 별도 실행 없음) |
| WO-021 3·4 | 헤네시스 억제기 공격 · 3마리 | `combat HENESYS:SUPPRESSOR attacks=true dmg=60(=30×2) range=3.0 cd=1.50 maxTargets=3` · 적 5마리 중 매 스윙 `limited targets=3/3` + ENEMY 3줄 · HP 60 단위 감소 |
| WO-021 5 | 다른 마을 억제기 무공격 | `KERNING:SUPPRESSOR attacks=false` · `PERION:SUPPRESSOR attacks=false` · TurretAI Enable=false |
| WO-021 6·7 | 커닝 포탑 단일 5배 | `combat KERNING:TOWER dmg=150 maxTargets=1` · 매 스윙 `limited targets=1/1` + ENEMY 1줄 · HP 150 단위(700/100/400) · 세로 4.0 유지 |
| WO-021 8·9 | 커닝 억제기 이속 오라 · 수비대 합성 | `aura attached KERNING:SUPPRESSOR` · `[Aura] affected=2 \| Defender_KERNING_1 spd=1.10` · 수비대 `InputSpeed=1.43 = 1.3 × 1.1` · 플레이어 경로 `SetAuraSpeedMul(1.1)` → `[Stat] aura speed mul=1.1` → 클라 `walk=1.54`, 1.0 복귀 → `walk=1.4` |
| WO-021 10·11·12 | 페리온 반사 · 무적 중 반사 없음 · 무한루프 없음 | 포탑 생존: 공격자 타격 → `REJECTED` · 반사 없음 / 포탑 파괴 후: `REFLECT x10 = 200 -> VEnemyPR` · `(reflect)` 1줄 · 억제기 1200→1180 · 공격자 1000→800 · 재귀 로그 없음 |
| WO-021 14 | 포탑 광역 무회귀 | 헤네시스 포탑 매 스윙 적 4마리 전부 ENEMY(제한 로그 없음) |
| 무회귀 | 기존 경고 | 런타임 Warning 은 기존 `BossCatalog 6130101` · `LWA-3048`(수비대 MonsterAttack+FactionAttack 공존 · 이전부터) 뿐 · Error 0 |

**검증 중 잡은 버그 2건 (수정 후 재검증 통과)**
1. `FactionAttack.CollectNearestEnemies` 가 **트랜스폼 점**으로 상자 판정 → 시설이 발판보다 GroundOffset 만큼 떠 있어 통로 위 적이 세로로 빠짐(커닝 포탑이 한 번도 안 쐈다). → 후보의 **피격 상자(HitComponent · Scale 반영) 겹침**으로 판정.
2. `FactionAuraController.AuraOffsetY` 기본 1.0 은 바닥에 선 옛 포탑 기준 → 시설에 붙이면 사각형이 바닥 위 1.1~4.1 에 떠서 `affected=0`. → `AttachAura` 가 `1.0 − GroundOffset` 으로 바닥 +1.0 에 중심을 둠.

**미검증(사용자 눈 확인)**: 침범자 토스트 문구·표시(주인 없는 테스트라 토스트 대상 없음) · 오라 띠 그림 위치 · 실제 플레이어가 커닝 오라 안에 서 있을 때 이속(경로는 `SetAuraSpeedMul` 로 확인) · 수비대 리쉬 오버슛(코드상 매 프레임 방향 0 처리).

### 2026-09-13 (2차) — F 값 확정 반영 (사용자)
- **F-1** 억제기 사거리 = 포탑과 동일 → `TowerConfig.csv` SUPPRESSOR 3행에 `Range 3.0/3.5/4.0` 기입. 쿨타임(`AttackSpeed` = 한 발 뒤 다음 발까지 초)은 사용자 질문 상태라 **포탑과 동일 1.5/1.3/1.1 로 잠정** 기입 — 다르면 CSV 칸만. 코드의 "0 이면 포탑 값 차용" 은 안전망으로 유지.
- **F-2** 오라 범위 = 포탑 가로너비의 3배 · 중앙 유지 → `LaneFacilityService.AuraWidthMul = 3.0` × `HitWidth 2.0` = 가로 **6.0**(기존 기본 8.0) · 세로 3.0 · 시설 중심 대칭.
- **F-6** 반사 상한 없음 → `ReflectCap = 0` 그대로(안전망).
- 검증: refresh → Play → `towerDef.SUPPRESSOR range/attackSpeed` 가 CSV 값으로 읽히는지 · `[AuraEmitter] … rect=6.0 x 3.0` · 커닝 수비대 `affected=2` 유지. ✅ 로그 확인(3.0/3.5/4.0 · 1.5/1.3/1.1 · rect=6.0 x 3.0 · affected=2).

## 2026-09-14 — WO-025 포탑 공격 이펙트 (발사체 · 적중 · 시전 · 마을별 Lv1~3)

### 배경
포탑 공격에 연출이 없었다(상자 판정만). 사용자가 팩(스킬 리소스)에서 **ball(날아가는 것) + hit(도착 폭발)** 짝을 골라 다섯 마을 × Lv3 을 배정(2026-09-14 · `WorkOrders/WO-025`).
규칙: 모든 발사체는 **포물선** · 시설 **머리 위에서 출발** · **유도탄** · 커닝은 빗나가 땅에 박히면 0.35초 뒤 소멸 · 엘리니아는 발사체 없이 시전 마법진(시설) + 적중(표적) 분리.

### 결정
- **연출 전용.** 데미지는 지금처럼 발사 순간 `FactionAttack.DoAttack` 상자 판정. `DoAttack` 이 엔진 `Attack()` 반환값(맞은 HitComponent)을 `LastHits` 로 남기고, `TurretAI` 가 그 직후 `LaneAttackFx:OnVolley(LastHits)` 를 부른다 → 발사체는 **실제로 맞은 표적**으로만 간다. 표적이 먼저 죽으면 마지막 조준점까지 간 뒤 박히거나(StickSec) 그 자리에서 터진다.
- **표 하나(`FacilityAttackFx` · A-2-18)** 에 마을×시설×Lv 행. `ApplyCombat` 이 레벨에 맞는 행을 넣으므로 강화하면 연출이 진화한다. 행이 없으면 아무 연출도 없다(억제기 등 현행).
- 발사체 = `Models/Effects/LaneShot.model`(TransformOnly + SpriteRenderer · `model://laneshot`) + `Lane/LaneShot.mlua`. 서버가 매 프레임 `WorldPosition` 을 쓴다(Body 없음). 비행 시간 고정(`FlightSec`) · 포물선 `ArcHeight·sin(πu)` · 진행 방향으로 `ZRotation`(그림 원래 방향 `FaceDeg` 기준 · 좌우 그림은 FlipX 로 위아래 뒤집힘 방지).
- 적중·시전은 `_EffectService:PlayEffect`(엔티티 없이 한 장). 출발점 = 시설 위치 + `GroundOffset`(그림 절반 높이 = 머리 위) · CSV `LaunchOffsetY` 로 덮을 수 있다.
- 크기(`Scale`/`HitScale`)는 1유닛=100px 기준 어림값 — **실물 보고 CSV 칸만 조정.**

### 사용자 배정 (CSV 15행)
헤네시스 H-2 3~4개 → H-3 6~8개 → H-9 6~8개 · 커닝 K-6 표창(1.2배) → K-9 단품 → K-1 대형 수리검(0.35배 · 땅 0.35초) · 엘리니아 E-1 → E-2(VI) → E-3(엘리멘탈 블래스트 · CAST_HIT) · 노틸러스 N-1 → N-2 → N-6(0.25배) 각 3발 0.1초 간격 · 페리온 P-3 일반 → special/0 → 둘 다 2발.

### 변경 파일
| 파일 | 무엇 |
|---|---|
| `RootDesk/MyDesk/FacilityAttackFx.csv` + `.userdataset` | **신규** 15행 |
| `RootDesk/MyDesk/Lane/LaneAttackFx.mlua` (+`.codeblock`) | **신규** 시설 컴포넌트 — 발사 규칙(개수·간격·Ball/Ball2 교대·CAST_HIT) |
| `RootDesk/MyDesk/Lane/LaneShot.mlua` (+`.codeblock`) | **신규** 발사체 — 포물선 유도 · 도착 hit · 땅 박힘 · 회전 |
| `RootDesk/MyDesk/Models/Effects/LaneShot.model` (+`Effects.directory`) | **신규** 순수 스프라이트 엔티티(ModelBuilder · TransformOnly 템플릿) |
| `Faction/FactionAttack.mlua` | `LastHits`(맞은 엔티티 목록) |
| `Faction/TurretAI.mlua` | `DoAttack` 직후 `LaneAttackFx:OnVolley` 훅 3줄(조준 로직 무수정) |
| `Lane/LaneStateService.mlua` | `LoadFxDef` · `AttackFx(villageId, stage, lv)` |
| `Lane/LaneFacilityService.mlua` | 시설 스폰 시 `LaneAttackFx` 부착 · `ApplyCombat` → `ApplyAttackFx`(레벨별 행 주입) |
| `Docs/스키마-계약.md` · `Docs/tools/check-integrity.cjs` | A-2-18 · 등록서 갱신 · CANONICAL/PK |

### 검증 (2026-09-14 · 개인 월드 Play · 서버 스크립트)
- `[Lane] FacilityAttackFx loaded: 15/15 rows` · `check-integrity` C1/C3/C4 통과 · 진단 errors 0 · 런타임 Error 0 · 신규 Warning 0
- `combat HENESYS:TOWER … fx=SHOT` · KERNING/PERION `fx=SHOT` · 억제기 `fx=`(행 없음 → 연출 없음)
- 매 스윙 `[AttackFx] Facility_HENESYS_TOWER volley n=3~4 targets=6~7` · KERNING `n=1` · PERION `n=1`
- Lv 진화: HENESYS lv2 → `ball=ca66b992… count=6~8`, volley `n=7/6` · KERNING lv3 → K-1 `564d5045… scale=0.35 stick=0.35` · PERION lv3 → `ball2=9b8899ca… count=2`, volley `n=2`
- 발사체 실물: 수동 발사 후 표적 파괴 → +0.25s `Shot_…@(12.30,-1.18)`(공중 · 포물선) → +0.6s `@(11.10,-3.20)`(발 높이에 박힘) → +1.3s 0개(0.35초 뒤 소멸) · 누적 스폰 22개 전부 소멸(누수 없음)
- **눈 확인(사용자)**: 크기·그림 방향(특히 페리온 창 `FaceDeg 270` 가정)·출발점 높이·hit 위치·서버 이동의 끊김. 엘리니아·노틸러스는 지형(S2) 뒤.

## 2026-09-14 — 시설 연출 테스트맵 `Test_Lane_Fx` (사용자 요청)

### 무엇
한 맵에 **5줄**(위부터 헤네시스·커닝·엘리니아·노틸러스·페리온 · 줄 간격 = 포탑 높이 × 1.3 = 2.93)을 깔고, 줄마다 왼쪽부터 넥서스(x −8) · 억제기(−2) · 포탑(+4)을 세운 뒤 오른쪽 끝(+11.4)에서 4초마다 미니언을 1마리씩 보낸다(우→좌). 다섯 마을 연출을 한 화면에서 본다 — 엘리니아·노틸러스도 여기선 지형이 있어 보인다.

### 구성
- `map/Test_Lane_Fx.map` — maple 템플릿 + 바닥 그림 20장(각각 `CustomFootholdComponent` · HillNorth `LaneGround_0` 과 같은 꼴) + 루트에 `script.LaneTestDriver`. `Global/SectorConfig.config` 에 `map://Test_Lane_Fx` 등록.
- `Lane/LaneTestDriver.mlua` — 맵에 플레이어가 있으면(0.5초 폴링 · `OnMapEnter` 는 맵 루트에선 안 왔다) `LaneFacilityService:UseTestLanes()` 로 다섯 마을 레인을 이 맵 5줄로 바꾸고 시설 재배치 + 미니언 투입. **`Environment:IsMakerPlay()` 일 때만** — 출시 월드에선 아무 일도 안 한다. 이 맵으로 오는 포탈은 없다(테스트는 서버 스크립트 `MoveToMapPosition("Test_Lane_Fx", Vector2(-11, 14.3))` 로 이동).
- `Lane/LaneFacilityService.mlua` — `UseTestLanes(mapName)` + `TestLane*` property(줄 위치·간격·시설 x). 🔴 실제 레인을 덮어쓰므로 테스트 뒤엔 Play 재시작.
- **시설은 시설을 겨누지 않는다** (`FactionAttack.IsAttackTarget`/`CollectNearestEnemies` · `TurretAI.FindNearestEnemy`) — 줄이 가까워 윗줄 억제기가 아랫줄 시설을 쏘던 것. 실제 맵에선 마을이 달라 만날 일이 없다.

### 배운 것 (메모리에도 기록)
- 새 `.map` 은 refresh 로 안 읽힌다 → **Reimport All** 필요(그 전엔 `LEA-3015`).
- 빌더 `upsertComponent` 는 `@type` 을 뒤에 붙인다 → body 에 `"@type"` 을 첫 키로 직접.
- 커스텀 발판은 **그림(mapobject) 엔티티**에 붙여야 런타임에 잡힌다. 빈 엔티티나 루트 `FootholdsByLayer` 손굽기는 무시 → 몬스터가 −60 까지 추락했다.

### 검증
`[LaneTest] activate` → `TEST LANES … spacing=2.93` → 15개 시설 `Test_Lane_Fx` 에 스폰 → 4초마다 `round: minions=5` → 발판 raycast 5줄 전부 true(발판 34→54) → 매 스윙 `[AttackFx] volley` 헤네시스 3~4 · 커닝 1 · 노틸러스 3 · 페리온 1(엘리니아는 CAST_HIT) · Error 0.

## 2026-09-14 (2차) — 테스트 미니언 완화 + 임시 시설 그림 배율 `FacilitySprite.Scale` (사용자 피드백)

### 무엇
- **"좀비 버섯 너무 많이 나온다"** → `Lane/LaneTestDriver`: 투입 간격 4 → **8초**, HP 400 → **150**, **줄당 동시 3마리 상한**(`MaxAlivePerLane` · `Minion_<마을>_` 자식 중 안 죽은 것을 센다), 첫 라운드는 반복 타이머에만(직접 호출과 겹쳐 두 번 나오던 것).
- **"기본값 sprite 포탑·억제기 크기가 이상해"** → 원인: 2026-09-08 에 시설 `.model` 3종을 헤네시스 전용 아트(900px급) 기준 **`Scale 0.25`** 로 낮췄는데, 임시 그림(엘리니아·노틸러스 포탑 180×320 · 억제기 172×156 · 커닝/엘리니아/노틸러스 넥서스 104×172)도 같은 0.25 를 타서 **0.4~0.8 유닛(손톱)** 이 됐고, 그 행의 `GroundOffset`(1.785/1.665/1.125)은 옛 배율 실측값이라 허공에 떠 있었다.
  → `FacilitySprite.csv` 에 **`Scale` 열**(`#Note` 앞 · 빈 칸 = `.model` 0.25 유지 · 🔴 헤더 변경 → #40 공지) 추가. 임시 그림 7행만 헤네시스 아트 높이 **2.25** 에 맞춰 채우고 `GroundOffset`·`BarOffset` 을 리소스 피벗으로 다시 계산(HP바는 전부 바닥 +2.325 로 같게):

| 그림 | Scale | GroundOffset | BarOffset |
|---|---|---|---|
| 임시 포탑 `781d0548`(피벗 바닥 25%) | 0.703 | 0.57 | 1.755 |
| 임시 억제기 `ccdeb5e0`(FlipY · 피벗 56%) | 1.442 | 0.995 | 1.33 |
| 임시 넥서스 `8adca861`(피벗 49%) | 1.308 | 1.112 | 1.213 |

- `FacilityAttackFx` 노틸러스 3행 `LaunchOffsetY 1.68` — 임시 포탑은 피벗이 바닥 쪽이라 기본값(GroundOffset)이면 포탄이 몸통 가운데서 나간다 → 꼭대기 높이.

### 변경 파일
| 파일 | 변경 |
|---|---|
| `Lane/LaneTestDriver.mlua` | 간격 8s · HP 150 · `MaxAlivePerLane 3` · `AliveCount` |
| `Lane/LaneStateService.mlua` | `Scale` 열 로드 · `FacilityScale(village, stage)` |
| `Lane/LaneFacilityService.mlua` | 스폰 시 표 배율로 `TransformComponent.Scale` 을 덮는다(히트박스·오라 드로어보다 먼저) |
| `FacilitySprite.csv` | 🔴 **헤더 변경**(`Scale` 열) + 임시 그림 7행 |
| `FacilityAttackFx.csv` | 노틸러스 3행 `LaunchOffsetY 1.68` |
| `Docs/스키마-계약.md` A-2-4b · `Docs/tools/check-integrity.cjs` | `Scale` 열 |

### 검증 (2026-09-14 · 개인 월드 Play · `Test_Lane_Fx`)
- `FacilitySprite loaded: 15 rows applied` · `FacilityAttackFx loaded: 15/15` · `check-integrity` 전부 통과 · 진단 errors 0 · 런타임 Error/LEA 0
- 스폰 배율(서버 스크립트 되읽기): 임시 넥서스 3개 `scale=(1.308,1.308)` · 임시 억제기 2개 `1.442` · 임시 포탑 2개 `0.703` · 전용 아트 8개는 `0.250` 그대로 · 히트박스 월드 크기 넥서스 2.40×2.22 · 억제기 2.00×1.99 · 포탑 2.00×1.14(피벗이 바닥 쪽이라 아래 절반)
- 엘리니아 줄(바닥 7.85): 넥서스 y 8.96(+1.112) · 억제기 8.85(+0.995) · 포탑 8.42(+0.57) — 표 오프셋대로
- 미니언: 8초마다 `round: minions=5 skipped(full)=0`(첫 틱은 즉시) · 확인 시점 생존 4마리(HP 150 이라 포탑에 바로 죽는다 · 상한 3 은 아직 안 걸림) · 노틸러스 `volley n=3` 정상
- **눈 확인(사용자)**: 배율·오프셋은 리소스 피벗 계산값이라 투명 여백·그림자만큼 떠 보이거나 잠길 수 있다 → `FacilitySprite.csv` 의 `Scale`/`GroundOffset` 칸만 조정. 노틸러스 포탄 출발 높이는 `FacilityAttackFx.LaunchOffsetY`.

## 2026-09-14 (3차) — 피해를 연출 도착 시점으로 + 노틸러스 포탄 크기 + 엘리니아 마법진→번개 (사용자 눈 확인 피드백)

### 피드백 → 원인
| 피드백 | 원인 |
|---|---|
| "몬스터가 먼저 피격당하고 공격이 날아가서 이펙트가 터진다. 유도탄은 맞으면 피격당해야지" | 설계가 "연출 전용" — `DoAttack` 이 발사 순간 상자 판정으로 피해를 주고, 발사체는 **맞은 표적**을 향해 뒤늦게 날아갔다 |
| "커닝시티 포탑은 플레이어한텐 투사체를 잘 날리는데 몬스터한텐 안 날린다" | 같은 원인의 극단: 커닝 단일 ×5 가 테스트 미니언(HP 150)을 **발사 순간 한 방에** 죽여서 `LaneShot.Launch` 가 "표적 이미 죽음" 으로 발사체를 즉시 지웠다. 플레이어는 안 죽으니 날아갔다 |
| "노틸러스 포탄이 너무 작다" | N-1 그림 188×58 중 공은 50px — 0.4 배면 0.2 유닛 |
| "엘리니아 마법진 공격이 왜 포탑 쪽에 나오나. 마법진(스프라이트 없나?) 뒤 잠시 후 번개가 몬스터 쪽에" | `CastRuid` 에 넣은 것이 마법진이 아니라 **스킬 effect(번개 링)** 라 번개가 시설 위치에서 터졌고, 표적 쪽 `hit/0` 은 작았다 |

### 결정 (구조 변경 · 계약서 A-2-18 개정)
- **피해 = 연출 도착 시점.** `TurretAI` → 행이 있는 시설은 `LaneAttackFx.Fire(attack)`: `FactionAttack.SelectTargets`(DoAttack 과 같은 상자 · 피해 없음 · 가까운 순 MaxTargets 개, 0 이면 전부≤64) → 시전/발사체 연출 → **`FlightSec` 뒤 `Land`** 가 살아 있는 표적마다 `FactionAttack.HitTarget`(표적 피격 상자를 덮는 상자 + `AllowedHits` 로 그 표적만 · 표적당 1회 · 발사체 수와 무관). 시설이 사라지면 대기 피해 취소(`OnEndPlay`). 행이 없는 시설(억제기 · 옛 포탑)·수비대·미니언은 `DoAttack` 즉시 판정 그대로.
- 발사체는 이제 **살아 있는 표적**을 향해 출발하므로 커닝도 미니언에게 날아간다. 표적이 비행 중 다른 데서 죽으면 마지막 조준점까지 가서 박힘/터짐(기존).
- `FactionAttack.HitRect(ent)` 로 피격 상자 계산을 뽑아 `CollectNearestEnemies` 와 `HitTarget` 이 같이 쓴다. `OnVolley`/`LastHits` 계약 폐기(`LastHits` 는 로그용으로만 남김).
- 노틸러스 `Scale` 0.4/0.4/0.25 → **0.9/0.75/0.35**.
- 엘리니아: `CastRuid` = **마법진**(Lv1·2 파란 룬 `999c9bef` 177×190 8프레임 · Lv3 보라 별 `826cd0bd` 357×379 22프레임 · 시설 가운데 `CastOffsetY 0.55`) → **0.6초 뒤**(`FlightSec`) 표적 위치에 **번개 = 옛 시전 effect**(`55bb9e09`/`b4c27d2c`/`ef24cda6` · HitScale 0.5/0.4/0.9) + 피해. `CAST_HIT` 에서 `FlightSec` = 시전→적중 지연.

### 변경 파일
| 파일 | 변경 |
|---|---|
| `Faction/FactionAttack.mlua` | `HitRect` · `SelectTargets` · `HitTarget` |
| `Faction/TurretAI.mlua` | 연출 있으면 `fx:Fire(attack)`, 없으면 `DoAttack` |
| `Lane/LaneAttackFx.mlua` | `IsDelayed` · `Fire` · `Land` (`OnVolley` 삭제) |
| `Lane/LaneShot.mlua` | 주석만(피해는 Land) |
| `FacilityAttackFx.csv` | 노틸러스 3행 Scale · 엘리니아 3행 Cast/Hit RUID·Scale·FlightSec·CastOffsetY |
| `Docs/스키마-계약.md` A-2-18 · 허브 `WorkOrders/WO-025` 위험도 | 지연 피해로 개정 |

### 검증 (2026-09-14 · 개인 월드 Play · `Test_Lane_Fx`)
- 빌드 Error 0(Info 만 · `IsDelayed`/`Fire` LIA-1115 는 `---@type` 정적 분석 한계 · 런타임 정상) · 런타임 Error/LEA 0
- 순서가 바뀌었다: `volley n=… targets=1` → (FlightSec 뒤) `[FactionAttack] … -> ENEMY Minion_…` + `land hits=1/1`. 30초 동안 volley 143 · land 139(4건은 비행 중) · `land hits=0` 0건
- 커닝: `volley n=1 targets=1` → `land hits=1/1` 반복 · 12초 샘플링에서 **커닝 발사체 2개 실제 스폰**(HENESYS 30 · NAUTILUS 26 · PERION 9) — 전에는 표적이 발사 순간 죽어 0개
- 엘리니아: `volley n=0 targets=1 mode=CAST_HIT`(발사체 없음) → 0.6초 뒤 `land hits=1/1`(번개 + 피해)
- **눈 확인(사용자)**: 마법진 그림·위치(시설 가운데 +0.55)·번개 크기(HitScale 0.5/0.4/0.9) · 노틸러스 포탄 0.9/0.75/0.35 · 도착 순간 피격 플래시가 이펙트와 맞는지. 어긋나면 `FacilityAttackFx.csv` 칸만.

### 리뷰 반영 (2026-09-14 · 사용자 "울트라" 허가로 리뷰 에이전트 1개 · 지적 6건 중 5건 수정)
1. ~~`CollectNearestEnemies` 후보에 야생 몹 추가~~ → **되돌림.** 사용자 규칙(2026-09-14): **시설이 때리는 건 플레이어와 미니언뿐, 야생 몹은 안 때린다.** `FactionAttack.FacilityMayHit(defender)` 한 곳에 박고 `IsAttackTarget`(즉시 판정 · 억제기 `DoAttack` 포함)·`CollectNearestEnemies`(지연 판정)·`TurretAI.FindNearestEnemy`(조준) 셋이 같이 쓴다. 시설끼리 제외도 이 문이 대신한다.
2. 후보 **중복 제거**(플레이어는 `script.Faction` 도 갖고 유저 목록에도 있다) — 지연 피해는 표적당 1회라 중복 = 2배 피해였다.
3. SHOT 발사체 수 `n = max(CSV 개수, 표적 수)` — 발사체가 안 날아간 표적이 피해를 받는 일 없음.
4. `LaneAttackFx.timers` 를 {id=true} 집합으로 · 콜백이 스스로 지움(매치 내내 누적되던 것).
5. CAST_HIT 번개는 `HitTarget` 이 실제로 맞았을 때만(죽은 표적·중립 시설엔 안 뜸).
6. `Attack()` 반환을 그룹별로 따로 모음(`AppendHits` · `{r1, r2}` 의 nil 구멍).
- 지적 6(관전 진입 시 `Faction.Team="Neutral"` 을 복귀 때 되돌리지 않음 · `SpectateService`)은 이 PR 밖 → 별도 작업 칩으로 남김.
- 재검증(Play 30초): `volley` 72 · `land` 69 · `land hits=0` 0건 · 순서 volley → ENEMY/land 유지 · Error 0. (한 줄에 미니언이 1마리씩만 들어와 다중 표적 경로는 로그로 못 봤다.)

## 2026-09-14 (4차) — 페리온 직선 · 수평 발사 포물선 · 노틸러스 3분할 · 테스트 리모콘 · 달팽이 5마리 (사용자 피드백)

### 결정
- **페리온 창은 직선 + 한 템포 빨리**: `FacilityAttackFx` 페리온 3행 `ArcHeight 0` · `FlightSec 0.45 → 0.3`.
- **포물선은 위로 솟지 않는다** — 수평으로 나가서 떨어진다: `LaneShot` y = start + (aim − start)·u^(1+ArcHeight), 출발 방향은 항상 수평. `ArcHeight` 열의 의미가 "최고 높이" → **"낙하 곡률"**(0 = 직선)로 바뀜(계약서 A-2-18). 헤네시스 1.2 · 커닝 1.0 · 노틸러스 1.8 값은 그대로 두고 실물 보고 조정.
- **노틸러스 3분할**(사용자 "같은 데미지를 3분할로 3번"): 새 열 `SplitHits`(`#Note` 앞 · 이 PR 의 신규 CSV 라 헤더 공지 대상 아님) — `true` 면 **표적마다** CSV 개수(3)만큼 쏘고 발사체마다 도착 시각에 1/3 피해(`FactionAttack.HitTarget(target, mul)` · `HitMul` → `CalcDamage`). 표적 5이면 15발이 0.1초 간격 3파로 나가고 표적마다 합은 온전한 한 방(광역 유지). 처음엔 "발사체를 표적에 나눠 보내고 표적별 등분"으로 짰는데 표적이 3 이상이면 발마다 온전 피해가 돼 3분할이 안 보였다 → 표적마다 3발로 바꿈.
- **테스트 리모콘**(`LaneTestDriver` · 클라 키 → 서버 RPC · 마을×구조물 하나를 골라 조작): `[` `]` 마을 · `,` `.` 구조물 · `'` Lv+1(상한이면 Lv1 순환) · `;` 파괴 · `/` 재건(Lv 유지·만피) · `\` 전체 초기화(전부 Lv1 생존 재배치 + 미니언 제거). 결과는 토스트 "리모콘 ▸ 커닝 포탑 · Lv2 · 생존". 서버 쪽은 `LaneStateService.TestSetFacilityLevel / TestDestroyFacility / FacilityMaxLevel`(Maker Play 전용 · 비용 없음 · 순차 무적 게이트 무시 · 넥서스 파괴는 탈락 없이).
- **테스트 미니언**: 좀비버섯 1마리 → **달팽이(100000) 5마리씩** 8초마다(HP 60 · 공격 10 · 줄당 상한 12) — 광역/단일/3표적이 눈에 보이게.

### 변경 파일
| 파일 | 변경 |
|---|---|
| `Lane/LaneShot.mlua` | 수평 발사 낙하 곡선 · 출발 방향 수평 |
| `Lane/LaneAttackFx.mlua` | `SplitHits` · 발사체별 Land(1/n) · `Land(attack, targets, mul)` |
| `Faction/FactionAttack.mlua` | `HitTarget(target, mul)` · `HitMul` → `CalcDamage` |
| `Lane/LaneStateService.mlua` | `SplitHits` 로드 · `TestSetFacilityLevel` · `TestDestroyFacility` · `FacilityMaxLevel` |
| `Lane/LaneFacilityService.mlua` | `ApplyAttackFx` 가 `SplitHits` 전달 |
| `Lane/LaneTestDriver.mlua` | 리모콘(키 입력 · 선택 · 토스트 · UI 명령 V/S · `PushState`/`PushRemoteState`) · 달팽이 5마리 |
| `ui/LaneTestRemoteGroup.ui` · `Lane/LaneTestRemoteUI.mlua` | **신규** UI 리모콘 (아래 절) |
| `FacilityAttackFx.csv` | `SplitHits` 열 · 노틸러스 true · 페리온 직선/0.3초 |
| `Docs/스키마-계약.md` A-2-18 · `Docs/tools/check-integrity.cjs` | `SplitHits` 열 · `ArcHeight` 의미 |

### 검증 (2026-09-14 · 개인 월드 Play · `Test_Lane_Fx` · 2회)
- 진단 errors 0 · 런타임 Error/LEA 0 · `FacilityAttackFx loaded: 15/15`
- 달팽이: 8초마다 `round: minions=25`(5마을 × 5) · 다섯 포탑 전부 `volley … targets=5`(광역이 5마리 잡힘 · 커닝은 `targets=1` 단일)
- 노틸러스 3분할: `volley n=15 targets=5 mode=SHOT split` → `land hits=1/1 mul=0.33` × 90건, `mul=1.00` 0건 · 다른 포탑은 `mul=1.00` · `land hits=0` 0건
- 페리온 `ArcHeight 0 · FlightSec 0.3` 적용(직선은 눈 확인)
- 리모콘(서버 스크립트로 `Remote` 직접 호출): `VNEXT → KERNING:TOWER` · `LVUP` ×4 → Lv 2→3→**1**(순환)→2 · `DESTROY → alive=false`(`DESTROYED by TestRemote` + Changed) · `REBUILD → alive=true Lv2 유지` · `SPREV → SUPPRESSOR` 파괴 · `SNEXT`/`VNEXT` ×3 → `PERION:TOWER` · `LVUP → Lv2`. 매 명령 뒤 `[Facility] combat …` 재적용.
- **눈 확인(사용자)**: 키 입력(`[` `]` `,` `.` `'` `;` `/` `\`)과 토스트 문구 · 수평 발사 낙하 곡선(헤네시스 1.2 · 커닝 1.0 · 노틸러스 1.8 — 더 평평하게 하려면 값 ↑) · 페리온 직선 창 방향 · 노틸러스 3파 포탄 · 달팽이 5마리 광역/단일.

### UI 리모콘 (2026-09-14 · 사용자 "리모콘이 UI 가 떠야 하는데 안 떠서 불편함 · 버튼으로")
- 새 `ui/LaneTestRemoteGroup.ui`(UIBuilder · GroupOrder 12 · DefaultShow true · 오른쪽 가운데 420×560 패널 · 흰 둥근사각 9-slice 틴트): 마을 5 버튼 · 구조물 3 버튼 · 상태 글 · `Lv +1` / `파괴` / `재건` / `전체 초기화` · 키보드 힌트. 패널은 꺼진 채 시작.
- 새 `Lane/LaneTestRemoteUI.mlua`(`@Logic` · 클라 · UUID 14개는 빌더 `write({bind})` 주입): 0.5초마다 로컬 플레이어의 맵에 `LaneTestDriver` 가 있으면 패널을 켜고 `RequestRemoteState`, 버튼 → `LaneTestDriver.Remote("V1~V5" / "S1~S3" / LVUP / DESTROY / REBUILD / RESET)`. 서버가 `PushRemoteState`(Client RPC) 로 "커닝시티 포탑 · Lv2 · 생존" 과 선택 강조(파랑)를 돌려준다. 키보드 키는 그대로 살아 있다.
- 검증(Play · 클라 스크립트로 컨트롤러 `Send` 직접 호출): refresh 만으로 UI 그룹 등록(Reimport 불필요) · 테스트맵에서 `panel.Enable=true` · 초기 상태 "헤네시스 포탑 · Lv1 · 생존" · `V2 → S3 → LVUP` 뒤 상태 "커닝시티 포탑 · Lv2 · 생존" · 커닝 버튼 파랑(0.30,0.58,0.95) / 헤네시스 회청 · Error 0. **클릭 자체는 사용자 확인.**
- ui_lint 경고 12건 = 버튼이 88×88 모바일 터치 기준 미만(PC 테스트 도구라 무시).

### 눈 확인 2차 피드백 (2026-09-14)
- **헤네시스 억제기도 포탑처럼 화살** — `FacilityAttackFx` 에 `HENESYS,SUPPRESSOR,1~3` 행 추가(포탑 행 복사 · `LaunchOffsetY 0.6` 으로 포탑(1.125)보다 조금 아래에서 출발). 연출 행은 마을×시설×Lv 라 억제기 행이 따로 있어야 한다(포탑 행으로 넘어가지 않음).
- **레벨업 직후 가끔 이상한 포탄** — 원인: 0.1초 간격 뒤 발(2·3번째 포탄)이 나가기 전에 `ApplyAttackFx`(레벨업)가 끼면 `SpawnShot` 이 **옛 그림(ruid) + 새 배율/적중/비행** 을 섞어 거대·초소형 포탄이 날아갔다. → `Fire` 가 발사 순간 사양(`scale/hit/hitScale/flight/arc/stick/face`)을 `spec` 으로 고정해 모든 발에 넘긴다.
- **엘리니아 Lv3 이펙트** — 사용자가 "마법진 말고 다른 이펙트여야 할 것 같다 · 스킬 다시 보여 달라" → 엘리멘탈 블래스트 팩 요소 전부 + Lv1·Lv2 팩 + 지금 마법진 2종을 움직이는 시트(`fx-ellinia-lv3.html`)로 보냄. 결정 대기.
- 검증: Maker 가 사용자 Play 중이라 refresh 보류 — Stop 뒤 refresh → 억제기 `fx=SHOT` volley · 포탄 크기 안정 확인 예정. 🔴 Play 중에 CSV 를 고쳤으므로 Stop 뒤 디스크 되읽기(되돌려졌으면 스크립트 재실행).

### Codex 리뷰 반영 (2026-09-14 · 사용자 "codex 열심히 시켜" · 읽기 전용 · 새 세션 2회 대조)
1차 지적 3건 전부 수정:
1. `HitTarget` 이 분할 배율을 사망 검사 **앞에** 놓아 죽은 표적에서 되돌리지 않았다 → 다음 즉시 공격이 배율을 물려받을 수 있었다. 사망 검사 뒤로 옮기고 모든 경로에서 0 으로 복구.
2. 65/3 을 `floor` 로 21×3 = 63 (2 손실) → 배율(`HitMul`) 대신 **k 번째/n**(`HitPart`/`HitParts`)을 넘겨 `CalcDamage` 가 `floor(full·k/n) − floor(full·(k−1)/n)` 로 나눈다. 3발 합 = 원 피해.
3. 리모콘 `Remote` 가 발신자의 맵을 서버에서 확인하지 않았다 → `GetUserEntityByUserId(uid).CurrentMap == self.Entity` 검사 추가.
- 재검증(Play 26초): 노틸러스 `land part=1/3 · 2/3 · 3/3` 각 30건 · 다른 포탑 `part=0/0` · 헤네시스 `land hits=5/5` · `land hits=0` 0건 · Error 0.

2차(새 세션 · 같은 프롬프트)는 1차와 **겹치는 항목 없이** 2건을 냈다 — 매뉴얼대로 직접 파일을 열어 확정:
1. "SplitHits 가 표적마다 CSV 수만큼 쏴 3표적이면 9발 — 의도는 max(CSV 수, 표적 수)" → **기각.** 프롬프트에 옛 설계 문구가 남아 있던 것이고, 표적마다 3발·각 1/3 이 사용자 결정(위 결정 항목). 계약서 A-2-18 대로.
2. "죽은 플레이어를 배제하지 않아 사망·리스폰 중에도 조준·지연 피해·발사체 추적이 이어진다" → **수정.** `FactionAttack.IsDeadTarget`(Monster.IsDead + `PlayerComponent:IsDead()`)를 `CollectNearestEnemies`·`HitTarget` 에, `TurretAI.IsDeadEntity`·`LaneShot.TargetAlive` 에도 플레이어 사망 검사 추가.
- 재검증(Play 22초): `volley` 33 · `land` 101 · `land hits=0` 0건 · 노틸러스 `part=3/3` 25건 · Error 0(플레이어가 매 스윙 후보라 `IsDead()` 호출 경로도 돌았다).
