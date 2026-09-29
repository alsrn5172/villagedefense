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
- 아이템 설명 칸은 아래 절에서 추가했다.

## 아이템 설명 열 · 툴팁 · 영혼석 그림 (사용자 지시 2026-09-29 밤)

사용자: "설명칸 있어야 함 · #40 공지는 안 해도 됨(내가 하는 것) · csv 로 관리하면서 툴팁에 넣는다."

| 무엇 | 내용 | 파일 |
|---|---|---|
| 설명 열 | `ItemInfo` 맨 뒤에 `Description` 1열(빈칸 허용 · 쉼표·큰따옴표·줄바꿈 금지). 값 1건 = `DREAM_PIECE` "꿈으로 가득 차 있는 조각이다. 수비대 몬스터를 강화하는데 사용된다." (`#Note` 는 원래 메모로 되돌림) | `ItemInfo.csv`(헤더 + 148행) · `Docs/스키마-계약.md` · `Docs/tools/check-integrity.cjs`(정본 헤더) |
| 읽기 | `ItemCatalog` 가 `desc` 로 읽는다 | `Item/ItemCatalog.mlua` |
| 툴팁 | 인벤토리 hover 툴팁에 설명 글자 칸 `Tooltip/Desc` **추가**(기존 칸의 좌표·크기는 그대로). 보이는 능력치 행 바로 아래에 놓고, 내용이 기본 높이(300)를 넘을 때만 툴팁을 아래로 늘린다. 설명이 빈 아이템은 예전 툴팁 그대로 | `ui/CharacterGroup` · `Item/InventoryUIController.mlua`(`tipDesc` · `LayoutTipDesc`) |
| 영혼석 그림 | `BRAND_SOULSTONE.IconRUID` = 원작 "뒤틀린 낙인의 영혼석" `a1e0a94017b54c78a5fa70e466d75187`(36×36). 원작 자료에 "낙인의 영혼석" 이라는 이름 그대로는 없고 "희미한"(24×24) · "뒤틀린"(36×36) 두 가지가 있다 | `ItemInfo.csv`(행 1개) |
| 주인이 그 맵에 없을 때 | `GroundDrop.SpawnItem` 이 주인이 같은 맵에 없으면 드랍을 만들지 않는다 → 부르는 쪽이 예전처럼 직접 지급. 보스 보상의 주인은 최다 피해자라 죽어서 마을로 돌아간 사람일 수 있다(Codex 검토 2회 모두 지적) | `Farm/GroundDrop.mlua` |

검증(Play · 런타임 Error 0 · 빌드 Error 1 / Warning 1 = 기존):

| 항목 | 결과 |
|---|---|
| 설명 읽기 | 서버·클라 모두 `catalog desc=꿈으로 가득 차 있는 조각이다. …` |
| 툴팁(꿈의 조각) | `desc enable=true desc pos=12,-86 desc size=296x31` · 툴팁 320×300 · 캡처에서 이름·요구 아래 2줄로 보임 |
| 툴팁(장비 · 설명 없음) | `WEAPON_CLUB`: `desc enable=false` · 툴팁 320×300 (예전과 같음) |
| 영혼석 그림 | `[ItemDrop] ITEM BRAND_SOULSTONE x1 sprite a1e0a940…` · 캡처에서 분홍 구슬로 보임 |
| 주인이 다른 맵 | `[GroundDrop] owner not in LithHarbor_Boss_Mano — direct give (…)` ×4 · `[Elite] drops … ground=0 direct=3` · 꿈의 조각 0→2 · 영혼석 0→1 · 갑옷 0→1 |
| 주인이 같은 맵 | `[Elite] drops … ground=3 direct=0` → `landed` → `picked … after=0.37 / 0.49 / 0.88` |

Codex 교차 검토 2회(gpt-5.6-terra · xhigh · 읽기 전용): 지적 4종 중 1종 반영.

| 지적 | 처리 |
|---|---|
| 주인이 맵에 없으면 드랍이 60초 뒤 사라져 보상 유실(High · 2회 모두) | **반영**(만들 때 주인이 없으면 직접 지급). 떨어진 뒤 주인이 떠나는 경우는 동전과 같은 규칙(60초 소멸)이라 그대로 — 바꿀지는 사용자 결정 |
| 물리로 떨어지는 드랍이 3초 뒤엔 공중에서도 착지로 처리(Medium) | 그대로 — 바닥에 끝내 안 닿는 드랍이 못 줍는 채로 남는 것을 막는 장치 |
| 발판 탐색이 발보다 0.2 위에서 시작(Medium) | 그대로 — 발 높이의 발판을 잡으려는 여유. 0.2 이내 단차는 그 자리의 실제 바닥 |
| 발밑엔 발판이 없고 옆엔 있을 때 옆으로 착지(Low) | 그대로 — 0.5 이내 가장 가까운 바닥에 내려놓는다 |

