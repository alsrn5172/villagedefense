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
- 슬리피우드 마을 발록 입구 포탈 위 전광판(`VD_BALROG_GATE_BOARD` · 클라 `Boss/BalrogGateBoard`): 내 발록 기준 명중률 · 방어율 무시를 최소 / 권장 기준과 견줘 색으로 보여 주고 장비 착탈 때 바로 바뀐다. 항목마다 두 줄: 최소 이상이면 `내 값 / 권장`(권장 이상 초록 · 최소만 하양) + 취소선 `내 값 / 최소` · 최소 미만이면 `내 값 / 최소` · `내 값 / 권장` 두 줄 다 빨강. 두 줄 칸 높이는 스크립트가 맞춘다(Row1Y · Row2Y).

## 6. 혼자 남으면 승리 (§8)

- `MatchSessionLogic.CheckAllOut`: 참가 2명 이상 판에서 살아 있는 사람이 1명이면 `DeclareLastStanding`(결과창 승리 · "끝까지 살아남아 승리했습니다" · 기록 `o = LAST_ONE`). 1인 판 · 튜토리얼 동작은 그대로.

## 7. 시설 레벨 · 넥서스 강화 (§10)

- `TowerConfig.FacilityLevel` · `LaneStateService.FacilityLevelAt` · `FacilityLevelOf` · 플레이어가 시설을 칠 때 명중 판정 레벨 = 시설 레벨(`StatService.ResolveTarget`). (처음 3단계 15 ~ 35 → 아래 10단계 개편에서 **세 시설 모두 17 ~ 35 · 단계당 +2** · `FacilityDefaultLevel` 안전망.)
- 넥서스 강화: 처음 3단계 → **10단계 개편**(사용자 2026-10-14): 포탑 · 억제기 · 넥서스 모두 `TowerConfig` Level 1 ~ 10 행(총 비용 포탑 · 넥서스 60 · 억제기 90 · 10단계 UpgradeCost 0). 공격력 = 그 시기 웨이브 좀비버섯 미니언 HP 의 약 10%(커닝시티 50%). 강화해도 HP 를 채우지 않고 **비율 유지**(수리만 가득) · `FacilityNoMinionAtkMul` 10 → 1. 연출 · 성장 점수는 그림 단계(1 ~ 3단계 → 1 · 4 ~ 7 → 2 · 8 ~ 10 → 3 · `FacilityArtGrade`)로. 마을 특성 Lv1 ~ 3 칸은 10단계로 직선 보간(소수 첫째 자리 반올림 · 비율 특성 0.001). 방어 창 넥서스 카드 강화 버튼 · MAX · 수리 버튼 y −99.
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

## 11. 사용자 추가 지시 (2026-10-14 · §10 개편 · §11 · §12 · 미뤄 둔 질문 답)

