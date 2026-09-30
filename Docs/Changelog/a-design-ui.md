# a/design-ui (디자이너 시안 UI 전체 적용 · 통합 · Draft PR #131)

디자이너 시안(21창 · 2026-10-01 반영본)을 게임 UI 에 입힌다. 1단계 = 겉모습(판 · 버튼 · 칩 · 글꼴 · 색 · 배치 · 상태 그림). 서버 뷰 형식 · CSV 헤더는 건드리지 않는다.
그림은 그룹 리소스(`mIYbC` · 이름 `dui_*`)에 올리고 저장소에는 이름 → RUID 표만 둔다.

## 2026-10-01 — 기반 + 시범 창(부활 팝업)

| 항목 | 내용 | 파일 |
|---|---|---|
| 적용 도구 | 공용 헬퍼(그림 이름 → RUID · 16색 · 글꼴 대응 · 버튼 상태 그림 · 시안 좌표 → 부모 기준 좌표) · 그림 표(시범 16장) · 읽기용 probe | `Docs/tools/design-ui/skin.cjs` · `ruid-map.json` · `probe.cjs` |
| 부활 팝업 | 창 판(680×370 · 금테 창) · 제목 띠 + 경고 아이콘 · 창 위 문장 · 안내 문구("내 마을"만 금색) · **남은 시간 게이지 + 초** · 버튼 두 줄(아이콘 + 제목 / 금액 · 설명) · "N초 뒤 자동" 칩 · 버튼 올림 · 누름 · 비활성 그림(ButtonComponent 전환). 기존 엔티티 6개는 그대로 두고 값만 바꿈 · 새 엔티티 15개 | `ui/RevivePopupGroup` · `Docs/tools/design-ui/apply-revive.cjs` |
| 부활 팝업 스크립트 | 버튼 글자를 새 제목 · 금액 칸으로 · 메소 천 단위 쉼표 · 부족하면 금액 줄 빨강 + 아이콘 회색 · 남은 시간은 `PlayerRespawnService.ChoiceSeconds` 를 클라가 세는 표시용(판정은 서버 그대로) | `Match/PlayerRespawnUIController.mlua` |

### 검증 (개인 월드 · 2026-10-01)

- `ui_lint` clean · 바인딩 7개 주입 · 빌드 로그 Error 0.
- Play 화면 확인(AI 캡처 2장 · 메소 가능 / 메소 부족): 9-slice 테두리 두께가 시안과 같게 나옴 · 제목 띠 뒤 · 문장 앞 · 남은 시간 게이지 · 비활성 버튼 그림 · 부족 문구 빨강. 로그 `[ReviveUI] show meso=5000 canMeso=true expCut=375 sec=15.0`.
- 알아낸 것: **형제 그리기 순서 = 파일 안 배열 순서**(displayOrder 만 바꿔서는 안 움직임 → `skin.before/back/front`) · `Maple` 은 굵게(FontStyle 1)여야 시안과 같은 굵기 · 화면 막은 기본 그림을 Sliced 로 둬야 그려짐.
- 못 본 것: 실제 사망으로 띄운 경우(서버 Show 경로 · 버튼 클릭 → Choose)는 이번엔 안 태움 — 클라 주입으로만 확인.
