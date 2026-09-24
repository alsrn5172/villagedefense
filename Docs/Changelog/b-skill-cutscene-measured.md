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
