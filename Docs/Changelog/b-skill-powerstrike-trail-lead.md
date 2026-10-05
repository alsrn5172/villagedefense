# b/skill-powerstrike-trail-lead — 파워 스트라이크 보라 잔상 0.1초 일찍

## 2026-10-05 — 사용자 결정

> Power Strike's purple swing trail (SK_W11, all six swing motions) starts 0.1 s earlier: 0.35 s instead of 0.45 s. Damage stays on its own timer at 0.45 s.
> 참조 영상 없음(사용자: 더 찾지 않는다).

### 찾은 것

- 보라(청보라) 휘두르기 잔상 = `SK_W11_trail_swing{O1–O3 · T1–T3}_bv` 6장(팀 저장소 mIYbC · 80003316/80003330 원화 hue +249°) — **파워 스트라이크만** 쓴다(`effectOverrides.SK_W11.trail`).
  다른 공격(기본 공격 · 다른 직업 스킬 · 레이징 블로우 베기)은 이 그림을 쓰지 않는다. 기본 공격(PlayerAttack)에는 스크립트 잔상이 없다.
- 지금 시작: 고른 모션의 HitTime(`Skill/SkillMotionSet.csv` 2–7행 · 여섯 모션 모두 0.45) → `ExecutePowerStrike` 가 `ScheduleSwingTrail(…, hitAt)` → `PlaySpriteFlash(showAt = hitAt)`.
  폴백(모션 세트 없음) = `effectOverrides.SK_W11.hitAt` 0.45. 같은 hitAt 으로 피해 · 명중 그림 · 명중음 타이머가 따로 돈다. 잔상 호출엔 소리가 없다.

### 바뀐 것 (B 파일 하나)

| 파일 | 내용 |
|---|---|
| `Skill/SkillExecutors.mlua` | `effectOverrides.SK_W11.trailLead = 0.1` · `ScheduleSwingTrail`: 잔상 시작 = max(0, hitAt − trailLead) = **0.35 s** (모션 6종 · 폴백 모두) · 로그 `swing trail SK_W11 <motion> at +0.35s (contact 0.45 − lead 0.10)` |

- 피해 · 명중 그림 · 명중음 · 쿨타임 · 시전 락 · `SkillMotionSet.csv` HitTime 은 그대로(0.45).
- 보이는 길이 `trailSeconds` 0.35 는 그대로 → 잔상 0.35 ~ 0.70 s(예전 0.45 ~ 0.80).
- `trailLead = 0` 이면 예전과 같다(서버 Lua 로 바꿀 수 있다 · 키트 `villagedefense-harness/pirate-check/sitting/trail_lead_server.lua` + `trail_lead_client.lua` · **L** = 0.45 ↔ 0.35).

### 점검

- LSP(SkillExecutors) — 아래 · `check-integrity` — 아래. **Play 안 함** — RELOOK R20 · 숫자 N7.
