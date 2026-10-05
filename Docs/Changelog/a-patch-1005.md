# a/patch-1005 — WO-049 패치 묶음 (Draft #183)

지시서: `WorkOrders/WO-049-전직-AP-리셋-택시-칸-사냥터-레벨-물약-쿨.md`. 이 브랜치에는 다른 Codex 세션이 먼저 올린 `06d0407`(사망 페널티 강제 · 부활 HP · 페리온 방향)이 있었다 — 그 위에서 이어 가며 **페리온 방향은 코드 하드코딩 대신 표 값으로** 바꿨다(아래 ⑮).

## 2026-10-05

### ① 전직하면 AP 전부 리셋 (사용자 "전직하면 AP 다시 전부 리셋 · 마법사는 INT 가 주스탯")
- `Stat/StatService`: 원장에 `apAlloc`(스탯별로 찍은 AP) 기록 · `Allocate` 가 같이 더한다. 새 `ResetAp(userId, reason)` = `base` 에서 찍은 만큼 빼고 `econ.ap` 로 돌려준 뒤 재계산 · HUD · 캐릭터 창 갱신 · 토스트 "전직으로 AP n 가 초기화됐습니다". `OnJobChanged` 가 `SetJob` 뒤에 부른다(1차 · 2차 모든 전직). 시작 기본치(STR 12 · DEX 5 · INT 4 · LUK 4)는 그대로.

### ② 차원의 거울(택시) 빈 칸
- `Npc/CommonNpcUIController.GoRoute`: 택시일 때 코어 칩 판의 글자(`CoreText`)를 "순간이동"으로 켠다(개수 · 아이콘은 관문만). 관문 화면은 그대로.

### ④ 사냥터 레벨 통일 — 사냥터1 Lv10 · 사냥터2 Lv17 · 사냥터3 Lv24 (사용자 "B 가 맞음 · 몬스터를 바꾸는 거임" · 구현 = Codex gpt-6-luna · 검토 = 전체 diff)
- 맵 · 배치는 그대로, 그 맵 몬스터를 단계 레벨로. 11종 `MonsterInfo` 의 `Level` · `MaxHp`(기준 HP 비율) · `Exp` · `Attack` · `CoinMin/Max` 를 단계값으로(다크 스톤골렘 24→17 · 우는 파란버섯 17→24 · 슬라임 · 커즈아이 17→10 · 콜드아이 24→17 · 이블아이 10→24 · 와일드보어 · 겁먹은 와일드보어 24→10 · 주니어 부기 10→24 · 주니어 레이스 24→17 · 주니어 네키 17→24). 파란버섯 2220100(노틸러스 사냥터2 Lv17 에도 나옴)은 `MonsterInfo` 를 두고 헤네시스 `BlueMushroomTrail` 행 22개만 `LevelOverride 24`.
- `LevelOverride` 가 이제 공격 · 경험치도 환산: `MonsterCatalog.LevelBaseStats`(10:22/58 · 17:38/114 · 24:70/162) → 스폰 항목 `exp` · `attack` → `MonsterSpawner` 가 `FarmReward.ExpOverride` · `AttackOverride` 로 전달 → `FarmReward.EffectiveExp`(엘리트는 먼저 정해져 영향 없음) · `MonsterAttack` 접촉 피해가 사용. 노틸러스 리본돼지 24 · 리스항구 4/7 덮어쓰기도 같은 규칙으로 맞춰진다(원래는 공격 · 경험치가 원래 몹 값이었다).
- `MonsterRecruit`(Tier · 경비 HP/공격 11행) · `DropTable` MONSTER 재료 확률(11행) 도 레벨 단계를 따라 바꿈. 생성 스크립트 `Docs/tools/monster-tier/apply.py`(다시 돌려도 변경 0 · `--dry`). 헤더 변경 없음 · BOM/CRLF 유지.
- ⚠ 엘리트: `EliteMonsterInfo` 에 이 몬스터를 베이스로 쓰는 12행이 있다 — 엘리트의 레벨 · HP · 공격 · 경험치는 그 표가 따로 가지고 있어 이번에 안 건드렸다. 일반 몹 레벨이 바뀌어 엘리트와 레벨 위계가 어긋나 보일 수 있음(확인 필요).

