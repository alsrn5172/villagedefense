# b/crew-cost — 선원 관리(SK_P12) 할인을 모집 · 훈련 비용에 연결

## 1차 (2026-10-02 · 로컬 · push 전)

출처: A #40 5884390248(선원 관리 배선은 B 가 A 의 `Lane/LaneStateService.mlua` 에 · 인터페이스 PR · A 승인) · 범위 = A 5927315886 **모집 + 훈련만**(도감 레벨업 · 해금 제외). 기반 `828d5a4`(#116 로컬 — `JobPassiveLogic.ApplyJobCost` 가 #116 에만 있다) → **#116 머지 뒤 PR**.

### 바꾼 것 (`RootDesk/MyDesk/Lane/LaneStateService.mlua` · A 파일 · 16줄)

- 새 `CrewCost(userId, sinkType, baseCount)`(ServerOnly) = `_JobPassiveLogic:ApplyJobCost(…)`(없으면 원래 값). **표시와 차감이 이 한 곳을 부른다** — 화면 숫자와 실제로 빠지는 개수가 늘 같다.
- 모집(`MONSTER_RECRUIT`): `BuildView` recruit `U` 행의 cost · `RequestRecruit` 의 재료 개수(확인 · 토스트 · `RemoveItem` · 로그 전부 `mat.count`).
- 훈련(`MONSTER_TRAIN`): `BuildView` train `TR` 행의 nextCost · `RequestTrain` 의 꿈의 조각(확인 · 토스트 · `RemoveItem` · 로그).
- 클라(`VillageLifeUIController`)는 서버가 보낸 숫자를 그대로 그린다(변경 없음). 도감 해금 · 레벨업(`RequestUnlockCollection` · `RequestLevelCollection` · `VillageRecordUIController`)은 그대로.

### 숫자 (선원 관리 Lv1 15 % … Lv5 35 % · `ApplyJobCost` = 내림 · 최소 1)

| 비용 | 원래 | Lv1 | Lv3 | Lv5 |
|---|---|---|---|---|
| 모집 재료 | 8 | 6 | 5 | 5 |
| 훈련 Lv2 · 3 · 4 · 5 꿈의 조각 | 3 · 5 · 10 · 15 | 2 · 4 · 8 · 12 | 2 · 3 · 7 · 10 | 1 · 3 · 6 · 9 |

비용을 내는 사람(요청자)의 패시브만 본다(여러 해적 중첩 없음 · `ApplyJobCost` 주석).

### 점검

- mLua 진단 `LaneStateService` 0 errors · 0 warnings · 0 info · `check-integrity` 통과(경고 3 = main) · 줄 끝 LF 그대로.

### Play 확인 (아직 안 함)

1. 해적 아닌 직업: 모집 카드 재료 8 · 훈련 3/5/10/15 — 예전과 같다 · `[JobPassive] cost` 로그 없음.
2. 해적 + 선원 관리 Lv1: 모집 카드 6 · 모집하면 6개만 빠짐(`[Recruit] … mat=MAT_…-6` · `[JobPassive] cost MONSTER_RECRUIT 8 -> 6`) · 훈련 행 "꿈의 조각 2" · 강화하면 2 빠짐(`dream-2`).
3. 선원 관리 Lv5: 모집 5 · 훈련 1/3/6/9.
4. 재료가 할인된 값 이상 · 원래 값 미만일 때 모집 · 훈련이 된다(버튼 "강화" · 토스트 "N개가 필요합니다" 의 N = 할인 값).
5. 도감 해금 · 레벨업 비용은 그대로.
