# a/m1-sync-prep (Draft PR #127 · base main 9d080d4 · WO-037)

M1 남은 일 중 A 몫 Sync 전 정리 + M1 남은 확인(개인 월드 Play). 사용자 지시 2026-10-01 "문서 표시 맞추자마자 M1 남은 거 진행".

## 바뀐 것

| 무엇 | 어떻게 | 파일 |
|---|---|---|
| 빌드 콘솔 에러 LEA-1102 | `string.lower((string.gsub(…)))` 괄호 자르기를 두 줄로(`local key, _n = string.gsub(…)`). #117(WO-033)부터 빌드 콘솔 Error 1 이었다 → 0 | `PortalNetwork.mlua` |
| 접속 외형 공유 메모리 한도(9/29 검증 후속 2) | 유저마다 `LOOK_<userId>` 메모리 → 메모리 `LOOK` 하나 + 변수 `u_<userId>` = `mode|jobLook|ret`. 공식 문서: RoomSharedMemory 월드당 최대 100개. 새 접속은 변수를 **지운 뒤** 선택창을 열고, 창을 연 뒤에만 선택을 받는다(지우기/쓰기 경쟁 제거) | `Item/AvatarLookService.mlua` · 계약서 A-2-27 등록서 5·6 · A-4 `AvatarLookRecord`(#40 comment 5906517704 공지 뒤) |
| 떠난 주인에게 Client RPC(9/29 후속 8) | 방어 뷰 `Push` · `Toast` 는 이 룸에 있는 유저에게만(`InRoom`) | `Lane/LaneStateService.mlua` |
| 파병 배지 Client RPC | `SendBadge` 한 곳 — 이 룸에 없는 유저(떠난 주인 · 부하 계측의 가짜 주인)에겐 안 보낸다 | `Dispatch/DispatchService.mlua` |

## 검증 (2026-10-01 · 개인 월드 `a-fix-facility-wave-portal` 에 이 폴더 · Maker Play)

- 빌드 콘솔: Error 1 → **0** · Warning 1(LWA-1111 `ParseStatCsv` 기존).

### 이 PR 의 수정

| 항목 | 결과(로그) |
|---|---|
| 외형 기록(새 저장) | 새 접속 `[Look] fresh login → select … cleared=NotFound`(지우기 끝난 뒤 창) → 선택 → 매치 룸 `[Look] room mode=EXPLORER_M` → 로비 복귀 `mark return` → `return mode=EXPLORER_M`(창 다시 안 뜸). `GetSharedMemory` 실패 0 |
| 떠난/없는 유저 RPC | 가짜 주인 4명 5레인 판에서 `LEA-3032` **0건**(1차 측정 265건 · 이번 Play 1판째는 배지에서 2건 → `SendBadge` 수정 뒤 0) |

### M1 남은 확인 (main 동작 · GDD §7 표시는 Draft #126)

| 항목 | 결과(로그) |
|---|---|
| 투사체 처치 귀속 + 동전(#123 + #125 합친 상태 첫 확인) | 에너지볼트 `SkillProj_…_SK_M11` 막타 → `[FarmReward] … lasthit=<나> top=<나> exp=8` → 동전 3개 포물선 `landed` → 0.3초 뒤 `picked` |
| 파병 동시 상한 | PHASE2 상한 3묶음: 3묶음 접수(D1~D3) 뒤 1묶음 더 → 대기열 그대로(D4 없음) |
| 파병 취소 | `dispatch-cancel order=D2 … back=5`(수비대로 복귀 · 최전방 재스폰) |
| 파병 진격 | 투입 10마리 x 12.1 → 6.4 → 4.8(억제기 x 4.0 앞)로 미니언과 같이 전진 → 억제기 파괴 폭발에 함께 정리 · 배지 `대 → off` |
| 파병 창 경로 | `CommonNpcUIController.Open("dispatch")` → `OnTarget` → `OnPrimary` → `submit order=D4`(확인 버튼 활성 = 묶음 1 이상). NPC 로 열기 · 실제 클릭은 안 봤다 |
| 순위 ④⑤ | ①②③ 같은 가짜 3행 주입: 처치 8 `ZZZ` 1위 · 처치 5 `AAA` 2위 · 나 3위 · `힣힣` 4위(`[Rank] … rank=1~4`) · 결과 화면 캡처. 4위 이름 칸(가짜 이름 `힣힣`)이 비어 보였다 — 원인은 안 봤다(실제 닉네임 `밍키타` 는 정상) |
| 기록 21판 | 20줄 기록에 21줄 추가 → 20줄 · 가장 오래된 줄(T1) 빠짐 · 확인 뒤 원래 기록으로 되돌림 |
| 발록 선취 뒤 보존 | `BalrogRoomService.DeclareWinner(방1)` → `[Match] WINNER` → 1위 심장 +2 · 계정 경험치 +60 · 도감 BOSS +15 · `ACH_RANK1` · `o=BALROG` → 로비 재로드 `lv=4 heart=8 boss=3 achDone=3`. 발록을 실제로 때리지는 않았다 |
| 5레인 부하(재측정) | 가짜 주인 4 · TEST · 수비대 없음 · 측정 스크립트 끔: 동시 32 이하 fps 24~31 · 80~96 fps 19~21 · 112~128 fps 15~17(최장 0.39초) |
| 레인 도착 시간 | 스폰 → 포탑 1.5 안: 엘리니아 0.8초 · 커닝 2.8 · 페리온 6.2 · 헤네시스 9.3 · 노틸러스 9.5. 포탑·억제기를 먼저 부순 판 스폰 → 넥서스 첫 피격: 27 · 30 · 40(노틸러스) · 49(헤네시스) · 52(페리온) |

- 이번 Play 의 런타임 Error = 테스트 스크립트 실수 1(`MoveToMapPosition` 에 Vector3) + 가짜 유저에게 가는 결과 화면 RPC 3(순위 테스트 · 의도) + 배지 2(수정 전). 게임 코드 오류 0.
- 캡처: 순위 ④⑤ 결과 화면 · 발록 선취 결과 화면(보고서 페이지).
