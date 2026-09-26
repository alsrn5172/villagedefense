# b/skill-cutscene-measured

## 2026-09-24 — 궁 컷신 길이를 클립에서 실측 (무적 창 = 실제 컷신 길이)

**헤더 변경 없음 · 새 CSV 열 없음 · 새 이벤트 없음 · 새 RPC 없음.** `Docs/스키마-계약.md` 는 건드리지 않았다. Skill/ 두 파일만.

### 문제

궁 무적 창 · 분신 숨김 · 불굴의 진 버프 연장이 모두 `effectOverrides[궁].cast.cutsceneSeconds` 리터럴을 썼다(`d8ede2f`, 2026-09-13).
5개 중 실측은 전사 4.8 하나(Play 스크린샷으로 "≈4.8s 에 걷힘" · `b-skill-archer-thief-pirate.md:200`)이고, 나머지 넷(5.0 · 7.2 · 4.6 · 4.3)은
프레임 수를 89f = 4.8s 에 비례시킨 **추정**이었다. 클립마다 프레임 지연이 다르면 무적이 컷신보다 먼저 끝나거나 컷신이 걷힌 뒤까지 남는다.

- cast 클립은 `_EffectService:PlayEffectAttached(..., false, opt)` 로 끝까지 재생되고(serial 을 버림 · `RemoveEffect` 없음), `cutsceneSeconds` 는 클립을 멈추지 않는다.
- `EffectService` 는 `PlayEffect` / `PlayEffectAttached` / `RemoveEffect` 뿐 — serial 로 재생 상태·끝 이벤트를 알 방법이 없다(`EffectService.d.mlua`).
- msw-search 리소스 API(`get`/`batch`)는 프레임별 `index · spriteRuid · width · height · pivot` 만 주고 지연값은 없다.
- 런타임에는 있다: `_ResourceService:LoadAnimationClipAndWait(ruid)` → `AnimationClip.Frames[].Delay` · `AnimationClip.PlayRate`. A 의 `Boss/BossSkillRunner.mlua` `ClipSeconds` 가 이미 이 방식으로 보스 시전 클립을 잰다.

### 수정

| 파일 | 변경 |
|---|---|
| `SkillExecutors.mlua` | `MeasureCutsceneClips()`(ServerOnly) 신설 — `OnBeginPlay` 뒤 `CutsceneMeasureDelay`(0.5s) 타이머로 **한 번**(동기 로드라 시전 경로 밖). 컷신 cast 마다 `Frame.Delay` 합 → 합 > 20 이면 ms 로 보고 /1000(A 와 같은 정규화) → `PlayRate > 0` 이면 나눔 → `cutsceneClipSeconds[skillId]`. 로그 `cutscene measure <skill> ruid=… frames=… playRate=… measured=…s literal=…s`. A 의 메서드는 부르지 않고 같은 방식을 Skill/ 안에 따로 두었다(주석에 출처). |
| 〃 | `GetCutsceneSeconds` — 실측값을 먼저, 없거나 0 이면 리터럴. |
| 〃 | `PlayStageEffect` 분신 숨김 — `spec.cutsceneSeconds or CutsceneShadowHideSeconds` → `GetCutsceneSeconds(skillId)`. |
| 〃 | 리터럴 5개는 **컷신 표시 + 실측 실패 때의 대체값**으로 남긴다(예열 목록 · 분신 숨김 · 무적 창이 이 필드 유무로 컷신을 가린다). 주석만 갱신. |
| `SkillCaster.mlua` | `property number CutsceneInvulnPad = 0.15` — 컷신 길이가 있을 때 **무적 창에만** 더한다(서버 시전 처리 → 클라에 컷신이 뜨기까지의 지연). 분신 숨김 · 불굴의 진 버프 연장에는 안 더한다. 주석 `:16` · `:435` 갱신. |

불굴의 진(`buffExtendsByCutscene`)은 이미 `GetCutsceneSeconds` 를 불러 코드 변경 없이 실측값을 따른다. 예열(`PrewarmCutscenesFor`)은 그대로.

### 검증 (2026-09-24 Maker Play · MCP)

- 빌드: 오류 0 · 경고 1(`LWA-1111` · 기준선과 같음). 런타임 오류 0 · 경고 9 는 전부 이 변경 밖(`[BossCatalog]` · `LWA-3047` 부팅 · `LWA-3048` PlayerAttack/SkillAttack 중복).
- 실측 로그 5줄(입장 직후 · 전부 `playRate=1.0` · `failed` 없음). 5개 모두 **프레임당 ≈ 60ms**(옛 추정은 89f = 4.8s → 54ms/f 비례):

