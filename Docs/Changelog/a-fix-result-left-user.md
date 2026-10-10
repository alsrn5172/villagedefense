# a/fix-result-left-user — 나간 참가자에게 결과 화면을 보내지 않는다 (LEA-3032)

## 2026-10-11

출처: 사용자 제보 — 매치 승리(발록 선취) 순간 서버 로그 `[LEA-3032] FailedSendToClient : TargetUserId '…'은 유효하지 않습니다`
(`MatchSessionLogic.ShowResult` ← `Expire` ← `DeclareWinner` ← `BalrogRoomService.CheckBosses`). 매치 중 누군가 나갔던 판.

| 파일 · 함수 | 예전 | 지금 |
|---|---|---|
| `MatchSessionLogic.ShowResult` | 참가자 전원에게 `SetResultCsv` (나간 사람 포함) | 방에 있는 사람(`GetUserEntityByUserId` 가 유효)에게만 보낸다 · 나간 사람은 로그 한 줄 · 끝 로그에 `sent=` |
| `PlayerRespawnService.OnMatchOver` | 부활 팝업 `Hide` 를 참가자 전원에게 | 방에 있을 때만(같은 판정) |

- 순위 · 순위 보상 · 업적 · 플레이 기록 정산은 그대로다 — 나간 사람도 행에 남는다(이탈 규칙대로 보상 없음). 화면 전송만 건너뛴다.
- 같은 판정은 이미 `ToastHere`(WO-049 ⑥) · `DispatchService` 배지에 있었다. 결과 화면 루프만 빠져 있었다.
