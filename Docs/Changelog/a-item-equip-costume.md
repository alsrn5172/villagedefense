## 2026-09-08 (8) — 초보자 기본 방패

(7) 에서 방패 슬롯을 만들었지만 초보자에겐 방패가 없어 7번째 칸이 계속 비어 있었다.

- **`SHIELD_WOODEN` "나무 방패"** — 사각 나무 방패(`shield` 카테고리) · Lv1 · 직업 제한 없음.
  수치는 하얀 두건과 동일(방어력 3 · 내구 100 · 30메소) — 나무 검과 짝
- **초보자 킷에 추가** (`InventoryService.EnsureUser`) — 첫 접속 지급 목록이 6부위 → **7부위**
- **`CraftRecipe` NOVICE 1행** (리스항구 초보자 상점 · 하얀 두건과 같은 비용 · 메소만)
- ItemInfo 127행 · CraftRecipe 106행 · `check-integrity` 통과

> ⚠️ (5) 에서 **초보자 장비 상인을 비활성**했으므로 `NOVICE` 레시피 7종은 현재 접근할 NPC 가 없다.
> 초보자 장비는 첫 접속 지급으로만 들어온다(그걸로 충분하지만, 되사고 싶으면 그 NPC 행을 `true` 로 돌리면 된다).

---

## 2026-09-08 (7) — 방패 슬롯 신설 + 도적은 아대만 노출

### 1. 7번째 장비 슬롯 `SUBWEAPON` (방패)
사용자 결정: **전사는 한손검 + 방패**. 방패는 아바타의 `CustomSubWeaponEquip` 이라 슬롯 신설이 필요했다.

- **`EquipSlot` 열거값 6종 → 7종** (`SUBWEAPON` 추가 · 계약서 A-2 §4 · A-2-8b 갱신)
- **`ItemInfo` 방패 3종** `SHIELD_WARRIOR_T10/20/30` — Stone Shield · 강철 방패 · 스틸 에인션트 실드 (category `shield`)
  수치는 같은 티어 모자와 동일: 방어력 **6 / 10 / 15** · 내구 150/200/250 · 가격 150/500/1500
- **`CraftRecipe` 3행** (같은 티어 모자 레시피와 동일 비용) · **`EnhanceSlotBonus` `SUBWEAPON` 12행**(모자 값 복제)
- **두손무기 ↔ 방패 상호 배제** — 두손무기는 한손+보조 슬롯을 함께 점유한다. 막지 않고 **상대를 자동 해제**한다(장비는 인벤토리에 남아 손실 없음). 토스트로 알린다
- `EquipService.slots` 7개로 확장 → `Serialize` · `RecalcLayer`(방어력 합산) · `ApplyCostume` 이 전부 따라온다
- `.ui` 장비 탭에 `Slot_SUBWEAPON` 추가 — `Slot_GLOVES` 를 통째로 복제해 **빈자리 (135,-55)** 에만 놓았다. 기존 6칸 좌표·스킨은 손대지 않았다. HEAD 대조: 161→165 엔티티, **손실 0 · 기존 컴포넌트 변화 0**
- `InventoryUIController` — `slotSubweapon`/`iconSubweapon`/`enhSubweapon` 프로퍼티 + 클릭 배선 + `RefreshSlots` 7칸 (UUID 는 빌더가 주입)

### 2. 도적은 아대만 노출
사용자 지시(후에 변경 가능): 도적 단검 3종을 목록에서 뺀다.

- `ItemInfo` `WEAPON_THIEF_T10/20/30` → `Enabled=false`
- `CraftRecipe` `RECIPE_WEAPON_THIEF_T10/20/30` → `Enabled=false`
- ⚠️ **`ItemInfo.Enabled` 는 현재 코드가 읽지 않는다**(`ItemCatalog` 가 로드만 하고 필터에 안 쓴다). 실제로 목록에서 빼는 건 `CraftRecipe.Enabled` 다. 행은 남겼으니 되살릴 땐 둘 다 `true` 로
- 이미 가진 단검은 그대로 장착·사용된다(회수하지 않는다)

