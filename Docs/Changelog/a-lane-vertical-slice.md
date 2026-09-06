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

### 사용자 실측 반영 (2026-09-07 저녁)
- 통로 재배치는 **사용자가 Maker 에서 직접** 깐다(층 4 · 발판 1개 · 사다리 1개 방식을 읽어 다른 마을에 복제 예정). 통로 y = 바닥층 발판 −1.5 안 · `sortingLayerName=Default`(플레이어 렌더 층이 밟은 발판 이름을 따라가서 `MapLayer0` 이면 흙 타일 뒤로 숨음). 파란 포탈은 통로 완성 뒤 발판 y 로 스냅(대기).
- 규칙 추가: **모든 포탈은 플레이어보다 앞 층**(후순위 · 허락 후).
- `VillageNpcSector` HENESYS WORKSHOP 앵커 x −13 → **−14.8**: 넥서스(x −9.6~−6.4)가 물약·지역 장비 상인을 가렸다 → 슬롯 −14.8~−10.0.
- 리모컨 **레벨 행**(`Row_level` +1/+5/+10 → `RequestLevel`): 다음 레벨까지 남은 경험치를 `GrantKillReward` 로 넣어 정식 레벨업 경로(AP/SP·HP 보상·HUD)로 올린다. 패널 800×600 → 800×640, GemRoot −288. 읽기값 `level=`.

## 2026-09-07 — ② 매치 시계 + 미니언 흐름 (헤네시스만)

- **데이터**: `MinionPhaseConfig.csv`(A-2-5 + 뒤에 `Profile`,`CoinDropChance` 추가 · TEST 0/60/180/300초·투입 30초 · LIVE 0/300/720/1080초·180/150/120초 잠정 · 배율 1.0·0.8 / 1.3·1.6 / 2.0·2.2) · `MinionComposition.csv`(A-2-6 + `BaseHp`,`BaseAttack` · 좀비버섯 2230101 300/15 → 400/20 → 500/25 · 3페이즈 좀비머쉬맘 2400572 1500/40) · `MonsterInfo` 2400572 행 · `check-integrity` CANONICAL/KEYS.
- **`Match/MatchSessionLogic`**(본체): 서버 경과 시간 → StartSeconds 로 페이즈 · `MatchPhaseChangedEvent`(신규 @Event) · 페이즈 `SpawnIntervalSeconds` 마다 `MinionFlowService.SpawnWave` · 1초마다 `BroadcastClock`(Multicast) → `Match/MatchClockUIController.Apply`. `SetProfile(TEST/LIVE)` · `SkipToNextPhase` · 리모컨 RPC `RequestProfileToggle`/`RequestNextPhase`.
- **`ui/MatchClockGroup`**(신규 · 상단 중앙 480×56 · GroupOrder 1): 페이즈명(TEST 표시) · mm:ss · 다음 투입/페이즈 초.
- **`Lane/MinionFlowService`**: 주인 있는 마을마다 사냥터2 통로 `SpawnX` 에 가중치 추첨 몬스터 스폰. 모델의 `StateChaseMonster`·`BossSkillRunner` 는 끄고 `Faction(1x)`+`FactionAI(왼쪽 전진 · 사거리 1.3 · 탐지 6)`+`FactionAttack(BaseAttack×배율)`+`FarmReward(ExpBase)`+`MinionUnit` 부착. 정렬층 = 통로 발판 층 + Order 2. 억제기 파괴 시 HP·공격·경험치 배율. `Advance`: 통로 끝(`EndTriggerX`) → 다음 맵(사냥터1 → 마을) 통로에 같은 HP 비율로 재스폰.
- **`Lane/MinionUnit`**: 끝 도달 판정 · 사망 시 처치자에게 메소(`MesoBase`) + 주화 확률(`CoinDropChance`) 지급.
- **시설 전투**: `LaneFacilityService.SpawnFacility` 가 `Faction(2x)` + `HitComponent.CollisionGroup=Monster` 부착, 포탑은 `FactionAttack`+`TurretAI`(Lv 별 공격력·사거리·쿨타임 = `TowerConfig`; `ApplyCombat`). 파괴되면 진영 중립 → 미니언이 지나친다. `LaneStateService.towerDef` 에 `attackSpeed`.
- **리모컨**: 하단 `시계 TEST/LIVE` · `다음 페이즈` 버튼.
- 진영 번호: 헤네시스 = 슬롯 1 → 미니언 "11" · 방어 "21" (플레이어는 전원 "1" 이라 지금은 헤네시스만 정확). 다른 마을은 `LaneConfig` 행이 없어 미니언이 돌지 않는다.
- **로그 스모크 2회**(refresh ×2 · Play · 리모컨 대신 서버 스크립트로 레벨 10 → 연결 → `SkipToNextPhase`): `phase -> 2 PHASE2_VILLAGE at 60.0s` · 30초마다 `wave … spawned=1` · 미니언이 포탑까지 걸어가 `FactionAttack Minion → ENEMY Facility_HENESYS_TOWER` · 1차에선 포탑이 야생 골렘만 쏘고 미니언을 못 맞혀(히트박스 (0,0) + 공격 상자 높이 2) 포탑 파괴 → 미니언 `advance LANE2 → LANE1` 로 사냥터1 재스폰 ✓ → 수정(히트박스 0.8×1.0 + `FitHitboxToSprite` · 공격 상자 높이 4 · `PreferMinions`) 후 2차: `TOWER -> ENEMY Minion_HENESYS_1/2` 5회, 미니언 2마리 처치(`FarmReward dropped`) ✓. 런타임 에러 0. 시계 HUD·마을 통로 넥서스 공격은 눈 확인 대기(사용자).

