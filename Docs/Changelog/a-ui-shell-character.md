## 2026-09-04 — UI 셸 + 캐릭터 창(스탯 탭) S1 뼈대 · 브랜치 `a/ui-shell-character`

WO-011 ⑤. 설계 정본은 계획서 `npc-hidden-koala.md` §4-1(셸) · §4-1b(RUID) · §4-2(캐릭터 창) · §5-2(클릭 계약).
전부 UIBuilder 로 생성·수정했고 Maker 는 켜지 않았다 — `refresh`(`.codeblock`) 와 Play 클릭 검증은 커밋 뒤에 한다.

**신규**

- `ui/CharacterGroup.ui` (68 엔티티) — 공통 셸(`Dimmer` · `Window` 980×720 · `TitleBar` · `BtnClose` 88×88 · `TabBar` 3탭 312×56 · `Content` 940×440 · `Footer`) + 스탯 탭(초상화 `Avatar`/`NameText` · 직업/레벨/경험치/SP 4행 + `BtnSkill` · 우측 STR/DEX/INT/LUK/공격력/방어력/이동속도/점프력/명중률/회피율 10행) + 장비·인벤토리 탭 자리(`Placeholder`, ⑥ 에서 채움) + `Footer` 메소·빅토리아 주화 카운터. 루트 `GroupOrder 2 · GroupType 1 · DefaultShow true`, `Dimmer`/`Window` 만 `enable=false`. 재사용 RUID 5종(창·패널·버튼·칩·셀) 적용, 폰트 `Maple`.
- `RootDesk/MyDesk/Stat/StatUIController.mlua` (`@Logic`, 전부 ClientOnly) — UUID 바인딩 28개(`write({bind})` 주입, 손편집 없음). `Toggle`/`Open`/`Close`/`SelectTab(0~2)`/`SetStatsCsv`(한 줄 문자열 — `[LEA-3036]` 회피)/`SetCurrency`. `BtnSkill` 은 로그만(B 소유 스킬 그룹 미연결).

**수정 — 전부 UIBuilder 실측 후 추가·토글·이동만, 사용자 배치 좌표 덮어쓰기 없음**

- `ui/StatusHUD.ui` — `UIMyInfo/BtnOpenCharacter` 투명 stretch 버튼 추가 (캐릭터 창 진입점)
- `ui/ToastGroup.ui` — 루트 `GroupOrder 2 → 6` (토스트 항상 최상단)
- `ui/WorldMapGroup.ui` — `Toolbar` top-center (0,-14) → **bottom-right (-14,14) pivot (1,0)** (월드맵 버튼 우하단 이관 · 사용자 요청). `OpenBtn` 내부 배치 그대로
- `ui/BattleHUD.ui` — 팀A/팀B 소환 리모컨 삭제: `LeftHUD/BtnBoar·BtnSlime·BtnStump` · `RightHUD` · `LeftTabWrap` · `RightTabWrap` 제거, `LeftHUD` 340×448 → 340×136. 남은 것 = `LvText`/`ExpText`/`MesoText`
- `RootDesk/MyDesk/Summon/BattleHUDController.mlua` — 리모컨 버튼 6개·탭 프로퍼티와 핸들러 제거. `SetMapMode` · `PushEconomy` · `RefreshUI` · `curMeso` 는 유지 (`WorldMapController` · `SummonManager` 가 쓴다)

**lint (`write()` 자동)** — error 0. 경고 3종: L007 탭 높이 56(<88 — PC 창이라 허용) · L006 `Cell` 텍스트 정렬 · L023 `TitleBar`/`BtnClose` 겹침(의도 — 닫기 버튼이 타이틀바 위에 얹힘)

**RUID 미주입 · 임시 노드** — 닫기 아이콘 없음 → 버튼 RUID + `"X"` 텍스트. 슬롯 프레임은 ⑥. `Avatar` 는 `AvatarGUIRendererComponent`(RUID 아님).

**check-integrity** — 전부 통과 / 경고 14건. CSV 미변경이라 ⑤ 로 늘어난 것 없음.

**Play 검증 (2026-09-05 · `f09d53b` 커밋 후 Maker `refresh` → Play, AI 가 직접 실행)**

- 빌드 로그 **42 → 42** (신규 0, 전부 보스·NPC 의 기존 LIA-1114/1115 Info). 런타임 Error 0
- `[HUD] BattleHUDController ready` · `[CharUI] StatUIController ready` → `UIMyInfo` **실클릭** `open=true` → Tab1 · Tab2 **실클릭** `tab=1` · `tab=2` ✓
- Tab0 · `BtnSkill` · `BtnClose` 는 `maker_mouse_input` 이 세 번째 클릭 이후 UI 에 클릭을 전달하지 않아(한 번에 한 클릭 · up/down 재시도 모두 무효) `maker_execute_script` 로 같은 메서드를 직접 호출해 `tab=0` · `BtnSkill clicked` · `open=false` 확인. 버튼 배선은 6개가 동일 패턴이라 Tab1/2 실클릭으로 증명됨
- 스크린샷: 월드맵 버튼 우하단 ✓ · 팀A/B 리모컨 사라짐 ✓ · 창·딤머·탭·Footer 렌더 ✓. `UIMyInfo` 는 사용자 재배치로 하단 중앙에 있고 진입 버튼은 그 안에 stretch 라 그대로 따라감

