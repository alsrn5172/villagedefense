## 2026-10-02 — WO-040 조각 0: 헤네시스 포탑(E18-7-1) 한 종류로 "프레임 스프라이트 + 스크립트 재생" 시험

브랜치 `a/lane-facility-art` (base `a/design-ui` · Draft PR #154). 지시서 `WorkOrders/WO-040-…` · 조사 `WorkOrders/data/WO-040-시설-그림-현황조사.md`(§4 의 A-ⓑ · `LaneHpBar` 패턴).
목적: 7-1 한 종류로 이 방식이 쓸 만한지 본다. Maker 편집기 클립 방식은 사용자 손이라 뒤에 따로 비교한다(재료 = `WorkOrders/data/WO-040-spike/클립-조립-안내.md`).

### 한 것

| 무엇 | 어디 |
|---|---|
| 가공 도구(원본 18장 → 공통 캔버스 크롭 · 50% 축소 · 피벗 · manifest · 다시 돌려도 같은 결과) | `Docs/tools/facility-art/prep.py` |
| 업로드 도구(그룹 `mIYbC` · 속성 · 교체 · 속성만 변경 · 시험 복제) | `Docs/tools/facility-art/upload.cjs` |
| 올린 RUID 표(18장 + 피벗 시험용 복제 3) | `Docs/tools/facility-art/ruid-map.json` |
| 클라 프레임 재생기(`@Sync` `Tier` · `AttackSeq` · `FrameSec` 만 서버가 쓰고 클라가 `SpriteRUID` 를 칠함 · 임시 상수) | `RootDesk/MyDesk/Lane/LaneFacilityArt.mlua`(+`.codeblock`) |
| 3상태 판정 · 틴트 끔 · 쿨에 맞춘 프레임 시간 · 화살 발사 위치/지연 | `Lane/LaneFacilityService.mlua`(`ArtSpikeKey` = `HENESYS:TOWER` 한 곳만 붙임) |
| 화살 발사 지연 `ReleaseSec`(그림의 발사 프레임 시각에 맞춤) | `Lane/LaneAttackFx.mlua` |
| 공격 시작 알림 | `Faction/TurretAI.mlua` |
| 헤네시스 포탑 행: 그림 · `Scale` 만 새 그림으로(`GroundOffset 1.125` · `BarOffset 1.2` 는 옛 값 그대로) | `FacilitySprite.csv`(헤더 안 건드림) |

데이터 표는 만들지 않았다 — 프레임 RUID · 프레임 시간 · 발사 프레임 · 발사 좌표는 `LaneFacilityArt.mlua` 안 임시 상수(조각 2 에서 표로).

### 가공 · 업로드 수치

| 항목 | 값 |
|---|---|
| 원본 캔버스 | 1536×1024(일반 · 손상 공격 8장씩 같음) · 손상 정지/완파 정지 원본 1122×1402 |
| 공통 크롭(원본 px) | x 234..1306 · y 5..1021 = **1072×1016**(모든 프레임 불투명 합집합 + 여백 8 · 8 의 배수) → 50% 축소 **536×508**(4 의 배수) |
| 바닥선 · 기둥(섬) 중심 | 원본 y 998 · x 769.5(일반 8프레임 모두 같음) → 축소 뒤 피벗 px (267.75, 497.0) · 정규화 (0.4995, 아래에서 0.0217) · 바닥선 위 높이 491.5px |
| 손상 정지 정렬 | 스케일 0.74 · dx 354 · dy 8 · IoU 0.995(손상 공격 0007 에 맞춤 · 조사 §3-4 와 일치) |
| 완파 정지 정렬 | 스케일 0.73 · dx 355 · dy 6 · IoU 0.863(섬 영역만 비교 · 잔해 모양이 달라 전체 IoU 는 못 씀 · 눈 확인으로 섬이 일반 · 손상과 겹침) |
| 파일 | 18장 PNG 합계 **4.51MB**(한 장 0.24~0.30MB) · 그룹 리소스 한 장 `.win.mod` 약 0.25MB(지금 헤네시스 포탑 1.88MB 의 약 1/7 · 18장 합 4.6MB ≈ 2.4배) |
| 올린 수 | **18장**(`fac_E18-7-1_normal_0007~0000` · `damage1_0007~0000` · `damage1_still` · `damage2_still`) + 피벗 시험용 복제 3장(`fac_E18-7-1_probe_pA/pB/pC` · 못 지움 — 영구 삭제라 사용자 몫) |
| 크기(Maker 실측) | `_ResourceService:LoadSpriteAndWait` → `Width/Height/Pivot/PivotPixel` 이 읽힌다: 새 그림 536×508 · **옛 `Henesis_Tower` = 1536×1024 · pivot (0.5, 0.5)**(= 새 원본과 같은 캔버스) |

시설 크기: 옛 그림 높이를 같은 장면에서 재면 약 2.33유닛(화면 286px ÷ 122.5px/유닛) · 새 그림은 `Scale 0.47` 에서 491.5×0.0047 = **2.31유닛**(캡처 01 에서 높이 · 바닥선이 같다) → `GroundOffset 1.125` · `BarOffset 1.2` 를 그대로 둬도 맞았다(계산값 1.12 / 1.15+).

### 피벗 속성이 하는 일 (Maker 실측 · 캡처 09)

| 올린 값(`pivot_x`, `pivot_y`) | `PivotPixel`(536×508) | 화면 |
|---|---|---|
| (0.4995, 0.5)(지금 쓰는 값) | (267, 254) | 그림 가운데가 엔티티 위치 |
| (0.4995, **0.0217**) | (267, **11**) | **원점이 그림 바닥** — 그림이 원점 위로 올라감 |
| (**0.9**, 0.5) | (**482**, 254) | 그림이 원점 **왼쪽**으로 |
| (**0.1**, **0.9**) | (53, **457**) | 그림이 원점 오른쪽 · 아래로 |

- **좌표계 = 왼쪽 아래 (0,0) · 오른쪽 위 (1,1)** (y 는 아래에서부터). `PivotPixel` = floor(값 × 크기). → 한 종류의 `pivot_x = 기둥중심/폭` 으로 7-2 · 7-3 의 치우친 기둥도 반전 때 안 튀게 할 수 있다(길 1 확인됨).
- 🔴 `asset_update_resource_storage_info` 는 **속성 목록을 통째로 바꾼다**(안 적은 키는 사라짐) → `upload.cjs --props` 는 기록해 둔 속성에 합쳐 전부 보내도록 고쳤다.
- 🔴 **이미 올린 RUID 의 속성을 바꾸면 Maker 가 옛 값을 계속 썼다**(바꾼 뒤 새 Play 에서도 `PivotPixel` 이 그대로 (267, 254)) → 피벗은 **새 RUID 를 올릴 때** 정해야 한다. 시험에 쓴 프레임 3장(`normal_0003/0002/0001`)은 속성을 원래 값으로 되돌렸다.
- 시설은 지금 규칙(엔티티 위치 = 그림 가운데 + `GroundOffset`)을 그대로 쓰려고 **가운데 피벗(0.4995, 0.5)** 으로 올렸다. 바닥 피벗(위 표 둘째 줄)으로 올리면 `GroundOffset` 을 0 으로 줘야 해서 히트박스(세로 = 2×Ground) · 오라 · 사거리 보정이 같이 바뀐다 → 조각 2 에서 정할 일.

### 확인 결과 (개인 월드 Play · 테스트맵 `Test_Lane_Fx` 헤네시스 줄 · 게임 아바타(모험가) · 캡처 `WorkOrders/data/WO-040-spike/`)

캡처 · 재생/발사 타이밍 수치는 커밋된 파일(`e8670d7`)로 Play 한 한 세션(공격 약 84회 · 프레임 칠하기 600회)에서 집계했다. 손상 겹침 구간(54 · 56 · 45%) · Lv3 프레임 시간 · 연타 재시작 · 예열 첫 로드 0.844초는 **같은 로직의 직전 개발 세션**(커밋 전 파일 · 대기 프레임과 `ReleaseExtraSec` 만 다름)에서 확인했고 커밋 파일에서는 다시 돌리지 않았다.

| 항목 | 판정 | 근거 |
|---|---|---|
| (a) 위치 · 크기 · 바닥선 · 체력 바 | **된다** | 옛 그림과 같은 장면에 나란히(`01`): 높이 · 바닥선이 같고 HP 바가 깃대 위에 같은 간격 |
| (b) 재생 — 끊김 · 깜빡임 | **된다 · 조건부(예열)** | 한 사이클 평균 **0.972초**(설정 8×0.12=0.96 · 범위 0.960~1.055) · 칠하기 간격 중앙 17.3ms(95% 18.8ms) · 프레임 정지 없음(예열 켠 상태). 스크린샷 찍는 순간 11/600 번 0.03~0.33초 멈춤 → 그때는 프레임을 건너뛴다(시간 기준 따라잡기) · 평소 재생엔 없음 |
| (b) 연속 공격 재시작 | **된다** | 0.3초 · 0.5초 간격 연타 3번 → 매번 `f1` 부터 다시(로그 `play start seq=10/11/12` 사이에 `f3` · `f2` 까지만 가고 재시작) · 마지막만 `play end` |
| (b) 첫 로드 | **판단 보류(정지는 없음)** | `PreloadAsync` 18장: 처음(디스크에 없음) **0.844초**(비동기 · 프레임 정지 없음) · 이후 세션 0.000초. 예열을 끈 첫 공격도 8프레임 모두 dt 16~18ms. 다만 렌더러에 "로드 끝" 신호가 없어 **빈 화면이 비치는지는 못 봤다**(스크린샷은 프레임 단위가 아님) → 예열은 켜 둔다 |
| (c) 발사 타이밍 | **된다(로컬)** | 화살을 서버가 `ReleaseSec = 0.12 + 0.05` 뒤에 낸다 → 실제 지연 평균 0.157초. 클라가 공격 소식을 받아 첫 그림을 칠하기까지 **평균 43ms**(20~229ms). 화살 − 섬광(f2) 평균 **−15ms**(−198~+40ms · 소수는 캡처 멈춤). 마커로 보면 화살 출발점이 포구 앞(`07`) · 실전 연속(`08`): 섬광 → 화살이 포구에서 나감 → 연기 |
| (c) 발사체 겹침 | **어색함(결정 거리)** | 그림 안에 검은 포탄이 이미 날아가는데(f3~f5) 지금 화살(초록)이 같이 나간다 → 포탄 둘. 7-1 은 포탄 연출로 바꾸거나 그림 속 포탄을 지우는 결정이 필요(지시서 ⑩⑫) |
| (d) 손상 3상태 | **된다** | 체력 50% → `tier 0→1` · 손상 대기 그림 + 손상 공격 8프레임(`03`) · 54% 에서 그대로 1 · 56% 에서 0 · 45% 에서 다시 1(겹침 구간 확인) · HP 바 노랑 |
| (e) 파괴 → 완파 · 재건 → 일반 | **된다** | `TestDestroyFacility` → `tier 1→2` 완파 정지(`04`) · `TestSetFacilityLevel` → `tier 2→0` 일반 복귀 · 파괴 시 회색 반투명 틴트는 이 시설엔 안 걸림 |
| (f) 좌우 반전 | **된다** | 같은 엔티티의 `FlipX` 를 켜고 끈 두 캡처(`05`): 섬 중심이 피벗 세로선 ±3px(화면) 안에서 같은 자리 · 위치 안 튐 |
| (g) 층 | **된다** | 플레이어(`Default/4`)가 시설(`MapLayer0/150`) 앞에 그려짐(`06`) · 층 값은 안 바꿈 |
| (h) 서버/클라 값 | **된다** | `[FacArt] attack seq=N sT=…`(서버) ↔ `play start seq=N sT=…`(클라) 한 쌍씩 · `tier a -> b` 서버 · `client tier a -> b` 클라 · Lv3: 쿨 1.10 → `FrameSec 0.103` · 발사 지연 0.103+0.05 |

### 눈에 띈 것 (그림 · 설계)

- 🔴 **일반 프레임 `0003` · `0000` 의 버섯 갓 무늬가 초록**(무늬 색 픽셀: 노랑 계열 1500~1700 → 0003 은 노랑 248 + 초록 675 · 0000 은 노랑 149 + 초록 662 · 나머지 6장은 초록 0) → 공격 한 사이클 동안 갓 무늬가 노랑 → 초록 → 노랑 → 초록으로 번쩍인다(`02`의 f5 · f8). 손상 8프레임은 괜찮다. 디자이너 확인 거리(조사 §3-2 의 "7-1 0000 색 변화"가 사실이었다 + 0003 도).
- 🔴 `0000` · `0001` 에는 포구 앞 허공에 **연기 조각이 떠 있다** → 지시서의 "대기 프레임 = 0000" 으로 두면 가만히 있을 때도 허공에 얼룩이 떠 있어 어색해서 **대기 프레임을 `0007`(첫 프레임)로** 했다(`LaneFacilityArt.IdleFrameNo`). 사용자 확인 거리.
- **스크린샷은 `execute_script` 직후에 찍으면 이전 화면이 찍힌다**(0.7~1.5초 늦게 반영) → 상태를 바꾼 뒤 2초 이상 기다렸다 찍었다.
- 프레임 재생은 시간 기준(`playT += delta`)이라 멈칫하면 중간 프레임을 건너뛴다(로그 `f5 … dt=0.15` 다음 `f7`). 평소 재생엔 해당 없음.
- 서버 `SpriteRUID` 는 표의 대기 그림 하나(`normal_0007`) · 클라 컴포넌트가 처음 칠한 뒤부터 클라 로컬 값으로 바꿔 간다(서버 값은 안 건드려서 덮어쓰기 없음 · `Color` 만 서버 → 클라 동기화).

### 못 본 것

- 실제 네트워크 지연에서의 `AttackSeq` 동기(로컬은 43ms · 실제는 더 길어 화살이 섬광보다 먼저 보일 수 있음) · 모바일 · 두 명 이상.
- 예열을 끈 **첫 로드 때 빈 화면이 비치는지**(위).
- 레벨 2 · 3 의 연출 겹침(Lv1 만 눈으로 · Lv3 은 로그로 프레임 시간 · 발사 지연만).
- 엘리니아 · 노틸러스처럼 원래 `FlipX=false` 인 줄에 같은 그림을 세운 장면(대신 헤네시스 엔티티를 뒤집어 확인).
- 클립 방식(Maker 편집기 · 그룹 소유 · 재시작)은 사용자 손 필요 → 안내문만.

### 다음 (조각 1~2 에서 정할 것)

- 사용자 결정: ① 대기 프레임(0007 / 0000) ② 그림 속 포탄 vs 화살(지시서 ⑩⑫) ③ 7-1 갓 무늬 초록 프레임(디자이너 재작업 요청 여부 · 지시서 ⑱) ④ 프레임 시간(쿨의 75% · 0.06~0.12 상한) ⑤ 피벗(가운데 vs 바닥 · 위 절) ⑥ 화살을 클라 연출로 옮길지(네트워크 지연 대비 · 서버는 피해만 시각 지연).
- 다른 종류(7-2~7-5 · 8-x · 9-x): 같은 도구로 가공 · 업로드(`prep.py` 에 종류 인자 추가) → 표(`FacilityArt`)로 상수 옮기기.


## 2026-10-02 — WO-040 조각 2~4 (코드 · 표): 시설 그림 일반화 · 3상태 · 공격 시점

브랜치 `a/lane-facility-art` (Draft PR #154). Maker 없이 만든 구조 — **Play 확인은 뒤 단계**(아래 "Maker 로 확인할 것").
조각 0 의 시험 구현(헤네시스 포탑에만 걸리는 임시 상수 `ArtSpikeKey` · `BuildSets`)을 **표 기반**으로 바꿨다. 14종 전부를 표 값만 채우면 돈다.

### 새 표 `FacilityArt` (계약서 A-2-4c · `RootDesk/MyDesk/FacilityArt.csv` + `.userdataset` · BOM + CRLF)

한 행 = 마을 × 시설 × 상태. 45행(5 × 3 × 3).

`VillageId,Stage,State,Frames,FrameSec,Mode,IdleIndex,ReleaseIndex,ReleaseOffsetX,ReleaseOffsetY,CanAttack,Enabled,#Note`

| 열 | 뜻 |
|---|---|
| `Stage` | 기존 표 표기 그대로 `TOWER`/`SUPPRESSOR`/`CORE`(넥서스) — 브리프 예시의 `FacilityType` 대신 `FacilitySprite` 와 키를 맞췄다 |
| `State` | `NORMAL`/`DAMAGE1`/`DAMAGE2` (브리프의 `Tier` 열은 두지 않았다 — 코드가 0/1/2 로 매긴다) |
| `Frames` | 재생 순서 RUID 를 `\|` 로 이은 한 칸 |
| `FrameSec` · `Mode` | 프레임 시간 · `ATTACK`(공격 때 한 번 재생) / `LOOP`(상시) / `STILL`(정지) / `HIDDEN`(그림 없음) |
| `IdleIndex` · `ReleaseIndex` | 대기 프레임(0 = 첫 프레임) · 발사체가 나가는 프레임(-1 = 지연 없음) |
| `ReleaseOffsetX/Y` | 발사 위치(유닛 = 그림 px ÷ 100 · 반전 전 · 시설 `Scale` 은 코드가 곱함). 둘 다 있으면 `FacilityAttackFx.LaunchOffset` 을 덮는다 |
| `CanAttack` | `false` = 이 상태에선 공격 안 함(헤네시스 억제기 손상) |
| `Enabled` | 꺼진 행은 무시 · `NORMAL` 이 꺼진 시설엔 재생기가 안 붙어 **지금 방식(정지 그림 + 틴트)** 그대로 |

- **프레임을 한 칸에 넣은 이유**: 한 행 = 한 클립이라 읽고 고치기 쉽고, 최대 15프레임(약 500자)이라 칸 길이 문제가 없을 것으로 봤다. 별도 `FacilityArtFrame` 표로 나누면 조인 · 순서 열이 더 필요하다. **(Maker 가 긴 칸을 되쓰는지는 Maker 로 확인)**
- **행**: 헤네시스 포탑(7-1) 3상태 = 조각 0 의 RUID(`ruid-map.json`)로 `Enabled=true`. 나머지 13종 × 3 = **틀 행**(`Enabled=false` · 종류별 기본 `Mode` · `CanAttack` 만 채움 · `Frames` 비어 있음). 노틸러스 넥서스(9-5 없음) = `Mode=HIDDEN` 3행(`Enabled=false` — 클릭 영역을 확인한 뒤 켠다).
- 기본 모드: 7-1~7-5 포탑 `NORMAL`/`DAMAGE1` = `ATTACK`(7-5 도 한 번 재생 · 반동) · 8-1 `NORMAL` = `ATTACK` · 8-2~8-5 · 9-1~9-4 `NORMAL` = `LOOP` · 손상(8-x · 9-x)/완파 = `STILL` · 8-1 `DAMAGE1` = `STILL` + `CanAttack=false`.
- 등록: `Docs/스키마-계약.md`(A-2-4c · 변경 이력) · `Docs/tools/check-integrity.cjs`(CANONICAL · 키 `VillageId`+`Stage`+`State`) — 통과(45행). 사용자 직접 지시라 #40 공지 생략. 기존 표 헤더 변경 없음.

### 코드

| 파일 | 한 것 |
|---|---|
| `Lane/LaneStateService` | `LoadArtDef`(표 로드 · 행 수 로그 `[Lane] FacilityArt loaded: N rows · enabled+valid M` · 1-based) · `FacilityArtDef(마을, 시설, 상태)` · `FacilityArtEnabled` · 테스트용 `TestSetFacilityHpPct` |
| `Lane/LaneFacilityArt` | 임시 상수 제거. 서버가 `@Sync` `Key`(마을:시설) · `Tier` · `AttackSeq` · `FrameSec` 만 쓰고, **클라가 표를 직접 읽어**(`_DataService` — LaneStateService 는 서버 전용) 프레임을 넘긴다. `Mode` 별 동작 · `Tier` 가 바뀌면 그 세트로 즉시 교체(공격 중이면 끊음) · 쓸 프레임 미리 불러오기 · 행이 없으면(`DAMAGE*` 만 꺼짐) 일반 그림 정지 + 서버 틴트 |
| `Lane/LaneFacilityService` | `ArtSpikeKey` 제거 → `FacilityArtEnabled` 인 시설에 재생기 부착(`Key` 지정) · `ApplyVisual`: 모든 시설에 Tier 판정(체력 ≤ 50% → 1 · 55% 초과 → 0 · 파괴 → 2) · 그 상태 행이 켜져 있으면 틴트 대신 그림(`HasTierArt`) · 주인 없는 마을 회색 틴트 유지 · `HIDDEN`(노틸러스 넥서스)은 알파 0 · **Tier 가 바뀌면 `ApplyCombat` 을 다시**(피격마다가 아니라 임계를 넘을 때만 — 발사 위치 · 프레임 시간 갱신) |
| `Faction/TurretAI` | 재생기가 있으면 `CanAttackNow()` 가 `false` 인 상태에선 쏘지 않는다(쿨 · 사거리 · 오라 등 다른 기능은 그대로 · 수리하면 재개) · 옛 "헤네시스 포탑만" 문구 정리 |
| `Lane/LaneAttackFx` | 바꾼 것 없음 — 조각 0 의 `ReleaseSec`/`LaunchOffset` 구조를 표 값으로 채운다(`LaneFacilityArt.ApplyToFx`: 표에 발사 위치가 있으면 그것 · 없으면 `FacilityAttackFx` 값 · `ReleaseIndex ≥ 0` 이면 `ReleaseIndex × FrameSec + 0.05`) |
| `Lane/LaneTestDriver` · `LaneTestRemoteUI` · `ui/LaneTestRemoteGroup` | "체력 N%" 명령 `HP50`/`HP30`/`HP100`(키보드 `-` = 50 · `=` = 100) + 리모콘 패널 맨 아래에 버튼 3개(체력 50% · 30% · 100%). 기존 요소 좌표는 그대로 · 패널 높이만 560 → 660(가운데 기준으로 자람) · 버튼 UUID 는 `write({bind})` 가 주입 |

- **프레임 시간 규칙 변경**: 조각 0 은 쿨의 75% · 0.06~0.12 상한 · 새 규칙은 **재생 길이 ≤ 쿨 × 0.9** → `min(표 FrameSec, 쿨 × 0.9 ÷ 프레임 수)` · 하한 0.03(`CooldownFit` · `MinFrameSec`). 7-1 Lv3(쿨 1.1) = 0.124 → 표 상한 0.12 가 걸려 **0.12**(조각 0 은 0.103).
- 공격하지 않는 상태(`STILL`/`LOOP`)는 `AttackSeq` 를 올리지 않는다(`NotifyAttack` 은 `ATTACK` 모드에서만).
- 손상 정지 `damage1_still`(7-1) 은 안 쓴다 — 손상 `ATTACK` 의 `IdleIndex 0`(= `damage1_0007`)이 같은 그림.
- `.codeblock` 은 건드리지 않았다(`LaneFacilityArt` 의 property 가 바뀌어 Maker 가 refresh 로 다시 만든다).

### 뒤 단계가 채울 것 (종류별 · `FacilityArt.csv` 행 값 + `FacilitySprite.csv`)

공통: 가공 · 업로드가 끝나면 `ruid-map.json` 의 프레임 RUID 를 `Frames`(재생 순서 = 번호 높은 것 → 낮은 것)에 넣고 `Enabled=true`. `FacilitySprite` 는 새 `WorldRuid`(대기 프레임) · `Scale` · `GroundOffset` · `BarOffset` · 아이콘.

| 종류 | 채울 것 |
|---|---|
| 7-2 · 7-3 · 7-4 | `NORMAL` 프레임(8 · 15 · 10) + `DAMAGE1` 손상 공격 프레임 + `DAMAGE2` 완파 정지 · `ReleaseIndex` · `ReleaseOffsetX/Y`(`발사체좌표.txt` 일반 · 손상 따로) · `FrameSec`(7-3 15프레임은 쿨에 맞춰 런타임이 줄임) |
| 7-5 | `NORMAL`/`DAMAGE1` 5프레임(상하 움직임 · `ReleaseIndex -1` · 발사 위치는 `FacilityAttackFx` 그대로 둘지 결정) + 완파 |
| 8-1 | `NORMAL` 12프레임(`ATTACK` · 발사 = 석궁 화살 프레임) · `DAMAGE1` = 석궁이 떨어진 정지 1장(`CanAttack=false` 는 이미 채워 둠) · `DAMAGE2` |
| 8-2~8-5 · 9-1~9-4 | `NORMAL` `LOOP` 프레임(`FrameSec` 기본 0.12 — 거의 정지인 8-2 · 8-3 · 9-1 · 9-3 · 9-4 는 `Mode=STILL` 로 바꿀지 사용자 결정 ⑭) · `DAMAGE1`/`DAMAGE2` 정지 |
| 9-5 노틸러스 넥서스 | 그림 없음 — `HIDDEN` 3행은 이미 있음. 클릭 · 위치 확인 뒤 `Enabled=true` · 위치/크기는 `FacilitySprite` |

### Maker 로 확인할 것 (이 조각에선 못 했다 — Maker 도구를 안 썼다)

1. `Reimport All`/refresh 2회(새 `FacilityArt` 데이터셋 · `LaneFacilityArt`/`LaneStateService`/`TurretAI`/`LaneTestRemoteUI` 의 `.codeblock` 재생성) · 빌드 경고 0.
2. 로그: `[Lane] FacilityArt loaded: 45 rows · enabled+valid 3` · 클라 `[FacArt] first paint HENESYS:TOWER …` (프레임 `Frames` 칸이 한 칸에 270자 안팎인데 정상으로 읽히는지).
3. **7-1 회귀**: 조각 0 과 같은 장면(공격 사이클 ≈ 0.96초 · 발사 위치 · Lv3 프레임 시간 0.12 · 연타 재시작 · 반전 · 층).
4. **체력 N% 버튼/키**: 50% → `tier 0 -> 1` + `[Facility] combat` 한 줄(임계에서만) + 손상 공격 8프레임 · 56%/100% → 일반 복귀 · 45% 다시 손상(겹침 구간) · 파괴 → 완파 · 재건 → 일반.
5. `ReleaseOffsetX/Y` 가 `FacilityAttackFx.LaunchOffset` 을 덮는지(7-1 화살 출발점이 조각 0 과 같은지) · 손상 상태에서 발사 위치가 손상 값으로 바뀌는지.
6. 헤네시스 억제기 8-1 행을 채운 뒤: 손상 → 공격 멈춤 · 수리 → 재개(`CanAttack`).
7. 노틸러스 넥서스 `HIDDEN`: 알파 0 인데 클릭(소유권 연결) · 체력 바가 되는지 · 파괴 시 회색 반투명이 안 비치는지.
8. 리모콘 패널 높이 660 · 새 버튼 3개 배치(눈 확인 — 이 조각에선 못 봤다).
9. 빈 틀 행만 있는 시설(예: 커닝 포탑)이 **지금과 똑같이**(정지 그림 + 틴트) 도는지.
