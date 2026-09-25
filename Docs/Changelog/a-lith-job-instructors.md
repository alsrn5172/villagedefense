## 2026-09-26 — 리스항구 전직관 5명 (직업별 전직) · 브랜치 `a/lith-job-instructors` (main `286f17a` 에서) · Draft PR #97

### 배경
사용자(2026-09-26): "리스항구에 도적·마법사·궁수·해적·전사 전직관이 있어야 하는데 없다". 실제로는 공용 "전직 교관" 1명(`VD_COMMON_JOB_CHANGE` · 9/22 B1)뿐이었고, 그 1명도 게임에서 안 보였다. 확인해 보니 `MapNpcs_Village` 의 y 가 `1.11` 로 리스항구 마을 바닥 발판(y `-1.37` · x 3.15~16.97)보다 **2.5칸 위 공중**이었다(원본 차원의 거울 9010022 의 y 를 그대로 가져온 값). 결정: 직업별 5명 · 원작 모습 · 누르면 그 직업으로만 전직.

### 데이터
- `FunctionalNpcCatalog.csv`: `VD_COMMON_JOB_CHANGE` 행 → `VD_JOB_{WARRIOR,MAGICIAN,ARCHER,THIEF,PIRATE}` 5행 (`RoleKey` `COMMON_JOB_CHANGE` 그대로 · `UiRoute` `jobchange:<JobId>` · 헤더 변경 없음)
- `MapNpcs_Village.csv`: 전직관 5행 x 11.3 / 12.5 / 13.7 / 14.9 / 16.1 · y `-1.37`(바닥). **물약 상인(`VD_SHOP_POTION_NOVICE`) y 도 1.11 → -1.37** (같은 원인)
- 모델 5개 `Models/Npcs/VD_JOB_*.model` (ModelBuilder · 옛 전직 교관 모델 복제 → id · 이름표 · SpriteRUID 교체). 원작 모험가 전직관 세트의 stand 클립: 주먹펴고 일어서 `npc/0010202` · 하인즈 `0010201` · 헬레나 `0010200` · 다크로드 `0010203` · 카이린 `0010204` (발 피벗 ny≈0 → y = 발판 높이). `VD_COMMON_JOB_CHANGE.model` 삭제
- 계약서 `NpcRole` `COMMON_JOB_CHANGE` 설명 + 변경 이력 1행 (#40 comment 5836663915 공지)

### 코드 (`Npc/CommonNpcUIController.mlua`)
- 라우트 `jobchange:<JobId>` → **메이플식 NPC 대화창**(`OpenTalk` · 사용자 2026-09-26 "NPC 가 왼쪽에 그림, 대사가 나오게"): 왼쪽 초상(지금 맵에 선 그 NPC 의 SpriteRUID 를 그대로 · `FindNpcSprite`) + 이름표, 오른쪽 대사. 대사는 클라 미러(B `LocalJobId` · `LocalLevel` · `_JobDatabase:GetRequiredLevel`)로 고른다: 이미 전직 → "이미 전직을 마쳤군…" / 레벨 부족 → "아직은 이르네. 10레벨이 되면…" / 그 외 → "전사가 되고 싶은가?" + [예]
- [예] → **B `PlayerSkillState.RequestChooseJob(jobId)`** (기존 Server RPC · 최종 판정은 B 서버) → 닫기. [대화 그만하기] → 닫기. 예전 `jobchange`(B 스킬 창 토글)는 뺐다
- 로그: `[Common] jobchange talk job=… ask=…` · `[Common] jobchange request job=…`

### UI (`CommonNpcGroup` · UIBuilder · 추가만 · 70 → 78 엔티티)
- 루트 아래 `NpcTalk` (1100×400 · 기본 꺼짐 · 파란 틀) — `PortraitBg`(초상 칸 · `Portrait` · `NamePlate`) · `TextBg/Line`(대사 · Maple 30) · `BtnEnd` "대화 그만하기" · `BtnYes` "예" (버튼은 컨테이너 안에 중첩). 스킨은 공용 흰 둥근사각 9-slice(`f5e5fbd6…`) 틴트만
- **NPC 클립은 UI 에서도 발 피벗으로 그려진다**(rect 중심 = 발) → `Portrait` rect 중심을 이름표 바로 위(y -90)에 둬야 머리가 칸 안에 들어온다(실측 · 처음엔 칸 위로 삐져나왔다)
- 처음 만든 확인 페이지(`Window/Content/JobChange`)는 지웠다

### 검증
- mLua 진단 0 · ui_lint 경고 전후 동일(기존 13) · **빌드 경고 1 → 1** (기존 `LWA-1111` · 에러 0)
- **Play PASS** (2026-09-26 · 개인 월드 · 이 워크트리 · `LithHarbor_Village_MinimiMain` 을 열고 Play):
  - `[NpcSpawner] ready map=LithHarbor_Village_MinimiMain spawned=7/7` — `VD_JOB_*` 5명 x 11.3~16.1 · y -1.37 · 각 SpriteRUID · 이름표 · `UiRoute jobchange:<JobId>` · `MapLayer1/3` (서버에서 엔티티 실측)
  - 전사 전직관 `RequestOpen` → `[VillageNpcInteractor] approved … npc=VD_JOB_WARRIOR` → `[Common] jobchange open job=WARRIOR`. 창 제목 "주먹펴고 일어서" · 문구 "전사로 전직하시겠습니까?" · JobChange 페이지만 켜짐 · 버튼 활성
  - 레벨 10(테스트용 `econ.level` 대입 · 메모리만) → [전 직] → `[Common] jobchange request job=WARRIOR` → B `[Skill] JOB NOVICE -> WARRIOR/1 (level 10)` → 직업 WARRIOR/1
  - 로비에서는 리스항구가 인스턴스 맵이라 `MoveToMapPosition` 으로 넘어가지 않아, 맵을 직접 열고 Play 했다. `[Match] handoff 없음 … room=TestPlayInstance` 에러 1건은 직접 테스트 Play 라 인계 레코드가 없어서다(이번 변경과 무관)
- **재검증 (대화창 · 2026-09-26)**: Lv1 → "아직은 이르네…"(예 없음) · Lv10 → "전사가 되고 싶은가?" + [예] → `[Skill] JOB NOVICE -> WARRIOR/1` · 전직 뒤 하인즈 → "이미 전직을 마쳤군…"(예 없음) · 초상 2종(넓은 주먹펴고 일어서 · 긴 하인즈) 칸 안 확인(스샷) · 빌드 에러 0 · 레벨은 클라 `curLevel` / 서버 `econ.level` 을 메모리에서만 올렸다
- Codex 코드 리뷰 2회(읽기 전용 · MCP 끔 · 새 세션) — 6항목 모두 OK (대화창으로 바꾸기 전 코드 기준)
- 남은 것: 위치 · 겹침 · 모습 눈 확인(사용자)

### B 쪽
- B 파일 수정 없음. 부탁 1건: `RequestChooseJob` 거절 사유 토스트 (#40 comment 5836663915)
