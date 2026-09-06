## 2026-09-06 — NPC 창 4개 뼈대 + 라우팅 + 방어 상태 원장(스텁) · WO-011 ⑮

### 배경
`FunctionalNpcCatalog` 15행 중 공방(`VillageWorkshopGroup`)만 창이 있었다. 나머지 8라우트(생활 3 · 기록 2 · 방어 1 · 공용 2)는 그룹 이름만 있고 `.ui` 도 컨트롤러도 없었고, 값을 줄 서버 시스템(창고·모집·훈련·도감·통계·시설·파병·관문)도 없다. 사용자 요청(2026-09-06): "나머지 NPC 창부터, 수비대 예상 배치·포탑 설치 그림 미리보기 포함".

### 결정 (구현 전제)
- **창 4개 = 계획서 §4-4 그대로**, 공통 셸(공방과 동일 · 라이트 스킨을 처음부터 적용). 라우터는 `VillageNpcUIController` 가 `UiGroupName`/`UiRoute` 문자열만 보고, 각 컨트롤러가 `OnUpdate` 에서 자기 그룹 Pending 을 소비한다(공방과 같은 방식).
- **값은 전부 서버 뷰 문자열** — 새 `Lane/LaneStateService`(A · `Lane/` 배정표)가 유저별 **인메모리 스텁 원장**(시설 3종 Lv/HP/생존 · 수비 몬스터 묶음 ≤10 · 병과 훈련 Lv · 창고)을 들고 `RequestView(kind)` → `_VillageNpcUIController:SetView(kind, csv)` 로 소유 클라에 내려준다. 행 `;` · 필드 `|`. 낙관적 UI 없음(§5-5).
- **비용은 전부 메소(임시)** — 빅토리아 주화 원장이 아직 없다. 시설 표 상수(HP 800/1200/1800 · 강화 300/800 · 재건 500/800 …)는 `LaneStateService.towerDef` 한 곳 → `TowerConfig` 등록 시 CSV 로 치환.
- **한 번에 하나만**: `VillageNpcUIController.CloseAll(exceptGroup)` 이 캐릭터·공방·NPC 창 4개를 닫는다. 공방 `Open` 도 이걸 부른다.
- 내 마을 판별 = 서 있는 맵 이름 접두(`ItemCatalog.ShopKeyOfMap`) — `VillageConfig`/소유권 원장 전 임시. 허브(여섯갈래길)에서는 마을이 없으므로 파병 대상 5곳 전부.

### UI (`UIBuilder` · 신규 4파일 · 공통 헬퍼로 셸·색·글꼴 통일)
| 파일 | 라우트 | Content |
|---|---|---|
| `VillageDefenseGroup` (70) | `tower` | **방어선 그림**: 사냥터2 포탑 → 사냥터1 억제기 → 마을 넥서스 노드(아이콘·Lv·HP 게이지) + 살아 있는 최전방 노드 아래 **수비대 표식**("수비 N묶음 · M마리"). 아래 시설 카드 3장(아이콘·Lv·HP·공격/사거리·강화/수리/재건 버튼 · 넥서스는 재건 없음). 파괴된 시설은 아이콘 붉게 |
| `VillageLifeGroup` (257) | `storage` `recruit` `train` | 창고: 내 인벤토리 20칸(스택형만) ↔ 창고 20칸 + →/← · 모집: **미니 방어선 프리뷰**(최전방 시설 아이콘·HP·10묶음 칸·"N묶음 · M마리 · N/10칸") + 몬스터 카드 5(SummonUnits) + Footer "모집" · 훈련: 병과 3행(Lv/배율/꿈의 조각 비용/훈련) |
| `VillageRecordGroup` (56) | `collection` `stats` | 도감 GridView 7열(MonsterInfo 78행 · 전부 미발견 실루엣) · 통계: 같은 맵 생존자 목록 + 상세 6행 |
| `CommonNpcGroup` (60) | `dispatch` `dimensiongate` | 파병: 대상 마을 5행 + 묶음 스테퍼 + Footer "파병" · 관문: 5지역 카드(보스 이름 · 지역재화 보유/25 · 내 마을은 도보) + 에너지 코어 + Footer "이동" |

