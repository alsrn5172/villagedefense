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

### 미결 (Lane/Village 시스템으로 넘길 것)
- 원장 스텁 → 실제 Lane(미니언 · 시설 피격 · 자동 집결 · 파병 이동) · 소유권(VillageClaimedEvent) · 빅토리아 주화 · `TowerConfig`/`MonsterTraining` CSV · 도감 발견 · `PublicPlayerSummary` · 확인 팝업(파병·재건·관문) · 지역재화 아이콘
- 모집 가격이 SummonUnits 메소(1~3)라 사실상 공짜 — 기획은 몬스터별 재화 8개. `ItemInfo MAT_*` 15행이 WP2 로 들어오면 그때 치환
