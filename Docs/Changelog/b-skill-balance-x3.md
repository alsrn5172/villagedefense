# b/skill-balance-x3 — 전사 · 해적 근접 4종 피해 ×3 · 범위 안 전부 (A 요청)

## 2026-10-05

요청(A · 기획): 파워 스트라이크 · 레이징 블로우 · 섬머솔트 킥 · 피스트인레인지 — 피해 ×3, 지금 판정 상자 안 적 **전부**(상한만 뺌 · 상자 그대로). 스나이핑(3타 × 가까운 3명)은 #171 의 투사체 조준 코드 위에서만 깨끗하게 바뀌어 따로(`b/skill-sniping-3x3` · #171 머지 뒤).

| 스킬 | 피해 (SkillInfo.csv) | 대상 |
|---|---|---|
| 파워 스트라이크 SK_W11 | BaseEffect 150 → **450** · EffectPerLevel 37.5 → **112.5** (Lv1 450 % … Lv5 900 %) | 최근접 1 → 앞쪽 상자(Range 2.5 × MeleeArcHeight) 안 **전부** — `ExecutePowerStrike` 가 `SnapshotTargets(…, 0)` 로 시전 순간 고정 · 접촉 순간 대상마다 1타 · 타격 그림 대상마다 · 명중음 시전당 한 번 |
| 레이징 블로우 SK_W11_RB | 파워 스트라이크 % × 0.8 × 4타 그대로 → 위 값에 따라 **×3** | 최대 6 → **전부**(`effectOverrides.SK_W11_RB.maxTargets` 6 → 0 · 상자 3.5 × 2.5 그대로) |
| 섬머솔트 킥 SK_P11 | BaseEffect 125 → **375** · EffectPerLevel 37.5 → **112.5** | 최대 6 → **전부**(`skillTargetCaps.SK_P11` 뺌 · 상자 앞 1.7 / 뒤 0.9 / 위 1.85 그대로) |
| 피스트인레인지(에너지 차지 2단) SK_P21 | 타당 BaseEffect 30 → **90** · EffectPerLevel 5 → **15** (10타 그대로) | 최대 4 → **전부**(`skillTargetCaps.SK_P21` 뺌 · 상자 Range 3 × MeleeArcHeight 그대로) |

- `SkillInfo.csv` 는 계약 표(§0 SkillInfo · B 등록) — 값 3행 · SK_W11 설명(단일 대상 → 범위 안 모든 적 · 최대 6명 → 전부) · #Note 꼬리만. 헤더 · 열 변경 없음. BOM · CRLF 유지.
- 점검: LSP · `check-integrity` — 로그 `villagedefense-harness/pirate-check/after-maker-free/balance-x3-*.txt`. **Play 안 함** — RELOOK R30 · 숫자 N10.
