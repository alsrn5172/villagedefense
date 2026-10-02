# b/skill-focus-drop — 포커스(SK_A12) 특수 재화 드랍 배율

## 2026-10-01

🔴 **A 파일** `Boss/BossRewardService.mlua` · `Monster/EliteSpawner.mlua` 를 고친다 — #40 5884388754 "B 가 넣는다 · A 가 리뷰로 승인" · (a) 대상 3종 · (b) 개수 × 배율(소수부는 확률로 1개 더).

| 지급 | 받는 사람 | SourceType | 예전 | 지금 |
|---|---|---|---|---|
| 보스 낙인의 영혼석(`BossRewardService.OnBossKilled`) | 최다 피해자 | `BOSS_KILL` | ★ 열 / `BOSS_SOULSTONE` 개수 그대로 | × 배율 |
| 엘리트 꿈의 조각(`EliteSpawner.GrantEliteDrops`) | 막타 | `ELITE_KILL` | `DreamDrop` 그대로 | × 배율 |
| 엘리트 낙인의 영혼석(같은 곳) | 막타 | `ELITE_KILL` | `SoulstoneDrop` 그대로 | × 배율 |

- 배율 = `_JobPassiveLogic:GetJobDropMul`(1 + 포커스 %/100). 포커스 = CSV BaseEffect 10 + 5/lv → **Lv1 ×1.1 · Lv5 ×1.3**. 안 배웠으면 ×1 = 예전 그대로(로그도 없음).
- 계산은 B 의 새 메서드 `JobPassiveLogic.ScaleDropCount(userId, sourceType, count)`(ServerOnly) 한 곳: `floor(count × 배율)` + 소수부 확률로 +1. 예) 영혼석 3 × 1.1 = 3.3 → 3개(70%) 또는 4개(30%). A 파일은 한 줄씩(보스) · 네 줄(엘리트)만 부른다.
- 로그(배율 > 1 일 때만): `[JobPassive] focus drop BOSS_KILL 3 x1.1 = 3.30 -> 4 (roll 0.12) (<uid>)`. 엘리트 기존 로그 `[Elite] drops … dream= soulstone=` 는 배율 적용 뒤 값.
- **대상 밖(그대로):** 보스 최다 피해 추가 아이템 `TopDamageItems`(5마을 지역 보스 꿈의 조각 20 · 2026-10-01 · A 답 뒤에 생김) · 보스 `TopDamageItemId` · 선취 · 메소 · 엘리트 빅토리아 주화. 5마을 보스 꿈의 조각도 포커스를 탈지는 A 에게 물을 것.
- LSP 3개(`JobPassiveLogic` · `BossRewardService` · `EliteSpawner`) 깨끗 · `check-integrity` 통과.

### Play 확인
1. 궁수 · 포커스 0: 엘리트 처치 → `[Elite] drops … dream=<DreamDrop> soulstone=<SoulstoneDrop>` 그대로 · `focus drop` 줄 없음.
2. 포커스 Lv1: 엘리트 처치 → `[JobPassive] focus drop ELITE_KILL …` 두 줄(꿈의 조각 · 영혼석) · 바닥 드랍 개수 = 로그의 `->` 값.
3. 포커스 Lv5 · 보스 최다 피해 → `focus drop BOSS_KILL N x1.3 …` · 토스트 "낙인의 영혼석 N개" 가 배율 뒤 값.
4. 다른 직업(포커스 없음)이 보스 최다 피해 → 배율 없음.
5. 빌드 경고 N → N.

## 2026-10-03 — 보스 최다 피해 추가 아이템(`TopDamageItems`)도 포커스 배율 (A #40 5927314999 1번)

- 근거: #40 5927314999 1번 "5마을 지역 보스 최다 피해 추가 보상(`TopDamageItems` 꿈의 조각 20)도 포커스 배율을 받는다 — 드랍 개수 배율이니까. 지급 줄도 같은 `ScaleDropCount` 로 곱하고".
- `Boss/BossRewardService.mlua`(A 파일) `TopDamageItems` 지급 반복문: 아이템마다 `count = ScaleDropCount(top, "BOSS_KILL", count)` → 지급 · `[BossReward] … items=` 로그 · 토스트 글자 모두 배율 뒤 값.
- 반복문 하나라 그 행의 **모든** 추가 아이템이 같이 곱해진다(머쉬맘 6130101 = 꿈의 조각 20 · 에너지 코어 1 → Lv5 ×1.3 = 26 · 에너지 코어 1.3 → 1개(70%) 또는 2개(30%)). 에너지 코어를 빼야 하면 A 리뷰에서 알려 달라(한 줄).
- **대상 밖(그대로) — 갱신:** 보스 `TopDamageItemId`(1개 고정 아이템) · 선취 · 메소 · 엘리트 빅토리아 주화.
- Play 확인 추가: 포커스 Lv5 · 머쉬맘 최다 피해 → `focus drop BOSS_KILL 20 x1.3 = 26.00 -> 26` 이 **두 번**(영혼석 · 꿈의 조각) + `BOSS_KILL 1 x1.3 = 1.30 -> 1|2`(에너지 코어) · 토스트 "낙인의 영혼석 26개 · 꿈의 조각 26개 · 에너지 코어 N개".
