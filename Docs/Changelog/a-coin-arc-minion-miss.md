# a/coin-arc-minion-miss — 메소 동전 포물선 · 미니언 MISS 무반응 (PR #125 · WO-035)

base `main` e6fbbaa. WO-035 의 D · C 중 #122 에 못 넣었던 부분(그때 두 파일이 #121 · #120 에 잠겨 있었다). 사용자 결정 2026-09-29: #122 머지 뒤 새 브랜치로.

## 바뀐 것

| # | 증상 | 원인 | 고침 | 파일 |
|---|---|---|---|---|
| D | 사냥 드랍 동전이 튀어서 위 발판에 얹힌다 | 떨어지는 연출이 따로 없고 생성 순간 물리 힘(`AddForce` 위 2.5 · 좌우 ≤1.6) 한 번 뒤 엔진 물리에 맡겼다 | 서버가 **포물선으로 직접 옮겨 생성된 층의 발판에 내려놓는다**(사용자 결정 "원작식 포물선 연출로 교체"). 착지 x = 생성 x ± `ArcSpread` · 착지 y = 그 x 아래 발판(맵 `FootholdComponent:Raycast`). 퍼진 자리가 절벽 밖·다른 층이면 제자리 · 발판을 아예 못 찾으면 예전 물리(위로 힘은 1.2 로 낮춤). 비행 중 Rigidbody 끔 · 줍기·자석은 착지 뒤부터 | `Farm/MesoCoin.mlua` |
| C | MISS 여도 미니언·수비대·팜 몹이 밀린다 | `MonsterHit.HandleHitEvent` 가 피해량을 안 보고 넉백·경직을 걸었다 | 피해 0 은 **아무 반응 없음**(사용자 결정) — 넉백 간격(`LastKnockTime`)도 쓰지 않는다 | `Faction/MonsterHit.mlua` |

- 새 property(눈으로 맞추는 값): `ArcSeconds` 0.45 · `ArcHeight` 0.6 · `ArcSpread` 0.5 · `RestOffsetY` 0 · `ArcFloorSearch` 1.5 · `ArcSameFloorTolerance` 0.5.
- 픽파켓 동전(B 가 같은 모델로 생성)은 코드 변경 없이 같은 연출을 따른다. `Value` · `Collected` · 금액별 그림(#121)은 그대로.
- B 파일 수정 0 · 계약서 변경 없음.

## 검증

- LSP 2파일 깨끗 · `check-integrity` 통과.
- 🟡 Maker Play(개인 월드에 이 워크트리 · Reimport All) 예정: 위에 발판이 있는 자리에서 처치 → `[MesoCoin] landed (x,y)` 의 y = 죽은 층 · 줍기·자석 동작 · 미니언에 피해 0 타격 → `[MonsterHit]` 넉백 로그 없음 · 명중 시 넉백 그대로. 동전 모양·수치는 사용자 눈.
