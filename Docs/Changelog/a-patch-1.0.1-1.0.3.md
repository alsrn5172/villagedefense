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
- **화면(3단계)** (A07 · 사용자 2026-10-12): 캐릭터 창 명중률 · 회피율 = % · 소수 한 자리 · 100% 를 넘어도 원수치. **치명타율 칸 신설**(전투 능력치 맨 아래 `Right/Row10` · 원확률) — 같은 판에 7줄이 들어가게 줄 높이 36 → 30(간격 31)으로 재배치 · 치명타율 아이콘은 그림이 없어 꺼 둠(디자이너 요청). 툴팁 · 공방의 이동속도 · 명중률 · 회피율은 괄호 안 내역 숫자에도 %.

## 4단계 — 회피 · 오라 · 레벨 공급

- **플레이어 회피 판정** (1.1-A09 · A10 · 사용자 2026-10-12): 회피 확률 = 회피율 + 나보다 낮은 몬스터 1레벨당 10%p − 몬스터 명중률 보정 · 0 아래만 자르고 상한 없음(`DamageFormula.DodgeChance` · 옛 몹 명중 · 상한 35% 상수 삭제). 명중률 보정은 회피 합계에서 뺀다.
- **보스 공격도 회피** (A11 ② · 사용자 2026-10-12): 보스 접촉 · 스킬 · 투사체가 보스 레벨(BossInfo.Level)로 같은 회피 판정을 받는다(`DamageFormula.TryPlayerDodge` · `BossSkillRunner.BossLevel` · `BossProjectileAttack.SourceLevel`). 포탑 · 억제기 공격은 그대로 회피 없음.
- **판정 레벨 공급** (H01 · H02 · H03): 웨이브 미니언 = `MinionWave.Level`(12 ~ 39 · 좀비 · 물버섯도 같은 웨이브 값 · ★1 3페이즈는 P2-3 의 27) → `MinionUnit.Level` · 수비대 = 도감 레벨 + 강화 1단계당 2(`DefenderService.DefenderLevelOf` · 리본돼지 17 → 강화 Lv5 25) → `DefenderUnit.Level` · 파병 유닛도 같은 식 · 보스 일반 몹 소환수 = `Monster.Level`(SetupSummon · 없으면 Lv1 로 보여 전부 회피됐다). 몹 · 미니언 · 수비대의 회피 판정 레벨은 플레이어 명중과 같은 `StatService.ResolveTarget` 한 곳에서 읽는다.
- **커닝 억제기 명중 오라** (A10 · A17 · H13 · H14 · 사용자 2026-10-12 "%p 더하기"): `VillageFacilityTrait` `KERNING SUPPRESSOR AURA_ACC 20/30/40`(%p) · 범위 안 아군 플레이어 = 최종 명중률에 더함(`StatService.SetAuraAccuracy` · 캐릭터 창에도 보임) · 아군 수비대 = `Buff.AccAdd` → 그 수비대의 공격을 피할 플레이어 회피에서 뺌 · 미니언은 안 받음(`FactionAuraController.AllyAccBonus`). 계약서 `TraitKey` 목록 · 키 표에 `AURA_ACC`.

## 5단계 — 직업 스킬 (1.1-B · C)

- **도발** (B01 · B02 · 사용자 2026-10-12): 끌어오기 해제(`TauntPull` false) · 쿨타임 10초 · 지속 동안 나를 추격 · 대상마다 고정 피해 1(평값 패스) · 방어력 −0/−5/−10/−15/−20(보스 절반) — 몬스터 · 보스의 실효 방어(`DamageFormula.TargetDefenseOf` = 방어 + `SkillExecutors.GetTauntDefenseDelta`)를 깎고 0 아래도 허용(`DefenseFactor`). 플레이어 기본 공격 · 스킬 · 투사체에만 · 마지막 도발이 덮어쓴다. 새 설명 · 스킬창 문장.
- **전사** (B03 ~ B09 · C12): 파워 스트라이크 405% + 101.25%/Lv · 위쪽 판정 1.2 · 레이징 블로우 1타 = 파워 스트라이크의 60% · 쓸 수 있는 때 = 하이퍼 바디 중 · 불굴의 진 = 컷신이 끝난 뒤 15초(사용자 2026-10-12 · `Duration` 15) · 피격 무적 기본의 25% · 그동안 아이언 바디 반사 ×100(`SkillBuffs.UnyieldingReflectMul`).
- **마법사** (B10 ~ B15): 텔레포트 → 마법사의 자질(쿨 1초) · 텔레포트 강화 쿨 0.5초 · 350% + 50%/Lv · 에너지볼트 210% + 30%/Lv(플레임 헤이즈 2배 유지) · 매직 가드 추가 피해 = 최대 MP 25%(`GetOnHitBonusDamage` 가 최대 MP).
- **쉐도우 파트너** (B16 ~ B21 · 사용자 2026-10-12): 최종 피해 배율 삭제 → 피해를 주는 원본 투사체마다 열화 투사체 하나(시전자 뒤 0.33 · 0.1초 늦게 · 원본이 실제로 맞힌 대상만 · 원본 확정 피해 × 50~70% · 치명 없음 · 다시 복제 없음 · 명중 효과 · 소리 · 픽파켓 동전 같음) — 럭키 세븐 · 아대 기본 공격. 지속 중 공격속도 ×1.2: 스킬 시전 락(서버 · 클라) · 기본 공격 락 · 발사 · 연사 간격 · 분신 연출 · `WeaponMotion` 모션 재생 속도. 궁 · 쿨타임 · 지속 · 비행 속도 · 엔진 기본 모션(단검)은 그대로.
- **해적 · 궁수 · 도적 수치** (C01 ~ C08 · CSV): 섬머솔트 킥 300% + 90%/Lv · 판정 위 1.295 · 뒤 0.2 · 선원 관리 7.5% + 2.5%/Lv · 피스트인레인지 180% + 30%/Lv · 재입력 시전 락 ×0.8(`SkillCaster.castLockScale` · 모션은 그대로) · 에너지 쉴드가 남아 있으면 그 타격(깨는 타격 포함) 넉백 없음(`PlayerHit`) · 닷지 18초 + 3초/Lv · 메소 익스플로전 동전당 500%.
- **궁극기 피해 · 타수** (C09 ~ C11 · C13 · 사용자 2026-10-12 "연출 구간에 나눠 치기"): 대마법 1,100% × 100타 = 06:04 첫 타(폭발 연출 · 명중음) + 99타를 영상 끝까지(`BlastSplitHit`) · 폭풍의 화살 650% × 100타 = 두 화살비 구간에 길이 비율(28 + 72 · `UltimateHitTimes` 구간 몫 비례) · 함포 사격 480% × 300타 = 파마다 150타를 15타 × 10패스로 0.4초 안에(`BarrageSubPassHits` · `BarrageSubPassSpan`). 합계 피해는 한 패스와 같다.
- **원거리 조준 띠** (C14 · C15): 조준 · 명중 세로 띠 = 발 −0.35 ~ 발 +1.4(키 × 0.5 / × 2.0 · `SkillAttack.CasterBandOf` · `CasterHeightOf`) · 탐색 상자 = `AimSearchShape`(투사체 · 기본 공격 · 조준 표시 · 스나이핑 3명 공용) · 아래층 제외(발 0.6 · `AimFloorTolerance` · `SkillProjectile.FloorTolerance`) 삭제 — 폭발 이웃도 거름 없음. 초보자 달팽이 세마리도 같은 띠.
- **로그** : `FindSkillTarget` 의 `belowFloor` 칸 삭제 · 나눠 친 궁 타격은 첫 · 마지막 타만 남긴다(`BLAST … split hit` · `LINE … split hit` · `BARRAGE … pass s/n`).

