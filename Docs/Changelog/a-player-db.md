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

---

## 2026-09-10 — 로비 런타임 버그 5건 (WO-019 후속)

실제로 돌려보고 잡은 것만.

| 증상 | 원인 | 고침 |
|---|---|---|
| 안내원을 눌러도 UI 가 안 뜬다 | NPC 엔티티에 **`TouchReceiveComponent` 가 없었다.** Rigidbody/물리 콜라이더는 `TouchEvent` 를 발행하지 않는다 | `map/Orbis_Lobby_VictoriaStation.map` 의 `npc-4525` 에 추가 (`AutoFitToSize=true` → 런타임 `TouchArea=(0.470, 0.710)`) |
| 관전 나가기 → *"로비는 아직 없습니다"* | `LeaveToLobby` 가 WO-019 4단계(승강장 복귀)를 한 번도 부르지 않았다 | `MatchSessionLogic:LeaveToLobby` → `SpectateService:LeaveSpectate` → `MatchLobbyGateway:ReturnToStation` |
| 관전 종료 후 조작 불가 | 관전 진입 때 끈 것들을 되돌리는 코드가 없었다 | `SpectateService:LeaveSpectate` 신설 — 리그 파괴 · `SetVisible(true)` · `PlayerControllerComponent`/`HitComponent` `Enable=true` · `Rigidbody.Gravity=1` |
| 로그에 `countdown 취소` 뒤에 `START` 가 찍힌다 | `StopCountdown` 이 **정상 만료에도** "취소" 를 찍었다 | `StopCountdown`(타이머만) / `CancelCountdown(difficulty, reason)`(실제 취소 + 토스트) 로 분리 |
| 난이도 선택 창이 비거나 이전 값이 남는다 | `OpenDifficultyPicker` 가 별만 켜고 라벨·비용·버튼·플레이어 행을 안 지웠다 | 열 때 전체 다시 칠하도록 재작성 |

**입력 새어들어감**도 같이 막았다 — 안내원 클릭 한 번이 새로 열린 창의 ★1 버튼까지 눌러서 배에 타버렸다. `InputGuardSeconds = 0.35` + 별 클릭을 **로컬 선택만** 으로 바꾸고 `btnPrimary` 를 명시적 "확인" 으로 뒀다.

> 이 UI 흐름 자체는 **WO-023 에서 매치 브라우저로 다시 만든다.** 위 5건 중 UI 흐름 2건을 뺀 나머지(TouchReceive · LeaveSpectate · ReturnToStation · 카운트다운 로그)는 그대로 간다.

---

## 2026-09-10 — 매치 브라우저 로비 (WO-023)

> 지시서: `메월드폴더/WorkOrders/WO-023-매치-브라우저-로비.md`

### 왜

WO-019 로비를 실제로 돌려 보니 두 가지가 안 맞았다 (사용자 2026-09-10):

1. **준비 버튼을 두 번 눌러야 했다** — 선택 단계의 "확인" 과 방 안의 "준비" 가 같은 버튼이었다
2. **다른 사람이 뭘 기다리는지 안 보였다** — 난이도만 고르면 자동 배정이라, 사람이 모여 있는 매치에 붙는 건지 새로 만드는 건지 알 수 없다

→ **매치를 눈으로 보고 고르는 브라우저**로 다시 만들었다.

### 확정 답 (사용자)

| # | 결정 |
|---|---|
| 같은 난이도에 매치 여러 개 | **가능하다. 애초에 없으면 안 된다** → `rooms[difficulty]` 폐기, `matches[matchId]` |
| "마지막 모습이 기록됨" | **결과 화면·통계에 마지막 수치.** 넥서스는 **HP 0**. 탈주 = 넥서스 즉시 0 + 탈락 |
| 5초 카운트다운 | 유지 |
| 주인이 나가면 | **해산** + 전원 승강장. 주인은 **강퇴 가능** |
| 참여 중 매치가 출발하면 | **거절.** 카운트다운 직전 **잠금** → 목록에서 즉시 사라짐 → 고른 사람은 선택 해제 |

### 뒤집힌 계약

| WO-019 | WO-023 |
|---|---|
| "매칭할래?" 팝업 → 난이도 선택 | **팝업 없이 바로 창** (`RequestOpenLobby`) |
| `rooms[difficulty]` — 난이도당 방 1개 | **`matches[matchId]`** — 난이도는 매치의 속성 |
| 방장 = 첫 사람 (자동 승계) | **주인 = 만든 사람 (고정 · 승계 없음)** |
| 전원 준비 → 자동 카운트 | **주인이 [시작하기]** → 잠금 → 5초 |
| 준비/준비취소 토글 | **삭제** (`ConfirmReady`·`CancelReady`·`EvaluateCountdown`) |
| CSV 1종 | **2종** — `SetBrowseCsv`(목록) / `SetRoomCsv`(방) |

