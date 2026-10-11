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
