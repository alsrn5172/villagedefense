# a/p0914-6-difficulty (B6 · 통합 브랜치 `a/plan-0914` · B5 위 stacked · PR #75)

난이도 ★1/3/5 (WO-029 B6 · WO-027 §9-0 · 계약 A-2-7 · A-2-7a · BossReward).

| 항목 | 내용 | 파일 |
|---|---|---|
| `DifficultyRule` 신설 | 63행 = ★1/3/5 × (`MINION_P3_BOOST` `ZOMBIE_MUL` `BALROG_HP_MUL` `BALROG_ATK_MUL` `BOSS_HP_MUL` `BOSS_ATK_MUL` `MATCH_EXP_MUL` `ACCOUNT_EXP_MUL` `ELITE_PER_KILLS` `ELITE_COUNT` `REGION_DROP_MUL` `BALROG_TICKET` `BOSS_SOULSTONE` `UNLOCK_ACCOUNT_LV` + 문구 `TITLE INTRO NEG POS REWARD HARD TIP`) · 값은 계약 A-2-7a 확정값 | `DifficultyRule.csv` · `.userdataset` |
| ★2·★4 끄기 | `DifficultyConfig.Enabled=false` 를 **실제로 소비** — `BalrogHeartService.IsEnabled` → `DifficultyService.IsEnabled` → 로비 게이트웨이가 생성·참가 거절(`reason=disabled`) · 계정 레벨 미달은 `reason=locked`(`UNLOCK_ACCOUNT_LV` 1/5/13 vs `AccountData.GetLevel`) | `DifficultyConfig.csv` · `Progression/BalrogHeartService.mlua` · `Match/MatchLobbyGateway.mlua` |
| 단일 적용점 | 신규 `Match/DifficultyService.mlua`(@Logic): `Current/GetMul/GetNum/GetText(+For)/IsEnabled/IsUnlocked/UnlockLevelFor/Recommended/Describe/BossHpMulFor/BossAtkMulFor`. 매치 밖(=0)은 배율 1 | `Match/DifficultyService.mlua` |
| 미니언 | `FireWave`: ★1 은 3P 행을 2P 마지막 행 값으로(`MINION_P3_BOOST` 0) · `ZombieCount × ZOMBIE_MUL`(★1 0 · ★5 2) · `[Match] wave … hp= atk= zombies=` | `Match/MatchSessionLogic.mlua` |
| 보스 | `BossSpawner.ApplyDifficulty`: 스폰 직후 + ★ 변경 감지(0.5초) 때 `MaxHp/AttackPower` 재주입(HP 비율 유지 · 발록 = `BALROG_*` · 지역 보스 = `BOSS_*`) · `[Boss] diff= … maxHp= (x) atk= (x)` · 스폰한 보스의 `HitEvent` 를 이어 플레이어별 누적 피해 원장 · 사망 때 `BossRewardService` 호출 | `Boss/BossSpawner.mlua` |
| 지역 보스 보상 | 신규 `Boss/BossRewardService.mlua`: 최다 피해자(동률 = 먼저 때린 사람 · 매치 참가자만)에게 영혼석(`BossReward.SoulstoneStar{★}` · 비면 `BOSS_SOULSTONE`) + `TopDamageItemId/Meso` + 선취 `FirstClaim*`(매치당 1회 · `StartMatch` 가 `ResetForMatch`) · `[BossReward]` 로그 + 토스트. `BossReward` 헤더에 `SoulstoneStar1/3/5` 추가(CANONICAL 동시) · 지역 보스 5종 20/30/60 · 마노 0 | `Boss/BossRewardService.mlua` · `Catalog/BossCatalog.mlua` · `BossReward.csv` · `Docs/tools/check-integrity.cjs` |
| 발록 입장권 | `TicketCost` = `BALROG_TICKET`(5/30/200 · 속성 폴백) · `[Balrog] ticket=` · `BossMaxHp` × `BALROG_HP_MUL`(BeginMatch 에서 굳혀 결과 화면 DamageOf 도 같은 값) | `Boss/BalrogRoomService.mlua` |
| 지역 보스 입장권 | 지역 보스 맵(VillageConfig.BossMapName · 마노 제외)은 바인딩 안 함 → ↑ = `RequestEnterBoss`: 그 맵 지역 재화 25(`BossEntryCost`) · 첫 ↑ 안내 · 8초 안 재입력 = 차감(`[Sink] BOSS_ENTRY`) + 이동 · 부족하면 토스트 | `PortalNetwork.mlua` · `Farm/DropTableLogic.mlua`(`RegionItemOfMap`) |
| 경험치·드롭 | `FarmReward.GiveRewards` exp × `MATCH_EXP_MUL`(★1 1.5) · `DropTableLogic.RegionMul` = `REGION_DROP_MUL`(★5 2 · 맵 지역 ≠ 내 마을 지역일 때만) | `Farm/FarmReward.mlua` · `Farm/DropTableLogic.mlua` |
| 선택창 | 서버 문구(`BuildBrowseCsv` `alv=` · `d1/d3/d5=Describe`) → 컨트롤러: ★2·★4 버튼 숨김 · 설명 6줄(제목+추천 / 소개 / − / + / 보상 / 난이도 / 권장) · 비용·잠금 사유(`CostLabel`) · 잠기면 버튼 "잠김" · **새 UI** `Window/Difficulty/Select`(엠블럼 자리 96×96 + 라디오 3줄 `Row_1/3/5` ◇◆ + 비용 배지 · 탭 ★ 과 연동 · busy 면 숨김 · 기존 배치는 손대지 않음) · 엠블럼 RUID 는 `LobbyUIController.EmblemRuids`("1=ruid,3=ruid,5=ruid") 에 사용자가 넣는다 | `Match/LobbyUIController.mlua` · `ui/LobbyGroup` |
| Codex 리뷰(B4/B5) 수정 | 파병 수비대도 `MonsterRecruit` 스탯(`[Dispatch] … hp=500 atk=150`) · 시설 반사 피해에도 플레이어 방어 감산 · 모집 목록 5종 초과 시 높은 티어 5종만 · 시설 피격 HP 를 방어 창에 0.5초 묶음 푸시(`MarkDefenseDirty`) | `Lane/MinionFlowService.mlua` · `Faction/FactionAttack.mlua` · `Lane/LaneStateService.mlua` |

