# a/map-monster-portal (WO-013)

지시서: `메월드폴더/WorkOrders/WO-013-맵몬스터-CSV-리스노선-포탈.md`
기준선: 빌드 로그 152건 · `MapMonsters` 396행 · `PortalRoutes` 72행 · 정합성 경고 5건

## ① 박제 몹 31마리 → CSV + 스포너 (3맵)

맵에 박혀 있던 몹은 범용 `chasemonster` 템플릿으로 떠서 도감 HP·경험치가 안 먹었다.
전 35맵을 대조해 남아 있던 3맵을 CSV 단일 진상으로 통일했다.

| 맵 | 전 | 후 |
|---|---|---|
| `Ellinia_Hunt_GiantTree` | 박제 13 · CSV 0 | 이블아이 `2230100` ×13 · 스포너 13 |
| `LithHarbor_Hunt_PigBeach` | 박제 18 · CSV 0 | 리본 돼지 `1210101` ×10 + 아이언호그 `4230103` ×8 · 스포너 18 |
| `Nautilus_Hunt_WayToBeach` | 박제 0 · CSV 16 · **스포너 0** | 스포너 16 (CSV 무수정) |

- 종 판정은 `StateAnimationComponent.ActionSheet.stand` RUID 전수 게이트로 했다 — GiantTree 13/13 `4e03ed53`,
  PigBeach 10/10 `86acfa20` + 8/8 `eadfe080`. 추측 0건.
- PigBeach 원본은 쓰로우백 2종(`9010028`/`9010033`)인데 모델 파일이 없어 기획 §1-6 "모델 있는 ID 로" 를 따랐다.
- `WayToBeach` 16행은 커밋 `af637e7` 이 박제만 지우고 스포너를 안 만들어 **죽어 있던 행**이다.
- 좌우 팔은 발판 체인(`Next`/`PreviousFootholdId`)을 순회해 이어진 발판의 x 범위를 구한 뒤 끝에서 0.2 안쪽으로 계산.
  47개 중 46개 `0.5/0.5`, `GiantTree_SP006` 만 좌 `0.2`.

## ② 리스항구 일자 체인 재배선

기획 `Docs/추가기획1/구현항목-결정.md` §1-7 이 정한 체인이 미적용이었다.
사용자 정정(2026-09-05): `Hunt_ForestTrail1` 이 **사냥터2** → `PigBeach` 와 자리를 맞바꾼다.

```
마을 → 주변(Lv1) → 숲길1(Lv2) → 돼지해변(Lv3) → 마노 → 여섯갈래길
```

- 포탈 **개명 8 + 활성 1 = 9건**, 새로 배치한 포탈은 **0개**.
  마노맵의 비활성 잔재 포탈 `Portal`(8.91, −4.53)을 `P_To_SixPathCrossway` 로 개명·활성화해 출구로 재사용했다.
- 마을의 `P_To_LithHarbor_Hunt_ForestTrail1`(직결)은 체인에서 빠져 **비활성 + 숨김** (삭제 금지 규칙).
- `PortalRoutes` L01A~L05B 10행 교체(72행 유지) · `WorldMapNodes` 2행 좌표 스왑 · `MAP-ROUTE-RULES.md` 갱신.
- 🔴 **전 72행을 실물 맵과 전수 대조** — `FromPortal`/`ToPortal` 실재 + `Enable` 확인, 깨진 노선 0.

## ③ 보스 입구 포탈 7개 → 빨강 통일

출구 9개만 빨간 애니메이션이고 입구는 기본 파란 포탈이라 짝이 안 맞았다.
`SpriteRUID 227851c8`(`portal/game/pv/5` 16프레임) + 박스 `1.2×1.64` / offset `0.01,0.72` 로 통일.

킹슬라임 · 머쉬맘 · 스텀피 · 피아누스 · 발록(박스만) · 마노(돼지해변·여섯갈래길 2곳).
`Ellinia_Hunt_GiantTree` → 에피네아는 **사용자 지시로 예외 유지**.

## ④ 🔴 모든 노선 포탈을 플레이어보다 앞 층으로 (`PortalNetwork`)

사용자 지시 2026-09-07 "모든 포탈은 플레이어보다 앞". 포탈 73개가 `MapLayer7`/`MapLayer1`/`MapLayer0` 로 제각각이라
플레이어 뒤로 숨는 경우가 있었다.

**값: `SortingLayer="Default"` · `OrderInLayer=5`.** 근거 —
플레이어 렌더 층 = **밟은 발판의 `SortingLayer` + `OrderInLayer` 4**(`Npc/NpcSpawner.mlua:79-85` 정본)이고
`Default` 가 `MapLayer0~7` 보다 위 층인데, 레인 통로 발판이 `Default` 라 **플레이어가 `Default/4` 까지 올라온다**.
→ `MapLayer7` 로는 부족하고 `Default/5` 면 어느 발판에 서 있든 항상 앞이다. 발판 층을 조회할 필요가 없다.

