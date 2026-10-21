# a/ui-click-stats-embed — UI 클릭 통계 디스코드 임베드 · 안 눌린 버튼 (Draft PR #228 · 1.1.2)

## 2026-10-21

사용자 지시: "클릭 안 된 UI 도 나와야 하지 않나 · txt 파일로 디코에 · (txt 안 되면) 임베드로 묶어 하루 2~3개 메시지로 — 요약 + 그룹별 눌린/전체 + 안 눌린 버튼 이름까지."

- **txt 첨부는 안 된다**(Maker 실측): MSW `HttpService.RequestAndWait` 에 `multipart/form-data` 를 지정하면 예외 없이 빈 응답 · 요청이 시험 서버(httpbin)에도 닿지 않는다. 같은 함수로 JSON · 텍스트는 정상. → 임베드로 대신.
- **디스코드 보고 = 임베드 메시지 2~3개** `Analytics/UiClickStats.BuildReport` → `PackMessages`(임베드 설명 3800자 · 메시지당 임베드 10개 · 5600자 이하):
  ① 요약(전체 클릭 · 플레이한 사람 · 눌린 버튼 / 전체 버튼 · 많이 눌린 버튼 상위 15)
  ② 그룹별 클릭 · 눌린 버튼 / 전체 버튼(클릭 많은 순)
  ③ 안 눌린 버튼 이름(그룹별 · 경로 끝 두 칸 · 끝 두 칸이 겹치면 그룹 뒤 경로 전체).
- **버튼 전체 목록** = 로비 계정 로드 10초 뒤 그 클라에게 한 번 `AskCatalog` → `Match/UiClickSound.CatalogPacked`(훅 건 버튼 경로 · 같은 경로 한 번) → `ReportCatalog` 로 로비 메모리에만(저장 비용 없음 · 30분에 한 번 · 한 명씩). Maker 실측 409개.
- 하루 1번 전송 순서: 웹후크가 없으면 그날 몫을 잡지 않는다(등록한 날부터 보냄) · 버튼 목록이 아직 없으면 9시부터 3시간까지 기다린다.
- 개발용 리모컨 `LaneTestRemoteGroup` 도 통계에서 뺀다(`StatExcludeGroups`).
- 🔴 반복문 안에서 `self:` 메서드 · 속성을 부르지 않게 바꿨다(`Report` · `Decode` · `Merge` · `BuildReport` · `PackMessages` 지역 함수). 처음엔 Maker `execute_script` 로 재서 8.9초가 나왔는데,
  실제 서버 경로(채팅 `!클릭보내기`)로 재니 **0.02초**였다 — `execute_script` 로 넣은 코드는 400번 반복에 0.41초가 걸릴 만큼 느리다(측정 도구 쪽 문제). 지역 함수로 바꾼 건 그대로 둔다.

## 확인 (Maker · 그룹 mIYbC · 정적 맵에서 시작 = 로비 `__main__`)

- LSP 진단 0 · refresh · build 오류 0.
- 로비 입장 → `catalog keys=409` → 클릭 넘기기 → 저장 → 채팅 `!클릭보내기` → `report built in 0.02s (messages 2)` → 디스코드 🤖｜봇-로그에 메시지 2개(임베드 3 + 2) 도착.
  웹후크 토큰으로 메시지를 다시 읽어 ①②③ 내용 · 글자 수(479 · 939 · 3766 / 3428 · 1470) · 겹치는 이름 구분 확인 ✅ (Maker 시험 데이터 `VRF/…` 포함 시험 메시지).
- ❌ 라이브 배포 뒤 첫 9시 보고는 아직.
