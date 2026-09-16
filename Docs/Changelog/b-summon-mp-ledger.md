# b/summon-mp-ledger — MP 원장 API (SpendMp · GrantMp · 3초 회복 틱 · StatRecalculatedEvent maxMp 다리)

> 배경: B(박승현) 스킬 시전(`Skill/SkillCaster`)이 시전마다 `_SummonManager:SpendMp` 를 불러야 하는데 메서드가 없었다. 등록서 8번(계약서 §1)과 A 답변 ③④ 에서는 A 가 별도 브랜치로 넣기로 했으나, **A 가 #40 comment 5588167790 에서 뒤집어 네 항목 전부를 B 가 한 PR 로 넣기로 했다**(A 승인은 여전히 필요). base `main 81d5ea6`(PR #39 머지 후). Draft PR #41 이 잠금.

## 2026-09-09

### `Summon/SummonManager.mlua`
- `SpendMp(userId, amount) → boolean` (ServerOnly): `amount ≤ 0` 이거나 MP 부족이면 `[Summon] SpendMp rejected …` 로그 + false, 아무것도 안 뺀다. 성공하면 차감 → `Push(userId)`(HUD) → `[Summon] -mp N -> mp=M` → true. `SpendSp` 와 같은 꼴이되 **이벤트는 발행하지 않는다**(A 지시 · `SpSpentEvent` 같은 MP 이벤트 없음).
- `GrantMp(userId, amount)` (ServerOnly): 포션·보상·리모컨용. `min(mp + amount, maxMp)` 로 clamp → `Push` → `[Summon] +mp`. `GrantSp` 와 같은 꼴.
- 3초 회복 틱: `OnBeginPlay` 에서 `_TimerService:SetTimerRepeat(TickMpRegen, MpRegenIntervalSec)` 시작, `OnEndPlay`(신설)에서 `ClearTimer`. `TickMpRegen` 은 `econ` 전 유저 중 **`mp < maxMp` 인 유저만** `max(1, floor(maxMp × MpRegenRate))` 회복(`maxMp` clamp)하고 **그 유저만 `Push`**(가득 찬 유저까지 매 틱 RPC 하지 않는다). 엔티티가 무효(나간 유저)면 건너뛴다. 간격·비율은 인스펙터 property `MpRegenIntervalSec = 3` · `MpRegenRate = 0.03`. 타이머 id 는 `@HideFromInspector mpRegenTimerId`.
- maxMp 다리: `@EventSender("Logic", "StatService")` `handler HandleStatRecalculatedEvent` 가 `FinalStatsCsv` 에서 `maxmp` 를 꺼내(`ParseStatCsv`) `econ.bonusMaxMp` 에 두고 `RecomputeMaxMp(e)` 로 `econ.maxMp = BaseMaxMp + levelMaxMp + bonusMaxMp` 를 다시 만든다. **maxMp 가 실제로 바뀌었을 때만 Push**. `StatService.mlua` 는 수정하지 않는다. `StatService.users[uid].base.maxmp = 0` 이라 장비 없으면 bonus 0 = 종전과 동일.
- 그에 맞춰 `EnsureUser` 신규 행에 `levelMaxMp = 0, bonusMaxMp = 0` 추가, `ApplyLevelUpRewards` 의 `e.maxMp = e.maxMp + addMp` → `e.levelMaxMp += addMp` + `RecomputeMaxMp(e)`. `RecomputeMaxMp` 는 줄어든 maxMp 아래로 `mp` 를 clamp 한다.
- 규칙: `econ.mp` 를 쓰는 곳은 `SpendMp` · `GrantMp` · `TickMpRegen`(+ 기존 예외 `OnLevelUp` 의 가득 채우기, `RecomputeMaxMp` 의 clamp)뿐. B 의 `Skill/` 은 `SpendMp` 호출과 `GetEcon(userId).mp / .maxMp` 읽기만.

### 문서
- 계약서 §1 등록서(스킬 시전 행 · 8번 · A 답변 주석) 와 변경 이력: "A 가 직접" → B 가 `b/summon-mp-ledger`(PR #41) 에서 네 항목 전부(A 승인 필요).

### 로그 스모크 (Maker Play) — TODO · 사람이 돌린다
- [ ] Play 시작: `[Summon] manager ready (mp regen interval=3s rate=0.03)`. 3초마다 가득 찬 유저는 `[Stat] recalculated` 등 Push 계열 로그가 **늘어나지 않는지**(회복 없으면 Push 없음).
- [ ] 서버 스크립트: `_SummonManager:SpendMp(uid, 30)` = true · `[Summon] -mp 30 -> mp=70` · HUD MP 바 70/100. 이어서 `SpendMp(uid, 100)` = false(`SpendMp rejected amount=100 mp=70`) · `SpendMp(uid, 0)` = false · 값 변화 없음.
- [ ] 3초 뒤부터 `mp` 가 `max(1, floor(100 × 0.03)) = 3` 씩 올라 HUD 가 73 → 76 → … → 100 에서 멈추는지(100 초과 없음). 인스펙터에서 `MpRegenRate = 0.1` 로 바꾸면 10 씩.
- [ ] `_SummonManager:GrantMp(uid, 999)` → `[Summon] +mp 999 -> mp=100`(clamp).
- [ ] 레벨업(`GrantKillReward`) 시 `[Summon] levelup reward … +mpN` 뒤 `OnLevelUp` 이 `mp = maxMp` 로 채우고 `maxMp = 100 + ΣAddMaxMp`.
- [ ] maxMp 다리: `DevStatRemote`(DEV) 나 장비 착용(EQUIP)으로 `maxmp` 가 붙는 상태로 `[Stat] recalculated … maxmp=N` 이 찍히면 바로 `[Summon] maxMp 100 -> 100+N (bonus=N src=…)` 와 HUD `maxMp` 갱신. 같은 값으로 다시 재계산되면 `[Summon] maxMp` 로그가 **안 찍히는지**(변화 없으면 Push 없음). 장비를 벗어 `maxmp=0` 이 되면 `maxMp` 가 되돌아오고 `mp` 가 그 아래로 clamp.
- [ ] Play 종료 후 회복 틱 로그가 계속 찍히지 않는지(`OnEndPlay` 의 `ClearTimer`).
- [ ] 빌드 로그에 `@EventSender("Logic", "StatService")` handler 관련 `Symbol not found` 가 없는지 — 이 레포 첫 Logic 발행 이벤트 구독자다.
