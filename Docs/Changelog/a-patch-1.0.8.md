# a/patch-1.0.8 — 테섭 릴리즈 뒤 조정

## 1. 시설 강화 비용 계단식 (누적 주화 3배 · 사용자 2026-10-14)

- `TowerConfig.csv` `UpgradeCost`(다음 단계로 가는 비용): 1 ~ 3단계 / 4 ~ 6단계 / 7 ~ 9단계 = 포탑 · 넥서스 6 / 18 / 36(총 180 · 예전 60) · 억제기 9 / 27 / 54(총 270 · 예전 90) · 10단계 0. 포탑 공격력이 5단계(2페이즈)와 8단계(3페이즈)에서 크게 뛰는 것에 맞춘 계단. 값만 바꿈(헤더 · 다른 칸 그대로 · 스크립트 `handoff/patch107-agents/_work/P/set-facility-cost.cjs`).

## 2. 구조물 피해 10% (사용자 2026-10-14 · 구조물 = 포탑 · 억제기 · 넥서스)

- `LaneFacility.PlayerStructureDamageMul` 0.1 · `StructureDamageMulOf(player)`(직업 패시브 "구조물 피해 +p" 자리 · 지금은 기본값) · `HandleHitEvent`: 플레이어 피해 = floor(피해 × 배리어(미니언 없으면 `NoMinionDamageMul` 0.05) × 0.1) · 최소 1. 페리온 억제기 반사는 배리어까지만 적용한 값(`reflectBase`) 기준 — 예전 반사량 유지. 튜토리얼 문구는 안 바꿈(사용자).

## 3. 강화 시 HP 더하기 (사용자 2026-10-14)

- `LaneStateService.RequestTowerAction` upgrade: 새 HP = min(새 최대, 강화 전 HP + (새 최대 − 강화 전 최대)) — 예전(1.0.7) 강화 전 HP 비율 유지를 대체. 수리비(부족한 HP × `RepairCostPerHp` 올림)는 이미 부족한 만큼 비례라 그대로.

## 4. 강화 비용 2배로 · 파괴 시 1단계 · 미니언 주화 50% → 100% (사용자 2026-10-14)

- `TowerConfig.csv` `UpgradeCost` 3배 → 2배: 포탑 · 넥서스 4 / 12 / 24(총 120) · 억제기 6 / 18 / 36(총 180). 수리 · 재건 비용은 그대로(사용자 "재료 배수는 강화만").
- `LaneStateService.ApplyDamage` 파괴 → `t.lv = 1`(테스트 리모콘 파괴도) — 재건하면 1단계.
- `MatchSessionLogic.WaveCoinChance`: 웨이브 미니언 주화 확률 = 매치 경과 7:30 50% → 30:00 100% 직선(`CoinRamp*` 속성 · 결과 ÷ `SummonManager.VictoriaCoinMul` 을 넘김 · MinionUnit 식 그대로). 튜토리얼은 `CoinChanceOf("PHASE1")` 그대로. 자이언트 주화 그대로.

## 5. 억제기 강화 비용 = 포탑 (사용자 2026-10-14)

- `TowerConfig.csv` SUPPRESSOR `UpgradeCost` 6 / 18 / 36 → 4 / 12 / 24(총 120 · 포탑 · 넥서스와 같음).

## 6. 억제기 반사 = 실제로 받은 피해 · 미니언 주화 100% = 45:00 (사용자 2026-10-14)

- `LaneFacility.HandleHitEvent`: 페리온 억제기 반사 = 실제로 받은 피해(구조물 피해 10% · 배리어 적용 뒤) × 배율(`reflectBase` 삭제 · 처음엔 10% 전 값이었다).
- `MatchSessionLogic.CoinRampEndSec` 1800 → 2700(미니언 주화 확률 7:30 50% → 45:00 100% 직선).

## 7. 강화 비용 티어제 (사용자 2026-10-14 · 위 계단안 대체)

- `TowerConfig.csv` `UpgradeCost`(Level 1 ~ 9 = 다음 단계로) = 3 · 3 · 3 · 21 · 5 · 5 · 50 · 15 · 15(총 120) — 포탑 · 억제기 · 넥서스 모두. 1티어 1 ~ 4단계 · 2티어 5 ~ 7단계 · 3티어 8 ~ 10단계 · 누적 9 → 30 → 90 → 120.

## 8. 티어 경계 · 강화 / 보강 (사용자 2026-10-14)

- `LaneStateService.FacilityArtGrade` 1 ~ 4 / 5 ~ 7 / 8 ~ 10(예전 1 ~ 3 / 4 ~ 7 / 8 ~ 10) — 공격 연출 · 성장 점수가 따라감. `UpgradeWord(fromLv)` 새로(티어가 바뀌면 "강화" · 아니면 "보강") — 완료 · 막힘 토스트 · `VillageDefenseUIController` 강화 버튼 글자.

