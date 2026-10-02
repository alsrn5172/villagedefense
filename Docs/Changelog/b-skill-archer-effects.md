# b/skill-archer-effects — 궁수 스킬 정리 (PR #102)

## 1차 — 궁수 로직 3건 (2026-09-26 · 사용자 지시 · origin/main `3b6c972` 합친 뒤)

궁수 스펙 대조(2026-09-26 · 원장 "Archer prep A0")에서 나온 B 쪽 어긋남 3개.

| # | 무엇 | 어떻게 |
|---|---|---|
| 1 | **더블 샷 피해가 첫 화살에만** 실려 있었다(첫 발 ×2 · 둘째 발은 `VisualOnly` — 첫 발이 빗나가면 0 · 둘째 발이 대상 주위를 돌며 좌우로 뒤집힘) | 두 발이 **같은 볼리를 공유**(`SkillAttack.IsSharedVolley` = SK_A11 · `SkillProjectile.Volley { dealt, aim }`). 두 발 모두 실제 투사체 · 피해 ×2 · 표시 2타 · 명중 이펙트/사운드. **먼저 맞힌 발이 피해를 내고**(`[SkillProjectile] volley SK_A11 dealt …`), 나머지 발은 판정 없이 대상(없으면 먼저 맞은 자리)에 닿으면 이펙트만 내고 사라진다(`FinishVolleyFollower` · `volley follower … arrived`). 한 발당 60~100% × 2타 그대로. 럭키 세븐(SK_T11)은 예전 그대로 |
| 2 | **스나이핑이 단일 대상이 아니었다**(0.8×0.8 판정 상자에 겹친 몬스터 전부) | `SkillProjectile.SingleTargetOnly`(`SkillAttack.IsSingleTargetProjectile` = SK_A21) — 유도 대상(보스 우선)만 `IsAttackTarget` 통과. 대상이 사라져 유도가 풀리면 제한 없음 |
| 3 | 툴팁 "지속 1초"(스나이핑) · "지속 1.5초"(폭풍의 화살) — CSV Duration 이 지속이 아니라 발사 시점 | `SkillWindowLogic.DurationIsDelayLabels` → **"선딜 1초"** · **"시전 1.5초 뒤 발사"**. 다른 스킬은 그대로 "지속 N초" |

- 왜 "두 발이 따로 한 번씩" 이 아닌가: 둘째 발은 첫 발 0.1~0.12s 뒤에 닿는데, 몬스터 피격 무적(`Faction/MonsterHit.mlua:5` `ImmuneCooldown = 0.4` · A 파일)이 그 사이 피해를 막는다. 그래서 피해 2타는 한 번에 내고, 먼저 닿은 쪽이 낸다. 따로 두 번 내려면 A 의 무적 규칙에 예외가 필요하다(요청은 사용자 확인 뒤).
- `SkillInfo.csv` SK_A11 `#Note` 문구만 갱신(BOM · CRLF 유지 · 열 변경 없음).
- LSP: 에러 · 경고 0 (남은 info 는 원래 있던 것). `check-integrity` 통과. **Play 확인 전 → Draft.**

### Play 체크리스트 (다음 라운드)

1. 더블 샷 · 달팽이 1마리: `volley SK_A11 dealt by this arrow x2` 1번 + `volley follower SK_A11 arrived` 1번 · 피해 표시 2타 · 둘째 화살이 대상 주위를 돌지 않음.
2. 더블 샷 · 첫 발이 먼저 맞은 대상이 죽는 경우(HP 낮은 몹): 둘째 발은 그 자리(`Volley.aim`)에서 이펙트만.
3. ⚠ `property any Volley` 에 넣은 테이블이 두 투사체 사이에서 **같은 참조로 공유되는지** 이 라운드에서 처음 확인한다 — 복사되면 둘째 발이 follower 로 안 바뀌고 무적시간에 막혀 계속 날아간다(로그 `volley follower` 없음).
4. 스나이핑 · 달팽이 3마리 겹침 + 보스 없음: 맞는 건 유도 대상 1마리뿐(HP 로그). 보스 있음: 보스만.
5. 스킬 창: 스나이핑 "선딜 1초" · 폭풍의 화살 "시전 1.5초 뒤 발사" · 나머지 스킬은 그대로.
6. 럭키 세븐 회귀 없음(첫 발 피해 · 둘째 발 연출).

