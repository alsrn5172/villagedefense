# a/m1-1-dispatch (묶음 1 · 통합 브랜치 `a/m1-finish` · base `a/m1-0-contract` · PR #105)

파병 마무리 (WO-031 묶음 1 · GDD §7 Phase 3 · §4.3 정보 비대칭 · §4.13 레인 HUD).

## 바뀐 것

| 무엇 | 어떻게 | 파일 |
|---|---|---|
| 투입 알림 = 등급만 | `Release` 가 방어자에게 정확한 마릿수("이번 웨이브에 N마리")를 보내던 것을 **"파병이 웨이브에 섞였습니다 — 총량 소/중/대"** 로 | `Dispatch/DispatchService.mlua` |
| 등급 경계 | 소 1~4 · 중 5~9 · 대 10+ 마리(속성 `GradeSmallMax` 4 · `GradeMidMax` 9 · 1묶음 = 5마리라 1묶음 = 중 · 2묶음부터 대). 예전 8/24 는 묶음 8마리 시절 값 | 같은 파일 `GradeForUnits` |
| 접수 알림 문구 | 접수 순간엔 아직 안 섞였다 → "내 레인으로 파병이 옵니다 — 다음 투입 때 섞임 · 총량 X" | `Lane/LaneStateService.mlua` `RequestDispatch` |
| 레인 HUD 상시 배지 | 투입 뒤 그 마을 레인 3맵에 파병 개체(`Minion_<마을>_D*`)가 남아 있는 동안 주인 HUD 에 "파병 섞임 · 총량 X"(등급은 남은 개체 수로 갱신) · 0 이 되면 끄고 "레인의 파병 개체를 모두 막았습니다". 서버 `RefreshBadge` → 클라 `SetDispatchBadge(grade)`(주인만 · 등급 문자열만) · 스캔 타이머는 켜진 배지가 있을 때만 1초 · 매치 종료(`Expire`) 때 `ResetBadges` | `Dispatch/DispatchService.mlua` · `Match/MatchClockUIController.mlua` · `Match/MatchSessionLogic.mlua`(1줄) |
| 배지 노드 | `MatchClockGroup` 패널 아래 `Panel/DispatchBadge`(둥근사각 붉은 틴트 · Maple 18 · 기본 꺼짐) **추가만** · 기존 노드 좌표 그대로 · 가운데 앵커 ± 오프셋 | UI `MatchClockGroup` |
| 비노출 점검 | 방어자에게 가는 것 = 접수·투입 토스트(등급) · 배지(등급) · 방어 창 푸시(시설 상태만). 보낸 사람·몬스터 종류·정확한 수는 서버 로그와 보낸 사람 자신의 파병 창(`PendingOf`)에만 | — |
| 중복 파괴 테스트 | `LaneStateService.TestDestroyOnce(vid, withCore)`(Maker Play 전용): 실제 관문 `ApplyDamage` 로 포탑 치명타 2번 + 파괴 뒤 피해 → 재건 → 재파괴 → 억제기 2번(폭발) → (선택) 넥서스 2번(탈락). 반환값 + 집계로 PASS/FAIL · `[DestroyOnce]` 로그 | `Lane/LaneStateService.mlua` |
| 1회성 집계 | `tally["<마을>:<단계>:DESTROYED/ALERT"]` · `"<마을>:BOOM"` · `"<마을>:ELIM"`(관측용 · 판마다 초기화) — 묶음 7 부하 로그에도 쓴다 | 같은 파일 |

## 검증

- LSP 4파일 clean(`SetDispatchBadge` not-found info 1건 = 새 메서드의 교차 파일 인덱스 · Maker refresh 뒤 사라짐). `check-integrity` 통과.
- 🟡 **Maker 검증 대기** (WO-031 §8 — Maker 단계에서 묶어서): 개인 월드에 이 워크트리 → Reimport All → Play(TEST) →
  ① 두 마을 소유 + 파병 접수 → 투입 뒤 `[Dispatch] release` · `[DispatchBadge] <vid> - -> 중` · 클라 `[DispatchBadge] client 중` · 파병 개체 처치 뒤 `-> off`
  ② `_LaneStateService:TestDestroyOnce("<vid>", false)` → `[DestroyOnce] … PASS`(넥서스 포함은 마지막에 `true`)

## Codex 교차 리뷰 반영 (2026-09-26 · 묶음 1+2 · 2회 일치)

- 🔴 배지 원장이 등급만 들고 있어 주인이 탈락·바뀌면 옛 수신자 HUD 에 배지가 남고 새 주인은 같은 등급이면 못 받았다 → 원장 = `{ grade, owner }` · 수신자가 바뀌면 옛 사람에게 끄기 RPC 후 새 주인에게 처음부터 · `ResetBadges` 도 마지막 수신자 기준.