시설 아이콘 3종은 계획서 §4-1b 임시 RUID(포탑 `781d0548…` · 억제기 `ccdeb5e0…` · 넥서스 `c146f6b5…`). 지역재화 아이콘은 미주입(ItemInfo 8행 · WP2).

### 코드
- `Lane/LaneStateService.mlua` (신규 · 서버): 원장 + 뷰 8종(`defense recruit train storage stats dispatch gate collection`) + 행동 `RequestTowerAction(stage, upgrade|repair|rebuild)` · `RequestRecruit(unitKey)`(SummonUnits `mesoCost` · 묶음 8마리 · 상한 10) · `RequestTrain(cls)`(꿈의 조각 3/5/10/15 · Lv≤5) · `RequestStorageMove(itemId, count, in|out)`(스택형만 · `InventoryService` Remove/Give) · `RequestDispatch(village, bundles)`(원장에서만 차감) · `RequestDimensionGate(village)`(에너지 코어 −1 · 이동은 포탈 연동 후) · 🧪 `RequestDevHit(stage, dmg)`(리모컨 Enabled 일 때만 · 파괴·최전방 이동 확인용). 실패는 전부 토스트만.
- `Npc/VillageDefenseUIController` · `VillageLifeUIController` · `VillageRecordUIController` · `CommonNpcUIController` (신규 · 클라 `@Logic`): 공방 컨트롤러와 같은 구조(Open/Close/GoRoute/OnView/버튼은 이름으로 배선).
- `Npc/VillageNpcUIController`: `SetView`(Client · kind → 창) · `CloseAll` · `SplitRows` 추가. `Item/WorkshopUIController.Open` → `CloseAll`. `Item/InventoryUIController` → 생활 창에도 인벤토리 갱신 통지.

### 검증 (refresh 2회 → Play · 서버 스텁 · 스크린샷 8장 · 에러 0 · 신규 LEA/LWA 0)
- 방어: 포탑 강화(메소 −300 · Lv2) → 개발용 피해 2000 → 포탑 파괴(아이콘 붉게 · "파괴됨" · 재건 버튼) → 최전방 표식이 억제기로 이동
- 모집: 슬라임·스텀프 1묶음씩 → 프리뷰 2/10칸 · "2묶음 · 16마리" · 카드 선택 노란색 · Footer 비용
- 창고: 다이아 8개 넣기 → 인벤토리에서 빠지고 창고 1/20 · 훈련: 근접 Lv2 · 꿈의 조각 10→7
- 도감 78칸 · 통계 생존자 1명 + 상세 · 파병 2묶음 → 보유 0 · 관문 커닝시티 → 에너지 코어 2→1

### 추가 — 헤네시스 실제 NPC 배치 (같은 날 · 사용자 "헤네시스 가서 확인한다")
- **`VillageConfig.csv` 신설**(계약서 A-2-1 헤더 그대로 · 6행 · GDD §4.1 레인표 · `LITH` 는 `Enabled=false` · `CoreX/Y` 디자이너 실측 대기) + `.userdataset` + `check-integrity` CANONICAL/KEY. `NpcCatalog` 가 이 표로 마을 맵 ↔ `VillageId` 를 잇는다 — 이게 없어서 기능 NPC 자동 배치가 전부 멈춰 있었다
- **`VillageNpcSector` HENESYS 4행 앵커 실측**: 마을 맵 바닥 foothold y=-0.04 (x −15.2..10.3) → WORKSHOP x=−13(5명, 1.2 간격) · LIFE −6(3명) · RECORD −1.5(2명) · DEFENSE 2(1명). 다른 4마을은 앵커 빈칸 그대로(경고만 · 스폰 안 함)
- **`MapNpcs_Village`**: 여섯갈래길 `VD_COMMON_DISPATCH_OFFICER` (−5.6, 9.31 · 차원 관문 옆) 추가
- **`NpcSpawner` 가 어느 맵에도 붙어 있지 않았다** → 마을 맵 5개 + 여섯갈래길에 `NpcSpawner` 빈 엔티티(`script.NpcSpawner`) 를 `MapBuilder.empty` 로 추가 (`self.Entity.CurrentMap` 으로 맵을 잡으므로 자식 엔티티면 충분)
- **소유권 임시 허용**: `OWNER_ONLY` NPC 는 소유권 리졸버가 없으면 전부 거절(`OWNER_CONTEXT_UNAVAILABLE`)이라, `LaneStateService.OnBeginPlay` 에서 `NpcCatalog:SetOwnershipResolver(allow-all)` 스텁 연결. 소유권 원장(`VillageClaimedEvent`)이 오면 교체
- 검증: `[NpcSpawner] ready map=Henesys_Village_MinimiMain spawned=11/11` · 여섯갈래길 2/2(관문·파병관) · 서버 좌표 실측 11명 바닥 위 · 스크린샷(NPC 11명 이름표) · 클라에서 `VillageNpcInteractor:RequestOpen` → 서버 검증 통과 → 창고지기 창 열림(제목 = DisplayName). 시뮬 마우스 클릭은 터치 영역에 안 닿았음(실제 클릭은 `TouchReceiveComponent` → `HandleTouchEvent`)

