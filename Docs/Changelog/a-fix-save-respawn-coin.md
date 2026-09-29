# a/fix-save-respawn-coin — 계정 저장 실패 · 부활 이동 · MISS 무반응 · 외형 맨몸 (PR #122 · WO-035)

base `main` 776ab4f · 2026-09-29 검증(#119 포함)에서 나온 현상.

## 바뀐 것

| # | 증상 | 원인 | 고침 | 파일 |
|---|---|---|---|---|
| A | 새 계정의 계정 저장이 통째로 실패(자동 저장 300초마다 `LEA-3001 LuaTableToJsonType.UnknownType` · 이탈 저장 · 룸 이동 직전 저장도 같은 경로) | `_HttpService:JSONEncode` 가 **빈 자식 표**를 못 바꾼다(실측: `{ v = 1, r = {} }` 예외 · `{ v = 1 }` 성공 · `{}` 단독은 빈 문자열). 기록 기본 모양이 `boss = {}` · `d = {}` · `r = {}` 라 보스를 안 잡은·업적이 없는 계정은 더티가 되는 순간부터 `SaveToDB` 가 예외 → `SaveForUser` 가 BatchSet 전에 멈춰 프로필까지 안 나갔다 | 빈 칸을 뺀 사본(`StripEmpty`)을 인코딩 · 인코딩 실패는 그 키만 건너뜀(더티 유지) · `SaveForUser` 는 도메인별 `pcall`(프로필 실패 = 저장 실패로 반환 · 기록만 실패 = 나머지는 저장) | `Progression/AccountRecordData.mlua` · `Progression/PlayerDBManager.mlua` |
| B | 부활 이동이 안 되고 죽은 자리에서 부활(맵 하나만 연 테스트 · 정적 룸) | 목적지 맵이 이 룸에 없으면 엔진 이동이 조용히 실패 · 이동 결과를 확인하는 코드가 없었다 | `MoveToRespawn`: 옮긴 0.5초 뒤 맵·좌표 되읽기 → 아니면 1회 재시도 · 그래도 아니면 에러 로그. 목적지 맵이 이 룸에 없으면 지금 맵의 스폰 지점으로. 내 마을 포탈을 못 찾으면 리스항구 경로로 | `Match/PlayerRespawnService.mlua` |
| C | MISS 여도 몬스터가 0.2 밀림 | 피해 0 도 "살아서 맞음" 분기 → `ReactToHit` | 피해 0 은 **아무 반응 없음**(사용자 결정 2026-09-29) — HP · 피격음 · 넉백 · 경직 · 돌아보기 · `lastHitAt` 그대로 | `Monster.mlua` |

계약서 변경 없음(A-4 기록 모양 그대로 — 빈 칸 생략은 직렬화 세부 · 읽기는 이미 "없는 칸 = 빈 표"). B 파일 수정 0.

## 이 브랜치에서 뺀 것 (먼저 잠긴 파일)

| 하려던 것 | 파일 | 잠근 PR |
|---|---|---|
| C — 미니언·수비대 MISS 무반응 | `Faction/MonsterHit.mlua` | #120 (WO-034 ①) |
| D — 메소 동전 원작식 포물선(죽은 층 착지 · 사용자 결정 2026-09-29) | `Farm/MesoCoin.mlua` | #121 (WO-034 ②) |

## 검증

- LSP 4파일 깨끗 · `check-integrity` 통과.
- 🟡 Maker Play(개인 월드에 이 워크트리 · Reimport All) 예정: A 기록 없는 계정 → 몬스터 1마리 → `FlushAll` → `[AcctRec] save AccountCollection bytes=…` · LEA-3001 0건 → 재Play `loaded mon≥1` · B 부활 뒤 `[Death] respawn check ok` · C `[Stat] MISS` 뒤 몬스터 x 불변 · E 외형 17칸 로그 대조.
