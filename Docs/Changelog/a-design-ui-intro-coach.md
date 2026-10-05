# a/design-ui-intro-coach — 게임 소개(넘기는 7쪽) · 처음 하는 사람 안내(클릭 유도) · HUD 도움말 버튼 (디자인팀 → A 인계)

> 디자이너 시안 10/5 추가분(`WIN_INTRO` · `WIN_COACH`)을 게임 UI 로 옮긴 것. **커밋 · 브랜치 없음**(디자이너 PC 작업 · 사용자 결정 2026-10-05) — A 가 `a/design-ui-intro-coach` 로 커밋할 때 이 조각을 그대로 쓴다. 릴리스 때 `Docs/CHANGELOG.md` 로 합친다(협업-규칙 §13-1).
> 보고서 페이지: https://claude.ai/artifact/JobBwdRTd3hb5J2LRGt5Qp (캡처 · 로그 · 인계 파일 ZIP · 공유 설정은 사람이)

## 2026-10-05

### 새 파일 (기존 파일 수정 0 · 협업-규칙 §6-1)
- `ui/GameIntroGroup.ui` — 게임 소개 창 1280×840(창 판 · 문장 · 제목 띠 · 닫기 · 쪽 7개 · 쪽 점 · 건너뛰기 · 이전 · 다음/게임 시작하기). 쪽 글자는 전부 .ui 에 있다(S2 에서 Maker 로 바로 고칠 수 있게).
- `ui/CoachMarkGroup.ui` — 안내 막 4장(구멍 위·아래·왼쪽·오른쪽) · 금테(slot_frame_hover · 레벨업 금테와 같은 그림) · 고리 · 손가락 · 말풍선(panel_tooltip · n/9 칩 · 제목 · 설명 · 점 9 · 건너뛰기 · 다음) · 꼬리 4개.
- `ui/HelpHudGroup.ui` — HUD 오른쪽 위 '도움말 H' 버튼(상태창 바로가기와 같은 조립법 · 캐릭터 C 버튼 왼쪽 76 · x 1349~1413). StatusHUD.ui 는 건드리지 않았다.
- `RootDesk/MyDesk/Onboarding/GameIntroController.mlua` · `CoachMarkController.mlua` — 둘 다 `@Logic` · 메서드마다 `ClientOnly`.
- `Docs/tools/design-ui/apply-intro-coach.cjs` — 위 .ui 3개를 만들고 UUID 를 주입하는 스크립트(다시 돌려도 같은 결과 · `skin.cjs` 재사용 — A PC 경로의 빌더가 없으면 이 저장소 `.claude` 사본으로 돌린다 · skin.cjs 수정 없음).
- `Docs/tools/design-ui/gen-coach-art.cjs` — 시안에 그림 파일이 없는 고리 · 손가락을 PNG 로 그린다(Node 내장 zlib).
- 데이터 행: `Docs/tools/design-ui/ruid-map.json` 에 `coach_ring`(`4263cccd…` 224×224) · `coach_finger`(`87acffbd…` 88×88) 2행 — 그룹 저장소 mIYbC 에 `dui_coach_ring` · `dui_coach_finger` 로 올림(속성 pivot 0.5 · Bilinear · Clamp).

### 동작
- 외형 선택창이 닫히는 순간(`_AvatarSelectUIController.opened` true → false) 소개를 1쪽부터 연다 — 접속마다 한 번(외형 선택이 접속마다 뜨므로). **"봤음" 저장 없음**(AccountProfile 스키마 변경 → A).
- 키: H = 열기/닫기 · 열려 있을 때 ← → = 쪽 · Esc = 닫기. 열려 있는 동안 캐릭터 좌우 이동 · 점프 · 아래 점프를 막는다(`PlayerControllerComponent:AddCondition` · SkillCaster 와 같은 방식).
- 마지막 쪽 '게임 시작하기' → 안내 1 시계 → 2 상태창 → 3 월드맵 버튼(말풍선 '월드맵 열기' 또는 실제 버튼 · M) → 4 월드맵 사냥터 점 · 접속마다 한 번.
- 안내 5~9 는 `_CoachMarkController:ShowStep(n)`(클라) / `ShowStepFromServer(n, userId)`(서버 → 그 클라) 로 연다 — **게임 진행 시점 연결은 A**(첫 레벨업 · Lv 10 · 전직관 근처 · 전직 직후 · 마을 차지).
- 대상 위치: UI 는 대상 네 모서리 → 막 루트 좌표, 월드(전직관 · 넥서스)는 WorldPosition → 화면 → 막 루트 좌표. 대상이 화면에 없으면 막 + 가운데 말풍선.
- 그리는 순서: 런타임 UI 그룹 순서는 `/ui` 형제 순서라 파일 GroupOrder(17 · 18)만으로는 월드맵(런타임 24) · 외형 선택(26) 아래에 깔렸다 → 열 때마다 `_UILogic:SetSiblingIndex` 로 부활 팝업 바로 아래로 올린다.

