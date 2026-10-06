# b/skill-shadow-layer — 분신 · 불꽃: 시설 뒤 구역에서도 캐릭터 바로 뒤

## 2026-10-06 — A #40 6005930861 2번 (#183 머지 뒤 · 사용자 승인)

> 스킬 분신 · 불꽃은 `ApplyShadowSorting` 에서 `_PlayerFrontLayer.PlayerSortingLayer` / `PlayerOrderInLayer` 대신 `_PlayerFrontLayer:SortingLayerOf(player)` / `_PlayerFrontLayer:OrderOf(player) - self.ShadowOrderBelowPlayer` 를 읽으면 "캐릭터 바로 뒤"가 뒤 구역에서도 유지된다(뒤 구역이면 순서 0 · 시설 2 보다 아래).

- 원인: #183 부터 시설과 겹친 높은 자리의 캐릭터는 시설 뒤(그 시설 층 · 순서 1)로 간다. 분신 · 불꽃은 고정 `Default` / 3 에 그려 그때 캐릭터 · 시설보다 앞에 보였다.
- 바꾼 것(`Skill/SkillExecutors.mlua` · B 파일 하나): `ApplyShadowSorting` 두 줄 — A 가 적은 그대로. 뒤 구역이 아니면 값이 예전과 같다(Default / 4 − 1 = 3).
- 쓰는 곳(그대로): 쉐도우 파트너 분신 루프 · 따라하기 · 출현(`sortBehind`) · 에너지 차지 불꽃(`flame.sortBehind`) · `behindPlayer` 루프 · 레이징 블로우 베기 등 `ApplyShadowSorting` 을 부르는 모든 연출.
- 층은 그리는 순간에 정한다 — 루프가 도는 동안 캐릭터가 구역을 드나들면 다음에 다시 걸 때(바라보는 쪽 전환 · 따라하기 복귀)에 바뀐다. 그 사이엔 예전 층에 남는다.
- **Play 안 함** — 숫자 N15 · 모습 R36.
