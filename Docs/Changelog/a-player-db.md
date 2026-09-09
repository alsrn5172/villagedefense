# a/player-db — 계정 영구 저장 계층 신설 (WO-018 S1)

> base `main d73f403`. 지시서: `메월드폴더/WorkOrders/WO-018-DataStorage-PlayerDBManager.md`

## 2026-09-09 — DataStorage · `PlayerDBManager` (S1)

### 왜

**계정 영구 저장 계층이 아예 없었다.** `_DataStorageService` 호출이 `RootDesk/` 전체에 **0건**, `account_` 접두어도 0건. 매치 상태를 들고 있는 `@Logic` 9개 원장이 전부 휘발성 메모리라 **매치가 끝나면 아무것도 남지 않는다.**

GDD §7 Phase 4 는 10개 항목이 전부 `⬜` 이고, **발록의 심장 · 플레이 기록 · 순위판이 전부 여기에 걸려 있다.**

### 착수 전 감사 (GDD Phase 4 첫 항목)

*"공식 플레이어 데이터·업적 패키지의 저장 키, 관리자, 샘플 의존성 감사"* 를 실제로 수행했다.

| 확인 | 결과 |
|---|---|
| 공식 `player-data-package` | 있다. 단 `Core/` 는 **밴/킥 + GM 툴 전용** — 계정 저장 골격이 아니다 |
| `PlayerDBManager` 실물 | 패키지에도 `Environment/` 에도 **없다.** 우리 문서에만 있던 이름이다 |
| 참조 아키텍처 | `msw-scripting/references/datastorage.md` **§8 Multi-Component Persistence Protocol** 이 정본. 이걸 따랐다 |
| 저장 키 충돌 | **없음** — 설치된 공식 패키지가 0개라 선점된 키가 없다 |

패키지는 들이지 않았다. 다만 `Util/` 의 `DateTimeLogic` · `CycleEnum` · `DayOfWeekEnum` · `ServerTimeOffsetChangedEvent` 는 **WO-022**(★1 "1시간에 1개 무료 충전" · 인공심장 "날짜 00:00~23:59")에 필요하므로 그때 선별 이식을 검토한다.

### 만든 것 — `RootDesk/MyDesk/Progression/` (신규 폴더)

| 파일 | 역할 |
|---|---|
| `PlayerDBManager.mlua` | `@Logic` ServerOnly. **저장 단일 창구.** `UserEnterEvent` → `BatchGetAndWait` 1회 → 도메인 fan-out. 300초 주기 `BatchSetAsync`, `UserLeaveEvent` 시 `BatchSetAndWait` |
| `AccountData.mlua` | `@Logic` ServerOnly. 계정 원장(`userId` 키) + **5메서드 계약** |
| `AccountProfile.mlua` | `@Struct` 직렬화 미러. `Init` / `Serialize` / `Deserialize` |
| `AccountStorageLogic.mlua` | `@Logic`. 저장 키·상수 한 곳 |

**기존 파일 2곳에 1줄씩** — `Match/MatchSessionLogic.mlua`(`Expire` 끝 `FlushAll`) · `Lane/LaneStateService.mlua`(`Eliminate` 끝 `RequestFlush`).

### 설계 — 초안에서 7군데를 뒤집었다

레퍼런스를 읽고 나서 내 첫 설계가 틀린 걸 확인했다.

| 초안 | 최종 | 안 고쳤으면 |
|---|---|---|
| 키를 `userId` 로 | **`ProfileCode`** (`UserEnterEvent`/`UserLeaveEvent` 가 직접 준다) | 컨테이너가 어긋난다 |
| 저장/로드 2메서드 | **5메서드 계약** (`LoadFromDB`→`OnLoaded`→`PostOnLoaded` / `SaveToDB`→`OnSavedToDB`) | 도메인이 늘 때마다 배칭이 깨진다 |
| 직렬화 미정 | `@Struct` + **`_HttpService:JSONEncode`** | `TableToString` 은 **중첩 테이블을 에러 없이 버린다** — `MatchHistory` 가 정확히 이 함정 |
| 버전 필드만 | **`IsLoadSuccess` 게이트** | 로드 실패 상태에서 **빈 기본값으로 세이브를 덮어쓴다** |
| — | **per-save 세대 스냅샷**(로컬 테이블) | PartialFailure · 비동기 왕복 중 setter · 동시 저장 2건, **세 경로로 조용히 유실** |
| 매치 종료에 저장 | **이탈 시 AndWait + 5분 주기 Async** | 마지막 저장을 놓치거나 프레임이 막힌다 |
| 비용 고려 없음 | 더티 플래그 · Batch · 4KB 이하 설계 | **Credit 과금**이다 |

`PlayerDBManager` 는 참조와 달리 **`@Logic`** 으로 뒀다. 이 프로젝트의 원장이 전부 `@Logic` + `userId` 키라 매니저만 플레이어 `@Component` 로 두면 어중간한 혼합이 되고, 덤으로 `Global/DefaultPlayer.model` 을 안 건드려도 된다. 중요한 건 host 타입이 아니라 프로토콜이다.

### 🔴 매치 자원은 하나도 저장하지 않는다

GDD §3: *"발록의 심장 외에는 매치 종료 시 소멸"*.

| 계정 영구 (`AccountProfile`) | 매치 자원 (소멸) |
|---|---|
| `SchemaVersion` · `account_level` · `account_balrogHeart` · `account_unlocks` | 메소 · 빅토리아 주화 · 경험치 · 레벨 · 장비 · 인벤토리 · 시설 · 수비대 · 훈련 · 스킬 |

`SummonManager.econ` 9개 필드는 **전부 매치 자원**이라 이 PR 은 그 파일을 열지 않았다. `:90` 주석의 *"`autoPickup` 은 DataStorage 가 생기면 계정으로 옮긴다"* 는 **폐기**됐다 — 자석 토글은 매치마다 초기화되는 게 맞다(사용자 확인 2026-09-09). 주석 정정은 B 의 PR #41 머지 후 별건.

### 비용

| | 값 |
|---|---|
| 충전 | 분당 `100 + 동시접속×10` (5인이면 **150**) |
| 소비 | 5인 30분 매치에 **약 40** (분당 1.3) |

프로필 JSON 이 200바이트 미만이라 요청 1건 = 1 credit 구간이다. 안 바뀐 유저는 `saveData` 가 비어 **요청 자체를 보내지 않는다**.

### 남은 것 (S2~S4)

- **S2** 도감 + 업적 — `MonsterCatalog` 79행 기반
- **S3** `PublicPlayerSummary` + 생존자 통계 UI + 비공개 필드 유출 검사
- **S4** 순위 판정 + 플레이 기록 (`MatchHistory` 키는 예약만 해둠) — **WO-017**(발록 선취) 선행

### 조사 방법 기록

Codex 로 3건을 **각각 2회 돌려 교차검증**하고, 숫자·줄번호는 전부 직접 재확인했다. codex 가 `EquipService` 8→**9**, `StatService` 25→**26**, `PlayerSkillState` 14→**15**, `SpectateService` 20→**21** 로 5곳을 1~3줄씩 틀렸다. 필드 이름과 구조 판정은 두 회차가 일치했고 전부 맞았다.