### 검증
- `node Docs/tools/check-integrity.cjs` 전부 통과 — ItemInfo 126행 · CraftRecipe 105행 · EnhanceSlotBonus 84행
- 🟡 **런타임 미검증** — 방패 제작 → 장비 탭 7번째 칸에 표시 → 장착 시 캐릭터 왼손에 방패, 두손검을 끼면 방패가 자동 해제되는지 확인 필요

### 참고 (작업 중 발견)
이 워크트리를 Maker 가 열고 있는 동안 `map/*.map` · `*.userdataset` · `ui/*.ui` 가 내 변경과 무관하게 바뀌고 `Models/{Effects,Farm,Terrain}.directory` 3개가 지워졌다. `git add -A` 로 한 번 삭제가 커밋돼 되돌렸다(`cb245b6` → `e69cf15`). **커밋은 경로를 명시**하고, `.ui` 작업 전에는 Maker 를 닫는다.

---

## 2026-09-08 (6) — 무기별 공격 모션 (활은 활 모션, 두손검은 두손 모션)

### 원인 — 활이 "이름만 활"이었다
공격 모션은 스크립트가 고르는 게 아니라 **엔진이 장착된 아바타 아이템의 category 로 자동 선택**한다
(`weapon`=한손 → `swingO*` · `twohandweapon`+활 계열 → `shoot1`).

그런데 조회해 보니 궁수 무기 3종이 이랬다:

| ItemId | 실제 아바타 아이템 | category |
|---|---|---|
| `WEAPON_ARCHER_T10` | 고구려 활 | **weapon(한손)** |
| `WEAPON_ARCHER_T20` | 바람의 기사 활 | **weapon(한손)** |
| `WEAPON_ARCHER_T30` | 모험가 패스파인더 활 | **weapon(한손)** |

이름만 활이고 카테고리는 한손이라, 활을 들고 **한손 검처럼 휘둘렀다.** (2026-09-06 아이콘 주입 때
`searchAvatarItems` 를 부위 카테고리 `weapon` 으로만 돌려서 생긴 일 — 아이콘용으론 문제가 없었다.)

해적 너클(`너클메이스` · `잊혀진 영웅의 너클`)과 도적 단검은 **원래 제 종류가 맞았다.**

### 데이터
- **활 3종 RUID 교체** → 진짜 `twohandweapon` 활: Beginner Bowman's Bow(T10) · Hunter's Bow(T20) · 합금 활(T30)
- **`ItemInfo.csv` 에 `AvatarSlot` 열 신설**(맨 뒤 · `TWO_HAND` 만 표기, 빈칸 = 부위 기본)
- **신규 6종**
  - 전사 두손검 `WEAPON_WARRIOR_2H_T10/20/30` — 양손검 · 라 투핸더 · 강인한 전사의 투핸드소드 (`twohandweapon`)
    공격력 **34 / 50 / 70** (한손 27/40/56 대비 +25% · 방패를 못 드는 대신). 나머지 수치는 같은 티어 한손검과 동일
  - 도적 아대 `WEAPON_THIEF_CLAW_T10/20/30` — 개구리 아대 · 괴물손 아대 · 강철주먹 아대 (`weapon` 한손)
    수치는 같은 티어 단검과 **동일**. 모션만 다르다
- **`CraftRecipe.csv` 6행 추가** — 원본(같은 직업·티어) 레시피의 지역·재화·비용을 그대로 복사
- ItemInfo 123행 · CraftRecipe 102행 · `check-integrity` C1/C3 통과

