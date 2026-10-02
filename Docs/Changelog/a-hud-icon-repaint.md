# a/hud-icon-repaint — 스킬 칸 아이콘이 바뀌면 스킬 HUD 다시 칠하기 (A)

> Draft PR #155 `[a/hud-icon-repaint]` · base `main`(`e2c28c7`). 사용자 결정 2026-10-02. 릴리스 때 `Docs/CHANGELOG.md` 로 합친다(협업-규칙 §11).

## 2026-10-02

### 우하단 스킬 HUD — 아이콘만 바뀌어도 다시 칠한다
- `Stat/SkillHudController.mlua` `RefreshCells`: 다시 칠하는 조건에 아이콘 비교(`cell.shownIcon`)를 더했다. 전에는 칸의 스킬 ID 나 매핑이 바뀔 때만 칠해서, 같은 스킬 ID 에서 아이콘만 바뀌면 옛 아이콘이 남았다.
- 왜: B 가 만들 레이징 블로우(불굴의 진 중 파워 스트라이크) · 플레임 헤이즈(매직 가드 중 에너지볼트)는 버프 동안 스킬 칸 아이콘이 바뀐다. 이제 B 가 버프 중 `SkillDatabase:GetSkill(칸 스킬 ID).icon` 만 바꾸면 0.1초 안에 HUD 에 보인다. 인계 페이지 https://claude.ai/artifact/MN341JGoYdWYyvbmg991BR
- 로그: 같은 스킬에서 아이콘만 바뀌었을 때 `[SkillHud] icon swap <키> <스킬 ID> -> <RUID>`.
- 계약 변경 없음(새 표 · 열 · 이벤트 · 열거값 없음) · B 파일 수정 없음.

### 검증 (2026-10-02 · Maker Play)
- 환경: 이 워크트리(`7fa3568`)를 개인 월드에 물려 Reimport All · Orbis_Lobby_VictoriaStation · 보고서 https://claude.ai/artifact/6c6JEFt6iMxBModhFKuqv6
- 빌드 경고 **1 → 1**(남은 1건 = 원래 있던 `ParseStatCsv` LWA-1111 · 에러 0) · 런타임 에러 0(경고 = 원래 있던 LWA-3047 3건) · check-integrity 통과(경고 3 = main) · LSP 0 · main 위 #155 → #131 → #154 합쳐 봐도 충돌 0.
- **아이콘 교체 PASS**: DEV 로 전사 + 전 스킬(`DevSetJobState` · `DevLearnAll`) → 클라에서 `GetSkill("SK_W11").icon` 을 레이징 블로우 아이콘 `644fc39b…` 로 바꿈 → 같은 초에 `[SkillHud] icon swap Q SK_W11 -> 644fc39b…` · Q 칸 그림이 바뀜(캡처) → 되돌리니 다시 `5c61ff8d…`.
- 못 본 것: B 의 실제 레이징 블로우 · 플레임 헤이즈(아직 없음 — 아이콘 값을 손으로 바꿔 흉내 냄) · 모바일 스킬 버튼 화면.