## 6단계 — 몬스터 · 보스 HP/공격 (1.1-E)

- **레벨 HP 배율** (E01 · E02 · E03 · E05): `MonsterCatalog.HpLevelMul` = 유효 레벨 11 이상이면 min(레벨 − 10, 25)(Lv17 ×7 · Lv24 ×14 · Lv30 ×20 · Lv35+ ×25) · `LevelHp`(기초 HP × 배율 · 반올림 한 번). 사냥터(`MonsterSpawner` · LevelOverride 레벨) · 자이언트(`EliteMonsterInfo.Level` · E1210101 49,000) · 보스 소환수(모든 소환수 · 아이언호그 37,500 · 좀비버섯 22,500)에 곱한다.
- **보스 HP 일원화** (E04 · E08 · E09 · E28): `BossCatalog.FinalMaxHp` = MaxHp × 레벨 배율 × ★ 배율 — `BossSpawner`(스폰 · 난이도) · `BalrogRoomService.BossMaxHp` 공용. 주니어 발록 Lv40 · 기초 136,800 · 접촉 2,520 → ★1/3/5 1,710,000 / 3,420,000 / 6,840,000 · 지역 보스 5종 Lv30 ×20 · 마노 기초 600.
- **보스 공격** (E10 · E12 · E13 · E14 ~ E19): 스킬 피해도 ★ 공격 배율(`BossSkillRunner.AttackMul` · 접촉 · 즉발 · 투사체) · 발록 ★1 공격 0.25 · 발록 스킬 2,220 / 4,440 / 6,660 · 지역 보스 공격 · 스킬 ×2.5(머쉬맘 375 · 킹슬라임 450 · 스텀피 450/연사 113/지면 540 · 에피네아 750/600/900 · 피아누스 825/660/990). ★1 소개 문구에 발록 공격 1/4(7단계에서 "보스 HP와 공격 절반 (발록 공격 1/4)" 로 합침).
- **발록 HP 15% 소환 = 아이언호그 3마리** (E11) · **돼지 해변 = 돼지 10곳 + 스포아 8곳** (E23 · 사용자 2026-10-12 "리본돼지 삭제" · 도감 레벨 그대로).
- **웨이브 미니언 · 수비대 · 파병 HP** (E06 · E07 · 사용자 2026-10-12 "원문대로"): 미니언 = 행 HP × 웨이브 레벨(12~39) 배율(`MinionFlowService.QueueWave` · P1-0 2,000 · P3-1 100,000 · P3-13 224,475) · 수비대 · 파병 = 표 HP × 수비대 레벨(도감 + 강화×2) 배율(리본돼지 T2 Lv1 35,840 · Lv5 182,340 · 파병 절반). 튜토리얼 웨이브는 레벨 0 → ×1(E31).
- **좀비머쉬맘** (E24 · E25 · E29): 기초 HP 60,000 · 3페이즈 웨이브마다 HP · 공격 +10% 누적(`MatchSessionLogic.ZombieWaveGrowth` · `p3Index`) · 레벨 = 그 웨이브 레벨(H01) → 25분 1,200,000 · 30분 1,932,620 · 44분 4,707,650.
- **비용** (E26 · E27): 발록 도전 ★5 200 → 100 · 지역 보스 입장 ★1 50 · ★3 100 · ★5 100(`DifficultyRule.BOSS_ENTRY_COST` 새 키 · `PortalNetwork.BossEntryCostFor` · 차원 관문 · 안내 T14 같은 값 · 매치 밖 100). 안내 · 튜토리얼 · 소개 창 문구와 계약서(`DifficultyRuleKey` · 확정값 · 보스 HP 규칙) 갱신.

