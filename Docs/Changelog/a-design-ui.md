# a/design-ui (디자이너 시안 UI 전체 적용 · 통합 · Draft PR #131)

디자이너 시안(21창 · 2026-10-01 반영본)을 게임 UI 에 입힌다. 1단계 = 겉모습(판 · 버튼 · 칩 · 글꼴 · 색 · 배치 · 상태 그림). 서버 뷰 형식 · CSV 헤더는 건드리지 않는다.
그림은 그룹 리소스(`mIYbC` · 이름 `dui_*`)에 올리고 저장소에는 이름 → RUID 표만 둔다.

## 2026-10-01 — 기반 + 시범 창(부활 팝업)

| 항목 | 내용 | 파일 |
|---|---|---|
| 적용 도구 | 공용 헬퍼(그림 이름 → RUID · 16색 · 글꼴 대응 · 버튼 상태 그림 · 시안 좌표 → 부모 기준 좌표) · 그림 표(시범 16장) · 읽기용 probe | `Docs/tools/design-ui/skin.cjs` · `ruid-map.json` · `probe.cjs` |
| 부활 팝업 | 창 판(680×370 · 금테 창) · 제목 띠 + 경고 아이콘 · 창 위 문장 · 안내 문구("내 마을"만 금색) · **남은 시간 게이지 + 초** · 버튼 두 줄(아이콘 + 제목 / 금액 · 설명) · "N초 뒤 자동" 칩 · 버튼 올림 · 누름 · 비활성 그림(ButtonComponent 전환). 기존 엔티티 6개는 그대로 두고 값만 바꿈 · 새 엔티티 15개 | `ui/RevivePopupGroup` · `Docs/tools/design-ui/apply-revive.cjs` |
| 부활 팝업 스크립트 | 버튼 글자를 새 제목 · 금액 칸으로 · 메소 천 단위 쉼표 · 부족하면 금액 줄 빨강 + 아이콘 회색 · 남은 시간은 `PlayerRespawnService.ChoiceSeconds` 를 클라가 세는 표시용(판정은 서버 그대로) | `Match/PlayerRespawnUIController.mlua` |

### 검증

- `ui_lint` clean · 바인딩 7개 주입.
- **Maker 확인 전** — 9-slice 테두리 두께 · 글꼴 굵기 · 그리기 순서는 개인 월드에서 눈으로 확인해야 한다.
