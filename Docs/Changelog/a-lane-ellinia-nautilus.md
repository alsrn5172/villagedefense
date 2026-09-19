# a/lane-ellinia-nautilus — 엘리니아·노틸러스 침공 레인 (PR #43)

## 2026-09-18 — 레인 6맵 · 노틸러스 포탈 재배치 · 물버섯 · 진행 방향 버그

점유 마을 5곳 중 엘리니아·노틸러스는 `LaneConfig` 행이 없어 미니언·파병이 돌지 않았다. 커닝·페리온과 같은 방식으로 통로를 깔고 표를 채웠다.
배치는 실측 → 사용자 확인 → 적용 순서로 했다 (지시서 `WO-027`).

### 레인 (`LaneConfig.csv` +6행 · 두 마을 모두 **왼쪽 → 오른쪽** · 최종값)

| 마을 | 맵 | 역할 | 통로 x | PathY | 출발 → 끝 | 시설 x | 비고 |
|---|---|---|---|---|---|---|---|
| ELLINIA | Ellinia_Hunt_TreeTrunkNest2 | LANE2 | −5.5 ~ 6.4 | −8.0 | −4.5 → 6.0 | 포탑 4.5 | 세로 나무맵 · 구덩이(−6.31) 아래 · 사다리 −1.3 / 2.2 |
| ELLINIA | Ellinia_Hunt_GreenTreeTrunk | LANE1 | −17.3 ~ −1.6 | −20.7 | −16.7 → −2.0 | 억제기 −6.9 | 사다리 −9.5(4칸) / −4.5 |
| ELLINIA | Ellinia_Village_MinimiMain | VILLAGE | −4.0 ~ 3.2 | 6.8 | −3.4 → 3.0 | 넥서스 2.6 | **새 발판 없음** — 마을 높이 가운데 가지 다리(5.6~6.8) 그대로 (사용자) |
| NAUTILUS | Nautilus_Hunt_WayToBeach | LANE2 | −19.4 ~ 0.5 | −3.5 | −18.4 → 0.1 | 포탑 −6.4 | 사다리 −12.4 / −3.9(3칸) |
| NAUTILUS | Nautilus_Hunt_PigPasture | LANE1 | −15.8 ~ 5.3 | −3.5 | −15.2 → 4.9 | 억제기 −1.5 | x 0.84 벽 조각이 −3.3 까지 내려와 −3.5 로 · 사다리 −8.5 / 2.5 |
| NAUTILUS | Nautilus_Village_MinimiMain | VILLAGE | 12.1 ~ 50.0 | −3.05 | 12.7 → 21.8 | 넥서스 20.8 | **새 발판 없음** — 물가 바닥(사용자가 왼쪽 11.76 까지 늘림) · 넥서스 = 노틸러스호 쪽 (사용자) |

### ↔ 좌→우 전환 (사용자 2026-09-18: "왼쪽이 여섯갈래길 → 사냥터2 → 사냥터1 → 마을")

처음엔 6맵 모두 우→좌로 깔았다(코드가 LANE1·VILLAGE 를 오른쪽 끝에서만 스폰). 사용자가 노틸러스 방향이 반대라고 지적 — 9/15 테스트맵 결정(`TestLaneLeftToRight = ELLINIA,PERION,NAUTILUS`)대로 엘리니아까지 좌→우로 바꿨다.

