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

**후속 수정 2건 (검증 중 발견 · `ui/CharacterGroup.ui` 만 · 좌표 규격 동일)**

- 버튼 글씨가 흰 버튼 위 흰색(기본 FontColor)이라 안 보임 → `BtnClose` · `Tab0~2` · `BtnSkill` FontColor `#33334D`. 칩 라벨은 어두운 칩 위 진한 색이라 `#F4F4F8` (Chip 14 + `MesoIcon`/`CoinIcon`)
- 🔴 `Stat/Left`(middle-left, +10) · `Stat/Right`(middle-right, −10) empty 컨테이너가 **첫 Play 는 정상인데 `.ui` 수정 후 `refresh` 부터 런타임 앵커가 중앙(0.5)으로 바뀌어 좌우가 뒤집힘**. 디스크 파일은 정상(AnchorsMin/Max 0/1), stop→play · refresh 반복해도 그대로. 같은 좌/우 앵커인 `Row/Chip`·`Cell`(스프라이트)은 정상. → `middle-center` ±235 · pivot 0.5 로 변경해 회피, refresh → Play 로 정상 확인
