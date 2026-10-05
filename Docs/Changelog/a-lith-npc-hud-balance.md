# a/lith-npc-hud-balance — 리스항구 NPC(택시 · 전직관 전구) · HUD 버튼 정리 · 밸런스 (WO-046)

> 사용자 2026-10-05 요청 묶음(한 브랜치로 하기로 함): ① 리스항구 Dimensional Mirror → 5마을 넥서스 택시(전직 후에만) ② 전직 가능 레벨이면 전직관 머리 위 표시(원작 퀘스트 전구 · 후보 K5) ③ 오른쪽 위 친구 · 메뉴 버튼 삭제 ④ 달팽이 몸통 박치기가 135 → 3 쯤 · 플레이어 기본 HP 400 · 이동 속도 절반.

## 2026-10-05

### 밸런스 — 몬스터 접촉 피해
- 원인: `MonsterInfo.Attack` 이 "같은 레벨 플레이어 HP 의 15%"(B4 · WO-027 §3) 공식이라 Lv1 달팽이가 150(방어 감산 뒤 약 135).
- 새 값 = **원작 공격력 곡선 × 1.5**. 곡선은 maplestory.io(KMS 389) 의 원작 레벨 → 물리 공격력(같은 레벨 중앙값 · 단조 증가)이고, **우리 레벨**로 읽는다(아이언호그처럼 우리 레벨이 원작과 다른 몹이 원작 공격력을 그대로 들고 오지 않게).
  - 예: 달팽이 · 파란 달팽이 3 · 스포아 9 · 빨간 달팽이 16 · 초록버섯 · 돼지 58 · Lv17 114 · Lv24 162 · Lv30 243 · Lv60 519.
  - 보스 행(`BossInfo` 에 있는 피아누스 · 좀비머쉬맘)은 그대로.
- `EliteMonsterInfo.AttackPower` = 새 기본값 × 4(기존 배율 유지).
- 값만 바꿨다(헤더 · 열 변경 없음).

### 밸런스 — 플레이어 HP · 이동 속도
- 플레이어 기본 HP: `Global/DefaultPlayer` 모델의 `PlayerComponent.MaxHp`(와 노출 속성 `maxHp`)가 **200000**(9/03 보스 수정 때 들어간 값)이었다 → **400**. 레벨당 +50(LevelTable)은 그대로 → Lv10 850 · Lv30 1850. (`SummonManager.BaseMaxHp` 1000 은 어디서도 안 쓰는 속성이다.)
- 이동 속도: `StatService` 가 걷기 속도 · InputSpeed · 점프력의 기준값을 **엔티티의 현재 값**에서 다시 읽어, 이전 판의 이속 보너스가 기준에 눌러앉아 판마다 불어났다 → 고정 속성 `BaseWalkSpeed` · `BaseInputSpeed`(2) · `BaseJumpForce`(0.9). 걷기 기준은 사용자 요청대로 **절반**(엔진 기본 1.4 → 0.7). 모델의 `RigidbodyComponent.WalkSpeed` 도 0.7.

### 밸런스 — 처치 경험치 1.5배 (사용자 2026-10-05 "경험치 올리기 빡세다 · 모든 몬스터 1.5배")
- `SummonManager.KillExpMul = 1.5`(새 속성) · `Farm/FarmReward` 가 난이도 배율(`MATCH_EXP_MUL` · ★1 1.5)과 곱한다 → 일반 · 엘리트 · 보스 · 미니언 처치 경험치 모두. 표(MonsterInfo · EliteMonsterInfo · MinionWave) 값은 그대로.
- `GrantKillReward` 에는 곱하지 않는다(리모컨 "레벨 +n" 이 정확한 필요 경험치를 넣는 경로).

### 밸런스 — 마을 재료(헤네시스 포자 등) 드롭 2배 (사용자 2026-10-05 "20렙 찍는데 8개밖에 못 얻음")
- `DropTable.csv` `GROUND` × `REGION_LOCAL` 3행(값만 · 헤더 그대로): 사냥터1 35% → **70%** · 사냥터2 75%×1 → **100%×1~2**(평균 1.5) · 사냥터3 100%×3~4 → **100%×6~8**. 처치마다 굴리는 행이라 기대값이 정확히 2배. 리스항구 · 마을 · 보스 맵은 원래 GROUND 행이 없다.