- **코드**: `LaneFacilityService.LaneStartX(row)` · `LaneDir(row)` 신설 — `SpawnX` 가 있으면 역할과 무관하게 그 x, 빈칸이면 `PathMaxX − 0.6`. 방향 = 끝이 출발 x 보다 오른쪽이면 +1. `MinionFlowService.SpawnMinion` 과 `DefenderService` 가 같이 쓴다. 수비대 대기 위치(시설 뒤 = 마을 쪽)와 목줄(마을 쪽 2.5 · 적 쪽 사거리 80%)이 방향에 따라 좌우로 뒤집힌다(전엔 −x 고정). 기존 9행(헤네시스·커닝·페리온)은 동작 그대로.
- **계약**: `LaneConfig.SpawnX/SpawnY` 를 LANE2 전용 → 모든 역할로(A-2-2 · 헤더 변경 없음 · #40 comment 5727412808 공지).
- **포탈 맞바꿈**(원래 포탈 = 플레이어용): WayToBeach 여섯갈래길 ↔ PigPasture · PigPasture WayToBeach ↔ 마을(통로 포탈도) · GreenTreeTrunk Nest2 ↔ 마을(통로 포탈도) · 엘리니아 마을 GreenTreeTrunk ↔ GiantTree. Nest2 는 원래 왼쪽 = 여섯갈래길이라 그대로. `PortalRoutes` 는 이름 기준이라 변경 없음.
- 통로 포탈은 그 포탈이 가는 맵 쪽 끝(WayToBeach 오른쪽 끝 −0.3 · GreenTreeTrunk 양 끝 맞바꿈). 시설은 통로 가운데 기준 대칭 이동, 노틸러스 사냥터 사다리는 시설과 겹치지 않게 옮김(PigPasture 2.5 는 x 0.84 벽 조각을 피해서).
- 엘리니아 마을(사용자 2026-09-19): 통로 포탈과 사냥터1 포탈을 **위아래로 맞바꿈** — 통로 포탈 = 아래 바닥 왼쪽 (−3.77, 1.39) · `P_To_Ellinia_Hunt_GreenTreeTrunk` = 다리 위 왼쪽 끝 (−3.6, 6.77).
- **노틸러스 마을은 사용자가 Maker 에서 직접 고쳤다**: 물가를 왼쪽 11.76 까지 늘리고 돼지목장 포탈 (14.06, 0.63) · 통로 포탈 (13.28, −2.94) · 해변 포탈 (48.37, −0.44) · 밧줄 추가. 입구가 함선 왼쪽이라 넥서스는 함선 쪽 20.8 에 두고 미니언이 12.7 에서 들어와 오른쪽으로 간다.
- 맵 수정은 **위치 숫자만 원본 텍스트에서 바꿨다**(Maker 형식 CRLF·`1.0` 표기 보존 · 결과 JSON = 빌더 결과 대조) → 맵당 6~12줄.

- 통로 한 세트는 커닝 `KerningCity_Hunt_ConstructionSite` 엔티티를 그대로 복제했다: `LaneGround_i`(간격 4.32 · MapLayer7/2 · 첫 장에 `CustomFootholdComponent`) · 사다리 3엔티티 × 2 · 통로 포탈 `P_Lane_To_*`(하늘색 · `MODRespawnArea`).
- 사다리 높이 공식(커닝 두 세트 실측): 몸 한 칸 0.48 · `BoxSize.y = 0.48n` · `BoxOffset.y = 0.24(n−1)` · 윗줄 = 몸 + 0.48n − 0.11 · 밑줄 = 몸 − 0.284. 윗줄을 위 바닥 +0~0.05 에 맞춰 칸수를 정했다(2·3·4칸).
- 엘리니아 다리는 발판 그룹 하나(−3.1 ~ 3.28 · Prev/Next 링크 연결)와 왼쪽 끝 조각(−4.04 ~ −2.94 · 0.02 아래 겹침)으로 돼 있다. `FactionAI` 는 발판 끝에서 멈추지 않으므로 0.02 떨어져 이어 걷는다. 넥서스 피격 폭 2.4(−4.6 ~ −2.2)가 조각 경계 전에 이미 닿는다.
- `PortalRoutes.csv` 통로 노선 8행(`EL01A/B` · `EL02A/B` · `NL01A/B` · `NL02A/B`).
- 🔧 엘리니아 사냥터 2맵은 CRLF · 끝 개행 없음 · `1.0` 표기로 저장돼 있어, 빌더로 통째로 쓰면 파일 전체가 바뀐다 → **기존 엔티티 텍스트는 그대로 두고 빌더가 만든 새 엔티티만 배열 끝에 덧붙였다**(결과 JSON 이 빌더 출력과 같음을 대조). 나머지 6맵은 빌더 출력이 원본과 바이트 단위로 같아 `builder.write` 그대로.

### 노틸러스 포탈 재배치 (사용자 2026-09-17)

- 마을 오른쪽 끝 물가 (49.3, −2.9)에 `P_To_Nautilus_Hunt_RibbonPigBeach` 신설 — 같은 맵 `P_To_Nautilus_Hunt_PigPasture` 복제.
- 함선(`Nautilus_Village_MinimiShip`) 안 `P_To_Nautilus_Hunt_RibbonPigBeach` 삭제. 스크립트 하드코딩 없음(Codex 조사 2회 일치).
- 리본돼지 해변: 두 포탈 자리 맞바꿈 — 피아누스 쪽 (6.51, −2.09) · 마을 쪽 (−11.88, −2.1) — 마을 쪽을 `P_To_Nautilus_Village_MinimiMain` 으로 개명.
- `PortalRoutes` N02A/B = 해변 ↔ 마을 직행. `VillageConfig` NAUTILUS 메모 정정.

### 물버섯 — 노틸러스 전용 미니언 (사용자 2026-09-17)

- `Models/Monsters/물버섯 (Water Mushroom).model` = 좀비버섯 복제 + `SpriteRendererComponent.Color` (0.45, 0.75, 1.0) · `MODColor` 타입. 피격 플래시는 원래 색을 저장·복원하므로 틴트가 유지된다(`Monster.mlua` 523~526).
- Id **`12230101`** = `1` + 원본 `2230101`. 공식 몬스터 Id(최대 7자리)와 겹치지 않게 8자리로 했다.
- `MinionComposition.csv` 에 **`VillageId` 열**(`#Note` 앞 · 빈칸 = 전 마을). 그 마을·페이즈 행이 하나라도 있으면 그 마을은 그 행만 쓴다. NAUTILUS 4행 = 물버섯 PHASE1~3 + 좀비머쉬맘 PHASE3. 기본 키 `Phase+MonsterId+VillageId`. 헤더 공지 #40 comment 5725998438.
- `Lane/MinionFlowService.mlua`: `PickMonster(phase, villageId)` · 웨이브 로그에 마을별 선택(`picks=`).

### 🐞 진행 방향 버그 수정 — 페리온 마을에도 영향

- `SpawnMinion` 이 방향을 `EndTriggerX >= row.spawnX` 로 쟀는데 LANE1·VILLAGE 행은 `SpawnX` 가 빈칸(0)이다. 좌표가 양수인 마을(**페리온 마을 끝 3.4** · 노틸러스 마을 끝 19.8)은 +1(좌→우)로 뒤집혀, 오른쪽 끝에서 스폰한 미니언이 오른쪽으로 걷고 곧바로 끝 판정이 났다(넥서스 앞에 못 감). 2026-09-15 방향 규칙 도입 때부터.
- 실제 출발 x(LANE2 = SpawnX · 그 외 = PathMaxX−0.6) 기준으로 한 번 구해 `AdvanceDir` · `EndDir` 에 같이 쓴다. 같은 맵 역할 전환(커닝)은 현재 위치 기준. 스폰 로그에 `dir` · `endX`.
- 15행 전수 계산: 페리온·노틸러스 VILLAGE 만 +1 → −1, 나머지 13행 불변. 테스트 레인은 세 역할 모두 SpawnX 가 채워져 있어 결과 같음.

### 작업 방식 · 검토

- 실측: MapBuilder 로 직접 재고 Codex 로 **독립 재측정 2회**(내 수치 미제공) — 사다리 위 바닥 · 포탈 · 맵 폭 전부 일치.
- Codex 참조 조사 2회 · 텍스트 파일 구현 1회(쓰기) · 전체 검토 2회 · 방향 수정 집중 검토 2회.
- 전체 검토에서 받은 지적 중 **진짜는 방향 버그 1건**(2회 중 1회만 잡음). 나머지는 확인 후 기각: 엘리니아 다리 "수평 발판 없음"(완만한 경사 · 걸을 수 있음) · GreenTreeTrunk 사다리 위 "경사뿐"(실제 dy 0.03) · `MinionComposition` "main 은 BOM+CRLF"(main 도 LF · BOM 없음).
- Codex 가 지운 메서드 사이 빈 줄 3곳 복원 · `string.gsub` 2값 대입 LSP 경고 → `string.match` 로.

### 🐞 통로 발판은 Maker 가 구워야 한다 (Play 1차에서 발견)

- 1차 Play 에서 사냥터 4맵 미니언이 통로를 뚫고 떨어졌다(15초에 y −150). 런타임 발판 수 = 파일의 `FootholdsByLayer` 수 그대로(Nest2 245 · 통로 0), `LaneGround_0` 의 `CustomFootholdComponent` 는 켜져 있는데 레이캐스트가 빗나갔다.
- 커닝·페리온 통로는 `FootholdsByLayer` 에 **소유자(`OwnerId`) = `LaneGround_0`** 인 선분이 구워져 있다. 이 데이터는 Maker 에디터가 그 맵을 열었을 때 `CustomFootholdComponent` 로 만들어 저장한다 — **Reimport All 만으로는 안 굽는다**.
- `maker_move_map` → `maker_save` 로 4맵을 저장해 선분 1개씩 구웠다. 나머지 차이는 Maker 직렬화 정규화뿐(기본값 필드 · float32 · 노틸러스 2맵 CRLF)이고 엔티티 변화 0.
- ⚠ 같은 저장이 **UI 18개의 `GroupOrder` 순위를 다시 매겨 썼다**(main 에 새로 들어온 UI 그룹 때문으로 보임) → 이 PR 과 무관한 부산물이라 되돌렸다.

### 검증

- `check-integrity` 전부 통과(경고 4건 · 기존). mLua 진단 이슈 0.
- 빌드(개인 월드 · 워크트리 · Reimport All): **Error 0 · Warning 1** — `Summon/SummonManager.ParseStatCsv` 의 기존 경고(LWA-1111 · 이 브랜치가 안 건드린 파일). 이번 변경이 늘린 경고 0.
- 런타임(Play 2회 · 서버 `execute_script` · 점유는 `ClaimLevel=1` + 가짜 유저 `T_ELL`/`T_NAU`):
  - 시작: `LaneConfig loaded: 15 rows` · `MinionComposition loaded: 8 rows (village-specific 4)` · `spawned ELLINIA:CORE at Ellinia_Village_MinimiMain (-3.4,6.7)` · `spawned NAUTILUS:CORE at Nautilus_Village_MinimiMain (20.8,-3.05)`
  - 점유: `claimed ELLINIA/NAUTILUS` → `TOWER` (−3.6,−8.0)·(−12.5,−3.5) · `SUPPRESSOR` (−12.0,−20.7)·(−9.0,−3.5) 스폰
  - 선택: `wave phase=PHASE1 spawned=2 picks=ELLINIA:2230101 NAUTILUS:12230101` · 노틸러스 PHASE3 도 물버섯 · 물버섯 `Color 0.45/0.75/1.00`
  - 이동(2차): 6구간 전부 `dir=-1` · 사냥터 미니언 y 가 통로 높이(−8.00 · −20.70 · −3.50)에 그대로, x 감소 · 포탑에 맞아 HP 300 → 180/240 · 강제 `Advance` 로 LANE2 → LANE1 → VILLAGE 스폰 위치(PathMaxX−0.6)·HP 비율 유지 · 엘리니아 마을 다리 위 넥서스 앞(−2.84, 6.45) 도착 · 노틸러스 마을 49.4 → 37.1 진행
  - 에러 4건 = `LEA-3032` 인자 `T_ELL`/`T_NAU` — `LaneStateService.PushOwner` 가 **가짜 유저**에게 보내려다 난 것(테스트 전용). 경고는 기존 종류뿐(`LWA-3048` 미니언 공격 컴포넌트 2개 · `LWA-3047` · 보스 6130101)
- 눈 확인(사용자 몫): 통로·사다리 높이, 엘리니아 다리 위 넥서스, 노틸러스 물가 동선, 새 리본돼지 해변 포탈 왕복, 물버섯 색.
- ↔ 좌→우 전환 뒤 재검증: _Reimport All 대기_
