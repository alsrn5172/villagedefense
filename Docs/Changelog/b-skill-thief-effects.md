# b/skill-thief-effects — 도적 스킬 정리 (로직 + 연출 · 영상 실측)

> 로컬 브랜치 · base = #114 로컬 `615bcb9`(= `7c719ee` 기본 공격 버프 훅 + MISS 가드 · origin/main `3b6c972` 위 · 2026-09-27 rebase). 사용자 지시(2026-09-27): **로컬 커밋만 · push/PR 은 지시 뒤.** #114 가 Round 9 H 확인 뒤 바뀌면 rebase.
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
| 다크 사이트 · 공격하면 | 해제 | 원작(고전 "공격 불가" · 최신 "스킬 사용 시 해제") | `SkillBuffs.DarkSightBreaksOnAttack` = true · 스킬 = `SkillUsedEvent`(EffectUnit ATK_PCT) · 기본 공격 = `PlayerAttack.AttackNormal` |
| 다크 사이트 · 몬스터 | 계속 쫓아온다(지금 그대로) | 원작 자료 없음 · A 의 `IsTargetable` 은신 필터 없음 | (A) |
| 쉐도우 파트너 · 대상 | 모든 공격(궁 포함) ×2 | 기획 답 7번(원작 섀도어판은 메소 익스플로젼 제외) | `SkillBuffs.ShadowPartnerExcludedSkillIds` = "" |
| 쉐도우 파트너 · 쿨 시작 | 시전 순간(Lv5 상시 유지) | 원작 = 쿨 없음 · 상시 유지 | 코드 그대로(`SkillCaster.mlua:574`) |
| 메소 익소플로전 · 출처 | ~~바닥 동전 전부~~ → **픽파켓 동전만**(2차 · 아래) · 소환 0 · 상한 없음 · 0개면 거절 | 기획 답 6번(원작 = 스스로 만드는 판 없음 · 최대 15) | `SkillExecutors.MesoUseFloorCoins` true · `MesoPickpocketCoinsOnly` true · `MesoSummonCount` 0 · `MesoMaxCoins` 0 |

- 소환 모드(`MesoSummonCount > 0`)는 새로 넣었다: 시전 순간 반경 안(시전자 발 높이 좌우)에 연출 동전(`MesoSummonCoinRuid` = 원작 메소 포스 아톰 f2f02260…)을 N개 띄우고 바닥 동전과 같은 순서로 터뜨려 개수에 더한다(줍지 못함 · 재화 아님) · PreCheck 는 바닥 동전 0개여도 통과.

### 영상 실측 → 적용 (자세한 표 = `design-handoff/thief-refs/measurements.md`)
- **럭키 세븐**(`Skill/SkillExecutors.mlua` `effectOverrides.SK_T11` · `SkillInfo.csv` Speed): 라이브 2022 리마스터(보라 7표창)는 라이브러리에 없다 → 같은 팩 **CharLevel/25**(영상 "캐릭터 Lv.25" 구간과 같은 그림 · 라이브러리의 가장 새 원작): cast `77d56fb6…`(startFrame 1 — WZ 0프레임 = 빈 1×1 360ms) · hit `7368bd9b…` · 표창 = 수비 표창 **bullet** 클립 `551dec3d…`(예전 = 인벤토리 아이콘 `5d2441df…`). 1발 t0+0.15 → `spawn.delay` 0.2 → **0.15** · 스폰 (앞 1.02, 위 0.09) → **(0.95, 0.26)** · 2발 +0.12(VolleyInterval 그대로) · 2발 0.09 아래(`spawn.volleyGapY` −0.09 · 새 `SkillAttack.VolleyGapY`) · 속도 CSV **14 → 6**(영상 5.8~6.6 u/s) · 표창 scale 1.3 → **1.0**(영상 ≈18 px · ⚠ 2026-09-13 사용자 "조금 더 크게" 를 되돌림).
- **다크 사이트**: 클립 `abdf05be…` = 모험가 원작 4001003/effect(태그 API · 흰 연기 · 고전 판) 그대로 · 영상 2022 연기 크기(≈0.85 × 0.9 unit)에 맞춰 **scale 1.5** · 은신 알파 0.35 → **0.4**(영상 0.37~0.41) · 알파 전환 **0.5s 들어가기 / 0.45s 돌아오기**(`SkillBuffs.FadeAvatarAlpha` · 5단계).
- **쉐도우 파트너**: 라이브 2022 나이트로드판은 라이브러리에 없다 → 같은 리마스터의 **섀도어판 4211008**: cast `01615030…`(noFlip) · 새 `appear` = special/summoned `6f05153b…`(시전 순간 분신 자리 · 빈 0프레임 660ms 뒤 붉은 불씨 폭발 · 새 `SkillExecutors.PlayAppearEffect`) · 분신 루프 **1.15s 뒤**(영상 · `loop.delay` → `HideShadowFor` 재사용) · 분신 위치 offsetX −0.45 → **−0.33**(영상 ≈0.38 unit 뒤 − 몸 중심 0.05). 분신 몸 stand1 `f4aba8c3…` 그대로(4111002 · 4211008 같은 그림 · 투명도는 그림에 들어 있다).
- **메소 익소플로전**: 영상 없음 → 원작 기준. 그림은 그대로(컷신 = 임시 일도양단 · 다른 궁과 같이 디자이너 mp4 로 교체 예정 · 중심 폭발 = HEXA VI effect0 · 동전 = 4211006 hit — HEXA 는 라이브러리에 hit 가 없어 섞는 것이 원장 규칙 예외에 해당).

