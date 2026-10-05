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

## 2026-10-05 (2) — 피해 시각 = 타이밍 파일 · 컷신 내내 무적 · 시전 락 = 같은 시간 (사용자 결정)

- 타이밍 파일(`컷신_타격_타이밍.txt` · 초:프레임 · 24 fps)을 모든 궁에 적용(`UltimateHitTimes` · 점 시각은 앞에서부터 · 남는 타는 구간 안에 고르게 = 칸 가운데 · "끝까지" = 영상 끝). 각 궁의 합계 피해 · 타수는 표 그대로 — 폭풍의 화살만 예외(아래).
  - 불굴의 진(SK_W31): 표에 피해 없음(8초 버프) → 피해 시각 없음. 파일의 전사 시각 4개(1.17 · 1.46 · 4.67 · 5.00)는 쓰지 않는다.
  - 대마법(SK_M31): 2.00 → **6.17** (화면 전체 6000% 1타).
  - 폭풍의 화살(SK_A31): 1.50 (4000% 1타) → **3.73 · 3.85 · 3.98 · 4.10 · 6.62 · 6.94 · 7.27 · 7.59** (8타 × 500% · 합계 그대로 · 타수 1 → 8 = 스펙 변경 · 사용자 선택 · A 확인 대기 #40 5986277680 · 스위치 `StormArrowSplitHits`).
  - 메소 익스플로전(SK_T31): 동전 N개를 Duration 1.6 − 0.15 에 끝나게 0.06 s 간격(예: 5개 = 1.21 · 1.27 · 1.33 · 1.39 · 1.45 · 중심 폭발 1.60) → **2.33 · 2.54 · 2.79 · 3.00 · 3.17**, 6번째부터는 4.46~7.75 안에 고르게(예: 8개면 + 5.01 · 6.10 · 7.20) · 중심 폭발 그림 · 명중음은 첫 동전 2.33. 동전 하나 = 50% 1타 그대로.
  - 함포 사격(SK_P31): 6파 × 5타(1.00 · 1.58 · 2.16 · 2.74 · 3.32 · 3.90) → **2파 × 15타(2.625 · 6.04)** · 합계 30 × 150% 그대로.
- 무적: 모든 궁이 시전부터 영상 끝까지(+ CutsceneInvulnPad 0.15 s · 클라 표시 지연) — `GetCutsceneSeconds` 가 영상 길이를 먼저 돌려준다. 전사도 영상 동안 피격 무시(`GetUltimateInvulnMul` SK_W31 = 1 · 영상이 있을 때) · 그 뒤 8초는 자기 버프(버프 = 영상 7.00 + 8 = 15 s).
- 시전 락 = 무적과 같은 시간(`SkillCaster.GetCastLockSeconds` · 영상 길이 + 0.15). 직업별: 전사 7.15 · 마법사 9.53 · 궁수 7.90 · 도적 7.90 · 해적 6.65 s. 락 동안은 움직이지 못한다(시전 락 규칙 그대로).
- 함포 사격의 예전 1.0 s 길이(cast.cutsceneLengthSeconds)는 영상이 있으면 쓰이지 않는다.
- 점검: LSP 0(SkillCaster 의 info 1건은 main 에도 있는 줄) · `check-integrity` 통과.

## 2026-10-05 (3) — R11 결과 반영 (f4a2032 · 사용자 looks + 로그)

- R11 사용자: 다섯 궁 그림 · 매끄러움 · 락 OK(화질은 조금 낮음 · 1280×720 비교 준비) · 숫자는 영상에 가려 안 보인다(#40 5986668970) → 피해 시각 · 합계는 로그로 확인(`villagedefense-harness/pirate-check/r11/RESULTS-relook-f4a2032.md`): 대마법 +6.17 · 폭풍의 화살 8타 +3.73…7.59 × 500%(합계 4000%) · 메소 동전 +2.33…7.20 · 함포 사격 +2.63 · 6.05 · 무적 = 영상 + 0.15 s.
- **첫 시전에 예전 클립이 잠깐 보였다**(마법사 R11 · 프레임 받는 1.33 s 동안 서버가 튼 예전 cast 클립) → 영상이 있는 궁은 cast 클립을 틀지 않는다(`PlayStageEffect` · 로그 `cast clip … skipped — cutscene video plays instead`). 다른 유저 화면에서도 예전 클립 없음.
- **소리가 배경음악에 묻힌다** → 궁마다 볼륨(`CutsceneFrameSet.soundVolume` · `PlayUltimateCastSound`): 목표 −12.6 LUFS(다른 스킬 소리 −15.6 보다 3 dB 위 · 사용자 선택) · 파일 LUFS 전사 −17.4 · 마법사 −14.2 · 궁수 −18.3 · 도적 −18.0 · 해적 −18.0 → **전사 ×1.74 · 마법사 ×1.20 · 궁수 ×1.93 · 도적 ×1.86 · 해적 ×1.86**(상한 ×2.0). 배경음악 루프백 실측은 Maker 창 포커스가 없어 무음 → 귀로 RELOOK. `PlayCastSound` 줄(#158 이 고치는 줄)은 그대로 — #158 이 먼저 머지되면 이 호출도 유저별 경로로.
- 참고: 서버 시전 게이트는 락 × 0.9(기존 여유)라 영상 끝 ≈0.7 s 전부터 서버는 새 시전을 받는다 — 클라 락이 끝까지 막는다(사용자 확인).

## 2026-10-05 (4) — main 1d518c6 합침 · A 답 2건

- main 병합: 충돌 없음(4ac2136).
- **궁 합계 데미지** — #40 5988188679 "영상이 끝난 직후 합계 데미지를 한 번 보여 준다 · 영상 중 숫자는 그대로".
  `SkillExecutors.OpenUltimateTally`(ExecuteOrigin · 영상이 있는 궁만) → 그 시전의 타격마다 `SkillAttack` / `SkillProjectile.CalcCritical` 이 최종 피해(CalcDamage × 크리 배율)를
  `AddUltimateTally` 로 더한다 → 영상 끝 + `UltimateTotalDelay` 0.1 s 에 `CloseUltimateTally` → `ShowUltimateTotal`(Multicast · `_DamageSkinService:Play` · 시전자 DamageSkinSetting 스킨 ·
  크기 ×`UltimateTotalScale` 1.4 · 발 위 `UltimateTotalOffsetY` 1.3). 피해 0(불굴의 진)이면 안 띄운다. 끄기 = `ShowUltimateTotalDamage = false`.
- **메소 익스플로전 동전마다 소리** — #40 5988188093 "동전마다 · 한 번에 최대 10개 · 동시에 겹치지 않게 연쇄로". 동전이 터질 때 명중음(4210014/Hit) 하나 ·
  시전당 `MesoCoinSoundMax` 10 개까지(앞 동전부터) · 앞 소리와 `MesoCoinSoundGap` 0.12 s 보다 가까우면 그만큼 늦춘다. 예전의 "중심 폭발 때 한 번"은 뺐다.
- 점검: LSP(SkillExecutors · SkillAttack · SkillProjectile) 깨끗 · `check-integrity` 전부 통과(경고 3 = main) · CRLF 유지. **Play 안 함** — RELOOK R15 · R16.

## 2026-10-05 통합 Play(`8efe928`) 뒤 — 배경음악 낮추기 · 궁 소리 예열 · 동전 소리 ×2.0 시전자 자리

- **main 합침**(`4990a3c` · 충돌 없음): #158 유저별 소리 경로(`PlaySkillSoundToMap` · 크기 인자)를 동전 소리에 쓰려고.
- **궁 영상 동안 배경음악 낮추기**(사용자 결정 · R11b "궁 소리를 더 키우지 말고 배경음악을 낮춘다" · 궁 소리 배율 그대로):
  - 시전자 = 영상이 켜질 때(`StartCutsceneFramesUI`) `BeginUltimateBgmDuck` → 꺼질 때(`HideCutsceneUI`) `EndUltimateBgmDuck`. 다른 클라 = 서버가 영상 소리를 틀 때(`PlayUltimateCastSound`) 대상 없이 `DuckBgmForUltimateSound`(Client · 모든 클라 = 그 소리를 받는 클라 · 시전자는 건너뜀) → 영상 길이만큼.
  - 크기 = 맵 배경음악 원래 크기(맵 `SoundComponent`(Bgm) `Volume` · 없으면 1) × `UltimateBgmDuckRatio`(기본 **0.1** · 후보 0.2 / 0.1 / 0.03 · 다음 Play 에서 하네스 키로 고름) → `_SoundService:SetBGMVolume`. 내릴 때 `UltimateBgmFadeDownSeconds` 0.25 · 올릴 때 `UltimateBgmFadeUpSeconds` 0.5.
  - 끊김: 낮춘 동안 0.2 s 마다 맵이 바뀌었거나(매치 나가기 포함) 로컬 플레이어가 죽었으면 곧바로 되돌린다(맵 바뀜은 페이드 없이) · 룸을 떠날 때(`OnEndPlay` 클라 몫 — ExecSpace 를 빼고 서버/클라로 가름). 내 영상이 일찍 꺼져도 다른 유저 영상 소리 몫이 남았으면 그때까지.
  - 엔진 설정 · A 파일 변경 없음(엔진 API `SetBGMVolume` 만). 🟡 `SetBGMVolume` 이 맵 SoundComponent 배경음악에 먹는지 · 룸을 떠날 때 클라 `OnEndPlay` 가 오는지는 Play 로 확인(로그 `BGM duck …` · `BGM restore (…)`).
- **궁 영상 소리 예열**: 직업 예열(`PrewarmCutscenesFor` · 전직 / 입장 3 s 뒤)에 그 직업 궁 소리를 더함 — `PrewarmUltimateSoundsFor` → `PreloadSoundsOnClient`(그 유저 클라 `_SoundService:LoadSound` · 로그 `client sound preload`). 프레임은 이미 `PrewarmRuidsFor` 에 있었다.
  - 참고: 통합 Play 의 첫 시전 지연(궁수 0.62 · 도적 0.50 · 해적 0.55 s · 640)은 하네스가 `DevSetJobState`(이벤트 없음)로 직업을 바꿔 예열이 안 돈 값이다 — 실제 전직은 `JobChangedEvent` 로 예열한다. 다음 빌드에서 하네스가 예열을 부른 뒤 다시 잰다.
- **동전 소리 ×2.0 · 시전자 자리**(사용자 결정 · R16 "영상 소리에 살짝 묻힌다" → A + B): `MesoCoinSoundVolume` 2.0 · `MesoCoinSoundAtCaster` true → `PlaySkillSoundToMap(hit, 시전자 자리, 시전자, 2.0)`. 개수 10 · 간격 0.12 s · 터지는 시각 그대로. 영상 소리 낮추기(D) 없음.
  - 파일 실측으로 남는 차이: 8번째(+5.28 s) ≈0.6 dB · 10번째(+5.94 s) ≈1.7 dB 아직 영상 소리 아래 · 9번째 ≈같음 · 나머지 0.6~3.1 dB 위.
- 점검: LSP(SkillExecutors) 깨끗 · `check-integrity` 전부 통과(경고 3 = main) · CRLF 유지 — 로그 `villagedefense-harness/pirate-check/after-maker-free/166-*.txt`. **Play 안 함** — 다음 빌드 RELOOK R11d(배경음악 · 비율 고르기) · R16b · N8(첫 시전 지연).
