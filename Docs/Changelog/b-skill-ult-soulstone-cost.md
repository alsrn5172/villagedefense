# b/skill-ult-soulstone-cost

## 2026-09-24 — 궁극기 공통 규칙: 낙인의 영혼석 5개 · 쿨타임 2분 · 어디서나

PR #86. **출처: #40 5813232188 (A 결정 · 사용자 확정 2026-09-24).** 기획 답변 1번(★ 입장권 기준 개수 · 도전 1번마다 1번)을 **대체한다** — 같은 날 먼저 넣은 "★ 입장권 기준(일반 궁 3/15/100 · 대마법 5/30/200)" 구현은 이 커밋에서 걷어냈다.

**헤더 변경 없음 · 새 CSV 열 없음 · 새 이벤트 없음 · 새 RPC 없음.** A 파일 수정 없음 — `Item/InventoryService` · `UIToast` 는 **호출만** 한다. A 요청(#40 5813235746)대로 `Docs/스키마-계약.md` 스킬 등록서 8번에 호출 API 를 적고 변경 이력 1행을 넣었다.

### 규칙 (궁 5종 공통 · Behavior `ORIGIN`)

| 항목 | 값 |
|---|---|
| 비용 | 시전마다 **낙인의 영혼석(`BRAND_SOULSTONE`) 5개** — ★1/★3/★5 무관 · 대마법(SK_M31)도 5개 |
| 사용 제한 | **쿨타임 120초** 하나. 판당 횟수 제한 없음(`UseLimit` 1 → 0) |
| 장소 | 어디서나 — 발록 방 밖(마을 방어 중) · 매치 밖도 같은 규칙 |
| 부족 | 시전 거절 + 토스트 "낙인의 영혼석이 부족합니다 (필요 5개 · 보유 N개)" · 아무것도 소모하지 않는다 |
| 차감 시점 | 실행기(`_SkillExecutors:Execute`)가 돈 **뒤에만** `RemoveItem` + `PushInventory` |
| 툴팁 | 소모 줄에 "낙인의 영혼석 5개 소모" · "쿨타임 120초" |

### 수정 위치

| 위치 | 변경 |
|---|---|
| `Skill/SkillCaster.mlua:22-31` | 속성 `UltimateCostItemId = "BRAND_SOULSTONE"` · `UltimateCostItemName = "낙인의 영혼석"` · `UltimateStoneCount = 5` (`UltimateFullTicketSkills` 삭제) |
| `:408-418` 게이트 5-2 | PreCheck(5-1) 뒤 · MP(6) 앞에서 개수만 센다. 부족하면 `RejectToast` + `CastResult(false, "not enough BRAND_SOULSTONE (need 5, have N)")` |
| `:507-515` | 실행기 뒤 차감(변경 없음) |
| `:534` `UltimateStoneCost` | ★ 입장권 계산 삭제 → ORIGIN 이면 `UltimateStoneCount`. 로그 `[Skill] ultimate … cost BRAND_SOULSTONE x5 (★d · flat)` |
| `:544` `RejectToast` | 신규. `_UIToast:ShowMessage(message, userId)` + 로그 `[Skill] reject toast -> …` |
| `Skill/SkillWindowLogic.mlua:1353-1356` `FormatCost` | ORIGIN 이면 "낙인의 영혼석 5개 소모" (값은 `_SkillCaster` 속성) |
| `SkillInfo.csv` 궁 5행(SK_W31 · SK_M31 · SK_A31 · SK_T31 · SK_P31) | `Cooldown` 0 → **120** · `UseLimit` 1 → **0** · `#Note` 끝에 규칙 한 줄(옛 "UseLimit 1" 문구 제거). 헤더 변경 없음 |
| `Skill/SkillExecutors.mlua:849` | 주석만(메소 익스플로전 동전 0 거절 이유) |
| `Docs/스키마-계약.md` | 스킬 등록서 8번 + 변경 이력 1행 |

- 메소 익스플로전(SK_T31) 동전 0 개 거절은 5-1 `PreCheck` 에서 먼저 나므로 영혼석도 쿨타임도 안 쓴다.
- 5-2 에서 센 뒤 차감까지 대기(`wait`·타이머)가 없어 개수가 바뀌지 않는다.
- `SkillCaster.codeblock` 은 새 속성·메서드 때문에 Maker Refresh 재생성분이 생긴다(재입장 뒤 커밋).

### Play 검증

(Maker 재입장 · Reimport All 뒤 추가)