## 9. 구조물 티어 수치 · 피해 12% · 위치 바로잡기 2배 (사용자 2026-10-14)

- `TowerConfig.csv` `MaxHp` · `Attack`(포탑만 공격): 포탑 HP 30,000 → 77,800 · 공격 200 → 12,750(1티어 200 · 300 · 400 · 520 / 2티어 2,665 · 2,800 · 2,950 / 3티어 11,570 · 12,150 · 12,750) · 억제기 · 넥서스 HP 는 포탑과 같은 비율(스크립트 `handoff/patch107-agents/_work/P/set-facility-stats.cjs`).
- `LaneFacility.PlayerStructureDamageMul` 0.1 → 0.12.
- `PlayerSafetyNet` `BoundMargin` · `BoundMarginTop` 1.0 → 2.0 · `AirLimitSeconds` 4 → 8.

## 10. ★1 사냥 경험치 +20% (사용자 2026-10-14)

- `DifficultyRule.csv` ★1 `MATCH_EXP_MUL` 2 → 2.4.

## 11. 헤네시스 마을 미니언 레인 −1.69 → −3.34 (사용자 2026-10-14)

- `map/Henesys_Village_MinimiMain`: LaneFloor_L/R/Mid_0~3 · LaneGround_1/4/6/7 · `P_Lane_To_Henesys_Hunt_HillNorth` y −1.65(스크립트 `handoff/patch107-agents/_work/P/shift-entities-y.cjs` · 숫자만 교체 · 파싱 검증) · 사용자 Maker 편집: 사다리 `Ladder_low_1` · `Ladder_low_2` TiledSize 2 → 6 · 저장으로 레인 발판(LaneGround_4) −3.34 구움.
- `LaneConfig.csv` HENESYS VILLAGE `PathY` · `TowerSlotY` −1.69 → −3.34.

## 12. 넥서스 분신 약화 · 긴급 (사용자 2026-10-14)

- `Lane/NexusCloneService`: P3-ZOMBIE 기준 계산(HpBaseMul · AtkMul · TemplateWaveKey · Fallback* · ZombieTemplate) 삭제 → 강화 단계 선형 `ByGrade` · HP 900,000 → 1,500,000 · 공격력 1,000 → 2,000 · 방어력 10 → 30 · 소환체 공격력 500 → 1,000(`GradeMax` 10). `OnCoreDamaged` / `SpawnClone` 에 grade 인자 · 소환체 공격력은 분신 `CloneSkillBrain.Ov.summonAttack` 에 적는다.
- `Lane/LaneStateService`: `OnCoreDamaged(..., t.lv)` 강화 단계 넘김. `Lane/CloneSkillBrain` · `Lane/DefenderService.SpawnSummons(..., attack)`: 소환체 공격력 덮어쓰기(0 = 3티어 표).
- (2026-10-15) 분신 HP `HpAtGrade1` 450,000 · `HpAtGradeMax` 750,000(절반). 분신 보스 판정 = `CloneSkillBrain` 보유: `StatService.ResolveTarget` 회피 `BossAvoidPct` · `Monster.ReactToHit` 보스 반응(돌아보기 없음 · 1% 미만 피해 안 밀림) · `SkillExecutors` 도발 끌기 제외 · `SkillAttack` 보스 우선 표적.

## 13. 포탑 플레이어 피해 100% (사용자 2026-10-15)

- `Lane/LaneFacility`: `PlayerTowerDamageMul` 1.0 · `StructureDamageMulOf` 가 Stage TOWER 면 그 값 · 억제기 · 넥서스는 `PlayerStructureDamageMul` 12% 그대로.
- (2026-10-15 이어서) 억제기 · 넥서스도 100%: `PlayerStructureDamageMul` 0.12 → 1.0 · 포탑 전용 `PlayerTowerDamageMul` 삭제(사용자 "빈집털이가 안 됨"). 배리어(미니언 없을 때 5%)는 그대로.

## 14. 마을 택시 · 마을 귀환 주문서 · 퀵슬롯 3칸 (사용자 2026-10-15)

