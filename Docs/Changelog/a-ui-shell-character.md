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

**미검증** — Maker `refresh` · Play 클릭 계약(§5-2: `UIMyInfo` 클릭 → 열림, 탭 전환, `BtnClose`). 사용자가 Play 를 시작할 때 `maker_logs` 로 `[CharUI]` 확인.