### 화면

`ui/LobbyGroup.ui` 는 **추가만** 했다 (43 → 58 엔티티, 기존 UUID 0개 변경). 창 하나에 모드가 둘이다:

- **browse** — 좌: 매치 목록 `MatchRow_0..5` / 우: ★ + `HeartLabel`(내 발록의 심장)
- **room** — 좌: `PlayerRow_0..4` + `BtnKick` / 우: 이 매치의 ★(표시 전용)

목록은 이 프로젝트의 주류 패턴인 **고정 행 + Enable 토글**이다 (`PlayerRow` · `RankRow` · 파병 5행과 같은 방식). `GridView`/`Clone` 도 선례가 있지만 상한이 정해진 목록에는 고정 행이 가장 안전하다.

### 🔴 이번에 막은 함정

| 함정 | 안 막으면 | 막은 방법 |
|---|---|---|
| 취소된 타이머의 잔여 Tick | 취소했는데 매치가 출발한다 | `match.gen` 세대 번호 — `Tick(matchId, gen)` 이 어긋나면 버린다 |
| 접속 끊김 | 유령이 정원을 먹고, 주인이면 **영영 시작 안 됨** | 게이트웨이가 `UserLeaveEvent` 를 직접 구독 |
| **전원 탈락** | `Running` 이 true 로 남아 **다음 매치를 영영 못 연다** — 솔플 포기가 정확히 이 경우다 | `OnPlayerEliminated` → 전원 탈락이면 `Expire("전원 탈락")` |
| 목록 전체 브로드캐스트 | 매치 중인 사람에게도 목록이 날아간다 | `browsing` 구독자에게만 |
| 이름에 `;` `=` `\|` | CSV 행이 통째로 깨진다 | `Safe()` / `SafeName()` / `SafeText()` |
| userId 노출 | 강퇴 인자로 남의 userId 를 알게 된다 | 매치별 숫자 `token` |

앞의 셋은 **Codex 교차검증(같은 프롬프트 2회 · 새 세션)** 에서 두 회차가 똑같이 지적한 것들이다.

### 포기 · 결과 화면

- `LaneStateService:ForfeitByUser(userId)` 신설 — 넥서스 `hp=0` · `alive=false` → 기존 `Eliminate` 경로. **피해 판정을 거치지 않는다**(공격자도 방어 계수도 끼면 안 된다). 서버가 스스로 마을을 찾는다 — 클라가 `villageId` 나 피해량을 넘기지 못한다
- `MatchSessionLogic:LeaveToLobby` — 아직 살아 있는 참가자가 누르면 그게 **포기**다. 이미 탈락했거나 매치 밖이면 아무 일도 안 한다
- `MatchResultUIController:SetResultCsv` **를 처음으로 실제로 부른다.** 화면은 예전에 만들어 뒀는데 호출부가 0건이었다

⚠️ **결과 화면은 잠정 배선이다.** 순위 1순위인 "발록 누적 피해" 를 재는 코드가 아직 없어서(WO-017) 전부 `0` 으로 나가고 실질 정렬은 **넥서스 HP → 레벨** 순이다. 보상 지급도 WO-022 다.

### 아직 아닌 것

- **동시에 "돌고 있는" 매치는 하나** — `_MatchSessionLogic` 이 월드 싱글턴이다. **대기는 여러 개, 출발은 하나.** 이미 돌고 있으면 시작을 막고 목록에 `busy` 로 알린다
- **심장 차감** — 표시·경고만 하고 **막지 않는다**. 차감 시점(G-3)이 미정이라 WO-022 로 넘긴다

### 런타임 검증 (Maker Play · 1인)

`maker_execute_script` 로 클라/서버 메서드를 직접 불러 20항목 중 **13개를 통과**시켰다. 나머지 7개(참여·정원·강퇴·해산·잠금 후 참여·목록 렌더·마우스 입력)는 **클라가 하나뿐이라 못 돌렸다** — 서버 분기는 다 있지만 실측은 안 했다.

핵심만:

```
[Lane] HENESYS FORFEIT by ... — 넥서스 0
[Lane] HENESYS ELIMINATED owner=... defenders=0 minions=1
[Match] 전원 탈락 — 매치 종료
[Match] EXPIRED at 59.4s
[Result] csv applied reason=전원 탈락    ← r0=1|X|0|0|20|1
[Lobby] return to station ...            ← map=Orbis_Lobby_VictoriaStation
→ 2회차 [Lobby] match m2 생성 ★1 → START m2 → [Match] START players=1 diff=1
```

