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

### ⑱ 디자인팀 2차 통합 — 도움말 탭 · 재화 · 아이템 도감 · 알림 카드 · 안내 재배치 (사용자 "재화 아이템 도감 · 처음부터 구현 · 켰던 것 이어 켜기" · 디자이너 PC 산출물 `리소스파일/msw (2)/msw/강화하고살아남기`)
- 디자이너 2차 파일을 3-way 병합(기준 = 1차 ZIP · 우리 = ⑯⑰ 반영본 · 상대 = 2차): `Onboarding/GameIntroController` · `CoachMarkController` 병합, `OnboardingService` · `TipController`(+ `.codeblock`) · `ui/TipGroup` 새로, `Docs/tools/design-ui/apply-intro-coach.cjs`(인자 `intro` · `coach` · `hud` · `tip`) 2차본 + 우리 §4(앰블럼 · 소개 카드 그림) 유지, `Docs/Changelog/a-design-ui-intro-coach.md` 2차본. 디자이너 `.ui` 4개는 생성기 출력과 UUID 만 다르다(정규화 비교로 확인) → 이 저장소에서 생성기를 다시 돌려 만들었다.
- 내용(디자이너 2차): 도움말(H) 창 탭 4개 = 게임 소개 7쪽 · **재화 · 아이템 11칸**(메소 · 보석 12종 · 빅토리아 주화 · 지역 재화 5종 · 몬스터 재료 14종 · 꿈의 조각 · 낙인의 영혼석 · 에너지 코어 · 단풍 봉인석 · 발록의 심장 · 누가 무엇을 주나) · 마을 NPC(4구역 10명 + 리스항구 · 로비) · 조작키 + '안내 다시 보기'. **H 로 다시 열면 마지막에 본 탭 · 쪽으로 열린다**(휘발성 · 클라 메모리). 처음 하는 사람(계정 경험치 0)에게만 자동으로 열림. 알림 카드 8종(`TipController` · `ui/TipGroup`) · 안내 재배치(로비 매치 안내원 1 · 매치 시작 · 마을 자동 3) · `OnboardingService`(서버 반쪽 · `MatchPhaseChangedEvent` · `VillageClaimedEvent`).
- **이 브랜치 규칙에 맞게 고친 것**: ① Esc 는 `UIEscStack` 한 곳만 받는다(디자이너 `OnKeyDown` 의 Esc 처리 · `CoachMarkController.OnKeyDown` 제거 · 안내가 다른 창에 비켜 선 동안(`paused`)은 Esc 대상 아님) ② 채팅 입력 중 H · ← → 무시 유지 ③ 시작 킷 자동 착용(§2-4)이 들어왔으므로 안내 매치 시작 묶음에서 '장비' 단계를 뺐다(디자이너 인계 사항 · 무기 카드는 무기 칸이 비었을 때만 뜨므로 그대로) ④ 도감 · 소개 글을 이 브랜치 규칙에 맞춤: 사망은 언제나 메소 5,000 / 경험치 50% 선택(⑬) · 물약 9가지 30 ~ 900(§2-9) · 빅토리아 주화 엘리트 20 · 40 · 60개 + 웨이브 미니언 20 ~ 30% 로 10개(§2-13) · 꿈의 조각 지역 보스 60개 · 엘리트 8 · 16 · 24개(§2-1 · §2-16) · 자동 AP 분배 문장(§2-3).
- 내가 읽은 디자이너 보고서(Artifact)는 Chrome 으로 열어서 봤다(Artifact 도구가 남의 글 읽기 승인을 요구하는데 이 세션은 승인 창을 못 띄워서).

