# b/skill-enhance-discount — 연성(SK_M12) 장비 강화 메소 할인

## 2026-10-01

🔴 **A 파일** `Item/EnhanceService.mlua` 를 고친다 — #40 5884390429 2번 "B 가 넣는다 · A 가 리뷰로 승인 · 할인은 메소만".

| 항목 | 예전 | 지금 |
|---|---|---|
| 장비 강화 메소 비용 | `MesoCost × 부위 수` 그대로 | × `_JobPassiveLogic:GetJobCostMul(userId, "ENHANCE")` · 내림 · 원래 1 이상이면 최소 1 |
| 보석 개수 | 그대로 | 그대로(할인 없음) |

- 배율 = 1 − 연성 효과 %/100. 연성 = CSV BaseEffect 30 + 5/lv → **Lv1 30% · Lv5 50% 할인**(×0.7 ~ ×0.5). 안 배웠으면 ×1 이라 예전과 같다(로그도 안 찍는다).
- 부동소수 오차로 70 이 69 로 내려가지 않게 내림 전에 1e-6 을 더한다.
- 로그 한 줄(할인이 걸릴 때만): `[Item] enhance meso <원래> -> <할인> (연성 x<배율>) (<uid>)`. 성공 로그 `meso-<값>` 도 할인된 값.
- ⚠ **표시는 그대로다:** 공방 창 `Item/WorkshopUIController.mlua:567`(A · 클라)은 `row.mesoCost × PieceCount` 를 그대로 보여 준다 → 연성이 있으면 창의 값보다 적게 빠진다. 같은 배율을 곱하는 한 줄(클라에서도 `GetJobCostMul` 이 로컬 유저 미러로 동작)은 A 몫으로 남겼다.
- LSP `EnhanceService` 깨끗 · `check-integrity` 통과.

### Play 확인
1. 마법사 · 연성 0 레벨: 강화 → 메소가 창의 값 그대로 빠진다 · `[Item] enhance meso` 줄 없음.
2. 연성 Lv1: 같은 강화 → `[Item] enhance meso N -> floor(N×0.7)` · 메소 카운터가 할인된 값만큼 준다 · 보석은 그대로 빠진다.
3. 연성 Lv5 → ×0.5 · 한벌옷(부위 2)도 두 배 값에서 할인.
4. 메소가 할인된 값 이상 · 원래 값 미만일 때 강화가 된다(거절 문구 숫자 = 할인된 값).
5. 빌드 경고 N → N.
