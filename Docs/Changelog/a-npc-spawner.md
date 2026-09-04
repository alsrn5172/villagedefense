# a/npc-spawner

## 범위

- 기능 NPC 15종의 카탈로그, 역할별 비주얼 모델, 맵 단위 스포너를 추가했다.
- NPC 클릭 시 서버가 인스턴스 키, 호출자, 맵, 거리, 호출 간격, 소유권을 검증한 뒤 UI 브리지로 요청을 전달한다.
- 실제 `.ui` 화면과 상점·강화 등 기능 실행은 포함하지 않는다.

## 데이터

- `FunctionalNpcCatalog.csv`: 점유 마을 11역할, 공용 3역할, 리스항구 초보 장비 상인 1역할.
- `VillageNpcSector.csv`: 점유 마을 5곳 × 4섹터. 앵커 좌표는 디자이너 실측 전까지 비워 두며 스포너가 경고 후 해당 NPC를 건너뛴다.
- `MapNpcs_Village.csv`: `SixPathCrossway`의 기존 `1002105` 차원 관문을 `VD_COMMON_DIMENSION_GATE`로 교체했다.

## 연동 계약

- `VillageConfig`가 준비되면 `VillageMapName`으로 점유 마을 NPC 자동 배치를 활성화한다.
- 소유권 서비스는 서버에서 `_NpcCatalog:SetOwnershipResolver(callback)`을 한 번 등록한다. 연결 전 `OWNER_ONLY` NPC는 fail-closed로 거절한다.
- UI 브랜치는 클라이언트에서 `_VillageNpcUIController.HasPendingRequest`를 확인하고 `Pending*` 필드를 소비한 뒤 `ClearPendingRequest()`를 호출한다. 서버는 `instanceKey`와 `catalogNpcId`만 전달하며 나머지 경로 정보는 클라이언트 카탈로그에서 해석한다.
- 맵에는 `script.NpcSpawner`를 맵 수명의 엔티티에 붙이고, 매치 시작 시 `MatchId`를 주입한다.

## 검증

- 모델 빌더 검증: 15종 모두 통과.
- `node Docs/tools/check-integrity.cjs`: 통과, 기존 범위 경고 10건.
- Maker Refresh·빌드 로그·클릭 런타임 검증은 별도 임시 월드에서 수행한다.