## 7단계 — 성장 · 보상 (1.1-D)

- **경험치 곡선 · 처치 경험치** (D01 ~ D04): `LevelTable` Lv10 ~ 14 ×1.2 · 15 ~ 19 ×1.6 · 20 ~ 30 ×3(Lv1→30 누적 24,595 → 61,515) · 도감 Exp Lv17 38 → 57 · Lv24 70 → 175 · Lv30(좀비머쉬맘 · 쉐도우 블레이드) 97 → 291 · 아이언호그 16 → 48(`MonsterCatalog.LevelBaseStats` 같은 값) · 자이언트 = 도감 × 10(570 · 1,750 · 480) · 좀비머쉬맘 웨이브 2,910.
- **처치 경험치 식** (D05 ~ D09): 표 × `MATCH_EXP_MUL`(★1 2 · ★3 · ★5 1) × `KillExpMul`(테스트 임시 3.0 → **1.0 확정** · `Docs/테스트-임시값.md`) × 레벨 차(`SummonManager.ExpGapMul` · 몬스터 − 내 매치 레벨: 0 = 110% · 낮음 ~ +4 = 100% · +5 ~ +7 = 80% · +8 이상 = 60%) · 반올림 한 번 · 0 이면 지급 생략(처치 집계는 그대로). 몬스터 레벨 = 자이언트 도감 레벨 · 그 밖 `LevelOfEntity`(좀비머쉬맘 = 웨이브 레벨).
- **★별 사냥 보상** (D10 ~ D15): `SummonManager.HuntRewardMul` 2.0 삭제 → `DifficultyRule.HUNT_MAT_MUL` · `HUNT_GEM_MUL` · `HUNT_MESO_MUL` · `HUNT_ELITE_MUL`(★1 2 · 2 · 2 · 2 / ★3 · ★5 1 · 0.5 · 1.5 · 1 · 새 키 12행 · 매치 밖 1). 보석 소수 개수는 확률 반올림 · 자이언트 꿈의 조각 ★3 · ★5 4 · 8 · 12 · 영혼석 1. 지역 재화 · 단풍 봉인석은 그대로.
- **레인 미니언 보상** (D16 ~ D19): 경험치 0 · 메소 = `MinionWave.Meso` 를 바닥에 동전 1개(막타 한 명 · 주인이 다른 맵이면 바로 지급 · `FarmReward.DropCoins`) · 시설(포탑 · 억제기 · 넥서스)이 잡으면 그 마을 주인(`AttackCredit.RewardUserIdOf` · `FarmReward.RewardOwner`) · 빅토리아 주화 10 → 1개(`SummonManager.MinionCoinCount` · 확률 그대로).
- **자이언트 빅토리아 주화** (D20): `EliteMonsterInfo.CoinDrop` 전 행 10(곱하지 않는 최종 개수 · 예전 2/4/6 × 10).
- **상대 수비대 처치 보상** (D21 · D22): 다른 마을 플레이어(투사체 포함)가 수비대를 잡으면 그 마을 지역 재화 2개(`DefenderUnit.RewardKiller` · `DropTableLogic.RegionItemOfVillage` · `DefenderService.KillRewardCount` · 튜토리얼 상대 제외).
- **문구** (D23 · D25): ★1 로비 설명 "경험치와 사냥 보상 2배 · … · 보스 HP와 공격 절반 (발록 공격 1/4)"(4토막) · 가이드 G12 · 튜토리얼 3-7b · 6-1b · 소개 창 재화 탭(메소 · 주화 · 꿈의 조각 · 영혼석 · 지역 재화 줄 · 웨이브 미니언 칩 줄에서 "경험치" 칩 끔) · 주석 · `TowerConfig` 노트 · 계약서(`DifficultyRuleKey` · 확정값 · `CoinDrop`).
- 🔴 디스코드(D24): `build-db.cjs` 가 지워진 `HuntRewardMul` 을 읽으므로 머지 직후 같이 고친다.

## 8단계 — 레인 · 파병 · 시설 (1.1-H 나머지)