- 못 본 것: 능력치 5행 + 내구도 + 긴 설명이 함께 있는 장비 툴팁(설명이 든 장비가 아직 없다) · 장비 탭 상세 패널에는 설명 칸을 넣지 않았다.
- 관찰: 재료 아이템 툴팁에도 "Lv0 · 전직업" 과 빈 내구도 막대가 나온다(예전부터). 재료에서는 숨길지 사용자 결정.
- 임시 그림으로 남아 있던 7종은 아래 절에서 사용자가 고른 그림으로 채웠다.

## 아이콘 8종 — 사용자 선택 (2026-09-30)

후보(허브 `handoff/아이콘후보-2026-09-29/` · 원작 아이템 그림 검색)에서 사용자가 번호로 골랐다.

| 아이템 | 고른 그림(원작 이름) | RUID | 넣은 곳 |
|---|---|---|---|
| `REGION_HENESYS_SPORE` 헤네시스 포자 | 변종포자 32×28 | `ca8302951ab946f38fd1356c6c05aa0c` | `ItemInfo.IconRUID` |
| `REGION_KERNING_THIEF_COIN` 도둑 주화 | 도적의 마음 조각 28×24 | `2944213d2ae24c6e832bb4e5ddcfec83` | `ItemInfo.IconRUID` |
| `REGION_ELLINIA_SPIRIT_DUST` 정령 가루 | 반짝이는 가루 32×32 | `76ccbef909b8489f883036729c71ac18` | `ItemInfo.IconRUID` |
| `REGION_NAUTILUS_PIRATE_COIN` 해적 주화 | 페페 코인 32×32 | `162c79878ef54f0db85101b160ade8d0` | `ItemInfo.IconRUID` |
| `REGION_PERION_WARRIOR_TOKEN` 전사의 증표 | 용맹의 훈장 28×28 | `89af078f94b14eac81056015922efb0b` | `ItemInfo.IconRUID` |
| `ENERGY_CORE` 에너지 코어 | (이름 없음) 파란 고리 32×36 | `4570b3929b524c19b1f4c60d4a4c7c95` | `ItemInfo.IconRUID` |
| `BRAND_SOULSTONE` 낙인의 영혼석 | 뒤틀린 낙인의 영혼석 36×36 | `a1e0a94017b54c78a5fa70e466d75187` | `ItemInfo.IconRUID`(앞 커밋 그대로) |
| 빅토리아 주화(지갑 재화 · 표에 행 없음) | (이름 없음) 금빛 주화 28×28 | `184093654538492ea60617c0e3dd5c51` | `Farm/ItemDrop.mlua` `CoinSprite` |

- 이제 `ItemInfo` 148행 전부 아이콘이 있다(`catalog items=148 icon empty=0`). 임시 그림(선물상자)은 새 아이템이 아이콘 없이 들어왔을 때만 나온다.
- 검증(Play · 런타임 Error 0): 9종을 바닥에 세워 놓고 캡처 — 로그의 `ruid` 가 위 표와 같고, 캡처에서 9개 모두 제 그림으로 보인다.
- 빅토리아 주화 그림은 **바닥 드랍에만** 쓴다. 화면의 주화 표시(지갑 · 상점)는 건드리지 않았다.

## 장비를 원작 실제 세트로 · 15제 신설 · 한벌옷 · 보스 전용 장비 (WO-036 · 사용자 지시 2026-09-30)