### ⑤ 물약 1번 슬롯 쿨타임이 안 보임
- 원인: HP 물약은 쿨 원장 키가 공용 `"HP"` 인데 퀵슬롯 직렬화(`InventoryService.SerializeQuick`)가 아이템 ID 로 읽어 늘 0 초였다. `CooldownKey` 로 읽게 한 줄 수정.

### ⑥ `[LEA-3032] FailedSendToClient` (사용자 캡처)
- `Match/MatchSessionLogic`: 방을 나간 참가자에게 Client RPC 를 보내던 곳(첫 웨이브 "미니언이 생성되었습니다" · 발록 선취 알림 · 미점령 탈락)을 `ToastHere`(유저 엔티티가 있을 때만 전송)로 바꿨다.

### ⑦ 사냥터에서 죽으면 그 지역 마을에서 부활 (사용자 "그 사냥터에 해당하는 마을로")
- `Match/PlayerRespawnService.HuntRespawn`: 죽은 맵이 `<지역>_Hunt_*` 면 그 지역 마을(`<지역>_Village_MinimiMain`)의 "죽은 맵으로 가는 포탈" → 마을 1레인 포탈 → 마을 `SpawnLocation` 순으로 자리를 잡는다(리스항구 포함). 사냥터가 아닌 곳(마을 · 보스 · 여섯갈래길)은 지금처럼 내 마을 → 리스항구. 로그 `[Death] … rule=HUNT_REGION | OWN_VILLAGE | LITH`. 토스트 · 팝업 문구 = 실제 간 마을 이름 · "가까운 마을".

### ⑧ 레인 바닥 그림 크기 절반 (사용자 "타일 전체 크기를 절반으로 · 크기가 이질적" · 구현 = Codex gpt-6-luna · 검토 = 전체 diff)
- `Docs/tools/lane-floor/apply.cjs` `PIECE_SCALE = 0.5`: 끝 조각 · 중간 조각 가로 · 세로 0.5배, 중간 장수 재계산(대략 2배: 헤네시스 HillNorth 2→5 · 페리온 WildBoarLand 3→7 …). 걷는 높이(피벗 = 걷는 선) · 발판 · 옛 `LaneGround_*` · 층은 그대로. 맵 11개(`Test_Lane_Fx` 포함) 다시 깔음.
- 다시 돌려도 맵 바이트가 같게(기존 `LaneFloor_*` 를 UUID 보존해 갱신 · 남는 조각만 제거) 바꿨다.
- 엘리니아 `TreeTrunkNest2`(짧은 레인)는 원래 Tiled 한 장이었는데 Tiled 의 `TiledSize` 가 변환 배율의 영향을 받는지 Play 로 확인한 적이 없어, 반 장 이상 남는 레인은 Tiled 대신 **가로 0.89 배 한 장**으로 깐다(임계값 `midWidth × 0.5`).

### ⑨ 물약 가격 (사용자 "하얀 포션 절반 · 엘릭서 500 · 파워 엘릭서 900")
- `ShopItem.PriceMeso`: 하얀 500→250 · 엘릭서 3000→500 · 파워 엘릭서 9000→900. 되팔기 `ItemInfo.SellMeso` 도 같이(250→125 · 1500→250 · 4500→450) — 안 내리면 사서 되파는 무한 메소.
- `ItemInfo` 엘릭서 · 파워 엘릭서 `#Note` 의 쉼표(3,000) 때문에 셀이 둘로 쪼개져 `AvatarSlot` 칸에 글자가 들어가 있던 것을 합쳐 바로잡았다(열 수 32 유지).

### ⑩ 채팅 말풍선이 안 나옴 (사용자 "원래 나왔는데")
- `Chat/ChatService.ShowBalloon`: 플레이어 `ChatBalloonComponent.ChatModeEnabled`(엔진 채팅 연동 · 기본 true)가 엔진 채팅을 끈 지금 `Message` 직접 쓰기를 막을 수 있어 연동 · 자동 표시를 끄고 띄운다. 로그 `[Chat] balloon … mode=false`. **Play 로 확인 필요**(원인 추정).

### ⑬ 사망하면 항상 비용(메소 / 경험치) 선택 (사용자 "무조건 사망 시에 선택하게" · Lv12 에서 죽었는데 창이 안 떴음)
- 다른 Codex 세션 커밋 `06d0407` 을 그대로 유지: 개척 단계(PHASE0-1 · 0-2 · PHASE1) 무료 규칙(`FreePhases` · `IsFreePhase`)을 없애 어느 페이즈든 사망 팝업 · 페널티가 뜬다.