**클라 전용으로 넣은 이유**: 포탈은 맵 파일에 박힌 **정적 엔티티**라 서버에서 렌더 속성을 써도 클라에 전파된다는
보장이 없다. (`NpcSpawner` 가 서버 대입으로 되는 건 서버가 스폰한 엔티티라서다.) 렌더 값이라 각 클라가 자기 화면만 고치면 된다.

- `@Logic` 은 `OnMapEnter` 를 못 받으므로 `OnUpdate` 에서 `LocalPlayer.CurrentMap` 을 0.3초마다 폴링해
  **맵이 바뀐 프레임에만 1회** 적용한다. 기존 `OnUpdate`(ServerOnly 바인딩 재시도)는 `UpdateServerBinding` 으로 옮기고
  `OnUpdate` 를 양쪽 디스패처로 바꿨다 — 서버 동작은 무변경.
- 대상은 **`PortalRoutes` 에 있는 포탈만**. 통로 포탈 `P_Lane_To_*` 도 표에 있어 자동 적용된다.
  표에 없는 장식 3개(`SixPathCrossway/portal-6` 등)는 제외 — 실측으로 `MapLayer0/2` 유지 확인.
- 맵 파일 73곳을 굽지 않으므로 앞으로 추가되는 포탈도 표에만 있으면 자동 적용된다.

## ⑤ 좀비머쉬맘 점검 (배치 유지)

커밋 `ad094e4`(출처 불명 작업 트리 정리)가 머쉬맘 `Enabled=false`, 좀비머쉬맘 `SpawnX/Y (-6,-1)`,
`BossSpawner_2400572` 엔티티를 넣어 **좀비머쉬맘이 헤네시스 지역 보스를 대체**하고 있었다.
사용자 확인: **의도한 것 · 그대로 둔다.**

런타임 실측 (`Henesys_Boss_Mushmom`):

```
[BossSpawner] spawn boss=2400572 (좀비머쉬맘) map=Henesys_Boss_Mushmom x=-6 y=-1 hp=108000
[BossSkillRunner] 2400572 contact ready size=1.192x1.278 dmg=300.0
[BossSkillRunner] 2400572/S1 클립 실측 0.90초 -> 재생 1.0배에서 0.90초
[BossSkillRunner] 2400572/S2 클립 실측 0.90초 -> 재생 1.0배에서 0.90초
```

접촉 박스 `1.192×1.278` 은 11차 계산값 `1.22×1.30` 과 일치(반올림 차). S1·S2 가 `attack1` 을 공유하는 것도 문서대로다.

## 검증

| 항목 | 결과 |
|---|---|
| 빌드 로그 | 152 → **152** (신규 0) |
| `check-integrity` | 전부 통과 · 경고 5 → **3** (C5 몹 박제 4건 → 0) |
| `[Catalog]` | `loaded monsters=79 spawns=427 skipped=0` |
| `[MonsterSpawner] ready` | **427건 전부 `spawned=1/1`** · 불일치 0 (GiantTree 13 · PigBeach 18 · WayToBeach 16 포함) |
| `[PortalNetwork]` | `routes=72 bound=72 invalid=0` |
| 포탈 층 | `layer map=SixPathCrossway portals=7 layer=Default/5` · 클라 되읽기 7/7 `Default/5` |
| 보스 | 7종 전부 스폰 (머쉬맘은 의도적 비활성) |
| 런타임 에러 | `LEA`/`LWA`/Exception **0건** |
| Play 뒤 디스크 | `MapMonsters` 428줄 · `PortalRoutes` 73줄 그대로 (Maker 되쓰기 없음) |

## 확인 대기 · 후속

- 🔴 **육안 확인은 사용자 몫**: 빨간 입구 포탈 7개 · 포탈이 캐릭터 앞에 그려지는지 · 리스 체인 왕복 이동.
- ⚠️ **머쉬맘 스킬 4행이 고아**가 됐다 — `[BossCatalog] skill points to unknown/disabled BossId=6130101` ×4 (경고).
  머쉬맘을 다시 켜면 좀비머쉬맘과 **좌표가 (-6,-1) 로 정확히 겹친다.**
- ⚠️ 세션 시작 시 `LEA-3018` **4건**(Error · owner/stack 없음). 로그 맨 앞 4줄로 이번 변경 이전 단계에서 난다.
  정체 미확인 — 별도 조사 필요.
- 좀비머쉬맘 `RecoverTime 0.5`(11차 확인 대기)는 실제 전투를 봐야 판단할 수 있다.
- ``ui/WorldMapGroup.ui`` 는 이 작업에서 손대지 않았다. `node Docs/tools/build_worldmap_nodes.cjs` 로
  노드 좌표를 화면에 반영하는 건 **후속**(사용자 지시 시 1회).
- WP5 몫: 아이언호그 도감 `Lv56·HP8600` 이 Lv7 사냥터에 과하다 · `WayToBeach` 종 교체(리본돼지/파란버섯) · `LevelOverride`.
