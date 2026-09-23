# a/p0914-11-rooms (B11 · 통합 브랜치 `a/plan-0914` · B10 위 stacked · PR #80)

인스턴스 룸 동시 매치 (WO-029 B11 · WO-024).

| 항목 | 내용 | 파일 |
|---|---|---|
| 룸 생성·인계 | `StartMatch`: 룸 생성(`match_<id>_<n>` · PortalRoutes 의 모든 맵 · 첫 유저 대기 60초) → 심장 차감 → 참가자 동기 저장 → 공유 메모리(`difficulty`·`participants`·`host`) → `MoveUsersToInstanceRoom(…, 리스항구)` → 원장 삭제. 전역 진행 중 차단 제거 · `busy` 항상 0 | `Match/MatchLobbyGateway.mlua` |
| 룸 안 시작 | `OnBeginPlay`(인스턴스 룸) → `ReadHandoff` → `TickPendingStart`: 전원 입장 + 계정 로드 완료 시 `StartMatch`(상한 30초 · 들어온 사람만) → 공유 메모리 삭제 | `Match/MatchSessionLogic.mlua` |
| 복귀 | `ReturnToStation`: 룸 안이면 `MoveUserToStaticRoom(uid, 승강장)` | `Match/MatchLobbyGateway.mlua` |
| 저장 장벽 | `FlushUserAndWait`(= 이탈 저장 경로 · BatchSetAndWait) | `Progression/PlayerDBManager.mlua` |
| 포탈망 | 룸에 없는 맵 노선은 `absentMap` 으로 조용히 건너뜀 | `PortalNetwork.mlua` |
| 맵 | 로비 2개 제외 41개 `IsInstanceMap=true` | `map/*` |

## 검증

- LSP 진단 0 · `node Docs/tools/check-integrity.cjs` 통과.
- 런타임(Maker): PR 본문.
