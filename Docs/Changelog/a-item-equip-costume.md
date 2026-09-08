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
