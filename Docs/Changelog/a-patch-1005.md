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

### ③ NPC 이름표 배경 — Maker 에선 정상 · 출시본 원인 미확정 (사용자 "내가 생각하는 원인은 order in layer")
- Maker Play(2026-10-06 · 개인 월드)에서 `WorldNameTag` 를 직접 읽고 스크린샷으로 확인: 플레이어 종류 · **NPC 종류**(테스트로 스폰) 모두 판 켜짐 · 알파 1 · Sliced · 층 `Default/2`(글자 `Default/3`) · NPC 판 RUID `6f24a05e…` 로 초록 판이 화면에 그려진다. 로비 맵 기준이라 마을 맵 겹침(레이어)은 못 봤다 — 마을 NPC 는 매치 방(인스턴스)에서만 스폰돼 Play 로 바로 못 갔다(`MoveToMapPosition` 은 이 월드에서 맵을 옮기지 못했다).
- 그래서 코드 로직 문제는 아니고, 출시본에서만 판 그림이 안 읽히거나(RUID 가 스크립트 문자열로만 있음) 마을 맵의 다른 그림과 겹치는 것이 남은 후보. `WorldNameTag.PreloadPlates`(클라 시작 때 판 3종을 미리 불러오고 실패하면 `[NameTag] plate preload failed: <RUID>=<상태>` 경고 + 불러온 뒤 다시 그림)를 넣었다 — 출시본 콘솔에서 이 경고가 나오는지 보면 리소스 문제인지 가려진다. 경고가 없는데도 안 보이면 마을 맵 겹침(층)이다.
- ⑪(오른쪽 위 사람 · "…" 버튼)은 MSW 플랫폼 기본 UI 라 숨길 수 없다(공식 문서).

### ④-b 엘리트 몬스터도 일반 몬스터대로 (사용자 "엘리트 몬스터도 당연히 바꿔야지 일반몹대로")
- `EliteMonsterInfo` 12행 중 베이스 몬스터의 레벨이 바뀐 11행(`E210100` · `E2130103` · `E2220110` · `E2230100` · `E2230102` · `E2230112` · `E3230100` · `E3230101` · `E3230300` · `E4230100` · `E5130102`)을 표의 규칙대로 바꿨다 — 레벨 = 베이스 레벨 · `MaxHp` = 베이스 × 25 · `AttackPower` = 4 × `Attack` · `Exp` = 10 × `Exp` · `Meso` = 10 × `CoinMin` · 티어(`Tier` · `ScaleMul` · `CoinDrop` · `DreamDrop`)는 레벨 구간(10 → 1 · 17 → 2 · 24 → 3). 생성 `Docs/tools/monster-tier/apply-elite.py`(다시 돌려도 변경 0 · `--dry`).
- 파란버섯 엘리트 `E2220100` 은 그대로 Lv17(노틸러스 사냥터2 기준) — 헤네시스(Lv24) 파란버섯에서 나오는 엘리트도 같은 Lv17 값이다(엘리트 표가 몬스터 ID 하나에 한 행이라 맵별로 못 나눔 · 필요하면 `EliteSpawner` 에 맵별 레벨 환산을 더해야 함).

