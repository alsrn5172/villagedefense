# 빅토리아 마을전 M1 — 플레이어 성장·기능 NPC 실행 보드

> 기획 정본은 [`VillageDefense-M1-GDD.md`](VillageDefense-M1-GDD.md)다. 이 문서는 구현 순서·검증 게이트만 관리하며, 게임 규칙을 중복 정의하지 않는다.

## 완료 목표

플레이어가 1레벨에서 시작해 스탯·장비·강화로 실제 전투력이 변하고, 10레벨 전직 뒤 마을의 기능 NPC와 UI를 안전하게 사용할 수 있게 한다.

## 고정 순서

1. 🟡 `a/contract-stat-item-npc-docs` — 시스템 등록 문서, 정합성 검사, UI 협업 규약. 이 PR이 머지되기 전에는 런타임 코드를 작성하지 않는다.
2. ⬜ `a/events-stat-item` — 이벤트 4종의 계약서 행·`.mlua`·`.codeblock` 3종 세트.
3. ⬜ `a/stat-damage` — `StatService`, 데미지 공식, 자동 AP·SP 원장, `PlayerAttack` 배선, `LevelTable` 임시 검증 곡선.
4. ⬜ `a/ui-shell-character` — `CharacterGroup`, 상태 HUD 진입점, 토스트 레이어, ClientOnly 라우터.
5. ⬜ `a/item-equip` — 인벤토리·6슬롯 장비·초기 아이템 데이터.
6. ⬜ `a/npc-spawner` — 섹터 앵커, 기능 NPC 카탈로그·스포너·권한·UI 라우터. 보스의 `MapNpcs` 변경 기준과 `staticnpc` 모델을 먼저 검증한다.
7. ⬜ `a/enhance-gem` — 보석 드롭·강화표·공방 UI. 보스 로스터가 확정된 후 시작한다.

## 협업 게이트

- `PlayerAttack.mlua`, `LevelTable.csv`, `StatusHUD.ui`는 B와 경계면 협의 후 수정한다.
- `JobInfo`의 주/부스탯·자동 AP 비율, 스킬 피해 계수, SP 소비 인터페이스는 B 소유다.
- 새 `.ui`는 A(S1) → 디자인팀(S2) → A(S3) 순서로만 편집한다.
- `NpcInfo.ModelId=staticnpc`는 실제 스폰을 켜기 전에 Maker에서 모델 해석을 검증한다. 유효하지 않으면 공용 NPC 모델 등록을 별도 PR 범위에 명시한다.

## 공통 검증 기준

- 오프라인: `node Docs/tools/check-integrity.cjs`, `git diff --check`.
- 런타임 변경 뒤: Maker Refresh/Play, build·normal 로그, 핵심 `log()` 출력 확인.
- UI 클릭·겹침은 필요한 경우에만 Maker 스크린샷과 실제 클릭으로 확인한다.
