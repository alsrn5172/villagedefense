# b/skill-magician-effects — 마법사 스킬 연출 정리 + 에너지볼트 폭발 판정 (B)

> Draft PR #100 `[b/skill-magician-effects] 마법사 스킬 연출 정리 + 에너지볼트 폭발 판정` · base `main`(`286f17a`). 이 브랜치의 조각 로그. 릴리스 때 `Docs/CHANGELOG.md` 로 합친다(협업-규칙 §11).
> 근거: 사용자 박승현 결정 2026-09-26 · 기획표(`Docs/추가기획1/기획 정리 ….md` 마법사 A "지정 위치 광역 공격" 140% → 220%) · 기획 확인(에너지볼트 = 처음 맞은 적 자리에서 폭발 · 최대 6명).
> 계약 변경 없음: 새 표 · 열 · 열거값 · 이벤트 없음. 폭발 범위 · 최대 대상 수는 코드 데이터(`SkillExecutors.effectOverrides.SK_M11.explode`). A 파일 편집 없음.

## 2026-09-26

### 에너지볼트(SK_M11) — 처음 닿은 적 자리에서 폭발 · 최대 6명

- `Skill/SkillProjectile.mlua`: 폭발형 투사체. `ExplodeSizeX/Y > 0` 이면 날아가는 상자(0.8 × 0.8)에 닿은 몬스터를 피해 없이 모으고(`TryExplode` · probe 패스), **첫 대상**(유도 대상이 닿았으면 그것, 아니면 볼트에서 가장 가까운 것) 발 기준 폭발 상자(중심 = 발 + `ExplodeCenterY`)를 한 번 더 모은 뒤 `Explode` 가 **첫 대상 + 폭발 중심에서 가까운 순으로 최대 `ExplodeMaxTargets` 명**만 `AttackFast` 로 때린다(`AllowedTargets` 필터 · `IsAttackTarget`). 피해 · 크리 · 픽파켓 · 명중 이펙트는 보통 명중과 같은 길(`CalcDamage` = `DamageAt` · `OnAttack`). 폭발 상자가 첫 대상 콜라이더에 안 닿으면(키 큰 몬스터) 닿았던 비행 상자로 첫 대상만 한 번 더. 볼트는 터지면 사라진다.
- 같은 층 판정(`SameFloorOnly`)은 폭발에도 그대로 — 아래층 몬스터는 폭발 상자 안이어도 안 맞는다.
- 명중 사운드는 폭발 한 번에 **한 번**(대상마다 같은 소리가 겹치지 않게). 명중 이펙트는 대상마다(원작처럼).
- 로그: `[SkillProjectile] EXPLODE SK_M11 first=… at (x,y) box 2x1.1 inBox=N firstInBox=… chosen=M/6 hit=H (uid)` + 맞은 대상마다 `EXPLODE hit #k …`. `SkillAttack: spawned projectile … explode=2x1.1@0.25 max=6`.
- `Skill/SkillAttack.mlua`: `SpawnProjectile` 마지막 인자 `table explode`(`{ sizeX, sizeY, centerY, maxTargets }`) → 첫 발 투사체에 넣는다(볼리 2발째부터는 VisualOnly 라 없음). 빈 표 = 예전처럼 닿은 것만(다른 투사체 스킬 그대로).
- `Skill/SkillExecutors.mlua`: `effectOverrides.SK_M11.explode = { sizeX 2.0, sizeY 1.1, centerY 0.25, maxTargets 6 }` · `GetProjectileExplode(skillId)` · `FireProjectile` 이 넘긴다.
- **폭발 범위 출처(확정값 · #40 5844239609):** KMS 클라이언트 스킬 데이터 `Skill/200.img/skill/2001008/common` — `info/rectBasedOnTarget = 1`(맞은 적 기준 상자).
  - v359(리마스터 직전 · 우리가 쓰는 레드 팩과 같은 시기): `lt(-100,-80)` `rb(100,30)` = 200 × 110 px → **2.0 × 1.1 unit, 발 아래 0.3 ~ 위 0.8** ← 채택.
  - v360(2022-01-27 리마스터) ~ v389: `lt(-120,-75)` `rb(120,75)` = 2.4 × 1.5 unit.
  - 원작 `mobCount` 는 4 — 우리는 기획 확정 6.
  - 출처: `https://maplestory.io/api/wz/KMS/359/Skill/200.img/skill/2001008/common/lt` (· `/rb` · v360 · v389 같은 경로).
- 피해는 기획표 그대로 140% → 220%(대상마다 같음 · `SkillInfo.csv` 변경 없음).

### 에너지볼트 명중 사운드

- `extraSounds.SK_M11.hit = ab4202ad4cac42a397a120a335bb038f` — 같은 레드 팩(`200.img/2001008`)의 `_audio/Hit`(쓰지 않던 것). 한 모습 규칙(같은 버전 부품).

### 매직 가드(SK_M22) — 레드(2013) 모습 채우기 + 시전 자세 (사용자 Play 선택 2026-09-26)

- **발밑 고리:** 같은 레드 팩(`200.img/2001002`)의 쓰지 않던 `effect0` `95a6cf7f7f0b46aab39a45b166dc446d`(7프레임 · 발밑 금빛 고리)를 `effectOverrides.SK_M22.ground` 로 추가. `ExecuteBuff` 가 요정(`cast`)과 **같은 순간** `PlayStageEffect(…, "ground", …)` 로 재생 · `ground` 단계도 시전자에 붙인다(시전 락이 풀린 뒤 걸어가도 발밑에 남음). 높이 0 · 크기 1.0 · 지연 0 = 사용자 선택.
  - 근거(원작 영상 · 레드 구간 30fps): 첫 시전 **8.380s** 에 요정 f0 · 고리 f0 · 자세 변화가 같은 프레임. 고리 띠 8.48 · 가장 밝음 8.58. (리마스터 구간은 요정 15.300 → 폭발+고리 15.700 = +0.40s 로 다르다 — 우리는 레드 모습이라 0.)
  - "몸을 한 바퀴 감싸는 고리" = **이미 쓰던 요정 클립 `7969eaa9…` 의 7~10프레임**(반짝이 원호 · 시전 뒤 0.84~1.32s · 영상 9.08~9.43s) — 새 클립 불필요. 5~6프레임 = 빛기둥(영상 8.88~9.05s). Play 에서 8프레임을 붙잡아 영상 9.20s 와 같은 자리 확인.
- **시전 자세:** heal 1.5배속 왕복 → `_2` alert 2.5배속(1.0s) → `_END` stand1(1.6s) 을 **alert 2프레임 붙잡기(낮춘 자세) → `_END` stand1 0.72s(M5 · `06e2aed`)** 로 교체.
  - 근거: 영상 8.347s 서 있기 → 8.380~≈8.85s 몸을 살짝 낮추고 돌림(≈0.47s) → 9.08s 서 있기. 메이커 아바타엔 원작 버프 자세가 없어 Play 에서 후보(stand1 · alert f0/f1/f2 · sit · prone · jump · heal f0 · stabO1 f0 · swingO2 f0) 를 붙잡아 비교 → 번호키로 alert f2 / sit / stabO1 f0 순서를 돌려 보고 **alert f2** 선택.
  - 코드: `SkillExecutors.motionHoldFrames = { SK_M22 = 2 }` → `PlayMotion` 이 그 모션이면 A 의 `PlayerMotion.PlayAction` 대신 새 클라 RPC `PlayHeldAction(core, parts, frame)`(body `ActionStateChangedEvent` · Start = End = frame · Loop). `GetMotionSequence.SK_M22 = { _END 0.45 }`.
  - `WeaponMotion.csv`(B 행만 · 헤더 그대로): `MOTION_SK_M22_WAND` heal 1.5 ZigzagLoop → **alert 1 Loop**(프레임은 코드) · `MOTION_SK_M22_2_WAND` **Enabled=false** · `MOTION_SK_M22_END_WAND` 메모만.

### 텔레포트 강화(SK_M21) 도착 이펙트 — 썬콜 텔레포트 부스트 (사용자 Play 선택 "keep")

- `effectOverrides.SK_M21.impact` `211.img/2111007` 텔레포트 마스터리(불독) 불꽃 `8e1130db…` → **`221.img/2211017` 텔레포트 부스트(썬콜) effect `5acb898b8198481ca425148da2193feb`**(11프레임 · 145×147 · 60ms = 0.66s · 작은 구 → 푸른 소용돌이 고리). 기준점 = 발(원작 origin 이 고리 중심보다 ≈34px 아래 → 허리 높이 고리) · 오프셋 없음 · 도착 시점 그대로.
- 이유: 우리 마법사 궁이 썬콜 프로즌 라이트닝인데 도착 연출은 불독 불꽃이었다. 라이브러리의 텔레포트 마스터리 팩은 불독 `2111007` 하나뿐(썬콜 `2211007` · 비숍 `2311007` 없음) → 같은 썬콜의 텔레포트 이동 연출.
- 라이브러리 전체 검색 결과(2022 리마스터 텔레포트 = 세로 빛줄기 번쩍임은 **없음** · 텔레포트 팩은 우리가 쓰는 `2001009` 하나): 원장 Round 7.

## Play 결과 (2026-09-26 · 로컬 전용 main + #82 + #100 · Maker MCP)

빌드 경고 1 → 1(`LWA-1111` 그대로) · 오류 0. 런타임 오류 = StartMatch 테스트 준비의 `[BalrogRoom] 방N 스포너 없음` 6건(로비 정적 룸) · 테스트 하네스 정리 때 `LEA-3051 MemoryLeak`(메모리 스크립트 타이머) — 둘 다 이 PR 코드 아님. 준비: Lv30 마법사 3차 · 은빛 완드 · 스킬 전부 최대 · 쿨 0 · MP 500000 · 달팽이 100M HP.

| # | 확인 | 결과 |
|---|---|---|
| E1 | 달팽이 1 · Q | PASS `EXPLODE SK_M11 first=T100snail_1 at (-6.84,-1.18) box 2.0x1.1 inBox=1 firstInBox=true chosen=1/6 hit=1` |
| E2 | 달팽이 8 무더기 · Q | PASS `inBox=8 chosen=6/6 hit=6` · HP: 1~6번 각 −165(= 75 × 220%) · 가장 먼 7·8번 −0 |
| E3 | 폭발 가장자리 | 첫 대상 기준 +0 / +0.5 / +0.9 / +1.1 맞음 · +1.5 안 맞음 = 상자 반폭 1.0 + 달팽이 판정 반폭 0.2(`BoxSize.x 0.4`) ≈ 1.2 · 사용자 눈 확인 |
| E4 | 아래층 | 안 돌림(같은 층 판정 코드는 그대로) |
| E5 | 앞에 없음 | PASS `candidates=0 -> none` · `target=none` · EXPLODE 없음 |
| E6 | 가는 길 몬스터 | 안 돌림(최근접 = 유도 대상이라 E1 과 같은 경우) |
| E7 | 더블 샷 · 럭키 세븐 | PASS 둘 다 `explode=none` · EXPLODE 없음 · 예전 경로 |
| M1 | 매직 가드 고리 | 메모리 하네스로 확인 → 높이 0 · 크기 1.0 · 지연 0 선택 |
| M2 | 매직 가드 자세 | 메모리 하네스로 확인 → alert f2 0.45s → stand1 선택 |
| T1 | 텔레포트 강화 도착 | 메모리로 썬콜 포털 교체 → keep |
| G1 | 대마법 폭발 명중 · 컷신 뒤 자세 | 사용자 확인 OK(컷신 오른쪽 띠 = #84 오버스캔 미포함 · 이번 범위 밖) |

⚠️ M1 · M2 · T1 은 **메모리 하네스**(클라 스크립트 · 서버 표 수정)로 본 모습이다. 이 커밋의 코드 경로(`ground` 단계 · `PlayHeldAction` RPC · `effectOverrides.SK_M21`)는 아직 Play 로 안 돌렸다 → 다음 Play 에서 로그 `ground effect SK_M22 attached` · `held action alert frame 2` · 도착 이펙트 확인.

## Play 체크 (처음 계획 · 참고)

| # | 확인 | 기대 |
|---|---|---|
| E1 | 달팽이 1마리 · Q | `EXPLODE … inBox=1 chosen=1/6 hit=1` · 피해 = 예전과 같음(Lv5 220%) |
| E2 | 달팽이 8마리 한 무더기 · Q | `inBox=8 chosen=6/6 hit=6` · 6마리만 HP 감소 · 명중 이펙트 6개 · 사운드 1번 |
| E3 | 폭발 상자 크기 vs 명중 이펙트(hit/0 222×174 px) | 가장자리 달팽이가 맞는/안 맞는 위치를 눈으로 — 사용자 판단 |
| E4 | 아래층 달팽이 | 폭발 상자 안이어도 안 맞는다 |
| E5 | 앞에 아무도 없음 | 볼트가 직선으로 날아가 사라짐 · EXPLODE 로그 없음 |
| E6 | 가는 길에 다른 몬스터 | 유도 대상 전에 닿은 몬스터에서 터진다 |
| E7 | 다른 투사체(더블 샷 · 럭키 세븐 · 스나이핑) | `explode=none` · 예전과 같음 |

## 커밋된 코드 Play (2026-09-26 · `b662d06` · main folder = 이 브랜치)

빌드 경고 **1 → 1**(`LWA-1111`) · 오류 0. 준비는 메모리(`StartMatch` · Lv30 · 마법사 3차 · DEV 스킬 · 달팽이 8마리 100M HP).

| # | 결과 |
|---|---|
| EB | PASS 7마리 밀집 + 1마리 +1.6 → `EXPLODE SK_M11 … inBox=7 … chosen=6/6 hit=6` · 1~6 −165 · 7(상자 안 · 상한) −0 · 8(밖) −0 |
| MG | PASS `cast effect SK_M22 attached` + `ground effect SK_M22 attached`(같은 호출) · `held action alert frame 2` → `stand1` +0.464s |
| TM | PASS `BLINK SK_M21 … arrivalDamage=true` · 도착 = `5acb898b…`(불꽃 없음) |
| TP | PASS(SK_M21 안 배운 상태) `SK_M13 … dist=2.5` · 도착 `1fc628fe…` 그대로 |

## 사용자 Play 선택 반영 (2026-09-26 · 메모리 하네스 H8b/H8c → 코드)

- **에너지볼트 시점 = E3**(사용자 "타이밍 좋다"): 시전 클립 전체를 키 누름에 · 볼트는 **+0.50s**(`effectOverrides.SK_M11.spawn.delay`). 영상(레드 2013 · 30fps · 실효 ≈10fps): 첫 이펙트 5.867 / 7.433 → 별빛 → 구체 6.167–6.333 / 7.733–7.900 → **구체가 그 자리에서 볼트가 됨** 6.367 / 7.933 → 명중 6.633 / 8.200.
- **에너지볼트 크기 · 위치 = P2**(영상에 가장 가까움): 영상 배율 1.67(뿔버섯 56×52 → 94×87). 발 기준 native px — 구체 중심 영상 (41, 22) vs 우리 (62, 29) · 크기 영상 ≈ 1.15배 → `cast.scale = 1.15` · `offsetX = −0.30` · `offsetY = −0.11` → 구체 중심 (0.41, 0.22). 볼트 출발점 = 같은 구체 중심 `spawn (0.41, 0.22)`. 볼트 크기 · 명중 이펙트 크기는 영상과 같아(1.0) 그대로.
- **텔레포트 · 텔레포트 강화 도착 = 오른쪽을 볼 때 뒤집기**(사용자 선택 3): 새 spec 필드 `flipWithFacing`(PlayStageEffect impact 분기 · 없으면 예전 그대로) · 텔레포트 크기 **1.15**(사용자 "캐릭터보다 조금 크게"). 강화 포털은 1.0.
- 남은 차이(코드 밖 · 다음에): 명중 이펙트 위치 — 우리는 대상 콜라이더 중심에 클립 원점을 둬 그림이 영상보다 ≈0.2 낮다(영상은 몸 중심). `SkillProjectile.OnAttack` 에 높이 오프셋이 없어 메모리로 못 바꿨다.

## 명중 이펙트 높이 +0.20 (2026-09-27 · 사용자 "코드로 0.2 정도 올려")

- `SkillProjectile.HitPointOf(target)` 새 메서드: 대상 콜라이더 중심(없으면 발 + `TargetAimOffsetY`) · **스킬별 예외 없음**. `OnAttack` 명중 이펙트 = `HitPointOf + (0, HitEffectOffsetY)`. 조준점 `AimPointOf` 는 그대로(볼트 궤적용) — main 의 #82(에너지볼트 조준 = 발 + 0.5)와 섞여도 명중 그림 자리는 바뀌지 않는다.
- `SkillProjectile.HitEffectOffsetY`(기본 0) ← `SkillAttack.SpawnOneProjectile` 이 `SkillExecutors:GetImpactOffsetY(skillId)`(= `effectOverrides[skill].impact.offsetY` · 없으면 0)로 넣는다.
- `SK_M11.impact.offsetY = 0.20` — 다른 투사체(더블 샷 · 럭키 세븐 · 스나이핑 · 애로우 블로우)는 0 = 예전과 같음.

## 에너지볼트 조준 = 발 + 0.22 · 수평 비행 (2026-09-27 · 사용자 선택 3)

- main 합침(`3b6c972` · #82 포함) 뒤 `SkillProjectile.AimPointOf` 의 SK_M11 예외를 **발 + 0.5 → 발 + 0.22**. 발사 높이(`effectOverrides.SK_M11.spawn.offsetY` 0.22)와 같아 볼트가 수평으로 난다(레드 영상 ≈0.20 수평). #82(B · 곡선 궤적 복구)의 곡선은 없어진다.
- 다른 투사체는 그대로(콜라이더 중심). 명중 그림 자리(`HitPointOf` + 0.20)도 그대로.

## Round 9 사용자 확인 반영 (2026-09-27)

- **매직 가드 자세 0.45s → 0.72s** (M5 · 사용자 "요정이 반짝이를 뿌릴 때까지"): `GetMotionSequence SK_M22 _END` 0.72 = 요정 클립(2001002 effect · 12프레임 × 0.12s)의 첫 반짝이 6프레임 시작. Play 메모리 비교(클라 body 로그): 새 값 → `stand1 t=+0.711` · 예전 → `+0.473`. `WeaponMotion` B 행 3개 비고(#Note)만 0.72 로(값 열 그대로).
- **에너지볼트 조준 설명 정정** (M7 · 사용자 수용 · 최종): 조준 = 대상 발 + 0.22 → 같은 높이 대상에는 수평, 높이가 다른 대상(날아다니는 몬스터)에는 그쪽으로 기울어 명중. 코드 주석만.
- Round 9 Play 결과: M2 · M3 · M6 · M7 통과(사용자) · M7 자동 확인 — 레이스 · 주니어 부기 수평 0.220 명중 · 스티지 · 깊은 숲 위습(0.85 위) 기울어 명중.

## 텔레포트 강화 도착 피해 hit 그림 (2026-09-27 · Round 9 사용자 keep)

- `effectOverrides.SK_M21.hit = 66e6b33e…` — 라이브러리의 불독 텔레포트 마스터리 `skill/211.img/skill/2111007` `hit/0`(5프레임 × 90ms · 94×96 · KMS v359 시기). 썬콜 2211007 · 비숍 2311007 팩은 라이브러리에 없다. 이 스킬 아이콘 · 사운드와 같은 팩.
- `ExecuteBlink` 도착 피해 호출에서 바로: `SkillAttack.PendingImpactRuid = hit` + 새 `PendingImpactAtBody = true` → `SkillAttack.OnAttack` 이 맞은 몬스터마다 **몸 중심(콜라이더 중심) · 크기 1.0 · 뒤집기 없음**으로 재생. `EndPass` 가 둘 다 지운다. 다른 스킬의 impact(발 + 0.5)는 그대로.
- 피해 % · 범위(2.4 × 1.6) · 대상 수(제한 없음)는 그대로 — #40 5849932530 기획 답 대기. Play 메모리 확인: 도착마다 달팽이 8/8 · 박쥐에 hit 그림.
- 박쥐 측정(코드 변경 없음): 이 빌드의 박쥐는 날지 않는다(MoveType fly 를 쓰는 코드 없음 · 중력 1.0 · 판정 = 박쥐 발 위 0.20~0.52). 착지 13번 시험 — 가로 1.44 이내 · 박쥐 발 1.40 미만 높이면 명중(13/13 예측 일치). 제보 때 빗나간 7번은 가로 2.1~3.0.
- **새는 경로 막기(사용자 요청):** `DealSkillDamage` 관전자 차단으로 빠질 때도 `EndPass`(impact · 몸 중심 · 사운드 초기화) · `DealSkillDamageToTarget(Scaled)` 대상 없음으로 빠질 때도 `EndPass` · `ExecuteBlink` 는 호출 뒤에 `PendingImpactRuid` / `PendingImpactAtBody` 를 한 번 더 지운다 → 몸 중심 설정이 다음 타격 패스로 새는 경로가 없다.

## 텔레포트 강화 수치 = 기획 답변 2·3 (2026-09-27 · 기획표 정본 규칙)

근거: 기획 답변 2026-09-24 — 저장소 밖 사본 `메월드폴더/vd-audit/Docs/skill-spec.md` "Planner answers 2026-09-24" 2번 · 3번.
- 답변 2 "피해는 70%(Lv.1) → 110%(Lv.5)로 낮춰 주세요 · 범위 2.4 × 1.6 은 OK" → `SkillInfo.csv` `SK_M21` **BaseEffect 110 → 70** · EffectPerLevel 10 그대로(70 · 80 · 90 · 100 · 110, `SkillDatabase.mlua:256`). 범위(`SkillExecutors.BlinkArrivalAoeSize` 2.4 × 1.6)는 그대로.
- 답변 3 "텔레포트 강화를 배우면 Lv.1 부터 1초 · 레벨업하면 도착 피해만 오릅니다" → **Cooldown 2 → 1 · CooldownPerLevel −0.25 → 0**(Lv1~5 전부 1초, `SkillDatabase.mlua:301`). 기본 텔레포트 `SK_M13` 쿨 2초는 그대로.
- `#Note` 를 위 값으로 고쳤다(쿨 · 피해 · 범위 출처 · 지금 쓰는 도착 연출 `5acb898b` · hit `66e6b33e` · 원작 팩 effect `8e1130db` 는 안 씀 표시). Description("쿨타임이 절반이 되고 …")은 2초 → 1초 그대로 맞아 안 바꿨다.
- 값 열 두 칸 + 노트 한 칸만 바뀐 한 줄 변경(헤더 · 다른 행 불변 · BOM 1개 · CRLF 유지). 코드 변경 없음.
- 답변 2 의 나머지("에너지볼트 시전 중에도 텔레포트" · "텔포를 써도 볼트 피해 그대로")는 이미 코드에 있다: 이동 스킬은 시전 락 예외(`SkillCaster.mlua:45` · `:231`). 이번 커밋에서 건드리지 않았다.
- Round 9 확인 항목: 텔레포트 강화 Lv1~5 도착 피해가 70 · 80 · 90 · 100 · 110% × 공격력인지 · Lv1 부터 쿨 1초.

## 마법사 표 전체 대조 · 표에 맞춰 변경 (2026-09-27)

규칙: 추가기획1 표(마법사 6행) + 기획 답변(2026-09-24)이 정본. 표에 없는 값은 지금 기본값을 두고 #40 에 묻는다. 원작은 연출 기준만.

- **대마법(SK_M31) — 표에 맞춰 변경, commit `1fdceb9`.** 표 "단일 대상 초고피해 (컷신) · 공격력 6000%(고정)" · 기획 메모 "화면 전체 광역 → 단일 초고피해 · 발록전이 목표". `SkillExecutors.ExecuteBlast` 의 반경(원형) 피해(`DealSkillDamageCircle` · 반지름 = Range 3 안 전부)를 **고른 대상 하나에만**(`SkillAttack.DealSkillDamageToTarget` · HitCount 1)으로 바꿨다. 대상 고르기(화면 안 보스 우선 · 없으면 시전자에게 가장 가까운 몬스터)는 그대로 — 표에 없는 규칙이라 기본값(#40 질문). 대상이 없으면 피해 없음. 폭발 그림(원작 hit `05ab65bf` × 2.0)은 대상 자리에 그대로, Range 3 은 대상이 없을 때 그림 위치만. `SkillInfo.csv` SK_M31 Description(툴팁) · #Note · 코드 주석(`:10` · `:403` · ExecuteBlast 머리 · ORIGIN 분기)도 단일 대상으로(`:103` 연출 파라미터 주석은 #83 과 새 충돌이 나서 `932e0f1` 로 원래 문구 유지). 6000% 는 레벨 1 고정 · ★ 배율 없음(`SkillDatabase.DamageAt` = 공격력 × 6000 / 100).
- **매직 가드(SK_M22) 툴팁 — 표에 맞춰 변경, commit `e77b3c0`.** 표 효과 열의 "스킬 사용 시 소모 MP가 50% 증가한다" 가 툴팁(Description)에만 없었다. 코드는 이미 적용(`SkillBuffs.GetMpCostMul` 1.5 · `SkillCaster.mlua:521`).
- **텔레포트 강화(SK_M21) — 표에 맞춰 변경, commit `9fd50f0`**(위 절).
- 나머지는 표와 같다: 해금 Lv10/10/20/20/30/10 · 키 Q / (패시브) / Shift / E / R / Shift · 에너지볼트 140→220% · 연성 30→50% · 텔레포트 쿨 2초 · 텔레포트 강화 쿨 1초 · 거리 2.5 → 3.25(+30%) · 매직 가드 45초 · 쿨 60초 · 흡수 35/45/55/65/75% · 현재 MP 5% 추가 피해 · MP 소모 ×1.5 · 공중 점프 = 텔레포트(`SkillHotbar.TryAirJumpTeleport`).
- 해석이 갈리는 것은 커밋하지 않았다(PR 본문 · 원장에 제안): 에너지볼트 "지정 위치 광역"(지금 = 앞으로 나는 투사체가 처음 닿은 적 자리에서 폭발 2.0 × 1.1 · 최대 6명) · 대마법 툴팁 "지속 2초"(= 충전 2초, 지속 아님 · `SkillWindowLogic.FormatEffect` — #102 의 `DurationIsDelayLabels` 에 한 줄 추가 제안) · 궁극기 영혼석 수 · 사용 제한(기획 답변 1 ↔ 지금 5개 고정 · 제한 없음 = #40 5813232188 A 결정).
- 연성은 A 의 `Item/EnhanceService.mlua` 가 아직 안 쓴다(`:6` · `:69` `row.mesoCost` 그대로) — B 쪽 값(`JobPassiveLogic.GetJobCostMul`)은 준비됨.
- Round 9 확인 항목(그룹 A 뒤): 대마법 — 달팽이 3마리 + 마노(보스)면 마노만 · 보스가 없으면 한 마리만 맞는다. 매직 가드 툴팁 마지막 줄.

## #40 답 반영 (2026-10-01 · 사용자(강민구) 결정 2026-09-29)

- **대마법(SK_M31) = 화면 전체 광역 — `1fdceb9` 되돌림(`797c52b`) + 화면 상자(`e239e5c`).** #40 5884706734 · 5885126414: 화면 안 적 전부 · 대상 상한 없음 · 대상마다 6000%(표 고정 배율) · 대상 고르기 없음.
  - `SkillExecutors.ExecuteBlast`: 피해 = `ScreenBoxSize`(12.8 × 7.2 · 시전자 중심 · 다른 ORIGIN 의 "화면 전체" 와 같은 상자) `DealSkillDamage` 1회 · HitCount 1. 반지름(Range 3) 원형 피해와 보스 우선/최근접 대상 고르기는 없다.
  - 폭발 그림(원작 hit `05ab65bf` × 2.0)은 시전자 앞 Range 지점(예전 "대상 없음" 자리). Range 는 연출 배치에만 쓴다.
  - 로그 `SkillExecutors: BLAST SK_M31 screen-wide box=12.8x7.2 at (x,y) targets=N (no cap) hits=1 [이름,…]` + 대상마다 피격 로그.
  - `git revert` 는 `SkillInfo.csv` 의 `merge=union` 때문에 SK_M22 · SK_M31 행을 두 줄씩 남겼다 → SK_M31 행만 `1fdceb9` 이전 줄로 직접 되돌려 중복 없음(integrity C3 통과).
  - `SkillInfo.csv` SK_M31 Description "화면 안의 모든 적에게 초고피해를 입힌다." · #Note. `originSingleTarget` 이름은 그대로(#115 · #116 과 새 충돌 방지 · 주석에 "지금은 광역").
  - 위 "마법사 표 전체 대조" 절의 대마법 단일 대상 줄은 이 결정으로 뒤집혔다(기록으로 둔다).
- **텔레포트 강화(SK_M21) 도착 광역 최대 6명 — `f6373fc`.** #40 5884389647: 최대 6명(다른 스킬과 통일) · 상자 높이 = 발 ~ 위 1.6 그대로.
  - 새 `SkillExecutors.BlinkArrivalMaxTargets = 6`(0 = 상한 없음). `ExecuteBlink` 가 상자(2.4 × 1.6)를 먼저 probe(`FindSkillTargets` · 피해 없음) → 6명 이하면 예전처럼 상자 한 번 · 7명 이상이면 도착 지점에서 가까운 순 6명만 한 명씩 `DealSkillDamageToTarget`(피해 · 표시 타수 같음 · hit 그림은 패스마다 다시 넣음).
  - `SkillAttack` 은 안 건드렸다 — #116 이 같은 파일에 넣는 대상 상한(`PendingMaxTargets` · `CapTargetsByShape`)과 새 충돌을 만들지 않으려고. #116 이 들어온 뒤 그 장치로 옮길지는 그때 정한다.
  - 로그 `BLINK SK_M21 arrival cap=6 inBox=N chosen=6 [이름,…]` / `… inBox=N (all hit)`. `SkillInfo.csv` SK_M21 #Note 한 구절.
- **에너지볼트(SK_M11) 쿨타임 1.5 → 0 — `6bef717`.** #40 5884390599: 표에 없는 쿨타임은 0. `SkillInfo.csv` Cooldown 한 칸 + #Note.
- 빌드 경고 · Play 는 아직(테스트 브랜치를 현재 main + #100 + #102 로 다시 만든 뒤). Play 확인 항목: 대마법 화면 안 전부(화면 밖 제외 · 대상마다 6000%) · 텔레포트 강화 7마리 이상 → 6마리만 · 에너지볼트 쿨 0.

## 명중 사운드 (2026-10-01 · Play 뒤 · 사용자 선택)

- **텔레포트 강화 도착 명중 = 썬더 볼트 `2201005/Hit` `e8e38d3a`** · **대마법 명중 = 썬더 스톰 `2211011/Hit` `5b59c860`** — Play 중 후보 보드(키 7/8/9/0/6 · 한 번 + 겹친 재생)로 비교해 고름. 원작 텔레포트 마스터리(2211007) · 프로즌 라이트닝(2241500) 사운드는 라이브러리에 없다.
- 둘 다 **도착/시전 한 번에 한 번**, 맞은 대상이 있을 때만(`ExecuteBlink` · `ExecuteBlast` 가 `extraSounds[skill].hit` 를 직접 튼다). 대상마다 트는 `SkillAttack.PendingHitSound` 는 쓰지 않는다 — 도착 최대 6명 · 화면 전체라 겹침을 막으려고.
- 로그 `BLINK SK_M21 hit sound once (…) for N targets` · `BLAST SK_M31 hit sound once (…) for N targets`.
- Play 전 항목 통과(2026-10-01 · `9c934ae`) 뒤에 넣은 소리라 **#115 Play(스택 브랜치) 시작 때 소리 확인**.
