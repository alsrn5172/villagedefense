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
- **폭발 범위 출처(임시값):** KMS 클라이언트 스킬 데이터 `Skill/200.img/skill/2001008/common` — `info/rectBasedOnTarget = 1`(맞은 적 기준 상자).
  - v359(리마스터 직전 · 우리가 쓰는 레드 팩과 같은 시기): `lt(-100,-80)` `rb(100,30)` = 200 × 110 px → **2.0 × 1.1 unit, 발 아래 0.3 ~ 위 0.8** ← 채택.
  - v360(2022-01-27 리마스터) ~ v389: `lt(-120,-75)` `rb(120,75)` = 2.4 × 1.5 unit.
  - 원작 `mobCount` 는 4 — 우리는 기획 확정 6.
  - 출처: `https://maplestory.io/api/wz/KMS/359/Skill/200.img/skill/2001008/common/lt` (· `/rb` · v360 · v389 같은 경로). 기획 반경 답(#40)이 오면 `explode` 값만 바꾼다.
- 피해는 기획표 그대로 140% → 220%(대상마다 같음 · `SkillInfo.csv` 변경 없음).

### 에너지볼트 명중 사운드

- `extraSounds.SK_M11.hit = ab4202ad4cac42a397a120a335bb038f` — 같은 레드 팩(`200.img/2001008`)의 `_audio/Hit`(쓰지 않던 것). 한 모습 규칙(같은 버전 부품).

### 매직 가드(SK_M22) — 레드(2013) 모습 채우기 + 시전 자세 (사용자 Play 선택 2026-09-26)

- **발밑 고리:** 같은 레드 팩(`200.img/2001002`)의 쓰지 않던 `effect0` `95a6cf7f7f0b46aab39a45b166dc446d`(7프레임 · 발밑 금빛 고리)를 `effectOverrides.SK_M22.ground` 로 추가. `ExecuteBuff` 가 요정(`cast`)과 **같은 순간** `PlayStageEffect(…, "ground", …)` 로 재생 · `ground` 단계도 시전자에 붙인다(시전 락이 풀린 뒤 걸어가도 발밑에 남음). 높이 0 · 크기 1.0 · 지연 0 = 사용자 선택.
  - 근거(원작 영상 · 레드 구간 30fps): 첫 시전 **8.380s** 에 요정 f0 · 고리 f0 · 자세 변화가 같은 프레임. 고리 띠 8.48 · 가장 밝음 8.58. (리마스터 구간은 요정 15.300 → 폭발+고리 15.700 = +0.40s 로 다르다 — 우리는 레드 모습이라 0.)
  - "몸을 한 바퀴 감싸는 고리" = **이미 쓰던 요정 클립 `7969eaa9…` 의 7~10프레임**(반짝이 원호 · 시전 뒤 0.84~1.32s · 영상 9.08~9.43s) — 새 클립 불필요. 5~6프레임 = 빛기둥(영상 8.88~9.05s). Play 에서 8프레임을 붙잡아 영상 9.20s 와 같은 자리 확인.
- **시전 자세:** heal 1.5배속 왕복 → `_2` alert 2.5배속(1.0s) → `_END` stand1(1.6s) 을 **alert 2프레임 붙잡기(낮춘 자세) → `_END` stand1 0.45s** 로 교체.
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
