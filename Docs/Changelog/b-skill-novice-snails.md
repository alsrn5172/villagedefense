# b/skill-novice-snails — 초보자 스킬 달팽이 세마리 + 차수별 SP 독립

## 1차 (2026-10-01)

출처: A 요청 #40 5875058360(초보자 스킬 · Q 자동 등록) · B 착수 5891302921 · 값 = A 답 5891464912(사용자 강민구) + 5898022370(고정 피해 · 1타) · 5897840522(같은 답 재게시).

| 항목 | 값 | 어디 |
|---|---|---|
| 스킬 | `SK_N01` 달팽이 세마리 · 초보자(`NOVICE` · 차수 0) · Tab 0 | `SkillInfo.csv` 새 행 1개(헤더 그대로) |
| 피해 | **고정** 10 / 20 / 40 · 1타 | `EffectUnit FLAT` · `SkillDatabase.DamageAt` 에 FLAT 분기(= RatioAt · 공격력 · 버프 배율 없음) |
| MP | 10 / 15 / 20 | `SkillDatabase.MpCostAt` → `SkillCaster` 클라 예측 · 서버 차감 두 곳 |
| 쿨타임 | 0 | CSV |
| 해금 · 최대 · SP | Lv1 · 3 · 1씩 | CSV. **Lv1 은 매치 시작(새 원장)에 자동**(A 요청 3번 · SP 안 씀) → Lv2 · Lv3 에 SP 1씩 |
| Q | 초보자면 Q = 달팽이 세마리 | `SkillHotbar` slot 1 `byJob.NOVICE`(구조 그대로 · A 의 HUD 가 읽는다) |
| 연출 | 원작 `skill/000.img/skill/0001000`(KMS 389 String "달팽이 세마리"): 레벨별 껍질 ball + hit/0 · Use 소리 `9313440a…` · 아이콘 `bd139447…` · 시전 이펙트 없음 · 동작 swingO1 | `SkillExecutors.effectOverrides.SK_N01`(`levels` · `cast.none`) · `castSounds` |
| 사거리 · 속도 | Range 3 · Speed 8 = 에너지볼트와 같은 **임시값**(원작 WZ 에 사거리 없음) | CSV |

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

### 결정 대기 · 이 PR 에 안 넣은 것

- **스킬 창**(`SkillWindowLogic.mlua`) — 아직 안 건드렸다(#131 A 스킬창 조각과 겹치는 파일):
  - 초보자에게 스킬 목록이 안 나온다(`ShowTab` 이 차수 1~3 탭만 · `:618` "직업을 선택하면 스킬이 표시됩니다") → 창에서 Lv2 · Lv3 을 배울 수 없다.
  - 툴팁: MP 가 레벨 무관 `skill.mpCost`(10) · FLAT 효과가 단위 없이 숫자만(10/20/40).
- `SkillId` 형식: 계약서 §0-4 는 `SK_{W/M/A/T/P}{차수}{번호}` — 초보자 머리글자 `N` 이 없다. `SK_N01` 은 그 규칙을 한 글자 늘린 것이다(계약서는 안 고쳤다).
- 기획 문서 기록("기획문서에 추가해 적어놓을 것") — 어느 문서인지 A 가 적지 않았다 → 안 건드렸다.

### Play 체크리스트

1. 매치 시작 직후(초보자 Lv1): `[Skill] auto-learn SK_N01 Lv.1 (novice · no SP)` · HUD Q 에 달팽이 아이콘.
2. Q: `SkillCaster: cast SK_N01 ok=true lv=1 … mpCost=10` · 레벨 1 껍질이 날아감 · 맞으면 hit · `SkillDatabase: DamageAt SK_N01 lv=1 FLAT 10` · 몬스터 피해 정확히 10(스킬은 닷지 말고는 크리가 없다 · `SkillProjectile.CalcCritical`) · Use 소리 · 시전 이펙트/파티클 없음 · 동작 swingO1(맨손 · 나무 검 둘 다).
3. Lv2 · Lv3(스킬 창이 없으니 서버 Lua 로 `RequestLearn` 경로 또는 결정 뒤 창): MP 15 / 20 · 피해 20 / 40 · 껍질 · hit 그림이 레벨마다 바뀐다(RUID 레벨별 3개 · 화면으로 확인).
4. 차수 SP: 레벨 5 초보자 → 번 SP 12 · Lv2 배우기 → `SP left 11` · 레벨 12 에 전직 → `tier SP -> tier 1 wallet=… keep=9 forfeit=…`(레벨 10~12 몫 9 만 남음) · 1차 스킬 배우기 가능 · 초보자 스킬 배우기 → `per-tier SP: only tier 1 skills now`.
5. 전직 뒤 Q = 직업 스킬 · 달팽이 세마리 시전 불가(`requires job line NOVICE`).
6. 빌드 경고 N → N.
