# b/skill-prehit-hook

## 2026-09-24 — PlayerHit 사전 피해 훅 + SelfWire 4개 끄기

PR #89 (stacked · base `b/skill-hyperbody-dmgreduce` #85). **출처: #40 5813239867 (A 결정 · 사용자 확정 2026-09-24)** — 훅과 `*SelfWire` 4개 끄기를 한 PR 에 · A 는 리뷰로 승인(`PlayerHit.mlua` = A 파일 · 협업-규칙 §3-3).

**헤더 변경 없음 · 새 CSV 열 없음 · 새 이벤트 없음 · 새 RPC 없음.** `ModifyIncomingDamage`(`Skill/SkillBuffs.mlua:732`)는 이미 있던 함수 — 호출부가 0 이었다.

### 변경

| 위치 | 변경 |
|---|---|
| `PlayerHit.mlua:43-50` (A 파일) | `OnHit` 의 불굴의 진 · 궁 시전 무적 분기 **뒤**, 같은 `if self:IsServer() and _SkillBuffs ~= nil` 블록 안에서 `damage = _SkillBuffs:ModifyIncomingDamage(uid, damage)` · `damage <= 0` 이면 `return`(= `__base:OnHit` 안 부름) |
| `Skill/SkillBuffs.mlua:88-94` | `MagicGuardSelfWire` · `DarkSightSelfWire` · `EnergyShieldSelfWire` · `HyperBodySelfWire` = **false** |
| `Skill/SkillBuffs.mlua` 주석 | 헤더 · `OnPlayerHitEvent` 설명을 새 경로로(동작 변화 없음 — 이제 `OnPlayerHitEvent` 는 아이언 바디 반사만) |

### 순서 (`ModifyIncomingDamage` · HP 감산 전)

1. 무적(`IsInvincible`) → 0 — 실제로는 위 불굴의 진 · 궁 시전 무적 분기가 먼저 `return` 한다
2. 다크 사이트 1회 회피 → 0
3. 에너지 쉴드 흡수
4. 하이퍼 바디 감소
5. 매직 가드 흡수(MP 차감)

### 동작 변화

| 경우 | 전(자가 배선 · HitEvent 뒤 HP 되돌림) | 후(사전 훅) |
|---|---|---|
| 한 방에 죽는 피해 | 되돌리기 전에 죽는다 | 줄어든 피해가 HP 안이면 **산다** |
| 피해 숫자 | 감소 전 값 | 감소 **뒤** 값 |
| 다크 사이트 회피 | HitEvent · 경직 있음 → HP 되돌림 | 경직 · 넉백 · 표시 · HitEvent **없음** |
| 에너지 쉴드 전액 흡수 | 경직 · 넉백 있음 | **없음** (A 승인 5813239867 2번) |
| 아이언 바디 반사 | 모든 피격 | 피해가 0 으로 끝난 타(회피 · 전액 흡수)는 HitEvent 가 없어 반사 없음 |
| 오라 피해 | 훅 밖 | 그대로 훅 밖 — 지금 플레이어 HP 를 깎는 오라 없음(A 3번) |

### 계약서

`Docs/스키마-계약.md` 스킬 등록서 8번의 `PlayerHit.mlua` 항목에 이 훅을 한 줄 더 적어야 한다. 같은 칸을 #86 이 고치고 있어 충돌을 피하려고 이 PR 에서는 건드리지 않았다 — #86 머지 뒤 이 브랜치에서 추가한다.

### Play 검증

(Maker 재입장 · Reimport All 뒤 추가)
