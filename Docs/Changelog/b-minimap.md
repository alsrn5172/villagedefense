# b/minimap — 좌상단 미니맵 (발판 윤곽 + 나/플레이어/포탈 표식)

> 배경: 사용자 지시 2026-10-06(제출 10/7 — 작고 안전하게). 메이플 미니맵 느낌(테두리 상자 · 위 맵 이름 · 작은 표식)만 따르고 그림은 새로 그리지 않는다. base `main 9fa3f83`.
> UI 는 원래 A 영역이라 **새 파일만** 만들었다. A 파일 · 계약 CSV · 기존 UI 그룹은 하나도 고치지 않았다(#40 에 확인 요청).

## 2026-10-06

### 새 파일
- `RootDesk/MyDesk/Minimap/MinimapController.mlua` (@Logic · 클라 전용 · 새 폴더 `Minimap/`)
  - 🔌 **전체 끄기 스위치** `property boolean MinimapEnabled = true` — `SkillExecutors.CutsceneWorldVideo` 와 같은 방식. false 면 패널을 끄고 아무 계산도 안 한다.
  - 맵 입장(`LocalPlayer.CurrentMap.Id` 변화)마다 윤곽을 새로 그린다: 맵의 모든 `FootholdComponent:GetFootholdAll()` 발판을 끝점이 이어진 것끼리 묶고(세로 벽은 뺌 · 3° 미만 꺾임은 한 막대로 합침) **막대 스프라이트**(`ZRotation` 으로 기울임)로 깐다. `ClimbableComponent` 상자는 세로 막대(같은 x 의 붙은 사다리 조각은 합침). 범위 = 발판·줄 끝점 최소~최대 → 고정 칸 284×156 에 비율 유지로 맞춤. 발판이 없는 맵은 `MapComponent:GetBound()`.
  - 표식(위치 갱신 0.15초 ≈ 초당 6.7회 · 포탈/시설/NPC 재탐색 1초): 나 = 노랑 점(맨 위 층) · 다른 플레이어 = 빨강 점(`GetUsersByMapComponent`) · 포탈 = 파랑 고리 · 포탑 = 초록 네모(`LaneFacility.Stage == "TOWER"` — 넥서스 CORE · 억제기 SUPPRESSOR 제외) · 상인 = 주황 역삼각형(`VillageNpcInteractor.ActionRoute` 가 `shop_` 로 시작) · 그 밖의 기능 NPC = 흰 타원. 몬스터 · 마을/넥서스/보스 표시 없음.
  - 맵 이름 = `WorldMapNodes.csv` 의 `Label`(읽기만) · 없으면 맵 엔티티 이름.
  - **N 키** 접기/펼치기(M 은 월드맵이 이미 씀 · 채팅 입력 중 무시 = `_ChatService.typing`). 접으면 머리줄(높이 36)만 남는다.
  - 🔌 맵별 썸네일 자리: `ThumbnailRuid(mapName)` 표에 RUID 를 넣으면 그 맵은 선 대신 `Box/Thumb` 그림을 깐다(그림 = 발판 범위를 꽉 채운다고 본다). 지금은 비어 있음.
  - 서버 호출 · 새 동기화 · 새 이벤트 없음.
- `ui/MinimapGroup.ui` (UIBuilder · GroupOrder 5 · GroupType 1) — `Minimap` 패널 300×200 · 좌상단(24, −176): 남색 반투명 바탕 + 밝은 둥근 테두리(공용 흰 9-slice `f5e5fbd6…`) · 머리줄 맵 이름 + `N` 힌트 · 더 어두운 안쪽 칸. 칸 안 층(뒤→앞): Thumb · Lines · Static · Players · Top. 템플릿(SegTpl · PortalTpl · TurretTpl · ShopTpl · NpcTpl · OtherTpl · Me)은 꺼진 채로 두고 스크립트가 Clone 한다. **전부 공용 스킨 스프라이트**(Simple): 포탈 고리 = 파랑 네모 + 어두운 구멍 · 상인 역삼각형 = 막대 4줄 · NPC 타원 = 막대 3줄.
- `RootDesk/MyDesk/Minimap.directory` · `Minimap/MinimapController.codeblock` — Maker Refresh 생성물(2026-10-06 메인 폴더에서 Refresh 후 그대로 복사).

### 자리
- 좌상단에는 이미 채팅 버튼(y −20~−92)과 채팅 한 줄(y −100~−140)이 있고, 엔진의 PC 좌상단 예약 구역(~260×170)이 있어 그 **바로 아래 y −176** 부터 둔다.
- **매치 맵에서만 보인다** (사용자 2026-10-06): 맵 이름이 `LobbyMapPrefix = "Orbis_Lobby_"` 로 시작하면(로비 역 · 배 = `Match/MatchLobbyGateway.mlua:33/35`) 패널을 끄고 그리지 않는다 → 로비 `RoomHud`(y −176~−688)와 겹칠 일이 없다. 로그 `[Minimap] hidden (lobby) map=… instanceRoom=…`.
- 겹침: 채팅 기록을 펼치면(y −100~−400) 미니맵을 덮는다(ChatGroup GroupOrder 9 > 5).
- 궁 컷신 HUD 숨김(`SkillExecutors.SetHudHidden`)은 `/ui` 의 모든 그룹을 숨기므로 미니맵도 같이 숨는다(코드 변경 없음).

### 기대는 것(읽기만 · A 가 이름을 바꾸면 조용히 빠진다)
- `WorldMapNodes.csv` `MapName`/`Label` · `Chat/ChatService.typing` · `Lane/LaneFacility.Stage` · `Npc/VillageNpcInteractor.ActionRoute`

### Play 확인 (2026-10-06 · 메인 폴더 `local/test-combined-3` 에 3파일을 미추적 복사 → Refresh · 증거 = `villagedefense-harness/minimap-check/logs` · `caps`)
- Refresh 뒤 `Minimap.directory` · `MinimapController.codeblock` 생성. 빌드 로그 357건(Info 343 · Warning 14) 전 → 후 동일, Minimap 항목 0.
- 실측으로 고친 것 3가지:
  1. **LineGUIRenderer · PolygonGUIRenderer 가 화면에 안 그려짐** — 점 35개 · Enable · `IsDrawable()=true` 인데 아무것도 없음(뒤 스프라이트를 꺼도, 큰 rect · 굵은 빨강 선으로 바꿔도 동일). 프로젝트의 다른 .ui 에도 쓰는 곳이 없다 → 윤곽 · 고리 · 삼각형 · 타원을 전부 스프라이트로 바꿈.
  2. **맵 이름이 안 보임** — 빌더의 `overflow: 2` 는 Ellipsis 가 아니라 `Truncate`(엔진 enum) + 외곽선 폭 1 → `overflow 0` · 외곽선 없음으로.
  3. **갓 Clone 한 표식이 첫 배치에서 칸 가운데에 남음** — 위치 값은 맞는데 화면 반영이 안 됨 → `Place` 에서 위치 뒤에 `RectSize` 를 다시 넣는다(`WorldMapController.SetAnchored` 와 같은 이유).
- (1) 윤곽 어긋남 없음: 나 점 vs 발밑 발판 y 차이 **0.01px** · 윤곽 범위 x ±134.0 = 칸 안쪽 절반(284/2 − 8) · y ±36.0 가운데 정렬.
- (2) 표식: 리스항구 `scan portals=1 turrets=0 shops=1 npcs=6` 화면 일치 · 북쪽 언덕 `platforms=23 ropes=38 segs=61` · `portals=4`. 빨강(다른 플레이어) · 초록(포탑)은 **그리기만 모의 확인**(업데이트 멈추고 가짜 위치 배치 → 픽셀 측정 오차 ≤ 2px). 실제 2인 · 실제 포탑(TOWER)은 미확인 — 혼자 Play · 이 시점 매치엔 CORE 만 스폰.
- (3) N 접기: `[Minimap] folded=true` → 머리줄만 · `folded=false` → 복원.
- (4) 로비 숨김: `hidden (lobby) map=Orbis_Lobby_VictoriaStation` · 배 `Orbis_Lobby_VictoriaShip` 도 숨김 → 실제 로비 흐름(`RequestCreateMatch(1)` → `RequestStartMatch()` → 인스턴스 룸 `match_m1_1`) 으로 리스항구 입장 시 나타남. 매치 안 맵 이동(북쪽 언덕)도 다시 그림.
- 런타임 경고 32건은 전부 `SkillWindowLogic.SetSortOrder`(기존) · Minimap 0 · 오류 0.
- 미확인: 실제 2인 빨강 점 · 실제 포탑 · 채팅 입력 중 N 무시 · `MinimapEnabled = false` · 모바일 화면.
