# a/spectate-faction-restore — 관전 퇴장 후 플레이어 진영 복구 (WO-026)

> base `main 046b775`. 지시서: `메월드폴더/WorkOrders/WO-026-관전-진영-복구.md` · PR #60

## 2026-09-16 — 관전을 한 번 다녀오면 세션 끝까지 중립이던 버그

### 증상 (코드 리뷰 지적 → 코드로 확인)

| 위치 | 내용 |
|---|---|
| `Match/SpectateService.mlua` `Enter` | 플레이어에 `script.Faction` 이 없으면 붙이고 `Team = "Neutral"`. DefaultPlayer 는 Faction 이 없어 **항상 새로 붙는다** |
| 같은 파일 `LeaveSpectate` | 보이기 · 컨트롤러 · 피격 · 중력 4개만 되돌렸다. **Faction 은 그대로** |
| `Faction/FactionLogic.mlua` `GetTeam` | Faction 컴포넌트가 있으면 **1순위**로 그 값. 없을 때만 2순위 `PlayerTeamOf`(마을 진영 번호) |
| 같은 파일 `GetRelation` | 한쪽이라도 Neutral 이면 NEUTRAL — 공격 · 버프 전부 차단 |

→ 관전(탈락 · 개발 리모컨)을 한 번 다녀온 플레이어는 **세션 끝까지 Neutral.** 다음 매치에서 시설 · 미니언 · 야생 몹이 그 플레이어를
무시하고, 그 플레이어도 아무도 못 때린다. 퇴장 경로 3곳(`LeaveToLobby` · `OnUserLeave` · `BalrogRoomService.ClearStragglers`)이 전부 같은 증상이다.

### 무엇을 바꿨나

| 파일 | 무엇을 |
|---|---|
| `Match/SpectateService.mlua` | `Enter` 가 Neutral 로 덮기 전에 **새로 붙였는지(`factionAdded`) · 이전 팀(`prevTeam`)** 을 관전 표에 적는다. `LeaveSpectate` 는 새로 붙인 것이면 `RemoveComponent("script.Faction")`, 원래 있던 것이면 이전 팀으로 되돌린다. 떼기에 실패하면 경고 + 팀만 `PlayerTeamOf` 로. 퇴장 로그에 `faction=removed / restored:<팀> / remove-failed` |

- **왜 떼나** — 플레이어 진영의 정본은 `GetTeam` 2순위(`PlayerTeamOf` = 지금 가진 마을 슬롯)다. 팀 번호를 써 넣으면 다음 매치에서
  다른 마을을 잡아도 옛 번호가 1순위로 남아, 09-09 에 고친 "남의 마을 포탑이 주인을 쏜다" 가 되살아난다.
- 새 `property` · 새 메서드 없음 (관전 표는 런타임 테이블).
- 안 건드림: `FactionLogic` · `Faction` · `LaneStateService` · `MatchSessionLogic` · `BalrogRoomService`.

### 검증

(대기 — 개인 월드 · `Test_Lane_Fx`)
