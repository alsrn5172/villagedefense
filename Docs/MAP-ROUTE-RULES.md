# 빅토리아 맵 경로 규칙

## 적용 범위

- 최종 포탈 네트워크는 슬리피우드를 제외한 **6개 지역, 33개 맵**에 적용한다.
- `KerningCity_Hunt_CautionFalling`(원본 `103010000`, 추락주의)은 **방어전 예비 맵**으로 따로 보관한다. 이번에는 제작·포탈 연결·월드 등록을 하지 않으며, 방어전 기획이 확정된 뒤 별도 WO에서 사용한다.
- 새로 추가하는 포탈 목적지는 좌표가 아니라 목적지 포탈 엔티티 이름으로 연결한다.

## 공통 진행 구조

각 지역은 여섯갈래길 방향의 사냥터 2개와 보스 방향의 사냥터 1개를 둔다.

```text
보스룸 ↔ 사냥터3 ↔ (빌리지2, 필요한 지역만) ↔ 빌리지1 ↔ 사냥터1 ↔ 사냥터2 ↔ 여섯갈래길
```

## 확정 맵 ID 및 양방향 순서

### 커닝시티

```text
KerningCity_Boss_KingSlime
  ↔ KerningCity_Hunt_SewerApproach (주니어네키·보스 뒷길)
  ↔ KerningCity_Village_MinimiMain
  ↔ KerningCity_Hunt_ConstructionSite (사냥터1)
  ↔ KerningCity_Village_SubwayEntrance
  ↔ KerningCity_Hunt_SubwayLine1 (사냥터2)
  ↔ SixPathCrossway
```

- `MinimiMain` 좌측 포탈은 `SewerApproach`를 거쳐 킹슬라임으로 간다.
- `MinimiMain` 우측 포탈은 `ConstructionSite → SubwayEntrance → SubwayLine1 → SixPathCrossway`로 간다.
- `SewerApproach ↔ SubwayEntrance` 직접 연결은 없다.
- `SubwayLine1`은 별도 분기가 아니라 사냥터2다.

### 헤네시스

```text
Henesys_Boss_Mushmom ↔ Henesys_Hunt_BlueMushroomTrail ↔ Henesys_Village_MinimiMain
  ↔ Henesys_Hunt_HillNorth ↔ Henesys_Hunt_GolemsTemple ↔ SixPathCrossway
```

### 엘리니아

```text
Ellinia_Boss_Ephenia ↔ Ellinia_Hunt_GiantTree ↔ Ellinia_Village_MinimiMain
  ↔ Ellinia_Hunt_GreenTreeTrunk ↔ Ellinia_Hunt_TreeTrunkNest2 ↔ SixPathCrossway
```

### 페리온

```text
Perion_Boss_Stumpy ↔ Perion_Hunt_SouthernRidge ↔ Perion_Village_MinimiMain
  ↔ Perion_Hunt_WildBoarLand ↔ Perion_Hunt_NorthernRidge ↔ SixPathCrossway
```

### 노틸러스

```text
Nautilus_Boss_Pianus ↔ Nautilus_Hunt_RibbonPigBeach ↔ Nautilus_Village_MinimiShip
  ↔ Nautilus_Village_MinimiMain ↔ Nautilus_Hunt_PigPasture
  ↔ Nautilus_Hunt_WayToBeach ↔ SixPathCrossway
```

### 리스항구

```text
LithHarbor_Boss_Mano (원본 104010200: Forest Trail 2, 마노 보스맵)
  ↔ LithHarbor_Hunt_ForestTrail1 (원본 104010100: 사냥터3·보스 전 맵)
  ↔ LithHarbor_Village_MinimiMain
  ↔ LithHarbor_Hunt_RightAroundLithHarbor (원본 104010000: 사냥터1)
  ↔ LithHarbor_Hunt_PigBeach (원본 921170005: The Pig Beach, 사냥터2)
  ↔ SixPathCrossway
```

- `LithHarbor_Hunt_VictoriaTreePlatform`(원본 `104020100`)은 이동용 맵이며 몬스터 사냥터가 아니다. 이번 월드·포탈망에서 제거한다.
- `LithHarbor_Hunt_ForestTrail2`와 `LithHarbor_Hunt_PigBeach_Preview`는 최종 경로에서 제거한다.
- `921170005 The Pig Beach`는 이벤트 계열 원본이다. 일반 전투 로스터에 없는 이벤트 몬스터·NPC는 이번 스폰표에 임의 등록하지 않고 후속 전후처리 범위로 남긴다.

## 현재 이행 상태 (2026-08-27)

- 최종 4개 리스항구 맵을 등록했다. `RightAroundLithHarbor`와 `PigBeach`를 새로 임포트하고, 기존 `Boss_Mano`는 `104010200 Forest Trail 2`로 교체했다.
- 포탈망은 최종 **33개 맵, 64방향**이며, 리스항구 10행은 위 구조를 따른다.

## 포탈 명명 규칙

- 출발 포탈 엔티티 이름은 `P_To_<목적지맵ID>`로 고정한다.
- 예: `Henesys_Village_MinimiMain`에서 북쪽언덕으로 가는 포탈은 `P_To_Henesys_Hunt_HillNorth`다.
- 같은 맵에는 같은 이름의 출발 포탈이 하나만 있어야 한다.
- 연결에 쓰지 않는 원본 포탈은 삭제하지 않고, 엔티티와 `PortalComponent`를 비활성화하고 숨긴다.

## 완료 기준

- 포탈 CSV에는 위 32개 양방향 연결을 64행으로 기록한다.
- 최종 33개 대상 맵의 모든 경로 포탈이 이름으로 서로 연결된다.
- Maker 런타임 검증: `PortalNetwork routes=64, bound=64, invalid=0` 및 빌드 오류 0건.
- 슬리피우드와 추락주의 예비 맵은 이번 네트워크에서 제외된다.
