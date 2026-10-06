# b/skill-shift-double-jump — Shift = 점프 · 더블 점프 (마법사는 텔레포트 그대로)

## 2026-10-06 — 사용자 결정

- 전사 · 도적 · 해적 · 초보자: Shift = 더블 점프. 궁수: Shift 닷지를 빼고(닷지는 E 그대로) Shift = 더블 점프. 마법사: Shift = 텔레포트 그대로.
- 공중 Shift = 더블 점프 · 땅 Shift = 보통 점프. 기존 Alt / Space 더블 점프는 그대로. 더블 점프를 배웠을 때만 · 가드는 지금과 같다(줄 · 사다리 · 시전 락 · 쿨다운).

### 바뀐 것 (`Skill/SkillHotbar.mlua` · B 파일 하나)

| 곳 | 예전 | 지금 |
|---|---|---|
| Shift 슬롯(2) `byJob` | 마법사 `TELEPORT` · 궁수 `SK_A22`(닷지) | 마법사 `TELEPORT` · 초보자 · 전사 · 궁수 · 도적 · 해적 `JUMP`(`ShiftJumpToken`) |
| `ApplyShiftBinding` 새 | Shift → `Skill2` 고정(TryWireKeys) | `JUMP` 직업이고 더블 점프(SK_N02)를 배웠으면 Shift(좌 · 우) → 엔진 점프 액션 `Jump`, 아니면 `Skill2`. 직업 · 배움이 바뀌면 다음 프레임에 다시 묶는다(바뀔 때만 `SetActionKey`) · 로그 `SkillHotbar: Shift -> 'Jump' (job=… doubleJumpLv=…)` |
| `ResolveSlotSkillId` | — | `JUMP` = "" → 시전 없음 · 스킬 HUD(A 의 `SkillHudController`) Shift 칸은 이 직업들에 안 보인다(예전 전사 · 도적 · 해적과 같다 · 궁수는 닷지 칸이 빠진다) |
| `GetKeyNameForSkill` | 닷지 = "Shift"(슬롯 2 가 먼저) | 닷지 = "E" · 더블 점프(SK_N02) = "Shift"(스킬 창 칩 · `JUMP` 직업만) |

- 땅 Shift = 엔진 점프 그대로 → 시전 락(`SkillCaster` 의 `AddCondition("Jump")`) · 줄 · 사다리(점프 = 줄에서 뛰어내리기 · Space 와 같다) · 아래 + 점프 = 아래 점프도 Space 와 같다.
- 공중 Shift = `OnJumpKeyDown`(`GetActionName(Shift) == "Jump"`) → `TryAirJumpTeleport` → `TryAirDoubleJump` — Alt / Space 와 같은 길 · 같은 가드(공중 1회 · `FirstJumpGrace` · 디바운스 · MP · 배움).
- 안 배웠으면 Shift = 빈 슬롯(`HOTBAR: slot2 Shift empty`).
- #172(`b/skill-double-jump-any-key` · Jump2 훅)와 따로 선다 — #172 없이도 `OnJumpKeyDown` 이 Shift 를 잡는다. 둘 다 들어오면 Shift 공중 누름을 두 길(KeyDown · 점프 액션 조건)이 잡지만 공중 1회 · 디바운스가 한 번만 낸다.
- **Play 안 함** — 숫자 N16 · 모습 R37. 🟡 수식 키(Shift)를 엔진 점프 액션에 묶는 것은 런타임 미검증.