- 넥서스 분신 투사체(`Lane/CloneBall` · `CloneFrameFx` · `CloneSkillBrain.FireBalls/LandBall`): 헬레나 화살 · 다크로드 표창이 표적까지 날아가 도착 때 피해 · 적중 낱장 그림. `NexusCloneSkill` 열 10개 추가(스키마 A-2-31 · 정합성 CANONICAL). 방해 스킬(봉인 · 암흑 · 약화) 행 `Enabled = false`.
- 넥서스 분신 사망 소리: 원작 분신 공통 Die 를 그룹 리소스로(`60946855…` · ×2.04) → `MonsterInfo` 9001000 ~ 9001004. 피격음은 원작 무음이라 비움.
- 시설 방어막 그림: 페이즈 무관 · 사거리 안 적 미니언이 없을 때만(`LaneFacilityService` 주기 재판정).
- 궁 끝 숫자: 타수대로 · 5타 묶음(`UltimateHitGroup` 5 · 묶음 안 치명 하나면 치명 숫자) · 모든 타 치명 판정. 궁 시전 중 시전자 숨김(`SkillExecutors.HideCasterFor`).
- 도발: 지속시간 동안 머리 위 도발 표시(`PlayTauntMark`). 레이징 블로우 판정 아래 0.6. 하향 점프 강제(`SkillMovement.ForceDownDrop`).
- 아이언 바디 반사 ×10(`SK_W12` 5 → 50) · 불굴의 진 반사 배율 ×100 → ×3(`UnyieldingReflectMul`).
- 도적 어벤저(쉐도우 파트너 중 럭키 세븐 대체 · 앞쪽 2마리 · 럭키 세븐보다 20% 빠름 · 공격 속도 +20% 버프 제거 · 소리 `28d565bf…`).
- 좀비머쉬맘 늘 MISS 수정(`StatService.ResolveTarget`: 꺼진 `BossSkillRunner` 는 보스로 안 봄).
- 레벨 · 지역이 바뀐 사냥터 몬스터 메소 = 레벨 단계 값(`MonsterCatalog.LevelBaseMeso` → `FarmReward.MesoMin/MaxOverride`).
- 주니어 발록 ★1 공격 0.25 → 0.5(`DifficultyRule BALROG_ATK_MUL` · 설명 문구 삭제). 발록 도전이 끝나면 방에 남은 졸개 정리(`BalrogRoomService.ClearRoomSummons`).
- 발록 입구 전광판: 항목마다 두 줄(최소 이상 = `내 값 / 권장` + 취소선 `내 값 / 최소` · 최소 미만 = 두 줄 빨강) · 칸 높이를 스크립트가 맞춤.
- 보스급 머리 위 체력바(`Monster/BossHpBar` · `BossHpBarService`: 엘리트 · 좀비머쉬맘 · 지역 보스 · 마노 · 주니어 발록).
- 몬스터 렌더 층 고정 Default/3(밟은 발판 층을 안 따라감 · 골렘의 사원 문 끼임).
- 장비 판매(`Item/EquipSellService` · `EquipSellUIController` · 상점 창 좌 구매 · 우 인벤토리). 공방 물약 수량 −5 · −10.
- 페리온 마을: 미니언 나오는 자리 `SpawnX` 15.9 · 넥서스 · 수비대 `TowerSlotX` 6.0 · `EndTriggerX` 5.4 · 레인 포탈 `P_Lane_To_Perion_Hunt_WildBoarLand` x 16.40 → 15.90.
- 엘리니아 마을: 미니언 출발을 위층 다리 → 맨 아래층 레인 포탈 자리로(`LaneConfig` ELLINIA VILLAGE PathMinX −4.0 → −5.1 · PathY 6.8 → 0.88 · SpawnX −3.4 → −3.77 · SpawnY 6.8 → 0.88 · EndTriggerX 4.1 → 0.1). 칠판 `VillageNpcSector` BOARD `AnchorY` −0.91 → 1.47(오른쪽 발판 표면에 붙어 발판 그림에 안 가림).
- 도움말(`GameIntroGroup`): 빅토리아 주화 '쓰는 곳' 줄 = 새 강화 비용(포탑 · 넥서스 4 ~ 9 / 억제기 6 ~ 14) · 7쪽 넥서스 분신 문단 "~해요" 체. 마을 특징 창(`TutorialGroup` Foot) 푸터 `시설 1단계 · 중간 · 10단계 값이에요.`(`apply-tutorial-info.cjs` 도).
- 스탯창(`CharacterGroup`): 이동속도 줄을 점프력 줄 위로(Row6 · Row7 위치만 맞바꿈). 줄 이름 "명중률" → "추가 명중률"(Row8/Chip · 사용자 2026-10-14: 명중 확률 = 기본 100% + 이 값이라 0% · 20% 로 보이면 오해).
- 스탯창 오른쪽 배치(사용자 2026-10-14): 맨 위(기본 능력치 위)에 전투력 큰 한 줄(새 `Right/Power` · 높이 58 · 금색 30) · 기본 능력치 묶음 −62 · 전투 능력치 10칸을 좌우 2칸 5줄로(공격력|방어력 · 이동속도|점프력 · 추가 명중률|크리티컬 · 회피율|크리티컬 데미지 · 추가 공격속도|방어율 무시) · 전투력이 있던 칸 = **추가 공격속도**(`StatService.BuildUiCsv` `atkspd=` = (공격속도 배율 − 1) % · 지금 0%). 값 칸 엔티티는 그대로 옮겨 바인딩 유지 · `StatUIController.cellPower` 새 UUID · `cellAtkSpeed` 추가. 스크립트 `handoff/patch107-agents/_work/U/apply-stat-layout.cjs`.
- 스탯창 전투력 줄 아이콘(`Right/Power/Icon`) = 단풍 엠블럼 RUID `97009709507d447e99b65a51b0281e9f`(그룹 mIYbC · 128×128 · 공격력 쌍칼과 구분) · Row4/Chip "공격력" → "스탯 공격력"(사용자 2026-10-14). 스크립트 `handoff/patch107-agents/_work/U/apply-power-emblem.cjs`.
- 스탯창 전투 능력치 오른쪽 칸 아이콘(사용자 2026-10-14): 두 칸 모두 [아이콘 24][8][이름 114][4][값 78] · 왼쪽 −229 ~ −1 · 오른쪽 7 ~ 235. Row5 · Row7 아이콘(방어력 · 점프력) 오른쪽으로 옮겨 다시 켬 · Row8/9/10 에 `Icon2` 새로(크리티컬 · 크리티컬 데미지 · 방어율 무시 · 그림 받기 전까지 꺼 둠) · 이름 칸 BestFit 10 ~ 16. 스크립트 `handoff/patch107-agents/_work/U/apply-stat-icons.cjs`(ICONS 에 RUID 넣고 다시 돌리면 켜짐).
- 스탯창 전투 능력치 아이콘 4개(사용자 그림 2×2 → 칸마다 테두리 기준 128 · 그룹 mIYbC): 크리티컬 `8baca115…` · 크리티컬 데미지 `fdeafaa2…` · 방어율 무시 `6bbd73d1…` · 추가 공격속도 `d63ad6f6…`(쌍칼 대신). 이름 · 값 박스(사용자 2026-10-14): [아이콘 24][4][이름 108][4][값 84] · 높이 26 · 이름 바탕 연파랑(0.42,0.62,0.94,0.42) 글자 14 · 값 바탕 진파랑(0.02,0.06,0.2,0.82) 글자 18 · 가운데 정렬 · Row 줄무늬 끔.
- 이름 · 값 박스 그림 교체(사용자 2026-10-14): 공용 f5e5fbd6(9-slice)는 26 높이에서 모서리가 각져 보여 새 그림 2개(그룹 mIYbC · 반경 4 · Type Simple 로 칸 비율 그대로) — 이름 `8755ec63…`(흰 윤곽 1.5 · 속 알파 14/255 · 틴트 0.3,0.45,0.75,0.35 · 사용자 "있는 듯 없는 듯") · 값 `9b8faf9c…`(흰 채움 · 틴트 진파랑). 그림 생성 `handoff/patch107-agents/_work/U/make-stat-boxes.py`.
- 계정 기록 창(`AccountRecordGroup`) 결과 칩 `ChipLastOne`(혼자 남아 승리 · 금빛 · 폭 120) · `AccountRecordUIController.FillHistCell`.
- 공방 창(`VillageWorkshopGroup`) 장비 판매 칸 `Window/SellPane` 적용.

