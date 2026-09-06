## 2026-09-06 — 개발용 리모컨 확장: 가로 2배 + 메소·빨간 포션·보석 12종 지급 · 브랜치 `a/dev-remote-meso-gem` (main `cf8f2fc` 에서)

### 배경
사용자 지시(2026-09-06): "` 키 리모컨에서 메소 증가도 되게, 보석도 종류별로 생기게, 가로로 2배 늘리고 기능 추가". 공방(강화·제작·물약·수리) 시험에 메소·보석·포션이 매번 서버 스크립트로 필요했다.

### UI (`DevStatRemoteGroup` · UIBuilder `patch` + 추가 · 73 → 159 엔티티)
- 패널 400×600 → **800×600**(오른쪽 가장자리 x=940 고정 · 중심 540). 타이틀 772 폭
- **좌측 열**(x −200) = 기존 9행(STR~MaxHP ±1/±10) · 적용값 3줄 · 굴림 결과 그대로. 푸터 `초기화`·`데미지 굴림`·힌트를 왼쪽 열 안으로
- **우측 열**(x +200): `Row_meso`(현재 메소 · `+100 / +1k / +10k / +100k`) · `Row_potion`(빨간 포션 보유 · `+1 / +5 / +10`) · `GemRoot/Row_{GemId}` 12행(`GemInfo.DisplayName` · 보유 수량 · `+1 / +5 / +10`)
- 바인딩 3개 주입(`rowMeso` `rowPotion` `gemRoot`) · 보석 행은 이름(`Row_{GemId}`)으로 순회 — 보석이 늘어도 스크립트 수정 없음

### 코드 (`Stat/DevStatRemote.mlua`)
- 클라 `SetupClient`: 우측 열 버튼 → `RequestMeso(amount)` / `RequestGive(itemId, count)`. 화면은 `SetReadout` 응답으로만(낙관적 UI 없음)
- 서버 `RequestMeso`: `_SummonManager:GrantMeso(player, amount)`(원장 + HUD 갱신). `RequestGive`: `_InventoryService:GiveItem` + `PushInventory`
- `PushReadout`: `meso=` · `potion=` · `gem_{GemId}=` 보유 수량을 기존 `valuesCsv` 에 덧붙임(`_ItemCatalog.gems` 순회)
- `Enabled=false` 면 전부 무시(배포 전 끄는 규칙 그대로)

### 검증
- 🟡 **Maker 미실행(작업 시점에 종료 상태)** — 오프라인: 좌표 실측(패널 800 · 좌열 −200 · 우열 +200 · 보석 12행 35 간격) · UIBuilder validate 에러 0 · LSP 에러 0. 런타임(` 토글 → 메소 +1k → HUD/원장 · 보석 +5 → 인벤 · 포션 +1)은 Maker 켜고 refresh 2회 뒤 확인 예정

### 부수
- Maker 가 종료하며 `map/SixPathCrossway.map` · `CharacterGroup` · `VillageWorkshopGroup` UI 파일을 자기 포맷(`1`→`1.0` · 기본 `Rotation` 필드 추가 · CRLF)으로 되썼다 → 의미 변화 없음, `git checkout` 으로 되돌림(이 브랜치 diff 에 섞지 않음)
