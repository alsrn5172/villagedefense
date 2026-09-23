# a/p0914-3-lane-waves (B3 · 통합 브랜치 `a/plan-0914` · B2 위 stacked · PR #71)

미니언 웨이브 표 · 억제기 파괴 폭발 · 시설 HP ×75 · 대플레이어 ×12. 정본: 허브 `WorkOrders/WO-027` §7 · `WO-029` B3 · 계약 A-2-6a.

| 항목 | 내용 | 파일 |
|---|---|---|
| `MinionWave` 신설 + 소비 | `Profile`(LIVE/TEST=÷8) × 웨이브 11행(P1-0 7:30 · P1-1 11:00 · P1-2 14:30 / P2-1 17:00 · P2-2 20:00 · P2-3 23:00 / P3-1~5 25:00 부터 매분) + `P3-ZOMBIE` 템플릿 행. 마을당 **8마리 1초 간격**(TEST 0.125초). 개체 HP/공격 = 행 값(1P 1,000/300 → 2P 3,200/630 → 3P 5,000/3,700 +5%/웨이브), Exp = 같은 시기 일반몹(B2 레벨 보간), 메소 = B2 구간값, 좀비머쉬맘 30,000/5,000 · Exp 970 · 메소 4,500 · 3P 웨이브마다 1 → 2분마다 +1. 표가 끝나면 마지막 행을 같은 간격으로 반복 | `MinionWave.csv` · `MinionWave.userdataset` · `Match/MatchSessionLogic.mlua`(`LoadWaves`/`FireWave` · 첫 웨이브 전원 토스트 "미니언이 생성되었습니다" · HUD `nextIn` = 다음 웨이브까지) · `Lane/MinionFlowService.mlua`(`QueueWave` + `OnUpdate` 스폰 큐 · `MinionComposition` 로더 제거) |
| 페이즈 시각 | `MinionPhaseConfig` LIVE 270 / 990 / 1470 (TEST 34 / 124 / 184). `SpawnIntervalSeconds`·`CoinDropChance` 0(간격 스폰 폐기 · 주화는 엘리트만) · 배율·Exp·메소 열은 미사용 | `MinionPhaseConfig.csv` |
| 억제기 파괴 폭발 | `LaneStateService.ApplyDamage` 에서 억제기 파괴 직후 `SuppressorBoom`: 억제기 바닥 기준 반경 3.0 의 **미니언(MinionUnit)에게만** 10,000 고정 피해(처치 보상 없음) + ICBM special `807816a6…` ×0.8 + Hit 사운드 `5e8b2bcc…`(그 맵 유저에게). 값은 전부 property | `Lane/LaneStateService.mlua` |
| 시설 HP | 포탑 60,000 / 90,000 / 135,000 (공격 125 / 190 / 270) · 억제기 90,000 / 135,000 / 195,000 · 넥서스 150,000 · `RepairCostPerHp` 0.00067 (넥서스 0.0013 · 전체 수리 40주화 유지) | `TowerConfig.csv` |
| 대플레이어 | `LaneStateService.PlayerDamageMul` 10 → **12**(방어 후 3방 목표 · B4 감산 뒤) | `Lane/LaneStateService.mlua` |
| 계약 | A-2-6a 구현 표기 · `P3-ZOMBIE` 규약 · `MinionComposition` 미사용 · 폭발 property 위치 | `Docs/스키마-계약.md` |

- `DispatchService.Release(phase, 1, 1)` — 파병은 웨이브 시각에 같이 풀리며 배율은 원래 안 탔다(변경 없음).
- ★1 의 3P 고정(`P2-3` 값) · ★5 좀비 ×2 는 B6 `DifficultyService` 가 곱한다(여기선 표 값 그대로).
- 좀비 Exp 970 = Lv30 일반몹 97 × 10(엘리트 규칙) — WO-027 §7 초안의 400 대신. 검토 대상.

## 검증

