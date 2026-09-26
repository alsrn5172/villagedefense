# a/m1-3-stats (묶음 3 · 통합 브랜치 `a/m1-finish` · base `a/m1-2-counters` · PR #107)

생존자 공개 통계 (WO-031 묶음 3 · GDD §4.12 통계 분석관 · 계약 A-4 `PublicPlayerSummary`).

## 바뀐 것

| 무엇 | 어떻게 | 파일 |
|---|---|---|
| 생존자 목록 | 통계 뷰(`stats`)를 **매치 생존자 전원(참가자 − 탈락 − 중도 이탈 − 자신)** 으로 · 행 `P|userId|이름|레벨|칭호` · 없으면 `NONE`. 예전 뼈대는 같은 맵 사람만 + 내 메소까지 실었다 → 비공개 필드 제거 | `Lane/LaneStateService.mlua` `BuildView` · `Match/MatchTallyService.mlua` `SurvivorsFor` |
| 공개 요약 | `PublicSummary(uid)` = **허용 필드만 복사**: 이름 · 매치 레벨 · 성장도 · 보스 처치 · 몬스터 처치 · 전선 단계(1 포탑 · 2 억제기 · 3 넥서스 · 0 마을 없음) · 칭호 이름(묶음 5 가 채움 · 지금 "") · 장비(슬롯:ItemId:강화). 재화 · 창고 · 시설 레벨/HP · 수비대 · 파병 편성 · 발록 피해는 넣지 않는다. 이름은 뷰 구분자(`;` `|` `=`) 제거 | `Match/MatchTallyService.mlua` |
| 상세 요청 | 새 서버 RPC `LaneStateService.RequestStatDetail(whoId)` — 같은 매치 생존자일 때만 `SUM|…` 한 줄, 아니면 `GONE` → 뷰 종류 `statdetail`(라우터 한 줄 추가) | `Lane/LaneStateService.mlua` · `Npc/VillageNpcUIController.mlua` |
| 통계 창 | 목록 그리기 → 이전 선택(없으면 첫 사람) 자동 상세 요청 · 상세 6행(닉네임 "칭호 닉네임" · 레벨 · 마을 성장도 · 몬스터 처치 · 보스 처치 · 전선) · UI 아바타 = 그 사람 기본 외형(`DefaultEquipUserId`) + 장착 장비(캐릭터 창 프리뷰와 같은 Custom*Equip 규칙) · 장비 목록 글자 · `GONE` 이면 목록 다시 요청 · 늦게 온 옛 응답 무시 | `Npc/VillageRecordUIController.mlua` |
| UI | `VillageRecordGroup` 상세 패널: 아바타(`AvatarGUIRenderer` + `CostumeManager` · 기본 꺼짐) + 장비 글자 **추가** · 상세 6행을 높이 52→34 로 줄여 아래로(AI S1 뼈대 · 사용자 Maker 저장 이력 없음) · 생존자 목록 쪽은 그대로 | UI `VillageRecordGroup` |

## 검증

- LSP 4파일 clean · `check-integrity` 통과 · ui_lint 경고는 기존 것(버튼 88px 미만 등).
- 🟡 **Maker 검증 대기**: Play(TEST) → 통계 분석관 창 → 혼자면 "다른 생존자가 없습니다" · 2인(다인 세션 또는 가짜 참가자 주입)이면 목록 → 상세 로그. 비공개 필드 점검 = 서버가 보내는 `stats`/`statdetail` 문자열에 재화·시설·수비대 칸이 없음(코드상 확인 · 런타임은 로그로 한 번 더).
- 👁 눈 확인(사용자): 상세 패널 아바타·장비 글자 배치.

## Codex 교차 리뷰 반영 (2026-09-26 · 묶음 3+4 · 2회)

- 🔴 보는 사람 자격을 안 봐서 탈락·이탈·다른 매치 사람도 RPC 를 직접 불러 생존자 공개 요약을 받을 수 있었다 → `SurvivorsFor` 가 보는 사람이 지금 매치의 생존자(참가자 · 탈락 아님 · 이탈 아님)가 아니면 빈 목록(상세도 `GONE`).
- 늦게 온 `GONE` 이 대상 없이 와서 지금 선택한 사람의 상세를 지웠다 → `GONE|<userId>` 로 싣고 클라가 선택과 대조.