## 12. Play 검증(V2) 뒤 수정 (2026-10-14)

- 빌드 오류 LEA-1118 2건: `Lane/CloneSkillBrain` 의 `---@type CloneFrameFx` · `---@type CloneBall` 주석 삭제(새 스크립트 타입을 빌드가 못 찾음 · 동작 무관).
- 궁 끝 숫자 5타 묶음: `SkillExecutors.GroupUltimateHits`(속성만 있고 안 쓰이던 `UltimateHitGroup` 5) — 대상마다 5타씩 합계 · 묶음 안 치명 하나면 치명 숫자 · `[UltHits] … (raw N · group 5)` 로그.
- 어벤저(사용자 2026-10-14): 큰 표창 출발 높이 럭키 세븐 +0.26 · 피해 숫자 맞은 적마다 2개(`DisplayHits = hitCount` · 분신도) · 수명 = 럭키 세븐과 같음(사거리 끝 수명 줄이기 삭제) · 쉐도우 파트너 분신의 치명 = 원본이 그 대상에게 낸 치명(`SkillProjectile.NoteCrit` · `CloneShared.crits` · 따로 굴리지 않음 — 럭키 세븐 분신도).
- 보스 체력바: 피격 상자가 엔진 기본(0.67 × 1.42)인 보스는 stand 첫 장 그림 크기 · 피벗으로 폭 · 높이를 잰다(`BossHpBar.FitFromSprite`).
- 어벤저 관통(V3 재검증에서 발견): 첫 대상이 0.8 안에 붙어 있으면 유도로 가파르게 꺾인 기울기 그대로 날아 바닥 아래로 빠져 둘째를 놓쳤다(0.49 앞 24%) → 첫 대상을 지나 유도를 끊을 때 수평으로 되돌린다(`SkillProjectile.NotePierceTouch` · V4: 0.49 앞 93.5% · 0.70 앞 98% · 0.95 앞 100%). 남은 몇 %(프레임이 튀어 첫 대상을 지나치면 유도가 뒤를 향함)는 좌우를 쏜 방향(`launchSx` · `SetDirection` 이 기억)으로 고정.

