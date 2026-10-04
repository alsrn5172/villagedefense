# b/skill-pirate-followup — 해적 #116 후속 (합동 Play 2026-10-03/04 에서 고른 것)

`Skill/` 만 바꾼다(`SkillExecutors.mlua` · `SkillAttack.mlua`). A 파일 · CSV · `.ui` · `.model` · `.map` 변경 없음.
근거: 허브 `villagedefense-harness/pirate-check/FIXES-after-play.md` §1 · §2 (Play 중 사용자 결정 기록).

## 1. 먼저 올라간 것 (#116 로컬 커밋을 main 위로 옮김)

- 섬머솔트 킥 백덤블링 `curve = "smooth"`(키 전체 단조 3차 곡선) · `curve = "hold"`(키 자세를 다음 키까지 · 그림책) — 비교 후보. 기본값은 바뀌지 않는다.
- 에너지 차지 티어의 진입 · 루프 · 불꽃 클립을 해적 예열 목록에 넣는다(세션 첫 차지에서 원이 소리보다 늦던 것 · P4).
- 에너지 차지 시작 소리도 클라에 미리 받아 둔다(`PrewarmSoundsFor` → `_SoundService:LoadSound`).

## 2. 에너지 쉴드 (SK_P22) — P1 결정 "J" (2026-10-03)

- `cast` · `loop` · `loopEnd`: offsetX **0.06**(× facing = 앞) · offsetY **0** · scale **0.75** · noFlip 뺌(오른쪽을 볼 때 FlipX · 원작처럼). 예전 = 배율 1.0 · noFlip(2026-09-28).
  캡처 실측 65.3 px/유닛: 오른쪽 dx 0 / dy −1px · 왼쪽 dx −0.5 / dy −1.5px.
- 끝 연출(방울이 터짐 · `StopBuffLoop`)도 터지는 순간의 facing — offsetX × facing · FlipX.
- **loop 방향 따라가기(`followTurn`)**: 보호막 동안 돌아서면 루프 겹만 그 자리에서 새 쪽으로 다시 건다(`EnsureLoopTurnPoll` · 0.1s 간격 · 유저 × 태그마다 · 분신 살피기와 따로).
  첫 바퀴(`startDelay` 1.11s) 동안 돌아섰으면 루프를 거는 순간의 facing 으로 건다. 로그 `loop turned ENERGY_SHIELD facing a -> b re-played N layer(s)`.
  ⚠ 진입 연출(cast · 첫 1.11s)은 한 번짜리라 도중에 돌아서도 다시 걸지 않는다.

## 3. 에너지 차지 (SK_P21) — P18b 선택 (2026-10-04)

- 울트라 진입 원(`tiers.ULTRA.cast` 2f9d1267): 뒤집기 · 배율 **1.0** · offsetY **−0.10** · **5번째 프레임부터**(`startFrame = 4` · `PlayChargeEnter` 가 StartFrameIndex/EndFrameIndex 를 넘긴다). 예전 = noFlip · ×1.15.
- 울트라 루프 + 불꽃: 뒤집기 + **차지 내내 바라보는 쪽을 따라감**(`followTurn` · 루프와 `"#flame"` 두 겹을 새 FlipX 로 다시 건다 · 불꽃 뒤 층 정렬 그대로).
- 시작 소리(`castSounds.SK_P21`): 진입 원보다 **+0.40s**(`castSoundDelay` · 타이머) · 루프 · 불꽃은 0s. 로그 `start sound SK_P21 +0.4s after the cast`.
- `RemoveBuffLoop` 가 방향 따라가기 등록도 내린다(다시 거는 쪽이 지금 spec 으로 새로 올린다).
- **남은 것**: 에너지 차지 · 슈퍼 차지 티어(lv1~4)는 P18b 에서 보지 않아 그대로 둔다(진입 원 noFlip ×1.15 · 루프 · 불꽃 noFlip). 같은 값으로 맞출지 사용자 확인 필요.

## 4. 명중음 시전당 한 번 — 피스트인레인지 · 섬머솔트 킥

- 예전엔 맞은 대상마다 났다(4명 · 6명이면 같은 소리가 겹쳐 커짐). 레이징 블로우처럼 **맞은 대상이 하나라도 있으면 한 번**.
- `SkillAttack.PassHitCount`(타격 패스에서 실제로 맞은 대상 수 · BeginPass 0 · OnAttack 마다 +1).
- 섬머솔트 킥 · 피스트인레인지 판정 1번 경로: `PendingHitSound = ""` → `DealSkillDamage` 뒤 `PlayHitSoundOnce`(시전자 자리). 로그 `hit sound once SK_P11 hit=N sound=true`.
- 피스트인레인지 10타 경로(`PunchSequenceHits` 기본 true): 1번째 타격 뒤 `PassHitCount ≥ 1` 이면 첫 대상 자리에서 한 번. 로그 `PUNCH hit sound once targets=N hit=N sound=true`.

