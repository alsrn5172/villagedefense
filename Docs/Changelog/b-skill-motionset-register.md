# b/skill-motionset-register

## 2026-09-24 — [등록] 스킬 모션 세트 `SkillMotionSet` (문서만)

계약서 §1 등록 절차 1단계 — **코드 없이 문서만.** 머지된 뒤 구현한다. 사용자 결정 2026-09-24 (skill-maker 원장 DATA-02 · 모션 표 승인).

| 위치 | 변경 |
|---|---|
| `Docs/스키마-계약.md` §0-2 | 열거값 `MotionMode` (`FIXED` · `RANDOM` · `SEQUENCE`) |
| §1 등록된 시스템 | "스킬 모션 세트" 행 |
| §1 등록서 | 8항목 — 8번에 남의 폴더 파일 수정 없음 → §3-3 self-merge 대상 |
| A-2-23 | `SkillMotionSet` 헤더 `SkillId,WeaponType,Seq,Mode,CoreAction,PartsAction,PlayRate,HitTime,LockTime,Enabled,#Note` |
| 변경 이력 | 2026-09-24 행 |

`check-integrity.cjs` CANONICAL · PK 는 구현 PR 에서 CSV 파일과 같이 넣는다(지금 넣으면 "파일 없음" 경고만 는다).
