# b/skill-clone-render-order

## 2026-09-24 — 분신 · 에너지 차지 불꽃 렌더 층 = Default / 플레이어 순서값 − 1

PR #93. **출처: #40 5813565483 (A 답 · 사용자 확정 2026-09-24).** 플레이어는 발판과 무관하게 `Default` / 4 고정(A 의 `Map/PlayerFrontLayer` · 예외 = 포탈 `Default`/5). `Default` 층에서 A 가 쓰는 값은 4 · 5 뿐이고 맵에 박힌 `Default` 오브젝트는 2 이하 → 분신 = `Default` / 3 이면 플레이어 · 포탈 말고는 전부 분신 뒤.

**헤더 변경 없음 · 새 CSV 열 · 이벤트 · RPC 없음.** A 파일 수정 없음 — `_PlayerFrontLayer.PlayerSortingLayer` · `PlayerOrderInLayer` 읽기만.

### 수정 — `Skill/SkillExecutors.mlua`

| 위치 | 변경 |
|---|---|
| 속성 | `ShadowOrderInLayer = 2` → `ShadowOrderBelowPlayer = 1`(플레이어보다 몇 칸 뒤) |
| `ApplyShadowSorting` | `SortingLayer` = `_PlayerFrontLayer.PlayerSortingLayer` · `OrderInLayer` = `PlayerOrderInLayer − 1`. `_LaneFacilityService.SortingLayerBelow`(밟은 발판 층) 의존 제거 · `_PlayerFrontLayer` 가 없으면 옵션 없음 |
| 주석 3곳 | 새 규칙으로 |

영향: 쉐도우 파트너 분신(서 있기 루프 · 따라하기) · 에너지 차지 불꽃(`loopFlame.sortBehind`) — `ApplyShadowSorting` 을 부르는 곳 전부.

- 예전엔 발판 층 + 2 였다 — 플레이어가 `Default` 로 옮겨 간 뒤(A · 2026-09-22)로는 발판 층이 `Default` **아래**라 분신이 플레이어 뒤에 있긴 했지만 시설 · NPC 뒤로도 숨었고, 공중(발 아래 발판 없음)에서 걸면 옵션이 빠져 플레이어 **앞**에 그려졌다.
- #64(에너지 차지 불꽃 층이 시전한 발판 층에 고정)의 원인이 발판 층이었으므로 이 변경으로 없어질 것으로 본다 — Play 확인 전까지는 #64 를 닫지 않는다.
- ⚠ A 는 "`OrderInLayer` 는 동기화되지 않아 클라에서 써야 한다"(`PlayerFrontLayer.mlua:10`)고 했다. 이 경로는 컴포넌트 속성이 아니라 서버의 `_EffectService:PlayEffectAttached` **재생 옵션**이다 — 옵션이 클라 렌더에 반영되는지 Play 에서 확인한다(안 되면 클라 경로로 옮긴다).

### Play 검증

(재입장 · Reimport All 뒤 추가) — 쉐도우 파트너 분신 · 에너지 차지 불꽃이 플레이어 바로 뒤 · 시설 · NPC 앞 · 공중 시전도 뒤 · 로그 `layer=Default/3` · 빌드 경고 N → N
