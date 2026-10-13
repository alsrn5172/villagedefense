# a/patch-1.1-followup — 1.1 패치 후속(비공개 테스트 서버 전 사용자 지적)

> base `main 137636e`(#205 · #206 머지 뒤). Draft #207. 2026-10-13.

## 고친 것

- **레벨업 소리 겹침**: 튜토리얼이 레벨을 한 단계씩 올려(1-2l Lv10 · 3-8l Lv20 · 6-0l Lv30) 레벨업 소리 · 이펙트 · 알림이 9~10번 동시에 나왔다(사용자 "레벨업 소리 뒤지게 크다").
  - `TutorialService.RaiseLevel`: 목표 레벨까지 모자란 경험치를 다 더해 `GrantKillReward` 한 번에 넣는다 — 레벨마다 보상은 그대로 · 연출은 한 번(최종 레벨 알림). 로그 `[Tutorial] raise level -> LvN (target N · +X exp at once)`.
  - 안전장치(사용자 "안전장치 넣어라"): `StatusHUDController.PlayLevelUp` 가 `LevelUpDedupeSeconds`(0.5초) 안에 또 오면 소리 · 이펙트를 건너뛰고 알림 숫자만 바꾼다(개발 리모콘 레벨 올리기 등 다른 경로도 막힌다). 로그 끝 `(겹침 · 소리 · 이펙트 건너뜀)`.
- **튜토리얼 직업 소개 도적 무기**: "아대 · 단검" → "아대 · 표창"(사용자 · 도적은 아대만 쓴다).
- **UI 위 클릭이 뒤 NPC 로 샘**: 튜토리얼 안내창을 누르는데 뒤의 차원의 거울이 눌렸다(사용자 "UI 클릭 시 뒤 NPC 같은 상호작용은 애초에 무시").
  - `VillageNpcUIController.IsWorldClickBlocked(touchId)`: 누른 자리가 UI 위(`_InputService:IsPointerOverUI` · RaycastTarget 켜진 UI)거나 마을 · 캐릭터 창이 열려 있으면 월드 클릭 무시. NPC(`VillageNpcInteractor`) · 넥서스(`LaneFacility`) 클릭이 같이 쓴다. 로그 `[WorldClick] blocked: pointer over UI`.
- **겹친 NPC 가 한 클릭에 같이 열림**: 차원의 거울을 누르면 전사 전직관도 눌렸다(사용자 "한 번에 하나만").
  - 원인: `TouchReceiveComponent.RelayEventToBehind` 기본 true 라 겹친 물체가 같은 클릭을 각각 받는다.
  - `VillageNpcUIController.OfferWorldClick` · `ResolveWorldClick`: 같은 클릭의 후보를 0.05초(`WorldClickWindow`) 모았다가 누른 자리에 클릭 영역 가운데(위치 + `TouchReceiveComponent.Offset`)가 가장 가까운 하나만 실행. 로그 `[WorldClick] N candidates -> 이름`.
- **도움말 1쪽(튜토리얼 시작)에 [다음] 없음**: 예전 WO-051 은 큰 버튼 두 개가 다음 행동이라 [다음] 을 껐는데, 매치 · 튜토리얼 안에서 연 도움말 1쪽에서 넘어갈 길이 흐린 [이전] 뿐이었다(사용자) → 1쪽에도 [다음] 을 켠다(`GameIntroController.RefreshButtons`).

- **도움말 마을 문장 → 마을 시설 창**(사용자 "6쪽 마을 문장에 마우스를 올리면 그 마을의 포탑 · 억제기 · 넥서스 설명창"): `GameIntroController` 가 소개 쪽 `Illu/Town1~5`(지금 6쪽)를 찾아, 커서가 문장(또는 아래 이름 칸) 위에 0.25초(`EmblemHoverDelay`) 머물면 · 누르면(`ScreenTouchEvent` · 모바일) `TutorialInfoUI.OpenTown(마을)` 로 튜토리얼 마을 시설 창을 그 마을 탭 · [확인] 버튼으로 도움말 위에 띄운다(그룹 형제 순서를 도움말 바로 위로). 닫은 뒤 같은 문장 위에 그대로 있으면 다시 안 뜬다(벗어났다 와야). 문장 · 이름 칸 판정 = `_UILogic:ScreenToLocalUIPosition` + 크기 · 피벗(UI 파일은 안 고침).
  - ESC: 그 창이 떠 있으면 `UIEscStack` 이 도움말까지 같이 닫지 않는다(창이 스스로 ESC 로 닫힘).

## 확인

- mLua LSP: 고친 `.mlua` 7개 오류 0.
- Play 확인은 아래 체크리스트(Draft #207 본문).
