## 2026-09-06 — 아이콘 RUID 주입(장비·보석·물약) · 브랜치 `a/item-icons` (main `1cc6a74` 에서)

### 배경
PR #18·#20 까지 `ItemInfo.IconRUID` / `GemInfo.IconRUID` 는 전부 빈칸이라(S2 인계 예정) 장비창·인벤토리·강화·제작·물약 창의 아이콘 노드가 전부 비어 있었다. 계획서 §4-1b "아이콘은 `.ui` 에 박지 않고 데이터 열 → 런타임 `ImageRUID` 주입" 그대로, 데이터 열만 채운다.

### 데이터 (CSV 값만 · 헤더 변경 없음)
- **`ItemInfo.csv` 109/117행 `IconRUID` 채움** — 장비 96종(초보자 6 + 직업 90) = 아바타 아이템 썸네일 `thumbnail://<avataritem RUID>`(`searchAvatarItems` · 부위 카테고리 `weapon/cap/coat/pants/shoes/glove` · 티어 재질 + 부위로 검색, 직업 5개에 서로 다른 후보 배정) · 보석 12(`GEM_*`) + 빨간 포션 = 아이템 sprite RUID(`searchResources` · `sprite`/`item`)
- **`GemInfo.csv` 12/12행 `IconRUID`** — `ItemInfo` 의 `GEM_*` 행과 같은 RUID
- 🟡 **미주입 8행**(전부 MATERIAL · 창에 아직 안 나옴): `REGION_HENESYS_SPORE` `REGION_KERNING_THIEF_COIN` `REGION_ELLINIA_SPIRIT_DUST` `REGION_NAUTILUS_PIRATE_COIN` `REGION_PERION_WARRIOR_TOKEN` `DREAM_PIECE` `BRAND_SOULSTONE` `ENERGY_CORE` — WP2 지역재화 아이콘과 함께
- 검색 스크립트·후보 표는 스크래치(`icon_search.cjs` · `icon_search_equip.cjs` · `icon_apply.cjs` · `icon_map.json`) — 저장소 밖. 재현은 CSV 값이 정본

### UI (`CharacterGroup` 9 · `VillageWorkshopGroup` 22 아이콘 노드 · UIBuilder `patchComponent` 만 · 좌표 불변)
- `SpriteGUIRendererComponent.Color` 를 **흰색**으로 — 라이트 스킨 재색칠 때 회색 틴트가 남아 썸네일이 검게 곱해졌다
- `Type = Simple(0)` · **`PreserveSprite = None(0)`** — `AspectOnly(1)` 는 "원본 피벗대로 위치"까지 적용해 보석 sprite 가 슬롯 위로 밀렸다(런타임 실측). None 이면 64×64 칸에 맞춰 중앙

### 코드 (`Item/WorkshopUIController.mlua`)
- `RefreshGemPick`: 12칸 `Slot_{GemId}/Icon` 에 `GemInfo.IconRUID` 주입(없으면 숨김) — 수량·라벨만 쓰고 아이콘은 안 채우던 곳
- 강화 화면 `GemSlot_0~2/Icon`: 고른 보석 아이콘 주입 · 비면 "+" 텍스트만
- `FillPickCell`: 아이콘이 있으면 이름 대신 `+N`/`(장착)` 만 표시(아이콘을 가리지 않게) · 아이콘 없는 아이템은 이름 그대로
- `Item/InventoryUIController.FillCell`(인벤토리 그리드): 같은 규칙 — 아이콘이 있으면 이름 빈칸(수량·`+N` 은 별도 노드 · 이름은 툴팁), 없으면 이름

### 검증 (Play · 서버 `GiveItem` 로 시험 아이템 지급 · 스크린샷 4장)
- `enhance_pick`: 초보자 6종 + 직업 장비 썸네일 16칸 전부 원색 표시(틴트 수정 전엔 검게 보였음)
- `enhance_gempick`: 보석 12종 아이콘 전부 표시 · `PreserveSprite None` 뒤 슬롯 안 중앙
- `enhance`: 대상/결과 슬롯 나무 검 썸네일 · 보석 슬롯 0 다이아몬드 아이콘
- 런타임 에러 0 · `[LEA/LWA]` 신규 0

### 미결
- MATERIAL 8종 아이콘(WP2) · 장비 썸네일은 "티어 재질 + 부위" 검색 결과라 디자인팀 S2 에서 교체 가능(데이터 열만 바꾸면 됨)
