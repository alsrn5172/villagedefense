# a/p0914-11-rooms (B11 · 통합 브랜치 `a/plan-0914` · B10 위 stacked · PR #80)

인스턴스 룸 동시 매치 (WO-029 B11 · WO-024).

| 항목 | 내용 | 파일 |
|---|---|---|
| 룸 생성·인계 | `StartMatch`: 룸 생성(`match_<id>_<n>` · PortalRoutes 의 모든 맵 · 첫 유저 대기 60초) → 공유 메모리(`difficulty`·`participants`·`host` · 키별 결과 전부 OK 확인) → 심장 차감 → 참가자 동기 저장(실패하면 출발 중단 · 차감 표시 유지) → 원장 삭제 → `MoveUsersToInstanceRoom(…, 리스항구)`. 룸을 만든 뒤의 중단은 `AbortStart` 한 곳(잠금 해제 · 안내 · 인계 삭제). 전역 진행 중 차단 제거 · `busy` 항상 0 | `Match/MatchLobbyGateway.mlua` |
| 이동 = 이탈 아님 | 룸 이동은 로비 룸의 `UserLeaveEvent` 를 동기로 일으킨다(실측) → 이동 중 표식(`transferring`)으로 걸러 호스트 이동이 "해산" 이 되지 않게. 부분 이동은 1초 뒤 남은 사람을 승강장으로(`RecoverUnmoved` · 환불 없음 · error 로그) · 아무도 못 가면 인계 삭제 | `Match/MatchLobbyGateway.mlua` |
| 출발 중 가드 | `StartMatch` 는 멈추는 호출(인계 쓰기·동기 저장) 사이에 끼어드는 이탈에 대비해 `m.starting` 을 세운다: 접속 끊김은 기록만(`leftDuringStart`) · 나가기·강퇴 거절 · 멈춘 뒤마다 `PruneStarting` 으로 명단 재정리(차감 전 주인 이탈 = 해산 · 차감 뒤엔 남은 사람만 데려감) · 줄어든 명단은 인계에 다시 씀 | `Match/MatchLobbyGateway.mlua` |
| 차감 매치 | 차감 뒤 중단된 매치는 새 참가 거절·목록에서 숨김(공짜 탑승 차단) · 부분 차감(`BalrogHeartService.lastPaidCount`)이면 재시도 대신 해산(이중 차감 차단) | `Match/MatchLobbyGateway.mlua` · `Progression/BalrogHeartService.mlua` |
| 룸 안 시작 | 인스턴스 룸 `OnBeginPlay` → `ReadHandoff`(못 읽으면 1초마다 재시도 · 상한 30초를 읽기 전에 검사) → `TickPendingStart`: 전원 입장 + 계정 로드 완료 시 `StartMatch`(입장 대기 상한 30초는 첫 참가자 도착부터 · 넘으면 들어온 사람만 · 미도착 경고) → 인계 삭제. 인계는 룸마다 한 번(`handoffActive`) · `AutoStartOnPlay` 는 정적 룸에서만 | `Match/MatchSessionLogic.mlua` |
| 복귀 | `ReturnToStation`: 룸 안이면 `MoveUserToStaticRoom(uid, 승강장)` | `Match/MatchLobbyGateway.mlua` |
| 저장 장벽 | `FlushUserAndWait`(= 이탈 저장 경로 · BatchSetAndWait): 떠 있는 비동기 저장을 먼저 기다리고(상한 `FlushWaitSeconds` 5초 · 넘으면 이동 보류) 보낸 키가 전부 성공해야 true. `SaveForUser` 가 성공 여부를 돌려준다 | `Progression/PlayerDBManager.mlua` |
| 포탈망 | 룸에 없는 맵 노선은 `absentMap` 으로 조용히 건너뜀 | `PortalNetwork.mlua` |
| 넥서스 | 정적 룸(로비)에서는 `SpawnAllNexus` 를 건너뜀 (마을 맵이 룸에만 있다) | `Lane/LaneFacilityService.mlua` |
| 맵 | 로비 2개 제외 41개 `IsInstanceMap=true` **+ 파일 헤더 `"Usage": 1`** (둘 다 있어야 룸에 들어간다 — 헤더가 0 이면 `CreateInstanceRoom` 이 `LEA-3002` 로 실패 · 실측) | `map/*` |
| 계약서 | §0-3 이름 규약에 **인스턴스 룸 키** `match_{MatchId}_{세대}` + "매치 맵 = 인스턴스 맵" · A-4 에 **`MatchRoomHandoff`**(공유 메모리 인계 레코드) · 9/14 등록서 1·8번에 B11 추가 · 변경 이력 (#40 comment 5794545040 공지 뒤 단독) | `Docs/스키마-계약.md` |

## 검증

- LSP 진단 0 · `node Docs/tools/check-integrity.cjs` 통과.
- Codex 2회 교차 리뷰 ×3 라운드 반영 (3차의 "줄 끝 주석이 코드를 삼킴" 2건은 오탐 — 파일 바이트·LSP·Play 로 확인).
- 런타임(Maker · 개인 월드 · TEST 프로필) — 전부 통과:
  - 로비 만들기 → 5초 → 룸 생성 → 이동 `moved=1/1` → 룸 안 인계 `diff=1 players=1` → `START` → 페이즈·웨이브 11개 → 만료 → 순위 보상 → 결과 화면 → "로비로" → `MoveUserToStaticRoom ok=true` → 빈 룸 소멸.
  - ★3 직접 출발: 심장 14 → 차감 2 → 동기 저장 → 룸 안 로드 12 → 중도 포기 → 복귀 뒤 로비 12 (부활 없음).
  - 인계를 6초 늦게 써도 재시도가 잡아 시작 · 매치 종료 뒤 36초 동안 인계 재읽기 없음.
  - 포탈망: 로비 룸 `absentMap=84` 경고 0 · 매치 룸 `bound=84 invalid=0`.
  - 출발 중 가드: 나가기 거절 · 끊김 기록 → 정리 → 중단 시 빈 매치 삭제 · 차감 매치 목록 숨김·참가 거절 · 타이머 콜백 안 `wait()`·비동기 저장 대기(0.1초) 동작.
  - 룸 안 회귀(B6~B10): 가이드 목표 · 엘리트(25킬째 1마리) · 무료/유료 사망(EXP 선택 → 부활) · 순위 보상·계정 경험치 · 보스 난이도 배율(★1 ×0.5) · 발록 입장(★1 영혼석 5개 → 도착 때 −5 · HP 19000).
- 동시 매치 2개 이상은 사용자 1명으로는 재현 불가 — 코드상 룸 키가 매치마다 다르고 전역 차단이 없다. 실제 다인 확인은 그룹 월드에서.
