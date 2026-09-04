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

**후속 수정 2건 (검증 중 발견 · `ui/CharacterGroup.ui` 만 · 좌표 규격 동일)**

- 버튼 글씨가 흰 버튼 위 흰색(기본 FontColor)이라 안 보임 → `BtnClose` · `Tab0~2` · `BtnSkill` FontColor `#33334D`. 칩 라벨은 어두운 칩 위 진한 색이라 `#F4F4F8` (Chip 14 + `MesoIcon`/`CoinIcon`)
- 🔴 `Stat/Left`(middle-left, +10) · `Stat/Right`(middle-right, −10) empty 컨테이너가 **첫 Play 는 정상인데 `.ui` 수정 후 `refresh` 부터 런타임 앵커가 중앙(0.5)으로 바뀌어 좌우가 뒤집힘**. 디스크 파일은 정상(AnchorsMin/Max 0/1), stop→play · refresh 반복해도 그대로. 같은 좌/우 앵커인 `Row/Chip`·`Cell`(스프라이트)은 정상. → `middle-center` ±235 · pivot 0.5 로 변경해 회피, refresh → Play 로 정상 확인
