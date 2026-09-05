# 월드맵 노드 도구

`ui/WorldMapGroup.ui` 의 빅토리아 지역 노드를 **표로 관리**하기 위한 도구 모음.
MSW 자산이 아니라 작업 도구다 — Maker 는 `Docs/` 를 스캔하지 않으므로 여기 둔다.

## 디자인 (사용자 확정)

메이플 원본 월드맵 오버레이와 같은 모양이다.

| 표시 | 뜻 | 색 | 크기(보드 px) |
|---|---|---|---:|
| 작은 노란 점 | 사냥터 `Hunt` | `#FFE04A` | 18 |
| 파란 원 | 마을 `Village` | `#3C8CFF` | 30 |
| 분홍 원 | 보스 `Boss` | `#FF46AA` | 30 |
| 금색 원 | 여섯갈래길 `Hub` | `#FFCD3C` | 34 |

- **글자 라벨을 쓰지 않는다.** 배경 지도에 지역명이 이미 인쇄돼 있어 겹친다. 이름은 hover 툴팁이 보여준다.
  (CSV 의 `ShowLabel` 은 전 행 `false`. 라벨 엔티티는 만들어만 두고 꺼 놨으니 필요하면 켤 수 있다)
- 노드는 **지도의 흰 길 위에** 놓인다. `place.py` 가 원본 이미지에서 길을 추출해 경로를 따라 배치한다.

## 왜 표로 관리하나

맵이 34개다. `.ui` 에 노드를 손으로 만들고 맵이 늘 때마다 또 손대는 건 유지가 안 된다.
그래서 **표(`RootDesk/MyDesk/WorldMapNodes.csv`)가 목록의 진상**이고 `.ui` 는 거기서 생성한다.

위치만은 예외다 — 사람이 눈으로 맞춰야 한다. 그래서 왕복 구조를 쓴다.

```
place.py ──▶ CSV ──(build)──▶ .ui ──(Maker 에서 드래그 + 저장)──▶ .ui ──(sync)──▶ CSV
```

- **런타임 진상은 `.ui`** — 컨트롤러는 CSV 의 X/Y 를 읽지 않고 엔티티의 실제 좌표를 쓴다.
- **CSV 의 X/Y·LabelDX/DY 는 재생성용 백업** — 드래그 뒤 `sync` 를 돌려야 다음 `build` 에서 안 날아간다.

## 도구

| 파일 | 언제 | 하는 일 |
|---|---|---|
| `place.py` | 배치를 원점에서 다시 짤 때만 | `victoria.png` 에서 흰 길을 추출 → 마을 아이콘 사이 최단 경로를 구해 그 위에 노드를 균등 배치 → **CSV 를 새로 쓴다**. ⚠ 기존 CSV 를 덮어쓴다 |
| `build_worldmap_nodes.cjs` | CSV 를 고친 뒤 | CSV → `.ui` 노드 생성/갱신 + Board 배경·크기 + 컨트롤러 property UUID 주입 |
| `sync_worldmap_nodes.cjs` | Maker 에서 드래그한 뒤 | `.ui` 의 실제 좌표를 CSV 의 `X/Y`·`LabelDX/LabelDY` 로 **되받아 적는다**. `--dry` 로 미리보기 |
| `victoria.png` | — | 배경 원본(640×472). `place.py` 의 입력 |
| `node_marker.png` | — | 업로드한 마커 원본. RUID `a4498657d6fa4179894b9ddf76b905d9` |

## 평소 작업 순서

1. Maker 에서 노드를 드래그해 자리를 맞춘다 → **저장**
2. `node Docs/tools/sync_worldmap_nodes.cjs --dry` 로 뭐가 바뀌는지 확인
3. `node Docs/tools/sync_worldmap_nodes.cjs` 로 CSV 에 반영

맵을 추가할 때:

1. `WorldMapNodes.csv` 에 행 추가 (X/Y 는 대충)
2. `node Docs/tools/build_worldmap_nodes.cjs`
3. `maker_refresh_workspace` → Maker 에서 드래그 → 저장 → `sync`

## CSV 열

