# b/skill-thief-effects — 도적 스킬 정리 (로직 + 연출 · 영상 실측)

> Draft PR #115 · base = #114 `615bcb9`(= `7c719ee` 기본 공격 버프 훅 + MISS 가드 · origin/main `3b6c972` 위 · 스택 · #114 는 amend/rebase 금지).
> 근거: 사용자 도적 표(2026-09-27 · 이름은 표 그대로) · 2026-09-24 기획 답(`메월드폴더/vd-audit/Docs/skill-spec.md` 6번 · 7번) · 사용자 영상 3개(럭키 세븐 · 다크 사이트 · 쉐도우 파트너 "…의 변화" 돌희) · 원작 조사(maplestory.io WZ 참고 데이터 · 나무위키 · 그림은 가져오지 않음) · MSW 리소스 라이브러리 재검색.
> 기획 질문: #40 5849705052 · 후속 5849781728. 비교 시트·프레임 시트·실측표 = `메월드폴더/design-handoff/thief-refs/`(저장소 밖 · 영상은 커밋하지 않음).
> 계약 변경 없음(새 표·열·열거값·이벤트 없음 · `SkillInfo.csv` 는 B 행 값만 · 헤더 불변 · BOM/CRLF 유지). A 파일 편집 없음.

## 2026-09-27

