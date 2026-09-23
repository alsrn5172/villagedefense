# a/p0914-7-elite (B7 · 통합 브랜치 `a/plan-0914` · B6 위 stacked · PR #76)

엘리트 = 자이언트 (WO-029 B7 · WO-027 §9-0 21 · 계약 A-2-15).

| 항목 | 내용 | 파일 |
|---|---|---|
| `EliteMonsterInfo` | 헤더 `#Note` 앞 +`ScaleMul CoinDrop DreamDrop SoulstoneDrop Tier`(CANONICAL 동시) · 24행 = MapMonsters 에 스폰되는 몹 전부(`E<Id>` · HP×25 · 공격×4 · Exp×10 · 메소×10 · 티어 = 레벨 ≤12/≤20/그 외 · 크기 1.6/1.8/2.0 · 주화·꿈의 조각 2/4/6 · 영혼석 1) | `EliteMonsterInfo.csv` · `Docs/tools/check-integrity.cjs` |
| `EliteSpawnTable` | 헤더 +`KillsPerElite` · 리스항구 제외 사냥터 15맵 1행씩(`BaseMonsterId`/`EliteId` 빈칸 = 죽은 몹의 엘리트 · `Chance` 0 · 25) | `EliteSpawnTable.csv` |
| 카탈로그 | 새 열 적재 · 빈칸/Chance 0 허용 · `RuleFor(map)` · `EliteOfBase(id)` | `Catalog/EliteCatalog.mlua` |
| 스포너(신규) | 맵별 누적 처치 카운터(일반 몹만 · 누가 잡았든 · 매치 시작 리셋) · `KillsPerElite`(매치 중 `ELITE_PER_KILLS` 우선) 배수마다 `ELITE_COUNT` 마리(★5 2)를 죽은 자리에 · 베이스 모델 스폰 + `Transform.Scale`×ScaleMul + HP + 점프/속도 + `FarmReward.EliteId` · 확정 드랍 `GrantEliteDrops`(주화 `GrantCoin` · 꿈의 조각 · 영혼석 · 토스트) · `[Elite] kills= spawn` / `spawned` / `drops` 로그 | `Monster/EliteSpawner.mlua` |
| 훅 | `FarmReward`: `EliteId` 속성 · 사망마다 카운터 호출 · 엘리트 Exp/메소 = 엘리트 행 · 확정 드랍 호출 · `MonsterAttack.CalcDamage`: 엘리트 공격력 · `StartMatch`: 카운터 리셋 | `Farm/FarmReward.mlua` · `MonsterAttack.mlua` · `Match/MatchSessionLogic.mlua` |

`DropTable.csv` 는 손대지 않음(엘리트도 GROUND/MONSTER 드롭을 일반 몹처럼 굴린다 · ★5 타 지역 ×2 는 B6 `RegionMul`).

## 검증

- `node Docs/tools/check-integrity.cjs` 통과(EliteMonsterInfo 24행 · EliteSpawnTable 15행 · 전 행 모델 있음) · LSP 진단 0.
- 런타임(Maker): 아래 PR 본문.