- `node Docs/tools/check-integrity.cjs` 통과 여부는 PR 본문.
- 런타임(개인 월드 · TEST · StartMatch 뒤): `[Match] MinionWave loaded: 11 waves (profile=TEST)` · 56초 `[Match] wave #1 P1-0` + 토스트 · `[Minion] wave=P1-0 village=<vid> spawned=8/8` · 웨이브 뒤 `FacilityState(vid,"TOWER").hp` · 억제기 파괴 `[Suppressor] boom … hit=<n> killed=<n>`.

## 재검증 수정 (2026-09-23 · Codex 2회 리뷰 + Maker 회귀 · 커밋은 B3b 브랜치 PR #72 에 실림)

- `MinionFlowService.OnUpdate`: 큐에 넣은 뒤 **탈락한 마을**(주인 없음)의 스폰은 건너뛴다. `ResetQueue()` 신설 — `StartMatch`/`SetProfile` 이 이전 판 대기 스폰을 버린다.
- 파병(`DispatchService.Release`)은 즉시가 아니라 **그 웨이브 일반 미니언 count×gap 뒤** 큐 항목(`QueueDispatch`)으로 — "미니언 먼저, 파병은 바로 뒤" 순서 유지.
- `SuppressorBoom`: 폭발 처치는 `MinionUnit.lastAttacker`·`FarmReward.LastAttacker` 를 지워 **보상 없음**을 실제로 보장(안 지우면 직전 공격자에게 경험치·메소가 갔다).
- `MinionWave.csv` TEST `StartSeconds` 반올림(half-up): P1-1 83 · P2-3 173 · P3-3 203.
- `FactionAttack.DoAttack/HitOne/IsAttackTarget`: 첫 판정이 넥서스 파괴 → 탈락 정리까지 **동기로** 이어져 공격자 자신이 사라지는 경우 가드(실측 LEA-3023/2011 · 기존 결함 · 미니언이 넥서스에 더 잘 닿게 되어 드러남).
- (Codex 2차 리뷰) `Expire()` 가 스폰·파병 큐를 비운다(만료 직전 큐잉된 웨이브가 종료 뒤 나오지 않게) · 표 끝 반복 타이머는 잰 프레임에 줄이지 않는다 · 폭발음은 `PlayBoomSoundLocal`(Client RPC · Monster.PlaySoundLocal 방식)로.
- 🔴 알림: `LaneConfig` 에 ELLINIA·NAUTILUS 레인 행이 없어 S2 특성은 실전 매치에서 아직 시설 자체가 안 생긴다(테스트맵에서만) — 레인 지형은 사용자가 직접 까는 항목.

## main 병합 (2026-09-23 · PR #43 엘리니아·노틸러스 레인 흡수 · 사용자 지시)

- 통합 브랜치 `a/plan-0914` 에 `origin/main`(12757d2) 을 머지하고 B0→B1→B2→B3→B3b 순으로 내려보냄. 충돌 3곳 해결:
  - `Docs/스키마-계약.md`: 양쪽 다 보존. A-2-6 `MinionComposition` 은 "미사용"이 아니라 **마을별 개체 종류(`Phase`+`VillageId` → `MonsterId`)** 만 제공하는 표로 정정(스탯·시각은 `MinionWave`).
  - `MonsterInfo.csv`: `merge=union` 이 79행(14열)+81행(13열) 두 벌을 만들어 B2 판으로 재구성 + main 의 물버섯 `12230101` 행에 B2 규칙 적용(Exp 75 · 메소 450 · Attack 330).
  - `Lane/MinionFlowService.mlua`: B3 큐 구조 + main 의 `LoadComposition`/`PickMonster(villageId)` 복원. `QueueWave` 는 마을 전용 구성 행이 있으면 그 종(노틸러스 물버섯), 없으면 `MinionWave.MonsterId` — 좀비 템플릿 종은 일반 스폰에서 제외(`PickVillageMonster`). 출발 x·방향은 main 의 `LaneStartX`/`LaneDir`(좌→우 레인).
- 앞서 적은 "LaneConfig 에 ELLINIA·NAUTILUS 행이 없다" 는 오래된 base 탓이었다 — 병합 뒤 5마을 15행.