- **시설 공격 시작 범위 = 공격 상자** (H16): `TurretAI` 가 원(위로도 사거리만큼) 대신 `FactionAttack.InAttackBox`(좌우 = 사거리 · 바닥에서 위로 4.0)로 표적을 고른다. FactionAttack 이 없는 포탑만 옛 원.
- **사거리** (H17 · H18 · H19): `TowerConfig` 포탑 · 억제기 `Range` 3.0/3.5/4.0 → **4.5/5.0/5.5** · 수비대 사거리 = 포탑 Lv1(4.5 · 목줄 3.6 · 탐지 6.5) · 코드 기본값도 4.5.
- **미니언 조건 공통 판정** (H09): `LaneFacility.HasEnemyMinionInRange` — 구역(가로 반폭 `RangeHalfW` · 바닥에서 위로 4.0) 안에 살아 있는 적팀 미니언(파병 · 좀비머쉬맘 포함 · 플레이어 제외)이 있는가 · 0.2초 캐시. 구역 = 포탑 사거리 / 억제기 SUPPRESSOR `Range` / 넥서스 CORE `Range` **4.5**(새 값).
- **시설 방어 보정** (H10): 플레이어 피해는 구역 안 적팀 미니언이 없으면 5%(`NoMinionDamageMul` · 옛 `PlayerDamageMulBeforePhase3`) · 있으면 100% — **페이즈 무관**.
- **시설 공격 보정** (H11): 구역 안 적팀 미니언이 없으면 시설 기본 피해 ×10(`LaneStateService.FacilityNoMinionAtkMul` → `FactionAttack.NoMinionMul`) · 시설의 대플레이어 배수(`PlayerDamageMul` 12) 삭제(×1) — 수비대는 12 유지.
- **3페이즈 전 방어막 그림** (H12 · 표시 전용): 사용자 RUID `bb9087a1…`(애니메이션)를 시설 자식 `FacilityShield`(`AuraCircle` 모델 재사용)로 덮는다 — 주인 있는 마을 · 살아 있는 시설 · PHASE3/EXPIRED 전. 크기 = 피격 상자 × 1.15 · 층 2(클라 보정). 피해 계산은 그림과 무관.
- **페리온 억제기 반사** (H15): 미니언 · 파병 유닛 = `REFLECT` 10 → **5** · 플레이어 = 새 키 `REFLECT_PLAYER` **1**(행 추가 · 미니언 조건으로 깎인 뒤의 실제 피해 기준).
- **억제기 오라 가로** (H20 ~ H22): `AuraWidthMul` 3 → 8 = 가로 **16.0**(커닝 · 엘리니아 · 노틸러스).
- **즉시 파병** (H04 · H05 · H06): 파병 창 푸터에 출발 방식 칸 2개("미니언과 함께" · "즉시" · 열 때마다 함께로) · 즉시 = 접수 10초 뒤(`DispatchService.ImmediateDelaySeconds`) 그 주문만 출발 · 취소 불가 · 이름 접두 `J`(배지 제외) · 동시 상한은 합산 · 매치 끝에 남은 타이머 무효화(`matchSerial`). 받는 쪽: 즉시 = 접수 순간 "상대 공격대가 지금 즉시 공격하러 오고 있어요!!" · 함께 = 섞이는 순간 "미니언 속에 상대 공격대가 함께 있어요!! 조심!!"(접수 순간 알림 없앰 · 배지 유지). 뷰 RULE 5번째 칸 · Q 6번째 칸 append.
- **발록 도전 알림** (H07 · H08): 도착 순간 도전자를 뺀 참가자 전원에게 "{마을} 마을의 주인이 발록에 도전하고 있어요!" · `BalrogRoomService.IsChallenging`(전광판 9단계가 읽음 · 통계 창 쪽 공급은 I11 로 불필요).
- **문구 · 문서**: 게임 소개 창 파병 담당관 설명 "1페이즈부터 · 미니언과 함께 또는 즉시" · 계약서(`TraitKey` `REFLECT_PLAYER` · 반사 · 오라 16.0 · `Range` 의미 · 파병 출발 방식) · GDD 시설 저항 문장 2곳. 튜토리얼 · 알림 카드 문구(K03 · K04)는 11단계.
- 🔴 디스코드: `build-db.cjs` 가 `PlayerDamageMulBeforePhase3` 를 읽으므로(L679/L682) 머지 직후 `NoMinionDamageMul` 로 같이 고친다.

## 9단계 — 캐릭터 창 · 몬스터 이름표 · 상태 전광판 · 안내 게이트 (1.1-G · I)

