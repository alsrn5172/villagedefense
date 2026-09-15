# a/potion-hotkey — 물약 단축키 `1` (WO-020)

> base `main 90b0d92`. 지시서: `메월드폴더/WorkOrders/WO-020-물약-단축키.md`

## 2026-09-14 — 물약 퀵 사용 진입점 + `1` 키

- `RootDesk/MyDesk/Item/InventoryService.mlua`: 기존 사용 본문을 `UseInstance`로 공통화해 클릭과 퀵 사용이 같은 검증·쿨타임·회복·소모 순서를 탄다. `PickQuickPotion`은 준비된 HP 회복 물약 중 회복량이 작은 것부터, 없으면 가장 빨리 끝나는 쿨 물약을 고른다. `RequestQuickPotion`은 관전자 가드와 기존 거절·토스트 경로를 재사용한다.
- `RootDesk/MyDesk/Item/InventoryUIController.mlua`: `1` 키 핸들러를 연결하고, 월드맵 파병 수량 입력 중에는 막으며 RPC 스팸만 0.2초로 억제한다. 물약 보유·쿨타임은 클라이언트에서 판정하지 않는다.
- `Docs/추가기획2/미정-값.md`, `Docs/VillageDefense-M1-GDD.md`: 쿨 HUD는 미정인 채 WO-020 단축키 처리 상태와 퀵 사용 규칙을 기록했다.

## 2026-09-16 — S2 퀵슬롯: 슬롯 2칸 UI · 드래그&드롭 등록 · MP 물약 · 7단계 쿨 오버레이

- `ui/QuickSlotGroup.ui`: `GroupOrder` 2의 화면 왼쪽 아래 바에 자유 슬롯 2칸(아이콘·수량·키 라벨·남은 초·`Filled`/`Vertical`/`Bottom` 쿨 오버레이)을 만들었다. 전투 중 인벤토리를 열지 않고 등록한 소모품을 바로 쓰도록 한다.
- `RootDesk/MyDesk/Item/QuickSlotController.mlua`: 클라이언트에서 `1`·`2` 키와 슬롯 클릭을 서버 `RequestQuickSlot(slot)`으로 연결하고, 월드맵 수량 입력 중에는 무시하며 0.2초 연타를 막는다. 서버 푸시 문자열만 그리며, 쿨 오버레이는 사용 직후 아래→위로 차오른 뒤 남은 비율에 따라 위→아래로 줄어드는 10·25·40·55·70·85·100% 7단계로 표시해 서버 원장을 단일 기준으로 유지한다.
- `RootDesk/MyDesk/Item/InventoryService.mlua`: 서버 메모리 `quick[userId][slot]` 원장과 등록·사용·직렬화·푸시를 추가하고 `ResetMatchState`에서 비운다. 두 자유 슬롯의 사용을 기존 `UseInstance`로 보내 클릭 사용과 같은 검증·쿨을 공유하며, `POTION_BLUE`의 MP +50은 `_SummonManager:GrantMp`로 회복한다.
- `RootDesk/MyDesk/Item/InventoryUIController.mlua`: 인벤토리 소모품 셀 드래그 이벤트와 고스트 이동·드롭 판정을 추가했다. 캐릭터 창에서 끌어 놓는 동작으로만 퀵슬롯을 등록하게 한다.
- `ui/CharacterGroup.ui`: `DragGhost` 스프라이트를 추가했다. 드래그 중인 물약 아이콘을 창 위에서 보여 등록 대상을 분명히 한다.
- `RootDesk/MyDesk/ItemInfo.csv`: `POTION_BLUE`(파란 포션, 아이콘 RUID `7e9b39b73f4945b1a8d77db6c99a6946`, 스택 99)을 추가했다. HP 물약과 대칭인 MP 회복 소모품을 인벤토리·퀵슬롯에서 쓰도록 한다.
- `RootDesk/MyDesk/ConsumeInfo.csv`: `POTION_BLUE`의 MP +50과 Lv1 13초→Lv30 6초 쿨을 추가했다. HP 물약과 별도 쿨로 대칭 규칙을 유지한다.
- `RootDesk/MyDesk/ShopItem.csv`: 물약 상인에 `SHOP_POTION_BLUE`를 30메소로 추가했다. HP 물약과 같은 가격으로 구매 경로를 제공한다.
- `ui/QuickSlotGroup.ui` 후속(사용자 지시): 쿨타임 남은 초 `CoolText` 를 흰색 → **금색(`#FFD24A`) + 검은 테두리 3px** 로. 흰 글자가 반투명 오버레이 위에서 잘 안 보였다. 엔티티 UUID 는 그대로라 바인딩 변화 없음.
- `RootDesk/MyDesk/Item/WorkshopUIController.mlua`: 물약 상인 상세 문구가 `HP +N` 고정이라 파란 포션이 `HP +0` 으로 보이던 것을 `HealHp`/`HealMp` 에 따라 `HP +N` · `MP +N` 으로 고쳤다 (Codex 검토 지적).

