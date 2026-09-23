# a/p0914-5-guard-recruit (B5 · 통합 브랜치 `a/plan-0914` · B4 위 stacked · PR #74)

수비대 모집 재설계 (WO-029 B5 · WO-027 §7-1 · 계약 A-2-20).

| 항목 | 내용 | 파일 |
|---|---|---|
| `MonsterRecruit` 신설 | 14행(지역당 사냥터 1/2/3 대표 몹 · 커닝 2종) · 재료 `MAT_<Id>` × 8 · 묶음 5 · `GuardHp/GuardAttack` 티어 고정 500/150 · 1,600/315 · 2,500/1,850 | `MonsterRecruit.csv` · `.userdataset` |
| 재료 아이템 | `ItemInfo` +14 `MAT_<MonsterId>`(MATERIAL · 999 스택 · 판매 50 · 아이콘 = 몹 아이콘 임시) | `ItemInfo.csv` |
| 드롭 | `DropTable` MONSTER +14(25/35/50%) · **사냥터 번호 = 맵 몹 레벨대**(≤12/≤20/그 외)로 정정 — B2 의 레인 역할 매핑은 헤네시스 외에서 틀렸음 | `DropTable.csv` · `Farm/DropTableLogic.mlua` |
| 모집 | `LoadRecruitDef/RecruitRow` · `RequestRecruit` = 행 필수 + 도감 해금 게이트 + 재료 8 차감 + 묶음 5 · `[Recruit] … bundle= hp= atk=` 로그 · `SummonUnits`/`MaterialOf`(다이아몬드) 경로는 모집에서 안 씀(도감 해금은 그대로) | `Lane/LaneStateService.mlua` |
| 수비대 개체 | `SpawnOne`: 행이 있으면 `GuardHp/GuardAttack × 훈련 StatMul`, 없으면 옛 식 | `Lane/DefenderService.mlua` |
| 모집 창 | `U` 행 += 재료 ID·이름·보유·묶음 → 카드마다 "재료 8 (보유 n)" · 버튼 활성 = 보유 ≥ 필요 | `Npc/VillageLifeUIController.mlua` |

## 검증

- `node Docs/tools/check-integrity.cjs` 통과 여부는 PR 본문.
- 런타임: `[Lane] MonsterRecruit loaded: 14 rows` · `[Drop] … tierByLevelFixed=n` · 재료 8개 지급 → `RequestRecruit` → `[Recruit] … bundle=5 spawned=5 hp=500 atk=150` · 재료 차감 · 수비대 `Monster.MaxHp`=500.