## 2026-09-07 — ③ 수비대 MVP (도감 해금 → 모집 → 최전방 집결)

- **규칙(사용자 확정)**: 도감 해금 = 지역재화 8개(지금은 `GEM_DIAMOND` 대체 · `LaneStateService.MaterialOf` 한 곳 · `UseRegionalMaterial` 켜면 `REGION_*`) → 그 몬스터가 모집 가능(Lv1). 모집도 묶음(8마리)당 같은 재료 8개. Lv2~5 = 꿈의 조각 3/5/10/15 · 배율 1.5/2.2/3.3/5.0(`MonsterTraining` MELEE 행을 공용 표로). 마을 원장 `mon[monsterId] = 0~5`.
- **도감 창**(`VillageRecordGroup` collection): 셀에 **썸네일**(`MonsterInfo.IconRUID` 신설 열 — 모델 ActionSheet `stand` 클립 RUID, 79행 중 77 채움) + 이름 + 도감 Lv, 미해금은 어둡게(썸네일은 보임). 셀 클릭(ButtonComponent 추가) → 푸터에 "필요 재료 · 보유" + `해금` / `레벨 올리기` 버튼 → `RequestUnlockCollection` / `RequestLevelCollection`. 뷰 `C|id|name|level|monLv|icon|nextCost|mul|nextMul` · `MAT` · `DREAM` · `NO_VILLAGE`.
- **모집 창**: 목록 = 해금한 몬스터만(`U|id|name|level|cost|monLv|mul|icon` + `MAT`) · 카드 썸네일 · 비용 = 재료 8. `RequestRecruit(monsterId)` → `DefenderService.SpawnBundle` 8마리 즉시 스폰 → 묶음 {key, qty=스폰 수, lv}. 수비 몬스터 사망(`DefenderUnit`) → `OnDefenderDied` 묶음 −1.
- **수비대 행동**(`FactionAI.GuardMode` 신설): `HomeX`(최전방 시설 앞 0.9~2.0) 대기 · 탐지 6 안 적이 보이면 접근하되 `LeashMinX`(슬롯−1) ~ `LeashMaxX`(슬롯 + 포탑 사거리) 밖으로 안 나감 · 적 없으면 집으로. 진영 2x · `MonsterAttack.Disabled`(플레이어 접촉 피해 끔 · 신설 속성) · `StateChaseMonster`/`BossSkillRunner` 끔.
- **스펙(임시 상수)**: HP = 도감 MaxHp × 0.3 × 배율 · 공격 = 도감 Level × 1.5 × 배율 (`DefenderService.HpRatio/AttackPerLevel`).
- 미구현: 시설 파괴 시 다음 시설로 후퇴 · 파병(파병 창은 원장 스텁 그대로) · 훈련 NPC(`train` 라우트 3병과)는 도감 레벨과 별개로 남아 있음(폐기 예정).

