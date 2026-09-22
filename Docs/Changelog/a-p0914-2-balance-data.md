# a/p0914-2-balance-data (B2 · 통합 브랜치 `a/plan-0914` · B1 위 stacked)

밸런스 데이터. 정본: 허브 `WorkOrders/WO-027` §3·§5·§6 · `WO-029` B2. **`MonsterInfo` 헤더 변경 포함**(맨 뒤 `Attack` · #40 comment 5776547020 공지). 새 표 `DropTable`(+`.userdataset`).

## 1차 커밋 — 평타 간격 실측과 무관한 것

| 항목 | 내용 | 파일 |
|---|---|---|
| `MonsterInfo += Attack` | 79행 전부 `round(0.15 × (1000 + 50 × (Lv−1)))` — 동레벨 플레이어 HP 15%(감산 전). B4 가 `MonsterAttack.CalcDamage` 에서 읽기 전까진 데이터만 | `MonsterInfo.csv` · `check-integrity` CANONICAL |
| 몹 메소 | `CoinMin/CoinMax` 뜻 = **메소 총액**(동전 개수 아님). Lv≤2 3 · 3 5 · 4~6 7 · 7~9 12 · 10~16 **60** · 17~23 **180** · 24+ **450**. `FarmReward.DropCoins` 가 총액을 최대 3개 동전(`MesoCoin.Value` · `MaxCoinEntities`)에 나눠 떨군다 | `MonsterInfo.csv` · `Farm/FarmReward.mlua` |
| 강화비 | 1000/3000/8000 → **850/2,550/6,800** | `EnhanceTable.csv` |
| `DropTable` 신설 + 드롭 구현 | 사냥터 1/2/3 보석 20/35/55% ×1 · 지역 재화 35% / 75% / 3~4 확정. 토큰 `GEM_RANDOM`(12종 무작위) · `REGION_LOCAL`(그 맵 지역 재화). **막타 인벤토리 직접 지급 + 토스트**(바닥 드롭 없음). 사냥터 번호 = `VillageConfig` Lane1/Lane2/Rear → 리스항구·마을·보스 맵은 재료 없음. 미니언 없음 | `DropTable.csv` · `DropTable.userdataset` · `Farm/DropTableLogic.mlua`(신규 `@Logic`) · `Farm/FarmReward.mlua` |
| `GemDropTable` | 원래 소비처가 없었다 → 파일·헤더 유지 · 계약서에 대체 표기 | `Docs/스키마-계약.md` |

- 몬스터별 재화(`MAT_*` · 모집 재료)는 `ItemInfo` 행이 아직 없어 B5 에서 행 추가 + `DropTable` MONSTER 행.
- ★5 타 지역 재화 ×2 는 `DropTableLogic.RegionMul` 훅(지금 1) — B6.

## 2차 커밋 예정 — 평타·스킬 간격 실측 뒤

`LevelTable.NeedExp`(1~30) · `MonsterInfo.Exp` · `BossInfo` 주니어 발록 `MaxHp`(= 만렙 T30 풀강 고정치 DPS × 75초). 실측은 Maker 에서 개인 월드로 워크트리를 열어 Play 1회.

## 검증

- `node Docs/tools/check-integrity.cjs` 통과 여부는 PR 본문.
- 런타임(개인 월드 · TEST 프로필): `[Drop] loaded rows=6 tierMaps=18` · 사냥터 처치 뒤 `[Drop] <map> tier=N mob=… -> 보석/지역 재화 xN` · `[FarmReward] … dropped 60 meso in 3 coins` · 리스항구 처치는 `[Drop]` 로그 없음(메소만).
