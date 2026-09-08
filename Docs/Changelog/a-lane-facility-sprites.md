## 2026-09-08 — 레인 시설 3종 전용 아트 + 시설 그림을 마을별 표로

### 배경
넥서스 · 억제기 · 타워는 지금까지 메이플 맵 오브젝트를 임시로 빌려 쓰고 있었다
(넥서스 `gran_helisium` · 억제기 `demensionlibrary` · 타워 `arteria/ereb`).
임시 아트를 억지로 맞추려고 넥서스에 **2.5배 확대**, 억제기에 **상하 반전**이 걸려 있었다.
사용자가 헤네시스 전용 아트 3장을 **그룹 리소스 스토리지**(groupCode `mIYbC`)에 업로드해 정식 교체.

교체하려고 보니 시설 그림이 **`.model` 3개 · `.ui` 2개 · `.mlua` 1곳에 각각 박제**돼 있었다.
사용자 결정(2026-09-08): **시설 아트는 애초에 마을마다 달라야 한다** → 그림을 표로 빼고 런타임에 꽂는다.

### 결정 (사용자 2026-09-08)
- **`Scale`** — 먼저 "비율 1:1" = `(1,1,1)`(원본 픽셀 크기)로 되돌렸는데 **화면에서 너무 커서 `(0.25, 0.25, 1)`** 로 낮췄다(사용자 2026-09-08). 억제기 `FlipY` 해제.
- **타워는 `FlipX = true`** — 반대 방향을 보게 (사용자 2026-09-08). 마을 공통이라 표가 아니라 `.model` 값이다.
- **바닥 오프셋·HP바 높이도 표의 열로.** Scale 0.25 로 줄이니 시설이 붕 뜨고 포탑 HP바가 한참 위에 남았다.
  값은 **블럭 한 칸 = 0.65 유닛**(사용자 실측) 기준 **절반(0.325)만큼 세 시설 모두 하향**, 포탑 HP바는 억제기와 같은 오프셋으로.
- **마을 × 시설 매핑은 새 CSV 표.** 아트가 추가될 때마다 **행만** 고치고 코드·`.model`·`.ui` 는 안 건드린다.
- **아트 없는 4개 마을(엘리니아·커닝·페리온·노틸러스)은 현재 임시 RUID 유지.**
- **월드/아이콘 RUID 는 열을 분리.** 전용 아트는 두 칸이 같지만, 임시 넥서스는 UI 에 쓰면 `[LEA-3044]` 라 달라야 한다.
- Maker 를 쓰는 다른 세션이 있어 **worktree 에서 파일만** 수정, Maker 없이 진행.

### 새 표 — `FacilitySprite` (계약서 A-2-4b 등록)

```
VillageId,Stage,WorldRuid,IconRuid,FlipY,GroundOffset,BarOffset,Enabled,#Note
```

15행 = 마을 5 × `Stage` 3 (`LITH` 는 점유 불가라 없다). 빈 칸 = "기본값 유지"(빈 RUID 를 대입하면 그림이 사라진다).

| Stage | GroundOffset — 헤네시스 | GroundOffset — 나머지 4곳 | BarOffset |
|---|---|---|---|
| `TOWER` | **1.125** | 1.785 | 1.2 (억제기와 동일하게 내림) |
| `SUPPRESSOR` | **1.125** | 1.665 | 1.2 |
| `CORE` | **1.125** | 1.125 | 1.2 |

조정 경로: 옛값(0.81/0.69/1.45) → 블럭 절반(0.325) 하향 → 포탑·억제기만 2칸(1.30) 상향 →
**헤네시스는 사용자가 Maker 에서 보고 세 시설 모두 1.125 로 통일**(2026-09-08).
아트가 아직 임시인 나머지 4개 마을은 상향 단계 값 그대로 — 전용 아트가 나오면 그때 다시 잰다.
HP바는 `slotY + GroundOffset + BarOffset` 이라 시설과 같이 움직인다.

> `LaneFacilityService` 의 폴백 상수(포탑 1.785 · 억제기 1.665 · 넥서스 1.125)는 **표를 못 읽을 때만** 쓰인다.
> 헤네시스 실측값(1.125)과 다르지만 정본은 표다.

| 마을 | TOWER | SUPPRESSOR | CORE |
|---|---|---|---|
| **HENESYS** | `b772211b…` `Henesis_Tower` | `e20012f6…` `Henesys_Inhibitor` | `ca23c8d4…` `Henesis_Nexus` |
| 나머지 4곳 | `781d0548…` 임시 | `ccdeb5e0…` 임시 · `FlipY=true` | 월드 `8adca861…` / 아이콘 `dab6ddee…` |

### 변경 파일