| 궁 | 클립 | 프레임 | 실측 | 옛 리터럴 | 차이 | 무적 창(+0.15) |
|---|---|---|---|---|---|---|
| 대마법 SK_M31 | 프로즌 라이트닝 | 92 | **5.520s** | 5.0 | +0.52 | 5.67 |
| 불굴의 진 SK_W31 | 세이크리드 바스티온 | 89 | **5.340s** | 4.8 | +0.54 | 없음(버프 8 + 5.34 = 13.34) |
| 폭풍의 화살 SK_A31 | 파이널 에임 | 133 | **7.980s** | 7.2 | +0.78 | 8.13 |
| 메소 익스플로전 SK_T31 | 일도양단 | 85 | **5.130s** | 4.6 | +0.53 | 5.28 |
| 함포 사격 SK_P31 | 드레드노트 | 79 | **4.890s** | 4.3 | +0.59 | 5.04 |

- R 5종 1회씩(로비 · Lv30 · 서버 스크립트로 직업/전 스킬 · 클라 `RequestCast`). 무적 창은 서버 타이머로 `castInvulnUntil` 을 0.02s 간격으로 봐서 시작/끝을 로그. 화면은 연속 스크린샷(파일명 ms)의 기준 프레임 대비 차이로 컷신이 걷힌 시점을 잡았다(해상도 ≈ 0.07~0.55s):

| 궁 | 컷신이 걷힌 시점(스크린샷 사이) | 무적 끝(추정) | 판정 |
|---|---|---|---|
| SK_M31 | 43.97(꼬리 보임) ~ 44.53 | ≈ 44.6 | 걷힌 직후 끝 |
| SK_W31 | 18.85 ~ 19.32 | — (버프 13.34s `OFF INVULNERABLE` 확인) | 버프 길이 = 8 + 실측 |
| SK_A31 | 22.43 ~ 22.91 | ≈ 22.9~23.1 | 걷힌 직후 끝 |
| SK_T31 | 56.68(꼬리 보임) ~ 57.20 | ≈ 56.99 | 걷히는 구간 안 |
| SK_P31 | 02.92 ~ 03.42 | ≈ 03.35~03.55 | 걷힌 직후 끝 |

  옛 리터럴이었다면 다섯 모두 무적이 컷신보다 0.5~0.8s 먼저 끝났다.
- 쉐도우 파트너(SK_T22) 켠 채 R(SK_T31): `shadow hidden for cutscene 5.1299998909235s` · 서버 감시로 분신 루프 OFF 37.168 → 재생성(`buff loop effect SK_T22 … for 43.83s`) 42.293 = **5.125s** · 무적 끝 42.429. 화면: 컷신 위에 분신이 그려지지 않음 · 컷신이 걷힌 첫 프레임(26.32~26.83 사이)부터 분신이 기준 프레임과 같은 자리에 보임.
- 확인 못 한 것: 몬스터 피격(로비라 적 없음 · `ULTIMATE hit ignored` 미확인).

## 2026-09-26 — 궁 화면 컷신을 시전자 화면에만 전체 화면 UI 로 (맵 끝 빈자리 · HUD 가 위에 그려지던 것)

**출처: #40 comment 5830063946 (A 결정 · 사용자 강민구 2026-09-25)** — B 가 새 UI 그룹을 직접 만든다(뼈대 S1 · 배선 S3 둘 다) · `GroupOrder` 는 **모든 UI 그룹 중 최상위**(값은 B · 30). 제안 = B #40 5821698253. 사용자(박승현) 지시 2026-09-26: #84 에 넣고 Play 전까지 Draft.

### 문제 (2026-09-25 Maker Play 실측 · 1920×1080 · 5821698253)

- 컷신은 UI 가 아니라 **플레이어에 붙인 월드 이펙트**다(`PlayStageEffect` → `PlayEffectAttached` · scale 1.4 · offsetY 1.0). 카메라는 맵 끝에서 멈추므로(`ConfineCameraArea`) 맵 왼쪽 끝에서는 화면 오른쪽 약 10~15% 가 비었다. 크기(20.4 × 12.1 월드 유닛)가 아니라 위치 문제.
- HUD 는 전부 UI 그룹이라 월드 이펙트의 SortingLayer/OrderInLayer 와 관계없이 **항상 위**에 그려졌다.

### 수정

