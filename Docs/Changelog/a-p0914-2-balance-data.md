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

## 2차 커밋 (2026-09-23) — 평타 간격 실측 뒤

실측(Maker 개인 월드 · 몽둥이 · 초보자): 공격 상태 진입 간격 **0.59초**(연타 15초에 26회 · 키 홀드는 1회만) = 초당 약 1.7회. 스킬은 초보자라 실측 불가 → 시전 락 0.4~1.2s + `SkillInfo.Cooldown` 으로 계산(WO-027 §1 직업별 표).

| 항목 | 내용 | 파일 |
|---|---|---|
| `LevelTable.NeedExp` | 1차안(초당 2회 가정 · 실측 1.7회에 가장 가까움) 곡선: Lv1~9 35~75(+5) · Lv10~18 500~900(+50) · Lv19 900 · Lv20~28 1,040~2,160(+140) · Lv29 2,500 · 누적 24,595. **Lv31~50 행 삭제 → 만렙 30**(`MonsterCatalog.maxLevel` = 표의 최대 Level · `ResolveLevel` 이 거기서 멈춘다). Lv30 행 NeedExp 2,500 은 만렙 EXP 바 표시용 | `LevelTable.csv` |
| `MonsterInfo.Exp` | 79행 전부: 1차안 기준점(Lv1 5 · 3 8 · 4 10 · 7 16 · 10 22 · 17 38 · 24 70) 레벨 선형 보간 · 24 초과 +4.57/Lv(Lv30 97). 좀비머쉬맘·미니언 Exp 는 B3 `MinionWave.Exp` 가 덮는다(엘리트 ×10 은 B7 런타임) | `MonsterInfo.csv` |
| 발록 `MaxHp` | 157,500 → **38,000** = 가장 약한 직업(전사) Lv30 T30 F 로테이션 508 DPS × 75초. 어느 직업이든 솔플 가능 · B 가 스킬을 500~600 DPS 로 맞추면 전 직업 70~80초. ★1 ×0.5 · ★5 ×2 는 B6 런타임 배율 | `BossInfo.csv` |
| 계약 | A-2-13 발록 HP 확정 문장 · `LevelTable` 30행 | `Docs/스키마-계약.md` |

## 검증

- `node Docs/tools/check-integrity.cjs` 통과 여부는 PR 본문.
- ✅ 1차 런타임(2026-09-23 · 개인 월드 · TEST): `[Drop] loaded rows=6 tierMaps=18` · `GrantKillDrops` 5회 → `[Drop] Henesys_Hunt_HillNorth tier=1 … 아쿠아마린/사파이어/헤네시스 포자` 4회(확률) · 리스항구 맵은 `[Drop]` 없음 · `[Item] trade tables … consume 6`. 2차(Exp·LevelTable·발록 HP)는 값만 바뀌어 `check-integrity` + 다음 Play 의 `[Catalog] … levels=30` 로 확인.
- (1차 계획) `[Drop] loaded rows=6 tierMaps=18` · 사냥터 처치 뒤 `[Drop] <map> tier=N mob=… -> 보석/지역 재화 xN` · `[FarmReward] … dropped 60 meso in 3 coins` · 리스항구 처치는 `[Drop]` 로그 없음(메소만).