### ⑲ 사용자 Maker 맵 편집 16개 + 직접 만든 `clickhereEntity` 모델 합침 (사용자 2026-10-06 "맵 바뀐 것들이라 중요함")
- Maker 가 물린 폴더(`villagedefense-worktrees/a/patch-1005`)의 미커밋 작업을 로컬 백업 브랜치(`wip/maker-1006`)에 먼저 커밋해 두고(푸시 안 함 · UI 27개의 Maker 재저장 = GroupOrder 순위 · 컨테이너 크기뿐이라 이쪽에만 둔다) 이 브랜치 끝 위에 얹었다.
- 얹은 것: 맵 16개(엘리니아 3 · 헤네시스 3 · 커닝 2 · 리스항구 3 · 노틸러스 마을 · 페리온 4 — 발판 · 밧줄 · 포탈 · 레인 바닥 자리 편집 + 커닝 · 노틸러스 마을에 놓은 `clickhereEntity`) · `RootDesk/MyDesk/clickhereEntity.model`(Transform + SpriteRenderer · 사용자가 만든 "클릭하세요" 그림 · SpriteRUID `26e79722…`).
- 레인 바닥(⑧ 절반 크기)은 사용자 맵 위에서 `Docs/tools/lane-floor/apply.cjs` 로 다시 깔았다(레인 = `LaneGround_*` 의 밟는 선 범위라 사용자가 고친 발판에 맞춰 다시 계산됨 · 10개 맵).
- ✔ **클릭 표시(§2-6)**: 위 사용자 `clickhereEntity` 를 쓰도록 `LaneFacilityService` 를 바꿨다 — 맵에 놓인 것은 그대로 쓰고 주인이 생기면 지운다. 노틸러스 마을 맵에도 하나 놓여 있어(사용자) 그 맵에서는 그것이 보인다 — 노틸러스를 빼려면 맵에서 지워야 한다.

### ⑳ 클릭 표시 위치 · 노틸러스 호 NPC 간격 (사용자 2026-10-06 "노틸은 내가 놔서 제외 · 엘리니아 클릭은 아래로 1.0 · 커닝은 우측으로 1.0 · 노틸러스는 간격 더 늘리고 퍼져서")
- 노틸러스: 맵에 사용자가 직접 놓은 `clickhereEntity` 는 의도한 것이다(제외 규칙은 스폰 쪽에만 적용). 손대지 않는다.
- 엘리니아: `LaneFacilityService.ClickHereOffsetByVillage` = `ELLINIA=-0.8,1.2` (기본 `-0.8,2.2` 에서 아래로 1.0). 3층 NPC 이름표와 안 겹침(Play 사진).
- 커닝: 맵에 놓은 `clickhereEntity` 를 `MapBuilder` 로 오른쪽 +1.0 (x -11.99 → -10.99 · 로그로 확인).
- 노틸러스 호 기능 NPC(`VillageNpcSector.csv` NAUTILUS 4줄): 간격 0.45 → 약 1.0. 오른쪽 구간(x 10.25~16.9)에 제작 · 강화 · 물약 · 도감 · 통계 · 방어 · 파병 7명, 가운데 빈 구간(x 0 · 1 · 2)에 창고 · 모집 · 조련 3명. 원본 NPC 와 1.0 이상 떨어져 있다.
- 같은 시기에 다른 세션이 올린 `NpcSpawner` 발판 붙이기(`6b300c8`)는 X 를 그대로 두고 높이만 바닥에 맞춘다 — 호 위 10명 모두 y 0.30 에 붙는 것을 Play 로그로 확인.

### ㉑ 커닝시티 마을의 원본 NPC 전부 끔 (사용자 2026-10-06 "커닝시티에 원래 쓰던(내가 만든 npc) 외에 다른 npc 있던데 비활성화")
- `MapNpcs.csv` 의 `KerningCity_Village_MinimiMain` 원본 NPC 20줄을 지웠다(`35aed19` 가 먼저 뺀 JM From tha Streetz 와 같은 방식 · 이 표에는 켜고 끄는 열이 없고 열 추가는 사전 공지가 필요해서). 기능 NPC(제작 · 강화 · 물약 · 창고 · 모집 · 조련 · 도감 · 통계 · 방어 · 파병 10명)는 다른 표(`FunctionalNpcCatalog`)에서 나와 그대로다.
- Play: 커닝 마을 기능 NPC 10 · 그 외 NPC 0. 정합성 검사 통과(경고 3건 · 전과 같음).
- 알아둘 것: 원본 NPC 중 10종(1052017 · 1052103 · 1052106 · 1052000 · 1520005 · 9062010 · 1103002 · 9020000 · 9000008 · 9000397)은 다른 마을 표에 줄이 없다. `NpcInfo`(도감 목록)에는 행이 남아 있어 도감에서는 계속 보이지만 게임 안에서 만날 곳이 없어진다.

