# b/skill-ult-soulstone-cost

## 2026-09-24 — 궁극기 시전 비용 = 낙인의 영혼석 (★ 입장권 기준)

PR #86. 기획 답변 1번(2026-09-24 · `vd-audit/Docs/skill-spec.md` "Planner answers 2026-09-24"): 궁극기 재화 = 낙인의 영혼석 · 개수는 발록 입장권을 난이도별로 따라간다.

**헤더 변경 없음 · 새 CSV 열 없음 · 새 이벤트 없음 · 새 RPC 없음.** `Docs/스키마-계약.md` 는 건드리지 않았다. A 의 `Item/InventoryService` · `Match/DifficultyService` 는 **호출만** 한다(§1 등록 대상 판정 `스키마-계약.md:151` 에 해당 없음).

### 규칙

| 궁 | 개수 | ★1 · ★3 · ★5 |
|---|---|---|
| 일반 궁 (`ORIGIN` · SK_W31 · SK_A31 · SK_T31 · SK_P31) | `ceil(입장권 / 2)` | 3 · 15 · 100 |
| 대마법 SK_M31 (`UltimateFullTicketSkills`) | 입장권과 같은 수 | 5 · 30 · 200 |

입장권 = `DifficultyService:GetNumFor(★, "BALROG_TICKET")` (`DifficultyRule.csv:13` · `:34` · `:55` = 5 · 30 · 200) · ★ = `DifficultyService:Current()`.

### 수정 — `Skill/SkillCaster.mlua`

| 위치 | 변경 |
|---|---|
| 속성 (`:27` · `:29`) | `UltimateCostItemId = "BRAND_SOULSTONE"` · `UltimateFullTicketSkills = { SK_M31 = true }` |
| `RequestCast` 게이트 5-2 (`:409-417`) | PreCheck(5-1) 뒤 · MP(6) 앞에서 **개수만** 센다(`CountItem`). 부족하면 `not enough BRAND_SOULSTONE (need N, have M)` 로 거절 — MP · 쿨다운 · 사용 횟수 모두 안 쓴다 |
| 실행기 뒤 (`:507-514`) | `_SkillExecutors:Execute` 가 돈 **뒤에만** `RemoveItem` + `PushInventory`. 로그 `[Skill] ultimate … cost BRAND_SOULSTONE xN consumed` |
| `UltimateStoneCost` (`:533`) | 신규. ORIGIN 아님 → 0 · 매치 밖(`Current()` = 0) → 0(로그) · 입장권 행 없음(★2/★4) → 0(경고) · 대마법이면 입장권, 아니면 `ceil(입장권/2)` |

- 메소 익스플로전(SK_T31) 동전 0 개 거절은 5-1 `PreCheck` 에서 먼저 나므로 영혼석도 안 쓴다.
- 5-2 에서 센 뒤 차감까지 대기(`wait`·타이머)가 없어 개수가 바뀌지 않는다.

### 그대로 둔 것 (기다리는 중)

- 사용 제한은 **판당 1번** 그대로(`SkillInfo.csv` `UseLimit` · A 의 도전 시작 신호 대기 · #40 5812496852)
- 발록 방 밖 시전 막기 없음(기획 답변 대기 · #40 5812356350)
- ★2/★4 는 규칙 행이 없어 비용 0 + 경고 — 지금은 그 난이도로 매치를 못 만든다(`DifficultyService.IsEnabled`)
- 스킬 창 툴팁 문구("판당 1회") · 클라 예측 게이트 — 영혼석 개수는 서버만 알고, 부족하면 서버 거절 사유로 돌아온다

### Play 검증

(Maker 재입장 · Reimport All 뒤 추가)