### 코드
- `ItemCatalog` — `avatarSlot` 로드 + `IsTwoHand(itemId)`
- `EquipService.ApplyCostume` / `StatUIController.RefreshPreview` — 무기를 한손/두손 슬롯으로 갈라 넣고 반대쪽은 `""` 로 비운다(이중 장착 방지). 월드와 캐릭터창 프리뷰가 같은 규칙
- `EquipService.EquippedItemId` 신설 (RUID·ItemId 조회를 한 군데로)

### 아직 안 한 것
- **전사 방패** — 사용자 결정은 "전사는 한손검 + 방패". 방패는 `CustomSubWeaponEquip` 이라 **7번째 장비 슬롯 신설**이 필요하다(`EquipSlot` 열거값 · `EquipService.slots` · 장비 탭 `.ui` 슬롯 · `InventoryUIController` 의 6슬롯 하드코딩 · `EnhanceSlotBonus` 부위 행). 구조 변경이라 분리했다
- 전사 T20 아바타가 `광선 대검`(대검 이름인데 한손 카테고리)이다. 한손검으로 남길 거면 나중에 교체하는 게 좋다

### 검증
- `node Docs/tools/check-integrity.cjs` 전부 통과 (경고 3건은 기존 것)
- 🟡 **런타임 미검증** — 활 장착 후 공격 시 `shoot1`(활 쏘기), 두손검은 `swingT*`, 아대·너클은 각자 모션이 나오는지 육안 확인 필요

---

## 2026-09-08 (5) — 제작한 장비를 장착할 수 없던 것 + 장비 구매·수리 NPC 비활성

### 1. 🔴 제작 장비 장착 불가 — 전직이 없는데 직업 제한이 걸려 있었다

`EquipService.RequestEquip` 는 `su.job ~= def.reqJob` 이면 거절한다. 그런데:

- **`_StatService:SetJob` 은 저장소 어디에서도 호출되지 않는다.** 전직은 B 담당이고 `JobChangedEvent` 구독처가 아직 없다 → 모든 유저가 영구 `NOVICE`
- `CraftRecipe` 결과물은 전부 `WEAPON_WARRIOR_T10` 같은 **직업 장비**(`ReqJob` 값 있음)
- 따라서 **제작한 장비는 누구도 입을 수 없었다.** 초보자 6종만 `ReqJob=""` 라 입혀져서 "제작한 것만 안 된다"로 보였다
- 게다가 거절이 전부 **서버 `log` 뿐**이라, 클릭해도 아무 일도 안 일어나는 것처럼 보였다(가장 헷갈리는 부분)

**고친 것 (`Item/EquipService.mlua`)**

- 아직 전직하지 않은 유저(`job` 이 `""` 또는 `"NOVICE"`)는 **직업 제한을 받지 않는다.** 전직이 붙으면 그때부터 "다른 직업 장비"만 막힌다 — 규칙을 없앤 게 아니라 전직 이후로 미룬 것
- **`DenyEquip(userId, reason)` 신설** — 거절 사유를 요청자에게 토스트로 알린다(`CraftService.Deny` 와 같은 방식). 4가지: 인스턴스 없음 / 장비 아님 / 레벨 부족(`Lv10 부터 · 현재 LvN`) / 직업 불일치
- `ReqLevel` 제한은 그대로다. T10 장비는 여전히 Lv10 이 필요하고, 이제 그 이유가 화면에 뜬다

### 2. 장비 구매 · 수리 NPC 비활성 (행 삭제 없이)

`RootDesk/MyDesk/FunctionalNpcCatalog.csv` 3행을 `Enabled=false` 로:

| CatalogNpcId | 이름 |
|---|---|
| `VD_WORKSHOP_REPAIR` | 수리 장인 |
| `VD_SHOP_EQUIP` | 지역 장비 상인 |
| `VD_SHOP_EQUIP_NOVICE` | 초보자 장비 상인 |

