# a/combat-balance — WO-014 추가기획2 전투 밸런스 1차

> 지시서: `메월드폴더/WorkOrders/WO-014-추가기획2-전투밸런스.md`. base `main a1ab351`(PR #34 머지 후). PR #35 (Draft).
> 🔴 **Maker 없이 선 구현.** 신규 스크립트 `Farm/DropOwner.mlua` 와 신규 표 `MatchConfig` 는 검증 세션의 `Reimport All` 에서 짝 파일이 생긴다.

## 2026-09-08 — S0 문서 · 계약 (코드 0)

### 신규 문서 `Docs/추가기획2/`
- `기획-원문.md` — 사용자 원문 보관 + 질의응답에서 원문을 정정한 3건(재화 주인 · 전직 레벨 · 페이즈 5단) 대조표.
- `구현항목-결정.md` — 확정 14건 · 페이즈 5단 시간표 · 드랍 소유권 규칙 · 이번 범위 밖 4묶음(선행조건 포함).
- `미정-값.md` — 🔴 **사용자가 채울 빈 표.** 리스항구 리젠 초 · 리스항구 몹 Exp · `LevelTable` 1~10/11~30 · 물약 `CooldownEndLevel` · 쿨 HUD · 미니언 배율 · 보스/엘리트/미니언 드랍 소유 확장. **값이 비어 있는 동안 그 파일은 건드리지 않는다.**

### `Docs/스키마-계약.md` (⚠️ 공지 후 단독 작업)
- `§0-2 MatchPhase` 를 **5값으로 교체** — `PHASE0-1` `PHASE0-2` `PHASE1` `PHASE2` `PHASE3`. 구 4값(`PHASE1_PIONEER` `PHASE2_VILLAGE` `PHASE25_PRESSURE` `PHASE3_FINALE`) 폐기.
  - **하이픈 예외 1건**을 §0-2 각주에 명시 (SNAKE_CASE 원칙의 유일한 예외 · 다른 열거형에 퍼뜨리지 않는다).
- `§A-2-5 MinionPhaseConfig` — 4행 고정 → **5행**. 헤더는 그대로. LIVE/TEST 실값표 + "TEST = LIVE ÷ 8" + **페이즈 판정은 인덱스가 아니라 이름으로** 규칙 추가.
- **`§A-2-5a MatchConfig` 신규 표** — `Key,Profile,MatchDurationSeconds,Enabled,#Note` (기본 키 `Key`+`Profile` · 2행). 매치 만료가 페이즈 곡선에서 분리됐다.
- `§A-2-8c ConsumeInfo` — 열 3개 **뒤에 추가** `CooldownStartSeconds,CooldownEndSeconds,CooldownEndLevel` + 선형 보간식.
- `§1 등록된 시스템` 에 행 1개 + **등록서 8항목** (8번 = 건드리는 기존 파일 13개 · 전부 A 소유 · B 경계면 없음 → §3-3 self-merge 대상).
- 변경 이력 행.

### `Docs/VillageDefense-M1-GDD.md`
- `§5.1 공개 타입` 의 `MatchPhase` 블록을 5단으로 교체 (각 페이즈의 시각·목표 레벨·만료 출처 주석 포함).
- 변경 이력 행 — 페이즈 5단 · 재화/경험치 주인 = 누적 피해 최다 · 물약 쿨타임.

### 확인
- 페이즈 문자열 전체 검색 — `Skill/` `Job/` 에 사용처 **0건**(B 경계면 없음). 남은 곳은 `Docs/Changelog/**` · `Docs/추가기획1/**` · `Docs/CHANGELOG.md`(과거 기록 · 안 건드림)와 S1 에서 고칠 4파일뿐.

## 2026-09-08 — S1 페이즈 5단 시계 + 매치 만료

### 데이터
- `MinionPhaseConfig.csv` — `Phase` 값 전면 교체 + **5행 × 2프로필 = 10행**. 헤더 불변.
  LIVE `0 / 240 / 270 / 720 / 1200`(간격 `0/0/120/120/120`) · TEST = **LIVE ÷ 8**(`0 / 30 / 34 / 90 / 150` · 간격 15).
  `PHASE1` TEST 는 33.75 → 34 반올림. `HpMul`·`AtkMul`·`ExpBase`·`MesoBase`·`CoinDropChance` 는 현행 값을 새 이름에 그대로 옮겼다(미니언 밸런스는 범위 밖 · `미정-값.md` C).
  🔴 **릴리즈 직전 `MatchSessionLogic.Profile` 기본값을 `TEST` → `LIVE`** 로 되돌린다.
- `MinionComposition.csv` — `Phase` 열 값만 치환(행 수 불변). `MinionFlowService.PickMonster` 가 이름으로 조회하므로 짝이 맞아야 한다.
- **`MatchConfig.csv` + `.userdataset` 신규** — `DEFAULT×LIVE 1800` / `DEFAULT×TEST 225`. `.userdataset` 은 `TowerConfig` 를 본으로 GUID `e73806b7-…` 새로 발급(손으로 작성 · Maker Refresh 가 등록한다).

### 코드
- `Match/MatchSessionLogic` — `MatchDuration` 프로퍼티 + `LoadMatchConfig()`(`OnBeginPlay` · `SetProfile` 양쪽에서 호출) · **`Expire()`** 1회 실행(시계·웨이브 정지 → `MatchPhaseChangedEvent(Phase="EXPIRED")` → `BroadcastExpired` 전체 토스트) · `BroadcastClock` 에 `remain` 추가 · `LoadPhases` 폴백 상수 5단 · `CurrentPhaseName` 기본값 `PHASE0-1`.
  🔴 순위 판정·결과 화면·보상은 **넣지 않았다.** 만료 시점만 만들고 후속 WO(Progression)가 이벤트로 이어받는다.
- `Match/MatchClockUIController` — `Apply` 에 `remain`. 이름표 5단 + `EXPIRED`, 표에 없는 값은 그대로 출력(새 페이즈가 늘어도 빈칸이 되지 않는다). 다음 투입·다음 페이즈가 없으면 "종료까지 mm:ss". **`.ui` 노드 추가 없음.**
- `Lane/LaneFacility` — `PhaseIndex() < 3` → **`CurrentPhaseName ~= "PHASE3"`**.
  🔴 행이 4 → 5 로 늘면서 인덱스가 한 칸 밀렸고, 그대로 뒀으면 **1페이즈부터 시설이 플레이어에게 풀데미지**를 맞는 회귀가 났다. 이름 비교로 바꿔 앞으로 행을 더 늘려도 안 깨진다.

## 2026-09-08 — S2 드랍 소유권 + 자석

### `Farm/DropOwner.mlua` (신규 · 이번 유일한 신규 스크립트)
- `@Sync OwnerUserId` · 서버 `IsPickableBy(userId)`(주인 미정이면 **아무도 못 줍는다**) · 클라 `OnBeginPlay`/`OnSyncProperty` 에서 내 것이 아니면 **`SpriteRendererComponent.Enable = false`**.
- `Entity:SetVisible` 을 안 쓴 이유: `shouldSync` 인자가 있어 전 클라에 퍼질 수 있다. 렌더러만 끄면 이 클라에서만 사라지고 서버 판정과 어긋나지 않는다.
- 폴더는 `Farm/`. 협업규칙상 `Economy/` 가 맞지만 새 폴더는 `.directory` 가 없어 `[LEA-3015]` 로 조용히 안 붙은 이력이 있어 이관은 후속.
- ⚠️ `.codeblock` 이 없다 → **Maker Refresh 전에는 등록되지 않는다.**

### 규칙 변경
- `Farm/FarmReward` — `HitEvent` 로 **플레이어별 누적 피해 원장**(`dmg` + 첫 기록 순서 `order`) · `TopDamager()`(동률이면 **먼저 때린 쪽**) · 경험치 대상을 막타 → **최다 피해자**.
  🔴 **플레이어 피해가 0이면 경험치도 동전도 없다**(수비대·미니언·포탑에게 몹을 맡기는 방치 파밍 차단). 동전마다 `DropOwner` 부착. 리스폰 시 원장 초기화.
- `Farm/MesoCoin` — 주인만 획득(`IsPickableBy`) · **자석 반경 3.0** 안이면 주인 쪽으로 끌어당기고 **획득 반경 0.8** 에서 지급 · **수명 30 → 60초**(주인만 먹을 수 있게 되어 돌아올 시간이 필요).
  🔴 이 모델은 `Rigidbody` 라 Transform 직접 대입은 다음 프레임에 되돌아간다 → **`body:SetWorldPosition`** 사용. `DropOwner` 가 없는 동전(옛 경로)은 예전처럼 최근접 플레이어에게.
- `Summon/SummonManager` — econ 에 `autoPickup`(**기본 ON**) · `IsAutoPickup` · `RequestSetAutoPickup`(Server → 토스트 + 클라 라벨 갱신). DataStorage 가 없어 **세션 메모리**다.

### UI
- 캐릭터 창 푸터 우측 여백(x 668~940)에 **`BtnAutoPickup` 1개만 추가** — UIBuilder. 기존 165개 노드는 사용자가 Maker 에서 배치한 것이라 **좌표를 건드리지 않았다**.
  앵커는 `middle-center` + `pos [350, 0]` (`middle-left`/`middle-right` 는 refresh 뒤 런타임 앵커가 중앙으로 뒤집힌 이력). RUID `f5e5fbd6…` 9-slice · Maple 폰트로 기존 버튼과 통일.
- `Stat/StatUIController` — `btnAutoPickup`(UUID `c4833a3c-…` 는 빌더가 주입) · `OnClickAutoPickup` · `SetAutoPickup`(서버 응답으로만 라벨 변경 · 낙관적 UI 없음) · `OnEndPlay` 해제.

## 2026-09-08 — S3 물약 쿨타임

- `ConsumeInfo.csv` — 열 3개 **뒤에 추가**: `CooldownStartSeconds,CooldownEndSeconds,CooldownEndLevel` = `POTION_RED 13 / 6 / 30`.
- `Item/ItemCatalog.GetConsume` 이 3열을 같이 실어 준다. 옛 표(열 없음)면 0 → 쿨 없음으로 동작.
- `Item/InventoryService` — 서버 원장 `ready[userId][itemId]`(`_UtilLogic.ServerElapsedSeconds` 기준) + `LevelOf` / `CooldownOf` / `ReadyAt` / `SetReadyAt`.
  선형 `cd = start + (end - start) × min(1, (lv-1)/(endLv-1))`.
  🔴 쿨 중이면 **아이템을 소모하지 않고** 토스트로 거절. 검증용 `log("[Item] potion cooldown lv=… cd=…s")`.
- **HUD 표시는 넣지 않았다** — `.ui` 노드 추가라 별도. `미정-값.md` B-2.

## 검증 상태

- `node Docs/tools/check-integrity.cjs` — **전부 통과, 경고 3건**(C5 ×2 · C6 ×1 = 이 브랜치 이전부터 있던 기준선. 늘지 않았다).
- 🔴 **Play 미검증.** Maker 없이 작성했다. 검증 세션에서 할 것:
  1. `Reimport All` → `DropOwner.codeblock` · `MatchConfig` 짝 파일 생성 확인 (새 표/스크립트는 **refresh 2회** 가 필요했던 이력 — 값이 0으로 읽히면 `stop → refresh` 한 번 더)
  2. `logs(kind:"build")` 신규 경고 0 (콘솔이 과거 항목을 보관하므로 "늘었는가"로 판단 · 기준선 개수를 PR 본문에)
  3. `play` 로그 — TEST 프로필 기준 `[Match] phase -> PHASE0-1 / PHASE0-2(30s) / PHASE1(34s) / PHASE2(90s) / PHASE3(150s)` · 225초 `[Match] EXPIRED` + 웨이브 정지 / `[FarmReward] … top=… dmg=…` / `[MesoCoin] picked … by …` / `[Item] potion cooldown lv=… cd=…`
  4. 육안(남의 동전이 안 보이는지 · 자석 움직임 · 푸터 토글 위치)은 **사용자**
  5. 생성된 `.codeblock` / `.userdataset` 을 디스크에서 되읽어 확인 후 추가 커밋 (`stop` 뒤에 · Play 중 편집 금지)
