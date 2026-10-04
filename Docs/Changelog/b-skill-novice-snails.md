# b/skill-novice-snails — 초보자 스킬 달팽이 세마리 + 차수별 SP 독립

## 1차 (2026-10-01)

출처: A 요청 #40 5875058360(초보자 스킬 · Q 자동 등록) · B 착수 5891302921 · 값 = A 답 5891464912(사용자 강민구) + 5898022370(고정 피해 · 1타) · 5897840522(같은 답 재게시).

| 항목 | 값 | 어디 |
|---|---|---|
| 스킬 | `SK_N01` 달팽이 세마리 · 초보자(`NOVICE` · 차수 0) · Tab 0 | `SkillInfo.csv` 새 행 1개(헤더 그대로) |
| 피해 | **고정** 10 / 20 / 40 · 1타 | `EffectUnit FLAT` · `SkillDatabase.DamageAt` 에 FLAT 분기(= RatioAt · 공격력 · 버프 배율 없음) |
| MP | 10 / 15 / 20 | `SkillDatabase.MpCostAt` → `SkillCaster` 클라 예측 · 서버 차감 두 곳 |
| 쿨타임 | 0 | CSV |
| 해금 · 최대 · SP | Lv1 · 3 · 1씩 | CSV. ~~**Lv1 은 매치 시작(새 원장)에 자동**(A 요청 3번 · SP 안 씀) → Lv2 · Lv3 에 SP 1씩~~ → **3차: 자동 Lv1 없음 · 매치 시작 SP 1 로 직접 배운다**(A 결정 #40 5977728018) |
| Q | 초보자면 Q = 달팽이 세마리 | `SkillHotbar` slot 1 `byJob.NOVICE`(구조 그대로 · A 의 HUD 가 읽는다) |
| 연출 | 원작 `skill/000.img/skill/0001000`(KMS 389 String "달팽이 세마리"): 레벨별 껍질 ball + hit/0 · Use 소리 `9313440a…` · 아이콘 `bd139447…` · 시전 이펙트 없음 · 동작 swingO1 | `SkillExecutors.effectOverrides.SK_N01`(`levels` · `cast.none`) · `castSounds` |
| 사거리 · 속도 | ~~Range 3 · Speed 8(임시값)~~ → **2차: Range 2.5 · Speed 6.5**(A 답 5927820330 Q5 "본섭과 같게") | CSV |

- 3레벨 40 과 레벨별 MP 는 계약서 공식(`BaseEffect + EffectPerLevel × (레벨−1)`)으로 안 나온다 → `SkillDatabase.levelValues`(새 속성 · `BuildLevelValues`)가 덮는다. CSV 행엔 레벨 1 값(10 · 10 · EffectPerLevel 10)이 있다.
- 원작 WZ 값(0001000 fixdamage 10/25/40 · mpCon 3~7)은 쓰지 않았다 — A 의 표가 이긴다.
- 새 코드 옵션(다른 스킬엔 영향 없음):
  - `SkillExecutors.GetLevelSpecRuid` — `effectOverrides[skill].levels[레벨]` 이 있으면 그 ball · impact, 없으면 예전 `GetSpecRuid` / `GetImpactEffectRuid` 와 같은 값.
  - `PlayStageEffect` 의 `{ none = true }` — 그 단계에 아무것도 안 튼다(기본 Charge 파티클 포함).
  - `JobDefaultWeaponType("NOVICE") = "SWORD_1H"` — 맨손 초보자도 한손검 기본 공격 행(swingO1)으로 시전 동작. 초보자가 끼는 무기(나무 검 · 몽둥이)도 한손검이라 전용 WeaponMotion 행은 넣지 않았다.
- 전직 뒤: 스킬 레벨은 남지만 `CanUse` 의 직업 검사로 못 쓴다 · Q 는 byJob 이 직업 스킬로 바꾼다(A 요청 5번 · "전직 후 유지 여부는 B 판단" → 유지 안 함).

### 차수별 SP (A 답 5891464912 "0차(초보자), 1차,2차,3차는 스킬포인트 독립적이고 모아놨다가 쓰는거 안됨")

SP 지갑은 A 의 `SummonManager.econ.sp` 하나다(`SpendSp` 로만 줄인다). **A 파일은 안 고쳤다.** B(`PlayerSkillState`)가 차수마다 번 SP · 쓴 SP 를 센다.

- **번 SP(t 차)** = 레벨업 L→L+1 이 주는 `LevelTable` L 행 SP 중, 새 레벨 L+1 이 t 차 구간 `[JobTier.ReqLevel(t), ReqLevel(t+1)−1]` 에 드는 것의 합(지금 레벨까지) — `TierSpEarned`. 지금 표로 0 차 24 · 1 차 30 · 2 차 30 · 3 차 3(레벨업마다 3 · 구간 1–9 / 10–19 / 20–29 / 30). SP 지급 경로는 레벨업 하나뿐이다(`GrantSp` 호출 0곳).
- **쓴 SP** = `users[uid].spentByTier[t]`(RequestLearn 이 더한다 · 자동 Lv1 은 안 센다). 매치마다 원장과 같이 비워진다(`ResetMatchState`).
- **배우기**(`RequestLearn`): 스킬 `ReqTier` = 지금 차수 · 그 차수 남은 SP(번 − 쓴) ≥ `SpCost` → 그다음 A 의 `SpendSp`. 거절 로그 `[Skill] learn … rejected: tier t SP left n < c`.
- **차수가 오를 때**(`ChangeJob` · 전직 · 2차 · 3차): 지갑에 새 차수 이후 구간 몫만 남기고 나머지는 `SpendSp(uid, "TIER_SP_RESET", n)` 으로 없앤다 = 모아 두기 없음. 로그 `[Skill] tier SP -> tier t wallet= keep= forfeit=`. DEV 직업 전환(`DevSetJobState`)은 이 경로를 안 탄다.
- 표로 확인: 차수마다 필요한 SP(최대 레벨 × SpCost 합) 0 차 2 · 1 차 10~15 · 2 차 10 · 3 차 1 ≤ 번 SP → 이 규칙으로 못 배우게 되는 스킬은 없다.
- 끄기: `PlayerSkillState.TierSpEnabled = false`(예전과 같이 지갑 하나로 아무 차수나).

### 결정 대기 · 이 PR 에 안 넣은 것 (1차 당시 — 2차에서 정리)

- **스킬 창**(`SkillWindowLogic.mlua`) — 아직 안 건드렸다(#131 A 스킬창 조각과 겹치는 파일):
  - 초보자에게 스킬 목록이 안 나온다(`ShowTab` 이 차수 1~3 탭만 · `:618` "직업을 선택하면 스킬이 표시됩니다") → 창에서 Lv2 · Lv3 을 배울 수 없다.
  - 툴팁: MP 가 레벨 무관 `skill.mpCost`(10) · FLAT 효과가 단위 없이 숫자만(10/20/40).
- `SkillId` 형식: 계약서 §0-4 는 `SK_{W/M/A/T/P}{차수}{번호}` — 초보자 머리글자 `N` 이 없다. `SK_N01` 은 그 규칙을 한 글자 늘린 것이다(계약서는 안 고쳤다).
- 기획 문서 기록("기획문서에 추가해 적어놓을 것") — 어느 문서인지 A 가 적지 않았다 → 안 건드렸다.

### Play 체크리스트 (1차)

1. 매치 시작 직후(초보자 Lv1): `[Skill] auto-learn SK_N01 Lv.1 (novice · no SP)` · HUD Q 에 달팽이 아이콘.
2. Q: `SkillCaster: cast SK_N01 ok=true lv=1 … mpCost=10` · 레벨 1 껍질이 날아감 · 맞으면 hit · `SkillDatabase: DamageAt SK_N01 lv=1 FLAT 10` · 몬스터 피해 정확히 10(스킬은 닷지 말고는 크리가 없다 · `SkillProjectile.CalcCritical`) · Use 소리 · 시전 이펙트/파티클 없음 · 동작 swingO1(맨손 · 나무 검 둘 다).
3. Lv2 · Lv3(스킬 창이 없으니 서버 Lua 로 `RequestLearn` 경로 또는 결정 뒤 창): MP 15 / 20 · 피해 20 / 40 · 껍질 · hit 그림이 레벨마다 바뀐다(RUID 레벨별 3개 · 화면으로 확인).
4. 차수 SP: 레벨 5 초보자 → 번 SP 12 · Lv2 배우기 → `SP left 11` · 레벨 12 에 전직 → `tier SP -> tier 1 wallet=… keep=9 forfeit=…`(레벨 10~12 몫 9 만 남음) · 1차 스킬 배우기 가능 · 초보자 스킬 배우기 → `per-tier SP: only tier 1 skills now`.
5. 전직 뒤 Q = 직업 스킬 · 달팽이 세마리 시전 불가(`requires job line NOVICE`).
6. 빌드 경고 N → N.

## 2차 (2026-10-02) — A 답 반영 (#40 5927315602 · 5927820330)

main(`28edf31` · #131 · #154 · #155 포함)을 먼저 합쳤다(`bff1318` · 충돌 없음 · #131 이 지운 스킬 창 DEV 행은 지운 그대로).

| A 답 | 바꾼 것 | 어디 |
|---|---|---|
| Q2 스킬 ID `N` | 계약서 §0-4 표에 "스킬 `SK_{머리글자}{차수}{번호}` · W M A T P · **N 초보자**" 한 줄 | `Docs/스키마-계약.md` §0-4 (**스키마-계약 §0-4 단독**) |
| Q5 사거리 · 속도 | `SK_N01` Range 3 → **2.5** · Speed 8 → **6.5** · `#Note` 에 출처 | `SkillInfo.csv` (헤더 · 열 그대로) |
| Q6 초보자 SP Lv7 까지 | 0 차 번 SP 를 Lv7 에서 끊는다(`TierSpEarned` → 배우기 게이트 `TierSpLeft` 가 이것만 허락 · 타이머 틈에도 못 쓴다) + 초보자 구간 Lv8 · 9 레벨업이 지갑에 준 SP 를 서버 타이머(0.5 s)가 `SpendSp(uid, "TIER_SP_RESET", n)` 으로 덜어 낸다(`ForfeitNoviceLateSp`) · Lv10 부터 번 SP 는 1 차 몫이라 그대로(Q3 (c)) | `PlayerSkillState` `NoviceSpMaxLevel = 7` · `NoviceSpCheckInterval = 0.5` |
| Q1 초보자 스킬 창 | 초보자면 탭 세 개 = 0 · 1 · 2 차(첫 탭 = 초보자 스킬 · 탭 글자 "초보자" / 원래 첫 탭 글 / 둘째 탭 글) · 전직 뒤 예전처럼 1 · 2 · 3 차(.ui 원래 글자로 되돌림). 툴팁: 효과 "고정 피해 10/20/40" · MP = 그 레벨 MP(`MpCostAt`) · 다음 레벨 MP 가 다르면 금색 "→ MP 15" · 필요 줄 "필요 초보자 · 1레벨" | `SkillWindowLogic` `TabTier` · `ApplyTabLabels` · `FormatEffect` · `FormatCost` · `BuildTooltipParts` |

- **`.ui` 는 안 고쳤다.** 탭 글자는 런타임에 바꾼다(원래 글자를 처음 한 번 기억). 4번째 탭을 만들지 않은 이유: 초보자는 직업 줄이 없어 1 · 2 · 3 차 목록이 어차피 비어 있고, 전직 뒤엔 초보자 스킬을 못 쓴다(1차 결정 · `CanUse` 직업 검사).
- 레벨업 SP 를 덜어 내는 이유: 지갑은 A 의 `SummonManager.ApplyLevelUpRewards` 가 `LevelTable` SP 를 그대로 넣는다(레벨업 이벤트가 없어 짧은 주기로 본다 · A 파일 편집 없음). A 가 나중에 초보자 구간 레벨당 SP 를 `LevelTable` 에서 바꾸면(5927820330 "따로 알린다") 이 코드는 그 값을 그대로 읽는다 — Lv8 · 9 행을 0 으로 두면 덜어 낼 것도 0.
- 로그: `[Skill] novice SP cap Lv7: level= owed= took= wallet= -> …` · `SkillWindowLogic: ShowTab(0) jobLine=NOVICE tier=0 rows=1 labels=…`.
- **안 넣은 것:** 더블 점프(초보자 스킬 둘째 · 계획만 · 별도 PR) · 초보자 구간 레벨당 SP 양(A 가 따로 알림 → **3차에서 정리** · 5977728018) · 기획 문서(A 가 직접 · Q4).

### 점검

- mLua 진단: `PlayerSkillState` · `SkillWindowLogic` 0 errors · 0 warnings · 0 info. `node Docs/tools/check-integrity.cjs` 전부 통과(경고 3건 = main 과 같음). 줄 끝 그대로(PlayerSkillState LF · SkillWindowLogic CRLF · SkillInfo.csv BOM + CRLF · 33열).

### Play 체크리스트 (2차 · 아직 안 함 · 캡처 없음 — 스킬 PR 규칙)

1. 초보자로 K: 첫 탭 글자 "초보자" · 달팽이 세마리 한 줄(Lv1 · / 3) · `ShowTab(0) jobLine=NOVICE tier=0 rows=1`. 둘째 · 셋째 탭 = "직업을 선택하면 스킬이 표시됩니다." · 잠김 그림.
2. 툴팁: "고정 피해 10" · "MP 10" · "→ 고정 피해 20" · "→ MP 15" · "필요 초보자 · 1레벨". Lv3 에서 "(최대)" · MP 20.
3. Lv2 이상에서 + 로 Lv2 · Lv3 배우기 → 0 차 SP 가 준다(`[Skill] learn SK_N01 -> Lv.2 · tier 0 SP left …`).
4. 레벨 7 → 8 → 9: `[Skill] novice SP cap Lv7: level=8 owed=3 took=3` · 지갑(스킬 창 SP · HUD)이 Lv7 값 그대로 · Lv9 에서 owed=6.
4b. 틈 막기(2026-10-02 사용자 지적): Lv7 까지 번 0 차 SP 를 다 쓴 초보자가 Lv8 이 되는 순간(타이머가 덜기 전 · 지갑엔 +3) + 를 눌러도 거절 — `[Skill] learn SK_N01 rejected: tier 0 SP left 0 < 1 (novice SP counted to Lv7 · level 8)`. 배우기 게이트는 지갑이 아니라 0 차 몫(`TierSpLeft` = Lv7 까지 번 SP − 0 차에 쓴 SP)만 본다 — 타이머는 지갑 표시를 맞출 뿐 규칙을 지키는 곳이 아니다.
5. 레벨 10 이상 초보자: SP 가 다시 늘어난다(1 차 몫) · 전직하면 `tier SP -> tier 1 … keep=` 이 Lv10 이후 몫.
6. 전직 뒤 K: 탭 글자 .ui 원래 글자(1 · 2 · 3 차) · 첫 탭 = 1 차 스킬 · 초보자 스킬 없음.
7. 달팽이 껍질 사거리 2.5 · 속도 6.5(예전보다 짧고 느림).
8. 빌드 경고 N → N.

## 3차 (2026-10-04) — 초보자 SP 규칙 (A 결정 #40 5977728018 · 사용자 승인)

A 결정: 공짜 달팽이 세마리 Lv1 없음 · 매치 시작에 **SP 1**(스킬이 아니라 SP 만) · Lv2 ~ Lv6 레벨업마다 +1 · Lv7 ~ Lv9 는 0 · 초보자 합계 **6**. 표로 해도 된다(A 파일 · A 가 리뷰에서 승인).

| 바꾼 것 | 값 | 어디 |
|---|---|---|
| 자동 Lv1 끔 | `NoviceAutoSkillId` `"SK_N01"` → `""`(`AutoLearnNoviceSkill` 은 남기고 아무것도 안 한다) | `PlayerSkillState` |
| 매치 시작 SP 1 | 새 원장(`EnsureUser` — 매치 시작 · 리셋은 `ResetMatchState` 가 부른다 · 예전 자동 Lv1 자리)에서 `GrantNoviceStartSp` → A 의 `SummonManager:GrantSp(uid, 1)` · `u.noviceStartSp = 1` | `PlayerSkillState` `NoviceStartSp = 1` |
| 0 차 번 SP 에 시작 SP 포함 | `TierSpEarned(uid, 0)` = `u.noviceStartSp` + 레벨업 몫 → 배우기 게이트 `TierSpLeft` 가 Lv1 에서 SP 1 을 허락 · 전직 때 안 쓴 시작 SP 는 다른 0 차 SP 와 같이 `ForfeitOldTierSp` 가 없앤다 | `PlayerSkillState` |
| 초보자 SP 상한 | `NoviceSpMaxLevel` 7 → **6**(Lv7 ~ 9 레벨업 몫은 0 차에 안 센다 · 타이머 `ForfeitNoviceLateSp` 는 안전망으로 남김 · 지금 표로는 덜 몫 0) | `PlayerSkillState` |
| 레벨업 SP | `LevelTable` SP: 1 ~ 5 행 3 → **1** · 6 ~ 8 행 3 → **0** · 9 행 이후 3 그대로 | `LevelTable.csv` (A 파일 · BOM + CRLF · 열 그대로) |

- 행 번호 = **오르기 전 레벨**이다: `SummonManager.ApplyLevelUpRewards(fromLevel)` 가 `GetLevelRow(fromLevel)` 의 SP 를 준다(1 행 #Note "Lv1→2 에 필요한 exp"). 그래서 "Lv2 ~ Lv6 레벨업" = 1 ~ 5 행 · "Lv7 ~ Lv9 레벨업" = 6 ~ 8 행 · Lv9→10(1 차 몫) = 9 행은 3 그대로.
- 차수별 번 SP(지금 표): 0 차 **6**(시작 1 + 5) · 1 차 30 · 2 차 30 · 3 차 3. 0 차 필요 SP = 달팽이 세마리 3 + 더블 점프(#160) 3 = 6.
- 계약서 B-3 의 SP 지급 경로가 하나 늘었다(`GrantSp` 호출 첫 곳 · A 의 공개 API · A 파일 편집 없음).
- 로그: `[Skill] novice start SP +1 (no skill · #40 5977728018)` · `[Summon] +sp 1 -> sp=1` · 거절 `… (novice SP = start 1 + level-ups to Lv6 · level n)`.

### Play 체크리스트 (3차 · 아직 안 함)

1. 매치 시작 직후(초보자 Lv1): `[Skill] novice start SP +1` · HUD · 스킬 창 SP 1 · 달팽이 세마리 Lv0(자동 습득 로그 없음) · Q 는 아직 못 쓴다.
2. 스킬 창 + → `[Skill] learn SK_N01 -> Lv.1 · tier 0 SP left 0` · Q 시전 가능.
3. 레벨 2 ~ 6: 레벨업마다 SP +1. 레벨 7 ~ 9: SP 그대로(`[Summon]` 레벨업 SP 0 · `novice SP cap Lv6` 로그 없음 · 덜 몫 0).
4. 레벨 10: SP +3(1 차 몫) · 전직하면 `tier SP -> tier 1 … keep=` 이 Lv10 이후 몫.
5. 두 번째 매치(로비 → 매치): 다시 SP 1 · 스킬 레벨 0(`ResetUser` 순서 = SummonManager → PlayerSkillState).

## 4차 (2026-10-05) — 껍질이 손에서 나가게 (사용자 "머리 근처에서 나간다" · 기준 = 사용자 원작 영상)

- 비교: 영상 "옛날메이플 달팽이세마리 무한던지기버그 쓰는 방법" t=4.57–5.15s · 5.80–6.40s(던지기 2번) ↔ 우리 Play 캡처 `N01_ours_1005.mkv` 13.0s(오른쪽) · 14.5s(왼쪽) · WZ KMS 359 `Skill/000.img/skill/0001000` · `Character/00002000.img/swingO1`. 길이 기준 = 껍질 그림(26px 실물) — 영상 ≈3.46px/원작 1px · 캡처 ≈0.66px/원작 1px.
- `SkillExecutors.effectOverrides.SK_N01.spawn = { delay = 0.45, offsetY = 0.28 }` 한 줄:
  - 높이 0.5(CSV · 키의 0.75배 = 눈높이) → **0.28**(영상 두 번 다 껍질 중심이 발바닥 위 원작 28px · 키의 0.42배).
  - 시점 시전 즉시 → **0.45s 뒤**(swingO1 0.30/0.15/0.35s 의 2프레임 시작 · 영상 13프레임 = 0.43s).
  - 앞 거리 · 크기 · 소리(Use 시전 순간 · Hit 없음 = 원작에도 없음) · 동작(swingO1 1배속) · 피해 · MP · 사거리 · 속도는 그대로.
- 안 바꾼 것(후보 키트 `villagedefense-harness/pirate-check/pn01_server.lua` + `pn01_client.lua` 로 사용자가 고른다): 캡처에서 껍질이 생긴 자리보다 ≈0.4 앞에서 처음 보이는 지연 보정(앞 0.15 · 0.35s) · 시전 락 0.4 ↔ 0.8(원작은 swingO1 0.8s 동안 못 움직인다 · 지금은 0.45s 발사 전에 락이 풀린다).
- 영상 속도 ≈7.3–8.4 u/s(우리 6.5 · A 답 5927820330 "본섭과 같게") — 숫자라 안 바꿨다 · A 에게 물을 거리.
- #163(`b/skill-projectile-adjacent` · `SkillAttack.SpawnProjectile` 의 앞 거리 당기기)과 파일이 안 겹친다 — 이 변경은 실행기 표의 `spawn` 칸뿐이고 앞 거리 offsetX 를 넣지 않았다.