사용자 지적: 직업 장비가 원작에 없는 이름("전사의 청동 검")에 엉뚱한 캐시템 그림이라 **이름과 생김새가 안 맞는다.** → 원작에 실제로 있는 장비로 바꾼다. 이 브랜치(#125)에서 같이 한다(사용자 결정).

| 결정 | 내용 |
|---|---|
| 단계 | 우리 10제 = 원작 10제 · **15제(신설) = 원작 50제** · 20제 = 원작 70제 · 30제 = 원작 100제 |
| 한벌옷 | 상의 칸에 넣고 그 세트의 하의는 없앤다. 한벌옷 = 상의 + 하의를 합친 가격 · 방어력 · 내구도 · 강화 |
| 보스 장비 | 에테르넬 5부위 — 머리 = 엘리니아 · 상의 = 페리온 · 하의 = 노틸러스 · 장갑 = 헤네시스 · 신발 = 커닝시티. 30제보다 좋게 · 올스탯 · 점프력 +5% · 매치당 1회(선취) |

| 무엇 | 내용 | 파일 |
|---|---|---|
| 직업 장비 | 99행의 이름 · 아이콘 · `AvatarSlot` 을 원작 장비로 교체(ItemId 는 그대로). 고른 기준 = 원작 자료(maplestory.io KMS)에서 직업 · 레벨이 맞고 캐시가 아니며 게임 리소스에 같은 이름이 있는 것 | `ItemInfo.csv` |
| 15제 | 33행 신설(`<부위>_<직업>_T15`). 수치 · 내구도 · 판매가 = 10제와 20제의 가운데. 제작 33행 신설(비용도 가운데) | `ItemInfo.csv` · `CraftRecipe.csv` |
| 한벌옷 | 궁수 · 마법사 15 · 20 · 30제 · 도적 30제 · 해적 전 단계. `TOP_*` 행이 한벌옷(`AvatarSlot = LONGCOAT` · 수치 = 상의 + 하의) · `BOTTOM_*` 행과 제작 행은 `Enabled = false`(행은 남김) · 제작 비용 = 상의 + 하의 | `ItemInfo.csv` · `CraftRecipe.csv` |
| 한벌옷 코드 | 입으면 하의 자동 해제 · 하의를 입으면 한벌옷 자동 해제(두손무기 ↔ 방패와 같은 방식) · 아바타 `CustomLongcoatEquip` · 강화 상승치와 강화 비용 ×2(`PieceCount`) · 업적 "전 부위 최대 강화" 는 한벌옷이면 하의 칸을 채운 것으로 봄 | `Item/ItemCatalog` · `Item/EquipService` · `Item/AvatarLookService` · `Item/EnhanceService` · `Item/WorkshopUIController` · `Npc/VillageRecordUIController` · `Progression/AchievementService` |
| 아대 · 너클 | 원작 그림이 두손 무기 분류라 `AvatarSlot = TWO_HAND` 로 바뀜(전엔 한손) | `ItemInfo.csv` |
| 보스 장비 | `BOSS_<부위>_ETERNAL` 5행. 방어력 = 30제 × 1.3 · STR/DEX/INT/LUK +5 · 점프 +5 · 직업 제한 없음 · `ReqLevel 20`. `BossReward` 5지역 보스 행에 선취(`FirstClaimOnce = true`) | `ItemInfo.csv` · `BossReward.csv` |
| 파워 엘릭서 | 원작과 같은 그림("도전자의 엘릭서" `08d3b8d1…`)으로 교체. 엘릭서(분홍 병)는 게임 리소스에 없어 그대로 | `ItemInfo.csv` |

검증(Play · 런타임 Error 0 · 빌드 Error 1 / Warning 1 = 기존):

| 항목 | 결과(로그) |
|---|---|
| 한벌옷 ↔ 하의 | 하의 → 한벌옷: `equip BOTTOM: i9 ->` + "한벌옷이라 하의를 해제했습니다" · 한벌옷 → 하의: `equip TOP: i8 ->` + "하의를 입어 한벌옷을 해제했습니다" |
| 한벌옷 외형 | `costume longcoat=437699… coat= pants=` · 모험가 외형 위에 궁수 20제 세트가 입혀진 캡처 |
| 한벌옷 수치 | `TOP_ARCHER_T20` def=14(= 7 + 7) · 강화 +1: 한벌옷 `fixed def=2 gem maxhp=60` / 일반 상의 `1 · 30` |
| 보스 장비 능력치 | 5부위 착용: `final str=37 dex=30 int=29 luk=29 defense=77 jump=125` |
| 보스 선취 | 에피네아 처치 → `[BossReward] … first=true ground=2` → `landed BOSS_HAT_ETERNAL` → `picked` · 같은 매치에서 다시 처치 → `first=false`(모자 없음) |
| 15제 | `TOP_WARRIOR_T15` req=15 def=6 · `WEAPON_WARRIOR_T15` 제작 650메소 + 증표 10 |

- 🔴 **장갑 · 신발 그림은 미정**: 에테르넬은 게임 리소스에 모자 · 상의 · 하의만 있다(원작 자료 KMS 389 에도 장갑 · 신발 없음). 이름은 사용자 지시대로 **에테르넬 장갑 · 에테르넬 신발**(아래 절). 그림은 다른 세트 것이 임시로 들어 있다 — 사용자 선택을 받아 바꾼다.
- 못 본 것: 아대 · 너클을 두손 분류로 바꾼 뒤의 공격 모션(에러는 없음 · 눈 확인 필요) · 다른 직업 · 단계 세트의 착용 모습(궁수 20제와 보스 장비만 캡처) · 15제 제작을 상점에서 실제로 해 보기 · 여자 외형에 남자용 옷.
- 수치(15제 가운데 값 · 보스 장비 방어력 ×1.3 · 올스탯 +5 · `ReqLevel 20` · 판매가)는 초기값이다.
- 아이템 설명 초안은 새 이름으로 다시 뽑아야 한다(작업대).

## 캐릭터 창: 장비 + 인벤토리 한 화면 · 내구도 표기 삭제 · 장비칸 마우스 올림 (사용자 지시 2026-09-30)

사용자 지시: "수리는 없으니까 내구도는 안 쓴다. 표기도 하지 마" · "장비창에서도 마우스 올리면 정보가 나와야 해. 클릭해서 나오는 게 아니다" · "장비창과 인벤토리창 합쳐서 왼쪽은 장비칸, 오른쪽에 인벤토리" · "보스가 주는 장갑과 신발은 에테르넬".

| 무엇 | 내용 | 파일 |
|---|---|---|
| 탭 | 3개(스탯 · 장비 · 인벤토리) → **2개(스탯 · 장비 · 인벤토리)**. 둘째 탭이 왼쪽 장비칸 + 오른쪽 인벤토리를 같이 켠다 | `ui/CharacterGroup` · `Stat/StatUIController` |
| 배치 | 장비칸 상자 455 → 400 폭(칸 위치는 그대로) · 인벤토리 920 → 520 폭 **9열 → 5열** · 분류 버튼 176 → 126 폭 | `ui/CharacterGroup` |
| 정보 | 장비칸에 마우스를 올리면 인벤토리와 같은 툴팁(칸 오른쪽 위 · 넘치면 왼쪽). 옛 상세 패널(클릭해서 보던 것 · 해제 버튼)은 삭제 | `Item/InventoryUIController` · `ui/CharacterGroup` |
| 해제 | **장비칸 클릭 = 해제**(인벤토리 칸 클릭 = 장착과 짝). 빈 칸은 아무 일 없음 | `Item/InventoryUIController` |
| 내구도 | 툴팁의 내구도 막대 · 글자 삭제. 툴팁 높이는 내용(능력치 행 + 설명)에 맞춘다. 표의 `MaxDurability` 열은 남김(안 씀) | `Item/InventoryUIController` · `ui/CharacterGroup` · `Docs/스키마-계약` |
| 보스 장갑 · 신발 | 이름 = **에테르넬 장갑 · 에테르넬 신발** | `ItemInfo.csv` |

검증(Play · 런타임 Error 0 · 빌드 Error 1 / Warning 1 = 기존):

| 항목 | 결과(로그) |
|---|---|
| 합친 탭 | `[CharUI] tab=1` → 장비칸 · 인벤토리 둘 다 켜짐 · 장비칸 상자 `pos=-270,0 size=400x430` · 그리드 `pos=205,-32 size=520x376 cols=5` · 탭 `468x56` 2개 · 캡처 |
| 장비칸 툴팁 | `[InvUI] tooltip slot GLOVES (BOSS_GLOVES_ETERNAL)` 이름 "에테르넬 장갑" · 빈 칸(무기)은 꺼짐 · 모자 툴팁 `320x130`(방어력 1행) |
| 내구도 | 툴팁 · 장비칸에 내구도 노드 없음(`dur=false detail=false`) |
| 클릭 = 해제 | `[InvUI] unequip requested: SHOES` → 서버 `[Item] equip SHOES: i13 ->` → 장착 목록에서 빠짐 |
| 인벤토리 툴팁 | 꿈의 조각 `320x129 desc=true`(설명 2줄 · 내구도 자리 없음) |

- 못 본 것: **실제 마우스로 올렸을 때** — Maker 의 마우스 흉내는 올림 이벤트를 못 일으킨다(전부터 되던 인벤토리 칸도 도구로는 안 뜬다). 장비칸에 올림 · 나감 · 클릭 이벤트를 직접 보내 확인했고, 장비칸은 인벤토리 칸과 같은 부품(버튼 + 터치 받기 + 레이캐스트)을 달았다. 사용자 눈 확인 필요.
- 배치 수치(폭 · 열 수)는 초기값이다. 디자인은 임시.
