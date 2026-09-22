# a/p0914-0-contract (B0 · 통합 브랜치 `a/plan-0914` · Draft PR #67 아래 stacked)

9/14 기획 반영의 **등록 PR**(계약서 §1 · 코드 0). #40 comment 5776547020 공지 뒤 A 단독.

## 바뀐 것

- `Docs/스키마-계약.md`
  - §1 등록서 "9/14 기획 반영" 8항목(8번 전부 A 소유 · B 협의 없음)
  - 새 표 6: A-2-6a `MinionWave` · A-2-7a `DifficultyRule` · A-2-19 `DropTable` · A-2-20 `MonsterRecruit`(A-3 예약 해소) · A-2-21 `RankReward` · A-2-22 `GuideStep`
  - §0-2 열거값 `DropSourceKind` `DifficultyRuleKey` `GuideStepKind` `RecruitTier` 신설 · `SourceType += MATCH_RANK, ACCOUNT_LEVELUP` · `SinkType += BOSS_ENTRY, DEATH_PENALTY, GEM_EXCHANGE` · `TOWER_SPLASH` 확정
  - §0-5 `AccountProfile.SchemaVersion` 3 예고(`account_level` `account_exp` `account_guideOff`)
  - A-2-7 `DifficultyConfig` 헤더를 실제 파일로 정정(12열 헤더는 만들어진 적 없음) · ★1/3/5 만 · 배율은 `DifficultyRule`·적용점 `Match/DifficultyService`
  - 값·열 **예고**(각 구현 PR 에서 헤더+CANONICAL 동시 변경 · §0-1 9): A-1-1 `MonsterInfo += Attack` · A-2-5 페이즈 시각 270/990/1470 · A-2-6 `MinionComposition` 미사용 · A-2-8b 강화비 · A-2-8c `ConsumeInfo += HealHpPct,HealMpPct` + 물약 5단계 · A-2-8d 훈련 배율 기준 · A-2-11 `BossReward += SoulstoneStar1/3/5` · A-2-13 발록 HP 기준선 · A-2-15 엘리트 확정(맵별 25킬 · 열 추가) · A-2-17 S2 값 + 억제기 폭발
  - 변경 이력 1행
- `Docs/tools/check-integrity.cjs` — CANONICAL/PK 에 `DifficultyConfig`(실제 헤더) + 새 표 6 추가(파일 없으면 warn 만) · C6 엘리트 로더 후보에 `Monster/EliteSpawner.mlua`
- `Docs/추가기획3/구현항목-결정.md` 신규 — 결정 요약(정본은 허브 WO-027/028/029)

## 검증

- `node Docs/tools/check-integrity.cjs` → 통과. 새 표 6 은 "csv 가 없다" warn(의도 · 각 묶음에서 생성).
- 코드·CSV·UI 변경 없음 → Maker 검증 없음.
