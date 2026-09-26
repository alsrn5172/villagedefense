# a/m1-4-collection (묶음 4 · 통합 브랜치 `a/m1-finish` · base `a/m1-3-stats` · PR #108)

계정 도감 + 로비 계정 창 "내 기록" (WO-031 묶음 4 · GDD §4.12 계정 기록 · 계약 A-2-25 · A-4 `AccountCollection`).

## 바뀐 것

| 무엇 | 어떻게 | 파일 |
|---|---|---|
| 저장 도메인 | 신규 `AccountRecordData` — 도감(`AccountCollection`) · 업적(`AccountAchievement`) · 플레이 기록(`MatchHistory`) 세 키를 `PlayerDBManager` 5메서드 계약으로(AccountData 와 같은 꼴) · **키마다** 더티·세대 → 바뀐 키만 저장 · 저장 바이트 로그 `[AcctRec] save` · 로드 전 쓰기 거절 · JSON 숫자는 정수로 되돌림 | `Progression/AccountRecordData.mlua`(신규) · `Progression/PlayerDBManager.mlua`(도메인 한 줄씩 · 로드 3단계 · 저장 · 저장 확정(동기·비동기) · 이탈 정리) · `Progression/AccountStorageLogic.mlua`(키 2 · 로그) |
| 도감 규칙 | 신규 `CollectionService` — 칸 = `MapMonsters` 켜진 행의 종 + `BossInfo` 켜진 보스 · 자이언트는 그 종 칸에 합산 · 단계(`CollectionReward`)에 닿으면 **계정 경험치 자동 지급 + 받은 단계 기록**(`tm`/`te`/`tb` · 두 번 안 줌 · 여러 단계 한 번에) · 토스트 "도감 · 달팽이 발견 — 계정 경험치 +5" · 로그 `[Coll]` | `Progression/CollectionService.mlua`(신규) |
| 새 표 | **`CollectionReward.csv`**(+ `.userdataset`) 6행 = WO-031 §4 초안(일반 발견 5 · 100처치 10 · 500처치 15 · 자이언트 10 · 보스 발견 15 · 5회 15) | `CollectionReward.csv` |
| 처치 인정 | 일반·자이언트 = 막타(`MatchTallyService.OnMonsterKill` 에서 넘김) · 보스 = 속성 `BossCreditAllHitters`(기본 true = 피해를 준 참가자 전원 · **WO-031 §9-1 사용자 확인 전 AI 제안값** · false = 최다 피해 1명) · 발록 = 선취 승자(`BalrogRoomService.DeclareWinner` → `MatchTallyService.OnBalrogKill` · 보스 처치 판정 +1 포함) | `Match/MatchTallyService.mlua` · `Boss/BalrogRoomService.mlua` |
| 로비 계정 창 | 새 UI 그룹 **`AccountRecordGroup`**(GroupOrder 11 — 로비 창 6 위에서 열려야 해서 §6-4 의 5 대신 · 탭 도감/업적/칭호/기록 · 도감 = 6열 그리드 + 상태 줄 · 업적/칭호/기록 = 자리만) · 글자 Default(Noto Sans KR) · 디자이너 3색 · 둥근사각 스킨 | UI `AccountRecordGroup`(신규) · `Progression/AccountRecordUIController.mlua`(신규 · 클라) · `Progression/AccountRecordService.mlua`(신규 · 서버 창구 `RequestView(tab)` → `SetView(tab, csv)` · 로드 전 `LOADING` → 1초 뒤 재요청) |
| 로비 버튼 | `LobbyGroup` 창 왼쪽 위에 **"내 기록"** 버튼 **추가만**(닫기 버튼과 같은 제목 줄 위 배치 · 기존 노드 좌표 그대로) · 클릭 배선은 계정 창 컨트롤러가 직접(`LobbyUIController` 무수정) | UI `LobbyGroup` |

## 검증

- LSP 전부 clean(`_AccountRecordUIController` Symbol not found info = 새 Logic · Maker refresh 뒤 사라짐). `check-integrity` 통과(`CollectionReward` C1·C3·C4). ui_lint 경고 = 탭 버튼 88px 미만 · 제목 줄 위 버튼 겹침(닫기 버튼과 같은 꼴).
- 🟡 **Maker 검증 대기**: Reimport All(새 Logic 5개 `.codeblock` 생성 → 커밋) → Play → `[AcctRec] loaded` · 사냥 `[Coll] tier MONSTER 발견` + `[Account] exp +5 (COLLECTION)` · 저장 `[AcctRec] save AccountCollection bytes=` · 로비 창 "내 기록" → `[AcctUI] view collection rows=` · 룸 이동·재접속 뒤 값 유지 · 같은 단계 재지급 없음.
- 👁 눈 확인(사용자): 계정 창 배치 · "내 기록" 버튼 위치.
