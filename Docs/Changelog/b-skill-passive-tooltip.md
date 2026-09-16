# b/skill-passive-tooltip

기준 브랜치: `b/skill-pirate-motion` (#58) — 스킬 창 UI 는 5직업 스킬·모션이 다 올라온 뒤라야 한 번에 확인된다.
`origin/main` 머지 포함 (A 의 발록 방 · 발록의 심장 경제 · 계획 문서 18커밋 — `Skill/` `Job/` 겹침 없음).

## 스킬 창 — 클릭 설명 칸 제거, 커서 툴팁으로 (사용자 요청 2026-09-14)

원작 메이플과 같은 방식으로 바꿨다. `.ui` 는 손대지 않고(협업-규칙 §10-3) 런타임 재배치만 한다.

- **`DescPanel` 을 `Window` 안에서 마지막 자식으로** (`SkillWindowLogic.SetupTooltip` → `MakeLastChild`).
  붙박이 "설명 칸" 이 사라지고, 같은 엔티티가 커서를 따라다니는 툴팁이 된다. 피벗 좌상단 ·
  커서 오른쪽 아래로 항상 같은 거리 · 화면을 실제로 벗어날 때만 안쪽으로 민다(`PlaceTooltip`).
- **행 hover → 툴팁** (`UITouchEnterEvent` / `UITouchExitEvent` · 복제 행에 `UITouchReceiveComponent` 를
  런타임에 붙인다). 행 클릭 → 설명 경로(`OnRowClicked`)는 삭제. 레벨 올리기는 그대로 "+" 버튼.
  목록 영역 자체의 Exit 를 안전망으로 둬서 행 Exit 가 빠져도 툴팁이 남지 않는다.
- **툴팁 내용**: 이름 → 액티브/패시브 · 단축키 · 해금 차수/레벨 → (못 배우는 이유) → Lv.n/max →
  설명 → 효과 수치 → MP·쿨타임·SP → 다음 레벨 미리보기. 수치는 전부
  `SkillDatabase.RatioAt/SecondaryAt/DurationAt/CooldownAt`(= `SkillInfo.csv` 한 곳)에서 읽는다.
- **효과 문구표**(`BuildEffectLabels`): `BuffTag` → "반사 데미지 = 최대 HP의 {v}%" 처럼 표의 "효과" 열이
  그대로 읽히는 한 줄. 표시 문구일 뿐 새 열·새 표가 아니다 — **스키마 계약 변경 없음**.
- 설명 칸이 비운 자리만큼 **창 높이를 802 로 줄였다**(목록은 480 그대로) → 목록 아래에 빈 회색 칸이 남지 않는다.
- 설명 칸이 하던 나머지 역할 이전: 배우기 실패 사유·DEV 안내는 마지막 커서 자리에 2.5초 뜨는
  알림(`ShowFloatingMessage`)으로, 초보자 빈 목록 안내는 목록 안 안내 행(`CreateNoticeRow`)으로.

## 패시브 5종 탭 표시

5직업 패시브(`SK_W12` 아이언 바디 · `SK_M12` 연성 · `SK_A12` 포커스 · `SK_T12` 픽파켓 ·
`SK_P12` 선원 관리)는 이미 `Tab=1 / ReqTier=1` 행으로 1차 탭에 나오고 있었다 — 빠진 직업은 없다.
액티브와 구분이 안 되던 것만 고쳤다.

- 목록 행 레벨 칸에 `패시브` 태그 (`RowLevelText`) — 단축키가 없는 이유가 바로 보인다.
- 툴팁 둘째 줄이 `패시브 · 항상 적용`. 액티브는 `액티브 · [Q]` 처럼 실제 배치 키를 보여 준다
  (`SkillHotbar.GetKeyNameForSkill` — 배치는 `slots` 한 곳에서만 읽는다).

## 표 수치 재확인 (25행 전부)

추가기획1 표의 Lv.1→5 값과 `SkillInfo.csv` 의 `BaseEffect + (lv-1) × EffectPerLevel` 이 전부 일치하는 것을
다시 확인했다. 바꾼 값 없음.

## 툴팁이 Footer(SKILL POINT) 밑에 깔리던 것 (사용자 재제보 2026-09-15)

앞선 커밋(382d4f5)이 "마지막 자식으로 보낸다" 며 넣은 `SetSiblingIndex(자식수 - 1)` 가 원인이었다.
0-based 를 가정한 계산인데 `_UILogic` 의 형제 인덱스는 **1-based** 다.

**MCP 실측(2026-09-15, Play 중 클라 스크립트 + 스크린샷):**

- `Window` 의 자식은 6개 — `TitleText BtnClose TabRow ListArea DescPanel Footer`.
- 그 상태에서 `GetSiblingIndex(DescPanel)` = **5** → 1-based 확정. 따라서 `자식수 - 1` = 5 는
  **끝에서 두 번째**, 정확히 `Footer`(SKILL POINT) 아래다 — 툴팁이 가려지던 그 자리.
- `SetSiblingIndex(9999)` → 6 으로 잘리고 순서가 `... Footer DescPanel` 로 바뀐다.
  같은 좌표에 띄운 전/후 스크린샷에서 툴팁 하단(`MP 5 · 쿨타임 2초 · SP 1`)이 푸터에 잘리던 것이
  푸터 위로 올라오는 것을 확인했다.
- `Detach()` + `AttachTo()` 는 **끝으로 보내지 않는다** — 순서가 그대로였다. 실제로 옮기는 것은
  `SetSiblingIndex` 뿐이다.

뒤따르던 검사도 `읽은 인덱스 < 자식수 - 1` 이라 방금 넣은 값과 같아 절대 참이 되지 않았고,
로그에는 `last=true` 로 찍혀 성공한 것처럼 보였다.

- **인덱스 규약을 아예 쓰지 않는다** (`MakeLastChild` · `IsLastChild`). "부모의 마지막 자식이 나인가" 를
  `parent.Children` 의 마지막 원소와 `Id` 로 직접 확인하고, 아니면 ① 큰 값(9999)으로 밀기
  (0/1-based 어느 쪽이든 끝으로 잘린다) ② 떼었다 다시 붙이기 순으로 고친다.
- `Window` 의 자식 순서를 이름으로 로그에 남긴다. 순서가 맞는데도 Footer 가 위라면 원인은 계층이 아니라
  `.ui` 에 저장된 `OverrideSorting` 이고, 그건 UIBuilder 로만 고칠 수 있다 — 로그 한 줄로 갈린다.

## 건드린 파일

- `RootDesk/MyDesk/Skill/SkillWindowLogic.mlua`
- `RootDesk/MyDesk/Skill/SkillHotbar.mlua` (`GetKeyNameForSkill` 추가)
- `Docs/Changelog/b-skill-passive-tooltip.md`

`.ui` · `.csv` · `.userdataset` · `.model` 변경 없음.
