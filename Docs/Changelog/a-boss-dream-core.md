# a/boss-dream-core (Draft PR #130 · base main 94c1e58)

사용자 지시(2026-10-01): "꿈의 조각 보스도 20개 줌 · 에너지 코어는 마을 보스 잡으면 1개씩 줌" → "5마을 지역 보스만 · 보상은 당연히 한 사람만 받는 거지 · 난이도와 동일(무관)".

지금까지: 꿈의 조각은 엘리트만 줬고(`EliteSpawner`), 에너지 코어는 주는 곳이 없었다(쓰는 곳 = 디멘션 게이트 `LaneStateService`).

| 파일 | 무엇 |
|---|---|
| `BossReward.csv` | **헤더 맨 뒤 `TopDamageItems` 추가**(사용자 직접 지시 · #40 공지 생략) · 5마을 지역 보스(머쉬맘 `6130101` · 킹슬라임 `9300003` · 스텀피 `3220000` · 에피네아 `5250007` · 피아누스 `8510000`) = `DREAM_PIECE:20;ENERGY_CORE:1` · 마노 · 좀비머쉬맘(꺼짐)은 비움 |
| `Catalog/BossCatalog.mlua` | `ParseItemList`("ItemId:개수;…" → 목록) · 보상 행 `topDamageItems` |
| `Boss/BossRewardService.mlua` | 최다 피해자 한 명에게 `TopDamageItems` 지급(영혼석과 같은 `GiveOrDrop` — 같은 맵이면 바닥 드랍) · 토스트에 "꿈의 조각 20개 · 에너지 코어 1개" · 로그 `items=` |
| `Docs/스키마-계약.md` · `Docs/tools/check-integrity.cjs` | BossReward 헤더(영혼석 열 3개도 계약서 블록에 반영) + 새 열 설명 · 검사기 표준 헤더 |

## 검증 (개인 월드 Play)

| 항목 | 결과 |
|---|---|
| 빌드 | Error 0 · 새 코드 경고 0(처음 괄호로 한 값만 받아 LWA-1111 2건 → 두 변수로 받게 고쳐 0) · 남은 1건 = `SummonManager.ParseStatCsv`(기존 · 같은 원인 `string.find` 한 값만 받음) |
| 표 읽기 | `GetReward("6130101").topDamageItems = DREAM_PIECE:20;ENERGY_CORE:1` · 마노 0개 |
| 머쉬맘 ★1 처치(보스맵 안) | `[BossReward] … soulstone=20/20 … items=DREAM_PIECEx20,ENERGY_COREx1 … first=true ground=4` → 네 가지 바닥 드랍 · 주운 뒤 가방 꿈의 조각 0→20 · 에너지 코어 0→1 · 영혼석 0→20 · 봉인석 0→1 |
