# a/tutorial-3 (2026-10-07)

- **NPC 대화창(전직) 새 시안** — 디자이너 인계 "NPC 대화창 · 전직"(1440×470 하단 대화창). `CommonNpcGroup/NpcTalk` 를 새 틀로(초상 무대 · 이름 판 + 직업 아이콘 · 역할 칩 · 레벨 게이지 · 다음 할 일 · 스킬 칸 2 · 버튼 파랑 = 빠지는 쪽 / 금 = 하는 쪽) + 전직 완료 연출(`JobNotice`). 새 `Npc/NpcTalkController` 가 화면 7종(레벨 부족 · 인사 · 전직 제안 · 확인 · 완료 · 2/3차 전직 · 이미 전직)을 맡고 `CommonNpcUIController` 는 열고 닫기만. 스킬 칸은 `SkillInfo.csv` 실제 값. 전직은 B 의 `RequestChooseJob` · `RequestSync` 그대로(B 파일 수정 없음). 적용 스크립트 `Docs/tools/design-ui/apply-npc-talk.cjs`.
- **초상 위치 보정** — NPC 클립은 UI 칸에서 "그림 피벗(발)이 칸 가운데"에 그려져 몸이 위 · 오른쪽으로 솟았다. `NpcTalkController.PlacePortrait` 가 직업별 프레임 크기 · 피벗(공식 자원 API 실측 · `JobPortrait`)으로 칸 크기와 위치를 매번 정해 무대 가운데에 세운다.
- **직업 아이콘 5종** — 새 시안 그림으로 같은 RUID 에 덮어씀(도움말 · 공방 아이콘도 같이 바뀜).
- **도움말 소개 쪽 순서** — 8쪽(튜토리얼 시작)을 1쪽으로, 옛 1~7쪽은 2~8쪽. [아니오] · 튜토리얼 끝난 뒤 도움말 · 알림 카드 "자세히" 쪽 번호를 같이 옮김. 마지막 쪽 [다음] = 게임 시작하기. `apply-intro-page-order.cjs`.
- **튜토리얼 가림 버그** — `CommonNpcGroup` GroupOrder 26 → 16. 거울 · 파병 · 2/3차 전직 창이 튜토리얼 막(18 · 19)보다 위라 안내 칸이 뒤로 가고 아무 마을이나 눌렸다. `fix-npc-group-order.cjs`.
- **튜토리얼 1-3 + 1-4 합침** — [다음] 없이 바로 주먹펴고 일어서 클릭. 새 대화 순서(1-4b ~ 1-4e)와 2차 · 3차 전직 버튼 잡기 갱신. 1-6b 문구 = "무조건 헤네시스로 가 봐요".