## 2차 — 궁수 이펙트 라운드 (2026-09-28 · 사용자 결정 · archer-prep 패치 적용)

`villagedefense-harness/archer-prep/proposals.md` 의 결정(2026-09-27/28)대로 패치 하나당 커밋 하나. 순서 ①05 ②08 ③02 ④07 ⑤03 ⑥04 ⑦01.

| 커밋 | 무엇 |
|---|---|
| 05 | 대마법(SK_M31) 툴팁 "지속 2초" → **"충전 2초 뒤 발동"** (`SkillWindowLogic.DurationIsDelayLabels` · CSV Duration 2 = 충전) |
| 08 | 포커스(SK_A12) 아이콘 = **포커스 온 `322.img/3220021`** `ae9c846d…` (예전 = 스나이핑-보스 킬러 아이콘) · #Note 같이 |
| 02 | 화살 출발 높이 발 + 0.5 → **더블 샷 0.28 · 스나이핑 0.25** (`effectOverrides.SK_A11/SK_A21.spawn.offsetY` · 영상 실측) |
| 07 | 더블 샷 두 발 **함께 출발**(0.12s 간격 → 0 · 둘째 발 0.04 아래 · `SkillAttack.VolleyTimingOverrides`) · 럭키 세븐 등은 그대로 |
| 03 | 스나이핑(SK_A21) 이펙트 = **스나이핑 VI `324.img/3241000` 한 벌**(aim `0b6df3e0…` +0.43s · 표식 `caf81554…` 적중 때 머리 위 · 화살 `38f9664a…` · 명중 `2d79c1fb…` x0.7 · 발 + 높이 x0.22 · 최소 0.4) · 아이콘 · 소리는 3221007 그대로 · #Note 같이 |
| 04 | 닷지(SK_A22) 출발 이펙트: 그림 그대로 · **바라보는 쪽으로 뒤집기 + 캐릭터 앞에 그리기**(발판 SortingLayer · OrderInLayer 5 · 공중이면 Default) |
| 01 | 더블 샷(SK_A11) = **시그너스 `1300.img/13001003` 분홍 v3**(시전 이펙트 없음 · 명중 = 불꽃 6장 → +0.10s 폭발 7장 · 업로드 13장 · `PlaySpriteSequence`) · 파란 원본 클립은 대체용 · #Note 같이 |

## 3차 — Play 뒤 고침 (2026-09-28 · 사용자 "궁수 스킬은 영상이 기준" · 표의 로직·수치 · 아이템 외형은 그대로)