- **잠금 = 목록에서 즉시 사라진다** — `LOCKED` 직후 `BuildBrowseCsv` 가 `heart=5;busy=0;more=0` (매치 0개)
- **혼자면 감면** — ★1 혼자 → `desc=★1 · 심장 0 · 혼자` / ★3 → `발록의 심장 3개 (혼자면 2개)`
- **★ 과 매치 선택은 상호 배타** — `★3 선택 — 매치 선택 해제`
- 창이 꺼져 있어도 `GetChildByName` 이 목록 6행 + 강퇴 5개를 찾는다 (`rowsBound=true`)

⚠️ Maker Play 에서는 `player.Name` 이 userId 다. 실제 월드에서는 닉네임이 들어간다.

### Codex 교차검증

같은 프롬프트를 **새 세션으로 2회** 돌렸다 (설계 조사 2회 + 코드 리뷰 2회).

| 지적 | 두 회차 | 처리 |
|---|---|---|
| 타이머 세대 토큰 필요 | 일치 | 반영 (`match.gen`) |
| 게이트웨이가 `UserLeaveEvent` 를 직접 구독해야 | 일치 | 반영 |
| 목록은 구독자에게만 | 일치 | 반영 (`browsing`) |
| 두 매치가 동시에 카운트다운 → 나중 것이 리스항구에 고립 | 1회차만 | **반영** — `StartMatch` 에서 `Running` 재확인 후 잠금 해제 + 안내 |
| 진행 중인 참가자가 로비 RPC 를 직접 부를 수 있다 | 1회차만 | **반영** (`InRunningMatch` 가드 3곳) |
| 7개 이상이면 나머지를 고를 수 없다 | 2회차만 | **부분 반영** — `pairs()` 순회가 비결정적이라 행 순서가 매번 바뀌던 걸 id 순 정렬로 고쳤다. 페이지는 후속 |
| 게임 중 주인이 나가면 매치를 끝내야 | 2회차만 | **반영 안 함.** M-3 은 **로비** 규칙이고, 게임 중 이탈은 M-1(그 사람만 탈락 · 남은 사람은 계속)이다. 채택하면 주인이 나갔다고 남의 30분을 날린다 |

앞의 둘은 codex 가 지적하기 전에 내가 같은 결론으로 이미 고쳐 둔 것이라 서로 확인이 됐다.

### 🔴 후속 수정 — 방 화면을 전체화면 모달에서 빼냈다

사용자 실측(2026-09-10): *"매치 만들면 배로 떨어지고 UI 는 왼쪽 위에 떠서 건드릴 수 있는 수준이어야 하는데, 아예 게임 시작 5초 전에만 배로 이동한다."*

**이동은 처음부터 되고 있었다.** `match 생성` 직후 `map=Orbis_Lobby_VictoriaShip` 이 찍힌다.
문제는 로비 창이 **1920×1080 전체화면 모달**이라 배가 통째로 가려졌던 것 — 창이 닫히는 시점(출발 직전)에야 배가 보였다.

그래서 **화면을 둘로 갈랐다.**

| 모드 | 어디서 | 무엇 |
|---|---|---|
| `browse` | 승강장 | `Bg` + `Window` **전체화면 모달**. 좌: 매치 목록 / 우: ★ + 내 심장 |
| `room` | **배 위** | **`RoomHud` 좌상단 400×320 패널만.** 참가자 5행(+강퇴) · [시작하기] · [나가기] |

`ApplyVisibility()` 하나가 모드에 따라 `bg`/`window`/`roomHud` 를 켜고 끈다. 방 모드에서는 `Bg` 가 꺼지므로
**배 안을 자유롭게 돌아다니면서 시작 버튼을 누를 수 있다.**

- `Window/Players` 는 이제 어느 모드에서도 안 켜진다 → 거기 붙였던 `BtnKick` 5개는 걷어냈다(죽은 버튼)
- 강퇴·참가자 목록은 `RoomHud/RoomRow_0..4` 로 옮겼다
- `btnClose`(X) 는 브라우저 전용, 방에서 나가는 건 `BtnLeave` 로 분리 — 한 버튼이 두 일을 하던 걸 끊었다

**검증**

```
[R] browse: bg=true  window=true  roomHud=false
매치 만들기 ★2
[R] room:   bg=false window=false roomHud=true   map=Orbis_Lobby_VictoriaShip   ← 배 위, 화면 안 가림
[R] title='★★☆☆☆   1 / 5'  sub='준비되면 시작하기를 누르세요'  start='시작하기' en=true
시작하기 →
[R2] locked: sub='출발까지 3초'  start='출발 준비 중' en=false  leave.en=false
[R2] after start: map=LithHarbor_Village_MinimiMain  hud=false
```
