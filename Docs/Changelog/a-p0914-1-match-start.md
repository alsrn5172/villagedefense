# a/p0914-1-match-start (B1 · 통합 브랜치 `a/plan-0914` · base `a/p0914-0-contract` 위 stacked)

9/14 기획 반영 첫 코드 묶음 — 매치 시작 규칙. 정본: 허브 `WorkOrders/WO-027` §9-0 · `WO-029` B1. **`ConsumeInfo` 헤더 변경 포함**(#40 comment 5776547020 공지).

## 바뀐 것

| 항목 | 내용 | 파일 |
|---|---|---|
| 경험치·재화 주인 = **막타** | WO-014 의 누적 피해 최다 → 마지막으로 때린 플레이어. 막타가 플레이어가 아니면 보상 없음(방치 파밍 차단 유지). 누적 원장은 로그용으로만 | `Farm/FarmReward.mlua` (`LastHitter`) |
| 리스항구 리젠 5초 | 리스항구 4맵 65행 `RespawnSeconds` 10 → 5. 그 외 10 유지 | `MapMonsters.csv` |
| 리스항구 입장 차단 4:30~ | 밖(여섯갈래길)→리스항구 노선(`L05B`)은 발록 방처럼 바인딩하지 않고 ↑키 → 서버 `RequestEnterLith` 가 `MatchSessionLogic.CurrentPhaseName` 이 `PHASE0-1`/`PHASE0-2` 일 때만 옮긴다. 나가는 노선은 그대로 | `PortalNetwork.mlua` (`LithMapPrefix` · `LithOpenPhases` · `IsLithEntry` · `IsLithOpen`) |
| 시작 지급 | 몽둥이 · 두건 · 상의 · 하의 · 장화 + 빨강/파랑 물약 5. 방패·장갑·다이아 5·헤네시스 포자 12 제거. 시작 메소 **100**(`SummonManager.StartMeso`) | `Item/InventoryService.mlua` · `Summon/SummonManager.mlua` · `ItemInfo.csv`(`WEAPON_CLUB`) |
| 마노 선취 보상 | `ARMOR_HP_LV10`(TOP · Lv10 · HP +200 · 공격·방어 0) 새 행 + 500메소 | `ItemInfo.csv` · `BossReward.csv` |
| 물약 5단계 | 주황 150·150 / 하얀 300·500 / 엘릭서 50%·3,000 / 파워 엘릭서 100%·9,000. `ConsumeInfo += HealHpPct,HealMpPct`(비율 회복). **HP 회복 소모품은 한 쿨 묶음("HP")** — 종류를 바꿔 쿨을 우회하지 못한다 | `ItemInfo.csv` · `ConsumeInfo.csv` · `ShopItem.csv` · `Item/ItemCatalog.mlua` · `Item/InventoryService.mlua` (`CooldownKey`) |
| 리스항구 공용 물약 상인 | `VD_SHOP_POTION_NOVICE`(PUBLIC) · 빨강·파랑만(`ShopKey=POTION_NOVICE`). 마을 상인은 5단계 전부(`POTION`). 클라 목록·서버 구매 검증 둘 다 `ItemCatalog.PotionShopKeyOfMap` | `FunctionalNpcCatalog.csv` · `MapNpcs_Village.csv` · `Models/Npcs/VD_SHOP_POTION_NOVICE`(복제) · `Item/WorkshopUIController.mlua` · `Item/ShopService.mlua` |
| 리스항구 전직 교관 | `VD_COMMON_JOB_CHANGE`(PUBLIC · `NpcRole` 신설) · 클릭 → `CommonNpcUIController` `jobchange` 라우트 → B 의 `SkillWindowLogic.Toggle()`(훅 한 줄 · B 파일 무수정) | `FunctionalNpcCatalog.csv` · `MapNpcs_Village.csv` · `Models/Npcs/VD_COMMON_JOB_CHANGE`(복제) · `Npc/CommonNpcUIController.mlua` |
| 계약·검사 | §0-2 `NpcRole += COMMON_JOB_CHANGE` · A-2-8c `ConsumeInfo` 헤더 등록 · A-2-8 17행 · CANONICAL `ConsumeInfo` | `Docs/스키마-계약.md` · `Docs/tools/check-integrity.cjs` |

- 새 NPC 두 개의 위치(리스항구 기존 NPC 9010022 의 양옆 8.30 / 13.30)와 그림(기존 모델 복제)은 **눈으로 확인 뒤 조정** 대상. 그림은 사용자가 일괄 제공할 때 교체.
- `MonsterInfo.Attack`·Exp·메소 실값은 B2(평타 실측 뒤). 여기서는 건드리지 않았다.

## 검증

- `node Docs/tools/check-integrity.cjs` 통과 여부는 PR 본문.
- 런타임(개인 월드에 워크트리 물려 Reimport All · TEST 프로필): `[Item] match kit given: club+4armor` · `[FarmReward] … lasthit=` · `[PortalNetwork] gated L05B` + 270초 뒤 `lith entry denied` · `[Item] potion cooldown key=HP` · `[Item] buy denied shopKey=POTION expected=POTION_NOVICE`(리스항구에서 주황 구매 시도) · 리스항구 NPC 2종 스폰 로그.
