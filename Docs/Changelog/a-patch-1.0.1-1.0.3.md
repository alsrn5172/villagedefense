# a/patch-1.0.1-1.0.3 — 1.1 패치 1차 (1.0.1 · 1.0.2 · 1.0.3)

구현명세(허브 `패치내용/명세/1.1` · `명세/1.0.3`)의 권장 순서대로 단계별로 적는다. Draft PR #205.

## 0단계 — 선행 단독 변경 (CSV 헤더 · 스키마 · 아이언호그)

- **CSV 헤더 3개** (Draft PR #205 맨 위 단독 공지 · `check-integrity` CANONICAL · `스키마-계약` 같이 변경)
  - `EnhanceSlotBonus.csv` 맨 뒤 `FixedSpeed` · `FixedAccuracy` — 신발 강화 1단계당 이동속도 +3 · 장갑 명중률 +5(%p) · 박은 보석과 무관 (1.1-F10 · 기본 장비 줄 포함 12행씩). `ItemCatalog.LoadSlotBonus` · `ComputeEnhance` 가 읽고 공방 강화 미리보기 '기본 …' 줄에 이동속도 · 명중률 · 최대 HP 키 추가.
  - `MinionWave.csv` `Enabled` 와 `#Note` 사이 `Level` — 웨이브별 미니언 레벨(1P 12 · 15 · 18 / 2P 20 · 23 · 27 / 3P 30 → 44분 39 · `P3-ZOMBIE` 빈칸) (1.1-H01 · 레벨을 읽는 코드는 4단계).
  - `MonsterInfo.csv` 맨 뒤 `Defense` (1.1-E21 · E30).
- **몬스터 · 보스 방어** (1.1-E21 · 사용자 2026-10-12 "스킬에도 적용 · 보스도"): `Monster.Defense` 신설 · `DamageFormula.ApplyTargetDefense` 신설 · 기본 공격(`StatService.CalcPlayerDamage`)과 스킬(`SkillAttack` · `SkillProjectile` `CalcDamage`)에서 `raw × 100/(100+방어)` 로 깎는다(반사 같은 평값 피해는 제외). 스폰하는 곳이 넣는다 — 사냥터(`MonsterSpawner` · MonsterInfo) · 자이언트(`EliteSpawner` · EliteMonsterInfo · 지금은 전부 0) · 보스(`BossSpawner` · BossInfo: 마노 20 · 머쉬맘 30 · 킹슬라임 30 · 스텀피 40 · 발록 50 · 에피네아 50 · 피아누스 50) · 소환수(`BossSkillRunner.SetupSummon`). 1.0.2 DPS 계산표가 발록 방어 50 을 넣고 처치 시간을 계산해 둔 것과 맞춘다.
- **아이언호그** (1.1-E20): `MonsterInfo` 4230103 레벨 7 → 30 · 기초 HP 90 → 1,875 · 공격 38 → 243 · 방어 40. 돼지 해변에서 사라져 재료(`MAT_4230103`) 얻을 곳이 없는 건 그대로 둔다 — 1.0.4 에서 사냥터 3 에 넣을 예정(사용자 2026-10-12).
- **소환수 접촉 공격** (1.1-E22 · 사용자 2026-10-12 "소환수도 일반 몬스터와 같다 · 통일"): 보스 스킬 소환수 전부가 `MonsterInfo.Attack` 으로 접촉 피해를 준다(`MonsterAttack.SummonAttack` · 예전엔 `FarmReward` 가 없어 늘 1). 회피 · 플레이어 방어 흐름은 일반 몹과 같다.
- **자동 분배 방식 계정 저장** (1.1-G08): `AccountProfile.account_apMode`("BALANCE" 기본 / "ATTACK") · SchemaVersion 7 · `AccountData.GetApMode` / `SetApMode`. 쓰는 곳(레벨업 분배 · UI)은 3단계.

## 1단계 — 스탯 · 판정 기반

- **추가효과 효율** (1.1-G01 · A01 흡수): `StatService.NonCoreEffectMul` 0.1 · `EffectEff(userId, stat)` / `EffectEffOfJob(job, stat)` — 주 · 부스탯 1.0, 그 외 0.1(초보자는 STR · DEX 가 주 · 부). `Recalculate` 안 지역 함수 `eff` 를 파생치가 쓴다.
- **명중률** (1.1-A02 · G04): 기본 20%p + 장비 · 강화 · 버프(효율 없이) + DEX × 0.15 × 효율 · LUK 은 명중에서 뺌 · 소수 3자리. `DamageFormula.DerivedAccuracy` 삭제.
- **대상 레벨 · 회피율 한 곳** (1.1-A05): `StatService.ResolveTarget` — 보스(보스 모델 소환수 포함) = `BossInfo.Level` · 회피 20%, 그 밖 = `MonsterCatalog.LevelOfEntity`(사냥터 덮어쓰기 > 미니언 웨이브 > 수비대 > 도감) · 회피 10%. 기본 공격과 스킬(`SkillDatabase.RollSkillHit`)이 같이 쓴다. `MinionUnit.Level` · `DefenderUnit.Level` 속성만 먼저 두고 값은 4 · 8단계에서 넣는다.
- **명중 확률식** (1.1-A04 · A06): `100 + 명중률 − 10 × (대상이 높은 레벨 차) − 대상 회피율` · 판정만 0~100% · 최저 10% 보장 삭제(`HitChance` / `HitCheck`). 몹 회피 옛 상수(`MobAvoidBase` · `MobAvoidPerLevel` · `AvoidWeight` · `HitFloor`) 삭제.
- 확인(Play · `maker_execute_script`): 명중 확률 (20.75, Lv1 → Lv1, 회피 10) = 1.0 · (→ Lv10) = 0.2075 · (0, → Lv30, 회피 20) = 0.0 · 마법사 DEX 효율 0.1 · 궁수 1.0 · 초보자 DEX 5 명중률 20.75 · 런타임 에러 0.

## 2단계 — 장비 · 보석 데이터

- **보석 부위 제한** (1.1-F01~F09): `EnhanceSlotBonus` 보석 열을 부위 허용표대로 0 처리 — 다이아몬드 · 사파이어 = 무기 · 장갑(장갑 양 = 무기와 같은 값 · 사용자 2026-10-12) / 자수정 = 모자 · 신발 / 아쿠아마린 · 오팔 = 신발 / 가넷 = 장갑 / 토파즈 = 옷 · 전사 방패 / 에메랄드 = 옷 / 결정 4종 = 방패 외 전부. 가넷 `AddAccuracy` · 오팔 `AddAvoid` = 1.25(보석 1개 2.5%p · 2.5% · F14 · F15).
- **방어력 ×2** (F22~F25 · F27): 모자 · 상의 · 하의(한벌옷 포함) · 신발 · 장갑의 `BaseDefense` 와 강화 `AddDefense` 두 배. 방패는 그대로(F26).
- **신발 · 장갑 · 완드** (F11~F13): 신발 `BaseSpeed` 0 · 3 · 6 · 9 · 12 · 15(티어 10렙 ~ 앱솔) · 장갑 `BaseAccuracy` 5 · 10 · 15 · 20 · 25 · 30 · 완드 `BaseAccuracy` 70(전직 기념 `WEAPON_MAGICIAN_BASIC` 포함).
- **전사 방패** (F17 · F18): STR · DEX 0 · `BaseMaxHp` 280 · 760 · 960 · 1,160 · 1,360. 강화하면 직업 주 · 부스탯 대신 최대 HP 가 단계당 기본값의 1/3(`ItemCatalog.ShieldHpPerEnhance`) 오른다.
- **앱솔랩스** (F28 · F29): 모자 · 신발 · 장갑 올스탯 16 → 30 · 무기(두손 포함) 0 → 30 · 한벌옷 직업별 60 / 40 / 30 / 30.
- **한벌옷 강화** (F20 · F21 · 사용자 2026-10-12): 보석 칸은 1 · 2 · 3 그대로, **칸마다 보석 2개**가 들고 효과도 칸마다 2배(지금 계산 그대로). `EnhanceService` 가 칸 × 2개를 확인 · 차감하고 공방 창은 보유 수 · 고르기 잠금 · "칸마다 2개" 문구 · "다이아몬드 2개 = 공격력 +N" 미리보기를 같은 규칙으로 보인다.
- **제작 · 판매** (F31 · F32): 20렙제 한벌옷 지역 재료 15 → 16 · 해적 10렙 한벌옷 5 → 6 · 해적 15렙 한벌옷 메소 1,450 → 1,300 · 재료 12 → 10 · 판매가 725 → 650. 앱솔 한벌옷 봉인석은 1개 그대로.
- **수치 글자** (F16 · 사용자 2026-10-12): `ItemCatalog.FmtStat` — 정수는 소수점 없이, 소수는 한 자리(2.5) · 이동속도 · 명중률 · 회피율 합계에 `%`. 툴팁 · 공방 미리보기 · 보석 고르기가 같이 쓴다.
- **툴팁 최대 9줄** (F30 · 사용자 2026-10-12 "9줄이 필요하면 9줄 · 적으면 그만큼"): 캐릭터 창 툴팁 능력치 줄 5 → 최대 9(`CharacterGroup` `StatList/Row5`~`Row8` · `InventoryUIController.TipMaxRows`). 앱솔 장비는 강화 +1 부터 올스탯이 STR · DEX · INT · LUK 4줄로 풀려 8~9줄이 된다(앱솔 완드 명중률 70 · 앱솔 신발 오팔 회피율 · 앱솔 장갑 다이아 · 사파이어 · 가넷 · 앱솔 한벌옷 MP). 툴팁 높이는 보이는 줄 수에 맞춘다(지금 그대로). 공방 강화 미리보기는 판에 4줄만 들어가 줄 수는 그대로 두고, 넘치면 보석이 올리는 줄을 먼저 보인다(고정 상승은 위 '기본 …' 글에 다 나온다). 앱솔 한벌옷 +1 · +2 주스탯은 지금 계산값 80 · 100 그대로(문서를 고침).
- **게임 소개 창** (F34 1번): 보석 설명 "다이아몬드 · 사파이어는 무기에만" → "무기 · 장갑에만". 나머지 문구는 그대로(사용자 2026-10-12).
- 계약서: `EnhanceSlotBonus` 설명에 부위 허용 · 한벌옷 보석 규칙 두 줄(F33 1번). 디스코드 DB · 가이드 글(F33 3 · 4번)은 머지 뒤 `디스코드/sync.cjs` 로.

## 3단계 — 스탯 효과 · 치명 · 숙련도

- **치명타** (1.1-A12 · A13 · A14 · G05 · G13 · B22 · 사용자 2026-10-12 "기본 공격 · 스킬 · 궁극기 할 것 없이 무조건"): 원확률 = 5% + 유효 LUK × 0.3%p(유효 LUK = LUK × 효율 · 비주력 0.1) · 실제 확률 상한 100% · 치명타 피해 = 200% + 넘친 원확률(`DamageFormula.CritRawRate` · `CritRate` · `CritDamageRate`). 기본 공격(`PlayerAttack`) · 스킬(`SkillAttack` · `SkillProjectile`) · 궁극기 · 파워 스트라이크(시전 순간 1회)가 같은 `StatService.RollCritical` · `GetCritDamageRate` 를 쓴다. 닷지 확정 크리는 그대로(피해 200%).
- **회피율 %p** (A08 · G05): 기본 0 + LUK × 0.05 × 효율 + 장비 · 오팔 · 버프. DEX 는 회피에 안 더한다 · `DerivedAvoid` 삭제 · 몹 · 미니언 · 수비대의 회피 판정이 최종 회피율을 읽는다(판정식은 4단계).
- **STR · INT 추가효과** (G02 · G03 · B11): STR 1당 최대 HP +20 · 방어 +0.1 · INT 1당 최대 MP +20 (비주력은 각 10%). 마법사의 자질 기본 MP 2배는 없음(예고 취소).
- **시작 HP · MP 가득** (사용자 2026-10-12 "시작 때만 가득"): 스탯 원장 첫 반영 · 매치 시작(`MatchResetService.ResetUser` 끝 `StatService.FillToMax` · `SummonManager.FillMp`) 때만 채운다. 그 밖엔 최대치만 늘린다(레벨업 · 부활 채움은 그대로).
- **숙련도** (A15): 무기 0.5 + 최종 부스탯 200 이상 +0.2 + DEX 300 초과 1당 +0.001 × 효율 · 상한 0.9 → 1.0(`StatService.MasteryOf` · `DamageFormula.MasteryMax`).
- **스킬 피해 = 스탯공격력 범위** (A16): 스킬 % 의 기준이 기본 공격과 같은 [최저, 최대] 범위에서 굴린 값(`SkillDatabase.RollStatAttack`). 궁 합계 표시는 같은 타격의 굴림을 공유한다(`RolledAmount`).
- **마법사 = 마력** (사용자 2026-10-12 "마법사는 예외 · 무조건 마력"): 마법사 총공격력 = 레벨 기본 공격력 + 최종 마력(`StatService.TotalAttackOf`) · 마법사 무기의 강화 고정치는 마력으로 오른다(`ItemCatalog.ComputeEnhance`) · 다이아(공격력)는 마법사 피해에 안 들어간다.
- **화면** (A07 · 사용자 2026-10-12): 캐릭터 창 명중률 · 회피율 = % · 소수 한 자리 · 100% 를 넘어도 원수치. **치명타율 칸 신설**(전투 능력치 맨 아래 `Right/Row10` · 원확률) — 같은 판에 7줄이 들어가게 줄 높이 36 → 30(간격 31)으로 재배치 · 치명타율 아이콘은 그림이 없어 꺼 둠(디자이너 요청). 툴팁 · 공방의 이동속도 · 명중률 · 회피율은 괄호 안 내역 숫자에도 %.