## 13. 마무리 — 점프 · 포탈 착지 · 미니맵 · 사용자 맵 편집 (2026-10-14)

- 아래 점프 되돌림 + 발판 무시 구간(사용자 "원래대로 제자리 살짝 점프 → 아래로 · 0.05초 뒤 0.2초간 발판 무시"): 누르자마자 발판 아래로 옮기던 강제 하향 점프(엎드린 자세로 쑥 내려감)를 빼고 엔진 아래 점프 그대로. `SkillMovement.StartDownJumpIgnore` = 누른 순간(모바일은 엔진 DownJump 이벤트) + `DownJumpIgnoreDelay` 0.05 부터 `DownJumpGuardSeconds` 0.2 동안 `TickDownJumpGuard` 가 닿은 발판을 무시(출발 발판이면 엔진 DownJump 재시도 → 거절 시 `ForceDownDrop` · 다른 발판이면 `ForceDownDrop`). `DownJumpAssistDelay` · 엔진 이벤트 뒤 강제 낙하 타이머 삭제.
- 더블 점프(사용자 "위력이 너무 셈 · 앞/위 횟수 따로"): `DoubleJumpLift` 4.5 → 3.6 · `DoubleJumpForceScale` 2.0 → 1.8 · `TryDoubleJump(skillId, level, allowNormal, allowUp)` · `SkillHotbar.airUpJumpUsed` 추가(옆 = `airTeleportUsed` · 위 = `airUpJumpUsed` · 땅에 닿으면 둘 다 초기화).
- 포탈 높이: 모든 맵 포탈 Transform y = 바로 밑 수평 발판 y(106개 · 40개 맵 · 포탈 y 숫자만 교체 · 맵마다 파싱 비교 검증 · 스크립트 `handoff/patch107-agents/_work/P/align-portals.cjs` · `apply-portal-y.cjs`). 안 고침: 커닝 마을 `Portal_9`(꺼짐 · −2.54) · 여섯갈래길 `portal-1~12`(밑 발판 없음).
- 포탈 도착 착지: `PortalNetwork.UpdateArrivalSnap` — ↑키 이동은 목적 포탈 높이, 엔진 포탈 · 서버 이동은 새 맵 첫 프레임 위치 기준 ±`ArrivalSnapBand` 0.2 안 가장 가까운 수평 발판으로 한 번 옮김(`_SkillMovement:ProbeBand` = 텔레포트 착지 0단계와 같은 함수 · 3초 안).
- 미니맵: 펼친 판을 겉(내용 칸이 뚫린 그림 `49a3eca5…` · 농도 0.95)과 속(`Minimap/BgInner` · `35bc0442…` · 색 0.7 · 농도 0.75 · 클릭 안 받음)으로 나눔 · 접힌 판을 펼침 머리 칸 색에 맞춰 밝힌 그림 `528f989c…` · `MinimapController.BgOpenRuid` / `BgFoldedRuid` / `bgInner`(접으면 끔). 그림 생성 `handoff/patch107-agents/_work/U/make-minimap-split.py` · `make-minimap-closed-bright.py`.
- 사용자 Maker 편집 합침: 맵 6개(페리온 마을 · 페리온 북쪽 능선 · 엘리니아 마을 · 노틸러스 호 내부 · 헤네시스 마을 · 오르비스 빅토리아 정거장 — 포탈 · 레인 바닥 · 발판 · 클릭 표시 등) · `VillageNpcSector.csv`(페리온 · 노틸러스 NPC 구역 · 엘리니아 전광판 자리).