- **레벨업 자동 분배 방식** (1.1-G07 · G09): 밸런스형(주 3 · 부 2 = `JobInfo` 5직업 `ApRatio*` 0.7/0.3 → 0.6/0.4 · 전직 후 레벨업 부스탯 1 → 2) / 공격형(주스탯 5 · `StatService.AllocateByMode`). 레벨업 · "자동 분배" 버튼 · 전직 환급 재분배가 모두 고른 방식을 따른다. `RequestSetApMode`(계정 저장 · 토스트) · `BuildUiCsv` `;apmode=` · 캐릭터 창 `AutoAp` 줄에 칩 2개(`ModeBalance` · `ModeAttack`) · 토글을 끄면 칩 비활성.
- **전직 AP 초기화** (1.1-G10): 1차 전직 때 직접 찍은 AP 전부 + 시작 스탯 STR 12 → 4(+8) · DEX 5 → 4(+1) = **+9** 를 AP 로 돌려준다(`JobResetStr/Dex/Int/Luk = 4`).
- **스탯 칸 표시** (1.1-I01 · I02): STR · DEX · INT · LUK 칸이 `총(기본+AP + 나머지)` (예 `45(18+27)`). 직업별 10% 효율은 추가효과 계산에만 곱해 표시 총합은 줄지 않는다(코드 변경 없음 확인).
- **통계 분석관 삭제 → 플레이어 상태 전광판** (1.1-I11 · I13 · I14 · I15): `FunctionalNpcCatalog` `VD_RECORD_STATS` `Enabled=false`(행 · 모델 유지) + 신규 `VD_RECORD_BOARD`(`UiRoute=board` · 클릭 없음). 새 모델 `vd_record_board`(`Plate` + `Title` + `Row1~5` TextRenderer · 층 Default/2 · 3) · 새 `Npc/StatusBoard`(서버가 1초마다 참가자 전원의 닉네임 · 레벨 · 상태를 `Lines`(@Sync)에 씀 · 클라가 그림 · 내 줄 금색) · `NpcSpawner` 가 `board` 행에는 이름표 · `VillageNpcInteractor` 를 안 붙임. 상태 = 탈락 > 발록 도전 중(`BalrogRoomService.IsChallenging`) > 쓰러짐 > 지금 있는 맵(`WorldMapNodes`).
- **안내 게이트** (1.1-I16): `GuideService.IsGuideMatch` = ★1 매치만(★3 · ★5 는 목표 바 · 체크리스트 · 안내 토스트 · 알림 카드 · 코치마크 · 월드맵 목표 마커를 표시하지 않음).
- **문구** (1.1-G11 · I12 · G12): 도움말 4쪽 자동 분배 안내 · 마을 NPC 탭 기록 구역 카드(통계 분석관 → 상태 전광판) · `구현항목-결정.md` L27 갱신. 디스코드 글은 머지 뒤.
- I03: 새 `Monster/MonsterNameTag.mlua`(@Logic). 서버 `Attach(ent, 이름, 레벨)` = 엔진 `NameTagComponent` 를 런타임에 붙여 `Lv.N 이름`(끝의 영문 괄호 제거 · Bold · 기본 판 = NPC 와 같은 검은 반투명). 레벨 = `MonsterCatalog.LevelOfEntity`(0 이면 1). property `Enabled` `LevelPrefix "Lv."` `LogAttach true`.
- I04: 사냥터 `MonsterSpawner.SpawnSlot` — 레벨 = `FarmReward.SpawnLevel`(사냥터 레벨 덮어쓰기 반영). 튜토리얼 몬스터 `TutorialService.SpawnNear` 도 같은 호출(도감 레벨).
- I05: 자이언트 `EliteSpawner.SpawnElite` — 레벨 = `EliteMonsterInfo.Level`.
- I06: 보스 `BossSpawner.SpawnBoss`(발록 방 6개 포함) — `BossInfo.Name` / `Level`.
- I07 · I08: 미니언 · 파병 `MinionFlowService.SpawnMinion` — `spec.level`(웨이브 레벨 / 파병 = 수비대 식). 레인 맵 경계 이어 스폰도 레벨 유지.
- I09: 수비대 `DefenderService.SpawnOne` — `DefenderLevelOf`(원래 레벨 + 강화 1단계당 2). 재집결도 같은 레벨.
- I10: 죽으면 `Monster.Dead` 가 이름표를 끄고 `Respawn` 이 켠다.
- I18: 보스 스킬 소환수 `BossSkillRunner.FireSummon` 에도 이름표.
- I19: 나에게 적대하지 않는 몬스터(내 수비대 · 내가 보낸 파병 · 다른 마을로 가는 미니언)는 이름이 초록 #6BE36B, 나머지는 흰색. 각 클라가 0.5초마다 칠한다. `FactionLogic.RelationOfTeams` 신설(`GetRelation` 본문 이동 · 동작 그대로) · `LaneFacilityService.TeamSlot` ExecSpace 제거.
- **상태 전광판 칠판 그림** (1.1-I13 · 사용자 결정 2026-10-12): 판 그림을 임시 `plate_dark` 늘림에서 메이플 맵 오브젝트 칠판(`e0202d1d3248439bb37e47e47835ecd5` · 192×152 · 수상한 연구실 · 히든스트리트)으로 교체. 모델 `vd_record_board` 의 `Plate` = Simple 그리기 + 배율 1.4(틀 바깥 2.07×1.60 · 칠판 면 1.79×1.30), `Title`/`Row1~5` 자리를 칠판 면 안쪽으로 다시 맞춤(줄 간격 0.19 · 글자 1.0 · 제목 1.2) · `StatusBoard.RowMaxWidth` 1.75 → 1.6. 층은 그대로(판 Default/2 · 글자 Default/3 · 플레이어 Default/4). 같은 모양의 후보 `e6a5dd678c0c48e3b6f2bb3dc32c214c`(RUID 만 바꾸면 됨) · 지붕 달린 세움 칠판 `6aa2c44c90fa4ddcac827682ac766e1f`.

## 10단계 — 상점 (1.1-J01 ~ J06)

- J01: `ItemCatalog.BulkTiers "10,15,20,25,30"` · `BulkPartOrder "WEAPON,CLOTH,HAT,GLOVES,SHOES"` · `BulkJobs` · `BulkRecipes`. `CraftService` 한 건 처리를 `CraftOne` 으로 분리(단건 동작 그대로) + 새 RPC `RequestCraftBulk(tier, job, partsCsv)` — 재화가 모자라는 첫 건에서 멈춤, 산 것은 되돌리지 않음, 보유 장비도 또 삼, 방패 · 앱솔랩스 제외.
- J02: 제작 창 "일괄" 칸(`Slot_BULK`) + 일괄 판(`BulkPanel` = 부위 토글 5 · 10/15/20/25/30렙제 버튼 5). 부위 칩 폭 76→64.
- J03: 부위 토글은 클라에만 두고 새 매치마다 전부 켬(`OnboardingService.PushState` → `WorkshopUIController.OnMatchStart`).
- J04: 물약 수량 버튼 `+5` `+10` 추가(MaxCount 에서 비활성).
- J05: 물약 가격 −50%: 주황 75 · 하얀 125 · 마나 엘릭서 150 · 맑은 물 300 · 장어구이 325 (`ShopItem.PriceMeso`). `apply.py` 의 `"price"` 3곳도 같이.
- J06: 자동 습득(자석) 반경 3.0→4.5 · 속도 1.5→3.0 (`MesoCoin` · `ItemDrop`). 도적 메소 익스플로전은 자석에 먼저 빨려가 4.5~6.0 구간 동전만 터진다(원문 변경의 부수 효과).

## 11단계 — 튜토리얼: 장갑 · 시설 안내 · 방향 전환 (1.1-K01 · K02 · K03 · K05 · K06)