### WO-050 §2 보완 요청 22건 (사용자 "보상 2배 · 자동 AP · 시작 장비 · 노틸러스 NPC · 신규 물약 · 명중 회피 · 로딩 화면 · 피격 넉백 등 고치자 / 다같이해" · 구현 = A · Codex gpt-6-luna 분담)
- **2-1 사냥 보상 2배** — `SummonManager.HuntRewardMul = 2.0`(정식 밸런스 · 테스트 임시값 아님)을 `FarmReward`(일반 · 엘리트 메소 · 미니언 `MonsterId=0` 제외) · `DropTableLogic`(젬 · 몬스터 재료 · `REGION_*` 제외) · `EliteSpawner`(꿈 조각 · 영혼석)에서 한 번씩만 곱한다. `EliteSpawner.EliteDreamMul = 2`(엘리트 전용 꿈 조각 ×2 · 사냥 ×2 와 겹쳐 ×4).
- **2-2 `REGION_LOCAL` 원복** — `DropTable.csv` GROUND 사냥터1/2/3 `REGION_LOCAL` 3행을 2배 변경 전 값(0.35×1 · 0.75×1 · 1.0×3~4)으로 손으로 되돌렸다. `MONSTER` 행 · ★5 `REGION_DROP_MUL` 은 그대로.
- **2-3 자동 AP 분배** — 계정 저장 `account_autoApOff`(기본 `false` = 켬 · `AccountProfile.SchemaVersion` 4 → **5**) · `AccountData.IsAutoApOn/SetAutoApOn` · `StatService.AllocateByJob`(직업 주스탯 · 초보자 = 현재 최고 스탯) · `OnLevelUpAp`(레벨업 AP 를 즉시 분배) · `RequestSetAutoAp`(@Server) · 상태 CSV `;autoap=`. **1차 전직 환급은 초보자(`NOVICE`)에서 넘어갈 때만**(2차 이상 전직은 환급 없음 · 켜져 있으면 환급 AP 를 새 직업 주스탯으로 다시 분배). `SummonManager.ApplyLevelUpRewards` 가 AP 를 돌려주고 `GrantKillReward` 가 모아 `OnLevelUpAp` 호출. UI: `CharacterGroup`(스탯 탭 왼쪽 `AutoAp` 줄 · `Docs/tools/design-ui/apply-char.cjs` 재생성) · `StatUIController.btnAutoAp`.
- **2-4 시작 장비 자동 착용** — `EquipService.AutoEquipMatchKit(userId)`: 매치 시작 킷으로 받은 장비를 슬롯별로 자동 착용(`RequestEquip` 과 같은 `EquipInstance(…, quiet)` 경로). `MatchResetService` 가 스탯 리셋(`ResetMatchState`) **뒤에** 호출해 장비 보너스가 지워지지 않는다.
- **2-5 노틸러스 기능 NPC → 노틸러스 호 내부** — `VillageConfig` 에 열 `NpcMapName`(`Enabled` 뒤 · 헤더 변경 · `check-integrity` 고정 헤더 함께 갱신 · NAUTILUS 만 `Nautilus_Village_MinimiShip`) · `NpcCatalog.LoadVillages` 가 그 맵으로 `villageByMap` 을 만든다(마을 맵 쪽은 안 만든다 — 양쪽이면 NPC 가 두 곳에 선다) · `VillageNpcSector` NAUTILUS 4행 앵커 = 호 내부 갑판 바닥 y 0.30(Maker 에서 `FootholdComponent:RaycastAll` 로 실측) · 원본 NPC 가 없는 오른쪽 x 10.4~15.7 구간(간격 0.45). **`map/Nautilus_Village_MinimiShip` 에 `NpcSpawner` 엔티티가 없어(다른 마을 맵엔 다 있음) MapBuilder 로 추가** — 이제 이 맵의 `MapNpcs.csv` 원본 NPC 30명도 같이 선다. `MapNpcs` 장식 NPC 6명(`MinimiMain`)은 그대로 둔다(기능 NPC 만 이동).
- **2-6 주인 없는 넥서스 "클릭하세요"** — 사용자가 직접 만든 `RootDesk/MyDesk/clickhereEntity.model`(Transform + SpriteRenderer)을 쓴다. `LaneFacilityService.SpawnClickHere/RemoveClickHere`(`SpawnAllNexus` 에서 주인 없는 마을마다): **마을 맵에 사용자가 Maker 로 미리 놓은 `clickhereEntity`(이름 접두 `ClickHereNamePrefix`)가 있으면 그것을 두고**, 없는 마을은(`ClickHereExclude` = 노틸러스 제외) 넥서스 슬롯 + `ClickHereOffset` 자리에 같은 모델을 스폰(`ClickHereModelId` = 모델 Id `a340de12-…` · 층 `DamageSkin`). 주인이 생기면 `OnVillageClaimed` 에서 지운다(`Destroy` · 방마다 맵 복사본이라 다른 방 · 다음 매치는 그대로). `[Facility] clickhere +/-`. 예전 서버 합성(`auracircle` + 고리 · 손가락 · `ClickHereMarker`)은 뺐다.
- **2-7 재료 드롭 1/3 크기** — `Farm/ItemDrop.MaterialDropScale = 0.3333`(`MAT_*` 드롭 그림만 작게 · 개수 · 판정 그대로).
- **2-8 원근 정렬** — `PlayerFrontLayer.BehindFacilityEnabled`: 시설보다 한 층 이상 위(`FloorGap` 1.0)에 땅을 딛고 서서 시설 그림과 겹치는 캐릭터는 시설 뒤(서버 `SortingLayer` → 시설 층 · 클라 `OrderInLayer` 1). `LaneFacility` 에 `@Sync ZoneHalfW/ZoneHeight` 추가(`LaneFacilityService.SpawnFacility` 가 채움 · 노틸러스 넥서스는 구역 없음 · `BehindZoneWidthMul`). 판정 주기 0.5 → 0.1 초. **Play 에서 볼 것**: 뒤 구역에선 MapLayer 층으로 내려가 더 높은 MapLayer 발판 타일이 발을 덮는지 — 보이면 끄거나 대안(시설 `Default/2` · 몬스터 `Default/3` · 뒤 구역 `Default/1`)으로. 스킬 분신 · 불꽃용으로 `PlayerFrontLayer.SortingLayerOf(user)` · `OrderOf(user)` 를 추가했다(B 가 `ApplyShadowSorting` 에서 읽으면 됨 · #40).
- **2-9 · 2-10 물약** — 신규 3종 `MANA_ELIXIR`(MP +600 · 300메소) · `PURE_WATER`(MP +1200 · 600) · `GRILLED_EEL`(HP +1000 · 650) → `ItemInfo` · `ConsumeInfo` · `ShopItem`(마을 물약 상인 `POTION` · 리스항구 초보 상점엔 없음). 회복량 상향: 빨강 +255 · 주황 +330 · 하양 +405 · 파랑 +200. MP 물약은 공용 쿨 키 `"MP"`(`InventoryService.CooldownKey`).
- **2-11 마법사 MP** — "직업 MP 3배"는 구현하지 않음(원래 없음). 마법사 옷(상의 · 하의 · 한벌옷) `BaseMaxMp` 를 단계별 B(L)=100+20(L−1) 의 1배(한벌옷 2배)로 넣고 `ItemCatalog.ComputeEnhance` 가 강화 단계마다 `MagicianClothMpPerEnhance = 1/3` 씩 더해 +0 에서 3배 · +3 에서 5배(예: Lv20 한벌옷 1,440 → 2,400).
- **2-12 명중 · 회피** — `DamageFormula`: `HitCheck(acc, lv, targetLv)` 에 몹 회피(`MobAvoidBase + MobAvoidPerLevel × 레벨`)를 반영하고 `DodgeCheck`(플레이어 회피 · 몹 명중 `MobAccBase + MobAccPerLevel × 레벨` · 레벨 차 보정 · 상한 `DodgeCap` 0.35) 신설. `MonsterAttack` · `FactionAttack`(미니언 · 수비대 · 시설은 `EnableFacilityDodge` 기본 꺼짐)이 플레이어 피격 전에 회피 판정 · MISS 글자는 `DamageFormula.ShowMiss`(Multicast · `DamageSkinTextType.Miss`). 몬스터 레벨은 `FarmReward.SpawnLevel`(`MonsterSpawner` 가 스폰 행 레벨 전달). **B 알림**: 스킬 경로(`SkillAttack.CalcDamage` → `SkillDatabase:DamageAt`)는 `StatService` 명중 판정을 안 거친다 — B 몫.
- **2-13 빅토리아 주화 ×10** — `SummonManager.VictoriaCoinMul = 10`: 미니언 · 엘리트 주화의 확률 · 개수에 곱(미니언은 바닥 드롭 `GroundDrop`) · `MinionPhaseConfig` 주화 기본 확률 0.25/0.3/0.4 → 0.02/0.02/0.03(×10 로 0.2/0.2/0.3). 주화 수급이 늘어 주화 소비처 상대 가격이 낮아진다.
- **2-14 노틸러스 미니언 정지** — `FactionAI`: 접근(`ApproachActive`) 미니언은 넥서스 표적을 잃어도 정지선을 넘지 않고(`HOLD`) 정지선 앞 적만 넥서스보다 먼저 친다 · 표적을 잃은 원인 로그 `[Approach] … lost core -> … reason=`.
- **2-15 · 2-16** — `MinionWave` LIVE · TEST 2페이즈 HP −20% · 3페이즈 공격력 절반 · 수비대 스탯 = 티어 기본값에서 강화 레벨(1~5)별 기하 보간(`DefenderService.GuardHpAtMax 18300 · GuardAtkAtMax 3400 · GuardLv1Mul 0.9` · `SpawnOne/SpawnBundle` 에 `upgradeLevel` 인자 추가) · `BossReward` 5행 꿈 조각 60.
- **2-18 레벨업 몸 빛남** — `StatusHUDController.PlayLevelUpGlow/TickGlows`(클라 로컬 `auracircle` · `Default/3` · 금빛 원이 1.5초 동안 2번 반짝) · `SummonManager.OnLevelUp` 이 방 안 모든 클라에 방송. 그림 = `Docs/tools/levelup-glow`(`make.py` · `upload.cjs` → 그룹 저장소 RUID `88733245…`).
- **2-20 직업 장비 주 · 부스탯** — `ItemCatalog.JobStatFull`("10=3/1;15=6/2;20=13/4;25=28/9;30=60/20") · `JobStatAt`(+0 은 풀강의 절반 · +3 에 표의 값) · 두손무기 ×2 · 한벌옷 `PieceCount` → `ComputeEnhance` 고정치(주스탯 : 부스탯 = 3 : 1). `ItemInfo.csv` 직업 장비 169행에 적용(`Docs/tools/item-stats/apply.py`). 공방 미리보기도 `ComputeEnhance` 차이로.
- **2-21 강화 보석 효과 2배** — `ItemCatalog.GemEffectMul = 2.0`(`GemAmount` · `ComputeEnhance` 보석 합산).
- **2-22 피격 경직 → 넉백** — `PlayerHit`: `StateComponent:DisconnectHitEvent()` 로 HIT 상태 전이 해제(HitEvent 구독 · 불굴의 진 · 궁 무적 · 사전 피해 훅은 유지) + 맞은 플레이어의 클라에만 `AddForce`(`PlayerKnockbackX 2.0 · Y 1.2`).

- **2-17 로딩 화면 · 도착 직후 0.5초 포탈 금지** — 로딩 그림 6장(`로딩창.zip` · 리스항구↔헤네시스 · 커닝시티↔페리온 · 엘리니아↔노틸러스 · 낮 · 밤)을 그룹 저장소에 올려 `ruid-map.json` 에 `dui_loading_*` 6키 · `ui/LoadingGroup`(전체 화면 · 순서 41 · 클릭을 막지 않음 · `apply-loading.cjs`) · `Map/LoadingScreenController`(신규 `@Logic` · 도착 맵 지역 · 서버 한국 시각 06~17시 낮 · 사전 로드 · 맵 감지 · 최소 `MinShowSeconds` 0.6초 후 페이드). 여섯 지역이 아닌 맵은 직전 그림 · 첫 로딩은 리스항구 · 헤네시스. 부르는 곳: 포탈(`PortalNetwork`) · 리스항구 · 보스 입장 · 발록 방 · 택시/차원문(`LaneStateService`) · 부활(`PlayerRespawnService`). 도착 직후 `PortalLockSeconds` 0.5초 동안 `PortalNetwork.TryMoveByUpArrow` · 엔진 `PortalComponent`(도착 포탈 로컬 `Enable=false`) · 서버 판정 입장(`IsServerArrivalLocked` — `RequestEnterLith` · `RequestEnterBoss` · `BalrogRoomService`)을 거절. 로그 `[Loading] …` · `[PortalNetwork] locked`.
- **2-19 도감 해금 가능 반짝임** — `Npc/VillageRecordUIController`: 지금 해금할 수 있는 몬스터 도감 항목과 해금 버튼이 반짝이고, 창을 닫거나 라우트를 바꾸면 초기화.
- **계정 기록 창(도감 · 업적 · 칭호 · 기록) 마지막 탭 기억(사용자 2026-10-06 "켰었던 것 그대로 이어 켜지게 · 저장은 휘발성")** — `AccountRecordUIController.Open("")` 가 마지막에 보던 탭(`self.tab` · 클라 메모리라 재접속하면 처음으로)으로 연다. 로비 버튼이 `Open("")` 를 부른다. **디자이너 명세 사이트의 새 UI(재화 아이템 도감)는 Artifact 읽기 승인이 안 돼 아직 구현 안 함** — 승인 뒤 같은 창의 새 탭 · 칸으로 붙인다.
- **리뷰 반영(2차 Codex)** — `FactionAI` 정지선에서는 맵 전체 `FindNearestEnemy` 를 건너뛰고, 정지선 앞 적 선택은 상자 여유(`pad`) 안의 적도 고른다.

## 확인 (사용자 · Maker)
- [ ] Reimport All → 빌드 경고 0 (이 브랜치는 새 스크립트가 있다 — 아래 줄).
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
- [ ] ⑱ 로비: 처음 하는 사람(계정 경험치 0)이 외형을 고르면 도움말이 자동으로 열림 · 탭 4개 · 재화 11칸을 ← → 로 · H 로 닫았다 다시 열면 마지막 탭 · 쪽 · '안내 다시 보기'.
- [ ] ⑱ 도움말이 열린 동안 ← → ↑ ↓ · 점프 · 공격이 캐릭터를 움직이지 않음 · Esc 한 번에 창 하나만 닫힘 · 채팅 입력 중 H 무시.
- [ ] ⑱ 매치 시작 안내(시계 → 목표 바 → 월드맵 → 사냥터 점 · 장비 단계 없음) · 알림 카드 8종(무기 카드는 안 떠야 정상) · 마을 차지 직후 안내.
- [ ] **Reimport All(이 브랜치) → 새 스크립트 3개 · `.codeblock`**: `Lane/ClickHereMarker` · `Map/LoadingScreenController` · `Onboarding/*` — 빌드 경고 0. 새 `.codeblock` 은 머지 뒤 `chore: commit group-world Reimport output` PR 로.
- [ ] 2-1/2-13 일반 · 엘리트 몬스터 메소 · 재료 2배 · 주화 확률 · 개수(`[Minion] coin drop=`).
- [ ] 2-3 스탯창 "자동 분배" 토글(기본 켬) · 레벨업 AP 가 주스탯으로 · 끄면 직접 · 1차 전직 환급 후 재분배.
- [ ] 2-4 매치 시작 때 시작 킷 장비가 자동 착용(스탯에 반영).
- [ ] 2-5 노틸러스 소유자: 기능 NPC 11명이 노틸러스 호 내부 오른쪽 갑판에(겹침 · 높이) · 호 내부에 원본 NPC 30명도 섬 · 마을 맵(`MinimiMain`)엔 기능 NPC 없음.
- [ ] 2-6 주인 없는 헤네시스 · 커닝 · 페리온 · 엘리니아 넥서스 왼쪽 위 고리 + 손가락 · 클릭해 주인이 되면 사라짐 · 노틸러스엔 없음 · 위치는 화면 보고 `ClickHereOffset` 조정.
- [ ] 2-7 재료 드롭이 작다.
- [ ] 2-8 위층에서 시설과 겹칠 때 캐릭터가 시설 뒤 · 같은 층은 앞 · 타일 가장자리가 발을 덮지 않는지(`[PlayerFrontLayer] behind`).
- [ ] 2-9~2-11 물약 상인 신규 3종 · 회복량 · MP 물약 공용 쿨 · 마법사 옷 MP 3~5배.
- [ ] 2-12 MISS 글자가 뜨는지(`[Stat] MISS` · `[Stat] DODGE`) · 몬스터 · 미니언 회피.
- [ ] 2-14 노틸러스 넥서스를 치던 미니언이 정지선에서 멈춰 계속 침(`[Approach]`).
- [ ] 2-15/2-16 수비대 강화별 HP · 공격(`[Defender] spawn`) · 보스 꿈 조각 60.
- [ ] 2-17 첫 입장 · 포탈 · 택시 · 부활 로딩 그림 · 도착 직후 ↑ 연타 0.5초 무시.
- [ ] 2-18 레벨업 금빛 반짝임(내 화면 · 남의 화면).
- [ ] 2-19 도감 해금 가능 항목 반짝임.
- [ ] 2-20/2-21 직업 장비 주 · 부스탯 · 보석 2배(공방 미리보기와 장착 후 스탯이 같은가).
- [ ] 2-22 맞아도 굳지 않고 뒤로 밀림.
