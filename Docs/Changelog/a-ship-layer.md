# a/ship-layer (PR #101)

로비 배 맵을 사용자가 Maker 에서 직접 조정 (2026-09-26).

| 항목 | 내용 | 파일 |
|---|---|---|
| 층 | `MapObject_2` → Default/1111111 · `MapObject_3` → Default/9999999 (MapLayer3 에서). 플레이어(Default/4)보다 앞 — 사용자 확인: 의도(포탈은 안 보여 상관없음) | `map/Orbis_Lobby_VictoriaShip` |
| 발판 | `foothold-1914` 모양 + 구운 발판(FootholdsByLayer) — Maker 저장본 그대로 | `map/Orbis_Lobby_VictoriaShip` |

## 검증

- 사용자가 개인 월드에서 조정·저장한 파일을 바이트 그대로 옮김 · `node Docs/tools/check-integrity.cjs` 통과.