**임시 단축키 (사용자 요청 2026-09-05 · `Stat/StatUIController.mlua`)** — `_InputService` `KeyDownEvent`: **C = 캐릭터 창 토글 · ESC = 열려 있을 때만 닫기** (`WorldMapController` 의 M 키와 같은 패턴). 정식 키는 B 의 핫바(`LeftShift`)와 합의 후 확정(계획서 §11 #8). Play 에서 `maker_keyboard_input` C → `open=true`, ESC → `open=false` 확인.

**월드맵 — 빅토리아 지도 이미지로 교체 + 노드 재배치 (사용자 요청 2026-09-05 · 같은 브랜치)**

- `ui/WorldMapGroup.ui` — `Board` 배경 RUID `b93bf4b1…` → **`2d9daa9728d44379ab3f7e9f1e462d20`**(사용자 업로드 `KakaoTalk_20260903_151105800.png`), 보드 1274×950 → **1294×950**(이미지 2048×1504 비율). 노드 33개를 `메월드폴더/victoria_island_marker_coordinates.json` 마커 좌표로 재배치 — 스포크별 점 순서 = `MAP-ROUTE-RULES.md` 포탈 체인 순서(파랑=마을형 · 노랑=사냥터 · 보라=보스 · 허브=중앙 보라. 리스항구 스포크는 추가기획1 일자 체인: 초록별=마을 · 주황3=사냥터1·2·3 · 보라별=마노). 노드 크기 = 마커 히트 반경(46/36/34/32). 노드 스프라이트(흰 네모)는 **alpha 0.01**(이미지에 점이 그려져 있어 히트 영역만). ⚠ 추정 2곳: 페리온 `SouthernRidge` 는 JSON 누락이라 이미지 실측(932,328) · 노틸러스호 `MinimiShip` 은 마커가 없어 배 그림 위(1321,1055). 타이틀 "월드맵 — 파병 지역 선택" → **"월드맵"**
- `RootDesk/MyDesk/WorldMapNodes.csv` — X/Y 33행을 새 노드 좌표로 동기화(값만, 헤더·BOM·CRLF 보존)
- `RootDesk/MyDesk/WorldMap/WorldMapController.mlua` — **`regionClickEnabled=false`**: 월드맵은 보기 전용(hover 툴팁만). 노드 클릭의 선택 링·정보 박스·파병 리모컨을 끈다. 파병 UI 코드는 그대로 두고, 파병은 여섯갈래길 파병 담당관 NPC 창(`CommonNpcGroup/dispatch`)으로 옮긴다(사용자 결정)
- 내 위치 깃발(`HereMarker`) **절반 크기** — 패널 96×140→48×70, `Flag`/`Outline×4` 72×95→36×48(오프셋 ½), `Label` (0,50)→(0,31). 컨트롤러 `hereMarkerOffsetY` 88→**31**(깃발 끝이 노드 중심 −3 = 예전 +20 보다 깃발 반 높이만큼 아래), `hereFloatAmp` 9→**5** (사용자 요청 2026-09-05)
- hover 툴팁 `Title` 이 툴팁 위 경계 밖으로 반쯤 나가 글자 윗부분이 잘리던 것 수정 — top-center pos (0,−10)→**(0,−32)**, 헤더 띠(0..−60, Divider −60) 안에 들어옴 (사용자 요청 2026-09-05)
- hover 툴팁 배경 `Tooltip` Color alpha 1 → **0.8** (0.7 을 보고 0.8 로 · 색 (0.02,0.03,0.05) 그대로 · 사용자 요청 2026-09-05)
- 검증: 런타임에서 노드 스프라이트를 잠깐 켜 그려진 점 33개와 전부 겹침(스크린샷) · 깃발이 허브 점 위에 절반 크기로 · `ShowTooltipAt(14)` 로 띄운 툴팁 타이틀이 잘리지 않음(스크린샷) · `here marker at SixPathCrossway` 위치 일치 · `execute_script` 로 `OnRegionClick(14)` 호출해 선택 링·파병 리모컨 비활성 유지 확인 · 빌드 42→42. ℹ 기존 상태: `infoPanel`/`infoTitle`/`infoBody` 바인딩 대상(하단 정보 박스)은 `.ui` 에 이미 없어 런타임 nil — 컨트롤러가 `isvalid` 로 가드하고 있어 동작엔 영향 없음(이번 변경 아님). ⚠ `maker_mouse_input` 은 이 화면에서 클릭을 전달하지 못해 노드 실클릭은 사용자 확인(hover 툴팁·클릭 링 동작은 사용자가 이미 확인)

**② 이벤트 정의 4종 — 이 PR 에 합류 (사용자 결정 2026-09-05)**

- 신규 `Stat/StatRecalculatedEvent.mlua`(UserId, FinalStatsCsv, Source) · `Stat/ApAllocatedEvent.mlua`(UserId, AllocatedStatsCsv, RemainingAp) · `Stat/SpSpentEvent.mlua`(UserId, SkillId, Amount, RemainingSp) · `Item/EquipChangedEvent.mlua`(UserId, EquipSlot, PrevInstanceId, NewInstanceId) — 계약서 B-3 행 그대로. payload 는 문자열·정수만. `.codeblock` 4개 + `Item.directory` 는 refresh 생성물 그대로 커밋
- 🔴 WO-011 §4 의 `[LEA-3015]` 블로커 해소: 원인은 당시 `.directory` 깨짐. `Stat.directory` 가 정상 등록된 뒤에는 손으로 쓴 `@Event` 가 refresh 만으로 로드됨(Maker `Create EventType` 불필요). 검증: 빌드 42→42 · Play 에서 클라·서버 양쪽 4종 생성·필드 접근 OK · 런타임 Error 0
- 구독자는 아직 없음(③ `StatService` 가 첫 구독자). 정의가 먼저 머지되는 순서는 유지됨

**③ 스탯·데미지 — 이 PR 에 합류 (2026-09-05 · 경계면 파일 없음)**

- 🔴 **플레이어 공격 파이프라인은 A 가 개발하지 않는다** (사용자 결정 2026-09-05). `PlayerAttack.mlua` 수정은 되돌렸다. A 는 계산 API 만 제공한다 — B 가 자기 공격/스킬 파이프라인에서 `_StatService:CalcPlayerDamage(attacker, defender)`(MISS 면 0) 와 `_StatService:RollCritical(attacker)` 를 부르면 된다. 검증은 `execute_script` 로 API 를 직접 호출해 했다.

- 신규 `Stat/StatService.mlua`(`@Logic` 서버) — 유저별 원장 `base/equip/enhance/buff → final` 13종(계약서 `StatId`). 초보자 기본치 STR12 DEX5 INT4 LUK4 · 기본 명중 20 · 이동/점프 100%. 레벨업 AP 는 직업 비율(NOVICE 폴백 STR 6:DEX 4, `JobInfo.csv` 있으면 `PrimaryStat/SecondaryStat/ApRatio*` 읽음)로 **자동 분배** 후 `ApAllocatedEvent` → `Recalculate` → `StatRecalculatedEvent` → 소유 클라 캐릭터 창 갱신(`SetStatsCsv`/`SetCurrency`). 레이어 교체 API `SetLayerCsv(userId, "EQUIP|ENHANCE|BUFF", "str=1;attack=5")` · `SetMastery` · `SetJob` (⑥⑦·B 용). 이동속도·점프력은 `MovementComponent.InputSpeed/JumpForce` 에 원본×(stat/100), 최대 HP 보너스는 `PlayerComponent.MaxHp` 델타로 직접 반영 — **`StatApplyComponent` 는 두지 않음**(DefaultPlayer 모델 수정 회피). 무기 없을 때 임시 총공격력 `10 + (레벨−1)`, 숙련도 0.15
- 신규 `Stat/DamageFormula.mlua`(`@Logic` 순수식) — 메이플 원본식: `StatValue=주×4+부`, `Max=StatValue×공격력÷100`, `Min=Max×숙련도(0.15~0.9)`, 균등 랜덤, 방어 감산 `Raw×(1−Def/(Def+100))` 최소 1, 명중 임시식 `필요=2×대상Lv+대상회피` (비율 바닥 0.2), 크리 `5%+LUK×0.1%`(상한 50%), 파생 명중 `DEX×0.8+LUK×0.5` · 회피 `DEX×0.25+LUK×0.5`
- `Summon/SummonManager.mlua` — `ApplyLevelUpRewards` 에서 AP 를 `_StatService:GrantAp` 로 즉시 분배(원장엔 남는 0만) · `Push` 에서 `SetLevel`+`PushToClient` · `GetEcon` 게터 추가
- `Stat/StatUIController.mlua` — `SetStatsCsv`/`SetCurrency` 를 `@ExecSpace("Client")` 로(서버→소유 클라) · `Open()` 때 `_StatService:RequestStats()`
- ⚠ 미구현·보류: `EventBus`(계약서 B-1) 가 없어 이벤트는 `StatService` Logic 의 `SendEvent` 로 발행(구독은 `@EventSender("Logic","StatService")`) · `LevelTable` 임시 곡선은 현행 자리표시자(NeedExp=Level)로 검증 가능해 WP1 로 · 난이도 배수 적용점 없음(WP0) · 일반 몹 방어·회피 0(`MonsterInfo` 열 없음)
- 검증: 빌드 42→42 · 런타임 Error 0 · `[Stat] recalculated INIT` → Lv1 범위 1~5 · 20회 굴림 전부 [1,5] 안·MISS 0 (수정 전 기본 명중 0 은 Lv1 몹도 50% MISS → 기본 명중 20·HitBase 0 으로) · 크리 4/100 · `+3exp` → Lv3, AP 5×2 자동분배 `str+3 dex+2` ×2 → STR18 DEX9, 범위 1~9 · 캐릭터 창에 초보자/Lv3/0÷3/SP6/STR18…/공격력 1~9/명중 9/회피 4 표시(스크린샷) · InputSpeed 2.0·JumpForce 0.9 유지(100%)

**⑥ 아이템·장비·인벤토리 — 이 PR 에 합류 (2026-09-05)**

- 신규 `RootDesk/MyDesk/ItemInfo.csv` + `.userdataset` — 계약서 A-2 헤더(`check-integrity` CANONICAL 일치, C1·C3 통과). **26행**: 초보자 장비 6(`WEAPON_WOODEN_SWORD` 공17 숙련0.5 · `HAT_WHITE_BANDANA` 방3 · `TOP_WHITE_UNDERSHIRT` · `BOTTOM_BLUE_JEAN_SHORTS` · `SHOES_RED_RUBBER_BOOTS` 방2 · `GLOVES_LEATHER` 방1, 내구 100 · 강화 3단) + `MATERIAL` 20(`GEM_*` 12 · `REGION_*` 5 · `DREAM_PIECE` `BRAND_SOULSTONE` `ENERGY_CORE`, 스택 999). ⚠ `MAT_*` 몬스터별 재료 15행은 `MonsterRecruit`(WP2) 가 몬스터↔재료를 정할 때 추가. **`IconRUID` 전부 빈칸(S2 에서 주입)** — 그동안 셀·슬롯엔 이름 텍스트로 표시
- 신규 `Item/ItemCatalog.mlua`(`@Logic` 양쪽 지연 로드) · `Item/InventoryService.mlua`(`@Logic` 서버 — 인스턴스 원장 `iid/itemId/count/enh/dur`, 스택 합치기, `GiveItem/RemoveItem/RemoveInstance/CountItem`, 직렬화 `"iid:itemId:count:enh:dur:e|…"`, `RequestInventory` Server RPC. **임시 스타터 킷**: 첫 접속에 장비 6 + 다이아몬드 5 + 헤네시스 포자 12 — 상점(⑦) 생기면 `GiveStarterKit=false`) · `Item/EquipService.mlua`(`@Logic` 서버 — 6슬롯 원장, `RequestEquip(instanceId)`/`RequestUnequip(slot)` Server RPC: 소유·EQUIP·ReqLevel·ReqJob 검증 → `EquipChangedEvent` → `_StatService:SetMastery`+`SetLayerCsv(EQUIP)` → 클라 push) · `Item/InventoryUIController.mlua`(`@Logic` 클라 — 슬롯 6·상세·해제·필터 4·GridView 9열, `grid.ItemEntity = ItemTemplate` 런타임 주입, 셀 클릭 핸들러는 `cell.Id` 로 재사용 관리, 장비 클릭 = 장착 요청·그 외 = 상세만. 낙관적 UI 없음)
- `ui/CharacterGroup.ui` 68 → **129 엔티티**: `Content/Equip`(SlotArea 십자 6슬롯 100×100 + Detail: 아이콘·이름·요구·스탯 5행·내구도 바·해제) · `Content/Inventory`(FilterBar 4 + ItemTemplate + `Grid` GridView 96×96·9열·간격 6). 바인딩 31개. 🔴 **stretch `empty` 의 직속 자식 컨테이너는 전부 `middle-center`** — FilterBar 가 top-center 로는 refresh 뒤 중앙으로 붕괴(Stat/Left·Right 와 같은 증상, 메모리에 규칙화)
- `Stat/StatUIController.mlua` — `Toggle` 이 `Open()/Close()` 를 거치도록(C 키·클릭도 서버 요청을 타게) · `Open()` 에서 `_InventoryService:RequestInventory()`
- 검증: 빌드 **42 → 69 (전부 Info · Warning 0)** — 새 Logic 간 심볼 참조 LIA-1113 13건 + any 필드 접근 LIA-1114 14건 · 런타임 Error 0 · C 로 열면 `catalog loaded 26` → `starter kit given` → `inventory 8 items` 그리드 8칸(이름 표시) · `RequestEquip(i1)` → `[Stat] EQUIP attack 10→27` · 무기 슬롯 "나무 검" · 상세 "나무 검 / Lv1·전직업 / 공격력 +17 / 내구도 100/100" · `RequestUnequip` → attack 10, 뷰 8 · 필터 MATERIAL → 2 · 스크린샷 2장. `check-integrity` 전부 통과(ItemInfo C1·C3 OK, 경고 9 — `EnhanceTable/GemInfo/GemDropTable` 미구현 3건은 ⑦)
- 미검증·보류: 실클릭(마우스 툴 한계 → `execute_script` 로 같은 메서드 호출) · 내구도 감소 훅 없음(표시만) · 소비 아이템 사용 없음(M1 밖) · ToastGroup 거절 토스트 미연결(로그만) · 상세 패널의 작은 회색 상자 1개(원인 미확인 · S2 에서 정리)

**⑦ 강화·보석 + 공방 창 — 이 PR 에 합류 (2026-09-05)**

- 신규 CSV 3종(+`.userdataset`, CANONICAL 헤더 일치): `EnhanceTable` 3행(M1 확률 100%·파괴 0 · 메소 1000/3000/8000 · 보석 1/2/3 · AddDefense 1/2/3) · `GemInfo` 12행(계약서 GemId ↔ StatId 1:1, AddPerLevel 공/마 2·이동/점프 2·명중/회피 3·HP 30·MP 15·4스탯 1) · `GemDropTable` 4행(일반 몹 임시 · **BOSS 행은 보스 로스터 확정 후** · 드랍 처리 자체는 WP2 `DropTable`)
- 신규 `Item/ItemEnhancedEvent.mlua`(계약서 B-3 확정 이벤트 — 파일이 없어 발행 도메인 `Item/` 에 정의 · append-only 로 `InstanceId`·`GemIdsCsv` 추가) · `Item/EnhanceService.mlua`(`RequestEnhance(instanceId, gemIdsCsv)` Server RPC: 장비·최대단계·보석 수/보유·메소 검증 → 판정 → 보석·메소 차감 → `ApplyEnhance` → `ItemEnhancedEvent` → 장착 중이면 `EquipService.RecalcLayer` → 클라 push. 거절/결과는 `_UIToast:ShowMessage` + 공방 창 상태줄. ⚠ 난이도·연성(B) 배율 적용점은 아직 없음 — `MesoCost` 그대로, `CostResolver` 생기면 한 곳만 교체) · `Item/WorkshopUIController.mlua`(`@Logic` 클라 — 셸·라우트 7개 토글, 강화 3상태 기계(§5-3), 장비 선택 GridView, 보석 12칸 고정(자식 이름 `Slot_{GemId}` 로 연결), 미리보기(클라 예상값), 연타 방지 `waiting`, `OnUpdate` 에서 Codex `VillageNpcUIController.Pending*` 소비(`VillageWorkshopGroup` 이면 `Open(route)`+`ClearPendingRequest`), **임시 단축키 E** 토글·ESC 닫기)
- `ItemCatalog` — `GemInfo`/`EnhanceTable` 로더(`GetGem`·`GetEnhanceRow`·`GemIdOfItem`) · `InventoryService` — 인스턴스 `gems` 기록(`ApplyEnhance`), 직렬화 7번째 필드 `"DIAMOND+DIAMOND"` · `EquipService.RecalcLayer` — **ENHANCE 레이어**(장착 장비의 보석 AddPerLevel 합 + 단계별 AddDefense) 도 `SetLayerCsv(ENHANCE)` · `SummonManager.SpendMeso` 신설 · `InventoryUIController` — 7번째 필드 파싱, 갱신 시 `_WorkshopUIController:OnInventoryUpdated()`
- 신규 `ui/VillageWorkshopGroup.ui` **124 엔티티** (GroupOrder 2 · DefaultShow true · Dimmer/Window enable=false): 셸(TitleBar "공방"·X·Content 940×460·Footer CostLabel+BtnPrimary "강 화") + `Enhance`(TargetSlot 140 · → · ResultSlot · StatPreview PRow0~3 · GemBar GemSlot_0~2 100 · RateRow · StatusText) + `EnhancePick`(PickTemplate + PickGrid 9열 + 뒤로) + `EnhanceGemPick`(Slot_{GemId} 12칸 6×2 130×140 · Name/StatLabel/Count · 뒤로) + `Craft/Repair/Potion/ShopEquip` 자리표시. 바인딩 33개. 컨테이너는 전부 middle-center
- 검증: 빌드 **69 → 68 (Warning 0, 전부 Info)** · 런타임 Error 0 · 메소 5000 지급 → E 로 열림(`route=enhance`, 인벤 8) → 검 장착(EQUIP attack 27) → `OnPickCell(i1)`+`OnGemPicked(DIAMOND)` → 버튼 활성 → `OnPrimary` → `-meso 1000 → 4000` · `enhance OK +1` · **ENHANCE 레이어 attack 27→29 · defense 0→1** · 결과 `ok=true level=1` · 스크린샷: "나무 검 +1 → 나무 검 +2", 상승 능력치 방어력 +2(다음 단계 미리보기), 보석 칸 2/3 활성, 100%, "메소 3000 · 보석 0 / 2", 강화 버튼 비활성(S1 상태)
- 미검증·보류: 실클릭(마우스 툴 한계) · NPC 클릭 → `Pending*` 경로(④ 스포너가 마을 앵커 확정 후 활성) · 강화 실패/파괴 분기(M1 100%) · craft/repair/potion/shop_equip 라우트 내용(WP2) · 보석 아이콘 RUID(S2)

**⑧ 로비·결과·관전 S1 뼈대 — 이 PR 에 합류 (2026-09-05)**

- 신규 `ui/LobbyGroup.ui` **43 엔티티**(GroupOrder 2 · 불투명 `Bg` #101820 · Window 980×720: TitleBar "매치 로비" · X · `Players` 5행(Avatar·Name·HeartCount·ReadyMark) · `Difficulty`(DiffTitle · Star_1~5 72×72 · DiffDesc · GateWarn 빨강) · Footer CostLabel "준비 n / m" + BtnPrimary "준비"/"준비 취소") · `ui/MatchResultGroup.ui` **52 엔티티**(GroupOrder **5** — 새 창 2·팝업 3 위, 토스트 6 아래 · Bg 0.85 · TitleBar(제목 가변) · ReasonText · RankHeader 5열(순위·이름·발록 피해·넥서스 HP·레벨 = 순위 기준 순서) · RankRow_0~4 + EliminatedMark · MyReward · Footer "로비로") · `ui/SpectateGroup.ui` **9 엔티티**(GroupOrder **1** HUD 층 · TopBar 900×64 alpha 0.7: "관전 중" · Tab_0~3 · 자유 · 나가기)
- 신규 `Match/LobbyUIController.mlua` · `Match/MatchResultUIController.mlua` · `Match/SpectateUIController.mlua`(전부 `@Logic` 클라, 바인딩 14/7/7) — 서버 문자열만 그린다: `SetLobbyCsv("ready=2 / 4;diff=3;host=1;me=1;desc=…;warn=…;p0=이름|심장|준비;…")` · `SetResultCsv("title=…;reason=…;reward=…;me=0;r0=순위|이름|발록피해|넥서스HP|레벨|탈락;…")` · `SetTargetsCsv("이름|이름|…")`. 버튼(별·준비·큐 취소·로비로·탭·자유·나가기)은 `_MatchLobbyGateway` / `_MatchSessionLogic` / `_SpectateService` 가 있으면 호출, 없으면 로그 (전부 WP1/WP4 · `Match/` A 소유). 방장만 별 활성. `Match.directory` 는 refresh 생성물
- 검증: 빌드 **68 → 83 (Warning 0 · 전부 Info — 미래 Logic 심볼 LIA-1113 15건)** · 런타임 Error 0 · `execute_script` 로 샘플 문자열을 넣어 세 화면 스크린샷: 로비(4명·준비 2·★3·경고·준비 취소) · 결과(4행·내 행 ▶·3위 탈락·보상·로비로) · 관전(탭 3·자유·나가기)
- 보류: 로비 안내 NPC → `LobbyGroup` 라우팅(NPC 라우터 `Pending*` 소비는 공방과 같은 패턴으로 WP1 에서) · 큐 취소·나가기 확인 팝업(`PopupGroup` 재사용) · 관전 카메라 사양 미결 · `RankReward`·`DifficultyConfig` 표(WP0)

**후속 수정 2건 (검증 중 발견 · `ui/CharacterGroup.ui` 만 · 좌표 규격 동일)**

- 버튼 글씨가 흰 버튼 위 흰색(기본 FontColor)이라 안 보임 → `BtnClose` · `Tab0~2` · `BtnSkill` FontColor `#33334D`. 칩 라벨은 어두운 칩 위 진한 색이라 `#F4F4F8` (Chip 14 + `MesoIcon`/`CoinIcon`)
- 🔴 `Stat/Left`(middle-left, +10) · `Stat/Right`(middle-right, −10) empty 컨테이너가 **첫 Play 는 정상인데 `.ui` 수정 후 `refresh` 부터 런타임 앵커가 중앙(0.5)으로 바뀌어 좌우가 뒤집힘**. 디스크 파일은 정상(AnchorsMin/Max 0/1), stop→play · refresh 반복해도 그대로. 같은 좌/우 앵커인 `Row/Chip`·`Cell`(스프라이트)은 정상. → `middle-center` ±235 · pivot 0.5 로 변경해 회피, refresh → Play 로 정상 확인

**⑨ 몬스터 피격 반응 + 경험치 버그 — 이 PR 에 합류 (2026-09-05 · 사용자 지시 "최소 이 둘은 고쳐야 한다")**

- **(2) 경험치 원인**: 일반 몹 모델(`Models/Monsters/Shroom.model` 등)에 `script.FarmReward` 가 아예 없어 처치 보상 경로(`FarmReward.HandleHitEvent` → `LastAttacker` → `SummonManager.GrantKillReward`)가 돌지 않았다. `MonsterInfo.Exp` 는 1 로 정상이고 처치자 귀속(`HitEvent.AttackerEntity`)도 정상 → "주는데 인식을 못 하는" 경우가 아니라 **아예 안 주는** 경우였다. → `Spawn/MonsterSpawner.SpawnSlot` 이 스폰 직후 `FarmReward` 를 붙이고(없을 때만) `MonsterId` 를 채운다. 검증: 여섯갈래길 스포아 처치 → **exp 0→1 · Lv1→2 · 동전 드랍**
- **(1) 피격 반응** — `Monster.mlua` `HandleHitEvent` → 살아 있으면 `ReactToHit(attacker, damage)`: 공격자 **반대 방향**으로 `KnockbackDistance` 0.25 유닛을 `KnockbackSteps` 5번(0.03s) `rb:SetWorldPosition` 으로 살짝 미끄러뜨림(`AddForce` 는 이동 AI 가 매 틱 덮어 실측 dx −0.014 = 1px 남짓 → 위치 직접 이동으로 **−0.31**), 스프라이트를 `HitFlashSeconds` 0.12 동안 붉게(1, 0.55, 0.55) 했다가 복구, `StateChaseMonster` 가 있으면 `CastFreezeLeft = HitStunSeconds` 0.2 로 잠깐 멈춤. **보스 규칙**: `BossSkillRunner.pendingSkill`(패턴 시전 중)이면 무시 · 피해 < MaxHp × `BossKnockbackHpRatio`(1%) 면 무시 · `BossInfo.AiType = static`(피아누스 8510000) 또는 `MonsterInfo.AiType = static` 은 절대 안 밀림(`IsStaticMonster`). 죽는 타격엔 반응 없음(사망 처리 우선)
- ⚠ **피격 표정 sprite 는 미완**: 일반 몹 모델의 `StateAnimationComponent.ActionSheet` 가 전부 비어 있어(런타임 실측 `actionSheet{}`) 네이티브 HIT 상태에 붙을 클립이 없다. 붉은 플래시로 대체. 77종 hit 클립 RUID 수집(`msw-search`) + ActionSheet 주입은 별도 작업 → WO §7 미결 #16
- 검증: 빌드 **83 → 90 (전부 Info — Monster/MonsterSpawner 의 any 필드 접근 LIA-1114)** · 런타임 Error 0 · `ReactToHit(player, 5)` 직접 호출 → +0.25s **dx −0.31**(몹 x −13.7 · 플레이어 −5.7 → 왼쪽 = 반대 방향 ✓) · 플래시 색 적용/복구 ✓ · `FarmReward` 부착 `monsterId=120100` ✓ · 보스 규칙은 코드 검증만(보스맵 미이동)

**⑩ 스탯 ↔ 실제 스펙 동일화 + 개발용 스탯 리모컨 — 이 PR 에 합류 (2026-09-05)**

- 🔴 **실측으로 잡은 원인 (사용자 체감 "이동속도·점프력이 매칭 안 됨" 이 맞았다)**: DefaultPlayer(MapleTile) 걷기 속도는 `MovementComponent.InputSpeed` 가 아니라 **`RigidbodyComponent.WalkSpeed`** 가 정한다 — InputSpeed 2→4 로 올려도 최고 속도 **7.2/s 그대로**, WalkSpeed 1.4→2.8 이면 **14.2/s(정확히 2배)**. 게다가 WalkSpeed 는 `@Sync` 가 아니라 서버에서 써도 클라(로컬 플레이어 물리 주체)에 안 간다. 점프는 `JumpForce` 가 먹지만 **높이 ∝ JumpForce²**(0.9→0.97 · 1.35→2.15). 그래서 지금까지 이동속도 스탯은 전혀 안 먹었고 점프는 과하게 먹었다
- `Stat/StatService.ApplyToEntity`: `rb.WalkSpeed = 원본 × speed/100` · `mv.JumpForce = 원본 × √(jump/100)`(**점프력 150% = 높이 1.5배**) · 소유 클라로 `ApplyMovementOnClient(walk, jump)` Client RPC(InputSpeed 도 예전처럼 같이 씀). 레이어에 **DEV** 추가(`SetLayerCsv(uid, "DEV", …)` · 합산 base+equip+enhance+buff+dev · BUFF 는 B 몫이라 리모컨이 안 건드림) · `GetLedger(userId)`
- 신규 `Stat/DevStatRemote.mlua`(`@Logic` 양쪽 · `Enabled` 속성 — 🔴 배포 전 false) + `ui/DevStatRemoteGroup.ui`(**73 엔티티** · GroupOrder 2 · 우측 400×600 패널, 시작 꺼짐 · 9행 STR/DEX/INT/LUK/공격력/방어력/이동%/점프%/MaxHP × **−10/−1/+1/+10** · 적용값 3줄 = WalkSpeed(기본·%)·InputSpeed / JumpForce(기본·%·높이 배수) / 데미지 범위·명중·회피·MaxHP 보너스 · `초기화` · `데미지 굴림 ×5`). **` (BackQuote) 키 토글**. 버튼 → `RequestAdjust(statId, delta)` Server RPC → DEV 레이어 → 재계산 → 엔티티 반영 → 서버가 `SetReadout` 으로 **실제 엔티티 값**을 회신(낙관적 UI 없음). 바인딩 15개(행은 `Entity` 로 묶고 자식 `Value`/`BtnM10…` 은 `GetChildByName`)
- 검증: 빌드 **90 → 90** · 런타임 Error 0 · ` → `[DevRemote] open=true` · 이동 +100 → `client movement applied walk=2.8` → 최고속도 **7.2 → 13.4/s** · 점프 +100 → JumpForce 0.9→1.27 → 높이 **0.97 → 1.92** (≈2배 ✓) · 굴림 3, 2, 5, 5, 3 (범위 1~5 ✓) · 초기화 → `dev=` 빈 값 · 스크린샷 1장(값·(+델타)·적용값 3줄·굴림 결과 렌더 ✓)
- 🔴 **공격 동일화의 한계 (A 범위 밖)**: 실제 타격 데미지는 B 소유 `PlayerAttack.CalcDamage` 가 아직 `return 50` 고정, `CalcCritical` 은 상시 참. A 는 `_StatService:CalcPlayerDamage(attacker, defender)` / `RollCritical(attacker)` 를 제공했고 리모컨 굴림이 그 값을 보여준다. **B 가 그 두 줄만 바꾸면 화면 수치 = 실제 데미지** (WO §8)

**인벤토리 hover 툴팁 (사용자 요청 2026-09-05)**

- `ui/CharacterGroup.ui` 129 → **153 엔티티**: `Content/Inventory/Tooltip`(320×300 · pivot 좌상단 · 아이콘·이름·요구·능력치 5행·내구도 바 — 장비 탭 상세와 같은 구성, `해제` 버튼만 없음) + `ItemTemplate` 에 `UITouchReceiveComponent`(hover 수신 · 월드맵 노드와 같은 방식). `Item/InventoryUIController.mlua`: 상세 채우기를 `FillItemView` 로 공용화, 셀마다 `UITouchEnter/Exit` 핸들러(클릭 핸들러와 함께 `cellHandlers[cell.Id]` 로 관리·해제), `ShowTooltip(iid)`/`HideTooltip`. 필터·인벤 갱신·셀 해제 때 숨김
- 🔴 **위치 계산**: GridView 복제 셀은 `UITransformComponent` 가 전부 (0,0)·같은 월드 모서리를 돌려준다(엔진 내부 배치) → `FillCell` 의 index 로 칸 좌표(`Grid` anchoredPosition·RectSize + `CellSize`/`Spacing`/`FixedCount`)를 계산해 셀 오른쪽 위에 붙이고, 오른쪽으로 넘치면 왼쪽·아래로 넘치면 위로 접는다. ⚠ 스크롤 오프셋은 미반영(27칸 넘게 쌓여 스크롤되면 어긋남 — 후속)
- 🔴 **"작은 회색 상자" 원인 확정**: `empty()` 컨테이너 아래 **stretch 스프라이트가 refresh 뒤 100×100 중앙으로 붕괴**한다(`Durability/Bg`). 장비 상세·툴팁의 `Durability/Bg`·`Label` 을 명시 크기(middle-center)로 변경. ⚠ 새 엔티티를 넣은 `.ui` 는 **refresh 한 번으로는 런타임에 안 잡히고 stop→refresh 두 번째에 잡혔다**(같은 파일의 컴포넌트 추가는 첫 refresh 에 반영됨)
- 검증: `execute_script` 로 `ShowTooltip` 호출 → 1번 칸 (−360,156) · 5번 칸 (48,156) · 8번 칸은 오른쪽 넘침으로 (−70,156) 왼쪽 접힘 · 스크린샷(툴팁이 칸 옆에, 회색 상자 사라짐). ⚠ 실제 마우스 hover 는 `maker_mouse_input` 이 UI 에 전달하지 못해 사용자 확인 필요(배선은 월드맵 hover 와 동일)

**플레이어 데미지 임시 배선 + 캐릭터창 "빅토리아 주화" 표기 (사용자 지시 2026-09-05)**

- `PlayerAttack.mlua`(B 소유 · ⚠ 임시 두 줄) — `CalcDamage` `return 50` → `_StatService:CalcPlayerDamage(attacker, defender)`, `CalcCritical` 상시 참 → `_StatService:RollCritical(attacker)`. B 의 공격 파이프라인(`maplestory-skill-maker` 계약)이 오면 그쪽이 덮는다. 검증: 스포아(HP 25) 타격 `[Stat] dmg 4/3/1 (range 1~5)` → HP 25→18→17 정확히 일치 · 한 방이 아니라 여러 방
- `ui/CharacterGroup.ui` Footer — 칩 "주화" → **"빅토리아 주화"**(48→120 폭, 값 텍스트 448 로 이동). 값 자체는 아직 원장이 없어 0(미니언·엘리트 킬 보상 WP1)

**⑪ 몬스터 피격·사망 모션 복원 — 일반 사냥몹 74종 ActionSheet 일괄 채움 (2026-09-05)**

- 원인: 보스 9종·좀비버섯만 `StateAnimationComponent.ActionSheet` 가 차 있고 `MonsterInfo` 의 일반 몹 모델은 전부 빈 값 → HIT/DEAD 상태로 들어가도 재생할 클립이 없어 피격·사망 모션이 안 나왔다(`Monster.SetupDieDestroyDelay` 도 die 키가 없어 0.6 고정)
- 수집: 모델의 `SpriteRUID` → `findPacksContaining` 으로 리소스팩(`mob/{id}.img`)을 찾아 `stand/move/hit1/die1(/attack1/jump/fly)` 클립 RUID 를 뽑았다(70종). `MonsterInfo.Id` 와 팩 ID 가 다른 4종(달팽이 100000→`mob/0100100`, 아이언호그→`mob/4090000`, 시니컬한 주황버섯→`mob/2300102`, 분노한 뿔버섯→`mob/2300101`)은 한국어 이름 검색으로 보완. 쓰로우백 리본돼지·아이언호그 2종은 모델 파일 자체가 없어 제외. 결과표 `scratchpad/mob_clips.json`
- 적용(`ModelBuilder` · 74개 `.model`): `stand/move/chase/wander/jump/hit/die` (+ `attack` 20종 · `fly` 4종). `chase`·`wander`·`jump` 는 move 클립으로 대체(스크립트 상태 `WANDER`/`CHASE` 의 키는 소문자 상태명). `SpriteRUID` 는 그대로 두었고(지금 보이는 그림 유지 — 40여 종은 stand 가 아닌 move 클립을 쓰고 있음), 좀비버섯·피아누스는 건드리지 않음. `StateComponent.IsLegacy` 는 기존 보스 모델과 같이 **미설정** — 네이티브 StateSet AI 경로에서는 그대로 재생됨
- 검증: 빌드 **90 → 93 (전부 Info)** · 런타임 Error 0 · 스포아 런타임 `sheet{stand,move,chase,wander,jump,hit,die}` · **피격**: 상태 `WANDER → HIT → IDLE`(0.4s) · **사망**: `[Stat] dmg 131` → HP 17→−114 → `WANDER → DEAD`(t=0.10) → **`DestroyDelay` 0.6→0.76 (die 클립 0.66s 실측 자동)** → t=0.75 엔티티 제거 → 리스폰 · 보상 exp/동전 정상. ⚠ `maker_mouse_input`/키 공격은 몹이 걸어 다녀 빗나가서 서버에서 `PlayerAttack:AttackNormal()` 을 직접 불러 검증(공격 키는 `LeftControl=Attack` 확인)
- ⚠ 미확인 1건: 첫 검증 때 SP001 스포아가 4 데미지 한 방에 죽은 로그(보상까지 지급). 이후 SP003 은 4·3·1 로 정확히 깎였음. 재현되면 `Monster.ReactToHit` 슬라이드(발판 끝 낙하?)를 의심
- 🔴 Maker 되쓰기: refresh 를 여러 번 도는 동안 Maker 가 `ItemInfo/EnhanceTable/GemInfo/GemDropTable/EliteMaterialInfo/EliteMonsterInfo` CSV+userdataset · `Item.directory`/`Match.directory` · `.ui` 11개를 자기 포맷으로 되썼다(내용 변경 아님 — CSV 는 UTF-8 BOM 추가, `.directory` 는 StudioVersion, `.ui` 는 재직렬화). 커밋 전 되읽기 규칙 그대로

**⑪-2 피격·사망 클립이 실제로는 안 그려지던 것 수정 — 상태별 클립을 스크립트가 직접 튼다 (사용자 지적 2026-09-05)**

- 사용자 확인: ActionSheet 를 채워도 스포아가 피격·사망 모션을 안 보였고, 걷는 몹이 stand 그림으로 미끄러졌다("기어다님"). 실측: 죽은 뒤 15초 남겨 놓고 확대 스크린샷 → **stand 그림 그대로**. `StateComponent.IsLegacy=false` 를 75종에 넣어 봐도 동일 → 일반 몹(StateMoveMonster/StateChaseMonster + StateSet)에선 `StateAnimationComponent` 자동 재생이 안 먹는다(보스가 클립을 `SpriteRUID` 직접 대입으로 다루는 이유와 같음). IsLegacy 는 다시 제거(보스 모델과 동일하게 미설정)
- `Monster.mlua` — **Pattern A**: `HandleStateChangeEvent`(서버·Self) → `ApplyStateClip(state)` = `ActionSheet[StateStringToAnimationKey(state)]` 를 `SpriteRUID` 에 대입(같은 클립이면 재대입 안 함 — 첫 프레임 멈춤 방지). 스폰 직후 `InitStateClip` 으로 현재 상태 클립. `BossSkillRunner` 가 있는 보스는 건드리지 않음. 넉백은 사용자 피드백대로 **한 번에 0.2 유닛**(`KnockbackSteps` 5→1 · 3번 미끄러져 보이던 것). 고정형(static)은 넉백·경직만 빼고 플래시·hit 클립은 그대로
- 검증(SixPathCrossway · 스포아 = 걷기형, 서버에서 달팽이 `monster100000` 스폰 = 추격형): 스포아 `WANDER → move 클립(4a0350)` / `IDLE → stand(f84d50)` 전환 · 달팽이 `IDLE → stand(2db944)` / `CHASE → move(663faf)` · **피격** 스포아 `HIT → hit1(1f5395)` 0.5s 뒤 `IDLE → stand` · 달팽이 `HIT → hit(a3feaf)` → `CHASE → move` · **사망** 달팽이 `DEAD → die1(a25ed7)` · 확대 스크린샷에 옆으로 누운 달팽이 시체(스포아는 서 있음) ✓ · 빌드 Error 0
- 적용 범위: `script.Monster` 를 쓰는 모든 몬스터(74종 + 좀비버섯) — 상태 키는 두 StateSet 이 `IDLE/DEAD/HIT/WANDER` · `IDLE/DEAD/HIT/CHASE` 뿐이라 ActionSheet 의 `stand/die/hit/wander/chase` 로 전부 덮임. `SpriteRUID` 가 move 클립이던 40여 종도 스폰 직후 IDLE→stand 로 정리됨(더 이상 제자리 걷기 없음)

**라이트 스킨 일괄 적용 — 창 흰색 · 박스 회색 · 글자 흰색(안 B · 사용자 지시 2026-09-05)**

- 대상 6개 `.ui`: `CharacterGroup` · `VillageWorkshopGroup` · `LobbyGroup` · `MatchResultGroup` · `DevStatRemoteGroup` · `SpectateGroup`(TopBar). 스킨 RUID 6종만 흰 9-slice(`83b7e4bf`)로 바꾸고 틴트: 창 (1,1,1) · 타이틀/칩/버튼 (0.50~0.55) · 셀/행/슬롯 (0.60) · 패널 (0.68). 글자: 박스 위 = 흰색 + 검은 외곽선 0.2 / 흰 창 위(Footer 재화·ReasonText·RateRow·StatusText·Hint) = 진회색. 아이콘·게이지 Fill·Dimmer·전체 배경 Bg 는 제외. 좌표·크기 변경 없음
- 스크립트 `scratchpad/ui_recolor_light.cjs` — 역할은 이름으로 판정(Chip/Icon/Header/ReadyMark → 칩, Cell/Row/Bg/Slot → 셀, 버튼 컴포넌트 → 버튼, 창 = Window/Panel). 스크린샷: 캐릭터 창 스탯/장비/인벤(툴팁) · 공방 · 리모컨. ⚠ 흰 글자 + 연회색 박스는 대비가 낮아 회색을 한 단계 진하게 잡았다(첫 시안 0.72 → 0.60). 더 진하게/연하게는 팔레트 숫자만 바꾸면 됨
- **2차 (사용자 피드백)**: 큰 바탕 **노란색** (0.99, 0.88, 0.42) · 글자 전부 **굵게**(`FontStyle 1`, 외곽선 0.2) · 회색 한 단계 더 진하게(칩·타이틀 0.42 · 버튼 0.46 · 셀 0.52 · 패널 0.60). 스크린샷(캐릭터 창 스탯 탭) 확인

**몬스터 튜닝 3건 (사용자 피드백 2026-09-05)**

- **넉백 서서히 + 전 타입 동일**: `Monster.ReactToHit` — 0.2 유닛을 `KnockbackSeconds` 0.5초 동안 `KnockbackSteps` 10번(50ms)에 나눠 `rb:SetWorldPosition`. 서버 타이머 해상도가 ~50ms 라 25단계(20ms)는 1.2초로 늘어져서 10단계로. `HitStunSeconds` 0.5(HIT 상태와 같이 끝나고 stand 복귀). 걷기형·추격형 모두 같은 코드(추격형은 `CastFreezeLeft` 로 추격 이동을 그 동안 멈춤) · 보스는 최대 HP 1% 이상 피해만 · 고정형(피아누스)만 제외(플래시·hit 클립은 유지). 실측(달팽이 · 추격형): dx −0.02 → −0.20 이 0.1초 간격으로 고르게(−0.02/−0.04/−0.08/−0.12/−0.14/−0.18/−0.20) · 상태 `HIT → CHASE` 복귀
- **hop 몹 이동속도 +30% · 점프력 −10%** (주황버섯이 너무 느림): `MonsterInfo.csv` hop 23행 `MoveSpeed` 빈칸 → **0.65**(모델 기본 InputSpeed 1.0 × `MoveSpeedFactor` 0.5 = 0.5 의 130%) · `JumpForce` 0.9 → **0.81**. `Spawn/MonsterSpawner.SpawnSlot` 이 `MonsterInfo.MoveSpeed` 양수면 스폰 뒤 `MovementComponent.InputSpeed` 에 씀(BossSpawner 와 같은 방식 · 지금까지 일반 몹은 이 열을 안 읽었다). 스폰 직후 InputSpeed 실측 0.5(=팩터 적용 뒤)라 덮어쓴 값이 유지됨. 카탈로그 파싱 확인 `GetMoveSpeed(1210102)=0.65 · GetJumpForce=0.81`. ⚠ 실제 체감은 커닝시티 공사장(주황버섯)에서 확인 필요
- **피격 판정 = 스프라이트 크기**: `Monster.FitHitboxToSprite`(서버 OnBeginPlay) — stand 클립 첫 프레임의 Width/Height/PivotPixel/PPU 로 `HitComponent.BoxSize`·`ColliderOffset` 을 계산(`MonsterAttack` 의 공격 상자와 같은 식). 보스(`BossSkillRunner`)는 손으로 맞춘 값 유지. 실측: 스포아 0.36×0.36 (offset 0,0.18) · 달팽이 0.37×0.26 · **스톤골렘 1.75×1.56 (offset −0.03,0.78)** — 예전엔 전부 기본 0.67×1.42 였음. `FitHitbox=false` 로 끌 수 있음 → **2차에서 기본 false 로 바뀜(아래)**

**몬스터 튜닝 2차 (사용자 피드백 2026-09-05)**

- **hop 몹 공중 포즈 고정**: `Monster.OnUpdate`(서버) — `StateChaseMonster.CanJumpToTarget` 인 몹만, `RigidbodyComponent:IsOnGround()` 가 false 로 바뀌는 순간 `SpriteRUID = ActionSheet["jump"]` + `StartFrameIndex=EndFrameIndex=0`(첫 프레임 하나로 고정 · 플레이어 점프 포즈처럼), 착지하면 `EndFrameIndex=2147483647` 로 되돌리고 현재 상태 클립 복귀. 공중 고정 중엔 `ApplyStateClip` 이 hit/die 외 전환을 무시(CHASE↔IDLE 로 포즈가 풀리지 않게). 실측(주황버섯 · 0.1초 샘플): 이륙 `ground=false hold=true clip=jump frames=0..0` → 착지 `ground=true hold=false clip=move frames=0..MAX`, 점프 4회 연속 동일
- **넉백 0.25초 밀리고 0.25초 정지**: `KnockbackSeconds` 0.5→**0.25**, `KnockbackSteps` 10→**5**(50ms 해상도), `HitStunSeconds` 0.5 유지(HIT 상태 길이). 실측(빨간 달팽이 `ReactToHit` 직접 호출 · 0.05초 샘플): dx 0.04/0.08/0.12/0.12/0.16/0.20 (~0.3초) 이후 0.70초까지 0.20 고정
- **피격 판정 사전 계산 → 모델에 저장**: 런타임 `FitHitboxToSprite`(클립 PreloadAsync + 프레임 측정) 대신 리소스 API 로 stand 클립 첫 프레임을 **오프라인에서 재서** 74개 모델 `HitComponent.BoxSize`·`ColliderOffset` 에 기록(`Docs/tools/monster-hitbox/{harvest,apply}.cjs` + `mob_hitbox.json`). `Monster.FitHitbox` 기본값 **false**(수동 폴백으로 남김). 실측: `SpawnByModelId("monster5130101")` 직후 서버 readback **1.76×1.56 (−0.02,0.78)** — 런타임 보정 없이 모델값 그대로. 대조군 Maker 저작 `FactionMonsterA` 0.67×1.42 동일 경로로 읽힘. ⚠ 첫 refresh→play 에서는 (0,0) 이 읽혔고 두 번째 stop→refresh→play 에서 반영됨(Maker 모델 캐시 · 형식 문제 아님)

**몬스터 튜닝 3차 + ⑫ (사용자 피드백 2026-09-05 오후)**

- **넉백이 땅을 뚫던 것**: 원인은 `ReactToHit` 이 y 를 그대로 두고 x 만 옮겨서 경사 발판에서 표면 아래로 파고들던 것. 수정: 매 단계 새 x 바로 위(+0.3)에서 아래로 `FootholdComponent:Raycast` 를 쏴 밟을 발판을 찾고 `Foothold:GetYByX(nx)` 로 y 를 표면에 맞춘다(`Monster.GetFootholdComponent` — 맵 직속/타일맵 자식 탐색 후 캐시). 발판이 없거나(절벽) 세로 발판이면 안 밀고, 발 높이와 0.35 넘게 차이 나는 층은 무시. 공중이면 그 단계는 건너뜀. 1차 시도(현재 발판 범위 안에서만 이동)는 경사 세그먼트가 0.26 폭이라 한 걸음에 막혀 폐기. 실측(엘리니아 마을 · 경사 −0.19/+0.11/+0.07/−0.02 네 지점 · 좌우 양방향): dx 0.04씩 0.20 까지, `fy−y = 0.000` 전 샘플, 이후 `IsOnGround=true` 유지. hop 몹은 넉백 중 `IsOnGround` 가 한 틱 false 로 읽혀 점프 포즈로 깜빡일 수 있어 `knocking` 플래그로 공중 판정을 건너뜀(주황버섯 실측: 넉백 14 샘플 중 jump 클립 0회). **보강(검토 반영)**: 단계 게이트를 `IsOnGround` 에서 "레이캐스트가 발 아래 0.4 안에 발판을 찾았는가" 로 바꿈(텔레포트 직후 한 프레임 false 로 단계가 빠지지 않게) · 밀리는 중에는 새 넉백을 겹치지 않음(연타·다단히트로 0.2 씩 누적 방지) · 발 높이−발판선 오프셋을 첫 단계에 한 번 재서 피벗이 발이 아닌 스프라이트도 표면 추종 · 타이머 콜백이 파괴된 엔티티를 만지지 않게 `isvalid(self.Entity)` 선검사
- **보스 사망 모션 강제**: `Monster.ApplyStateClip` 이 `BossSkillRunner` 보스도 `die` 키만은 적용(프레임 창 0..MAX · PlayRate 1 로 되돌림 — 시전 중 죽은 경우 대비). `BossSkillRunner.HoldCastSprite` / `RestoreSprite` 는 죽은 뒤 스프라이트를 건드리지 않음(DEAD 전이가 "상태 변화"라 시전 클립으로 되돌리던 경로 차단). 보스 8종 모델 전부 ActionSheet 에 `die`/`hit` 있음. 실측(마노 `Dead()` 직접 호출): DEAD 전이 0.1초 안에 die 클립(f430051f) · frames 0..MAX · rate 1.00, DestroyDelay 1.75 뒤 소멸. **보강(검토 반영)**: 프레임 창·PlayRate 되돌림을 보스 전용에서 **die 전체**로 옮김(hop 몹이 공중에서 죽으면 점프 포즈 0..0 창이 남아 die 가 첫 프레임에 얼던 것 · `airborneHold` 도 해제) · 죽은 뒤엔 die 외 클립을 대입하지 않음(시체 피격으로 HIT 전이가 와도 die 유지)
- **⑫ 부위별·요구레벨별 강화 고정 상승 CSV — 구현**: 사용자 규칙(요구레벨이 높을수록 단계당 상승이 크고, 10렙 장비 풀강 ≈ 20렙 장비 기본 ×1.05). 신규 `EnhanceSlotBonus.csv`(+`.userdataset`) — 키 `EquipSlot,ReqLevel,EnhanceLevel`, `Add*` 13열은 `ItemInfo.Base*` 순서, 6부위 × 티어 1/10/20/30 × 3단계 = 72행. 값은 가정 기본치(무기 17→27→40→56 · 모자 방 3→6→10→15 · 상/하/신 2→4→7→11 · 장갑 1→2→4→6)에서 `base(L)+Σbonus = 1.05×base(L+10)` 으로 역산(무기 3/4/4 · 5/5/5 · 6/6/7 · 8/9/9 등, 1행 #Note 에 기록). 티어 매칭 = 아이템 `ReqLevel` 이하 최대(요구레벨 15 → 티어 10). `ItemCatalog.LoadSlotBonus/GetSlotBonus` · `EquipService.RecalcLayer` ENHANCE 레이어 = 표 누적 + 보석 · `WorkshopUIController.RefreshEnhance` 미리보기에 다음 단계 고정치 포함. `EnhanceTable.AddDefense` 는 이 표로 이관(값 0 · 열 유지). 계약서 A-2-8b 에 표 등록 · `check-integrity` CANONICAL 등록(C1/C3/C4 통과 72행). 실측: `slot bonus loaded: 72 rows` · WEAPON Lv1 +1/+2/+3 = 3/4/4 · HAT 요구레벨 15 +2 → 티어 10 값 2 · 장갑 +1 = 빈 표(0) · +4 = nil · 없는 부위 nil. **보강(검토 반영)**: `EnhanceTable.AddDefense` 를 코드에서 아예 읽지 않음(값 0 에 의존한 이중 합산 위험 제거) · T1 방어구 고정 방어 보정 · `GemInfo` 노트·계약서 신규 CSV 목록 갱신

**⑫ B안 확정 (사용자 결정 2026-09-05 밤)** — "보석은 어느 스탯에 줄지만 고르고, 양은 표가 정한다. 보석 1개당 일정 증가. 30렙은 하이스펙 OK"
- 의미 변경: `EnhanceSlotBonus` 의 `AddDefense` = 보석 무관 **단계별 고정치**(방어구만 · 툴팁 초록), 나머지 `Add*` = 그 단계에 넣은 **보석 1개당** 그 보석 스탯의 상승량(툴팁 보라). `GemInfo.AddPerLevel` 은 미사용(0). 무기 외 부위는 공/마 0 → 다이아·사파이어를 넣을 수 없음(보석 선택 화면 비활성 "(효과 없음)" · 서버 `EnhanceService` 거절). 앞서 넣었던 `SlotBonusApplies` 마스킹은 필요 없어져 제거
- 값(보석 1개당): 무기 공/마 T1 2/2/2 · T10 3/3/2 · T20 4/3/3 · T30 5/5/5(주스탯 보석 6개 풀강 = 12/15/19/30 → 규칙 대비 T1 17→29 vs 28.4 · T10 27→42 vs 42 · T20 40→59 vs 58.8 · T30 하이스펙) · STR/DEX/INT/LUK 2/3/4/6 · 명중/회피 2/3/4/6 · 이동/점프 1/1/2/2 · HP/MP 10/20/30/50 (티어순). 고정 방어: 모자 1/1/1 · 1/2/2 · 2/2/2 · 3/3/3, 상/하/신 0/1/1 · 1/1/1 · 1/2/2 · 2/3/3, 장갑 0/0/1 · 1/1/1 · 1/1/1 · 2/2/2
- 계산은 `ItemCatalog.ComputeEnhance(def, enh, gems)` 한 곳(`{fixed, gem}` 반환 · 보석은 넣은 순서대로 단계별 GemCount 만큼 소비) — `EquipService.RecalcLayer`(ENHANCE 레이어) · 강화창 미리보기(`GemAmount`) · 인벤 툴팁/장비 상세가 같은 식. 보석 선택 화면은 이 장비 다음 단계에서 올리는 양을 라벨에 표시("공격력 +2")
- **툴팁·장비 상세 강화치 표시**(사용자 확정): 각 스탯 행이 `전체 (기본 <초록>+고정</초록> <보라>+보석</보라>)` — 색은 초록 `#5BE36B` · 보라 `#C77DFF`(리치텍스트). 장착 슬롯 항목엔 보석 목록이 없어 같은 iid 의 인벤토리 항목에서 가져온다(`GemListOf`)
- 실측(서버 지급 → `ApplyEnhance` 직접 호출): 나무 검 +3(다이아·다이아+힘·토파즈+다이아+다이아) → gem {attack=8, str=2, maxhp=10} fixed {} · 하얀 두건 +2(토파즈·민첩+토파즈) → fixed {defense=2} gem {dex=2, maxhp=20} · 장착 후 ENHANCE 레이어 {attack=8, defense=2, dex=2, maxhp=30, str=2} · `GemAmount` 두건 다이아 0 / 검 다이아 2 / 두건 토파즈 10 · 클라 툴팁 문자열 "공격력 = 25 (17 <보라>+8</보라>)" · "방어력 = 5 (3 <초록>+2</초록>)" · 런타임 에러 0
