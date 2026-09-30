# a/m1-2-counters (묶음 2 · 통합 브랜치 `a/m1-finish` · base `a/m1-1-dispatch` · PR #106)

매치 집계 + 결과 순위 ④⑤ (WO-031 묶음 2 · GDD §4.12 집계 정의 · §7 Phase 4 · 계약 A-2-26).

## 바뀐 것

| 무엇 | 어떻게 | 파일 |
|---|---|---|
| 매치 집계 원장 | 신규 `@Logic MatchTallyService` — 유저별 `MonsterKillCount` · `BossKillCount` · `VillageGrowth` + 받은 성장 액션 키. 서버 메모리(룸마다 · 저장 안 함) · `StartMatch` 가 `ResetForMatch` · 로그 `[Tally]`(처치는 1·10·50·100 마다만) | `Match/MatchTallyService.mlua`(신규) · `Match/MatchSessionLogic.mlua` |
| 처치 수 | `FarmReward.GiveRewards` 막타 플레이어 보상 직후 `OnMonsterKill`(MonsterId > 0 · 자이언트 포함 · 미니언 0 제외) — 도감·업적(묶음 4·5)도 이 한 줄에서 이어진다 | `Farm/FarmReward.mlua` |
| 보스 처치 | `BossRewardService.OnBossKilled` 최다 피해 판정 뒤 `OnBossKill(bossId, top, dmg)`(dmg 는 도감 인정용) | `Boss/BossRewardService.mlua` |
| 성장도 | 새 표 **`GrowthPoint.csv`**(+ `.userdataset` · 4행 · WO-031 §6 초안: 시설 새 레벨 3 · 훈련 단계 2 · 레시피 첫 완성 2 · 종 첫 모집 1) · 키 = 유형:대상:단계 · 매치당 1번. 훅: 시설 강화(`RequestTowerAction` upgrade) · 훈련(`RequestTrain` · `RequestLevelCollection` — 같은 키) · 모집(`RequestRecruit`) · 제작(`CraftService.RequestCraft`) | `GrowthPoint.csv` · `Lane/LaneStateService.mlua` · `Item/CraftService.mlua` |
| 순위 ④⑤ | 정렬 = 탈락 뒤로 → ①발록 피해 ②넥서스 HP ③레벨 ④**처치 수** ⑤**이름순**(+ userId — 같은 값끼리 순서가 판마다 안 흔들리게) · 탈락 스냅샷에도 처치 수 | `Match/MatchSessionLogic.mlua` |
| 결과 화면 | CSV 행 7번째 칸 = 처치 수(앞 6칸 뜻 그대로) · 컨트롤러가 `Kills` 칸에 표시 · `MatchResultGroup` 에 **처치 열** 추가 — 발록 피해/넥서스 HP/레벨 열 폭을 줄여 자리 마련(AI 가 만든 S1 뼈대 · 사용자 Maker 저장 이력 없음 · 순위·이름·탈락 칸은 그대로) | `Match/MatchResultUIController.mlua` · UI `MatchResultGroup` |

## 검증

- LSP 7파일 clean · `check-integrity` 통과(`GrowthPoint` C1 헤더 · C3 키 · C4 쌍).
- 🟡 **Maker 검증 대기**: 개인 월드 Reimport All → Play(TEST) → `[Tally] GrowthPoint loaded: 4 rows` · 사냥 → `[Tally] kill <uid> n=1/10` · 보스 → `[Tally] boss` · 시설 강화 → `[Tally] growth … FACILITY_LEVEL:TOWER:2` · 만료 → 결과 화면 처치 열 · 처치 수만 다른 두 행에서 순위 ④ (2인 · 다인 세션 또는 execute_script 로 kills 대입)

## Codex 교차 리뷰 반영 (2026-09-26 · 묶음 1+2 · 2회 일치)

- 🔴 처치 수를 보상 지급 조건(막타 유저 엔티티·`SummonManager` 유효) 밖에서 세서 보상을 못 받은 막타도 셌다 → `GrantKillReward` 블록 안으로(GDD 정의 "보상을 받은 횟수").
- 기각 2건: 결과 CSV 이름 구분자 — `SafeName` 이 이미 `[;=|]` 를 지운다 · 보스가 일반 처치로 세짐 — 보스 모델 8개에 `FarmReward` 가 없다(확인).