- `Npc/NpcCatalog.mlua:148` 이 `Enabled=false` 행을 건너뛰므로 스폰·UI 라우트가 함께 사라진다
- `MapNpcs_Village.csv` 에 이 3종의 위치 오버라이드 행이 없어 따로 남는 것도 없다 (확인함)
- `RepairService` / `ShopService` 코드와 `RepairConfig` / `ShopItem` 표는 **그대로 둔다** — 되살릴 땐 CSV 행만 `true` 로
- 장비 구입은 원래 `CraftRecipe` 한 표를 제작 장인과 공유하므로(2026-09-06 결정), **제작 장인이 남아 있어 장비 획득 경로는 유지된다**

### 검증
- `node Docs/tools/check-integrity.cjs` **전부 통과** — 경고 3건은 기존 것 그대로이고 새 경고 없음
- 🟡 **런타임 미검증** — 제작 → 인벤토리에서 클릭 → 실제로 장착되는지, 레벨이 모자랄 때 토스트가 뜨는지, 마을에서 수리·장비 상인이 사라졌는지

---

## 2026-09-08 (4) — 무기 기본 강화치를 공격력으로 (`FixedAttack` 열 신설)

### 배경
(3) 에서 드러난 것: 보석과 무관한 부위 고정 상승치(툴팁 초록)가 `AddDefense` 하나뿐이라, `WEAPON` 행은 `AddDefense=0` → **무기는 강화해도 기본 상승이 0** 이었다. 사용자 지시(2026-09-08): "무기는 공격력이 들어가야 되는 거고, 열이 없으면 만들고 +2 로 기본값 넣어놔".

`AddAttack` 을 재사용할 수 없다 — 그 열은 이미 **"다이아 1개당 상승량"** 이라 의미가 다르다.

### 데이터 (`RootDesk/MyDesk/EnhanceSlotBonus.csv`)
- **`FixedAttack` 열 신설** — 규칙대로 **맨 뒤**(`#Note` 뒤)에 추가. 중간 삽입 금지
- `WEAPON` 12행(4티어 × 3단계) = **2** · 나머지 60행 = 0
- 값 2 는 전 티어·전 단계 균일한 **기본값**이다. 밸런싱(티어별 차등)은 아직 안 했다
- `.userdataset` 은 열을 선언하지 않으므로 변경 불필요 (등록 정보만 들어 있다)
- 72행 전부 필드 수를 검사한 뒤 기록했다 (쉼표 포함 노트로 깨지는 행 0)

### 코드
- **`ItemCatalog.LoadSlotBonus`** — `cols` 에 `fixedattack = "FixedAttack"` 추가. 보석 `statKey` 와 겹치지 않는 키라 보석 합산 루프에는 절대 안 잡힌다
- **`ItemCatalog.ComputeEnhance`** — `fixed.attack` 에 `row.fixedattack` 누적 (기존 `fixed.defense` 와 나란히). 이 한 곳만 고치면 **장비 상세·인벤 툴팁·서버 ENHANCE 스탯 레이어가 전부 따라온다**(`EquipService.RecalcLayer` 가 같은 함수를 쓴다)
- **`WorkshopUIController.RefreshEnhance`** — 미리보기 합계에 고정 공격력 반영 + 제목 줄을 무기면 `기본 공격력 +N`(초록), 방어구면 `기본 방어력 +N`(초록)

### 계약서
- `Docs/스키마-계약.md` A-2-8b — 헤더에 `FixedAttack` 추가, "부위 고정 상승치"를 부위별 열 표로 다시 씀
- `Docs/tools/check-integrity.cjs` CANONICAL 헤더 갱신 → **C1 헤더 검사 통과(72행) 확인**

### 검증
- `node Docs/tools/check-integrity.cjs` → `[C1] EnhanceSlotBonus (72행) OK` · `[C3] 기본키 OK` · 전부 통과
- 🟡 **런타임 미검증** — 무기를 강화해 `+N (기본 <초록>+2</초록> ...)` 이 뜨는지, 캐릭터 공격력이 실제로 오르는지 육안 확인 필요