### ⑭ 부활하면 HP 가 안 참 (사용자 "가끔 부활했을 때 체력이 안 차 있음 · 최소 절반")
- `06d0407` 의 부활 시점 `Hp = MaxHp` 를 유지하고, 엔진이 HP 를 늦게 덮는 경우를 막으려 `EnsureReviveHp` 가 0.4초 간격 3번 "최소 `ReviveMinHpRatio`(0.5) 미만이면 최대치로" 다시 확인한다. 로그 `[Death] revive hp low …`.
- (Codex gpt-6-luna 리뷰 2회 반영) 이 확인 타이머가 매치 종료 뒤에도 돌아 로비 · 다음 매치 HP 를 채울 수 있던 것을 매치 세대(`moveEpoch`) · 매치 진행 · 참가자 확인으로 막았다.

### ⑮ 페리온 사냥터2(`NorthernRidge`)는 미니언이 왼쪽 → 오른쪽 · 포탑은 오른쪽에서 왼쪽을 봄 (사용자)
- 값 기반으로 처리(`06d0407` 의 `LaneFacilityService` 하드코딩 두 블록은 되돌림 — 포탑 그림 `FlipX` 를 true 로 두어 오른쪽을 보게 남고 포탑 자리도 안 옮겼다):
  - `LaneConfig` PERION LANE2: `SpawnX` 10.1→-9.18 · `EndTriggerX` -9.8→10.72 · `TowerSlotX` -2.3→3.22(통로 중앙 기준 좌우 반전 → 출발~포탑 거리 12.4 · 포탑~끝 7.5 그대로 = 레인 보정 유지). 방향(`LaneDir`)은 끝 > 출발이면 좌→우라 수비대 자리도 자동으로 따라간다.
  - `FacilitySprite` PERION TOWER `FlipX` true→false(새 그림이 왼쪽을 봄). 투사체 발사 보정(`LaunchAdjX`)은 `ForwardSign` 이 FlipX 를 따라 자동.

### ③ NPC 이름표 배경 — 미해결(Maker 연결 뒤 조사)
- 코드(`WorldNameTag` · `NpcSpawner`)는 최근 변경이 없다. 원인은 Maker Play 로 판 엔티티(`SpriteRUID` · `Color.a` · 층 · 크기)를 읽어야 안다 — Maker 연결 뒤 조사.
- ⑪(오른쪽 위 사람 · "…" 버튼)은 MSW 플랫폼 기본 UI 라 숨길 수 없다(공식 문서).

## 확인 (사용자 · Maker)
- [ ] Reimport All → 빌드 경고 0 · 새 `.codeblock` 없음(새 스크립트 없음).
- [ ] ① 초보자로 STR 에 AP 를 찍고 전직 → STR 원래대로 · AP 돌아옴 · 토스트.
- [ ] ② 차원의 거울 창 판에 "순간이동".
- [ ] ④ 다섯 마을 사냥터1/2/3 몬스터 Lv10/17/24 · 헤네시스 파란버섯 Lv24 · 노틸러스 파란버섯 Lv17.
- [ ] ⑤ 1번(HP 물약) 슬롯에도 쿨 오버레이 · 숫자.
- [ ] ⑥ 한 명이 나간 뒤 웨이브에서 LEA-3032 없음.
- [ ] ⑦ 헤네시스 · 엘리니아 · 페리온 사냥터에서 죽음 → 그 마을에서 부활 · 마을 · 보스 맵 죽음은 전과 같음 · `[Death] rule=`.
- [ ] ⑧ 레인 바닥 그림 절반 · 걷는 높이 그대로.
- [ ] ⑨ 상점 하얀 250 · 엘릭서 500 · 파워 엘릭서 900.
- [ ] ⑩ 채팅하면 말풍선(내 화면 · 다른 사람 화면) · 5초 뒤 사라짐.
- [ ] ⑬ 개척 단계(4분 안)에서 죽어도 비용 선택 창.
- [ ] ⑭ 부활 직후 HP 최대치(가끔 안 차던 것 재현 안 됨).
- [ ] ⑮ 페리온 사냥터2: 미니언이 왼쪽에서 오른쪽으로 · 포탑이 오른쪽에서 왼쪽을 봄 · 포탑 앞에서 싸움.
