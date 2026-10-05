# b/skill-double-jump-any-key — 점프 키가 무엇이든 더블 점프

## 2026-10-05 — 사용자 제보

> "when the jump key is Alt instead of Space, pressing Alt twice does not trigger the double jump. Make the double jump follow the jump action whatever key is bound."

### 원인(코드 읽기 · Play 로 확인 안 함)

- 공중 점프(더블 점프 · 마법사 공중 텔레포트)는 `SkillHotbar.OnJumpKeyDown`(`_InputService` KeyDownEvent)에서만 잡았다: 그 키가 `GetActionName(key) == "Jump"` 이거나 Space 일 때.
  Alt 는 이 길로 잡히지 않았다 — Alt 의 KeyDownEvent 가 안 오는지, 액션 이름이 "Jump" 가 아닌지는 Play 로 봐야 한다(진단 로그 `HOTBAR: key LeftAlt action='…'` 추가).
- 엔진 점프는 Alt 로도 된다(지상 첫 점프) → 점프 **액션** 쪽에 걸면 키와 상관없다.

### 바뀐 것 (B 파일 하나)

| 파일 | 내용 |
|---|---|
| `Skill/SkillHotbar.mlua` | `JumpActionHook`(true) · `JumpPressGap`(0.1 s) · `OnJumpActionAttempt`. `TryWireKeys` 가 `PlayerControllerComponent:AddCondition("Jump", …)` 를 한 번 건다 — 점프 액션이 시도될 때(어느 키든) 부르고 늘 true(점프를 막지 않는다). 공중이면 `TryAirJumpTeleport`(더블 점프 · 마법사 텔레포트 · 지상이면 그냥 돌아온다). 꾹 누르기로 매 프레임 오면 첫 시도만 누름. 예전 KeyDownEvent 길도 그대로 둔다 — 같은 누름을 둘 다 잡아도 공중 1회 · 디바운스(0.25 s)가 한 번만 낸다 |

- 🟡 엔진이 공중에서도 점프 조건을 묻는지는 Play 로 확인해야 한다(묻지 않으면 Alt 는 여전히 안 된다 → 진단 로그로 다음 수).

### 점검

- LSP 깨끗 · `check-integrity` 전부 통과(경고 3 = main). **Play 안 함** — RELOOK R18.

## 2026-10-05 2차 — "Jump2" 도 (사용자 Play R18 FAIL · 기본 바인딩)

### 찾은 것

- 통합 빌드 `8efe928` Play(N2b `villagedefense-harness/pirate-check/sitting-8efe928/N2b-default-jump2.txt`): 엔진 기본 바인딩에서 LeftAlt = **"Jump2"**(Space = "Jump" 와 다른 액션) — `HOTBAR: key LeftAlt action='Jump2' jumpKey=false`.
  "Jump" 에만 걸려 있어서 Alt 기본 바인딩에선 공중 Alt 가 더블 점프를 내지 않았다(Alt 를 "Jump" 로 다시 묶으면 30/30 · N2).
- 사용자 결정: 다시 묶지 않고 기본 "Jump2" 로도 되게 — 판정(지상 무시 · 땅을 떠난 뒤 0.2 s 무시 · 점프당 1회 · 디바운스 · 꾹 누르기 = 1번)은 "Jump" 와 같게.

### 바뀐 것 (B 파일 하나)

| 파일 | 내용 |
|---|---|
| `Skill/SkillHotbar.mlua` | `JumpActionName2 = "Jump2"`("" = 끔). `TryWireKeys` 가 `AddCondition` 을 "Jump" 와 "Jump2" 둘 다에 건다 — 같은 `OnJumpActionAttempt`(JumpPressGap · FirstJumpGrace · airTeleportUsed · AirJumpTeleportDebounce 그대로). `OnJumpKeyDown` 도 키의 액션이 "Jump" 또는 "Jump2" 면 점프 키로 본다. 로그 `double jump follows the 'Jump' + 'Jump2' action(s)` |

### 점검

- LSP 깨끗 · `check-integrity` 전부 통과(경고 3 = main) — 로그 `villagedefense-harness/pirate-check/after-maker-free/172-*.txt`. **Play 안 함** — 다음 빌드 RELOOK R18(기본 바인딩 그대로 · 실제 Alt 가 빠지는지도 같이).
