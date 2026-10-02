# a/design-ui-chip-g3 (디자이너 시안 갱신 · 칩 글자 대비 2단계 · 묶음 G3: 마을 생활 · 방어 시설 · 월드맵)

시안 갱신(`1790779133-4234` → `1790844637-7b1e`)의 칩 글자 규칙을 G3 창 3개에 적용한다. 칩 그림(blue · green · red)은 1단계에서 **같은 RUID 로 그림만 교체**했으므로 `.ui` 의 RUID 는 바뀌지 않는다.
규칙: 밝은 칩(`chip_gold`) 위 글자 = 잉크 `#1C1405` + 흰 그림자 · 보석 칩(`chip_blue` · `chip_red`) 위 글자 = 흰색 + 어두운 외곽선(`#050A16`) + 그림자.

## 2026-10-02 — G3 적용

| 창 | 한 것 | 칩 글자 규칙이 걸린 엔티티 | 파일 |
|---|---|---:|---|
| 마을 생활 | `S.chipText` 호출 | 13 (재료 부족 5 · MAX 8) | `ui/VillageLifeGroup` · `Docs/tools/design-ui/apply-life.cjs` |
| 방어 시설 관리 | `S.chipText` 호출 + MAX 칩 폭 51 → 53(노드 3 · 버튼 9 = 시안 실측). 버튼 MAX 는 왼쪽 2px 당김(시안 x 355.5 → 353.5) | 18 (MAX 15 · 최전방 3) | `ui/VillageDefenseGroup` · `apply-defense.cjs` |
| 월드맵 | `S.chipText` 호출 | 2 (지금 위치 · 보스) | `ui/WorldMapGroup` · `apply-worldmap.cjs` |
| 기록 · 파견 · 관문 | 바꿀 것 없음 — 쓰는 칩이 전부 `_dark`(규칙 대상 아님) | 0 | — |

- 스크립트를 두 번 돌려 `.ui` 가 바이트까지 같음 · `ui_lint` 에러 0(경고는 기존 그대로).
- 칩 글자는 전부 칩의 자식이라 `extra` 필요 없음. 글자 상자는 칩 안쪽 폭(테두리 + 1px 여백)으로 줄어듦 — 글자 Overflow 가 0(넘침 허용)이라 잘리지 않고 가운데 정렬 그대로.

### 런타임 코드 표

| 파일 | 칩 그림 교체 | 칩 글자색 직접 대입 | 고친 것 |
|---|---|---|---|
| `Npc/VillageLifeUIController` | 없음(켜고 끄기만) | 없음 | 없음 |
| `Npc/VillageDefenseUIController` | 없음(`Show` 만) | 없음 | 없음 |
| `WorldMap/WorldMapController` | 없음 | 없음 | 없음(`HereChip` 폭 113.5 / 141.5 · 글자 상자도 칩 폭으로 맞춤 — 넘침 허용이라 그대로 둠) |

## 검증 때 볼 것
- 방어 시설 창: 노드 MAX · 카드 MAX · 버튼 MAX(잉크 글자 + 밝은 그림자가 거슬리지 않는지) · 카드 "최전방"(흰 글자 + 외곽선) — 시안 12-defense s3 와 같은 상태.
- 마을 생활: 조련 줄 MAX(10-life s7 · s9) · 모집 카드 "재료 부족"(s3 · s5 · s6).
- 월드맵: "지금 위치: 로비" 칩(15-worldmap s5) · 툴팁 "보스" 칩(s3).
- 외곽선 굵기 `CHIP_OUTLINE_WIDTH = 0.25` 는 추정치 — Maker 에서 눈으로 보고 조정(`skin.cjs` 와 `UiChipText.mlua` 두 곳을 같이).
- MAX 칩 폭 53: 게임 글꼴 Maple 16 의 "MAX" 가 칩 안쪽 폭 안에 들어오는지.

## 못 한 것
- Maker 검증(눈 확인)은 하지 않음(이 단계는 Maker 미사용).
