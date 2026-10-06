# a/chat-balloon-autoshow — 채팅 말풍선이 안 나옴 (Draft PR #186)

## 2026-10-06

- `Chat/ChatService.ShowBalloon`: `AutoShowEnabled` 를 **켠다**(`ChatModeEnabled` 는 끈다) · `HideDuration = 0` · `ShowDuration = BalloonSeconds` · `Message = 글`. 사라지는 건 기존처럼 `BalloonSeconds` 뒤 서버가 `Message` 를 비울 때.
- 원인: #183 ⑩ 이 `AutoShowEnabled` 를 꺼서 `Message` 를 써도 안 떴다. 엔진 공식 예시(WorldConfig `RestrictedPlayerEntitySync`)는 플레이어 말풍선을 `ChatModeEnabled=false` · `AutoShowEnabled=true` · `Message=...` 로 띄운다. 그때 Play 로 확인하지 못한 채 올렸다.
- 로그 한 줄에 `hide=` 추가(`[Chat] balloon <uid> mode= auto= hide= show=`).

## 확인 (Maker Play)

- [ ] 말풍선이 뜬다 · BalloonSeconds 뒤 사라진다 · 같은 말을 연속으로 보내도 다시 뜬다 · 다른 플레이어 화면에도 보인다.