---

## 2026-09-08 (3) — 강화 수치 초록/보라 구분이 안 보이던 것 (IsRichText 누락)

### 증상
장비를 강화해도 능력치가 **하얗게 합쳐진 숫자 하나**로만 보였다. 기본 고정 상승치(초록)와 보석 상승치(보라)가 구분되지 않았다.

### 원인 — 코드가 아니라 `.ui` 메타데이터
색 구분 로직은 이미 있었다. `InventoryUIController.FillItemView` 가 `총합 (기본 <color=#5BE36B>+f</color> <color=#C77DFF>+g</color>)` 로 조립하고, `WorkshopUIController.RefreshEnhance` 도 같은 두 색을 쓴다.

문제는 받는 쪽이었다. **프로젝트 전체에서 `TextGUIRendererComponent.IsRichText` 가 명시된 텍스트 노드는 공방 강화 미리보기 5개(`Enhance/StatPreview/PreviewTitle` · `PRow0~3/Cell`)뿐**이었고, 나머지 244개는 필드 자체가 JSON 에 없었다. `.ui` 는 필드가 빠지면 컴포넌트 기본값으로 안 떨어지는 경우가 있다(`ActivePlatform` 과 같은 함정 — builder-protocol-ui §3.9). 그래서 미리보기에서만 색이 나오고, **장비 자체를 볼 때는 태그가 무시돼 하얗게** 나왔다.

### 고친 것 (`.ui` 15개 노드 · `IsRichText: true` 명시 · 다른 필드·좌표 불변)
`FillItemView` 가 `<color>` 를 써 넣는 statList 의 `Row0~4/Cell` 전부:

- `CharacterGroup` — 장비 탭 상세 `Detail/StatList` 5개 + 인벤토리 hover 툴팁 `Tooltip/StatList` 5개
- `VillageWorkshopGroup` — 아이템 상세 `Detail/StatList` 5개 (`FillItemView` 재사용)

HEAD 대조: 엔티티 161/230 그대로 · 손실 0 · 컴포넌트 목록 변화 0 · `IsRichText` 만 10/5개 변경.

### 이때 드러난 것 → (4) 에서 고침
`EnhanceSlotBonus` 에서 `AddDefense` 만 보석과 무관한 고정치이고 나머지 `Add*` 열은 "그 단계 보석 1개당 상승량"이다(⑫ B안 · 2026-09-05 확정). `WEAPON` 행은 `AddDefense=0` 이라 **무기에는 초록(기본 상승)이 아예 없었다.** 사용자 확인 결과 이건 의도가 아니어서 아래 (4) 에서 CSV 열을 추가해 고쳤다.

### 검증
- 정적: `.ui` HEAD 대조(위) · `color=#` 를 쓰는 코드가 이 두 파일뿐임을 확인
- 🟡 **런타임 미검증** — 강화한 장비를 장비 탭/인벤 툴팁/공방에서 열어 초록·보라가 실제로 칠해지는지 육안 확인 필요

---

## 2026-09-08 (2) — 캐릭터창(C) 스탯 탭에 아바타 프리뷰

### 배경
장착이 월드 캐릭터에는 반영됐지만, C 로 여는 캐릭터창에서는 확인할 수 없었다.

### 원인 — 노드는 있었는데 컴포넌트가 하나 빠져 있었다
`CharacterGroup.ui` 의 `Window/Content/Stat/Left/Portrait/Avatar` 에 `AvatarGUIRendererComponent` 는 이미 있었지만 **`CostumeManagerComponent` 가 없었다.** MSW 문서("Representing Avatars in the UI") 기준 UI 아바타는 이 둘을 같은 엔티티에 달아야 그려진다. 렌더러만 있으면 입힐 대상이 없어 빈 채로 남는다.