### HUD — 친구 · 메뉴 버튼 삭제
- `Summon/StatusHUDController`: 두 버튼("준비 중" 토스트만 띄우던 것)을 `OnBeginPlay` 에서 끈다. `.ui` 배치는 그대로(디자이너 배치 보존). `apply-hud-status.cjs` 주석에 표시.

### 리스항구 택시 — 차원의 거울
- 새 기능 NPC `VD_LITH_TAXI`(`FunctionalNpcCatalog` 행 · `MapNpcs_Village` 리스항구 (10.81, 1.11) · 모델 `Models/Npcs/VD_LITH_TAXI` = 원작 `npc/9010022` stand · 이름표 "차원의 거울"). 같은 자리에 있던 장식 NPC(`MapNpcs` 9010022 · 영어 이름표 "Dimensional Mirror") 행은 뺐다(노틸러스 장식 거울은 그대로).
- 창: `CommonNpcUIController` 라우트 `taxi` — 차원 관문의 5마을 카드를 같이 쓴다(에너지 코어 칩 끔 · 무료). 카드 = 마을 이름 + 내 마을 / 주인 있음 / 빈 마을. 전직 전이면 "전직한 뒤에 이용할 수 있습니다" 로 [이동] 잠금.
- 서버: `LaneStateService` 뷰 `taxi`(JOB · T 행) · `RequestTaxi(villageId)` — 관전 차단 · **전직했나**(B `PlayerSkillState.GetJobId` ≠ 초보자) · 리스항구 마을 맵에서만 · 도착 = 그 마을 `LaneConfig` VILLAGE 행의 넥서스 자리에서 통로 가운데 쪽으로 `TaxiSideOffset`(1.5) · 발판 0.3 위. 성공하면 창을 닫는다(`DONE`). 로그 `[Lane] taxi <uid> -> HENESYS Henesys_Village_MinimiMain (x, y)`.

### 전직관 머리 위 전구
- 전직관 모델 5종(`VD_JOB_*`)에 꺼진 자식 `JobMark`(원작 퀘스트 전구 `25076964…` · 후보 K5 · 머리 높이 = 그림 실측 0.80~1.52 · Default/3 = 플레이어 뒤).
- 새 `Npc/JobMarkController`(@Logic · 클라): 0.5초마다 지금 맵의 `Npc_VD_JOB_<직업>_*` 의 `JobMark` 를 **초보자 · 레벨 ≥ 그 직업 1차 요구 레벨**(JobDatabase)일 때만 내 화면에서 켠다. 로그 `[JobMark] <맵> shown=5 job=NOVICE lv=10`.

### 리스항구 마을 포탈 높이 (사용자 2026-10-05 "들어올 때 밑으로 떨어짐")
- `LithHarbor_Village_MinimiMain` 포탈 2개 y 0.392 → **0.44**. 바닥 발판이 0.43 이라 포탈이 바닥보다 0.038 아래였다 → 도착하면 바닥 밑에 나타나 떨어졌다.
- 규칙(사용자 2026-10-05 "확 올리면 안 되고 바닥에 닿아 있는 채로 텔포 때 안 떨어질 정도로만"): **포탈 y = 그 x 의 발판 y + 0.01**. 같은 상태(바닥보다 0.005 ~ 0.074 아래)였던 다른 맵 포탈 13개도 같이: 헤네시스 BlueMushroomTrail `Portal` · 커닝 ConstructionSite `Portal_3` · 커닝 마을 `P_To_KerningCity_Hunt_SewerApproach` · 노틸러스 마을 `Portal_10` · `Portal_11` · `Portal_16` · 페리온 NorthernRidge `P_To_Perion_Hunt_WildBoarLand` · `P_To_SixPathCrossway` · `Portal_2` · `Portal_3` · SouthernRidge `P_To_Perion_Village_MinimiMain` · WildBoarLand `P_To_Perion_Village_MinimiMain` · `Portal_3`. x · z 그대로(MapBuilder patch).

