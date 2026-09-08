# b/skill-register-fix — 등록서 후속 (A 답변 반영 · 문서만)

> 배경: #37(등록서) 머지 뒤 A 가 세 항목에 답했다. 그중 계약서에 남겨야 할 것을 넣는다. base `main c9d700b`.

## 2026-09-09

### `Docs/스키마-계약.md`
- §0-2 `JobId` **확정**(제안 → 확정). `ItemInfo.ReqJob` 은 현재 숫자 `0` 자리표시자라 지킬 관례 없음 — 나중에 문자열 ID 로 쓸 때 헤더 계열 변경(§2-1)이라 사전 공지 후 A 가 채운다.
- §0-2 `JobTier` **integer** 명시 + 값 의미 고정: `0`=NOVICE · `1`=1차(Lv10) · `2`=2차(Lv20) · `3`=3차(Lv30). A 가 `VillageOwnership` 마을 소유 조건(GDD §4.1 "전직 여부")을 `Tier` 로 판정할 예정이라 번호를 고정한다.
- §1 등록 상태 🟡 → ✅ 등록 완료(#37). 8번에서 **`SummonManager.mlua` 제거** — `SpendMp` · `GrantMp` · MP 회복 틱(3초마다 `max(1, floor(maxMp×0.03))`, `mp < maxMp` 일 때만 Push) 은 A 가 별도 브랜치로 넣는다. B 는 `_SummonManager:SpendMp(userId, amount)` 호출만.
- A-2-16 `JobInfo`: **`JobId="NOVICE"` 행 필수** — `StatService.mlua:99` 가 신규 유저를 `job="NOVICE"` 로 만들며, 행이 없으면 `GetJob` 하드코딩 폴백(초보자 · STR/DEX · 6:4)이 표와 조용히 갈라진다.
- B-3 `JobChangedEvent`: `Tier` 는 **integer**, append-only(이후 이름 변경·삭제 금지). 상태 🟡 → ✅.
- 메모: maxMp 원장은 `SummonManager.econ.maxMp` 가 유일한 진상 — `StatService final.maxmp`(장비·버프분)는 A 가 econ 으로 흘려보내는 다리를 놓는다. B 는 `GetEcon(userId).maxMp` / `SpendMp` 만 본다.

### 검증
- `node Docs/tools/check-integrity.cjs` — 변경 없음(문서만).
