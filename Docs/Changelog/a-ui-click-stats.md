# a/ui-click-stats — UI 클릭 통계 (Draft PR #227 · 1.1.2 로 내보냄 · base `1.1.1`)

## 2026-10-21

사용자 지시: "UI 마다 몇 번 클릭당했는지 저장해서 개발자 통계로 · 누른 사람 수 / 플레이한 사람 수로 비율까지 · 패치 버전별 · 비용 안정적으로 ·
매치 종료마다 저장 · 통계를 읽어서 디스코드로 가는 게 중요 · `!클릭` 같은 조회는 필요 없음."

### 흐름

- **클라가 모았다가 지금 룸에 넘김** `Match/UiClickSound` — 이미 모든 버튼에 거는 클릭 훅에서 버튼 경로(`/ui` 아래)마다 수를 센다.
  지금 있는 룸 서버에 넘기는 때: 30초마다 · "로비로" 누를 때(`SpectateUIController` · `MatchResultUIController`) · 서버가 달라고 할 때
  (그 룸 계정 로드 직후 · 로비 출발 카운트다운 시작 `MatchLobbyGateway.StartCountdown`). 넘기는 건 RPC 라 **저장 비용이 없다.**
  🔴 룸을 옮기면 클라 Logic 이 새로 뜬다고 본다(공식 RoomService 예제가 룸마다 클라 `OnBeginPlay` 로 화면을 가른다 · Maker 는 인스턴스 룸을 못 만들어 직접 확인 불가)
  → 들고 다니지 않고 떠나기 전에 넘긴다. `SkipGroups`(월드맵)도 이제 세기만 한다(소리는 그대로 안 냄) · `DevStatRemoteGroup` 은 안 센다.
- **룸 서버가 모아 판 끝에 한 번 저장** 새 `Analytics/UiClickStats`(@Logic) — 받은 걸 룸 메모리에 모으고 **룸이 비는 순간(= 매치 끝 · 마지막 사람이 나감) 한 번**,
  오래 사는 룸(로비)은 30분마다, 룸이 끝날 때 한 번 더 전역 저장소 `UiClickStats` 키 `v1.1.2`(JSON 한 덩어리)에 `UpdateAndWait`(비교 후 교체).
  다른 룸이 먼저 썼으면 다시 읽어 합치고 1번만 재시도 · 실패한 몫은 다음 회차로 · `1000005`(Credit 초과)면 통계 쓰기 1시간 정지 · 45KB 넘으면 새 버튼은 `#other`.
  서버 검사: 같은 사람 2초 안 재보고 무시 · 버튼 300개 · 버튼당 200 · 이름 200바이트.
- **누른 사람(계정 1번)** `AccountRecordData` 새 부분 `ui` = 계정 저장 키 `UiSeen`(`AccountStorageLogic.UiSeenKey`) — 룸마다 읽고 바뀐 때만 기존 저장에 얹힌다.
  버전이 다르면 비우고 "플레이" +1 · 처음 누른 버튼이면 "누른 사람" +1(버튼 경로는 djb2 해시 짧은 이름 = 계정당 1KB 안팎). 깨졌으면 빈 표로 시작.
- **디스코드** 로비가 한 시간마다 확인 → 한국시간 9시 이후 그날 미전송이면 `lastPost` 를 비교 후 교체로 잡은 한 곳만 `_HttpService:PostAndWait(웹후크?wait=true)` 로 상위 30 표 전송.
  `PostAndWait` 는 실패(401 · 404)에도 예외 없이 빈 문자열을 돌려줘서(Maker 실측) `?wait=true` 응답의 `"id"` 로 성공을 가른다.
- **웹후크 등록** 레포가 공개라 주소를 코드에 넣지 않는다 → 채팅 `!클릭웹후크 <id>` → `!클릭웹후크 <토큰>`(채팅 80자 상한) 으로 전역 저장소에 넣는다.
  등록 가능: Maker Play · `DevProfileCodes`(지금 비어 있음) · 또는 목록이 비어 있고 아직 웹후크가 없을 때(라이브 첫 등록 한 번). 이미 있으면 "이미 등록돼 있습니다".
  `!클릭보내기`(지금 보내기)는 Maker Play · 개발자만 — 라이브에서 남이 치면 보통 채팅. 통계 조회 명령은 두지 않는다.
- 계약서 `Docs/스키마-계약.md` A-4 에 `UiSeen` · `UiClickStats` 기록(사용자 직접 지시라 #40 공지 생략).

### 예상 비용 (코드로 센 추정 · 동접 80 · 매치 8명 · 1인 시간당 2판 · 한도 = 읽기/쓰기 각 분당 `100 + 동접×10`)

- 통계 덩어리 쓰기: 매치 룸 1판에 1번(시간당 ~20판) + 로비 30분에 1번 → 분당 ~2(충돌 다시 읽기 포함 ~3)
- `UiSeen` 읽기: 룸 입장마다 +1 → 분당 ~7 · 쓰기: 새 버튼을 누른 룸에서만 기존 저장에 얹힘 → 분당 ≤3
- 합계 한도의 ~0.7% · 지금 게임 사용량(코드 추정 읽기 ~24 · 쓰기 ≤80) 대비 쓰기 +6% · 읽기 +30% 정도. 폐기한 첫 안(룸마다 5분 버튼별 저장)은 한도의 16~27%.

### 확인 (Maker · 그룹 mIYbC · AI 실행)

- LSP 진단 0 · refresh · build 오류 0 · `check-integrity` 통과.
- Maker Play: 클라 3회 → 넘기기(`handed over`) → 서버 `report keys=2 clicks=3 newPressed=2` → `Flush` → 저장소 `all=3 players=1 · LobbyBtn c=2 u=1` → 표 줄 생성 ✅
- 외부 HTTPS: `_HttpService:GetAndWait("https://discord.com/api/v10/gateway")` 응답 받음 ✅ (Maker 서버에서 디스코드까지 나간다)
- ❌ 못 본 것: 진짜 웹후크로 디스코드 도착(웹후크 없음) · 룸 이동 · 룸이 비었을 때 저장(Maker 는 인스턴스 룸을 못 만든다 — `CreateInstanceRoom failed`) · 배포 월드에서의 외부 HTTP.
- 참고: Maker Play 의 첫 방(`TestPlayInstance`)은 `IsInstanceRoom()` 이 true 다 → 로비 판정에 Maker 예외를 넣었다(`UiClickStats.IsLobbyRoom`).

### 잃는 것

룸을 떠나기 전 마지막 30초 안 클릭 중 "로비로" · 카운트다운으로 안 넘어간 것(예: 접속 종료 · 보스 방 · 튜토리얼 끝 복귀 직전) · 로드 전 보고의 "누른 사람" 판정.

### 패치마다

`UiClickStats.Version` 을 그 패치 번호로 올린다 → 새 키에 0부터 쌓이고, 계정 `UiSeen` 도 첫 보고 때 비워진다. 웹후크 주소는 그대로 유지된다.
