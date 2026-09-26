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
   - 기본을 `"play"` 로 둔 이유: A 코드의 `PreloadAsync` 사용처(`Boss/BossSkillRunner.mlua:228` · `Monster.mlua:122`)는 전부 서버에서 클립 길이를 재려는 것이다 → 클라 `PreloadAsync` 가 이펙트 첫 재생을 제때 띄우는지는 근거가 없다. 차가운 입장 Play 로 고른 뒤 기본값을 정한다.

### #94 와의 관계 · 머지 순서

- #94(`b/skill-warrior-effects` · Ready)는 같은 `PrewarmCutscenesFor` 의 조건 한 줄을 `spec.cutsceneSeconds ~= nil or spec.prewarm == true` 로 바꾸고, 하이퍼 바디 cast 에 `prewarm = true` 를 단다(입장 때 모두에게 예열).
- 이 PR 은 그 함수를 직업별로 다시 쓰면서 **`spec.prewarm == true` 조건을 이미 포함한다** → 둘 다 머지되면 하이퍼 바디 예열은 "전사로 전직할 때" 로 옮겨 가며 계속 동작한다(#94 의 0.26s 늦음 수정 유지).
- **권장 순서: #94 먼저 → 이 PR.** 이 PR 은 #94 와 그 함수에서 겹친다(아래 머지 검사). #94 가 머지되면 이 브랜치에 main 을 합쳐(사용자 확인 뒤) 그 한 곳을 **이 PR 쪽으로** 풀고 다시 올린다 — A 는 충돌을 풀 필요가 없다.
- 반대 순서(이 PR 먼저)라도 풀이는 같다: #94 쪽에서 그 함수는 이 PR 판을 남긴다(이미 `prewarm` 조건 포함).

### 차가운 입장 Play (대기 · 사용자가 Maker 를 완전히 껐다 켜야 한다)

| 항목 | 기대 | 결과 |
|---|---|---|
| 입장 +3s | `prewarm skipped — no job yet` · 끊김 없음(프레임 실측) | 대기 |
| 전직 A(`"play"`) +3s | 그 직업 궁 컷신(+예열 이펙트)만 · 끊김 크기 실측 | 대기 |
| 전직 B(`"preload"`) +3s | 클라 `client preload done` · 끊김 크기 실측 | 대기 |
| 첫 궁 시전 (A · B 각각) | 컷신이 첫 시전부터 제때 뜬다(화면 녹화) | 대기 |
| 같은 직업 차수 올림 | 다시 예열 안 함 | 대기 |

두 방식을 한 세션에서 비교한다: 직업마다 컷신 클립이 달라 둘 다 "차가운" 상태에서 잰다.