### `.ui` (`ui/CharacterGroup.ui` · UIBuilder `addComponent` 만)
- `.../Stat/Left/Portrait/Avatar` 에 `MOD.Core.CostumeManagerComponent` 추가. **좌표·크기·다른 노드는 일절 안 건드렸다**(사용자가 Maker 에서 배치한 레이아웃 유지)
- HEAD 대조 결과 차이는 이 컴포넌트 1개뿐 — 엔티티 161개 그대로, 손실 0. 파일이 819KB→776KB 로 준 건 빌더 재직렬화(포맷)일 뿐이다
- `avatarPreview` UUID 는 `write({bind})` 가 `StatUIController` 에 주입

### 코드
- **`Item/ItemCatalog.mlua`** — `AvatarRuid(itemId)` 신설. `thumbnail://` 접두어 제거 규칙을 **서버·클라 공용 한 곳**으로 올렸다(`EquipService` 의 `AvatarRuidOf` 는 제거하고 이걸 부른다)
- **`Stat/StatUIController.mlua`** — `avatarPreview` 프로퍼티 + `RefreshPreview()` / `PreviewRuid(slot)` / `OnEquippedUpdated()`
  - 밑바탕은 `CostumeManagerComponent.DefaultEquipUserId = 내 UserId` → 머리·얼굴·피부·계정 옷이 내 캐릭터 그대로
  - 그 위에 장착 6부위를 월드와 **같은 `Custom*Equip` 매핑**으로 덮어쓴다
  - `Open()` 에서 1회 + 장비 변경 응답마다 갱신
- **`Item/InventoryUIController.mlua`** — `SetEquippedCsv` 끝에서 `_StatUIController:OnEquippedUpdated()` 호출(기존 `_WorkshopUIController` 통지와 같은 관례). 장비 캐시는 `InventoryUIController.equipped` 하나만 쓴다

### 검증
- 정적: mlua 진단 훅 통과 · `.ui` HEAD 대조(위) · `AvatarGUIRendererComponent.d.mlua` 에 대상 지정 속성이 없음을 확인하고 문서 검색으로 `CostumeManagerComponent` 병행 방식 확인
- 🟡 **런타임 미검증** — C 를 눌러 스탯 탭에서 캐릭터가 그려지는지, 장착/해제가 즉시 반영되는지 육안 확인 필요.
  로그 확인 지점: `[CharUI] preview skipped: ...` 가 뜨면 컴포넌트/엔티티 배선이 안 된 것

### 참고
작업 도중 추적 파일 `RootDesk/MyDesk/Models/{Effects,Farm,Terrain}.directory` 3개가 워크트리에서 사라져 git 에서 복원했다. 이 브랜치의 변경분이 아니며 원인은 특정하지 못했다(mlua 진단 훅·pre-push 훅 모두 `.directory` 를 참조하지 않는다).

---

## 2026-09-08 — 장착 장비를 캐릭터 아바타 외형에 반영 · 브랜치 `a/item-equip-costume` (main `d959bef` 에서)

### 배경
장비를 장착해도 스탯(`EQUIP`·`ENHANCE` 레이어)과 인벤토리 슬롯 아이콘만 바뀌고 **캐릭터 외형은 그대로**였다. 화면에서 "장착했다"를 확인할 방법이 없었다.

### 방식 — 덧그리기가 아니라 아바타 실장착
`CostumeManagerComponent` 의 `Custom*Equip` 에 아바타 아이템 RUID 를 꽂으면 `AvatarRendererComponent` 가 프레임마다 부위별로 재합성한다 — 모자는 머리, 장갑은 손 정위치에 붙고, 검은 손에 쥐어져 공격 모션에 같이 휘둘러진다. 플레이어 위에 스프라이트 엔티티를 얹는 방식(애니메이션을 안 따라감)은 쓰지 않았다.

RUID 는 새로 뽑지 않았다. `ItemInfo.IconRUID` 가 이미 `thumbnail://<avataritem RUID>` 라(2026-09-06 `a/item-icons`) **접두어만 떼면 그대로 아바타 슬롯 값**이다.

