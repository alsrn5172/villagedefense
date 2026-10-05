# a/post-merge-codeblocks — 머지 뒤 마무리 (Draft #176)

## 2026-10-05

### 그룹 월드 Reimport All 결과 커밋
- #170 · #174 머지 뒤 그룹 월드 Reimport All 이 만든 파일 5개를 그대로 넣었다: `Chat.directory` · `Chat/ChatService.codeblock` · `Match/ExitWarnController.codeblock` · `Npc/JobMarkController.codeblock` · `Summon/UIEscStack.codeblock`. Maker 는 기존 파일을 바꾸지 않았다.

### 채팅 입력 중 C · ESC (사용자 2026-10-05 "c q w e r k 다 안 먹히게 · ESC 누르면 채팅 토글 off")
- `Stat/StatUIController`: 채팅 입력 중이면 C(캐릭터 창)를 무시.
- `Summon/UIEscStack`: 채팅이 펼쳐져 있거나 입력 중이거나 방금(0.1초 안) ESC 로 접혔으면 창을 닫지 않는다 — ESC 한 번에 채팅만 접힌다(두 핸들러 중 누가 먼저 받든). 로그 `[EscStack] ESC -> chat only`.
- Q W E R 등 스킬 키 · 공격 · 점프는 #174 에서 이미 막았다(액션 조건). K(스킬 창)와 공중 Space 텔레포트는 B 파일 — 사용자가 B 에 전달.

### 확인 (사용자 · Maker)
- [ ] 머지 → pull → Reimport All → 빌드 경고 0.
- [ ] Enter 로 입력 중 C · Q · W · E · R 을 쳐도 창 · 스킬이 안 나가고 글자만 써진다.
- [ ] 캐릭터 창을 연 채로 채팅을 펴고 ESC → 채팅만 접힘 · 한 번 더 ESC → 캐릭터 창 닫힘.