| 열 | 뜻 |
|---|---|
| `MapName` | 맵 루트 엔티티 이름. **"현재 위치" 판정 키** (`LocalPlayer.CurrentMap.Name` 과 비교) |
| `Label` | 표시명. 지금은 라벨을 꺼 뒀지만 hover 툴팁 제목으로 쓰인다 |
| `Region` | `SixPath` / `KerningCity` / `Henesys` / `Ellinia` / `Perion` / `Nautilus` / `LithHarbor` / `Sleepywood` / `Temp` |
| `Type` | `Hub` / `Village` / `Hunt` / `Boss` / `Temp` — 위 표의 색·크기를 결정 |
| `NodeEntity` | `.ui` 엔티티 이름. 보통 `Node_<MapName>`, 임시 3맵만 `Region1~3` |
| `X` / `Y` | Board 기준 `anchoredPosition` (Board = 1280×944, 중심 원점) |
| `ShowLabel` | `false` 면 라벨을 끈다. 현재 전 행 `false` |
| `LabelDX` / `LabelDY` | 노드 기준 라벨 오프셋. 라벨을 켜고 Maker 에서 옮기면 `sync` 가 픽셀 그대로 적는다 |
| `Enabled` | `false` 면 노드를 안 만들고 런타임에서도 건너뛴다 |

## 마커 스프라이트

`WorldMapNodeDot` — RUID **`a4498657d6fa4179894b9ddf76b905d9`** (계정 리소스, 64×64).
흰 채움 + 어두운 테두리. **흰색이라는 게 핵심이다** — `Color` 는 곱셈이라 원본이 빨간 핀이면
파랑·노랑을 못 낸다(실측: `ca124a50` = `maplestory/effect/basiceff/nored2` 로 시도했다가 전부 빨강이 됐다).

## 사용자가 Maker 에서 엔티티를 지웠을 때

`InfoPanel` 처럼 안 쓰는 것을 지워도 된다 (실제로 지웠다).

- `build_` 는 `Region1~3` / `InfoPanel` 등에 `patch` 하기 전에 **존재를 확인**한다 (없으면 건너뛰고 로그만).
- `WorldMapController` 는 `infoPanel` / `infoTitle` / `infoBody` 를 전부 `isvalid()` 로 감싸고 있어
  지워도 런타임에서 죽지 않는다. 지역을 눌러도 하단 정보창이 안 뜰 뿐, hover 툴팁은 그대로 동작한다.
- 노드(`Node_*`)를 지우면 `sync` 가 `- .ui 에 없음` 으로 알려준다.

## 주의

- ⚠ **`.ui` 를 쓰기 전에 Maker 저장 여부를 확인한다.** 세 도구 모두 디스크의 `.ui` 를 읽고 쓴다.
- ⚠ `place.py` 는 **CSV 를 통째로 다시 만든다.** 드래그 결과를 지키려면 먼저 `sync` 를 돌리거나 쓰지 말 것.
- `build_` 는 기존 엔티티를 **추가·패치만** 한다. `Region1~3` 좌표는 건드리지 않고 자체 검증으로 보존을 확인한다.
- 빅토리아 맵들은 `안농` 월드 소유라 이 월드엔 실물이 없다. 노드·툴팁은 정상 동작하고,
  **"현재 위치" 마커는 두 월드를 병합해야 뜬다** (내가 서 있는 맵이 표에 없으므로 안 뜨는 게 정상).

---

# 몬스터 피격 판정 도구 (`monster-hitbox/`)

일반 몹 74종의 `HitComponent.BoxSize` / `ColliderOffset` 을 **stand 클립 첫 프레임 크기로 미리 계산해 모델에 박는다.**
런타임(`Monster.FitHitboxToSprite`)에서 매번 클립을 재지 않기 위한 것 (사용자 지시 2026-09-05). `Monster.FitHitbox` 는 기본 `false`.

| 파일 | 하는 일 |
|---|---|
| `mob_clips.json` | 몬스터 id → 모델 파일 · 리소스팩 · 클립 RUID(stand/move/hit/die …). ActionSheet 채울 때 수집한 것 |
| `harvest.cjs` | 리소스 API 로 stand 클립 첫 프레임 `width/height/pivot` 을 읽어 `mob_hitbox.json` 생성. 식: `size=(w,h)/100`, `off=(w/2−px, h/2−py)/100` (런타임 `FrameSprite.PivotPixel` 과 동일) |
| `apply.cjs` | `mob_hitbox.json` → 각 모델 `MOD.Core.HitComponent` 의 `BoxSize`·`ColliderOffset` (ModelBuilder) |

순서: **Maker stop → `node Docs/tools/monster-hitbox/apply.cjs` → refresh → play.**
⚠ 첫 refresh 뒤 스폰이 `(0,0)` 을 읽으면 **stop → refresh 를 한 번 더** (Maker 모델 캐시. 형식 문제가 아니다 — 2026-09-05 실측).
새 몬스터: `mob_clips.json` 에 행을 넣고 `harvest` → `apply`, 또는 그 모델만 `FitHitbox=true` 로 켠다.