| 무엇 | 어떻게 |
|---|---|
| 닷지 출발 이펙트가 **도착점**에 떴다(클라가 먼저 옮겨 서버의 위치가 이미 도착점) | 클라가 옮기기 전에 출발 좌표를 서버에 보낸다(`SkillMovement.ReportBlinkOrigin` · Server) → `ExecuteBlink` 가 `depart.atOrigin` 일 때 그 좌표에 출발 이펙트(`TakeBlinkOrigin` · 2초 안 · 없으면 예전처럼 지금 위치 + 경고). 위치·판정은 그대로 |
| **세션 첫 시전만** 더블 샷 분홍 sprite 가 흰 공처럼(로드 전) · 스나이핑 VI 조준 클립이 ≈1s 늦게(명중 뒤) 떴다 | 입장 때 예열(`PrewarmCutscenesFor` · #116 의 cast/loopEnd 예열과 같은 자리 · 같은 방식): 스나이핑 aim · mob · impact · ball 에 `prewarm = true`(클립 · 보이지 않는 곳 x0.01), 더블 샷 `prewarmFrames = true` → 분홍 13장을 발밑 40 유닛 아래에서 `PlaySpriteSequence` 로 한 번. SK_A21 #Note 에 팩 확인 · 예열 추가 |
| 닷지 착지가 "뛰는 것처럼" 보였다 — 표의 목적지(캐릭터 스폰 로케이션)가 로비에서 바닥보다 1.2 유닛 위라 도착 뒤 떨어졌다 | 사용자 결정(2026-09-29): 목적지 규칙은 그대로, **스폰 지점 바로 아래 첫 수평 발판**에 세운다(`SkillMovement.FindFloorBelow` · 아래로 `DodgeFloorSearch` 5 유닛 `RaycastAll` · `ResolveVertical` 과 같은 방식). 발판이 없으면 예전처럼 스폰 지점. 로그 `landing snapped y … -> …` |

## 4차 — 사용자 눈 확인 Q · W · E (2026-09-29 · 영상이 기준 · 표의 로직·수치 · 아이템 외형은 그대로)

| 무엇 | 어떻게 |
|---|---|
| Q 더블 샷 화살이 영상(2009 lv.25 · 19.30~19.47s)의 **평범한 나무 화살 2발**과 달리 파란 흰 빛 화살(`3ee73e25…` = 와일드 헌터 33001105 ball/0 · 60×20) | 라이브러리에서 영상과 가장 가까운 평범한 화살 `7081cb1f…`(skill/800028.img/80002808 ball/0 · 44×8 · 갈색 대 · 회색 깃 · 앞촉 방향 같음)로 교체. 두 발 · 높이 · 속도는 그대로. SK_A11 #Note 갱신. 비교 `archer-check/captures/Q2a_doubleshot_arrow_video_vs_ours.png` |
| W 스나이핑 명중이 영상과 다르게 보였다(같은 팩 324.img/3241000) — 한 프레임씩 비교(영상 92.77~93.00s): 영상의 별 폭발 = **hit/0 0번 프레임**(228×216 · 크기 ≈0.7 은 맞음), 9줄이 줄마다 0번을 다시 틀어 폭발만 0.23s 보인다. 우리는 ① 폭발이 1~2프레임뿐 ② 옵션 없는 표식(mob)이 나중에 생겨 폭발을 덮음 ③ 1~11번(주황 타원 고리 · pivot 이 왼쪽)이 대상 앞쪽에 0.6s ④ 표식이 원본 1.0(영상 ≈0.75) | `impact` 에 `endFrame 0`(폭발만) · `holdSeconds 0.24`(반복 재생 뒤 `RemoveEffectLater`) · `front`(대상 발판 층 + `FrontEffectOrderInLayer` 5) · `mob` 에 `scale 0.75` · `sortOnMob`(발판 층 + 새 `HitMarkOrderInLayer` 3 = 폭발 아래). `ApplyOrderAt` = `ApplyFrontSorting` 의 일반형. 명중은 표대로 1타. 로그 `[SkillProjectile] hit effect SK_A21 frames 0..0 hold=0.24 layer=…/5` · `mob mark SK_A21 scale=0.75 layer=…/3`. 비교 `captures/W2_sniping_hit_layers_video_vs_ours.png` |
| E 닷지에 이펙트 두 개 · 색이 안 맞음 — 조사: 스킬 이펙트는 출발 `4797106d…`(백스텝샷 skill/520.img 5201006 effect · 주황 불꽃) **하나뿐**, 도착점의 파란 섬광은 몸 동작 `heal`(1.5배속 왕복) 안의 **궁수 외형 활 7061d571 그림**(스킬 없이 `heal` 만 보내도 왕복마다 뜸 · `alert` 는 안 뜸 · 몸 액션 로그 jump/stand1 → heal → alert → stand2) | 한 벌로 정리: 이펙트 = 백스텝샷 5201006(effect + Use 사운드 `2e47b3c1…` · 같은 팩 · 같은 시대) · `MOTION_SK_A22_BOW` 를 `alert` 2.5배속 왕복으로(섬광 없음) → `_2` alert · `_END` stand2 그대로. 이동(스폰 지점 · 아래 발판)은 표대로. 아이템 외형은 그대로. SK_A22 #Note 갱신. 증거 `captures/E2_dodge_effects_sources.png` |

## 5차 — #40 답 반영 (2026-10-01 · 사용자(강민구) 결정 2026-09-29)

| 무엇 | 어떻게 |
|---|---|
| **더블 샷 = 화살마다 1타** (#40 5884388966 (a) · 5886841184 #1 — #120 이 몬스터 피격 무적을 뺐다) · commit `0e1d93c` | `SkillAttack.IsSharedVolley` → `IsPerArrowVolley`(SK_A11 만). 두 화살 모두 실제 투사체 · **피해 ×1 · 표시 1타** · 명중 사운드 각각. 분홍 불꽃 → 폭발(`impactFollow`)은 예전처럼 **볼리당 한 번**(먼저 맞힌 화살 · `Volley { impactPlayed }`) — 눈 확인 Q 대기 중인 모습을 바꾸지 않으려고. 둘째 화살이 이펙트만 내고 사라지던 길(`FinishVolleyFollower` · `HasFollowImpact` · `VolleyArriveDistance`)은 삭제. 1차의 "두 발이 피해 ×2 공유" 와 1차 Play 체크 1 · 3(`volley … dealt` · `volley follower`)은 이걸로 대체된다. 럭키 세븐(SK_T11)은 도적 창 몫이라 그대로(첫 발 ×N) |
| 무적 전제 주석 (5886841184 #1) · `0e1d93c` | `SkillProjectile` 머리(DamageMul / DisplayHits) · `SkillAttack` 머리(같은 프레임 2번째 AttackFast) · 반사 주석(무적에 걸려 빠짐 → 매번 들어감 · 넉백만 0.4s) · SpawnProjectile 볼리 주석 |
| **스나이핑 = 대상이 사라지면 화살도 사라진다** (#40 5884388966 (b) 2번 · 단일 대상 유지) · `0e1d93c` | 유도 대상이 무효 · 파괴 · 죽음(`script.Monster` `IsDead` · HP 0 이하 = main 의 `SkillAttack.IsDeadOrDying` 과 같은 기준)이면 `OnUpdate` 가 화살을 지운다(`SkillProjectile.IsTargetGone` · `hadTarget`). 대상이 있었다가 풀린 화살은 `IsAttackTarget` 도 아무도 안 맞힌다. 처음부터 대상이 없던 화살(앞에 몬스터 없음 · 직선)은 예전처럼 제한 없음. 로그 `[SkillProjectile] SK_A21 single target gone — arrow removed` |
| **스나이핑 쿨타임 8 → 0** (#40 5884390599 · 표에 없는 쿨타임은 0) · commit `62cb056` | `SkillInfo.csv` SK_A21 Cooldown · #Note. MP 18 은 그대로(같은 답 "MP 지금 그대로") |

Play 확인(다음 라운드 · 테스트 브랜치 재구성 뒤): 더블 샷 달팽이 1마리 → `volley SK_A11 arrow hit x1 … followImpact=true` + `… followImpact=false` · 숫자 2개(각 1타) · HP 두 번 감소 · 분홍 폭발 1번 / 스나이핑 발사 직후 대상 제거 → `single target gone` · 뒤 몬스터 무피해 / 쿨 0.

## 6차 — Play 뒤 수정 (2026-10-01 · `local/test-100-102` Play 결과 · 사용자 선택) · commit `c32610a`

| 무엇 | 어떻게 |
|---|---|
| **더블 샷 간격 0.16** (영상 2009 더블 샷 · 사용자 "Gap 0.16 u is good") | `SkillAttack.VolleyTimingOverrides.SK_A11.gapY` -0.04 → -0.16. 두 발은 **같이 떠나 같이 난다**(delay 0 · 촉 맞춤 그대로). 영상의 간격은 13~15px(화살 길이의 0.17)인데 우리 화살 그림이 두 배 두꺼워 0.16 에서 두 발로 보인다 |
| **둘째 화살 명중 = 첫 명중 0.10s 뒤** (영상: 숫자 19.600 / 19.700 · 명중 소리 19.725 / 19.825) | 새 `SkillAttack.FollowHitDelay = 0.1`. 볼리 표가 `{ members, firstHitAt, followDelay }` 로 바뀜. 먼저 맞힌 발(lead)이 명중하면 나머지 발이 그 자리에서 숨고 멈춘 뒤(`SkillProjectile.HoldForFollow` · `held`) 0.10s 뒤 대상 조준점에서 한 번 판정(`ResolveHeldHit`). 아무도 안 맞으면 조용히 지운다. 피해 · 표시는 5차 그대로(발마다 ×1 · 1타) |
| **폭발 · 명중 소리 = 발마다 한 번** (사용자 결정) | 5차의 "폭발은 볼리당 한 번(`impactPlayed`)" 을 대체. 발마다 `impactDone` · `soundDone` — 대상 여럿에 겹쳐 맞아도 발마다 한 번. 다른 투사체의 명중 소리는 예전 그대로(대상마다) |
| **궁수 화살 매 프레임 판정 · 맞는 순간 그림 숨김** (Play: 화살이 대상 앞에서 사라지거나 지나쳐 날아간 뒤 사라짐) | 원인: 판정 0.1s 간격 × 초속 12 = 1.2 유닛 걸음 > 상자 0.8, 거기에 파괴 지연 0.05s 동안 0.6 유닛 더. `SkillAttack.IsFrameCheckedProjectile`(SK_A11 · SK_A21 만) → `HitInterval = 0` · `HideOnHit = true`(`SkillProjectile.HideSprite` = `SpriteRUID ""`). 에너지볼트(#100) · 럭키 세븐(#115)은 안 바꿈 |
| **스나이핑 Use 소리 +0.43s** (Play: 키 입력 순간에 나서 그림보다 0.43s 이름 · 사용자 선택 (a)) | `SkillExecutors.ExecuteProjectile` — `PlayCastSound` 를 aimDelay 타이머 안으로(조준 클립과 같이). 선딜 없는 투사체는 예전처럼 시전 순간 |
| **닷지 이펙트 · 소리 = 리트리트 샷** (Play: "드릴 같다" · 제자리 미리보기 7개 비교 · 후보 4) | depart `4797106d`(백스텝샷) → `ba912795`(모험가 궁수 리트리트 샷 skill/310.img/skill/3101008/effect). castSounds SK_A22 `2e47b3c1` → `29101cbe`(3101008 Use). 뒤집기 · 앞 층 · 출발 자리는 그대로 — **뒤집는 방향은 다음 Play 에서 양쪽으로 확인** |
| **폭풍의 화살 시전 소리 · 명중 소리** (Play 오디션 · 사용자 "pick 3" · "pick 8") | castSounds SK_A31 `62362802`(파이널 토스 Hit) → `f06e9bb7`(신궁 피어싱 3221001 Use). 새 `extraSounds.SK_A31.hit = e8eccd46`(트루 스나이핑 400031010 Hit) — 관통이라 대상마다 틀면 수십 겹 → `ExecuteLineOrigin` 이 시전 한 번에 한 번, 시전자에게 x 가 가장 가까운 첫 대상에서 튼다 |
| `SkillInfo.csv` #Note | SK_A11 · SK_A21 · SK_A22 · SK_A31 에 위 내용 덧붙임(수치 열은 안 바뀜) |

**안 바꾼 것**: 더블 샷 대상 수(화살마다 1명 vs 상자 안 전부) — #40 5917239248 A 답 대기.

검사: 스크립트 검사 0 오류 / 0 경고 · `check-integrity.cjs` 통과(경고 3 · 기존과 같음).

Play 재확인(다음 라운드 · 런시트 `villagedefense-harness/archer-check/RECHECK-c32610a.md`): 더블 샷 달팽이 1마리 → `lead=true` + `follower held 0.1s` · 숫자 · 소리 · 폭발 각 2번(0.10s 간격) · 지나침 없음 / 스나이핑 `aim clip + Use sound at +0.43s` / 닷지 양쪽 방향 / 폭풍의 화살 `LINE SK_A31 hit sound once … at first target` 한 줄.

## 7차 — 더블 샷 화살 하나 = 몬스터 1마리 (2026-10-02 · #40 5927314999 2번 · 사용자(강민구) 결정 2026-10-01)

| 무엇 | 어떻게 |
|---|---|
| **화살 하나는 몬스터 1마리만 맞는다**(몬스터 무적이 빠져 화살마다 1마리에 1타) | 새 `SkillAttack.IsOneTargetPerArrow`(SK_A11 만) → 두 발 모두 `SkillProjectile.OneTargetPerArrow`. `IsAttackTarget` 이 다른 판정을 다 통과한 뒤 `AcceptOneTarget` 으로 하나만 통과시킨다: 살아 있는 유도 대상이 있으면 그것만, 없으면(직선 · 대상이 죽음/사라짐) 처음 통과한 살아 있는 몬스터 하나(`pickedTarget` · 로그 `one target per arrow — no live homing target, picked <이름>`). 두 발은 같은 대상을 노리므로 보통 같은 몬스터에 1타씩 · 첫 발이 대상을 잡으면 둘째 발은 그 자리에 겹친 다른 몬스터 하나(없으면 조용히 사라짐). 스나이핑의 "대상이 사라지면 화살도" 규칙은 더블 샷에 넣지 않았다. 6차 Play 재확인 D6(겹친 2마리)의 기대값이 이걸로 바뀐다 |

## 8차 — 맞은 화살 숨기기를 알파 0 으로 (2026-10-03 · 합동 Play 캡처)

| 무엇 | 어떻게 |
|---|---|
| **화살마다 로딩 표시(점 고리)가 ≈0.15s 뜨던 것** (사용자 "Q 마다 화살 자리에 로딩 표시 두 개") | 원인 = 6차 `SkillProjectile.HideSprite` 가 맞은 화살(먼저 맞힌 발 · 0.10s 기다리는 둘째 발)을 `SpriteRUID = ""` 로 지웠다 — 살아 있는 엔티티에 빈 RUID 를 넣으면 MSW 가 로딩 표시를 그린다(30fps 캡처: 1프레임 화살 2발 → 2~5프레임 그 자리 점 고리 → 6프레임 사라짐). `HideSprite` 를 `SpriteRendererComponent.Color` 알파 0 으로 바꿨다(`SkillExecutors.PlaySpriteFlash` · `LaneFacilityService` 와 같은 방법). 그림 RUID · 이펙트 · 판정은 그대로 |
| **화살 하나가 두 마리를 맞히던 것** (합동 Play D6b · 겹친 2마리 모두 HP 1) | 한 화살의 판정 한 번 안에서 대상(L2)이 죽자, 같은 판정의 다음 몬스터(L1)에서 `AcceptOneTarget` 이 "살아 있는 유도 대상 없음 → 처음 통과한 몬스터" 로 넘어가 L1 도 맞혔다(같은 투사체 `_26` 이 둘 다 처치 · 둘째 발은 남은 대상이 없어 사라짐). `AcceptOneTarget` 맨 앞에 `if self.consumed then return false end` — 이미 한 번 맞힌 화살은 아무도 더 안 맞는다(`consumed` 는 첫 명중 직후 `OnAttack` 이 켠다 · 로그상 다음 몬스터 판정보다 먼저) |
| **스나이핑 화살 = Use 사운드의 "휙" 소리에 발사** (합동 Play · 사용자 선택 1.15s) | Use 사운드 `3221007/Use`(+0.43s 에 튼다) 안의 휙 소리 시작 = 0.62s(ffmpeg 10ms RMS · 0.62s 부터 큰 덩어리 · 정점 0.74s) → +1.05s. Play 에서 1.00 / 1.05 / 1.15 / 1.25 를 키로 비교해 **1.15s**(시작 +0.1) 선택. 새 `SkillExecutors.projectileReleaseExtra = { SK_A21 = 0.15 }` — 표의 선딜(Duration 1 · 툴팁 "선딜 1초")은 그대로 두고 `ExecuteProjectile` 발사(1.0 + 0.15) · 발사 자세(motion `_2` · `snipeAt`)를 같이 민다. `SkillCaster.castLockOverrides.SK_A21` 1.2 → 1.35(발사 + 0.2) |
| 닷지 이펙트 방향 확인 (합동 Play) | 원작 팩 `skill/310.img/skill/3101008` 의 `effect` 는 하나(좌우 따로 없음 · 왼쪽 보는 캐릭터 기준 그림 · 오른쪽이면 뒤집음) — 우리 `flipByFacing`(오른쪽 = flipX true)와 같다. 바꾸지 않음 |
