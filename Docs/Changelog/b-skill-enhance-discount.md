# b/skill-enhance-discount — 연성(SK_M12) 장비 강화 메소 할인

## 2026-10-01

🔴 **A 파일** `Item/EnhanceService.mlua` · `Item/WorkshopUIController.mlua` 를 고친다 — #40 5884390429 2번 "B 가 넣는다 · A 가 리뷰로 승인 · 할인은 메소만".

| 항목 | 예전 | 지금 |
|---|---|---|
| 장비 강화 메소 비용(서버 차감) | `MesoCost × 부위 수` 그대로 | × `_JobPassiveLogic:GetJobCostMul(userId, "ENHANCE")` · 내림 · 원래 1 이상이면 최소 1 |
| 공방 창 강화 비용 표시(클라) | 할인 전 값 | 서버가 빼는 값과 같은 값 |
| 보석 개수 | 그대로 | 그대로(할인 없음) |

- **계산은 한 곳:** `EnhanceService.EnhanceMesoCost(userId, def, row)`(ExecSpace 없음 · 양쪽에서 부른다). 서버 `RequestEnhance` 와 클라 `WorkshopUIController.RefreshEnhance` 가 같이 부른다 → 표시와 차감이 어긋날 수 없다. 클라의 `GetJobCostMul` 은 로컬 유저 미러(`PlayerSkillState.LocalSkillLevel`)로 같은 값을 낸다.
- 배율 = 1 − 연성 효과 %/100. 연성 = CSV BaseEffect 30 + 5/lv → **Lv1 30% · Lv5 50% 할인**(×0.7 ~ ×0.5). 안 배웠으면 ×1 이라 예전과 같다(로그도 안 찍는다).
- 부동소수 오차로 70 이 69 로 내려가지 않게 내림 전에 1e-6 을 더한다.
- 로그 한 줄(할인이 걸릴 때만 · 서버): `[Item] enhance meso <원래> -> <할인> (연성 x<배율>) (<uid>)`. 성공 로그 `meso-<값>` 도 할인된 값.
- LSP `EnhanceService` · `WorkshopUIController` 깨끗 · `check-integrity` 통과.
- ⚠ **#131(A · `a/design-ui` Draft)과 겹친다:** #131 이 `WorkshopUIController.mlua` 를 크게 고쳤다(+699/−171). 강화 비용 줄은 #131 에서 `local mesoCost = row.mesoCost * _ItemCatalog:PieceCount(def)`(:944 · 메소 부족 표시 :955 도 이 값) — 뒤에 들어가는 쪽이 그 한 줄만 `EnhanceMesoCost` 호출로 바꾸면 된다(변수 이름 같음).

### Play 확인
1. 마법사 · 연성 0 레벨: 창 표시 = 예전 값 · 강화 → 그 값 그대로 빠진다 · `[Item] enhance meso` 줄 없음.
2. 연성 Lv1: 공방 창 비용 표시 = floor(N×0.7) · 강화 → `[Item] enhance meso N -> floor(N×0.7)` · 메소 카운터가 **창에 보인 값만큼** 준다 · 보석은 그대로 빠진다.
3. 연성 Lv5 → ×0.5 · 한벌옷(부위 2)도 두 배 값에서 할인.
4. 연성을 배운 뒤 창을 다시 열면 할인 값이 보인다.
5. 메소가 할인된 값 이상 · 원래 값 미만일 때 강화가 된다(거절 문구 숫자 = 할인된 값).
6. 빌드 경고 N → N.
