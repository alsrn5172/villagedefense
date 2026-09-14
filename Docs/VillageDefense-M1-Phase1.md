# 빅토리아 마을전 M1 — 플레이어 성장·기능 NPC 실행 보드

> 기획 정본은 [`VillageDefense-M1-GDD.md`](VillageDefense-M1-GDD.md)다. 이 문서는 구현 순서·검증 게이트만 관리하며, 게임 규칙을 중복 정의하지 않는다.
>
> 🔴 **2026-09-09 — 이 문서는 과거 기록이다.**
> 아래 7개 브랜치는 **전부 끝났다.** 이후 작업은 이 보드가 아니라 **`메월드폴더/WorkOrders/WO-*.md` 지시서**가 관리한다(WO-001 ~ WO-023 · 2026-09-10 기준).
> 전체 진행 상태는 [`VillageDefense-M1-GDD.md`](VillageDefense-M1-GDD.md) §7 로드맵을 본다.
> 삭제하지 않는 이유: 이 보드의 항목이 전부 `✅` 이긴 하나, M1 자체가 아직 진행 중이라 초기 구현 순서의 기록으로 남긴다.

## 완료 목표

플레이어가 1레벨에서 시작해 스탯·장비·강화로 실제 전투력이 변하고, 10레벨 전직 뒤 마을의 기능 NPC와 UI를 안전하게 사용할 수 있게 한다.

→ ✅ **달성.** 스탯·장비·강화·제작·수리·상점·창고·모집·훈련·기능 NPC·UI 가 전부 붙었다.

## 고정 순서 (7/7 ✅ · 2026-09 완료)

1. ✅ `a/contract-stat-item-npc-docs` — 시스템 등록 문서, 정합성 검사, UI 협업 규약.
2. ✅ `a/events-stat-item` — 이벤트 4종의 계약서 행·`.mlua`·`.codeblock` 3종 세트. (`Stat/StatRecalculatedEvent` · `ApAllocatedEvent` · `SpSpentEvent` · `Item/EquipChangedEvent` 등)
3. ✅ `a/stat-damage` — `Stat/StatService`, `Stat/DamageFormula`, AP·SP 원장, `PlayerAttack` 배선. ⚠️ **`LevelTable` 실값은 여전히 자리표시자**(GDD §7 Phase 2).
4. ✅ `a/ui-shell-character` — `CharacterGroup`, 상태 HUD 진입점, 토스트 레이어, ClientOnly 라우터.
5. ✅ `a/item-equip` — 인벤토리·6슬롯 장비·`ItemInfo` 127행. (+ `a/item-icons` · `a/item-shop-npc-ui` · `a/item-equip-costume` 후속)
6. ✅ `a/npc-spawner` — 섹터 앵커, `FunctionalNpcCatalog`·스포너·권한·UI 라우터. `staticnpc` 모델 검증 완료.
7. ✅ `a/enhance-gem` — 보석 12종 드롭·`EnhanceTable`·`EnhanceSlotBonus`·공방 UI.

## 협업 게이트

- `PlayerAttack.mlua`, `LevelTable.csv`, `StatusHUD.ui`는 B와 경계면 협의 후 수정한다.
- `JobInfo`의 주/부스탯·자동 AP 비율, 스킬 피해 계수, SP 소비 인터페이스는 B 소유다.
- 새 `.ui`는 A(S1) → 디자인팀(S2) → A(S3) 순서로만 편집한다.
- `NpcInfo.ModelId=staticnpc`는 실제 스폰을 켜기 전에 Maker에서 모델 해석을 검증한다. 유효하지 않으면 공용 NPC 모델 등록을 별도 PR 범위에 명시한다.

## 공통 검증 기준

- 오프라인: `node Docs/tools/check-integrity.cjs`, `git diff --check`.
- 런타임 변경 뒤: Maker Refresh/Play, build·normal 로그, 핵심 `log()` 출력 확인.
- UI 클릭·겹침은 필요한 경우에만 Maker 스크린샷과 실제 클릭으로 확인한다.
