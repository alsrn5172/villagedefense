# b/rules-playerattack-owner

## 2026-09-24 — 루트 파일 담당 명시 (PlayerAttack.mlua = B · PlayerHit.mlua = A)

출처: #40 5813288345 (B 요청) → 5813477530 (A 결정 · 사용자 확정 2026-09-24). 규칙 문서만 바꾼다 — 코드 변경 없음.

| 위치 | 변경 |
|---|---|
| `Docs/협업-규칙.md` §2-2 | 표에 2행 — `MyDesk/PlayerAttack.mlua` = **B**(기본 공격) · `MyDesk/PlayerHit.mlua` = **A**(피격 · B 버프 분기는 B 가 넣고 A 가 리뷰 승인) |
| `Docs/협업-규칙.md` 변경 이력 | 2026-09-24 행 |
| `Docs/스킬-모션-구현맵.md:50` | `PlayerHit.mlua` 담당 `B` → **A**(B 버프 분기 예외 명시) |

이 PR 이 머지되면 B 가 `PlayerAttack.mlua` 에 기본 공격 버프 훅 3곳(#40 5813243717)을 연다.
