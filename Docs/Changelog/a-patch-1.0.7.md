# a/patch-1.0.7 — 1.0.7 디테일 밸런스 수정

main(d075cbf) 위 브랜치(Draft #208). 기획 = 허브 `패치내용/1.0.7.md`(1 ~ 11절) · 구현 지도 = `패치내용/명세/1.0.7/구현준비.md`. 구현 = Sonnet 에이전트 7개(사용자 허락 2026-10-14 · 보고서 허브 `handoff/patch107-agents/A · B · C · D1 · D2 · E · F.md`) + 총괄 통합. CSV 헤더 추가(맨 뒤) = `ItemInfo.IgnoreDefense` · `JobInfo.PowerMul` · `TowerConfig.FacilityLevel` · `MinionWave.ZombieDefense` · 새 표 `CloneMonsterArt` · `NexusCloneSkill`(스키마-계약 A-2-30 · A-2-31) · `AccountProfile` SchemaVersion 8 · `MatchOutcome += LAST_ONE`.

## 1. 발록 졸개 (§1)

- `BossSkills` 발록 S4 = HP 30% 이하 · 아이언호그 5마리(`ProjectileModelId` = 새 보스 모델 `monster4230103boss`). 소환 아이언호그는 Lv30 · 최대 HP 300,000 고정(레벨 · ★ 배율 안 곱함) · 보스 판정(`BossSkillRunner` · 회피 20% · 판정 레벨 30 · 도발 끌어오기 제외) · 자기 HP 50% 이하에서 아이언보어 `4230400` 3마리를 한 번 소환(호그마다 · 최대 15). 아이언보어는 일반 몬스터 그대로 Lv35(HP 230,000 · 공격 519). 호그 · 보어 모두 경험치 · 재료 없음. 규칙 = `BossSkillRunner.SummonRule`(코드 상수) · 도감 `MonsterInfo` 공용 값은 그대로.

## 2. 보스 · 좀비머쉬맘 방어 (§2)

- `BossInfo` Defense: 머쉬맘 · 킹슬라임 · 스텀피 · 에피네아 · 피아누스 120 · 주니어 발록 200(마노 20 · 테스트 좀비머쉬맘 행 그대로).
- 좀비머쉬맘: `MinionWave` 새 열 `ZombieDefense`(P3 웨이브마다 25분 10 → 44분 95.5 직선 · LIVE 분 기준이라 TEST 도 같은 값). 스폰 때 `Monster.Defense` 로 굳고 맵 경계 이어 스폰(`MinionUnit.Defense`)에서도 유지.

## 3. 도발 (§3)

- 방어력 저하를 고정 수치에서 %로(Lv1 ~ 5 = 0 / 5 / 10 / 15 / 20% · 적용 방어 = 방어 × (100 − %) ÷ 100) · 보스 절반 폐지 · 방어 0 몬스터는 추격 효과만. `SkillExecutors.TauntBossDefenseMul` 삭제 · `GetTauntDefenseDelta` → `GetTauntPct` · 스킬창 툴팁 "(보스 절반)" 삭제.

## 4. 모자 방어율 무시 · 장갑 공격력 (§4 · §5)

- `ItemInfo.IgnoreDefense`(모자 20렙제 10 · 25렙제 20 · 30렙제 30 · 앱솔 40) → `ItemCatalog.stats.ignoredef` → `StatService` `final.ignoredef`. 새 `DamageFormula.EffectiveDefense`(도발 % 먼저 → 무시 %p 가 방어보다 크면 0, 아니면 곱) 를 기본 공격 · `SkillAttack.DefendedAmount` · `SkillProjectile` 2곳이 같이 쓴다. 인벤토리 · 공방 툴팁에 "방어율 무시" 줄.
- 장갑 T1 ~ T6 공격력 1 / 3 / 7 / 13 / 21 / 30(마법사 장갑은 `BaseMagic`).

## 5. 스탯창 · 전투력 · 발록 입구 전광판 (§6 · §7)

- 전투력 `CalcCombatPower` = 기본 × 치명 × 명중 배율(1 + 적중률 · 1 ~ 2) × 방무 × 직업 계수(`JobInfo.PowerMul`) · 소수 버림. `BuildUiCsv` 키 `critdmg` · `ignoredef` · `power` · `balrogacc`.
- 스탯창 마지막 3줄 좌우 두 칸(명중률 | 크리티컬 · 회피율 | 크리티컬 데미지 · 전투력 | 방어율 무시).
- 슬리피우드 마을 발록 입구 포탈 위 전광판(`VD_BALROG_GATE_BOARD` · 클라 `Boss/BalrogGateBoard`): 내 발록 기준 명중률 · 방어율 무시를 최소 / 권장 기준과 견줘 색으로 보여 주고 장비 착탈 때 바로 바뀐다.

## 6. 혼자 남으면 승리 (§8)

- `MatchSessionLogic.CheckAllOut`: 참가 2명 이상 판에서 살아 있는 사람이 1명이면 `DeclareLastStanding`(결과창 승리 · "끝까지 살아남아 승리했습니다" · 기록 `o = LAST_ONE`). 1인 판 · 튜토리얼 동작은 그대로.

## 7. 시설 레벨 · 넥서스 강화 (§10)

- `TowerConfig.FacilityLevel`(포탑 15/20/25 · 억제기 20/25/30 · 넥서스 25/30/35) · `LaneStateService.FacilityLevelAt` · `FacilityLevelOf` · 플레이어가 시설을 칠 때 명중 판정 레벨 = 시설 레벨(`StatService.ResolveTarget`).
- 넥서스 강화 3단계: `CORE` Level 2 · 3 행(HP 150,000 → 225,000 → 337,500 · 비용 20 · 40). 방어 창 넥서스 카드 강화 버튼 · MAX · 수리 버튼 y −99.
- 강화 단계 표기 "Lv n" → "n단계"(방어 창 · 방어선 노드 · 토스트 · 튜토리얼 3-6b 판정 · 3-6c 제목 · 마을 특징 창 푸터). 카드에 시설 레벨 "Lv15 · …".
- 도움말 7쪽 넥서스 분신 문단 · 빅토리아 주화 '쓰는 곳'에 넥서스 강화.

## 8. 넥서스 분신 (§10)

- 새 `Lane/NexusCloneService`: 넥서스 HP 가 50% 를 위에서 아래로 넘는 순간 그 마을 전직관 분신 1마리(레벨 = 넥서스 레벨 · HP = `MinionWave` P3-ZOMBIE Hp × 5 × 레벨 HP 배율 · 공격 = Attack × 2 · 방어 = 레벨)를 `DefenderService.SpawnClone` 으로 소환. 등장 소환진 · 서서히 나타남 · 주인 토스트 · 이름표.
- `DefenderService`: 분신 · 소환체 직접 지정 스폰(`ov`) · 재집결 때 상태 유지 · 파병 차출 · 모집 상한 제외.
- 분신 5종(헬레나 9001002 · 하인즈 9001001 · 주먹펴고 9001000 · 다크로드 9001003 · 카이린 9001004) + 소환체 2종(타우로마시스 7130100 · 카이린의 분신의 분신 9001008) 모델 · `MonsterInfo` 7행. 낱장 프레임 2종은 `CloneMonsterArt`(그룹 리소스 프레임 교체 재생).
- 기술 가방(`CloneSkillBrain` · `NexusCloneSkill.csv`): 원작 공격 · 버프 · 방해 · 소환을 매 바퀴 섞은 순서로 하나씩(사용자 2026-10-14). 플레이어 상태이상 `CloneStatusService`(슬로우 · 약화 · 봉인 = `SkillCaster.RequestCast` 거절 · 암흑 = `StatService` 명중 −20%p).

## 9. UI · 소리 (§11)

- 도움말 6쪽 마을 문장: 마우스 올림 열기 → 클릭 열기 · 순서 헤네시스 · 엘리니아 · 커닝시티 · 페리온 · 노틸러스 · 올리면 금빛 점등. 8쪽 [게임 시작하기] 폭 240 → 200(겹침 해소).
- 새 `@Logic Match/ButtonHoverSound`: 모든 UI 버튼 마우스 올림 소리 `7eda004d…`(클라 전용 · 볼륨 0.7). 월드맵 지역 노드 올림 소리도 같은 소리로.
- 픽파켓 소리: 맵 전체 → 시전자 본인만 · 스킬창(K) 픽파켓 줄 "소리 ON / OFF"(계정 저장 · `AccountProfile` v8 `account_pickSoundOff`).

## 10. 밸런스 추가 (§12)

- 수비대 모집 재료(`MAT_*`) 드롭 확률 ★1 · ★3 · ★5 ×2: `DifficultyRule` 새 키 `HUNT_MAT_CHANCE_MUL`(행 추가) → `DropTableLogic.RollRows` 가 확률에 곱한다(1 상한 · 매치 밖 1). ★1 은 기존 수량 `HUNT_MAT_MUL` 2 가 위에 곱해져 기대값 4배.
- 쉐도우 파트너(`SK_T22`) 쿨타임 120 → 90(Lv 당 −15 그대로 · Lv1 ~ 5 = 90 ~ 30초).
