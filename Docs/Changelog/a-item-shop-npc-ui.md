## 2026-09-06 — 직업 장비 세트 + 공방 4라우트 · 브랜치 `a/item-shop-npc-ui` (main `75082fb` 에서)

### 배경
PR #18 뒤 공방의 `craft / repair / potion / shop_equip` 은 빈 컨테이너였다. 기획 정본(`Docs/추가기획1/기획 정리…md` §2-2): **지역 장비 상점 = 그 지역 직업 장비를 지역재화로**(헤네시스 궁수 · 커닝시티 도적 · 엘리니아 마법사 · 노틸러스 해적 · 페리온 전사), **리스항구 = 초보자 장비를 메소로**. 사용자 결정(2026-09-06): 처음 넣었던 10/20/30렙 **전직업 공용 18종은 기획에 없어 직업별 세트로 교체** · **제작 = 장비 제작(장비 구입이 곧 제작)** → 제작 장인과 지역 장비 상인은 같은 표를 연다 · 엘리니아 "마법 재료" 표기는 마법사 장비로 통일 · 물약은 GDD 대로 HP 1종.

### 데이터 (계약서 A-2-8c 신설 · `check-integrity` CANONICAL/KEY 등록 · 전부 통과)
- **`ItemInfo.csv` 117행**: 직업 장비 90행 `{SLOT}_{JOB}_T{10|20|30}` — 이름 "궁수의 청동 활"·"전사의 가죽 모자" 식(무기 청동/강철/은빛 · 방어구 가죽/사슬/강철 · 무기: 전사 검·마법사 완드(BaseMagic)·궁수 활·도적 단검·해적 너클). 공/마 27→40→56 · 방어구 = ⑫ 곡선(모자 6/10/15 · 상하신 4/7/11 · 장갑 2/4/6) · 내구 150/200/250 · `ReqJob` 임시 열거값 `WARRIOR/MAGICIAN/ARCHER/THIEF/PIRATE`(B JobId 확정 시 치환 · `JobInfo` 없어 직업 게이트는 표시만) + `POTION_RED` 빨간 포션(CONSUME · 스택 99)
- **`CraftRecipe.csv` 96행**(+`.userdataset`): `RecipeId,ShopKey,ResultItemId,ResultCount,MesoCost,Mat1ItemId,Mat1Count,Mat2ItemId,Mat2Count,Enabled,#Note` — 지역 5 × 18(지역재화 5/15/40 + 메소 = 판매가) + `NOVICE` 6(1렙 6종 · 메소 50/100 · 재료 없음)
- **`ShopItem.csv`**(빨간 포션 30메소 · `ShopKey=POTION`) · **`ConsumeInfo.csv`**(HP +50) · **`RepairConfig.csv`**(내구도 1당 메소 1/2/4/8 · 1/10/20/30렙 티어)
- 어느 지역인지 = NPC(플레이어)가 선 **맵 이름 접두**(`Henesys_*`→`REGION_HENESYS` … `LithHarbor_*`→`NOVICE`) — `VillageConfig` 전 임시 · `ItemCatalog.ShopKeyOfMap` 한 곳

### 코드 (`Item/`)
- `ItemCatalog`: `LoadTrade` + `GetRecipe/GetRecipes/GetShopItem/GetShopItems/GetConsume/GetRepairMesoPerPoint/GetRepairCost/ShopKeyOfMap`
- `CraftService.RequestCraft(recipeId)`: 지역 일치 → 재료·메소 검증 → 차감 → `GiveItem` → `ItemCraftedEvent`(신규) → `PushInventory` → 결과 RPC. `ShopService.RequestBuy(shopItemId, count)` → `ItemPurchasedEvent`(신규). `RepairService.RequestRepair(slot)/RequestRepairAll()` → 슬롯마다 `ItemRepairedEvent`(신규). 실패는 전부 Deny(아무것도 안 바꿈) — `EnhanceService` 와 같은 흐름
- `InventoryService.RequestUse(instanceId)`: CONSUME → `ConsumeInfo` 만큼 `PlayerComponent.Hp` 회복(+MaxHp 상한) + 1개 소모. `InventoryUIController.OnCellClick` 이 CONSUME 이면 호출(장비는 장착 그대로)
- `WorkshopUIController`: `craft`·`shop_equip` → 같은 Content/Craft 블록(버튼만 "제작"/"구매") · `RefreshCraft`(카드 그리드 + 상세 = `InventoryUIController.FillItemView` 재사용 + 재료/메소 행 + Footer) · `RefreshPotion`(카드 + 수량 −/+ · 총액 · 보유) · `RefreshRepair`(6슬롯 행 · 내구도 바 폭 · 비용 · 개별 수리 · Footer 전체 수리) · `OnPrimary` 라우트별 요청(응답 올 때까지 버튼 비활성) · `SetTradeResult` 서버 응답 RPC