## 5. 섬머솔트 킥 (SK_P11) 백덤블링 후반 — 3버전 · 서버 속성 `BackflipSecondHalf`

P18b: 들어올림 세트 c · c1 · c2 · c3 어느 것도 후반(거꾸로 → 다시 섬)을 못 고쳤다. 원인(`skill-pages/cap/ssc_ana` 실측): swingPF 바디 액션 3·4번째 프레임이 그림을 자기 좌표에서 위 0.30(0.30–0.50s) · 앞 0.37(0.50–0.70s) 옮긴다 → 몸이 0.73 유닛 흔들리고 · 착지 자세가 땅 밑 0.08–0.10 까지 그려지고 · 270→360 을 0.03s 에 돌아 끝에서 92.6° 튄다. 전반(거꾸로까지)은 세 버전 모두 같다.

| 값 | 무엇 | 시뮬(실측 모델 · 갱신 0.035s) |
|---|---|---|
| **`"v1"` (기본)** | 자세 고정 — 소유 클라가 0.15s 에 swingPF 프레임 1(옮기지 않음)을 끝까지 붙잡는다(StartFrameIndex = EndFrameIndex = 1 · PlayRate = 0.20 ÷ 남은 시간 · Onetime) · 183° → 360° 0.30–0.60s · 0.64s 까지 선 채로 | 후반 최대 31°/갱신 · 머리 최저 0.18 유닛 · 몸 가운데 좌우 0 |
| `"v2"` | 두 축 보정 — swingPF 그대로 · comp `{0.30 앞 0.065 위 0.30} {0.50 앞 0.37} {0.70 0}` 을 회전시켜 루트에서 뺀다 · 0.64s 360° · 0.70s 끝 | 시각이 맞으면 v1 과 같다 · 프레임 바뀜과 0.02s 어긋나면 한 번 0.37 유닛 |
| `"v3"` | 자세 고정 + 영상 시간표 — 0.55s 까지 거꾸로(198°) → 0.75s 360° 감속 → 0.80s 까지 선 채로 | 후반 최대 42.5°/갱신 · 머리 최저 0.21 · 좌우 0 |
| `"c1"` | 임시 키(`spec.keys` · c1 으로 갱신) · 고정 · 보정 없음 | 92.6° · 0.11 · −0.35 … +0.37 |

- Play 에서 바꾸기: 서버 Lua `_SkillExecutors.BackflipSecondHalf = "v2"` (다음 시전부터). 서버 로그 `BACKFLIP facing=… second=v1 … hold=swingPF#1@0.15 comp=0` · 소유 클라 `backflip v1 hold swingPF frame 1 at +0.15…s for …s (rate …)`.
- ⚠ 확인 안 된 것: 바디 액션에 StartFrameIndex/EndFrameIndex 한 프레임 + 느린 PlayRate 가 실제로 그 프레임을 그만큼 붙잡는지 · 끝나면 서 있기로 돌아오는지(v1 · v3). 안 되면 v2 가 대안.
- v3 는 0.80s 에 끝나 시전 락(SkillCaster SK_P11 0.7s)보다 0.1s 길다 — 락이 풀린 뒤 0.1s 동안은 선 자세로 루트 회전만 마무리한다.

## Play 체크 (허브 `pirate-check/RUN-2.md` F1–F3 · E1–E2 · H1–H2)

1. F1 섬머솔트 킥 후반: 버전마다(`v1` → `v2` → `v3`) → Q · ← Q — 로그 `second=` · `moved 0.00` · 발 · 머리카락이 땅 밑으로 안 내려감 · 끝에서 튐 없음 → 하나 고른다.
2. F2 에너지 차지 루프 + 불꽃(울트라 · SK_P21 Lv5): → W · 차지 중 ← · 다시 → — 불꽃이 돌 때마다 몸 뒤 가운데 · 로그 `loop turned ENERGY_CHARGE … re-played 2 layer(s)`.
3. F3 시작 소리: W 양쪽 — `CHARGE enter …` 다음 `start sound SK_P21 +0.4s` · 원 + 루프 + 불꽃은 0s.
4. E1 에너지 쉴드: E 오른쪽 / 왼쪽(몸 가운데 · 0.75) · 보호막 중 돌아서기 → `loop turned ENERGY_SHIELD`.
5. E2 깨짐 양쪽: 끝 연출 가운데 · 뒤집힘 — `buff loop end effect SK_P22 … facing=±1 flipX=…`.
6. H1 · H2 명중음: W 차지 주먹 3명 이상 · Q 섬머솔트 킥 3명 이상 → 소리 한 번 · `hit sound once … hit=3` / `PUNCH hit sound once … hit=3`.
7. 빌드 경고 N → N.