### ⑯ 게임 소개 · 처음 안내 · 도움말 UI 통합 (WO-050 §3 · 디자인팀 인계 `msw.zip` · 사용자 "추가 UI")
- 디자이너 PC 산출물을 그대로 복사(모두 신규): `ui/GameIntroGroup`(소개 7쪽) · `ui/CoachMarkGroup`(처음 하는 사람 안내) · `ui/HelpHudGroup`(HUD 도움말 H 버튼) · `Onboarding/GameIntroController` · `CoachMarkController`(+ 디자이너 Maker 가 만든 `.codeblock` · `Onboarding.directory`) · `Docs/tools/design-ui/apply-intro-coach.cjs` · `gen-coach-art.cjs` · 디자인팀 기록 `Docs/Changelog/a-design-ui-intro-coach.md`(그대로 둠). `ruid-map.json` 에는 `coach_ring` · `coach_finger` 2키만 추가(덮어쓰지 않음).
- 지금 `main` 에 맞춘 것: ① **Esc 는 `UIEscStack` 한 곳만 받는다** — `intro` · `coach` 를 창 목록에 넣고 두 컨트롤러의 자체 Esc 처리를 뺐다(다른 창까지 한 번에 닫히지 않게). ② **채팅 입력 중 H · ← →** 무시(`_ChatService.typing`). ③ 그림 순서는 디자이너 컨트롤러가 열 때마다 부활 팝업 바로 아래로 올린다(채팅 9 · 나가기 경고 40 은 그대로). ④ 도움말 버튼 자리는 HUD 의 캐릭터 · 스킬 버튼 왼쪽이고 친구 · 메뉴 버튼은 코드에서 꺼 둔 상태라 겹치지 않는다(`ruid`/좌표를 빌더로 비교).
- 범위 밖(디자인팀 기록 그대로): 안내 5~9단계의 게임 시점 연결 · "봤음" 계정 저장 · 첫 매치 시작 시점 전환.

### ⑰ 마을 앰블럼 교체 + 소개 카드 그림 (WO-050 §4 · drive 앰블럼 7장)
- `Docs/tools/design-ui/prep-emblems.py`: 원본 1254×1254 7장의 투명 여백을 자르고 정사각으로 맞춰 마을 5장 168×168 · 키우기 · 지키기 144×144 로(`_upload/`). `upload-emblems.cjs`: 그룹 `mIYbC` 에 `dui_emblem_{henesys,kerning,ellinia,nautilus,perion}_v2` · `dui_intro_grow` · `dui_intro_defend` 로 올림(피벗 0.5 · Bilinear · Clamp · 옛 리소스는 지우지 않음 · 결과 `emblem-upload.json`).
- 배선: `ruid-map.json` 의 `emblem_<마을>` 5키를 새 RUID 로 · `intro_grow` · `intro_defend` 추가 · `Npc/CommonNpcUIController.EmblemRuids` 5개 교체 · `ui/CommonNpcGroup`(차원문 · 택시 카드 · 파병 · NPC 비용) 15칸의 문장 그림을 `swap-emblems.cjs` 로 새 RUID 로 바꿨다(옛 RUID 참조 0 확인).
- 소개: 1쪽 카드 아이콘 `ico_sword` → `intro_grow` · `ico_home` → `intro_defend`("쓰러뜨리기"는 그대로) · 5쪽(방어선) 그림 판을 260 → 340 으로 키워 아래에 마을 문장 5개 한 줄 + 마을 이름. 이 판에 맞춰 `apply-intro-coach.cjs` 를 고쳐 `.ui` 3개를 다시 만들었다(스크립트가 UUID 를 새로 매겨 `.ui` · 두 컨트롤러의 property UUID 가 같이 바뀜).

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
- [ ] ④-b 엘리트: 사냥터 몬스터 25마리째마다 나오는 엘리트의 레벨 · HP · 공격이 새 단계(예: 헤네시스 골렘 엘리트 Lv17).
- [ ] ⑯ 외형 선택 뒤 게임 소개가 자동으로 뜨고 ← → 로 7쪽 · ESC 로 닫힘(안내 · 다른 창과 겹치면 최근 것부터 하나씩) · 채팅 입력 중 H 무시 · 도움말 버튼(캐릭터 버튼 왼쪽) · 게임 시작하기 → 안내 1→4.
- [ ] ⑰ 차원문 · 택시 · 파병 카드의 마을 문장이 새 그림 · 소개 1쪽 카드 · 5쪽 마을 문장 5개 줄이 겹침 없이 보임.
- [ ] ③ 출시본 콘솔에서 `[NameTag] plate preload failed` 경고가 나오는지.
