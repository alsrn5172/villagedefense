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

### 검증

- 🟡 **Play 미검증** — 이 커밋 시점에 Maker 는 다른 세션(`b/skill-powerstrike-mul`)에 연결돼 있어 돌리지 않았다. 확인할 것:
  - 입장 0.5s 뒤 `SkillExecutors: cutscene measure` 5줄(SK_M31 · SK_W31 · SK_A31 · SK_T31 · SK_P31) · `failed` 없음
  - 직업마다 R → `[Buff] ULTIMATE invulnerable <실측+0.15>s` · 컷신이 걷히는 시점과 무적 끝이 가까운지
  - 전사 R → `buff INVULNERABLE for <실측+8>s`