### UI (`VillageWorkshopGroup` · UIBuilder · 기존 빈 컨테이너 안에만 추가 · 124 → 225 엔티티)
- `Content/Craft`: 카드 GridView(176×132 · 3열 · 스크롤) + 카드 템플릿(아이콘·이름·가격·직업/레벨) + 우측 상세(아이콘·이름·요구·능력치 5행·재료/비용 2행·"왼쪽에서 장비를 고르세요")
- `Content/Potion`: 카드 GridView + 상세(아이콘·이름·효과·수량 −/+ · 총액 · 보유)
- `Content/Repair`: 슬롯 6행(부위 칩 · 이름 · 내구도 바 · 수치 · 비용 · 수리 버튼)
- 라이트 스킨 규칙 그대로(흰 9-slice RUID + 칩/셀/버튼 회색 · Maple 굵은 흰 글자 + 외곽선). `ShopEquip` 컨테이너는 비워 둠(라우트가 Craft 로 감)

### 추가 (사용자 지적 · 같은 날)
- **강화 창 제목 줄**에 "이번 단계 기본 상승(보석 무관) · 보석 1개당 양"을 항상 표시 — 예: `+1 · 기본 상승 없음 · 다이아 1개 = 공격력 +2`, 방어구는 `+2 · 기본 방어력 +1 · 힘의 결정 1개 = STR +2` (보석 없이 오르는 기본치가 안 보인다는 지적)
- **공방 탭 4개**(강화 · 제작·장비 · 물약 · 수리 · `Window/TabBar`, 활성 탭 노란색) — 기능 NPC 가 아직 마을에 안 떠서(④ 앵커 미확정) 라우트에 갈 방법이 없던 것. NPC 클릭은 붙으면 각자 라우트로 열린다. `Content` 를 탭 아래로 10px 줄임(940×450 · 자식 좌표 그대로)

### 검증 (2026-09-06 · Play · 서버/클라 `maker_execute_script` · 런타임 에러 0)
- 로드: `[Item] catalog loaded: 117 items` · `trade tables: recipes 96 · shop 1 · consume 1 · repair tiers 4`
- 여섯갈래길(지역 아님): `ShopKey=""` → 제작 목록 0 · Footer "장비를 고르세요" (거래 불가 맵 처리)
- 헤네시스 사냥터로 텔레포트 → `ShopKey=REGION_HENESYS` · 레시피 18(궁수 세트) · 카드 그리드 18 · 상세 "궁수의 청동 활 | 헤네시스 포자 24 / 5 | 메소 300" · 제작 버튼 활성 → `RequestCraft` → `craft OK … meso-300` · 인벤토리에 `WEAPON_ARCHER_T10` 1개 · 결과 RPC "궁수의 청동 활 획득"
- 물약: `RequestBuy ×3` → `buy OK meso-90` · 인벤 3개 · 상세 "총 60 메소 (2개)" · `RequestUse` → 1개 소모 · HP 100 깎은 뒤 재검: `use POTION_RED hp 199900→199950` (+50 = ConsumeInfo)
- 수리: 나무 검 내구 20/100 장착 → 행 "메소 80" · 바 폭 40/200 · Footer "전체 수리 메소 80" → `RequestRepair(WEAPON)` → `repair OK meso-80` · 행 "100 / 100 · 손상 없음" · Footer "수리할 장비가 없습니다"
- 탭: `Tab_enhance/craft/potion/repair` 생성 · craft 열면 craft 탭 노란(0.99) · potion 전환 시 강조 이동 · `Content` 450px
- 강화 제목: 나무 검 선택 시 `+1 · 기본 상승 없음 · 다이아 1개 = 공격력 +2`
