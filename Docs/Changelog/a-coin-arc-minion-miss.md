# a/coin-arc-minion-miss — 메소 동전 포물선 · 아이템 바닥 드랍 · 미니언 MISS 무반응 (PR #125 · WO-035)

**검증 보고서(영상 3편 · 캡처)**: https://claude.ai/artifact/AqckZLW6erfkBXv5nGx97o

base `main` e6fbbaa. WO-035 의 D · C 중 #122 에 못 넣었던 부분(그때 두 파일이 #121 · #120 에 잠겨 있었다). 사용자 결정 2026-09-29: #122 머지 뒤 새 브랜치로.

## 바뀐 것

| # | 증상 | 원인 | 고침 | 파일 |
|---|---|---|---|---|
| D | 사냥 드랍 동전이 튀어서 위 발판에 얹힌다 | 떨어지는 연출이 따로 없고 생성 순간 물리 힘(`AddForce` 위 2.5 · 좌우 ≤1.6) 한 번 뒤 엔진 물리에 맡겼다 | 서버가 **포물선으로 직접 옮겨 생성된 층의 발판에 내려놓는다**(사용자 결정 "원작식 포물선 연출로 교체"). 착지 x = 생성 x ± `ArcSpread` · 착지 y = 그 x 아래 발판(맵 `FootholdComponent:Raycast`). 퍼진 자리가 절벽 밖·다른 층이면 제자리 · 발판을 아예 못 찾으면 예전 물리(위로 힘은 1.2 로 낮춤). 비행 중 Rigidbody 끔 · 줍기·자석은 착지 뒤부터 | `Farm/MesoCoin.mlua` |
| C | MISS 여도 미니언·수비대·팜 몹이 밀린다 | `MonsterHit.HandleHitEvent` 가 피해량을 안 보고 넉백·경직을 걸었다 | 피해 0 은 **아무 반응 없음**(사용자 결정) — 넉백 간격(`LastKnockTime`)도 쓰지 않는다 | `Faction/MonsterHit.mlua` |