### 추가 — 원형 UI 금지 · NPC 클릭 사거리 해제 (같은 날 · 사용자 지시)
- **NPC 클릭 사거리 제한 삭제**: `VillageNpcInteractor.MaxUseDistance` 기본 2.5 → **0(무제한)**, 검사는 `> 0` 일 때만. 맵·소유권·쿨다운 검사는 그대로
- **알약형 흰 9-slice(`83b7e4bf…`) 전면 교체** — 늘리면 타원이 되던 문제. 순백 둥근 사각형 64×64(반경 12) PNG 를 node 로 생성 → `asset_create_account_resource_storage_item`(2단계: presigned PUT → 완료) 로 업로드 → `asset_update_resource_storage_info` 로 9-slice border 14/14/14/14 + pivot 0.5 → **RUID `f5e5fbd6dd224f2d8a5af320436b95f0`**. UI 파일 12개의 `SpriteGUIRendererComponent` 440개(옛 RUID 인 것만) `ImageRUID` 교체(색·크기·Sliced 그대로). Play 실측: 공방 창·리모컨 사각으로 렌더링(계정 자산이 이 월드에서 보임)
- 🟡 계정 자산이라 B(다른 계정) 클라에서 안 보일 수 있음 → 그룹 자산으로 옮기거나 Maker 에서 그룹 임포트 필요(그룹 코드 확인 후). 앞으로 UI 스킨은 이 RUID 하나(공통 헬퍼 `WHITE`)

### 추가 — 사용자 피드백 7건 (같은 날 저녁)
1. **억제기 임시 스프라이트 상하반전**: `VillageDefenseGroup` `Node_SUPPRESSOR/Icon` · `Card_SUPPRESSOR/Icon` `FlipY=true` · 모집 프리뷰는 런타임에 `FlipY = (stage == SUPPRESSOR)`
2. 넥서스 스프라이트 교체 — **보류**(사용자)
3. **왼쪽 위 Lv/EXP/메소 패널 제거**: `BattleHUD/LeftHUD` `enable=false` + `BattleHUDController.SetMapMode` 가 다시 켜지 않게(항상 숨김). 값은 캐릭터 창 푸터·StatusHUD 가 보여준다
4. **도감 = 스폰 관리 몬스터만(22종) · 레벨 = 기획 게임 Lv**: `LaneStateService` collection 뷰가 `MapMonsters` 에 있는 `MonsterId` 만 · 레벨 오름차순. `MonsterInfo.Level` 19행을 추가기획1 §3 "지역별 사냥터 3단계"의 **게임 Lv**(초급 10 · 중급 17 · 상급 24 · 리스항구 1/4/7)로 수정(여러 티어에 나오는 몬스터는 낮은 티어 기준 · 값만 · HP/EXP 는 m1-balance). 예: 주니어 네키 45→17 · 와일드보어 55→24 · 다크 스톤골렘 16→24 · 슬라임 7→17
5. **리모컨 꿈의 조각 행**(`+1/+5/+10` · 보유 표시) · **`MonsterTraining.csv` 신설**(계약서 A-2-8d · `TrainClass,Level,DreamPieceCost,StatMul,Enabled,#Note` · 15행 · 기획 정리 §2-3: Lv2 3개 1.5× · Lv3 5개 2.2× · Lv4 10개 3.3× · Lv5 15개 5.0×) + `.userdataset` + CANONICAL/KEY. `LaneStateService` 가 표를 읽고(없으면 기본값) 훈련 비용·배율에 쓴다 — 하드코딩 제거
6. **NPC 가 플레이어 뒤로**: `NpcSpawner.SpawnEntry` 가 스폰 직후 `SpriteRendererComponent.OrderInLayer = -1`(SortingLayer 그대로)
7. **공방 탭 숨김**: `WorkshopUIController.Open` 이 `TabBar.Enable=false` — NPC(강화/제작·장비/물약/수리)마다 자기 라우트 하나만 보이고 제목은 NPC 이름. 창을 파일 단위로 쪼개진 않음(같은 컨트롤러 · 라우트만 분리)
- 부수: NPC 창 4개 `GroupOrder` 2 → **5**(공방과 동일 · StatusHUD 3 위). 🟡 그래도 StatusHUD 의 이름/AP 텍스트가 창 위에 그려짐 — Workshop(5)·Character(6)도 같음. StatusHUD 쪽 순서/타입 확인 필요(미결)
- 검증: Play — 리모컨 `dream=1` · 억제기 FlipY true · 도감 22행(달팽이 1 · 파란 달팽이 1 · 스포아 3 · 빨간 달팽이 4 · 초록버섯 10 …) · 공방 `repair` 라우트 탭 숨김 · 왼쪽 HUD 꺼짐 · MonsterTraining 15행 로드 · 에러 0

