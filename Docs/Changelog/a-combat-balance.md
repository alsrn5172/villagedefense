# a/combat-balance — WO-014 추가기획2 전투 밸런스 1차

> 지시서: `메월드폴더/WorkOrders/WO-014-추가기획2-전투밸런스.md`. base `main a1ab351`(PR #34 머지 후). PR #35 (Draft).
> 🔴 **Maker 없이 선 구현.** 신규 스크립트 `Farm/DropOwner.mlua` 와 신규 표 `MatchConfig` 는 검증 세션의 `Reimport All` 에서 짝 파일이 생긴다.

## 2026-09-08 — S0 문서 · 계약 (코드 0)

### 신규 문서 `Docs/추가기획2/`
- `기획-원문.md` — 사용자 원문 보관 + 질의응답에서 원문을 정정한 3건(재화 주인 · 전직 레벨 · 페이즈 5단) 대조표.
- `구현항목-결정.md` — 확정 14건 · 페이즈 5단 시간표 · 드랍 소유권 규칙 · 이번 범위 밖 4묶음(선행조건 포함).
- `미정-값.md` — 🔴 **사용자가 채울 빈 표.** 리스항구 리젠 초 · 리스항구 몹 Exp · `LevelTable` 1~10/11~30 · 물약 `CooldownEndLevel` · 쿨 HUD · 미니언 배율 · 보스/엘리트/미니언 드랍 소유 확장. **값이 비어 있는 동안 그 파일은 건드리지 않는다.**

### `Docs/스키마-계약.md` (⚠️ 공지 후 단독 작업)
- `§0-2 MatchPhase` 를 **5값으로 교체** — `PHASE0-1` `PHASE0-2` `PHASE1` `PHASE2` `PHASE3`. 구 4값(`PHASE1_PIONEER` `PHASE2_VILLAGE` `PHASE25_PRESSURE` `PHASE3_FINALE`) 폐기.
  - **하이픈 예외 1건**을 §0-2 각주에 명시 (SNAKE_CASE 원칙의 유일한 예외 · 다른 열거형에 퍼뜨리지 않는다).
- `§A-2-5 MinionPhaseConfig` — 4행 고정 → **5행**. 헤더는 그대로. LIVE/TEST 실값표 + "TEST = LIVE ÷ 8" + **페이즈 판정은 인덱스가 아니라 이름으로** 규칙 추가.
- **`§A-2-5a MatchConfig` 신규 표** — `Key,Profile,MatchDurationSeconds,Enabled,#Note` (기본 키 `Key`+`Profile` · 2행). 매치 만료가 페이즈 곡선에서 분리됐다.
- `§A-2-8c ConsumeInfo` — 열 3개 **뒤에 추가** `CooldownStartSeconds,CooldownEndSeconds,CooldownEndLevel` + 선형 보간식.
- `§1 등록된 시스템` 에 행 1개 + **등록서 8항목** (8번 = 건드리는 기존 파일 13개 · 전부 A 소유 · B 경계면 없음 → §3-3 self-merge 대상).
- 변경 이력 행.

### `Docs/VillageDefense-M1-GDD.md`
- `§5.1 공개 타입` 의 `MatchPhase` 블록을 5단으로 교체 (각 페이즈의 시각·목표 레벨·만료 출처 주석 포함).
- 변경 이력 행 — 페이즈 5단 · 재화/경험치 주인 = 누적 피해 최다 · 물약 쿨타임.

### 확인
- 페이즈 문자열 전체 검색 — `Skill/` `Job/` 에 사용처 **0건**(B 경계면 없음). 남은 곳은 `Docs/Changelog/**` · `Docs/추가기획1/**` · `Docs/CHANGELOG.md`(과거 기록 · 안 건드림)와 S1 에서 고칠 4파일뿐.