- 새 property(눈으로 맞추는 값): `ArcSeconds` 0.45 · `ArcHeight` 0.6 · `ArcSpread` 0.5 · `RestOffsetY` 0 · `ArcFloorSearch` 1.5 · `ArcSameFloorTolerance` 0.5.
- 픽파켓 동전(B 가 같은 모델로 생성)은 코드 변경 없이 같은 연출을 따른다. `Value` · `Collected` · 금액별 그림(#121)은 그대로.
- B 파일 수정 0. (계약서는 아래 "아이템 바닥 드랍" 에서 A-2-19 규칙 문구 1줄을 고친다 — #40 공지 뒤 단독.)

## 검증 (1차 — 동전 · MISS · 커밋 129cebc 까지)

- LSP 2파일 깨끗 · `check-integrity` 통과.
- 추가(사용자 결정 2026-09-29 "바닥에 다 떨어지기 전까지 안 빨려들어가게"): 물리로 떨어지는 드랍도 `IsOnGround` 가 될 때까지 줍기·자석을 막는다(`FallArmTimeout` 3초). 착지 뒤 머무는 시간은 두지 않는다.
- ✅ Maker Play 1판(2026-09-29 · 개인 월드에 이 워크트리 · 런타임 Error 0 · **실제 속도 영상 2편**). 보고서 = 허브 `handoff/검증보고서-2026-09-29-동전포물선125/`.

| 항목 | 결과(로그) |
|---|---|
| 포물선 · 죽은 층 착지 | 위 0.71 에 발판이 있는 자리(아래층 −2.87 · 위 −2.16): 발판 위에서 생성한 동전 22개(시험 16 · 평타 처치 6) 전부 `[MesoCoin] landed (…,-2.87)` · 궤적 꼭대기 y=−2.12 |
| 착지 전 줍기·자석 없음 | 비행 중 x 는 플레이어 반대쪽으로만(1.35 → 1.60) · 착지 뒤 1.48 → 0.56 → `picked` |
| 공중 드랍 | `no foothold below … physics fallback` → `falling=true` 동안 그대로 → `landed by physics (0.48,-2.21) age=0.58` → `picked` |
| 수비대 MISS | 피해 0: `staggerUntil=0.00 lastKnock=0.00` · 넉백 로그 없음 / 피해 5: `[MonsterHit] VerifyGuard knockback` |

- 못 본 것: 픽파켓 동전 · 에너지볼트 처치 드랍(#123 미포함 브랜치) · 경사 발판 · 다인 세션 · 실제 전투에서 빗나간 공격으로 본 수비대 반응(피격 함수에 이벤트를 직접 넣어 확인).
- 관찰: 레인 미니언은 `MonsterHit` 을 쓰지 않는다 — 미니언의 MISS 무반응은 #122 의 `Monster` 수정이 담당.
- 빌드 콘솔: Info 196 · Warning 1(LWA-1111 기존) · **Error 1** = `LEA-1102` `PortalNetwork.PortalSpriteSpec`(#117 에서 main 에 들어온 코드 · 이 PR 과 무관).
- 동전 모양·수치(`ArcSeconds` 0.45 · `ArcHeight` 0.6 · `ArcSpread` 0.5 · `RestOffsetY` 0)는 사용자가 영상을 보고 정한다.

## 아이템 바닥 드랍 (사용자 결정 2026-09-29 "아이템도 넣어줘")

결정: 범위 = **일반 몬스터 재료 · 엘리트 확정 드랍 · 보스 보상** · 줍기 규칙 = **동전과 똑같이** · 다 못 넣으면 **바닥에 그대로 남김** · 브랜치 = #125 에 같이.

| 무엇 | 내용 | 파일 |
|---|---|---|
| 공용 창구 | 착지점 찾기 · 포물선 · 자석 · 주인 찾기 · 드랍 생성(`SpawnItem`) · 렌더 층(`ApplyLayer`)을 한 곳에. 동전과 아이템이 같이 쓴다. `ItemsOnGround = false` 면 예전처럼 인벤토리 직접 지급(되돌리기 스위치) | `Farm/GroundDrop.mlua` (신규 · `@Logic`) |
| 아이템 드랍 | 주인만 보이고 주움(`DropOwner`) · 포물선 → 착지 뒤에만 줍기/자석 · 60초 뒤 소멸 · 덜 들어가면 남은 수량을 바닥에 두고 2초 뒤 재시도. `Kind` = `ITEM`(인벤토리) / `COIN`(빅토리아 주화 · 지갑) | `Farm/ItemDrop.mlua` (신규) · 모델 `Models/MapObjects/ItemDrop`(model_id `itemdrop`) |
| 동전 | 자체 착지 계산을 걷어내고 `GroundDrop` 을 쓴다(동작 같음) | `Farm/MesoCoin.mlua` |
| 일반몹 재료 | `DropKillItems` — 죽은 자리 바닥에. 드랍을 못 만들면 그 아이템만 직접 지급 | `Farm/DropTableLogic.mlua` · `Farm/FarmReward.mlua` |
| 엘리트 확정 드랍 | 주화 · 꿈의 조각 · 영혼석을 죽은 자리 바닥에 | `Monster/EliteSpawner.mlua` · `Farm/FarmReward.mlua` |
| 보스 보상 | 영혼석 · 최다 피해 아이템 · 선취 아이템을 보스가 죽은 자리 바닥에(주인 = 최다 피해자). **메소는 그대로 바로 지급** | `Boss/BossRewardService.mlua` · `Boss/BossSpawner.mlua` |
| 계약서 | A-2-19 규칙 문구 1줄 + 변경 이력 1행. 표의 헤더 · 열 · 행은 그대로 (#40 공지 comment 5889447561) | `Docs/스키마-계약.md` |

Play 에서 찾아 고친 것 2건:

1. **발 위 낮은 단에 얹힘** — 드랍은 발 + 0.3 에서 생기는데, 거기서 아래로 발판을 찾으니 발 바로 위 0.3 의 낮은 단(−4.25)에 착지했다. → 발판은 **죽은 몬스터의 발 높이**(생성 위치 − `SpawnLift`)부터 찾는다.
2. **착지한 드랍이 맵 그림 뒤로 숨음** — 포물선 드랍은 Rigidbody 를 꺼서 발판 층을 따라가지 않고 모델 기본 `MapLayer0` 에 남았다. 리스항구 계단 · 헤네시스 꽃밭 뒤에 가려졌다(동전 포물선 커밋 7dd1764 부터 있던 문제). → 드랍은 **`Default` 층 · OrderInLayer 3** 에 고정(`GroundDrop.DropSortingLayer`). 맵 그림 전부보다 앞 · 플레이어(`Default`/4) 뒤 · 포탈(`Default`/5) 뒤.

- B 쪽: 픽파켓 · 메소 익스플로전은 `script.MesoCoin` 만 센다 → 아이템 드랍(`script.ItemDrop`)은 거기 안 잡힌다. B 파일 수정 0.
- 아이콘이 없는 아이템 8개(지역 재화 5종 · `DREAM_PIECE` · `BRAND_SOULSTONE` · `ENERGY_CORE`)와 빅토리아 주화는 임시 그림(선물상자 `811c2843…`)으로 떨어진다. `ItemInfo.IconRUID` 가 채워지면 그 그림이 우선.
- 인벤토리는 지금 용량 제한이 없어 "가득 참" 은 실제로 생기지 않는다(코드 경로만 있음).

## 검증 (2차 — 최종 코드 · 2026-09-29 Play)

- LSP 깨끗 · 빌드 콘솔 Error 1 / Warning 1 = 둘 다 기존(`PortalNetwork` `LEA-1102` · `LWA-1111`). 런타임 Error 0 (Info 2619 · Warning 17).
- 영상 3편(실제 속도) + 캡처 3장 = 허브 `handoff/검증보고서-2026-09-29-동전포물선125/`.

| 항목 | 결과(로그) |
|---|---|
| 평타 처치 → 동전 + 재료 | 주황버섯 3마리: 동전 9개 전부 `landed (…,-4.55)` · `[Drop] … -> inventory[] ground[주황버섯 재료 x1 · 힘의 결정 x1]` · `[ItemDrop] landed` → `picked` |
| 위에 발판이 있는 자리 | 바닥 −4.55 · 위 0.9 에 발판(−3.65): 동전 8 + 아이템 6 전부 `landed (…,-4.55)` → 1초 안에 `picked` |
| 발 위 낮은 단 | `floor from feet=-4.549` / `from spawn height=-4.249` → 보정 뒤 동전 6 + 아이템 2 전부 −4.55 |
| 착지 뒤에만 줍기 | 모든 드랍에서 `landed` 가 `picked` 보다 먼저. 발 밑에 떨어진 드랍도 착지 뒤에 들어온다 |
| 엘리트 확정 드랍 | `[Elite] drops … coin=2 dream=2 soulstone=1 ground=3 direct=0` → 꿈의 조각 0→2 · 영혼석 0→1 |
| 보스(마노) | 피해 938 로 처치 → `[BossReward] … first=true ground=1` → `landed ARMOR_HP_LV10` → `picked` · 갑옷 0→1 |
| 공중 드랍(아래 1.5 안에 발판 없음) | `physics fallback` → `landed by physics (0.33,-2.20) age=0.58` · 아이템 `(0.85,-2.32) age=0.60` → `picked` |
| 렌더 층 | 서버 · 클라 모두 `Default/3` · 리스항구 계단 앞 / 헤네시스 꽃밭 앞에 보임(캡처). 고치기 전 `MapLayer0/3` 은 같은 자리에서 가려짐(캡처) |
| 수비대 MISS | 피해 0: 넉백 로그 없음 / 피해 5: `[MonsterHit] … knockback` |

- 못 본 것: 픽파켓 동전 · 에너지볼트 처치 드랍(이 브랜치엔 #123 없음) · 경사 발판 · 다인 세션(남의 드랍이 안 보이는지) · 인벤토리가 덜 들어가는 경우 · 60초 소멸을 끝까지 기다린 것은 아이템 1종뿐 · 보스는 서버에서 플레이어 명의 피격 이벤트로 잡았다(평타가 소환몹에 먼저 맞아서).
- 관찰: 평타로 잡으면 드랍이 발 밑(줍기 반경 0.8 안)에 떨어져 착지 즉시 들어온다 — 포물선은 0.45초만 보인다. 드랍 모양 · 수치는 사용자가 영상을 보고 정한다.

## 착지 뒤 0.3초 유예 · 꿈의 조각 아이콘 (사용자 결정 2026-09-29 밤)

| 무엇 | 내용 | 파일 |
|---|---|---|
| 착지 뒤 유예 | 착지한 뒤 **0.3초** 동안은 줍히지도 끌려가지도 않는다("바로 먹으니까 안 보인다"). 동전 · 아이템 공용 값 `GroundDrop.LandHoldSeconds`. 앞서 "머무는 시간은 두지 않는다" 던 결정을 바꾼 것 | `Farm/GroundDrop.mlua` · `Farm/MesoCoin.mlua` · `Farm/ItemDrop.mlua` |
| 꿈의 조각 그림 | `ItemInfo` `DREAM_PIECE` 행의 `IconRUID` 를 원작 아이콘 `1598d8d8bd2e4068b5b555f47645df7d`(24×24)로 채움 → 바닥 드랍 · 인벤토리 모두 그 그림. `#Note` 에 설명 문구("꿈으로 가득 차 있는 조각이다. 수비대 몬스터를 강화하는데 사용된다.")를 적어 둠 | `ItemInfo.csv`(행 1개 · 헤더 그대로) |
| 그림 고르기 보강 | 드랍이 생긴 직후 `ItemId` 가 아직 비어 있는 틱에 임시 그림으로 굳던 것 → `ItemId` 가 채워진 뒤에 고른다 | `Farm/ItemDrop.mlua` |

검증(Play · 런타임 Error 0):

| 항목 | 결과(로그) |
|---|---|
| 발 밑에 떨어진 드랍 | `[MesoCoin] picked +meso 60 … after=0.32` ×2 · `[ItemDrop] picked ITEM GEM_DIAMOND x1 … after=0.32` — 착지 뒤 0.3초가 지나야 들어온다 |
| 2칸 옆(자석) | 착지 `age=0.48` → `age=0.75` 까지 `x=1.806` 그대로 → `age=0.86` 부터 끌려옴 → `picked … after=0.82` |
| 공중 드랍 | `landed by physics (0.72,-4.55) age=0.62` → `picked +meso 77 … after=0.34` |
| 꿈의 조각 | `[ItemDrop] ITEM DREAM_PIECE x2 sprite 1598d8d8…` · 캡처에서 파란 조각으로 보임. 엘리트 확정 드랍 경로에서도 같은 그림 → `picked ITEM DREAM_PIECE x2 … after=0.60` |

- **영상 3편은 유예를 넣기 전에 찍은 것이다**(사용자: 다시 찍을 필요 없음). 영상에서는 착지 즉시 들어오지만 지금 코드는 0.3초 뒤에 들어온다.
- 아이템 설명을 게임 안에 보여 주는 칸은 아직 없다(`ItemInfo` 에 설명 열이 없고 툴팁에도 자리가 없음). 넣으려면 헤더 변경(공지 후 단독)이라 따로 진행.
- 임시 그림(선물상자)으로 남은 것: 지역 재화 5종 · `BRAND_SOULSTONE` · `ENERGY_CORE` · 빅토리아 주화.