## 검증 (2026-09-23 · 개인 월드 · Maker)

- 빌드 에러 0 · LSP 진단 0 · `node Docs/tools/check-integrity.cjs` 통과.
- `[Difficulty] rules loaded: 63 rows · stars=1,3,5` · `[Lobby] create refused … diff=2/4 reason=disabled` · `diff=3/5 reason=locked`(계정 Lv1).
- ★ 전환(`_MatchSessionLogic.Difficulty` 1→5→3): 발록 `maxHp=19000 (x0.5)` → `76000 (x2)` → `38000 (x1)` · 지역 보스 ×0.5/×1.5/×1 · `ticket=5/200/30` · `regionMul=2`(★5) · `expMul=1.5`(★1).
- ★1 `P3-1` 웨이브 → `hp=4400 atk=750 zombies=0`(TEST P2-3 값) · ★5 → `hp=5000 atk=3700 zombies=2`.
- 스텀피 처치 시뮬(★3 · 원장 주입) → `[BossReward] … soulstone=30/30` · 인벤 `BRAND_SOULSTONE` 0 → 30.
- 페리온 사냥터에서 `RequestEnterBoss` ×2 → `confirm?` → `[Sink] BOSS_ENTRY … n=25` → `boss entry ok` · 재화 30 → 5.
- 파병 `SpawnDispatched` → `hp=500 atk=150`.
