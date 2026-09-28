# b/rules-playerattack-owner

## 2026-09-24 — 루트 파일 담당 명시 (PlayerAttack.mlua = B · PlayerHit.mlua = A)

출처: #40 5813288345 (B 요청) → 5813477530 (A 결정 · 사용자 확정 2026-09-24) → A 리뷰 5304301861 수정 요청 2건 반영(나머지 루트 파일 행 · PlayerAttack 예외) + 인용문 원문("나는 플레이어의 공격에 관해서는 개발 안 함" · 사용자 2026-09-05). 규칙 문서만 바꾼다 — 코드 변경 없음.

| 위치 | 변경 |
|---|---|
| `Docs/협업-규칙.md` §2-2 | 표에 3행 — `MyDesk/PlayerAttack.mlua` = **B**(기본 공격 · 단 모션 재생 계층 `PlayerMotion.mlua` · `WeaponMotion.csv` 기존 기본 공격 행 · 피해 공식 `_StatService` `CalcPlayerDamage`/`RollCritical` · 진영 규칙 `_FactionLogic:IsEnemy` 는 A) · `MyDesk/PlayerHit.mlua` = **A**(피격 · B 버프 분기는 B 가 넣고 A 가 리뷰 승인) · 그 밖의 `MyDesk/` 루트 파일 = **A**(Monster · MonsterAttack · 몬스터 AI State*/Condition* · PlayerMotion · PortalNetwork · UIPopup · UIToast) |
| `Docs/협업-규칙.md` 변경 이력 | 2026-09-24 행 |
| `Docs/스킬-모션-구현맵.md:50` | `PlayerHit.mlua` 담당 `B` → **A**(B 버프 분기 예외 명시) |

이 PR 이 머지되면 B 가 `PlayerAttack.mlua` 에 기본 공격 버프 훅 3곳(#40 5813243717)을 연다.

루트 `.mlua` 16개 전부 한 행에 들어간다: PlayerAttack(B) · PlayerHit(A) · 나머지 14개(A) = Monster · MonsterAttack · StateChaseMonster · StateMoveMonster · StateTypeChase · StateTypeWander · ConditionHasTarget · ConditionIsAlive · ConditionIsDead · ConditionNoTarget · PlayerMotion · PortalNetwork · UIPopup · UIToast.