- 마을 택시: `FunctionalNpcCatalog` VD_VILLAGE_TAXI(OWNER_ONLY · RECORD 2번 · route sixpath) · 모델 `Models/Npcs/VD_VILLAGE_TAXI`(id vd_village_taxi · 원작 npc/1012000 stand 클립 5b48980b…) · `CommonNpcUIController.OpenTaxiTalk` → `NpcTalkController.ShowTaxi`(page taxi · 초상 TaxiPortrait 128×88) → `LaneStateService.RequestSixPathTaxi`(내 마을 맵 · SpendMeso `SixPathTaxiCost` 5000 · `SixPathMapName` SpawnLocation).
- 마을 귀환 주문서: ItemInfo · ConsumeInfo(회복 0 · 쿨 0) · ShopItem(POTION 1000) `RETURN_SCROLL`(아이콘 = 원작 마을 귀환 주문서 5699610a…) · `InventoryService.UseReturnScroll` → `LaneStateService.ReturnHome`(넥서스 옆 = 리스항구 택시와 같은 `NexusSideSpot` 로 묶음) · 못 가면 소모 없음 · 상점 설명칸 = ItemInfo.Description(회복 없는 소모품).
- 퀵슬롯 3칸: `InventoryService.QuickSlotCount` 3 · `QuickSlotController` 칸 묶음 `Ui(slot)` · 키 Alpha3 · `ui/QuickSlotGroup` Bar 폭 200 → 292 · 칸 −92/0/+92 · Slot3 = Slot2 본뜸(빌더 스크립트 허브 `handoff/patch107-agents/_work/P/quickslot3.cjs`).
- Play 확인(10/15 · Henesys_Hunt_GolemsTemple 레시피): 다섯 마을 택시 스폰 · 귀환 주문서 퀵 3번(사냥터 → 헤네시스 넥서스 앞 y −3.34 착지 · 6 → 5장) · 택시 [이동한다] 메소 12000 → 7000 · 여섯갈래길 도착 · 여섯갈래길에서 키 경로(Use 3)로 귀환 · 오류 0.

## 15~18. NPC 초상 칸 · ★1 발록 · 발록 도전 현황 · 쉐도우 파트너 (사용자 2026-10-15)

- `ui/CommonNpcGroup` NpcTalk/PortraitBg · PortraitBg/Fill ImageRUID f5e5fbd6(계정 자산 · 그룹 월드에서 안 불림 → 기본 네모) → 898211cc(그룹 mIYbC 재업로드 · border 14 · 스크립트 허브 `handoff/patch107-agents/_work/P/npc-portrait-roundrect.cjs`). 🔴 f5e5fbd6 은 UI 19개에 더 쓰인다(같은 증상 가능).
- `DifficultyRule` ★1 BALROG_HP_MUL · BALROG_ATK_MUL 0.5 → 1 · ★1 POS 문구 "지역 보스 HP와 공격 절반".
- 발록 도전 현황 HUD: `Boss/BalrogRoomService` HudCsv · PushHud(0.25초 틱 · 바뀔 때만) · BroadcastHud(Multicast) · 매치 끝 "" · 새 `Boss/BalrogChallengeHud`(@Logic 클라 · Apply · 줄 6) · 새 `ui/BalrogChallengeGroup`(줄 264×58 · 판 d43b23d1 재활용 · 빌더 허브 `_work/P/balrog-hud.cjs`).
- `SkillInfo` SK_T22 쉐도우 파트너 CooldownPerLevel −15 → 0(모든 레벨 90초).

## 19. 피스트인레인지 1.0 이펙트 + 판정 (사용자 2026-10-15)

- `Skill/SkillExecutors` effectOverrides.SK_P21: punchCast · punchCast0 의 10/12~10/14 줄이기(2a6a681 · aef23af · f35d596 · 0.472×0.451 · offset 0.94/0.17) 되돌림 → 1.0(9cda1ae) 그대로 배율 1 · offset 0. `box` = 앞 4.4 · 뒤 0.3 · 위 1.7 · 아래 0.6(에이전트 역산 4.4/2.0/2.2 → 사용자 뒤 0.3 · 위 1.7 · 아래 0.6). Play: `shape find SK_P21` 폭 4.70 · 높이 2.30 일치.

## 20. 해적 하이퍼 에너지 차지 (사용자 2026-10-15)

- `Skill/SkillBuffs`: `hyperCharge[userId] = { baseEndsAt, baseExpired }` · 쉴드 시작 때 차지가 켜져 있으면 `TryEnterHyperCharge`(차지 endsAt = NoExpireSeconds · 루프 이펙트 다시 걸기) · `HoldHyperCharge`(원래 시각에 쉴드 있으면 유지) · `OnShieldGoneForHyper`(쉴드 없어질 때 원래 시각이 지났으면 그 순간 종료) · 종료는 `EndChargeState` 한 길(쿨 · 스탯 · 루프 정리 그대로) · 죽음 · 매치 초기화 즉시. `SkillInfo` SK_P21 · SK_P22 설명 한 문장씩. Play: 진입 · 쉴드 먼저 깨짐 · 시간 먼저 끝남 · 쉴드만(HYPER 없음) 4경우 로그 PASS.
- 발록 도전 현황 줄 3차: 줄 배경 = NPC 초상 칸 두 겹(898211cc 금 45% + 남색) · 게이지 = 상태창 HP 게이지(fb55ad1f 바탕 · bca9a94f 바) — 매치 시계 판 양끝 장식이 "남음" · "%" 를 가렸다(Play).
