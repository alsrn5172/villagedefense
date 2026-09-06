# a/lane-vertical-slice — WO-012 ① 지형 + 시설 + 주화 + 넥서스 소유권

> 지시서: `메월드폴더/WorkOrders/WO-012-레인-마을-세로조각.md` ①. base `main 509a554`(PR #22 머지 후).

## 2026-09-07 — ① 구현 (Play 미검증 · Maker 닫힌 채 작성)

### 지형 — 헤네시스 미니언 통로 3맵 (`map/` · 스크립트 `lane_corridor_henesys.cjs`)
- `Henesys_Hunt_GolemsTemple`(LANE2 · y −7.0 · x −5~14) · `Henesys_Hunt_HillNorth`(LANE1 · y −9.0 · x −6~18) · `Henesys_Village_MinimiMain`(VILLAGE · y −6.5 · x −16~20): 현 지형 최저 발판 2유닛 아래에 **커스텀 발판**(layer 1 · `isCustomFoothold`) + 발판 스프라이트 `LaneGround_i`(RUID `80fa17e3…`) + 통로 전용 포탈 `P_Lane_To_*`(기존 `P_To_*` 컴포넌트 복제 · 하늘색 틴트) + 밧줄 `LaneRope_i`(위 발판 ↔ 통로).
- `PortalRoutes.csv` HL01A/B(사냥터2↔사냥터1 통로) · HL02A/B(사냥터1 통로 ↔ 마을 바닥 포탈 (7.4, 3.0)). ID 접두 `HL` — `L01A` 는 리스항구가 이미 쓴다.
- `.map` 직접 편집은 발판(빌더 커버리지 밖 · 계약서 A-2-2 각주) 한정. 포탈·밧줄·스프라이트는 MapBuilder.

### 데이터
- `LaneConfig.csv`(+userdataset · CANONICAL/KEYS) 헤네시스 3행 실측. `DefenderSlotCount` 는 열만 유지(코드 미사용).
- `TowerConfig.csv`(+userdataset · CANONICAL/KEYS) `Stage` 3값 `TOWER/SUPPRESSOR/CORE` × Lv1~3(CORE 1): HP 800/1200/1800 · 1200/1800/2600 · 2000, 공격 30/45/65, 사거리 3/3.5/4, 강화 20/40 · 30/60, 수리 0.05/HP(코어 0.1), 재건 30/50(코어 0 = 불가), 억제기 배율 1.3/1.3/1.2. **비용 = 빅토리아 주화.**
- 계약서 A-2-2 등록 각주 · A-2-4 `Stage` 3값 + 주화 확정 · 변경 이력 행.

### 주화 원장
- `SummonManager` econ `coin` + `GrantCoin/SpendCoin`. `StatService.PushToClient` 가 `SetCurrency(meso, coin)` 로 캐릭터 창 푸터에 내려준다.
- `DevStatRemote`: 우측 열 **주화 행**(`Row_coin` +1/+5/+10/+100 → `RequestCoin` → `GrantCoin`) · 읽기값 `coin=`. 행 간격 36 으로 재배치(포션 −108 · 꿈 −144 · AP −180 · 주화 −216 · 보석 −252/28 pitch). 메소 임시 처리 없음(사용자 지시).

### 소유권 — `Village/VillageOwnership`(@Logic · 신규 폴더)
- `Claim(userId, villageId)` → `""`/`INVALID`/`LEVEL`(10 미만)/`ALREADY_OWNER`/`TAKEN`. 성공 시 `LaneFacilityService.OnVillageClaimed`. `OwnerOf/VillageOf/Release`.
- `NpcCatalog.SetOwnershipResolver` 를 **이 원장**으로 교체 — `LaneStateService` 의 allow-all 스텁 삭제. 이제 마을 NPC 는 **주인만** 연다.
- `VillageClaimedEvent` 는 `Village.directory` 가 생긴 뒤(refresh 1회) 추가 — LEA-3015 회피.

### 시설 엔티티 — `Lane/LaneFacilityService`(@Logic) · `Lane/LaneFacility`(@Component)
- 모델 3종 `Models/Structures/LaneTower`(`lanetower` · RUID `781d0548…` · 히트박스 1.6×3) · `LaneSuppressor`(`lanesuppressor` · `ccdeb5e0…` · FlipY · 1.6×1.5) · `LaneNexus`(`lanenexus` · `8adca861…` · ×3 · 3×5 · TouchReceive). MapObject 템플릿 + HitComponent.
- 시작 1초 뒤 LaneConfig 가 있는 마을마다 **주인 없는 넥서스**(회색) 를 VILLAGE 슬롯에 스폰. 클릭(TouchEvent) → `RequestClaim` → 연결되면 포탑(LANE2)·억제기(LANE1) 스폰 + `TurretAI` 부착.
- 피격 `HitEvent.TotalDamage` → `LaneStateService.ApplyDamage`. 플레이어 공격은 3페이즈 전 ×0.05(`MatchSessionLogic.PhaseIndex`). 색: HP 비율로 흰→검정(0.15+0.85·hp/max) · 파괴 = 어둡게+반투명.

### 원장 — `Lane/LaneStateService` 마을 단위로 재작성
- 키 = `VillageId`(`EnsureVillage`). 유저 요청은 `VillageOwnership.VillageOf(uid)` 로 매핑, 마을이 없으면 뷰 첫 행 `NO_VILLAGE` + 토스트(`VillageNpcUIController.SetView` 공통 처리 · 방어 창은 상태 문구).
- `towerDef` 메소 상수 삭제 → `TowerConfig` 로드(없으면 기본값). `RequestTowerAction` 비용 = `SpendCoin`. `FacilityState(villageId, stage)` / `ApplyDamage(...)`(0 → 파괴 1회 · 넥서스는 "탈락" 토스트 — 처리 본체는 ②) / `Changed` → 엔티티 색 + 주인 방어 창 푸시.
- 방어 뷰 `MESO` 행 → `COIN`. 모집(`SummonUnits` 메소)·훈련(꿈의 조각)·창고·파병·관문은 그대로.

### 기타
- `Match/MatchSessionLogic` 스텁: `@Sync CurrentPhase`, `PhaseIndex()`, `SetPhase()`. 시계 본체는 ②.
- 넥서스 아이콘 RUID `dab6ddee…` → **`8adca861…`**(사용자 선택 #3) 3곳: `VillageDefenseGroup` Node/Card `Icon` · `VillageLifeUIController` icons · `ui_village_common ICON.core`.
- `check-integrity`: 전부 통과(경고 5건 · 기존).

### 검증 (Maker 켜면)
1. stop → refresh ×2(신규 폴더 `Village/`·`Match/MatchSessionLogic`·모델 3종·CSV 2종) → build 로그 증가분 0.
2. 헤네시스 3맵 텔레포트 → 통로 걷기 · 밧줄 · `P_Lane_To_*` 왕복.
3. 넥서스 클릭(레벨 10 미만 → LEVEL 토스트) → 서버 스크립트로 econ.level=10 → 클릭 → 연결 → 포탑·억제기 스폰 로그 `[Facility] spawned`.
4. 리모컨 주화 +100 → 방어 창 강화/수리/재건 → 주화 차감. `RequestDevHit` → 색 어두워짐 → 파괴 → 재건.
5. 비소유자 NPC 클릭 거절.