| 위치 | 변경 |
|---|---|
| **새 UI 파일 `ui/SkillCutsceneGroup`** (UIBuilder · 파일 = 그룹 이름) | 루트 UI 그룹 `SkillCutsceneGroup` — `GroupOrder 30`(지금 가장 큰 `RevivePopupGroup` 20 · 런타임 21 보다 위) · `GroupType 1`(모든 그룹과 같은 층) · `DefaultShow true` · `CanvasGroup` `BlocksRaycasts false` · `Interactable false`(표시 전용 · 뒤 UI 클릭을 막지 않는다). 자식 `Cutscene` sprite 하나 — 가운데 앵커 · `Simple` · `PreserveSprite None` · raycast 끔 · **기본 꺼짐**(자리표시 sprite = 빌더 기본 · 꺼져 있어 안 보이고, 입장 때 컷신 클립을 받지 않는다). `ui_lint` clean |
| `Skill/SkillExecutors.mlua` 속성 | `CutsceneUI`(true · false 면 예전과 같음) · `cutsceneUiSprite`(Entity · UIBuilder 바인딩 = `Cutscene` UUID `ff01f805…`) · 클라 상태 `cutsceneUiToken` · `cutsceneUiTimer` · `cutsceneUiClipSize` |
| `PlayStageEffect` cast 분기 | 화면 컷신(`cast.cutsceneSeconds` 있음)이면 분신 숨김 다음에 `ShowCutsceneUI(skillId, ruid, GetCutsceneSeconds(skillId), 시전자 userId)` — **시전자 클라에만** 간다. 월드 이펙트는 그대로 모두에게 |
| `ShowCutsceneUI` (Client) | `PreloadAsync({ruid})` 콜백에서 `StartCutsceneUI`. 새 시전이 오면 번호(`cutsceneUiToken`)가 바뀌어 이전 콜백 · 끄기 타이머는 아무것도 안 한다 |
| `StartCutsceneUI` (ClientOnly) | 클립 프레임 크기(px) → UI 그룹 루트 크기(없으면 1920×1080)를 **덮는** 배율 `max(가로비, 세로비)` 로 `RectSize` · 가운데. 넘치는 쪽은 화면 밖이라 잘린다(늘이지 않는다 · 클립 1.69 : 1 이면 16:9 에서 위아래가 조금 잘린다). 같은 클립도 0프레임부터 돌게 끈 채로 `ImageRUID` 를 바꾸고 켠다 → `seconds`(서버 실측 길이) 뒤 `HideCutsceneUI` |
| `CutsceneClipSize` (ClientOnly) | `LoadAnimationClipAndWait`(PreloadAsync 뒤라 기다리지 않는다) → 프레임 `FrameSprite.Width/Height` 최대 · 최소를 로그로 · RUID 마다 캐시. 못 재면 1456×860 |
| `Docs/스키마-계약.md` | 스킬 등록서 7번 **추가 줄**(표 아래 인용 줄 — 7번 표 칸은 #86 · #83 · #85 가 고치는 8번 칸 바로 위라 겹치지 않게) + 변경 이력 1행 |

로그: `SkillExecutors: cutscene UI <SkillId> on — clip WxH canvas WxH rect WxH for Ns` · `… off` · `cutscene UI clip <ruid> frames max WxH min WxH`.

### 모르는 것 (Play 에서 확인)

- **프레임마다 크기가 다른 클립**: UI sprite 는 프레임마다 `RectSize` 에 맞춰 늘인다(원작 이펙트는 프레임을 잘라 둔다). 로그 `frames max … min …` 가 같으면 문제없다. 다르면 흔들림이 보일 수 있다 → 그때 판단.
- **UI 그룹 루트 `RectSize`** 가 실제 화면 비율을 따르는지(로그 `canvas`). 16:9 가 아닌 창에서 덮는지.
- **시전자 화면의 월드 이펙트**는 그대로 재생된다(UI 아래). 클립에 투명한 프레임(시작 · 끝 페이드)이 있으면 두 겹이 보일 수 있다.
- 같은 궁을 쿨타임 뒤 다시 쓸 때 0프레임부터 도는지 · 채팅 아이콘(엔진 기본 채팅)이 덮이는지.

### 검증

- LSP 진단: 에러 0 · 경고 0. `ui_lint` clean. `check-integrity`: 통과.
- **Maker Play: 아직** — 새 UI 파일은 Maker Refresh 로 등록된다(로컬 테스트 브랜치 #83 + #98 + #84 한 번에). 체크리스트는 PR 본문.
