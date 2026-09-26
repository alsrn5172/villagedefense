# b/skill-prewarm-job

## 2026-09-25 — 차가운 입장 예열 끊김: 지금 직업 것만 · 전직 뒤에 예열 + PreloadAsync 비교안

### 문제 (#94 차가운 입장 Play 에서 발견 · 사용자 결정으로 별도 PR)

- Maker 를 완전히 다시 켠 뒤 첫 입장 3초 뒤 ≈2초 끊김 — 멈춤 258 / 281 / 285 ms + 50~110 ms 프레임 ≈10개(2026-09-25 #94 `03b4a90` 프레임 실측).
- 원인: `SkillExecutors.PrewarmCutscenesFor` 가 입장 3초 뒤 **다섯 직업의 화면 컷신 전부**(≈1400×850 · 79~133프레임) + 파워 스트라이크 찌르기 잔상을 0.01 배율로 한꺼번에 재생해 예열한다(2026-09-13 부터). 같은 방법으로 작은 클립 하나를 차갑게 보낸 대조군은 끊김 없음 → 무게는 컷신 클립들.

### 수정 (`Skill/SkillExecutors.mlua`)

1. **지금 직업 것만 · 전직 뒤에**(사용자 결정 ①):
   - `StartCutscenePrewarm` 이 `_PlayerSkillState` 의 `JobChangedEvent`(서버 `PlayerSkillState.ChangeJob` 이 발행)를 구독 → 새 `OnPrewarmJobChanged` → `PrewarmCutscenesFor(userId)`.
   - `PrewarmCutscenesFor` 는 그 유저의 지금 직업(`PlayerSkillState.GetJobId`)의 예열 목록(새 `PrewarmRuidsFor(jobId)`)만 받는다. 초보자면 아무것도 안 한다(매치 입장 = 초보자 → 입장 때 예열 0). 입장 때는 직업이 이미 있을 때만(DEV 직업 전환 등).
   - `PrewarmRuidsFor` = 그 직업(`SkillInfo.ReqJob`) 스킬의 `cast.cutsceneSeconds`(= 궁 화면 컷신) · `cast.prewarm == true`(#94 하이퍼 바디 = 쓸만한 하이퍼 바디 · 라이브 2022 모습과 일치) · `thrust`(main 의 파워 스트라이크 2단 잔상 · #83 이 지우면 저절로 빠진다). 같은 RUID 는 한 번.
   - 같은 직업은 한 번만(`prewarmedJobs[userId]` · 차수 올림 이벤트 무시). 입장할 때마다 비운다(새 클라 = 캐시 없음).
2. **PreloadAsync 비교안**(사용자 결정 ②): `CutscenePrewarmMode` — `"play"`(기본 · 예전처럼 서버에서 그 유저에 붙여 0.01 배율 재생) · `"preload"`(서버가 그 유저 클라에만 `PreloadClipsOnClient` → 클라 `_ResourceService:PreloadAsync` · 그리지 않고 받아 두기 · 결과 상태를 로그).
   - (처음) 기본을 `"play"` 로 둔 이유 — **2026-09-26 Play 뒤 `"preload"` 로 바꿨다(아래 절)**: A 코드의 `PreloadAsync` 사용처(`Boss/BossSkillRunner.mlua:228` · `Monster.mlua:122`)는 전부 서버에서 클립 길이를 재려는 것이다 → 클라 `PreloadAsync` 가 이펙트 첫 재생을 제때 띄우는지는 근거가 없다. 차가운 입장 Play 로 고른 뒤 기본값을 정한다.

### #94 와의 관계 · 머지 순서

- #94(`b/skill-warrior-effects` · Ready)는 같은 `PrewarmCutscenesFor` 의 조건 한 줄을 `spec.cutsceneSeconds ~= nil or spec.prewarm == true` 로 바꾸고, 하이퍼 바디 cast 에 `prewarm = true` 를 단다(입장 때 모두에게 예열).
- 이 PR 은 그 함수를 직업별로 다시 쓰면서 **`spec.prewarm == true` 조건을 이미 포함한다** → 둘 다 머지되면 하이퍼 바디 예열은 "전사로 전직할 때" 로 옮겨 가며 계속 동작한다(#94 의 0.26s 늦음 수정 유지).
- **권장 순서: #94 먼저 → 이 PR.** 이 PR 은 #94 와 그 함수에서 겹친다(아래 머지 검사). #94 가 머지되면 이 브랜치에 main 을 합쳐(사용자 확인 뒤) 그 한 곳을 **이 PR 쪽으로** 풀고 다시 올린다 — A 는 충돌을 풀 필요가 없다.
- 반대 순서(이 PR 먼저)라도 풀이는 같다: #94 쪽에서 그 함수는 이 PR 판을 남긴다(이미 `prewarm` 조건 포함).

### 차가운 입장 Play (2026-09-26 · Maker 완전 재시작 · `5652324` · Reimport All · Maker MCP · PASS)

**빌드 경고: 1 before → 1 after**(기존 `LWA-1111` · 에러 0). 실행: 에러 0 · 경고 9 = 전부 기존(`[BossCatalog]` 4 · `LWA-3047` 3 · 첫 스킬 `LWA-3048` 2). Play 뒤 `git status` 깨끗.

측정: Play 직후 클라 프레임 탐침(`_TimerService:SetTimerRepeat` 0.001 · `ElapsedSeconds` 차 · 50ms 이상은 한 줄씩 · 5s 창 요약). 첫 궁이 제때 뜨는지 = `DateTime.UtcNow`(ms) 표시 + 연속 스크린샷(파일 이름 ms). 직업 · 레벨은 서버 스크립트(메모리만): `GrantKillReward` 로 Lv30 → `ChangeJob` / `TryAdvanceTier` / `DevLearnAll`. 시전 = 클라 `_SkillCaster:RequestCast`. 두 방식을 한 세션에서 비교했다(직업마다 컷신 클립이 달라 둘 다 "차가운" 상태).

| 항목 | 기대 | 결과 |
|---|---|---|
| 입장 +3s | `prewarm skipped — no job yet` · 끊김 없음 | **PASS** — 첫 5s 창 최대 36ms · 50ms 이상 0 (예전: 멈춤 258 · 281 · 285ms + 50~110ms 약 10프레임) |
| (대조) Lv1 → 30 레벨업 29번 | — | 50ms 이상 0 · 최대 19ms |
| 전직 전사 `"play"` +3s (thrust 2 + 불굴의 진 89f) | 그 직업 것만 · 끊김 크기 | `prewarm WARRIOR x3 mode=play` · **85ms 한 번** |
| 전직 마법사 `"preload"` +3s (대마법 92f) | `client preload done` · 끊김 크기 | `client preload done x1 in 0.82s [1=Success]` · **97ms 한 번** |
| 전직 궁수 `"play"` +3s (폭풍의 화살 133f · 가장 큰 클립) | 끊김 크기 | 56 · 50 · 52 · **92ms** (0.3s 안 4프레임) |
| 같은 직업 차수 올림(전사 2 · 3차) | 다시 예열 안 함 | **PASS** — 두 번째 `prewarm WARRIOR` 없음 · 끊김 없음 |
| 첫 궁 — 마법사(preload) SK_M31 | 제때 뜬다 | **PASS** — 시전 순간 끊김 0 · +0.77s 스크린샷(첫 장)에 컷신 진행 중 |
| 첫 궁 — 궁수(play) SK_A31 | 제때 뜬다 | **PASS** — 시전 순간 끊김 0 · **+0.33s 에 이미 보임** |
| (대조) 예열 안 한 도적 컷신(일도양단 85f)을 같은 서버 경로 `PlayStageEffect` 로 | — | 시전 순간 **102ms** · +0.34s 에 안 보임 → +0.74s 에 보임 |

- 전사 첫 궁은 ms 표시 전이라 판정에서 뺐다(시전 순간 끊김 0).
- `LoadAnimationClipAndWait` 시간은 "제때 뜨는지" 기준으로 못 쓴다 — 예열 안 한 클립도 44ms(메타데이터만 · 무거운 것은 첫 그리기).

### 기본 방식 = `"preload"` (사용자 결정 2026-09-26)

- 전직한 본인에게는 두 방식이 같았다(첫 궁 끊김 0 · 전직 순간 한 번 85~97ms).
- 차이는 **다른 플레이어**: `"play"` 는 서버 이펙트라 그 맵의 모든 클라가 같이 받는다 → 남의 전직 때 같은 맵 사람도 끊길 수 있다(그 자리에 있던 사람만 도움). `"preload"` 는 전직한 사람 클라만 받는다 → 다른 사람은 그 사람이 궁을 처음 쓸 때 한 번(대조군 수준 ≈100ms) 끊길 수 있다. 플레이어가 마을 · 레인에 흩어져 있어 `"play"` 의 이득이 작다 → `"preload"`.
- `Skill/SkillExecutors.mlua` `CutscenePrewarmMode = "preload"` + 주석. `"play"` 경로는 그대로 남아 있다(속성만 바꾸면 돌아간다).
