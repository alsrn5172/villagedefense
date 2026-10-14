# a/patch-1.0.8 — 테섭 릴리즈 뒤 조정

## 1. 시설 강화 비용 계단식 (누적 주화 3배 · 사용자 2026-10-14)

- `TowerConfig.csv` `UpgradeCost`(다음 단계로 가는 비용): 1 ~ 3단계 / 4 ~ 6단계 / 7 ~ 9단계 = 포탑 · 넥서스 6 / 18 / 36(총 180 · 예전 60) · 억제기 9 / 27 / 54(총 270 · 예전 90) · 10단계 0. 포탑 공격력이 5단계(2페이즈)와 8단계(3페이즈)에서 크게 뛰는 것에 맞춘 계단. 값만 바꿈(헤더 · 다른 칸 그대로 · 스크립트 `handoff/patch107-agents/_work/P/set-facility-cost.cjs`).

## 2. 구조물 피해 10% (사용자 2026-10-14 · 구조물 = 포탑 · 억제기 · 넥서스)

- `LaneFacility.PlayerStructureDamageMul` 0.1 · `StructureDamageMulOf(player)`(직업 패시브 "구조물 피해 +p" 자리 · 지금은 기본값) · `HandleHitEvent`: 플레이어 피해 = floor(피해 × 배리어(미니언 없으면 `NoMinionDamageMul` 0.05) × 0.1) · 최소 1. 페리온 억제기 반사는 배리어까지만 적용한 값(`reflectBase`) 기준 — 예전 반사량 유지. 튜토리얼 문구는 안 바꿈(사용자).

## 3. 강화 시 HP 더하기 (사용자 2026-10-14)

- `LaneStateService.RequestTowerAction` upgrade: 새 HP = min(새 최대, 강화 전 HP + (새 최대 − 강화 전 최대)) — 예전(1.0.7) 강화 전 HP 비율 유지를 대체. 수리비(부족한 HP × `RepairCostPerHp` 올림)는 이미 부족한 만큼 비례라 그대로.