### 레인 바닥 그림 교체 (WO-047 · 사용자 "같은 브랜치로")
- 사용자 그림 12장(`리소스파일/레인-발판/` · 헤네시스 · 커닝시티 · 페리온 · 엘리니아 × 왼끝 · 중간 · 오른끝) → `Docs/tools/lane-floor/prep.py`(엘리니아만 37% · 이름 `lfl_<마을>_<left|mid|right>`) → `upload.cjs` 그룹 리소스 `mIYbC` 12장(`ruid-map.json`). **피벗은 올릴 때**: 중간 x 0.5 · 왼끝 x 1.0 · 오른끝 x 0.0 · y = 걷는 선(헤네시스 풀 중간 · 커닝 판석 윗면 · 페리온 돌 윗면 · 엘리니아 잎 중간 · 엘리니아 끝 조각은 21px 어긋남 반영).
- `apply.cjs`(MapBuilder · 다시 돌려도 같음): 레인마다 `LaneFloor_L` · `LaneFloor_R` · `LaneFloor_Mid_i` — 레인 = 옛 발판 조각의 `CustomFootholdComponent` 범위. 중간은 n 장을 이어 붙이고 **가로만 늘이거나 줄여 밟는 선 길이에 딱 맞췄다**(n = 늘임이 가장 적은 정수 · 0.75 ~ 1.25배). 엘리니아 `TreeTrunkNest2`(레인 5.45)만 중간 1장을 Tiled 로 잘라 폭 1.73. 층 = 발판 조각과 같은 SortingLayer · `OrderInLayer 1`. 결과 `apply-report.json`.
- 옛 `LaneGround_*` 조각: 그림(`SpriteRendererComponent.Enable`)만 끔 · Transform · 발판 그대로 → 다시 굽기 없음. 노틸러스 맵 · 테스트맵 노틸러스 줄은 그대로.
- 맵 11개: 헤네시스 HillNorth · GolemsTemple · 마을 / 커닝 ConstructionSite · 마을 / 페리온 NorthernRidge · WildBoarLand · 마을 / 엘리니아 GreenTreeTrunk · TreeTrunkNest2 / `Test_Lane_Fx`(4줄).
- 계약서 A-2-4b 층 문장 갱신(사용자 직접 지시 작업 → #40 공지 생략).

### 캐릭터 창(C) "스킬" 버튼 · SP 알림 "!" (사용자 2026-10-05 "눌러도 스킬창 안 열림")
- 원인: 스킬 창 그룹(`SkillWindow` 순위 6 · B)이 캐릭터 창(`CharacterGroup` 11)보다 뒤라, 열려도 캐릭터 창에 가려졌다. "!" 는 버튼의 자식이고 클릭을 막지 않는다(RaycastTarget false).
- `Stat/StatUIController.OnClickSkill`: 캐릭터 창을 닫고 스킬 창을 연다(이미 열려 있으면 그대로). B 파일 · .ui 순위는 건드리지 않았다.

### ESC = 최근에 연 창부터 하나씩 (사용자 2026-10-05)
- 새 `Summon/UIEscStack`(@Logic · 클라): 0.1초마다 창 10개(캐릭터 · 스킬(B) · 공방 · 로비 · 공용 NPC · 방어 · 생활 · 기록 · 계정 기록 · 월드맵)의 열림 플래그를 보고 "닫힘 → 열림" 이 된 창을 맨 위로 기록 → ESC 는 맨 위 창 하나만 그 창의 닫기 메서드로 닫는다. 결과 · 부활 · 관전 · 외형 고르기는 안 넣었다(골라야 닫힘).
- 예전 창별 ESC 처리(`StatUIController` · `WorkshopUIController`)는 지웠다 — 한 번에 같이 닫혔다.

### 게임 종료 경고 (사용자 2026-10-05 · 방식 = 엔진 나가기 창 + 경고)
- MSW 는 스크립트로 게임을 끄는 API 가 없다(나가기 = 엔진 창 · `ExitPopupOpenedEvent` / `ExitPopupClosedEvent` 만 들을 수 있다 · `KickUser` 는 "추방" 문구).
- 새 `Match/ExitWarnController`(@Logic): 나가기 창이 열리면 서버에 물어 **매치 진행 중 · 남아 있는 참가자**면 경고 띠를 켠다 · 창이 닫히면 끈다. 서버 답이 창이 닫힌 뒤에 오면 무시한다(Codex 검토 반영). 나가면 지금처럼 `OnUserLeave` → 포기(넥서스 0 · 탈락 · 이탈 기록).
- 새 `ui/ExitWarnGroup`(`Docs/tools/design-ui/apply-exit-warn.cjs` · 순위 40 · 클릭 안 막음): 화면 위쪽 700×196 띠 — 부활 창과 같은 판 · 제목 띠 · 경고 아이콘 · 글자 색 재사용. "매치 중에 나가면 불이익이 있어요" / "지금 나가면 포기로 처리됩니다 — 넥서스가 0 이 되어 탈락하고 순위 보상을 받을 수 없어요." / "그래도 나가려면 나가기 창에서 계속 진행하세요".

### 몬스터 도감 해금 재료 (사용자 2026-10-05 "다이아몬드가 아니라 몬스터 재료")
- `LaneStateService.CollectionMaterialOf(villageId, monsterId)`: 그 몬스터의 재료(`MonsterRecruit.MaterialItemId` × `MaterialCount` = 모집과 같은 `MAT_<id>` 8개). 모집 표에 없으면 `MAT_<id>` → 그것도 없으면 예전 `MaterialOf`(다이아몬드).
- 도감 뷰 `C` 행 뒤에 재료 4칸(itemId · 이름 · 보유 · 필요) · `RequestUnlockCollection` 도 같은 재료를 받는다.
- `Npc/VillageRecordUIController`: 고른 몬스터의 재료로 비용 칩을 그리고, 고르기 전 보유 칩의 공용 재화(다이아몬드) 칸은 감춘다.
- (Codex 검토 반영) 재료가 없는 몬스터 10종(달팽이 · 파란 달팽이 · 스포아 · 빨간 달팽이 · 슬라임 · 초록버섯 · 우는 파란버섯 · 겁먹은 와일드보어 · 주니어 레이스 · 아이언호그 — 모집 표에도 없다)은 다이아몬드로 받지 않고 **해금 없음 · 모집 대상 아님**(버튼 끔 · 서버도 거절). 재료를 새로 만들지는 사용자 결정 대기.

### 모집표 10종 추가 (사용자 2026-10-05 "모집표 만들어 · 그 재료로 도감 해금 · 모집")
- 재료가 없던 10종에 기존 14종과 같은 규칙으로 행 추가(행만 · 헤더 그대로): `ItemInfo` `MAT_<몬스터Id>` "<몹> 재료"(아이콘 = 그 몹의 `MonsterInfo.IconRUID` — 기존 14종 전부 이 규칙) · `DropTable` MONSTER 행(단계별 25 / 35 / 50%) · `MonsterRecruit`(재료 8 · 묶음 5 · 단계 경비 값 그대로).
- 단계 = 레벨: Lv10 이하 T1(500/150) — 달팽이 · 파란 달팽이 · 스포아 · 빨간 달팽이 · 아이언호그(리스항구 쪽) · 초록버섯(머쉬맘 맵) / Lv17 T2(1600/315) — 슬라임 · 우는 파란버섯 / Lv24 T3(2500/1850) — 겁먹은 와일드보어 · 주니어 레이스(커닝 3단계 빈자리를 채움).
- 이제 도감 24종 모두 자기 재료로 해금 · 모집된다(앞의 "해금 없음" 처리는 표가 빠질 때의 안전망으로 남김).

### 몬스터가 죽어도 쫓아옴 (사용자 2026-10-05)
- 원인: `Monster.Dead()` 는 `IsDead` 만 세우고 DEAD 전이는 다음 틱이라, 그 사이 추격 상태(`StateTypeChase`)가 계속 밀고 붙은 속도도 남았다.
- `Monster.Dead()`: 즉시 `MovementComponent:Stop()`. `StateTypeChase.OnUpdate`: `IsDead` 면 멈추고 아무것도 안 한다. (미니언 `FactionAI` 는 원래 멈춘다.)

### 로그 확인 (Maker Play) — TODO
- [ ] Reimport All(새 `JobMarkController` · 새 모델 등록) → 빌드 경고 0.
- [ ] Lv9 → 전구 없음 · Lv10 → 5명 머리 위 전구 · 전직하면 사라짐(눈 확인 · 높이 조정 필요할 수 있음).
- [ ] 차원의 거울: 초보자 → [이동] 잠금 · 전직 뒤 → 5마을 각각 넥서스 옆에 내림(발판 위) · 창 닫힘.
- [ ] 새 판 시작: HP 400/400 · 달팽이 접촉 피해 1~3 · 빨간 달팽이 16 안쪽.
- [ ] 걷기 속도 절반 · 두 판 연속으로 해도 빨라지지 않는다(`[Stat]` 걷기 속도 로그).
- [ ] 오른쪽 위 친구 · 메뉴 버튼이 안 보인다.
