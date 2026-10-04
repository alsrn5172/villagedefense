# b/skill-window-job-refresh — 전직 뒤 스킬 창이 예전 직업 행을 보여 주는 문제

> base `main 6519369`(#116 머지 뒤). B 파일 한 개(`Skill/SkillWindowLogic.mlua`)만 바꾼다. 계약 변경 없음(새 표·열·열거값·이벤트 없음). A 파일 편집 없음.

## 2026-10-04

### 문제 (2026-10-04 Play 행 P10/S10 에서 발견)

- 전직(진짜 경로 `RequestChooseJob` → `ChangeJob`, 또는 DEV 전환) 직후 K 로 스킬 창을 열면 **예전 직업의 행**이 그대로 보인다. 탭을 한 번 눌러야 새 직업 행으로 바뀐다.

### 원인

- `OnSkillStateChanged` 의 `"job"` 분기(`SkillWindowLogic.mlua:527-529`)는 **창이 열려 있을 때만** `ShowTab` 으로 행을 다시 만든다. NPC 대화로 전직하면 그 순간 창은 닫혀 있으므로 아무것도 안 한다.
- 창을 열 때 `Toggle`(`:498`)이 부르는 `RefreshFromState` → `RefreshRowLevels` 는 **지금 있는 행의 레벨·잠김 상태만** 다시 칠한다. 행 목록은 `ShowTab` 만 만들기 때문에 예전 직업 행이 남는다. 탭을 누르면 `ShowTab` 이 돌아서 그제야 바뀐다.

### 수정 (`Skill/SkillWindowLogic.mlua`)

- 새 property `builtJobLine` · `builtTier`(`@HideFromInspector` · `:66-71`): 지금 떠 있는 행을 만들 때 읽은 직업·차수.
- `ShowTab`(`:670-671`): 행을 만들 때 미러(`LocalJobId` · `LocalTier`)를 위 두 값에 적는다.
- `Toggle`(`:505-514`): 창을 열 때 미러의 직업·차수가 `builtJobLine`/`builtTier` 와 다르면 먼저 `ShowTab(currentTab)` 으로 행을 다시 만들고, 그다음 기존대로 `RefreshFromState`. 다시 만들 때 `SkillWindowLogic: rows built for A/1 -> rebuild for B/2` 로그를 남긴다.
- 창이 열려 있을 때의 `"job"` 분기는 그대로 둔다(동작 변화 없음). 창을 연 채 전직하는 경우는 원래도 맞게 다시 만들었다.
- 처음 들어올 때(`OnBeginPlay` 의 `ShowTab(0)`)도 같은 값을 적으므로, 미러가 늦게 도착해 직업이 달라진 경우도 창을 열 때 다시 만든다.

### 검증

- `node Docs/tools/check-integrity.cjs` — **전부 통과**(경고 3건 = 기존 A 쪽 C5 · 기준선과 같음).
- mLua LSP `diagnose`(`@maplestoryworlds/mlua-lsp` 1.1.4 · Maker 없이) — `SkillWindowLogic.mlua` **오류 0 · 경고 0**.
- Maker Play: 🟡 **대기** — 이 작업 중 Maker 를 쓰지 않았다. 확인 방법(`villagedefense-harness/pirate-check/RUN-2.md` S10 · L8):
  - 초보자 Lv10 이상에서 **진짜 NPC 경로**(전직 교관 [예] → `RequestChooseJob`)로 전사 전직 → 서버 `[Skill] JOB NOVICE -> WARRIOR/1`.
  - 탭을 누르지 말고 바로 **K** → 클라 `SkillWindowLogic: rows built for NOVICE/0 -> rebuild for WARRIOR/1` · `SkillWindowLogic: ShowTab(0) jobLine=WARRIOR tier=1 rows=N` · 창에 전사 행이 바로 보인다.
  - 같은 직업에서 창을 닫았다 다시 열면 `rows built … rebuild` 로그가 **안 찍히는지**(바뀐 게 없으면 다시 만들지 않는다).
