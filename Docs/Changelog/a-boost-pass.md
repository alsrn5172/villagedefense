# a/boost-pass — 이용권 상점 (월드코인 · 경험치 + 발록의 심장 2배 · WO-053)

> base `main eb4240c`. Draft PR #203. 지시서: `메월드폴더/WorkOrders/WO-053-캐시-부스트권.md`

## 2026-10-07 — 저장 층 · 지급 서비스 · 순위 보상 2배

- `RootDesk/MyDesk/Progression/AccountProfile.mlua` · `AccountStorageLogic.mlua`: **SchemaVersion 6** — `account_boostUntilMs`(이용권 만료 절대 ms · 0 = 없음) · `account_boostPurchaseIds`(처리한 결제 `PurchaseId` 최근 20개). 키 없는 옛 저장본은 0 · 빈 값으로 읽는다(역호환 · 마이그레이션 없음).
- `RootDesk/MyDesk/Progression/AccountData.mlua`: 원장 `boostUntil` · `boostIds` 와 `GetBoostUntilMs` · `GetBoostPurchaseIds` · `HasBoostPurchase` · `SetBoost`(만료 · 처리 목록을 **한 쌍으로** 쓴다 — 따로 쓰면 같은 결제가 다시 왔을 때 기간이 두 번 늘어난다).
- `RootDesk/MyDesk/BoostProduct.csv` + `.userdataset` (신규 · 계약 A-2-29): `ProductId,Days,Price,Enabled,#Note` 3행(1/3/7일 · 200/400/600). 상품 등록 전이라 `ProductId` 빈칸 · `Enabled=false`.
- `RootDesk/MyDesk/Progression/BoostPassService.mlua` (신규 @Logic): 월드 결제 콜백 하나(`SetProcessPurchaseCallback`) — 모르는 상품 · PurchaseId 없음 · 계정 로드 전 → `false`(플랫폼이 다음 접속 때 다시 부른다) · 이미 처리한 PurchaseId → `true`(기간 안 늘림) · 남은 기간 뒤에 이어 붙임 · 원장 되읽기 확인 · **동기 저장(`FlushUserAndWait`) 확정 뒤에만 `true`**, 실패하면 되돌리고 `false`. 월드 시작 3초 뒤 표 가격을 플랫폼 상품과 대조(`[Boost] product … 표 일치`). `BoostMul(uid)` = 켜져 있으면 2.
- `RootDesk/MyDesk/Match/RankRewardService.mlua`: 정산 때 순위 보상 경험치 · 심장에 `BoostMul` 을 곱한다(레벨업 심장은 그대로) · `[Rank]` 로그 끝에 `bm=`.
- `Docs/스키마-계약.md`: §0-5 v6 · A-2-29 `BoostProduct` · 변경 이력.

## 2026-10-07 — 로비 이용권 상인 NPC

- `RootDesk/MyDesk/FunctionalNpcCatalog.csv`: `VD_COMMON_BOOST_SHOP`(`COMMON_BOOST_SHOP` · 이용권 상인 · `BoostShopGroup` · `boostshop` · PUBLIC) 한 줄 추가. 계약 §0-2 `NpcRole` 등록.
- `RootDesk/MyDesk/Models/Npcs/VD_COMMON_BOOST_SHOP.model` (신규 · ModelBuilder): 매치 안내원 모델을 본떠 이름 · 그림만 바꿈(C6 — 기능 NPC 행마다 모델). 그림 = 원작 "메이플 운영자"(npc/9010063 stand `db2ef55d…` · D-6 고르기 생략).
- `map/Orbis_Lobby_VictoriaStation.map` (MapBuilder): 왼쪽 아래 `Portal` 의 그림(`SpriteRendererComponent`) · 이동(`PortalComponent`) 만 끔 — 엔티티 · 위치 · `TagComponent(MODRespawnArea)` 는 그대로(D-5). 같은 자리(-9.44, -1.4)에 `npc-boostshop`(staticnpc · 매치 안내원 `npc-4525` 구성 · `VillageNpcInteractor` → `BoostShopGroup`/`boostshop` · 오른쪽 보게 FlipX · `MapLayer7` = 플레이어 뒤). 🔴 `RigidbodyComponent` 는 뺐다 — 포탈 자리는 로비 발판 범위(x ≥ -5.82) 밖이라 중력을 받으면 떨어진다. 발 높이는 Maker 캡처로 맞춘다. 빌더가 LF 로 쓴 줄끝은 원래대로 CRLF 로 되돌림(실제 변경 = 포탈 1 · NPC 추가 1).

## 2026-10-07 — 이용권 상점 창 (디자이너 시안)

- `ui/BoostShopGroup.ui` (신규 · UIBuilder · 101 엔티티 · GroupOrder 27): 디자이너 넘김본 "이용권 상점 (월드코인)" 대로 — 화면 막 · NPC 창 공통 틀(980×720 · 문장 · 제목 띠 · 닫기) · 제목 "이용권 상점" + 코인 · 효과 띠(#7) ↔ 사용 중 띠(#16 · 남은 시간 · 게이지) · 카드 3장(#8~#14 · 쿠폰 · 효과 두 줄 · 하루 값 · 가격 · 구매/기간 연장 · "가장 이득") · 안내 문구(#15) · 구매 확인 창(#17 간이판) · 시작 알림(#20). 🔴 시안의 #5 내 월드코인 · #6 충전 · #18 잔액 변화 · #19 코인 부족 창은 **만들지 않음** — MSW 에 잔액 · 충전 API 가 없다(부족 안내는 플랫폼 결제 창). 확인 창은 잔액 줄 대신 가격 줄.
- `Docs/tools/design-ui/apply-boostshop.cjs` (신규): 위 창을 만드는 스크립트(skin.cjs 위 · 좌표 = 넘김본 1920×1080 캡처 실측) + 컨트롤러 바인딩 18개 주입. `upload-boost.cjs` + `boost-ruids.json` (신규): 새 그림 쿠폰 3장(2x)만 그룹 리소스 mIYbC 에 올림 — 나머지 26장은 WO-039 의 `ruid-map.json` RUID 재사용. 🔴 `ruid-map.json` 은 #202 가 잡고 있어 건드리지 않았다.
- `RootDesk/MyDesk/Progression/BoostShopUIController.mlua` (신규 @Logic · 클라): NPC Pending 소비로 열기 · 다른 NPC 창이 열리면 닫기 · 카드는 `BoostProduct` 를 클라에서 읽어 채움(일수 순 · 하루 값 · 가장 이득 = 하루 값 최저) · 카드/구매 → 확인 창 → `PromptPurchase` · 상품 등록 전(ProductId 빈칸 · Enabled=false)이면 "아직 판매 준비 중" 알림 · 서버 `SetState(leftMs, boughtDays)` 로 남은 시간(1초마다 깎아 표시 · "6일 23시간" / "23시간 59분" / "59분") · 산 직후 2초 알림. 게이지 = 남은 시간 ÷ 가장 긴 이용권 기간(시안이 기준을 안 정해서 · 이어 붙여 넘치면 가득).