- 시설 공격 안내 — `TipController` `phase3` 카드를 "웨이브가 훨씬 자주 와요." 로 교체(1.1-K04 · 시설 피해가 페이즈와 무관해져 옛 "다른 마을 시설에도 피해가 100%" 가 거짓). (B1)
- 5단계 봉인석 교환 대상 앱솔랩스 모자 → 장갑(`ABSOLAB_GLOVES_WARRIOR`): 5-0e 금테 · 완료 조건 `RECIPE_ABSOLAB_GLOVES_WARRIOR` · 5-0f `ItemCount`
- 새 카드 5-0g2 "발록은 MISS 가 자주 나요"(5-0g 와 5-0h 사이): 발록 레벨 = `BossInfo` 8130100 `Level`(없으면 40 · 지금 40) · 장면 총수 120 → 121
- 6-1b 제목 "시설도 때릴 수 있어요" · "포탑, 억제기, 넥서스는 공격 가능해요. 하지만 시설 사거리 안에 적팀 미니언이 없으면 데미지가 매우 적게 들어가요"(옛 "직접 공격할 수 없어요" 삭제 · 수비대 처치 보상 괄호와 끝 문단 유지)
- 입력 문: 튜토리얼 중 `MoveLeft` · `MoveRight` 항상 허락 · 이동이 막힌 장면은 이동 잠금(`ApplyMoveLock` = 로컬 플레이어 `RigidbodyComponent.WalkSpeed` 0 · 10Hz 다시 누름 · 이동이 열린 장면 · 끝 · `OnEndPlay` 에서 되돌림)이 걷기를 막고 방향만 바뀜 · 로그 `[Tutorial] move lock on/off`
- **시설 공격 안내 문구** (사용자 결정 2026-10-12): "적팀 미니언" → "그 시설을 공격하는 미니언"(코드가 세는 것 = 그 시설을 공격하는 쪽 미니언 · 플레이어가 반대로 읽지 않게) — 튜토리얼 시설 안내 장면(6-1b) · 패치 원고(합본 · 1.0.2) · 유저 패치노트 데이터. 디스코드 글도 머지 뒤 같은 말로.

## 12단계 — 소리 · 버그 수정 (1.1-L01 ~ L07)

- 레벨업 효과음 볼륨 1.0 → 0.5 (1.1-L01 · `StatusHUDController.LevelUpSoundVolume`). (B1)
- 6-3b `noDim = true`(강조 막 4장이 구멍 밖 터치를 전부 막던 것 해제) + `side = "b"`(말풍선을 포탈 위로)
- [1.1-L02] 피해 직후 HP<=0 인데 IsDead 가 아니면 PlayerHit.EnsureDeath 가 DeathCheckDelay 0.2초 뒤 서버에서 ProcessDead(userId). Hp<=0 이면 넉백 생략. 로그 `[PlayerHit] hp<=0 after hit` · `hp<=0 but not dead after hit -> ProcessDead`.
- [1.1-L04] 텔레포트(SK_M13 · SK_M21) 시전자 클라가 키를 누른 프레임에 도착 이펙트 · 시전음 즉시 재생(SkillCaster.Cast → SkillMovement.PlayBlinkLocalFx · 표 blinkLocalFx = 서버 effectOverrides · castSounds 복사본). 로그 `[Skill] blink local fx`.
- [1.1-L05] effectOverrides.SK_M13/SK_M21.impact.localFirst=true — 서버 재생은 시전자를 뺀 같은 맵 유저에게만(PlayCastSoundExcept · PlaySkillSoundToMapExcept · PlayBlinkImpactToOthers → Client PlayBlinkImpactLocal). 닷지 SK_A22 불변. 로그 `[Skill] blink impact … other user(s)`.
- [1.1-L06] 페리온 반사 진단 로그: `[Facility] REFLECT skipped` · `[Facility] reflect landed|MISSED n=` · `[PlayerHit] reflect refused by immunity`. 값 변경 없음.
- [1.1-L07] 조건부 — PlayerHit.ReflectBypassImmunity(기본 false). L06 로그로 무적이 원인일 때만 true.
- **페리온 반사 무적 통과** (1.1-L07 · 사용자 결정 2026-10-12): Play 로그에서 무적 거절(`[PlayerHit] reflect refused by immunity`)이 확인되면 `PlayerHit.ReflectBypassImmunity` 를 켠다(확인 대기).

## 13단계 — 스킬 판정 ↔ 이펙트 일치 (1.0.3-M1)

- [M1-01] SkillAttack.LogShape(+LookSign · LogShapes 기본 false — 진단할 때만 켬): 판정 상자 네 변 · 시전자 · 후보 몬스터 좌표/몸 상자 로그(deal · scaled · find · snap).
- [M1-05] SkillExecutors.ResolveMeleeBox(앞/뒤/위/아래 · down 신규 키 기본 0) — ExecuteMeleeArc · ExecuteChargePunch 공용. 판정 값 불변.
- [M1-02] effectOverrides.SK_W11.box 세 변 명시(2.5 / 0 / 1.2 · 값 불변) · 명중 그림 impact/impact2 scale 읽기 · 잔상 trail.<모션>.scaleX/scaleY 손잡이. SkillInfo.csv SK_W11 #Note.
- [M1-03] effectOverrides.SK_W11_RB.hitScale 손잡이(없으면 1).
- [M1-04 · 06 · 07 · 08] 코드 변경 없음 — 클립 합집합 실측만 기록(방향은 사용자 결정). M1-06 은 L05 경로에 offsetY 연결.
- [M1-09 · 10] 제외 목록 · 새 이펙트 시안 절차 · 규격식을 SkillExecutors 주석에 고정(선택 전 ruid 변경 금지).
- [M1-11] 파워 스트라이크 접촉 명중 그림 · 명중음은 실제로 맞은 대상(PassHitCount>0)에만. 피스트인레인지 폭발은 DealSequenceHit 먼저 → 맞은 대상(HitInLastSequencePass)에만. 로그 `missed=` · `blasts=`.
- (사용자 결정 2026-10-12) [M1-02 · 04 · 05 · 06 · 07] "이펙트를 판정에 맞춤"(판정 값 불변): PlayStageEffect 가 scaleX/scaleY(가로세로 따로)를 읽고, 텔레포트 강화 도착 고리 경로(effectOverrides · SkillMovement.blinkLocalFx · PlayBlinkImpactToOthers/PlayBlinkImpactLocal)도 가로세로를 따로 받는다.
  값: 파워 스트라이크 시전 광선 1.303×1.002 · 앞으로 1.21 · 위로 0.38 / 잔상 6종 모션별(O3 2.5×2.0 · T2 1.736×1.364 정확 일치 · T1 · T3 어긋남 0.06~0.08) / 섬머솔트 킥 호 0.957×0.736 · −0.16 · −0.09 / 피스트인레인지 punchCast · punchCast0 0.399×0.313 · 앞 0.93 · 위 0.56 / 텔레포트 강화 도착 고리 1.27×0.977 · 위 0.38.