| 파일 | 무엇 |
|---|---|
| `RootDesk/MyDesk/FacilitySprite.csv` + `.userdataset` | **신규.** 위 표 |
| `Docs/스키마-계약.md` | **A-2-4b 등록** (헤더 정본 · 열 설명 · 읽는 곳) |
| `Docs/tools/check-integrity.cjs` | `CANONICAL` + `KEY(VillageId+Stage)` 추가 |
| `Models/Structures/LaneNexus.model` | `SpriteRUID` → `ca23c8d4…` · `Scale (2.5,2.5,1) → (0.25,0.25,1)` |
| `Models/Structures/LaneSuppressor.model` | `SpriteRUID` → `e20012f6…` · `Scale → (0.25,0.25,1)` · `FlipY true → false` |
| `Models/Structures/LaneTower.model` | `SpriteRUID` → `b772211b…` · `Scale → (0.25,0.25,1)` · `FlipX → true` |
| `Lane/LaneStateService.mlua` | `spriteDef` + `LoadSpriteDef()` + `FacilityWorldRuid/IconRuid/FlipY/GroundOffset/BarOffset`. 표가 없으면 폴백 |
| `Lane/LaneFacilityService.mlua` | 스폰 직후 월드 `SpriteRUID`·`FlipY` 를 마을별로 대입 · `GroundOffset(stage)`→`(villageId, stage)`, `BarOffset` 도 동일하게 표에서 읽음 |
| `Npc/VillageDefenseUIController.mlua` | 방어선 노드 + 시설 카드 아이콘을 `T` 행 16·17번으로 |
| `Npc/VillageLifeUIController.mlua` | 모집 프리뷰 아이콘 하드코딩 테이블 제거 → `FRONT` 행 7·8번 |

`.model` 값은 이제 **기본값** 역할이다(런타임이 마을별로 덮어씀). `.ui` 에 박힌 아이콘도 그대로 두되 런타임이 이긴다.

### 뷰 행 계약 (payload append-only · §6-3)
- `defense` 의 `T` 행: 15필드 → **17필드** (16 `IconRuid` · 17 `FlipY`)
- `recruit` 의 `FRONT` 행: 6필드 → **8필드** (7 `IconRuid` · 8 `FlipY`)

### 🔴 이어서 해야 할 것
1. **오프셋 미세조정** — 위 값은 "블럭 절반(0.325) 하향" 이라는 **한 번의 어림값**이다. 딱 맞을 때까지는
   `FacilitySprite.csv` 의 `GroundOffset`/`BarOffset` 칸만 고치고 refresh 하면 된다 (코드 수정 불필요).
   ⚠️ 리소스 API(`asset_get_group_resource_metadata_bulk` · `asset_get_group_thumbnail`)는 **업로드 자산의 픽셀 크기를
   돌려주지 않는다**(`resultCode 2` / `Missing resultData`) → 계산이 아니라 **실측**이다.
   포탑 `BarOffset` 을 억제기와 같은 1.2 로 뒀는데, 피벗 기준이라 포탑이 더 높으면 바가 몸통 안으로 들어갈 수 있다.
2. **`LaneNexus.HitComponent.BoxSize (3,5)`** — 2.5배 스프라이트 기준값. Scale 0.25 에서는 아트 대비 크게 과하다.
3. **그룹 업로드 스프라이트가 UI `ImageRUID` 로 뜨는지 확인** — 안 뜨면(`[LEA-3044]`) 헤네시스 3행의
   `IconRuid` 만 별도 RUID 로 바꾸면 된다. 코드는 안 고쳐도 된다.

### 검증
Maker 없이 파일만 수정. 런타임 검증은 머지 후 월드를 새로 열어서 한다.
- `ModelBuilder` 되읽기: 세 모델 `SpriteRUID` · `Scale (0.25,0.25,1)` · 억제기 `FlipY=false` · 타워 `FlipX=true` ✅
- `mlua-diagnose`: 수정한 `.mlua` 4개 **errors 0 · warnings 0** (남은 `LIA-1114` Info 는 기존 노이즈) ✅
- `check-integrity`: `[C1] FacilitySprite (15행)` · `[C3] FacilitySprite (VillageId+Stage)` 통과 · 경고 3건은 기존 그대로 ✅
- 남은 확인: `refresh` **2회**(모델 값 변경은 1회로는 옛 값이 읽힌다) → Play →
  ① 헤네시스 레인에서 세 시설이 새 아트로 보이는지 · 크기 · **바닥이 발판에 붙는지** · **포탑 HP바가 내려왔는지**
  ② 다른 마을은 예전 그대로인지(억제기 뒤집힘 유지)
  ③ 방어 창 노드·카드 아이콘, 모집 창 프리뷰 아이콘이 마을에 맞게 바뀌는지
  ④ 로그 `[Lane] FacilitySprite loaded: 15 rows applied`
