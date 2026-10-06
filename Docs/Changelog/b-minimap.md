# b/minimap — 좌상단 미니맵 (발판 윤곽 + 나/플레이어/포탈 표식)

> 배경: 사용자 지시 2026-10-06(제출 10/7 — 작고 안전하게). 메이플 미니맵 느낌(테두리 상자 · 위 맵 이름 · 작은 표식)만 따르고 그림은 새로 그리지 않는다. base `main 9fa3f83`.
> UI 는 원래 A 영역이라 **새 파일만** 만들었다. A 파일 · 계약 CSV · 기존 UI 그룹은 하나도 고치지 않았다(#40 에 확인 요청).

## 2026-10-06

### 새 파일
- `RootDesk/MyDesk/Minimap/MinimapController.mlua` (@Logic · 클라 전용 · 새 폴더 `Minimap/`)
  - 🔌 **전체 끄기 스위치** `property boolean MinimapEnabled = true` — `SkillExecutors.CutsceneWorldVideo` 와 같은 방식. false 면 패널을 끄고 아무 계산도 안 한다.
  - 맵 입장(`LocalPlayer.CurrentMap.Id` 변화)마다 윤곽을 새로 그린다: 맵의 모든 `FootholdComponent:GetFootholdAll()` 발판을 끝점이 이어진 것끼리 폴리라인으로 묶고(세로 벽은 뺌), `ClimbableComponent` 상자를 세로선으로(같은 x 의 붙은 사다리 조각은 합침). 범위 = 발판·줄 끝점 최소~최대 → 고정 칸 284×156 에 비율 유지로 맞춤. 발판이 없는 맵은 `MapComponent:GetBound()`.
  - 표식(위치 갱신 0.15초 ≈ 초당 6.7회 · 포탈/시설/NPC 재탐색 1초): 나 = 노랑 점(맨 위 층) · 다른 플레이어 = 빨강 점(`GetUsersByMapComponent`) · 포탈 = 파랑 고리 · 포탑 = 초록 네모(`LaneFacility.Stage == "TOWER"` — 넥서스 CORE · 억제기 SUPPRESSOR 제외) · 상인 = 주황 역삼각형(`VillageNpcInteractor.ActionRoute` 가 `shop_` 로 시작) · 그 밖의 기능 NPC = 흰 타원. 몬스터 · 마을/넥서스/보스 표시 없음.
  - 맵 이름 = `WorldMapNodes.csv` 의 `Label`(읽기만) · 없으면 맵 엔티티 이름.
  - **N 키** 접기/펼치기(M 은 월드맵이 이미 씀 · 채팅 입력 중 무시 = `_ChatService.typing`). 접으면 머리줄(높이 36)만 남는다.
  - 🔌 맵별 썸네일 자리: `ThumbnailRuid(mapName)` 표에 RUID 를 넣으면 그 맵은 선 대신 `Box/Thumb` 그림을 깐다(그림 = 발판 범위를 꽉 채운다고 본다). 지금은 비어 있음.
  - 서버 호출 · 새 동기화 · 새 이벤트 없음.
- `ui/MinimapGroup.ui` (UIBuilder · GroupOrder 5 · GroupType 1) — `Minimap` 패널 300×200 · 좌상단(24, −176): 남색 반투명 바탕 + 밝은 둥근 테두리(공용 흰 9-slice `f5e5fbd6…`) · 머리줄 맵 이름 + `N` 힌트 · 더 어두운 안쪽 칸. 칸 안 층(뒤→앞): Thumb · Lines · Static · Players · Top. 템플릿(LineTpl · PortalTpl · TurretTpl · ShopTpl · NpcTpl · OtherTpl · Me)은 꺼진 채로 두고 스크립트가 Clone 한다.

### 자리
- 좌상단에는 이미 채팅 버튼(y −20~−92)과 채팅 한 줄(y −100~−140)이 있고, 엔진의 PC 좌상단 예약 구역(~260×170)이 있어 그 **바로 아래 y −176** 부터 둔다.
- 겹침: 채팅 기록을 펼치면(y −100~−400) · 로비의 `RoomHud`(y −176~−688)가 미니맵을 덮는다 — 둘 다 GroupOrder 가 더 높아(9 · 6) 위에 그려진다.
- 궁 컷신 HUD 숨김(`SkillExecutors.SetHudHidden`)은 `/ui` 의 모든 그룹을 숨기므로 미니맵도 같이 숨는다(코드 변경 없음).

### 기대는 것(읽기만 · A 가 이름을 바꾸면 조용히 빠진다)
- `WorldMapNodes.csv` `MapName`/`Label` · `Chat/ChatService.typing` · `Lane/LaneFacility.Stage` · `Npc/VillageNpcInteractor.ActionRoute`

### 로그 스모크 (Maker Play) — TODO · Maker 를 받은 뒤
- [ ] Refresh 뒤 `Minimap/` 폴더 · `MinimapController.codeblock` 생성, 빌드 경고 수 전 → 후 동일
- [ ] Play: `[Minimap] begin key=N …` → `[Minimap] build map=<맵> label=<이름> platforms=N ropes=N lines=N …` → `[Minimap] scan portals=N turrets=N shops=N npcs=N`
- [ ] 윤곽이 칸 안에 비율대로 그려지는지(선 점 좌표 원점 = 칸 가운데 가정 · 런타임 미검증), 나 노랑 점이 걷는 대로 움직이는지
- [ ] 2인: 다른 플레이어 빨강 점 · 포탈 파랑 고리 · 마을에서 상인/NPC · 레인에서 포탑
- [ ] N 접기/펼치기 · 채팅 입력 중 N 무시 · 맵 이동/매치 인스턴스 룸 이동 뒤 다시 그림
- [ ] `MinimapEnabled = false` → `[Minimap] disabled` · 패널 안 보임