- 도발: effectOverrides.SK_W22.castFit(레벨 칸 · radius 확인용) + SkillExecutors.stageFit / LevelFitOf — 시전 이펙트 크기를 반경 3 / 3.5 / 4 / 4.5 / 5 에 맞춘다(scale 2.469 ~ 4.115 · 네 변 어긋남 ≤ 0.02 · 찌그러짐 없음).
- 가로세로 비 상한 1.3배(그 이상은 눈에 띄게 찌그러짐). 상한에 묶여 허용 0.10 을 넘은 파워 스트라이크 시전 광선(0.18) · 한손 잔상 O1(0.19) · O2(0.21) · 섬머솔트 킥 호(0.17) · 텔레포트 강화 고리(0.12)는 새 시안 요청 대상.
- 레이징 블로우 · 파워 스트라이크 명중 그림 · 피스트인레인지 폭발은 변경 없음.

## 14단계 — ESC · 관전 · 채팅 · 노틸러스호 복귀 포탈 (1.0.3 §3 · §4 · §5)

- **ESC 로 매칭 창이 사라지던 것** (M3-04 · M3-05): `UIEscStack` 키 목록 · `IsOpen` · `CloseWindow` 에서 `lobby` 삭제(방 화면 · 승강장 모달 모두 ESC 로 안 닫힘 — 모달은 X 버튼) + `LobbyUIController.Close()` 는 `mode == "room"` 이면 무시(로그 `[Lobby] Close ignored (room)`).
- **관전자 숨김** (M4-01): `SpectateService.ApplyHidden`(숨김 · 컨트롤러/피격 끔 · 중력 0 · 말풍선 비움) · `Reassert`(`Rebind` 때마다) · 서버 감시 `ReassertInterval` 1.0초(깨졌으면 경고 `hidden state broken` 후 다시 건다 — "의심 현상" 확정용 증거).
- **죽은 채 탈락** (M4-02): `PlayerRespawnService.CancelFor`(팝업 · 대기 · 이동 확인 정리) + `OnDeath`/`Choose`/`OnRevive` 관전자 가드 — 사망 페널티 면제 · 부활 이동 없음.
- **미니맵** (M4-03): `Visible == false` 인 유저는 빨간 점을 안 찍는다. **채팅** (M4-04 · M4-05 · M4-06): 관전 중 서버 `RequestSend` 차단 · 클라 입력 줄 숨김 · Enter 토스트 "관전 중에는 채팅할 수 없습니다" · 줄 안내 "관전 중에는 채팅할 수 없어요"(`SpectateToastText` · `SpectateHintText`) · 관전 종료 때 복구. **포탈** (M4-07): 관전 중 ↑ 포탈 이동 · `RequestEnterLith` · `RequestEnterBoss` 차단.
- **노틸러스호 복귀 포탈** (M3-01 ~ M3-03): 맵 `Portal_14`(아래 갑판) 켬 + `Portal_16`(위 갑판) 숨김 표식 · `PortalRoutes` `NS01` 같은 맵 노선(첫 `FromMap = ToMap`) · `TryMoveByUpArrow` 같은 맵 이동은 로딩 그림 없이 0.5초 재이동 잠금. 미니맵은 숨김 표식 포탈을 점으로 안 찍는다.
- 🔴 검증 대기: `a-unclaimed-elimination.md` L32 "마감 순간 죽어 있던 사람: 관전으로 들어가고, 부활해도 다시 보이지 않는다." 체크박스는 Play(2클라) 결과를 적는다.

## 15단계 — 발록 알림 확인 · 슬리피우드/발록 지역 월드맵 · 길안내 (1.0.3 §2)

- **발록 도전 알림** (M2-01): 8단계 `AlertChallenge` 가 이미 구현 — 1.0.3 은 코드 변경 없음(확인만). 가시성 보완(M2-02)은 Play 후 결정.
- **월드맵** (M2-03 · M2-04 · M2-05): 슬리피우드 마을 노드 켬 (36, 6) · 발록 지역(`Sleepywood_Boss_JrBalrog` · `금지된 제단(저주받은 신전)` · Boss) 작은 핑크 점 (84, 38) · 점은 지도 그림에 없어 게임이 그린다(마을 30 · 핑크 24 · hover 42/36) · `apply-worldmap.cjs` `DRAWN_BY_GAME` 갱신(+ 범례 가드 버그 수정).
- **길안내** (M2-06 · M2-10): `PortalNav` 발록 지역 허용 — 길 끝 ↑ 는 서버가 입장 판정, 도착하면 안내는 조용히 끝남 · 방 1~6 = `SameSpot`. **월드맵 안내** (M2-07): 방 2~6 에서도 내 위치 깃발 · 툴팁에 안내 2줄(`MapNotes`) · 긴 이름만 제목 BestFit.
- **★1 전용 안내** (M2-09 · I17): 가드 확인만 — `ShowGoalPins=false` 유지 · 게이트는 1.1-I16(`IsGuideMatch`) 한 곳 · `GuideStep.csv` G14 `#Note` 문장 갱신.

