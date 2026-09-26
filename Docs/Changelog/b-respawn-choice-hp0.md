# b/respawn-choice-hp0

## 2026-09-26 — 부활 팝업 선택 부활이 HP 0 → 시간 부활처럼 HP 최대치 · 만렙 경험치 페널티 표시 0

PR #98. **출처: #40 comment 5831420626 (A 결정 · 사용자 강민구 2026-09-25)** — A 파일 `Match/PlayerRespawnService.mlua` 를 B 가 이 PR 에서 고치고 A 가 리뷰한다(협업-규칙 §3-3 경계면 PR · A 승인 필요). 증상 보고: #40 comment 5830769756 (B · 2026-09-25 Play).

**헤더 변경 없음 · 새 CSV · 열 · 이벤트 · 열거값 · 상태 필드 없음.** 기존 메서드 시그니처 · `@ExecSpace` 변경 없음.

### 증상 (2026-09-25 Play · 메모리만)

- 2P 이후 사망 → 부활 팝업에서 메소/경험치를 고르면 `Choose` → `ProcessRevive` 로 곧바로 살아나는데 `IsDead()=false` · 상태 IDLE · **HP 0/최대** 그대로(서버 · 클라 · HUD · 1s · 3s 뒤에도).
- 고르지 않고 기다린 시간 부활(엔진 · `RespawnDuration` 15s)은 HP 를 최대치로 채운다.
- 결과: 페널티를 내고 부활했는데 한 대에 다시 쓰러져 페널티를 또 낸다.
- 만렙(30) 팝업: 경험치 −1250 을 보였지만 실제 차감(`SummonManager.DeductExpInLevel`)은 0.

### 수정 (`Match/PlayerRespawnService.mlua`)

| 위치 | 변경 |
|---|---|
| `Choose` (`:170` 부근) | `ProcessRevive` 바로 뒤 `pc.Hp = pc.MaxHp`. 폴링 `OnRevive` 까지 기다리지 않는 이유: 폴링 간격(`PollInterval` 0.25s) 동안 HP 0 으로 살아 있어 그 사이 맞으면 또 쓰러진다. 로그 `[Death] user=… revive=choice hp=H/H mp=M/MM` |
| `ExpCutOf` (`:126`) | 레벨이 `_MonsterCatalog:GetMaxLevel()` 이상이면 0. `ExpProgress` 는 만렙에서 바를 가득 채워(within = need) 보여 주는 표시용이라 팝업만 −(need × 0.5)를 보였다. 실제 차감과 같아진다 |
| `OnRevive` 마지막 로그 | 끝에 `revive=timed/choice hp=… mp=…` — 두 부활 경로의 HP · MP 를 같은 꼴로 비교 |
| 새 `MpText(userId)` (ServerOnly) | 로그용 `"mp/maxMp"` (`SummonManager` econ · 없으면 `?`) |

**MP 는 바꾸지 않는다 — "시간 부활과 같게"(A 요청)의 뜻대로.** 이 프로젝트의 MP 는 엔진에 없고 `Summon/SummonManager.mlua` econ 이 진상이다(`:439`). econ.mp 를 쓰는 곳은 `SpendMp` · `GrantMp` · 회복 틱 · 레벨업(`OnLevelUp` `:465`)뿐이고, 사망 · 시간 부활 어느 쪽도 MP 를 건드리지 않는다(코드 읽기 · 2026-09-26). 그래서 선택 부활도 MP 를 그대로 둔다. Play 에서 두 부활의 `mp=` 로그로 확인한다. 부활 때 MP 도 채우기로 정하면 `OnRevive` 한 곳에서 두 경로를 같이 바꾸면 된다(설계 변경 · 이 PR 범위 밖).

### 계약서 (`Docs/스키마-계약.md`)

- 스킬 등록서 8번에 이 A 파일 한 줄 — **표 칸이 아니라 표 아래 인용 줄**로 넣었다. 8번 표 칸(`:274`)은 #86 이 고치고, #86 머지 뒤 #83 · #85 가 한 줄씩 더 넣는 줄이라 같은 줄을 고치면 머지 충돌이 난다.
- 변경 이력 1행 — #83(표 맨 위) · #86(2026-09-23 행 아래) · #97(2026-09-22 행 아래)이 넣는 자리와 떨어진 곳(2026-09-17 (2차) 행 아래)에 넣었다. 머지 순서 자유.

### 검증

- LSP 진단(`mlua-diagnose`): 에러 0 · 경고 0.
- `node Docs/tools/check-integrity.cjs`: 통과.
- **Maker Play: 아직 안 했다** (사용자 복귀 뒤 · 로컬 테스트 브랜치 #83 + #98 + #84 한 번에). A 리뷰 부탁은 Play 통과 뒤 이 PR 에서.

#### Play 체크리스트 (예정)

| # | 경우 | 기대 |
|---|---|---|
| 1 | 2P 이후 사망 → 팝업 **메소** 선택 | `chose MESO` → `revive=choice hp=최대/최대` → `penalty=MESO:5000 … revive=choice hp=최대` · 클라 HUD HP 최대 · 1s · 3s 뒤에도 최대 |
| 2 | 같은 경우 **경험치** 선택 | 1번과 같게 HP 최대 · `penalty=EXP:N` |
| 3 | 고르지 않고 15s 시간 부활 | `revive=timed hp=최대/최대` (전과 같음) |
| 4 | MP 비교 | 사망 직전 MP 를 반쯤 쓴 상태에서 3번(시간) · 1번(선택) 각각 `mp=` 가 사망 직전 값(+회복 틱)과 같다 — 두 경로 차이 없음 |
| 5 | 선택 부활 직후 한 대 맞기 | 다시 쓰러지지 않는다(HP 최대에서 깎인다) · 추가 `[Death] … choice?` 없음 |
| 6 | 만렙(30) 사망 팝업 | 경험치 쪽 표시 **0** · `[Death] … choice? … expCut=0` · 고르면 `penalty=EXP:0` |
| 7 | 만렙 아래(예 Lv20) 사망 팝업 | 표시 = 지금과 같음(구간 안 경험치와 need × 0.5 중 작은 값) · 실제 차감과 같다 |
| 8 | 1P 이전(무료) 사망 | 기존대로 무료 토스트 · `revive=timed` · HP 최대 |
