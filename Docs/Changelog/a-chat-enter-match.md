# a/chat-enter-match — 우리 채팅 창 (WO-043)

> 배경: 사용자 2026-10-05 ① `/` 대신 Enter 로 입력 ② 입력할 때 자동 펼침 ③ `/` = 펼침 · 접힘 토글 ④ 매치 중엔 같은 매치 사람끼리만. 엔진 채팅(`ChatComponent`)은 입력 키 변경 · 메시지 거르기 · 스크립트 전송 API 가 없어 → 사용자 결정 **"우리 채팅 창으로 · UI 는 디자이너 시안"**.

## 2026-10-05

### 새 `Chat/ChatService.mlua` (@Logic · 서버 + 클라)
- 클라: 엔진 채팅(`/ui/DefaultGroup/UIChat`)을 끄고, 키 · 버튼 · 입력칸을 붙인다.
  - **Enter** = 입력 시작(접혀 있었으면 펼치고 보낸 뒤 다시 접는다) · 입력 중 **Enter** = 보내기(`TextInputSubmitEvent`) · **ESC** = 입력 취소 · **`/`** = 펼침 · 접힘 토글(입력 중엔 글자) · 왼쪽 위 칸 버튼 = 토글. 방금 보낸 Enter 가 KeyDown 으로 한 번 더 와도 다시 열리지 않게 0.3초 막는다.
  - 접힘 = 마지막 한 줄 · 펼침 = 최근 12줄(60줄 보관). 닉네임 금색 · 말 아이보리(시안 #1).
  - `typing`(입력 중) — 단축키를 쓰는 창이 이 값을 보고 키를 무시한다.
- 서버 `RequestSend`: **같은 룸 안의 사람에게만** 보낸다(매치 = 인스턴스 룸 → 같은 매치 사람끼리 · 로비와 끊긴다). 0.5초 간격 제한 · 80자 · 줄바꿈 · 서식 태그(`<` `>`) 막기 · 보낸 사람 말풍선(`ChatBalloonComponent.Message` · @Sync · 5초 뒤 비움).
- 로그: `[Chat] <uid> -> N user(s) in room (글자 수)`(내용은 안 남긴다) · `[Chat] toggle expanded=…`.

### 새 `ui/ChatGroup` (`Docs/tools/design-ui/apply-chat.cjs`)
- 시안 04-hud #1 그대로: 왼쪽 위 (24,20) **72 칸 버튼**(`slot_frame` · 올림 `slot_frame_hover`) + 안내 아이콘(`icon_info` 40×34) · (24,100) **420×40 마지막 한 줄 판**(`plate_dark` 알파 0.92 · Default 16).
- 펼친 모양(시안에 없음 — 엔진 채팅이라 안 그렸다): 같은 판으로 (24,100) 기록 420×300 + (24,408) 입력 줄 420×44(`TextInputComponent` 한 줄 · 80자 · 안내 "Enter 로 보내기 · ESC 취소").
- 그룹 순위 9(로비 · 안내 · 마을 창보다 위 · 공용 NPC 10 · 캐릭터 11 아래).
- `ui/DefaultGroup` `UIChat` Enable = false(엔진 채팅 끔 · 다른 값은 그대로).

### A 단축키: 채팅 입력 중엔 무시
- `Item/QuickSlotController`(1 · 2) · `WorldMap/WorldMapController`(M) · `PortalNetwork`(포탈) · `Match/SpectateService`(관전 카메라 WASD · 화살표) · `Stat/DevStatRemote` · `Lane/LaneTestDriver`.
- 🔴 #170 이 고치는 파일(`Stat/StatUIController` C · `Summon/UIEscStack` ESC)은 충돌을 피해 여기서 안 건드렸다 → **둘 다 머지된 뒤 한 줄씩 추가**.
- 🔴 B 단축키(`Skill/SkillHotbar` 스킬 키 · `Skill/SkillMovement` · `Skill/SkillWindowLogic` K)는 B 파일 — 입력 중 스킬이 나가면 B 에 `if _ChatService ~= nil and _ChatService.typing then return end` 한 줄을 요청한다.

### 잃는 것
- 엔진 월드 채팅 · 채팅 감정 표현 · 음성 채팅.

### 입력 중 키 막기 · ESC = 채팅 접기 (사용자 2026-10-05 "c q w e r k 다 안 먹히게 · ESC 누르면 채팅 토글 off")
- 입력을 시작할 때 지금 키(A~Z · 숫자 · Space · Shift · Ctrl · Alt · Insert/Delete/Home/End/PageUp/PageDown)에 걸린 **플레이어 액션마다** 엔진 `PlayerController.AddCondition` 으로 "입력 중이 아닐 때만" 조건을 단다 → 스킬 Q W E R …(B `SkillHotbar` 의 액션 키) · 공격 · 점프 · 줍기가 입력 중엔 안 나간다. 스킬 파일(B)은 안 건드린다. 액션마다 한 번 · 플레이어가 바뀌면 다시.
- ESC: 펼쳐져 있거나 입력 중이면 쓰던 글을 지우고 **접는다**(예전엔 입력 중일 때만 입력 취소). 접은 시각 `escAt` 을 남긴다 — 머지 뒤 ESC 창 스택(`UIEscStack` · #170)이 같은 ESC 로 다른 창까지 닫지 않게 본다.
- 남은 것(머지 뒤): C(`StatUIController` · #170) · ESC 창 스택에 입력 중 가드. K(스킬 창 `SkillWindowLogic`)와 공중 Space 텔레포트(`SkillHotbar` 의 KeyDown)는 B 파일.

### Codex 검토 반영
- 입력칸 속성 타입 `TextInputComponent` → `TextGUIRendererInputComponent`(UI 의 `Field` 엔티티가 가진 실제 컴포넌트 · 틀린 타입이면 Enter 로 입력칸이 안 잡힌다).
- 클라 `OnBeginPlay` 가 그 전에 도착한 채팅 줄을 지우지 않게(`lines` 가 비었을 때만 새로 만든다).
- (확인만) 말풍선 `ChatBalloonComponent.Message` 는 엔진 정의상 `@Sync` 라 서버에서 쓰면 모두에게 보인다 — 바꾸지 않음.

### 확인 (사용자 · Maker)
- [ ] Reimport All(새 `Chat/` 폴더 · `ChatService` · `ChatGroup`) → 빌드 경고 0 · `[Chat] ChatService ready` 서버 · 클라 둘 다.
- [ ] Enter → 펼쳐지고 입력칸에 커서 · 글 쓰고 Enter → 기록 · 말풍선 · 다시 접힘. `/` 토글. ESC 취소.
- [ ] 입력 중 `c` · `m` · `1` 등을 쳐도 창이 안 열린다(A). 스킬 키가 나가면 B 요청.
- [ ] 로비와 매치(다른 룸) 사이에 말이 안 넘어간다 · 같은 매치 둘은 보인다.
