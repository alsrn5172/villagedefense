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

### 검증 (2026-09-17 · 개인 월드 · 워크트리 Reimport All · Play 1회)

server_main 에서 타이머로 **진입 → 퇴장을 2회** 돌리고, client 에서 로컬 플레이어의 Faction 컴포넌트를 0.1초마다 봤다.
관계 기준은 팀 `22`(다른 마을 시설 대역) 엔티티다 — `Test_Lane_Fx` 에서 실제 시설을 못 찾아, 빈 엔티티에 Faction 22 를 붙인 프로브로 판정했다.

| 시점 | GetTeam | Faction 컴포넌트 | GetRelation(22, 플레이어) | 관전자 |
|---|---|---|---|---|
| 진입 전 | `1` | 없음 | ENEMY | false |
| 관전 중 (1회차) | `Neutral` | 있음 | NEUTRAL | true |
| 퇴장 후 (1회차) | **`1`** | **없음** | **ENEMY** | false |
| 관전 중 (2회차) | `Neutral` | 있음 | NEUTRAL | true |
| 퇴장 후 (2회차) | **`1`** | **없음** | **ENEMY** | false |

- 퇴장 로그 `[Spectate] leave <uid> faction=removed` 2회.
- 클라: `comp team=Neutral` → `nocomp` → `comp team=Neutral` → `nocomp` — 서버에서 뗀 컴포넌트가 클라에서도 사라진다.
- 런타임 로그 1473줄 중 Error 0 · Warning 8 (Spectate/Faction 관련 0). 빌드 로그 147건 중 Warning 1 (SpectateService 관련 0 · 콘솔은 과거 항목도 보관).
- Reimport All 뒤 `SpectateService.codeblock` 변경 없음 (새 property·메서드 없음).
- ⚠️ 포탑 조건(`not IsSpectatorEntity and IsEnemy and FacilityMayHit`)은 실제 시설로 돌리지 못했다. 관전자·적대 두 항은 위 표로 확인됐고, `FacilityMayHit` 는 `PlayerComponent` 유무만 봐서 이번 변경과 무관하다.

### Codex 리뷰 (2026-09-17 · 새 세션 2회 · 같은 프롬프트 · 결과 일치)

| 질문 | 결과 |
|---|---|
| 퇴장 경로 3곳(`LeaveToLobby` · `OnUserLeave` · `ClearStragglers`) · 반복 진입/퇴장 | OK |
| 플레이어에게 `script.Faction` 이 **있다고 가정**하는 코드 (후보 목록 · `.Faction.Team` 직접 접근) | OK — 없음 |
| 플레이어 Faction 을 붙이거나 바꾸는 다른 경로 | OK — 없음 |
| 새 코드 자체 | **지적 1건** — 원래 있던 컴포넌트의 팀이 `""` 이면 복원하지 않고 Neutral 로 남았다 |

- 지적 반영: 복원 조건을 `prevTeam ~= ""` → `prevTeam ~= nil` 로 바꿔 빈 팀도 그대로 되돌린다 (한 줄).
  플레이어에게는 원래 Faction 이 없고 붙이는 곳도 `Enter` 하나뿐이라 **지금 게임에서는 타지 않는 경로**다 → Play 재검증은 하지 않았다.
