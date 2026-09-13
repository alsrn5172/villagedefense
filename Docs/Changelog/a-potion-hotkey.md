# a/potion-hotkey — 물약 단축키 `1` (WO-020)

> base `main 90b0d92`. 지시서: `메월드폴더/WorkOrders/WO-020-물약-단축키.md`

## 2026-09-14 — 물약 퀵 사용 진입점 + `1` 키

- `RootDesk/MyDesk/Item/InventoryService.mlua`: 기존 사용 본문을 `UseInstance`로 공통화해 클릭과 퀵 사용이 같은 검증·쿨타임·회복·소모 순서를 탄다. `PickQuickPotion`은 준비된 HP 회복 물약 중 회복량이 작은 것부터, 없으면 가장 빨리 끝나는 쿨 물약을 고른다. `RequestQuickPotion`은 관전자 가드와 기존 거절·토스트 경로를 재사용한다.
- `RootDesk/MyDesk/Item/InventoryUIController.mlua`: `1` 키 핸들러를 연결하고, 월드맵 파병 수량 입력 중에는 막으며 RPC 스팸만 0.2초로 억제한다. 물약 보유·쿨타임은 클라이언트에서 판정하지 않는다.
- `Docs/추가기획2/미정-값.md`, `Docs/VillageDefense-M1-GDD.md`: 쿨 HUD는 미정인 채 WO-020 단축키 처리 상태와 퀵 사용 규칙을 기록했다.

## 검증

(Maker Play 검증 대기 — 검증표 13개는 후속 커밋에서 기록)
