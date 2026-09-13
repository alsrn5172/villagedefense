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
- 검증: refresh → Play → `towerDef.SUPPRESSOR range/attackSpeed` 가 CSV 값으로 읽히는지 · `[AuraEmitter] … rect=6.0 x 3.0` · 커닝 수비대 `affected=2` 유지.