## 16단계 — 헤네시스 NPC 오른쪽 이동 (1.0.3 §6 · M5-01 ~ 03)

- `VillageNpcSector` HENESYS `AnchorX`: WORKSHOP −14.8 → −13.6 · LIFE −6 → −5.4 · RECORD −1.5 → −0.3 · DEFENSE 2 → 3.2 (구역별 이동량 +1.2 / +0.6 / +1.2 / +1.2 · 이유: 모바일 맨 왼쪽 가시성 · 상한: 넥서스 왼쪽 0.4(물약 상인 −10.0) · 조련사 −3.0 이 통로 포탈 상자 왼쪽 끝 −2.76 에서 0.24)
- 튜토리얼 강조 · 안내 위치는 NPC 엔티티 기준이라 코드 변경 없음. `near:` 도착만 `3-2m`(도감 관리인) `:-1.4` → `:-1.0`. 제작 장인 앞 도착이 땅 밖(−16.2)이던 것이 −15.0 으로 땅 안에 들어옴

## 17단계 — 더블 점프 위 힘 · 윗방향 점프 (1.0.3-M6)

- 도움말 조작키 탭 점프 줄에 "↑ 누른 채 = 위로" (1.0.3-M6-05 · 06). (B1)
- [M6-01] DoubleJumpLift 1.4 유지(임시) · 로그에 시전 직전 vy.
- [M6-02] SkillMovement.IsUpHeld — PC ↑ 키 / 모바일 MoveVelocity.y >= UpJumpStickThreshold 0.3.
- [M6-03] TryDoubleJump UP/NORMAL 분기(SetForce 한 번) · UpJumpLift 1.4 · UpJumpForwardMul 0 = 자리표시값(M6-01 과 같은 Play 에서 확정).
- [M6-04] SkillHotbar.TryAirDoubleJump 줄·사다리 가드(일반 더블 점프 포함) · RequestDoubleJump(dirX, up) · 로그 kind= / up=.
- [M6-05] SkillInfo.csv SK_N02 Description 에 "↑ 를 누른 채 점프 키를 누르면 위로 뛴다." (첫 문장 뒤).
- (사용자 결정 2026-10-12) [M6-05] SkillInfo.csv SK_N02 Description 첫 문장 "바라보는 쪽으로" → "누른 방향(없으면 바라보는 쪽)으로"(코드 동작과 맞춤).

## 18단계 — 스탯창(C) · 아이템창(V) 단축키 · 우측 상단 버튼 (1.0.3-M7)

- **공용 열기** (M7-01 · M7-02): `StatUIController.ToggleTab(0|1)` — 그 탭이 보이면 닫고 · 다른 탭이면 전환 · 닫혔으면 열고 그 탭으로. **C = 스탯 탭 · V = 장비 · 인벤토리 탭**(마지막 탭 유지는 사라짐). `Toggle()` 은 스탯 탭 위임(상태창 위 투명 버튼).
- **우측 상단 아이템 버튼** (M7-03 · M7-04): `StatusHUD` `Shortcuts/BtnItem`(V · ico_bag · "아이템" · 가운데 −114 빈 슬롯) · `StatusHUDController` 가 캐릭터 버튼 = `ToggleTab(0)` · 아이템 버튼 = `ToggleTab(1)`. 생성 스크립트 `Docs/tools/design-ui/add-item-shortcut.cjs`(신규 · 다시 돌려도 같음).
- **도움말 · 안내 문구** (M7-05 · M7-06): 8쪽 키보드 V 칸 초록 + "아이템" · 조작키 탭 '창 열기' 5줄(`캐릭터(스탯)` · `아이템(장비 · 인벤토리)`) · 알림 카드 `potion` · `weapon` 의 C → V.
- 호환 점검 (M7-07): 튜토리얼 중 V 무시 · ESC 한 번에 닫힘 · 채팅 입력 중 V 무시. 변경 없음.

## 19단계 — 튜토리얼 전투 구간 이동 · 스킬 (1.0.3 §10 · M8-01 ~ 07)

- 2-4 · 3-7 · 5-0b `allow = fight`(이동 · 기본 공격 · 스킬) · 시작점에서 `leash` 범위(2-4 · 3-7 가로 8.0 세로 2.5 / 5-0b 가로 12.0 세로 2.5 · 보스 처치 뒤 감시 끔)를 넘으면 서버 `back` 액션이 시작점으로 되돌리고 토스트
- 스킬: 새 act 2-4k(`skill:SK_W11,SK_W21,SK_W22:1`) → `PlayerSkillState.GrantSkillLevel`(SP 없이 Lv1 · 직업 줄 불일치 거절 · 튜토리얼 끝나면 `ResetMatchState` 가 비움). W · E 는 2차 전직 요건이라 5-0b 에서 열림
- `SkillCaster.Cast` 맨 앞이 `_TutorialDirector:CastAllowed()` 를 묻는다(장면 `allow.cast` · 전투 3장면만 true) — 카드 · NPC 창 · 6-3c 발록 방에서는 시전 거절. 장면 총수 121 → 122
- 안내 문장 한 줄 추가(2-4 · 3-7 · 5-0b) · 진행 조건(done) 3종 유지
