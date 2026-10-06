# b/skill-ult-world-video — 궁 영상을 월드에 (피해 숫자 · 명중 · 동전 이펙트가 영상 위에) · 영상 동안 HUD 숨김

## 2026-10-06 — 사용자 결정 (#178 위에 쌓은 PR)

> 궁 영상 동안 피해 숫자와 명중 이펙트(동전 포함)가 보여야 한다 — 예전 빌드처럼 영상 위에. 영상 동안 HUD 는 숨긴다. UI 경로는 시험 키트 키로 비교할 수 있게 스위치로 남긴다. 기본 = 월드 영상.
> 궁 피해 · 시각 · 볼륨은 그대로.

### 왜 가려졌나

- `f9443bf`(#84 · 2026-09-26 · A 결정 #40 5830063946 "GroupOrder 제일 앞")부터 시전자 화면의 컷신은 **최상위 UI 그룹**(`ui/SkillCutsceneGroup` · GroupOrder 30)의 전체 화면 sprite 다. #166(`66020ff`)이 그 sprite 에 기획 영상 프레임을 넘기고 `a3e686e` 가 월드 클립을 껐다.
- 피해 숫자(`DamageSkinService`) · 명중 · 동전 이펙트(`EffectService`)는 **월드**에 그린다. 엔진은 UI 를 늘 월드 위에 그려서 시전자 화면에서는 전부 영상 아래였다. 그 전(9-26 이전) 컷신은 시전자에 붙인 월드 이펙트라 숫자 · 이펙트가 위에 보였다.

### 바뀐 것 (`Skill/SkillExecutors.mlua` · B 파일 하나)

| 곳 | 내용 |
|---|---|
| 속성 | `CutsceneWorldVideo`(true · false = 예전 UI 경로) · `CutsceneHideHud`(true) · `CutsceneWorldSortingLayer` "MapLayer7" · `CutsceneWorldOrderInLayer` 30000(지도 위 · Default 층 = 캐릭터 · 옵션 없는 이펙트 아래 · 런타임 확인 전 기본값) |
| `PlayStageEffect` cast | 영상이 있는 궁이면 `SpawnCutsceneScreen`(서버 · 투사체 모델을 빌린 화면 엔티티 · 알파 0 · 수명 영상 + 3 s) → `SetCutsceneScreen`(시전자 클라에 이름) → 예전처럼 `ShowCutsceneUI` |
| `StartCutsceneFramesUI` | `CutsceneWorldVideo` 이고 화면 이름이 왔으면 `StartCutsceneFramesWorld` 로. 아니면 예전 UI 경로 그대로 |
| `StartCutsceneFramesWorld` 새 | 같은 시간 규칙(1/fps · 늦으면 건너뜀 · 끝나면 `HideCutsceneUI`)으로 화면 엔티티 `SpriteRUID` 를 넘긴다 · 틱마다 알파 1 · 층 확인 · 1/60 s 마다 `PlaceCutsceneScreen`(카메라 가운데 · 화면 네 귀퉁이 `ScreenToWorldPosition` · 덮는 크기 × `CutsceneOverscan` · PPU 100) · 켜는 순간 `SetHudHidden(true)` · 배경음악 낮추기 그대로 |
| `HideCutsceneUI` | + `HideCutsceneWorld`(자리 맞추기 멈춤 · 화면 알파 0 · HUD 되돌림) — 끝 · 일찍 끊김 · 새 컷신 모두 이 길 |
| `SetHudHidden` 새 | `/ui` 아래 UI 그룹 중 `SkillCutsceneGroup` 을 뺀 보이던 그룹만 `Visible=false` · 끝나면 그 그룹만 `true`(`Enable` 은 안 건드림 · UI 스크립트는 계속 돈다) |

- 다른 유저: 화면 엔티티가 알파 0 이라 안 보인다(예전처럼 영상 없음 · 영상 소리는 그대로).
- 시험 키트(저장소 밖): `villagedefense-harness/pirate-check/r11/world_video_pick_client.lua` · **F3** = 월드 MapLayer7/30000 → 월드 Default/3 → 월드 Default/6 → UI(예전) 순환.
- **Play 안 함** — 숫자 N17 · 모습 R38. 🟡 피해 숫자 · 기본 이펙트의 실제 층 · 프레임 sprite 의 pivot(가운데로 가정) · `/ui` 경로 · 화면 엔티티가 서버 동기로 다시 숨겨지지 않는지는 런타임 미검증.
