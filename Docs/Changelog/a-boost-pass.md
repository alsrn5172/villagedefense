# a/boost-pass — 이용권 상점 (월드코인 · 경험치 + 발록의 심장 2배 · WO-053)

> base `main eb4240c`. Draft PR #203. 지시서: `메월드폴더/WorkOrders/WO-053-캐시-부스트권.md`

## 2026-10-07 — 저장 층 · 지급 서비스 · 순위 보상 2배

- `RootDesk/MyDesk/Progression/AccountProfile.mlua` · `AccountStorageLogic.mlua`: **SchemaVersion 6** — `account_boostUntilMs`(이용권 만료 절대 ms · 0 = 없음) · `account_boostPurchaseIds`(처리한 결제 `PurchaseId` 최근 20개). 키 없는 옛 저장본은 0 · 빈 값으로 읽는다(역호환 · 마이그레이션 없음).
- `RootDesk/MyDesk/Progression/AccountData.mlua`: 원장 `boostUntil` · `boostIds` 와 `GetBoostUntilMs` · `GetBoostPurchaseIds` · `HasBoostPurchase` · `SetBoost`(만료 · 처리 목록을 **한 쌍으로** 쓴다 — 따로 쓰면 같은 결제가 다시 왔을 때 기간이 두 번 늘어난다).
- `RootDesk/MyDesk/BoostProduct.csv` + `.userdataset` (신규 · 계약 A-2-29): `ProductId,Days,Price,Enabled,#Note` 3행(1/3/7일 · 200/400/600). 상품 등록 전이라 `ProductId` 빈칸 · `Enabled=false`.
- `RootDesk/MyDesk/Progression/BoostPassService.mlua` (신규 @Logic): 월드 결제 콜백 하나(`SetProcessPurchaseCallback`) — 모르는 상품 · PurchaseId 없음 · 계정 로드 전 → `false`(플랫폼이 다음 접속 때 다시 부른다) · 이미 처리한 PurchaseId → `true`(기간 안 늘림) · 남은 기간 뒤에 이어 붙임 · 원장 되읽기 확인 · **동기 저장(`FlushUserAndWait`) 확정 뒤에만 `true`**, 실패하면 되돌리고 `false`. 월드 시작 3초 뒤 표 가격을 플랫폼 상품과 대조(`[Boost] product … 표 일치`). `BoostMul(uid)` = 켜져 있으면 2.
- `RootDesk/MyDesk/Match/RankRewardService.mlua`: 정산 때 순위 보상 경험치 · 심장에 `BoostMul` 을 곱한다(레벨업 심장은 그대로) · `[Rank]` 로그 끝에 `bm=`.
- `Docs/스키마-계약.md`: §0-5 v6 · A-2-29 `BoostProduct` · 변경 이력.