### 표 대조 (사용자 도적 표 · Lv.1→5)
| 슬롯 | 이름 | 해금 | 표 | CSV / 코드 | 결과 |
|---|---|---|---|---|---|
| A | 럭키 세븐 | 10 | 표창 2개 · 80%x2 → 120%x2 | 80 · +10/lv · HitCount 2 | ✅ 값 그대로(속도·연출만 영상 실측) |
| B 패시브 | 픽파켓 | 10 | 1번(타수 아님) 때리면 1~2메소 · 기존 드랍 영향 X · 소수점 안 되면 Lv1~4 1 · Lv5 2 | 1 + 0.25/lv → **내림**(예전 = 확률) | ✅ 바꿈 |
| C | 다크 사이트 | 20 | 10초 은신 · 1번 무조건 회피 · 회피하면 해제 · 쿨 50→30 | Duration 10 · Cooldown 50 · −5/lv | ✅ |
| D | 쉐도우 파트너 | 30 | 분신 · 2배 · 1분 · 쿨 2분→1분 | ReqLevel 30 · 100% · 60s · 120 · −15/lv | ✅ (다른 직업 D = 20 · 기획 정리 §7 = 20 → #40 참고) |
| 궁 | 메소 익소플로전 | 30 | 메소 소환 · 주변 폭발 · 50% × 주변 메소 개수 | 50 · Range 6 · 컷신 | ✅ 이름을 표 그대로 "메소 **익소**플로전"(예전 "익스플로전" · #40 참고) |

- "소매치기" → "픽파켓": 코드·CSV·UI 어디에도 "소매치기" 가 없다(모든 브랜치 `git grep`). #40 5845111397(B 의 예전 코멘트)에만 한 번 — 수정하지 않았다(새 코멘트 5849705052 는 "픽파켓").
- 툴팁(`Skill/SkillWindowLogic.mlua`): 픽파켓 "1타마다" → **"몬스터를 1번(타수 아님) 때릴 때마다 메소 N개 · 기존 드랍에 영향 없음"**(값 = 내린 정수) · 다크 사이트 "+ 회피하면 해제" · 쉐도우 파트너 "스킬 피해" → **"화력 2배(모든 공격 피해 +100%)"**(기획 답 7번) · 메소 익소플로전 "데미지 50% · 지속 1.6초" → **"데미지 50% x 주변 메소 개수 · 주변 메소가 없으면 시전 불가"**(1.6 은 지속이 아니라 피해 시점 · `SkillEffectLines`). CSV Description 4행 = 표 문구.

### 원작 기본값 (기획 미정 · #40 5849705052 · 전부 값 하나)
| 항목 | 기본값 | 근거 | 값 |
|---|---|---|---|
| 픽파켓 "1번" | 공격 1번 · 대상당 1번 | 표 "타수 아님"(원작 = 타수마다 확률) | `SkillBuffs.PickpocketDedupeSeconds` 0.5 → **0.3** |
| 픽파켓 소수점 | 내림(Lv1~4 1 · Lv5 2) | 표 대체 규칙 | `SkillBuffs.PickpocketRoundDown` = true |
| 픽파켓 · 궁 타격 | 떨어진다 | 기획 답 7번 "모든 공격"(원작은 메소 익스플로젼 제외) | `SkillBuffs.PickpocketExcludedSkillIds` = "" |
| 픽파켓 · 기본 공격 MISS | 안 떨어진다 | #40 5813243717 A 결정 | **#114 로 옮김**(`615bcb9` · `PlayerAttack.CalcDamage` 안 · 피해 > 0 · `OnAttack` 삭제) — 이 브랜치엔 없다 |
| 다크 사이트 · 공격하면 | ~~해제(원작)~~ → **유지 — 표에 맞춰 변경, commit `439be13`**(3차 · 아래) | 표 "10초 은신 · 한 번 회피 · 회피하면 해제"(원작 = 고전 "공격 불가" · 최신 "스킬 사용 시 해제") | `SkillBuffs.DarkSightBreaksOnAttack` = **false** · 스킬 = `SkillUsedEvent`(EffectUnit ATK_PCT) · 기본 공격 = `PlayerAttack.AttackNormal` |
| 다크 사이트 · 몬스터 | 계속 쫓아온다(지금 그대로) | 원작 자료 없음 · A 의 `IsTargetable` 은신 필터 없음 | (A) |
| 쉐도우 파트너 · 대상 | 모든 공격(궁 포함) ×2 | 기획 답 7번(원작 섀도어판은 메소 익스플로젼 제외) | `SkillBuffs.ShadowPartnerExcludedSkillIds` = "" |
| 쉐도우 파트너 · 쿨 시작 | 시전 순간(Lv5 상시 유지) | 원작 = 쿨 없음 · 상시 유지 | 코드 그대로(`SkillCaster.mlua:574`) |
| 메소 익소플로전 · 출처 | ~~픽파켓 동전만(2차)~~ → **바닥 동전 전부 — 표(답변 6)에 맞춰 변경, commit `2114cd6`**(3차 · 아래) · 소환 0 · 상한 없음 · 0개면 거절 | 기획 답 6번 "바닥에 떨어진 메소를 소모"(원작 = 스스로 만드는 판 없음 · 최대 15) | `SkillExecutors.MesoUseFloorCoins` true · `MesoPickpocketCoinsOnly` **false** · `MesoSummonCount` 0 · `MesoMaxCoins` 0 |

- 소환 모드(`MesoSummonCount > 0`)는 새로 넣었다: 시전 순간 반경 안(시전자 발 높이 좌우)에 연출 동전(`MesoSummonCoinRuid` = 원작 메소 포스 아톰 f2f02260…)을 N개 띄우고 바닥 동전과 같은 순서로 터뜨려 개수에 더한다(줍지 못함 · 재화 아님) · PreCheck 는 바닥 동전 0개여도 통과.

### 영상 실측 → 적용 (자세한 표 = `design-handoff/thief-refs/measurements.md`)
- **럭키 세븐**(`Skill/SkillExecutors.mlua` `effectOverrides.SK_T11` · `SkillInfo.csv` Speed): 라이브 2022 리마스터(보라 7표창)는 라이브러리에 없다 → 같은 팩 **CharLevel/25**(영상 "캐릭터 Lv.25" 구간과 같은 그림 · 라이브러리의 가장 새 원작): cast `77d56fb6…`(startFrame 1 — WZ 0프레임 = 빈 1×1 360ms) · hit `7368bd9b…` · 표창 = 수비 표창 **bullet** 클립 `551dec3d…`(예전 = 인벤토리 아이콘 `5d2441df…`). 1발 t0+0.15 → `spawn.delay` 0.2 → **0.15** · 스폰 (앞 1.02, 위 0.09) → **(0.95, 0.26)** · 2발 +0.12(VolleyInterval 그대로) · 2발 0.09 아래(`spawn.volleyGapY` −0.09 · 새 `SkillAttack.VolleyGapY`) · 속도 CSV **14 → 6**(영상 5.8~6.6 u/s) · 표창 scale 1.3 → **1.0**(영상 ≈18 px · ⚠ 2026-09-13 사용자 "조금 더 크게" 를 되돌림).
- **다크 사이트**: 클립 `abdf05be…` = 모험가 원작 4001003/effect(태그 API · 흰 연기 · 고전 판) 그대로 · 영상 2022 연기 크기(≈0.85 × 0.9 unit)에 맞춰 **scale 1.5** · 은신 알파 0.35 → **0.4**(영상 0.37~0.41) · 알파 전환 **0.5s 들어가기 / 0.45s 돌아오기**(`SkillBuffs.FadeAvatarAlpha` · 5단계).
- ~~**쉐도우 파트너**: 라이브 2022 나이트로드판은 라이브러리에 없다 → 같은 리마스터의 **섀도어판 4211008**~~ → **(4)에서 바꿈** — 4211008 cast 는 2022 리마스터가 아니라 리마스터 전 그림이었다(아래): cast `01615030…`(noFlip) · 새 `appear` = special/summoned `6f05153b…`(시전 순간 분신 자리 · 빈 0프레임 660ms 뒤 붉은 불씨 폭발 · 새 `SkillExecutors.PlayAppearEffect`) · 분신 루프 **1.15s 뒤**(영상 · `loop.delay` → `HideShadowFor` 재사용) · 분신 위치 offsetX −0.45 → **−0.33**(영상 ≈0.38 unit 뒤 − 몸 중심 0.05). 분신 몸 stand1 `f4aba8c3…` 그대로(4111002 · 4211008 같은 그림 · 투명도는 그림에 들어 있다).
- **메소 익소플로전**: 영상 없음 → 원작 기준. 그림은 그대로(컷신 = 임시 일도양단 · 다른 궁과 같이 디자이너 mp4 로 교체 예정 · 중심 폭발 = HEXA VI effect0 · 동전 = 4211006 hit — HEXA 는 라이브러리에 hit 가 없어 섞는 것이 원장 규칙 예외에 해당).

### 검증
- LSP(mlua diagnose): 바꾼 6개 스크립트 에러 0 · 경고 0.
- `node Docs/tools/check-integrity.cjs`: 전부 통과(경고 4건 = main 과 같음).
- Maker 런타임: 🟡 **BLOCKED** — Round 9 가 메인 폴더·월드를 쓰는 중(사용자 지시: 월드 진입·Reimport 금지). 빌드 경고 before → after 미측정.

### Play 체크리스트 (Round 9 뒤 · 도적 Lv30 · 아대 · 자동획득 OFF 로 동전 확인)
1. Q 럭키 세븐: 분홍 초승달이 키 입력 순간 · `PROJECTILE SK_T11 launch in 0.15s` · `spawned projectile SK_T11 speed=6 … offsetX=±0.95 offsetY=0.26` · 표창(회전 bullet)이 초승달에서 나와 2발째가 조금 아래 · 명중 = 흰 분홍 별.
   - **표창 크기 = scale 1.0 유지(2026-09-27 사용자 결정 · 영상 기준).** 사용자가 월드에서 직접 보고 바꿀 수 있다 → 바꾸면 `effectOverrides.SK_T11.spawn.scale` 한 칸.
2. 픽파켓: Lv1~4 `PICKPOCKET +1` · Lv5 `+2`(확률 없음) · 럭키 세븐 0.4s 연타로 같은 대상 → 매번 동전 · 기본 공격 MISS → 동전 없음(`[PlayerAttack]` 로그 · 피해 0).
3. W 다크 사이트: `avatar alpha fade 1 -> 0.4 over 0.5s x5` · 연기 1.5배 · **Q · 기본 공격을 써도 은신 유지**(`[Buff] DARK_SIGHT kept (attacked · SK_T11)` / `(attacked · BASIC)` · 3차) · 몬스터 접촉 1번 → `OFF DARK_SIGHT (evaded)` + `fade 0.4 -> 1 over 0.45s` · 10초 뒤 해제 · 쉐도우 파트너(E)는 해제 안 됨.
4. E 쉐도우 파트너((4) 기준): 룬 원반이 캐릭터 가운데(좌우 뒤집힘) + 검은 먹 리본이 위·뒤로 돌며 오름(캐릭터 뒤 층) · 소환 폭발 없음 · `appears after 1.4s` → 1.4s 에 분신 · 좌우 돌면 등 뒤 · 몸과 분신 간격(≈0.38 unit) 눈으로.
5. R 메소 익소플로전(3차): 픽파켓 동전 N개 + 사냥 드랍 동전 M개(자기 것)를 반경 안에 두고 → `MESO SK_T31 source floor=N+M summoned=0 (useFloor=true pickpocketOnly=false summonCount=0 cap=0)` · **사냥 동전도 소모된다**(그 메소는 못 줍는다) · 다른 사람 동전은 남는다 · 반경 안 자기 동전 0개면 `no meso nearby` 로 거절(재화·쿨 소모 없음).
6. 스킬 창 툴팁 문구 4개 · 궁 이름 "메소 익소플로전".

## 2026-09-27 (2) — 사용자 결정 반영

- ~~**메소 익소플로전 동전 = 픽파켓 동전만**~~(3차에서 표 답변 6 으로 되돌림 · `2114cd6`)(원작 · 사용자 결정): 사냥 드랍은 세지도 소모하지도 않는다. 픽파켓 동전은 이름 `PickpocketMeso`(`SkillBuffs.PickpocketCoinName`)로 스폰하고, `SkillExecutors.FindMesoCoins` 가 `MesoPickpocketCoinsOnly`(기본 true) 일 때 그 이름만 센다 — PreCheck(0개 거절)와 폭발이 같은 함수라 규칙이 한 곳. 사냥 드랍(A 의 `FarmReward.DropCoins` · 이름 "Meso")은 그대로. false 면 예전처럼 바닥 동전 전부. 다른 스위치(`MesoUseFloorCoins` · `MesoSummonCount` · `MesoMaxCoins`)는 그대로. 툴팁 "데미지 50% x 주변 메소 개수(픽파켓 메소) · 없으면 시전 불가".
- 럭키 세븐 표창 scale 1.0 유지 · 쉐도우 파트너 해금 30 유지(사용자 결정 · 사용자 표가 기준).
- #40 후속 코멘트 5849781728(메소 출처 픽파켓만 vs 바닥 전부 · 메소 동전 그림 = 마일리지 "M" 토큰 → 골드 메소 드랍 제안 · 다크 사이트 추격 필터 `_FactionLogic:IsTargetable` 훅 제안).

## 2026-09-27 (3) — 표에 맞춰 변경 (사용자 규칙: 기획 표 · 2026-09-24 기획 답이 이긴다 · 예외 없음)

| 항목 | 표 / 답변 | 예전 코드 | 지금 | commit |
|---|---|---|---|---|
| 메소 익소플로전 · 세는 동전 | 답변 6 "바닥에 떨어진 메소를 소모" | 픽파켓 동전만(원작 · 2차 사용자 결정) | 반경 6 안 **시전자 소유 바닥 동전 전부**(픽파켓 + 사냥 드랍) — **표(답변 6)에 맞춰 변경** | `2114cd6` |
| 다크 사이트 · 공격하면 | 표 "10초간 은신 · 한 번 공격을 무조건 회피 · 회피하면 해제" | 공격 스킬 · 기본 공격을 쓰면 해제(원작) | 공격해도 유지 · 끝 = 10초 또는 1회 회피 — **표에 맞춰 변경** · 유지할 때 `[Buff] DARK_SIGHT kept (attacked · …)` 로그 | `439be13` |
| 픽파켓 · CSV #Note | (값 아님) | "0.5s 안 중복 없음" + "중복 방지 0.3s" 가 같이 남아 있었다 | "중복 방지 0.3s" 만 | `764b092` |

- 툴팁: 메소 익소플로전 `"데미지 {v}% x 주변 메소 갯수(바닥에 떨어진 메소) · 없으면 시전 불가"`("갯수" = 표 표기 그대로). 다크 사이트는 이미 표 문구라 그대로.
- 바닥에 놓일 수 있는 메소 동전 = 전부 A 의 `mesocoin` 모델(`Global/MesoCoin.model` · `script.MesoCoin` · 수명 60초 · 자석 3.0 · 줍기 0.8). 스폰하는 곳은 두 곳뿐:
  - B 픽파켓 `Skill/SkillBuffs.mlua` `OnSkillHitMonster`(이름 `PickpocketMeso` · 1메소 · 주인 = 시전자).
  - A `Farm/FarmReward.mlua:219` `DropCoins`(이름 `Meso` · 처치 메소 총액을 최대 3개에 나눠 담음 · 주인 = 막타): 필드 몬스터(`Spawn/MonsterSpawner.mlua:127` · `Farm/FarmSpawner.mlua:61` 의 FarmMob 모델) · 엘리트(`Monster/EliteSpawner.mlua:149` · EliteMonsterInfo.Meso) · 레인 미니언(`Lane/MinionFlowService.mlua:323-328` · 1개 1메소 · 파병 유닛 제외).
  - 동전이 아닌 보상(보스 보상 · DropTable 재료 · 엘리트 확정 드랍 · 미니언 MesoBase · 빅토리아 주화)은 바닥에 놓이지 않고 바로 지급된다 — 해당 없음.
  - `DropOwner.IsPickableBy` 는 주인만(만료 없음) → **다른 사람 동전은 세지도 소모하지도 않는다.** 자동획득 ON(기본)이면 3.0 안 동전은 곧 빨려 오므로 실제로 터지는 것은 주로 3~6 거리의 자기 동전(자동획득 OFF 면 6 안 전부).
- 검증: LSP(바꾼 4개 스크립트) 에러 0 · 경고 0 · `check-integrity` 통과(경고 4 = main) · 충돌 재확인(#83 · #100 · #116) · 도적+해적 합본 미리보기 — 결과는 #115 본문. Maker 런타임 🟡 BLOCKED(월드 사용 금지 · 체크리스트 = `메월드폴더/villagedefense-harness/thief-check/checklist.md`).
## 2026-09-27 (4) — 연출 변경: 쉐도우 파트너 = 리마스터 전 나이트로드판 한 벌 (원작 메이플 = 연출 기준 · 사용자 참고 영상 "초기 2004" 와 같음)

| 층 | 예전 (1차) | 지금 | 근거 |
|---|---|---|---|
| 시전 | `01615030…` 4211008 effect · noFlip | `8ef08d99…` **4111002 effect**(룬 원반 → 검은 가시 · 16프레임) · **뒤집음**(WZ 359 에 noFlip 없음) · (0, 0) · 원반 중심 발 기준 −0.04 / +0.32 = 캐릭터 가운데 | 영상 초기 2004: 원반이 캐릭터 가운데 |
| 두 번째 층 | `6f05153b…` 4211008 special/summoned(라이브 시대 · 분신 자리 붉은 불씨) | `6db426f9…` **4111002 effect0**(검은 먹 리본 · 11프레임 × 85ms) · (0, 0) · 뒤집음 · **플레이어 뒤 층**(WZ z −1 · 새 `sortBehind`) | 영상 초기 2004: 위·뒤로 도는 검은 리본("용처럼") |
| 분신 등장 | 1.15s(영상 2022) | **1.4s**(영상 초기 2004 · 소환 폭발 없음) | 같은 영상 |

- commit `ff97325`. 연출만 바꿨다 — **버프 로직(×2 시작 · 지속 · 분신 동작)은 그대로.** ×2 는 예전대로 시전 순간(`SkillExecutors.mlua` ExecuteBuff `ApplyBuff`)부터라, 시전 락 0.6s 뒤 공격하면 분신이 보이기(1.4s) 전 0.8s 동안도 ×2 다(1차 1.15s 때는 0.55s) — 맞출지는 사용자 결정(#115 본문).
- **정정:** 1차에서 "같은 2022 리마스터의 섀도어판" 이라고 적은 4211008 cast `01615030…` 는 **리마스터 전**(KMS 359 = 9프레임 · noFlip 없음) 그림이었다. 라이브(KMS 360+) 4211008 effect 는 16프레임이고 전부 4111002 라이브 그림을 `_outlink` 로 쓴다(라이브러리에 없음). `6f05153b…`(special/summoned)는 360+ 에만 있어 한 스킬에 두 시대가 섞여 있었다. 근거 = maplestory.io WZ(참고용 · 그림은 가져오지 않음).
- 원작 두 층(effect · effect0)을 같은 순간에 튼다: cast 단계 = effect, `appear` 단계 = effect0(`offsetX = 0` 을 적어야 분신 자리로 가지 않는다). `PlayAppearEffect` 에 `sortBehind` 한 줄(분신 루프와 같은 `ApplyShadowSorting` · 층만).
- 검증: LSP `SkillExecutors` 깨끗 · 나머지는 #115 본문. Maker 런타임 🟡 BLOCKED(체크리스트 4.1~4.3 · 4.14 · 4.15).
## 2026-09-27 (5) — 연출 변경: 럭키 세븐 팔 잔상(파란 호) + 던지기 모션 swingO3 (원작 메이플 = 연출 기준 · 사용자 참고 영상 "럭키세븐의 변화" Lv.25 구간과 맞춤 · 미리보기 v2 승인)

| 항목 | 예전 | 지금 | 근거 |
|---|---|---|---|
| 던지기 모션 | `MOTION_SK_T11_CLAW` swingT3 ×1.2 | **swingO3** ×1.2 (`WeaponMotion.csv:40` · 메소 익소플로전 `_2` 는 swingT3 그대로) | 원작 럭키 세븐 던지기의 표창 잔상 = swingO3 모양 호가 8번 중 6번(나머지 2번 swingO2 모양) |
| 팔 잔상 | 없음 | 파란 호 한 장 = 80003330 swordOL/swingO3 1프레임 `a49c9904…` 을 색상만 +225°(영상 hue 246°) · 112×60 · pivot = 그림 뒤 끝(0.991071, 0.033333) · 업로드 sprite **`c81dcd53d6244d5eacc38682858c31bd`**(마법사 창 업로드 · `design-handoff/trail-recolor/SK_T11_arc_upload.txt`) · `effectOverrides.SK_T11.arc` | 영상 +0.12~0.35s 의 팔 잔상 · 미리보기 `design-handoff/trail-recolor/SK_T11_arc_compare_v2.png` |
| 자리 · 크기 · 시간 | — | offsetX −0.22(원점 = 서 있을 때 발 중심 기준 · 앞끝이 원점 앞 0.83 u) · scaleY 0.62 + offsetY +0.14(호가 발 위 0.16~0.45 u = 영상 띠) · scaleX 1.0(데이터 값 · 앞끝 자동 고정) · alpha 0.9 · 시전 +0.10s 에 0.25s · 바라보는 쪽으로 뒤집음 | v2 실측(영상 앞끝 0.78~0.83 u · 띠 0.16~0.45 u) |

- commit `8e48c11`. 연출만 바꿨다 — 피해 · 판정 · 시전 락 · 표창 발사 시점은 그대로.
- `PlayArmArc`(#115 전용 · `FireProjectile` 의 시전 순간에서 부른다 · `arc` 가 없는 스킬은 아무 일 없음): sprite 는 EffectService 로 못 튼다 → 투사체 모델을 빌린다(PlaySpriteFlash 와 같은 방식 · 이름 `SkillFx_<uid>_SK_T11_arc_<n>` → SkillCaster 사망 정리 대상).
  스폰 첫 프레임에 모델 기본 sprite(에너지볼트 공 `d393500f…`)가 한 번 보이는 문제(#83 2026-09-25 Play 프레임 실측)는 모델을 바꾸지 않고 **화면 밖(시전자 100 u 아래)에서 알파 0 으로 스폰 → +0.05s 에 제자리로(아직 알파 0) → +0.10s 에 알파 0.9** 로 피한다. 로그 3줄(spawned hidden → moved → shown).
- scaleX 앞끝 고정: pivot 이 그림 뒤 끝이라 가로 배율을 줄이면 앞끝이 뒤로 당겨진다 → 실제 offsetX = offsetX + frontTip(1.05 u) × (1 − scaleX) — 0.8 → −0.01 · 0.7 → +0.095. 영상 호는 얼굴 근처에서 끝나고 우리 것(1.0)은 머리 뒤까지 간다 → 월드에서 1.0 / 0.8 / 0.7 을 보고 고른다(체크리스트 1.17 · 하네스 키 4).
- 🔁 **#83 머지 뒤 교체:** `PlayArmArc` → #83 의 `PlaySpriteFlash`(showAt · alpha · 숨긴 채 스폰 · 모델 기본 sprite "")로. 단 그쪽 배율은 하나(scale)라 scaleY 0.62 를 쓰려면 세로 배율 인자 하나를 더해야 한다 — 교체 때 정한다. 이 브랜치의 `PlaySpriteFlash`(main 판)는 손대지 않았다(#83 이 그 메서드를 다시 쓴다 → 새 충돌 없음).
- 원작의 무작위(swingO2 모양 2/8)는 #83 의 SkillMotionSet 이 있어야 해서 넣지 않았다(swingO3 하나).
- 검증: LSP `SkillExecutors` 0 · `check-integrity` 통과(경고 4 = main) · 충돌 변화 없음(#83 `6952bdf` 1파일/1덩어리 SK_T22 블록 우리 16줄/그쪽 3줄 · #100 `e6128f3` 0 · #116 `db85dcf` 글자 충돌 0 + SkillInfo union 중복 10행 = 예전과 같음 · `WeaponMotion.csv:40` 은 아무 PR 과도 안 겹침) · 도적+해적 합본 미리보기(도적 `4e73fb3` + 해적 `db85dcf` + 이 변경) fixer → 중복 0 · integrity 통과 · LSP 4개 0. Maker 런타임 🟡 BLOCKED(체크리스트 1.3 · 1.14~1.19).
## 2026-09-28 (6) — 월드 확인(T 실행 · 마법사 창) 분석 후속 · 이 창은 코드만

| 항목 | 예전 | 지금 | commit |
|---|---|---|---|
| 럭키 세븐 팔 잔상 꼬리 | scaleX 1.0(꼬리가 머리 뒤까지) | **0.7** — T 실측: 호 뒤끝이 원점 앞 0.195 u(영상 0.20 u) · 앞끝 0.83 u 그대로(`Skill/SkillExecutors.mlua:586`) | `851dbd4` |
| 픽파켓 동전 스폰 높이 | 몬스터 위치 +0.3(튀어 오르며 몬스터보다 높은 떠 있는 발판에 얹히기도 했다) | 몬스터 **발밑 발판** 위 +0.05 — 아래 방향 발판 레이캐스트(`SkillMovement.ProbeFloor` 방식 · 서버 `PickpocketFloorY`) · 동전 x 마다 다시 재고, 발판 끝을 넘어 더 낮은 발판이 잡힌 동전은 몬스터 x 로 되돌린다 · 못 찾으면 예전 +0.3 · 로그 끝 `floor=<y> (feet <y>)` / `floor=none(+0.3)`(`Skill/SkillBuffs.mlua:175-184` · `:984-1005` · `:1023`) | `f617947` |
| 쉐도우 파트너 분신 · 기본 공격 | 스킬 모션만 따라 했다 | 기본 공격도 따라 한다 — `PlayAttack` 바로 뒤 장착 무기 기본 공격 행 CoreAction(아대 swingO3 · 단검 stabO1 · 둘 다 mimic 표에 있음)으로 `PlayShadowMimic`(`PlayerAttack.mlua:25-33`) · 맨손이면 안 부른다 | `20afd95` |

- 전부 **연출·스폰 자리만** — 피해 · 판정 · ×2 · 픽파켓 1번 · MISS 가드 그대로. A 파일(`Farm/MesoCoin.mlua` · `Farm/FarmReward.mlua` · `Monster.mlua`)은 안 건드렸다 — 사냥 드랍은 예전 +0.3 그대로, MISS 넉백(약 0.2 u · `Monster.mlua:386-388` → `:487-488`)은 A 참고로 #40 [5858689104](https://github.com/alsrn5172/villagedefense/issues/40#issuecomment-5858689104) 에 적었다.
- **럭키 세븐 대상 수는 그대로**(표창 판정 상자 0.8 × 0.8 안 전부 · `Skill/SkillProjectile.mlua:76-78` · `:238-242` · T 실행에서 0.2 u 간격 3마리가 한 번에 맞음). 표(skill-spec.md 36행)에 대상 수가 없다 → 기획 질문 #40 5858689104(원작 = 1마리). 답이 올 때까지 지금 동작.
- 검증: LSP 3개(`SkillExecutors` · `SkillBuffs` · `PlayerAttack`) 에러 0 · 경고 0 · `check-integrity` 통과(경고 4 = main · pre-push 통과) · 충돌 변화 없음(#83 `6952bdf` 1파일/1덩어리 SK_T22 블록 우리 16줄/그쪽 3줄 · #116 `db85dcf` · #100 `e6128f3` · #102 `b91a8fe` · #85 · #96 · #98 · #114 글자 충돌 0). Maker 런타임 🟡 BLOCKED(월드 확인은 마법사 창 · 체크리스트 1.17 · 2.x 동전 · 4.x 분신).

### 남은 것 / 후속
- **#83 머지 뒤:** `PlayArmArc` → #83 `PlaySpriteFlash` 교체(세로 배율 인자 하나 추가 필요 · (5) 참고). ~~럭키 세븐 팔 잔상 가로 배율(scaleX 1.0 / 0.8 / 0.7)은 월드 확인 뒤 값 하나만 바꾼다~~ → **0.7 완료 `851dbd4`**((6)).
- **보류(사용자 결정 2026-09-27) · #102 머지 + #115 rebase 뒤:** `SkillAttack.IsSharedVolley` 에 `SK_T11` 한 줄 → T 실행에서 본 두 증상을 같이 고친다: ① 2발째 표창이 맞은 뒤에도 남아 계속 날아간다(VisualOnly 는 명중·소멸이 없다 · `SkillProjectile.mlua:227-229`) ② 2발째 명중 폭발 `7368bd9b…` 이 없다(영상 = 별 폭발 두 번 0.13s 간격). 함수는 #102 `b91a8fe` `Skill/SkillAttack.mlua:522`. 이 브랜치는 #114 기반이라 코드 지금은 없음.
- **보류 · 기획 답 대기(#40 5858689104):** 답이 "1마리"면 #102 머지 뒤 `SkillAttack.IsSingleTargetProjectile`(#102 `b91a8fe` `:528`)에 `SK_T11` 추가. 다른 답이면 넣지 않는다.
- ~~픽파켓 MISS 가드는 #114 몫이다~~ → **완료(2026-09-27 · 사용자 지시 · Round 9 H 재확인용)**: #114 브랜치 `b/playerattack-buff-hooks` 로컬 `615bcb9` 에 커밋(PlayerAttack.OnAttack → CalcDamage · 피해 > 0) · 이 브랜치를 그 위로 rebase — 이 브랜치의 `PlayerAttack.mlua` 변경은 다크 사이트 해제 훅(AttackNormal) 하나만 남았다. #114 · 이 브랜치 모두 push 전.
- 메소 동전 그림(A 의 `Global/MesoCoin.model` `3b88d8df…`)은 메소가 아니라 마일리지 "M" 알림 그림이다(태그 API) — 아이템 외형이라 손대지 않았다. 후보 = 골드 메소 드랍 `5c78b56b…`(비교 시트 C).
- 라이브러리 클립이 잘려 있다: 4211006 hit 는 15 중 6프레임 · 4211008 effect 는 16 중 9프레임(나머지는 팩 sprite).
