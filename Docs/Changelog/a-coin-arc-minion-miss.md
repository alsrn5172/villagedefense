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
- 추가(사용자 결정 2026-09-29 "바닥에 다 떨어지기 전까지 안 빨려들어가게"): 물리로 떨어지는 드랍도 `IsOnGround` 가 될 때까지 줍기·자석을 막는다(`FallArmTimeout` 3초). 착지 뒤 머무는 시간은 두지 않는다.
- ✅ Maker Play 1판(2026-09-29 · 개인 월드에 이 워크트리 · 런타임 Error 0 · **실제 속도 영상 2편**). 보고서 = 허브 `handoff/검증보고서-2026-09-29-동전포물선125/`.

| 항목 | 결과(로그) |
|---|---|
| 포물선 · 죽은 층 착지 | 위 0.71 에 발판이 있는 자리(아래층 −2.87 · 위 −2.16): 발판 위에서 생성한 동전 22개(시험 16 · 평타 처치 6) 전부 `[MesoCoin] landed (…,-2.87)` · 궤적 꼭대기 y=−2.12 |
| 착지 전 줍기·자석 없음 | 비행 중 x 는 플레이어 반대쪽으로만(1.35 → 1.60) · 착지 뒤 1.48 → 0.56 → `picked` |
| 공중 드랍 | `no foothold below … physics fallback` → `falling=true` 동안 그대로 → `landed by physics (0.48,-2.21) age=0.58` → `picked` |
| 수비대 MISS | 피해 0: `staggerUntil=0.00 lastKnock=0.00` · 넉백 로그 없음 / 피해 5: `[MonsterHit] VerifyGuard knockback` |

- 못 본 것: 픽파켓 동전 · 에너지볼트 처치 드랍(#123 미포함 브랜치) · 경사 발판 · 다인 세션 · 실제 전투에서 빗나간 공격으로 본 수비대 반응(피격 함수에 이벤트를 직접 넣어 확인).
- 관찰: 레인 미니언은 `MonsterHit` 을 쓰지 않는다 — 미니언의 MISS 무반응은 #122 의 `Monster` 수정이 담당.
- 빌드 콘솔: Info 196 · Warning 1(LWA-1111 기존) · **Error 1** = `LEA-1102` `PortalNetwork.PortalSpriteSpec`(#117 에서 main 에 들어온 코드 · 이 PR 과 무관).
- 동전 모양·수치(`ArcSeconds` 0.45 · `ArcHeight` 0.6 · `ArcSpread` 0.5 · `RestOffsetY` 0)는 사용자가 영상을 보고 정한다.
