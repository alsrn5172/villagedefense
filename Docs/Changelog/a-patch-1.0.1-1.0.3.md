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