### 기타
- `Match/MatchSessionLogic` 스텁: `@Sync CurrentPhase`, `PhaseIndex()`, `SetPhase()`. 시계 본체는 ②.
- 넥서스 아이콘 RUID `dab6ddee…` → **`8adca861…`**(사용자 선택 #3) 3곳: `VillageDefenseGroup` Node/Card `Icon` · `VillageLifeUIController` icons · `ui_village_common ICON.core`.
- `check-integrity`: 전부 통과(경고 5건 · 기존).

### 검증 (2026-09-07 Play 실측 · 로그 = `[Probe]`/`[ProbeC]`/`[Facility]`/`[Lane]`/`[Village]`)
- refresh ×2 → build 에러 0(기존 Info 104 · 경고 2 유지) · 런타임 에러 0 · LEA/LWA 0. `Village.directory` 생성 → `VillageClaimedEvent` 추가 후 refresh 1회, 이상 없음.
- 서버 시작: `TowerConfig 7 rows` · `LaneConfig 3 rows` · `MonsterTraining 15 rows` · `spawned HENESYS:CORE at Henesys_Village_MinimiMain (-8,-6.5)` · `ownership resolver connected (owner-only)` · `MatchSessionLogic ready (stub · phase=1)`.
- 통로: 3맵 모두 플레이어가 통로 발판 위에 선다(스샷 3장). HillNorth 통로 포탈 `P_Lane_To_Henesys_Village_MinimiMain` 에서 ↑ → 마을 바닥 포탈 `(7.40, 2.96)` 도착 ✓.
- 소유권: `Claim@lv1 → LEVEL` · `econ.level=10 → Claim → ""`(owner/village 기록) · 재클릭 → `ALREADY_OWNER`(→ 실측 후 **`OWN` 반환으로 수정**: 주인이 자기 넥서스를 누르면 "내 마을 넥서스입니다") · 넥서스 **실클릭(maker_mouse_input)** → `[Facility] claim HENESYS by … -> ALREADY_OWNER` — TouchReceive → RequestClaim 배선 ✓. `VillageClaimedEvent` 발행 에러 없음.
- 시설: 연결 즉시 `TOWER@GolemsTemple (2,-7)` `SUPPRESSOR@HillNorth (4,-9)` 스폰 · 포탑에 `TurretAI` 부착 ✓. 스케일 3 · Default/-1 · 히트박스 3×5 반영 ✓.
- 피해: `ApplyDamage(CORE, 900)` → 1100/2000 · 색 `0.618`(서버=클라) ✓ · `ApplyDamage(TOWER, 800)` → `DESTROYED` · 방어 뷰 `FRONT|SUPPRESSOR` · 포탑 행 `canRebuild=1` ✓.
- 주화: `GrantCoin 100` → 클라 `RequestTowerAction(TOWER, rebuild)` → `coin-30` ✓ · `repair CORE`(90 > 70) 거절 ✓ · `upgrade SUPPRESSOR` → `coin-30` ✓. 방어 뷰 `COIN|100` ✓.
- 배치 수정(사용자 지적 "발판 기준으로"): 슬롯 y 에 그대로 놓으니 중심 피벗 때문에 절반이 발판 아래 → `GroundOffset(stage)`(포탑 +0.81 · 억제기 +0.69 · 넥서스 +1.45 — 피벗 계산값 2.55 에서 스프라이트 하단 투명 여백만큼 스샷 픽셀 실측으로 내림) + 모델 `SortingLayer MapLayer1→Default/-1`(통로 바닥에 가려짐) + 히트박스 오프셋 피벗 기준으로 재계산. 포탑·억제기 스샷으로 바닥 밀착 확인.
- 미검증: `LaneFacility.HandleHitEvent`(실제 공격 → HitEvent) — 플레이어 공격은 B 파이프라인 · 미니언은 ② 에서. `RequestDevHit` 는 ApplyDamage 와 같은 경로.

---

## 2026-09-07 — 프로젝트 전체 정리 (문서만)

- 현재 프로젝트의 GDD·로드맵·추가기획1 결정·계약·WO-011/012·CSV·핵심 서비스를 대조해, [프로젝트 전체 정리](/C:/Users/mingu/메월드폴더/강화하고살아남기/Docs/프로젝트-전체정리.md:1)를 추가했다.
- 2~5인·30분·3단 방어선·리스항구 비점유·NPC 15행 등 최신 결정을 이전 GDD/로드맵과 분리해 표시했다. TowerConfig는 이미 존재하지만 JobInfo·MinionPhaseConfig·MinionComposition·DifficultyConfig은 없다는 현재 상태를 반영했다.
- 코드·데이터는 변경하지 않았다. 수치만 코드/CSV에 있거나 임시 표기인 경우는 기획 확정으로 분류하지 않았다.
