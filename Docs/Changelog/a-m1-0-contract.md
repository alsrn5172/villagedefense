# a/m1-0-contract (묶음 0 · 통합 브랜치 `a/m1-finish` · Draft PR #103 아래 stacked · PR #104)

M1 마무리(기록 · 파병 · 통합 정리 · 허브 WO-031)의 **등록 PR**(계약서 §1 · 코드 0). #40 comment 5844015147 공지 뒤 A 단독.

## 바뀐 것

- `Docs/스키마-계약.md`
  - §1 등록서 "기록 · 칭호" 8항목(8번 전부 A 소유 · B 협의 없음) + 등록된 시스템 표 1행
  - 새 표 4: A-2-23 `AchievementConfig`(A-3 예약 해소) · A-2-24 `TitleInfo` · A-2-25 `CollectionReward` · A-2-26 `GrowthPoint` — 파일은 쓰는 묶음(2 · 4 · 5)에서 생성
  - §0-2 열거값 `AchievementCondType` `CollectionKind` `GrowthActionType` `MatchOutcome` 신설 · `SourceType += COLLECTION`
  - §0-5 `AccountProfile.SchemaVersion` 4 예고(`account_titles` · `account_title`)
  - A-4 `PublicPlayerSummary += TitleName` · 계정 저장 레코드 3종(`AccountCollection` · `AccountAchievement` · `MatchHistory`) 모양
  - B-3 `Progression/` 이벤트 4종 = 예약 유지(직접 호출) · A-2-21 "도감·칭호 실물은 M2" → M1
  - 변경 이력 1행
- `Docs/tools/check-integrity.cjs` — CANONICAL/PK 에 새 표 4(파일 없으면 warn 만)
- `Docs/VillageDefense-M1-GDD.md`
  - 헤더: 최종 수정일 · 문서 상태 · 추가기획3 링크 + 정본 순서(추가기획3 > 2 > 1 > GDD)
  - §4.10 패키지 문구 정정(업적 = 직접 구현 · 도감 = 별도 저장 키) · §4.12 계정 기록 = 로비 계정 창 + 칭호
  - §7 재판정(9/14 B0~B11 · #43 반영) + Phase 4 항목 3개 추가 · 남은 항목에 WO-031 묶음 번호 · §9 위험 2행 해소 · §10 변경 이력 5행
- `Docs/VillageDefense-Roadmap.md` — M1 상태 · 기록 기능 행(도감 · 업적 · **칭호 신규** · 통계) · 남은 덩어리

## 검증

- `node Docs/tools/check-integrity.cjs` → 통과. 새 표 4 는 "csv 가 없다" warn(의도 · 각 묶음에서 생성).
- 코드·CSV·UI 변경 없음 → Maker 검증 없음.