### 검증
- LSP(mlua diagnose): 바꾼 6개 스크립트 에러 0 · 경고 0.
- `node Docs/tools/check-integrity.cjs`: 전부 통과(경고 4건 = main 과 같음).
- Maker 런타임: 🟡 **BLOCKED** — Round 9 가 메인 폴더·월드를 쓰는 중(사용자 지시: 월드 진입·Reimport 금지). 빌드 경고 before → after 미측정.

### Play 체크리스트 (Round 9 뒤 · 도적 Lv30 · 아대 · 자동획득 OFF 로 동전 확인)
1. Q 럭키 세븐: 분홍 초승달이 키 입력 순간 · `PROJECTILE SK_T11 launch in 0.15s` · `spawned projectile SK_T11 speed=6 … offsetX=±0.95 offsetY=0.26` · 표창(회전 bullet)이 초승달에서 나와 2발째가 조금 아래 · 명중 = 흰 분홍 별.
   - **표창 크기 = scale 1.0 유지(2026-09-27 사용자 결정 · 영상 기준).** 사용자가 월드에서 직접 보고 바꿀 수 있다 → 바꾸면 `effectOverrides.SK_T11.spawn.scale` 한 칸.
2. 픽파켓: Lv1~4 `PICKPOCKET +1` · Lv5 `+2`(확률 없음) · 럭키 세븐 0.4s 연타로 같은 대상 → 매번 동전 · 기본 공격 MISS → 동전 없음(`[PlayerAttack]` 로그 · 피해 0).
3. W 다크 사이트: `avatar alpha fade 1 -> 0.4 over 0.5s x5` · 연기 1.5배 · Q 를 쓰면 `OFF DARK_SIGHT (attacked · SK_T11)` + `fade 0.4 -> 1 over 0.45s` · 기본 공격도 `attacked · BASIC` · 쉐도우 파트너(E)는 해제 안 됨.
4. E 쉐도우 파트너: 먹 획 → 분홍 X(시전자) · +0.66s 분신 자리 붉은 불씨 · `appears after 1.15s` → 1.15s 에 분신 · 좌우 돌면 등 뒤 · 몸과 분신 간격(≈0.38 unit) 눈으로.
5. R 메소 익소플로전: 픽파켓 동전 N개 + 사냥 드랍 동전 M개를 반경 안에 두고 → `MESO SK_T31 source floor=N summoned=0 (useFloor=true pickpocketOnly=true summonCount=0 cap=0)` · **사냥 동전 M개는 그대로 남아 주울 수 있다** · 픽파켓 동전 0개(사냥 동전만)면 `no meso nearby` 로 거절(재화·쿨 소모 없음).
6. 스킬 창 툴팁 문구 4개 · 궁 이름 "메소 익소플로전".

## 2026-09-27 (2) — 사용자 결정 반영

- **메소 익소플로전 동전 = 픽파켓 동전만**(원작 · 사용자 결정): 사냥 드랍은 세지도 소모하지도 않는다. 픽파켓 동전은 이름 `PickpocketMeso`(`SkillBuffs.PickpocketCoinName`)로 스폰하고, `SkillExecutors.FindMesoCoins` 가 `MesoPickpocketCoinsOnly`(기본 true) 일 때 그 이름만 센다 — PreCheck(0개 거절)와 폭발이 같은 함수라 규칙이 한 곳. 사냥 드랍(A 의 `FarmReward.DropCoins` · 이름 "Meso")은 그대로. false 면 예전처럼 바닥 동전 전부. 다른 스위치(`MesoUseFloorCoins` · `MesoSummonCount` · `MesoMaxCoins`)는 그대로. 툴팁 "데미지 50% x 주변 메소 개수(픽파켓 메소) · 없으면 시전 불가".
- 럭키 세븐 표창 scale 1.0 유지 · 쉐도우 파트너 해금 30 유지(사용자 결정 · 사용자 표가 기준).
- #40 후속 코멘트 5849781728(메소 출처 픽파켓만 vs 바닥 전부 · 메소 동전 그림 = 마일리지 "M" 토큰 → 골드 메소 드랍 제안 · 다크 사이트 추격 필터 `_FactionLogic:IsTargetable` 훅 제안).

### 남은 것 / 후속
- ~~픽파켓 MISS 가드는 #114 몫이다~~ → **완료(2026-09-27 · 사용자 지시 · Round 9 H 재확인용)**: #114 브랜치 `b/playerattack-buff-hooks` 로컬 `615bcb9` 에 커밋(PlayerAttack.OnAttack → CalcDamage · 피해 > 0) · 이 브랜치를 그 위로 rebase — 이 브랜치의 `PlayerAttack.mlua` 변경은 다크 사이트 해제 훅(AttackNormal) 하나만 남았다. #114 · 이 브랜치 모두 push 전.
- 럭키 세븐 2발째 명중 이펙트(영상 = 별 폭발 두 번 0.13s 간격): #102 의 볼리 공유(`SkillAttack.IsSharedVolley`)가 머지되면 `SK_T11` 한 줄 추가로 2발째도 명중 이펙트. 이 브랜치는 #114 기반이라 넣지 않았다.
- 메소 동전 그림(A 의 `Global/MesoCoin.model` `3b88d8df…`)은 메소가 아니라 마일리지 "M" 알림 그림이다(태그 API) — 아이템 외형이라 손대지 않았다. 후보 = 골드 메소 드랍 `5c78b56b…`(비교 시트 C).
- 라이브러리 클립이 잘려 있다: 4211006 hit 는 15 중 6프레임 · 4211008 effect 는 16 중 9프레임(나머지는 팩 sprite).
