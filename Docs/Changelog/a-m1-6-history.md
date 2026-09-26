# a/m1-6-history (묶음 6 · 통합 브랜치 `a/m1-finish` · base `a/m1-5-achievements` · PR #112)

플레이 기록(최근 20판) + 계정 창 기록 탭 (WO-031 묶음 6 · GDD §4.12 · §7 Phase 4 · 계약 A-4 `MatchHistory`).

## 바뀐 것

| 무엇 | 어떻게 | 파일 |
|---|---|---|
| 기록 원장 | 신규 `MatchHistoryService` — 저장 키 `MatchHistory`(AccountRecordData.hist · 묶음 4 가 이미 로드·저장) · 최신이 앞 · `MaxEntries` 20 넘으면 뒤부터 버림 · 줄 = `{t, d, rk, n, o, h, x, k, lv, ti}`(계약 A-4 그대로) · 로그 `[History] +1` | `Progression/MatchHistoryService.mlua`(신규) |
| 정산 줄 | `MatchSessionLogic.ShowResult` 순위 보상·업적 뒤 → 정산 받은 판(탈락자 포함 · 중도 이탈 제외)마다 1줄 · 결과 `o` = `BALROG`(선취) / `ALL_OUT`(전원 탈락) / `TIMEOUT`(시간 종료) · 순위 = 결과 화면 정렬 순 · 심장·계정 경험치 = `RankRewardService.Settle` 결과 | `Match/MatchSessionLogic.mlua` |
| 이탈 줄 | `MarkLeft`(포기 · 강퇴 · 접속 끊김) 중 **매치가 도는 동안**만 `o = LEFT` 1줄(끝난 뒤 로비로 가는 건 정산 줄이 이미 있다 · 접속이 이미 끊겼으면 원장이 없어 건너뜀) | 같은 파일 |
| 날짜 | `DateTime.UtcNow.Elapsed`(서기 1년 ms) → 유닉스 초로 저장 · 화면은 서버가 한국 시간 "MM/DD HH:MM" 으로(그레고리력 일수 변환 · 월드 재시작에 안 흔들림) | `Progression/MatchHistoryService.mlua` |
| 계정 창 | 기록 탭 = 한 판 두 줄(날짜 · ★ · 순위/인원 · 결과 / 심장 · 계정 경험치 · 처치 · Lv · 칭호) · 1위 판은 금색 · 없으면 안내 | UI `AccountRecordGroup` · `Progression/AccountRecordUIController.mlua` · `Progression/AccountRecordService.mlua` |
| 발록 선취 뒤 보존 | 경로 점검 = `BalrogRoomService.DeclareWinner` → `MatchSessionLogic.DeclareWinner` → `Expire` → `ShowResult`(순위 보상 · 업적 · 기록) → `PlayerDBManager.FlushAll` → 로비 이동 때 이탈 동기 저장. 코드상 빠진 곳 없음 — **런타임 확인은 Maker 에서**(GDD §7 Phase 4 🟡 항목) | — |

## 검증

- LSP clean · `check-integrity` 통과.
- 🟡 **Maker 검증 대기**: TEST 프로필 매치 1판 → 만료 → `[History] +1 <uid> o=TIMEOUT rk=1/1` · `[AcctRec] save MatchHistory bytes=` → 로비 계정 창 기록 탭 1줄 · 재접속 뒤 유지 · 21판째에 가장 오래된 줄이 빠짐(execute_script 로 Append 반복) · 발록 선취 판(`o=BALROG`) 뒤 심장·계정 경험치·도감·업적 값이 로비 재로드 후 그대로.