### 시안과 다르게 한 것
- 문구(실제 조작에 맞춤 · 사용자 결정): 전직관 Space → 클릭 · V(내 마을) → 마을 NPC · 7쪽 키보드: Space · 왼쪽 Alt = 점프(시안의 Space NPC 대화 → 점프), Z 줍기(자동) · V · B · F1 · 오른쪽 Alt · 오른쪽 Ctrl 은 '안 쓰는 키'(어둡게) · F1 조작키 안내 → H 도움말.
  - 근거 = 런타임 `PlayerControllerComponent:GetActionName`(2026-10-05 18:42): Space=Jump · LeftAlt=Jump2 · LeftControl=Attack · Left/RightShift=Skill2 · RightAlt · RightControl · Z · X · V · B · F1 = 액션 없음(스크립트 KeyDownEvent 에도 없음 · Esc · H · C 같은 창 키는 스크립트가 직접 받는다). 왼쪽 Alt 를 눌러 실제로 뜨는 것도 확인(높이 +0.78 · Space +0.75). 처음엔 Alt 를 '안 쓰는 키'로 칠했다가 이 확인으로 고쳤다.
- 글꼴: 게임 기본 글꼴 · 메이플체에 긴 줄표(—)가 없어 4쪽 제목 · 설명 3줄을 '·' / '.' 로. 한글이 낱말 가운데서 꺾여 안내 말풍선은 줄바꿈을 직접 넣었다. 2쪽 첫 칸 '0 · 0.5페이즈 개척 · 전직' → '0 · 0.5 개척 · 전직'(두 줄로 꺾여서).
- 그림: 4쪽 전직관 카드는 시안의 temp 캡처 대신 실제 NPC 그림(`VD_JOB_*.model` SpriteRUID 의 thumbnail). 마름모 · 꼬리 = 단색 칸 45° 회전, 3쪽 색 띠 = 단색 칸 48개(다각형 · 선 렌더러는 Play 에서 그려지지 않았다).

### 검증 (2026-10-05 · Maker Play · MCP)
- 빌드 경고 **6 → 6**(LWA-1111 ×4 · LWA-4012 ×2 원래 있던 것 · 새 스크립트 항목 0 · 에러 0) · check-integrity 전부 통과(경고 3 = C5 맵 박제 NPC · 원래 있던 것) · LSP 진단 에러 0.
- 소개 자동 열림 · 7쪽 넘김(→ ←) · Esc 닫힘 · H 다시 열림 · 이동 잠금(열린 동안 → 6번에 좌표 -8.840 그대로 · 닫은 뒤 → 한 번에 -7.364) · 게임 시작하기 → 안내 시작 · 1→4 실제 진행 · 5 · 6 · 7(리스항구 실제 전직관) · 9 미리보기 · 8 대상 없음(막 + 말풍선) — 캡처는 보고서 페이지.
- 7쪽 키보드를 고친 뒤 .ui 3개를 스크립트로 다시 만들어(18:45) 다시 확인: 빌드 경고 6 → 6 · 자동 열림 · → 6번(실제 키)에 좌표 그대로 · 마지막 쪽 → 로 안내 시작 · 안내 3단계에서 **실제 M 키** → 월드맵 열림 → 4단계(`next from=3 reason=map-opened`) · 실제 Esc(안내 닫힘) · H(소개 열림) · Esc(소개 닫힘) · 도움말 버튼 연결 · 런타임 에러 0.
- 못 본 것: 게임 UI 버튼 실제 클릭(MCP 마우스가 게임 버튼을 못 누름 → 같은 처리 함수를 스크립트로 불러 확인) · 넥서스가 있는 매치 화면(8단계 구멍) · 모바일 화면 · 실제 첫 레벨업 / Lv 10 시점 연결(A) · Enter 채팅(엔진 채팅창 · MCP 키 입력으로는 열리지 않음) · 왼쪽 Alt 로 2단 점프 · 공중 텔레포트(코드상 Space 만 · `SkillHotbar.mlua:220-222`).