### 확인한 것 (조회만 · 데이터 변경 없음)
- 무기 16종(초보자 나무 검 1 + 5직업 × 3티어 15) 전부 `type=avataritem` · `category=weapon` = **한손**. → `CustomOneHandedWeaponEquip` 하나로 충분하고 양손 분기·`AvatarSlot` 열 추가는 불필요
- `Custom*Equip` 17개는 전부 `@Sync` → **서버에서 써야** 본인·다른 플레이어 화면 모두에 전파된다
- `UseCustomEquipOnly` 는 `DefaultPlayer.model` 에 값이 없어 기본 `false` → 계정 아바타 위에 6부위만 덮어쓴다. 해제하면 원래 자기 옷이 돌아온다. **모델 파일은 안 건드렸다**

### 코드 (`Item/EquipService.mlua` 한 파일)
- `AvatarRuidOf(def)` — `IconRUID` 에서 `thumbnail://` 제거. 접두어가 없으면 `""` 로 버린다(보석·포션의 sprite RUID 가 아바타 슬롯에 들어가는 걸 막는다). 접두어가 붙은 채로 넣으면 **에러 없이 무시**되므로 이 분기가 필요하다
- `CostumeRuid(userId, e, slot)` — 슬롯의 장착 인스턴스 → 아바타 RUID. 빈 슬롯은 `""` = 해제
- `ApplyCostume(userId)` — 6슬롯을 매번 전부 다시 쓴다
  `WEAPON`→`CustomOneHandedWeaponEquip` · `HAT`→`CustomCapEquip` · `TOP`→`CustomCoatEquip` · `BOTTOM`→`CustomPantsEquip` · `SHOES`→`CustomShoesEquip` · `GLOVES`→`CustomGloveEquip`
  양손·보조무기 슬롯은 건드리지 않는다(계정 외형의 그 슬롯을 지우지 않으려고)
- `Apply()` 끝에서 호출 — 장착/해제가 전부 여기를 지난다. 강화·수리는 `PushEquipped` 만 부르므로 외형은 안 바뀐다(의도: 외형은 아이템 종류만 따른다)
- `OnBeginPlay` 에 `UserEnterEvent` 연결 + 이미 들어와 있는 유저 루프(`Summon/SummonManager.mlua` 패턴) → 플레이어 엔티티가 새로 만들어져도 다시 입힌다

### 검증
- **정적**: mlua 진단 훅 통과 · `Custom*Equip` 6개 철자를 `Environment/NativeScripts/Component/CostumeManagerComponent.d.mlua` 와 대조 · 슬롯 6개가 `EquipService.slots` 와 1:1
- 🟡 **런타임 미검증** — Maker 를 쓰는 다른 세션과 겹치지 않으려고 이 작업 중 `maker_*` 를 한 번도 호출하지 않았다.
  이 워크트리를 Maker 월드로 열어 `refresh` → `play` → 장착/해제를 눈으로 확인해야 한다.
  로그 확인 지점: `[Item] costume applied: N/6 (<userId>)`

### 알림 (B 담당)
무기를 코스튬 슬롯에 넣으면 엔진이 `ATTACK` 모션을 무기 종류에 맞춰 자동 교체한다(한손검 → `swingO*` 등). **`PlayerAttack` 의 공격 겉모습이 같이 바뀐다.** 현재 코드에 `RemoveActionSheet` / `SetActionSheet` / `ActionStateChangedEvent` 사용처가 하나도 없어 충돌은 없다.

### 남은 것
장비 원장은 아직 메모리 전용(`MatchPlayerState.match_equipped` 미연동)이라 재접속·룸 이동 시 장비가 비어 있다. 이 작업 범위 밖이며, 저장이 붙으면 `OnUserEnter` 훅이 그대로 재사용된다.
