# b/skill-ultimate-cutscenes — 궁 컷신을 기획 영상(share-mp4 5종)으로

## 2026-10-05 (B · 무인 밤 작업 · 사용자 승인: 업로드 · 새 브랜치 · Draft PR 하나)

- 원본: `share-mp4/<직업>.mp4` 5개(1280×720 · 24 fps) + 같은 이름 wav 5개 + `컷신_타격_타이밍.txt`. 짝 = 파일 이름(사용자 결정 2026-10-05). 피크 검사(타격 시각 ±0.06 s): 전사.wav = 전사가 분명 · 도적.wav = 도적이 약하게 · 해적.wav = 어느 쪽도 분명하지 않음 → 이름대로 짝지음.
- 애니메이션 클립 업로드 길은 안 됐다(2026-10-05 04:44 GIF 시험 · 완료 단계 오류 · 업로드 종류가 sprite / audioclip / avataritem 뿐) → **프레임을 sprite 한 장씩** 올리고 스크립트로 넘긴다. PNG 한 장 시험(08:30 · `532a7037…` · Play 에서 전체 화면 UI 에 그려짐) 뒤 나머지를 올렸다.
- 업로드 결과: 307장(전사 56 · 마법사 75 · 궁수 62 · 도적 62 · 해적 52) 전부 RUID · 실패 0 · 중복 0 · 목록 = `villagedefense-harness/pirate-check/ultimates/manifest-*.json`. 궁수 마지막 7장(f056–f062)은 원본 영상 끝의 거의 빈 화면.
- 고른 값: **8 fps · 640×360**(영상 길이 6.5–9.3 s → 궁마다 52–75장 · 장당 ≈0.3 MB). 24 fps 는 장 수가 3배(≈920장)라 업로드 · 예열이 너무 크고, 640×360 은 1920×1080 화면에 3배로 늘어나지만 컷신 그림이 부드러운 일러스트라 계단이 거의 안 보인다(사용자가 보고 정한다 — RELOOK).
- `RootDesk/MyDesk/Skill/SkillExecutors.mlua`
  - `CutsceneFrameSet(skillId)`(서버 · 클라 공용 리터럴 · 컷신 UI 메서드 옆): 궁 5개의 `{ fps, width, height, sound, frames }` — `villagedefense-harness/pirate-check/ultimates/manifest-*.json` 에서 `gen_frames.py` 로 만든다.
  - `ShowCutsceneUI`: 프레임 세트가 있으면 프레임 전부를 받아 둔 뒤(`PreloadAsync`) `StartCutsceneFramesUI` — 전체 화면 UI sprite 에 1/fps 마다 넘기고(타이머가 늦으면 건너뛰어 영상 시간을 지킨다) 마지막 프레임 다음에 끈다. 크기 · 오버스캔은 예전 클립과 같은 규칙. 길이 = 프레임 수 ÷ fps(영상 길이).
  - `PrewarmRuidsFor`: 그 직업 궁의 프레임도 예열(첫 시전에 영상이 늦게 뜨지 않게).
  - `ApplyCutsceneSounds`(OnBeginPlay · BuildCastSounds 바로 뒤): 궁 5개의 `castSounds` = 프레임 세트의 `sound`(그 직업 영상 소리 · 모두가 듣는 시전 소리). 표 줄은 그대로 둔다 — #102 가 바로 옆 줄을 고쳐 합칠 때 충돌해서. wav 그대로는 등록 단계에서 5개 모두 "unexpected error" → ffmpeg 로 ogg(libvorbis q6 · 120–200 KB)로 바꿔 올렸다(소리는 같다).
  - 스위치 `CutsceneVideoFrames`(기본 true · false = 예전 클립 경로).
- **바꾸지 않은 것(열린 항목)**: 궁 피해 시각 · 무적 · 시전 락 · 함포 사격 파(예전 그대로). `컷신_타격_타이밍.txt` 의 타격 시각(전사 1.17 · 1.46 · 4.67 · 5.00 / 마법사 6.17 / 궁수 3.67–4.17 · 6.46–끝 / 도적 2.33 · 2.54 · 2.79 · 3.00 · 3.17 · 4.46–끝 / 해적 2.62 · 6.04)에 피해를 맞출지는 사용자가 영상을 본 뒤 정한다. 다른 유저 화면의 월드 이펙트(예전 클립)도 그대로.
- 함포 사격: 예전엔 자리표시자 클립을 1.0 s 만 보였다(#40 5897840056). 영상은 6.54 s 전체를 보인다 — 무적 1.15 s · 첫 폭격 +1.0 s 는 그대로라 영상 중에 폭격이 시작된다.

### Play 체크 (RELOOK — 직업마다 한 번)

1. 궁 R(전사 · 마법사 · 궁수 · 도적 · 해적): 영상이 화면을 덮고 끝까지(6.5–9.3 s) 돈다 · 끊김 없이 8 fps · 소리가 영상과 맞는다 · 끝나면 꺼진다. 로그 `cutscene video SK_X31 frames ready x… in …s` · `on — N frames @ 8 fps` · `done`.
2. 두 번째 시전도 같다(예열 · 캐시).
3. 그림 크기 · 화질(640×360 늘림)이 괜찮은지 · 타격 시각을 영상에 맞출지(열린 항목).
