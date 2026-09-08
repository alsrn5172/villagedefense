# a/dispatch-real-move — 파병 실제 이동 + 좀비머쉬맘 3페이즈 실측

> 지시서: `메월드폴더/WorkOrders/WO-014-파병-실제이동.md`. base `main a1ab351`(PR #34 머지 후).
> 워크트리 `villagedefense-worktrees/a-dispatch-real-move` 에서 **Maker 없이** 작성했다 —
> 검증은 이 폴더를 개인 월드에 물려 `Reimport All` 뒤에 한다(사용자 지시 2026-09-09).

## 2026-09-09 — ① 파병 실제 이동 (Play 미검증)

### 문제

`LaneStateService.RequestDispatch` 가 스텁이었다. 원장 `v.defenders` 에서 묶음만 지우고 끝나서

- 마을에 **스폰돼 있던 수비 몬스터 엔티티는 그대로 남았고**(원장과 실물이 어긋남)
- 대상 마을 레인에는 **아무것도 가지 않았다**

UI 안내문도 "실제 이동·전투는 Lane 연동 후(지금은 원장에서만 빠짐)" 로 박혀 있었다.

### 결정 (사용자 확정 2026-09-08)

| 항목 | 결정 | 근거 |
|---|---|---|
| 투입 시점 | **다음 웨이브에 합류** | GDD §4.3 "실제 투입 전까지 취소 가능" — 즉시 스폰하면 취소 규칙이 성립하지 않는다 |
| 전투 수치 | **보낸 사람의 수비대 스펙 그대로** (HP 도감MaxHp×0.3×훈련배율 · 공격 도감Lv×1.5×배율) | 페이즈·억제기 배율을 또 곱하면 배율이 이중으로 걸려 튜닝이 불가능해진다 |
| 보상 | **없음** | GDD §4.3 — 보상을 주면 파병이 상대를 돕는 꼴이 된다 |
| 단위·상한 | **묶음 FIFO** + `DispatchRule.csv` 신설 | 몬스터 종류 선택은 UI 개편이 필요해 뒤로 미뤘다 |

### 데이터 — `DispatchRule.csv` 신설 (계약서 **A-2-16**)

`Phase,MesoCost,VillageCap,CancelDeadlineSeconds,Enabled,#Note` · 기본 키 `Phase` (A-3 예약 그대로) · 4행.

- `PHASE1_PIONEER` 은 미니언이 없는 개척 구간이라 `Enabled=false` (접수 자체를 막는다)
- `VillageCap` 3 / 3 / 4 — 한 마을이 **동시에 대기시킬 수 있는** 묶음 수
- `MesoCost` 는 전부 **0** — 파병 비용 체계는 로드맵 미정 #10 이라 열만 확보했다
- `CancelDeadlineSeconds` 0 = 투입 직전까지 취소 가능
- `.userdataset` 쌍 + `check-integrity` CANONICAL/PK 등록 (C1·C3·C4 대상)

### 대기열 — `Dispatch/DispatchService`(신규 @Logic · 신규 폴더)

`orders[대상마을] = { {id, sender, senderVillage, monsterId, name, qty, statMul}, … }` 접수 순서.

| 메서드 | 하는 일 |
|---|---|
| `Submit` | `orderId`("D1", "D2"…) 발급 후 대기열에 append |
| `Cancel(orderId, userId)` | 본인 것만 뺀다. 뺀 order 를 돌려주면 `LaneStateService` 가 수비대로 되돌린다 |
| `CanCancel()` | `MatchSessionLogic:SecondsToNextWave()`(신설) > `CancelDeadlineSeconds` |
| `PendingOf(userId)` / `PendingCount(villageId)` / `PendingUnits(villageId)` | 뷰·상한 검사 |
| `GradeOf(villageId)` | 방어자에게 알릴 **총량 등급만** — 8마리 이하 소 · 24 이하 중 · 그 위 대 |
| `Release(phase, hpMul, atkMul)` | 마을별 대기열을 전부 꺼내 스폰. 그 사이 주인이 사라졌으면 조용히 버린다 |
| `CancelAllOfVillage` | 탈락·파괴 시 그 마을로 가던 대기열 폐기(보낸 사람에게 돌려주지 않는다 — 이미 소모된 전력) |

**이벤트는 만들지 않았다.** 구독자가 A 자신뿐이라 직접 호출이다. 계약서 B-3 `Dispatch/` 3행은
"⬜ 예약" 표기로 남기고, 통계·B 구독이 생기면 그때 §6-3 3종 세트로 정의한다.

### 스폰 — `Lane/MinionFlowService.SpawnDispatched`

`SpawnMinion` 을 그대로 재사용한다. `spec` 에 필드 4개를 더했고 기존 호출부는 `nil` 폴백이라 무변경:

| 필드 | 효과 |
|---|---|
| `fixedHp` / `fixedAttack` | 있으면 **페이즈·억제기 배율을 건너뛰고** 이 값을 쓴다 |
| `noReward` | `FarmReward` 를 **아예 안 붙이고** `MesoBase`·`CoinDropChance` 0 |
| `namePart` | 이름에 끼우는 조각. 파병은 `"D"` |

이름은 `Minion_<대상마을>_D<seq>` — 접두 `Minion_<마을>_` 를 유지해야 `DespawnVillage`(탈락 정리)가
그대로 찾는다. 진영은 일반 미니언과 같은 `10 + TeamSlot(대상마을)`.

`MinionUnit` 에 `Dispatched` / `FixedHp` / `FixedAttack` 3속성을 더해 **`Advance` 로 맵을 넘어가도**
보상 없음·고정 스펙이 유지되게 했다(이걸 안 하면 사냥터1 로 넘어가는 순간 일반 미니언 규칙으로 되돌아간다).

### 엔티티 회수 — `Lane/DefenderService.TakeUnits`

`UnitList` 에서 그 `monsterId` 의 살아 있는 개체를 최대 `qty` 마리 골라 `DefenderUnit.reported=true`
(사망 보고 차단) 후 `Destroy`. `Regroup`·`DespawnVillage` 와 같은 방식이다 — 죽은 게 아니라 옮겨간 것이다.
돌려주는 `statMul` 이 파병 유닛의 스펙이 된다.

### 접수·취소 — `Lane/LaneStateService`

`RequestDispatch(대상, n)`:
1. 검증 — 마을 있음 · 대상 ≠ 내 마을 · **대상에 주인 있음** · 페이즈 `Enabled` · `n ≤ #v.defenders`
   · `PendingCount + n ≤ VillageCap` · `MesoCost > 0` 이면 `SpendMeso`
2. `v.defenders` 앞에서 n묶음 제거(FIFO) → 묶음마다 `TakeUnits` → `Submit`.
   **원장이 아니라 실제로 빠져나간 마릿수**(`taken`)로 보낸다 — 그새 죽었을 수 있다
3. 보낸 사람 토스트 + **대상 주인에게 "내 레인에 파병이 섞였습니다 — 총량 소/중/대"**
   (GDD §4.3 정보 비대칭 — 누가·무엇을 보냈는지는 넣지 않는다)

`RequestDispatchCancel(orderId)`: 기한 검사 → `Cancel` → `SpawnBundle` 로 최전방에 재스폰 + 원장 복귀.
수비대가 가득 차 있으면 되돌릴 자리가 없어 거절한다.

`Eliminate` 에 `CancelAllOfVillage` 추가 · `dispatch` 뷰에 `V` 행의 `claimed` 열, `RULE` 행, `Q` 행 추가.

### 웨이브 훅 — `Match/MatchSessionLogic`

`SpawnWave` 직후 `DispatchService:Release(...)`. 미니언이 먼저 나가고 파병이 바로 뒤에 붙는다.
`SecondsToNextWave()` 신설(취소 기한 판정용 · 투입이 없는 페이즈면 −1).

### UI — `ui/CommonNpcGroup.ui` + `Npc/CommonNpcUIController`

사용자가 Maker 에서 좌표를 만졌을 수 있어 **UIBuilder 로 실측 후 추가만** 했다(기존 좌표 덮어쓰기 없음).

- `CartPanel/Note` 를 80 → 40 높이로 줄이고 문구 정정 — 예전 문구가 **"되돌릴 수 없음"** 이었다
- 그 아래 `QueueTitle` + `QueueRoot` + `Q_0..Q_3`(400×30 버튼 + `Label` 자식) 추가.
  행을 누르면 `RequestDispatchCancel`. 5건 이상이면 마지막 행에 "외 N건"
- 대상 목록: 주인 없는 마을은 회색 + "(주인 없음)" + 파병 버튼 잠금
- 안내문: 상한·합류 시점·취소 가능·보상 없음을 표시. 페이즈가 `Enabled=false` 면 그 문구만
- `queueRoot` UUID 는 `write({bind})` 로 주입 (`88fcaa1e…`)

### 검증 (Maker 없이 · 정적만)

- `node Docs/tools/check-integrity.cjs` → **전부 통과 · 경고 3건**(기존과 동일 · C5 2건 · C6 1건)
- `UIBuilder.validate()` → findings 0. `ui_lint` 경고 13건 중 **신규 4건은 `Q_0..Q_3` 의 L007**
  (터치 영역 < 88) — 같은 파일의 `Target_0..4`(62) · `BtnCart±`(64)와 같은 성격이라 그대로 둔다
- mlua 진단: 신규·수정 파일 **error 0** (기존 `AddComponent` 반환형 Info 는 그대로)

### 🔴 남은 것 — 아직 검증 안 됨

**Play 로그 스모크와 좀비머쉬맘 3페이즈 실측이 통째로 남아 있다.** 아래는 확인해야 할 것들이다.

1. 접수 → `v.defenders` 감소 + 마을 수비 엔티티 감소 + `[Dispatch] submit`
2. 취소 → 대기열 0 · 원장·엔티티 복귀
3. 투입 → `[Dispatch] release … spawned=N` · 대상 `LANE2` 통로에 `Minion_<대상>_D*` · 진영 1x
   · HP/공격이 수비대 스펙과 일치 · 억제기 파괴 배율이 **안** 걸리는지
4. 파병 유닛 처치 → 경험치·메소·주화 **0**
5. `Advance` 로 사냥터1 로 넘어간 뒤에도 보상 없음·고정 스펙 유지
6. `VillageCap` 초과 거절 · 주인 없는 마을 거절 · `PHASE1` 접수 거절
7. 방어자 토스트에 **총량 등급만** 들어가는지
8. 좀비머쉬맘 `2400572` 3페이즈: HP 1500×2.0=3000 · 공격 40×2.2=88 · `BossSkillRunner` off ·
   `StateChaseMonster` off · 히트박스 (0,0) 아님 · 통로 전진 · `Advance` 재스폰
