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
- 🔴 **런타임 검증 미완** — Maker 의 개인 월드가 이 워크트리가 아닌 폴더에 물려 있어 Play 로그에 `[Lane] VillageFacilityTrait loaded` 가 없다(옛 코드가 돌았다).
  워크트리를 개인 월드에 물려 `Reimport All` 한 뒤 아래를 본다:
  1. `[Lane] VillageFacilityTrait loaded: 5/5 rows` · `[Facility] combat HENESYS:SUPPRESSOR ... attacks=true maxTargets=3` · `KERNING:TOWER ... maxTargets=1 dmg=150` · `[Facility] aura attached KERNING:SUPPRESSOR`
  2. 포탑 생존 상태에서 억제기 공격 → `hit REJECTED (front=TOWER alive)` + 침범자 토스트 1회(3초) · HP 그대로 · 반사 없음
  3. 순서대로 파괴 → 전부 정상 · 넥서스 파괴 토스트 → 탈락
  4. 미니언 웨이브가 포탑을 깎는지(게이트 no-op)
  5. 억제기 연타 10초 → 피격 알림 2회 이하 · `hit alert NN%`
  6. `[Defender] Defender_… InputSpeed=…(x2)` · 리쉬 80% 밖으로 안 튐
  7. 수비대·포탑에 맞아 보기 → 대몬스터 대비 약 10배 · 미니언에 맞으면 배수 없음
  8. 헤네시스 억제기가 미니언을 때림 · 4마리 이상 몰려도 `limited targets=3/3` · 커닝·페리온 억제기 무공격
  9. 커닝 포탑 1마리만 · 통로 미니언 놓치지 않음(세로 4.0)
  10. 커닝 억제기 오라: `[Stat] aura speed mul=1.1` · 수비대 `InputSpeed` = ×2 × 1.1 · 오라 밖으로 나가면 `mul=1` 복귀
  11. 페리온 억제기 때리면 `REFLECT x10 = N -> 공격자` · 로그 폭주 없음 · 무적 중엔 반사 없음
  12. 억제기 파괴 후 미니언 ×1.3 · exp ×1.2 그대로(무회귀) · 헤네시스·페리온 포탑 광역 그대로(무회귀)