### 추가 — StatusHUD 순서 · AP 직접 분배 (같은 날 밤 · 사용자 지시)
- **StatusHUD 가 모든 창 위에 그려지던 문제**: 런타임 `UIGroupComponent.GroupOrder` 는 파일 값이 아니라 Maker 가 매긴 **순위(0~15)** 였고 StatusHUD 는 8(Character 7 · Workshop 10 보다 위). 파일 `GroupOrder` 를 **3 → 1** 로 낮추고 refresh 하니 순위 1 로 내려가 창(4~10) 아래로 감. 루트 `displayOrder` 는 순서에 영향 없음(실험). 런타임에 GroupOrder 를 바꿔도 그리기 순서는 안 바뀜(로드 시 확정)
- **AP 직접 분배** (설계 변경: "레벨업 AP 자동 분배" → **유저가 찍는다** · 자동 분배 버튼 병행): `StatService.GrantAp` 은 레벨만 반영하고 AP 를 원장(`SummonManager econ.ap`)에 남긴다. 새 RPC `RequestAllocateAp(statId, 1)` · `RequestAutoAllocateAp()`(남은 AP 전부 직업 비율 · 나머지 주스탯) → 공통 `Allocate` 가 base 가산 · `econ.ap` 차감 · `ApAllocatedEvent(RemainingAp)` · 재계산 · HUD/캐릭터 창 갱신. `BuildUiCsv` 에 `ap=` 추가
- 캐릭터 창 스탯 탭: Right/Row0~3 에 **"+" 버튼**(Cell 270→226), Left/Row4 **AP 셀 + "자동 분배"**. AP 0 이면 버튼 비활성·회색, 있으면 노란색. 바인딩 6개(`cellAp btnAuto btnPlusStr/Dex/Int/Luk`)
- 검증: econ.ap=10 → 창 AP 10 · "+" 2회 → STR 12→14 · AP 8 · 자동 분배 → STR 19 · DEX 8 · AP 0 · 버튼 비활성 · 에러 0. 방어 창을 열었을 때 StatusHUD 의 Lv/AP 텍스트가 창 뒤로 감(스크린샷)

### 미결 (Lane/Village 시스템으로 넘길 것)
- 원장 스텁 → 실제 Lane(미니언 · 시설 피격 · 자동 집결 · 파병 이동) · 소유권(VillageClaimedEvent) · 빅토리아 주화 · `TowerConfig`/`MonsterTraining` CSV · 도감 발견 · `PublicPlayerSummary` · 확인 팝업(파병·재건·관문) · 지역재화 아이콘
- 모집 가격이 SummonUnits 메소(1~3)라 사실상 공짜 — 기획은 몬스터별 재화 8개. `ItemInfo MAT_*` 15행이 WP2 로 들어오면 그때 치환