## 2026-09-16 — S3 매치 시작 킷: 원장 생성 지급 삭제 → `ResetMatchState` 에서 장비 7 + 보석·재료 + 물약 5·5

- `RootDesk/MyDesk/Item/InventoryService.mlua`: `EnsureUser` 의 스타터 킷 지급을 없애고(로비에서 창만 열어도 킷이 생기던 것) `GrantMatchKit(userId)` 를 신설해 매치 시작(`MatchResetService.ResetUser` → `ResetMatchState`)에서만 준다. 킷에 빨간 포션 5 · 파란 포션 5 를 더했다(사용자 결정: "매치 시작에 주고, 매치 끝엔 굳이 정리하지 않는다 — 다음 매치 시작이 비운다"). 게이트 프로퍼티는 `GiveStarterKit` → `GrantKitOnMatchStart`.

## 검증 (2026-09-16 · 개인 월드에 워크트리 물려 Play · 로그 근거)

- 빌드 경고 이전 1 → 이후 1 (기존 `ParseStatCsv` LWA-1111 · 신규 0) · mLua 진단 3파일 0건 · `check-integrity` 전부 통과(경고 4건 기존)
- S1 검증표: ② 키 회복 ✅ `use POTION_RED hp 199900→199950` · 개수 3→2 / ③ 쿨 거절 ✅ 두 번째 키는 `quick slot 1 ->` 까지만 찍히고 `use` 없음 / ④ 쿨 중 미소모 ✅ 개수 2 유지 / ⑤ 레벨 보간 ✅ `potion cooldown lv=1 cd=13.00s` / ⑦ 인벤 클릭 경로 ✅ `RequestUse` → `use` 로그 / ⑧ 두 경로 쿨 공유 ✅ 키 사용 직후 `RequestUse` 거절 / ⑩ 연타 ✅ 0.2초 가드 + 서버 쿨 거절 / ⑫ MaxHp 상한 ✅ `199950→200000/200000` / ⑬ LF ✅
  · ⑥ 물약 없음 토스트 · ⑨ 스킬 키 무간섭 · ⑪ 다른 창 무간섭은 코드 경로상 보장(토스트는 클라 RPC 라 서버 로그 없음) — 사용자 육안 항목
- S2: 파란 포션 로드 ✅ `catalog blue=true icon=7e9b39b7… healMp=50 cdStart=13 shop=true` / 키 2 ✅ `+mp 50 -> mp=100` · `use POTION_BLUE mp 72→100`(상한 적용) / 등록 ✅ `quick slot 1 = POTION_RED` · `2 = POTION_BLUE` · 장비 등록은 거절 / 드롭 판정 ✅ `SlotAtScreen` s1=1 · s2=2 · 화면 중앙=0 · 드롭 흉내 → `quick slot 2 = POTION_RED` / 쿨 오버레이 ✅ t=0.12s 40% → 0.27s 85% → 0.52s 100% → 2.5s 85% → 5.5s 70% → 9.0s 40% · 남은 초 13→11→8→4
- 🔴 사용자 육안 확인 필요: 실제 마우스 드래그&드롭과 슬롯 클릭(시뮬레이터가 UI 버튼 이벤트를 못 보냄) · 왼쪽 아래 배치 · 고스트 아이콘 · 상점 상세 `MP +50`
- S3 매치 킷: 원장만 만들면 `ensure-only items=0` ✅ → `_MatchResetService:ResetUser` 뒤 `match kit given` · `items=11 red=5 blue=5 sword=1 shield=1 gem=5 spore=12` · 퀵슬롯 비워짐 ✅ · 빌드 경고 증가 0 · 진단 0
  · 로비에서는 이제 인벤이 비어 있다 — 테스트하려면 매치 안내원 → 매치 만들기 → 시작(리스항구 도착 시 킷 지급)
