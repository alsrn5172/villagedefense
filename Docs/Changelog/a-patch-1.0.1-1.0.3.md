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
