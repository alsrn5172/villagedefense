# a/contract-stat-item-npc-docs

## 2026-09-03 — 시스템 등록 문서

- `Stat/`, `Item/`, `Npc/`의 플레이어 스탯·장비·강화·기능 NPC·UI 소유권과 경계면을 등록했다.
- 신규 CSV 6종의 정본 헤더·기본 키를 계약서와 정합성 검사에 함께 등록했다.
- `FunctionalNpcCatalog`에 섹터·슬롯 순서를 추가하고, `VillageNpcSector` 앵커와 선택적 개별 좌표 오버라이드 규칙을 정했다.
- 신규 UI의 S1 뼈대 → S2 아트 → S3 배선 릴레이와 캐릭터/기능 NPC UI 계약을 추가했다.
- 이 PR에는 런타임 `.mlua`, `.ui`, `.csv`, `.model` 구현을 포함하지 않는다. 등록 머지 뒤 후속 기능 브랜치에서 구현·Maker 검증한다.

## 검증

- `node Docs/tools/check-integrity.cjs`
- `git diff --check`
