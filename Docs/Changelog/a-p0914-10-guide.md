# a/p0914-10-guide (B10 · 통합 브랜치 `a/plan-0914` · B9 위 stacked · PR #79)

★1 안내 네비게이션 (WO-029 B10 · WO-028 · 계약 A-2-22).

| 항목 | 내용 | 파일 |
|---|---|---|
| `GuideStep` 신설 | 45행 = 목표 G1~G14(+G7B 3P 웨이브 문구) · 토스트 T1~T18(Once) · 체크 C1~C13 · `{n}/{max}` 진행률 · MarkerMap 자리표시자 | `GuideStep.csv` · `.userdataset` |
| 서버 | `GuideService`(신규): ★1 매치 + 토글 on 인 참가자를 1초마다 평가 → 목표 바 문구·마커(바뀔 때만 RPC) · 첫 획득/시점 토스트 · 체크리스트 · 훅 7곳 · `RequestToggle`(계정 저장) · `[Guide] goal A -> B` / `toast` / `check` 로그 | `Guide/GuideService.mlua` · `Stat/StatService.mlua`(`JobOf`) · 훅: `Monster/EliteSpawner` · `Lane/LaneStateService` · `Boss/BossRewardService` · `Boss/BalrogRoomService` · `Item/EnhanceService` · `Match/MatchSessionLogic` |
| UI | 새 그룹 `GuideGroup`: 상단 목표 바(클릭 → 체크리스트 펼침) + "안내 끄기" + 꺼두면 "안내 켜기" 칩 · 컨트롤러 `GuideUIController` | `ui/GuideGroup` · `Guide/GuideUIController.mlua` |
| 월드맵 | `GoalMarker_0~5`(HereMarker 복제 · 노란 깃발 · "목표") · `ShowGoalMarkers(csv)`/`ClearGoalMarkers` · 열 때 재적용 | `ui/WorldMapGroup` · `WorldMap/WorldMapController.mlua` |

미구현·대체: T16(HP 조회 API 없음) · T17/T18 은 기존(B9 팝업 · 침범 알림) · 스탯창 토글 자리는 Footer 가 꽉 차 목표 바로 대체.

## 검증

- LSP 진단 0 · `ui_lint` clean · `node Docs/tools/check-integrity.cjs` 통과.
- 런타임(Maker): PR 본문.
