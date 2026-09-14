# b/skill-passive-tooltip

기준 브랜치: `b/skill-pirate-motion` (#58) — 스킬 창 UI 는 5직업 스킬·모션이 다 올라온 뒤라야 한 번에 확인된다.
`origin/main` 머지 포함 (A 의 발록 방 · 발록의 심장 경제 · 계획 문서 18커밋 — `Skill/` `Job/` 겹침 없음).

## 스킬 창 — 클릭 설명 칸 제거, 커서 툴팁으로 (사용자 요청 2026-09-14)

원작 메이플과 같은 방식으로 바꿨다. `.ui` 는 손대지 않고(협업-규칙 §10-3) 런타임 재배치만 한다.

- **`DescPanel` 을 창에서 떼어 UIGroup 루트로** (`SkillWindowLogic.SetupTooltip`). 붙박이 "설명 칸" 이
  사라지고, 같은 엔티티가 커서를 따라다니는 툴팁이 된다. 피벗 좌상단 · 커서 오른쪽 아래로 펼침 ·
  화면 밖으로 나가면 반대쪽으로 접음(`ShowPanelWithText` · 인벤토리 툴팁과 같은 규칙).
- **행 hover → 툴팁** (`UITouchEnterEvent` / `UITouchExitEvent` · 복제 행에 `UITouchReceiveComponent` 를
  런타임에 붙인다). 행 클릭 → 설명 경로(`OnRowClicked`)는 삭제. 레벨 올리기는 그대로 "+" 버튼.
  목록 영역 자체의 Exit 를 안전망으로 둬서 행 Exit 가 빠져도 툴팁이 남지 않는다.
- **툴팁 내용**: 이름 → 액티브/패시브 · 단축키 · 해금 차수/레벨 → (못 배우는 이유) → Lv.n/max →
  설명 → 효과 수치 → MP·쿨타임·SP → 다음 레벨 미리보기. 수치는 전부
  `SkillDatabase.RatioAt/SecondaryAt/DurationAt/CooldownAt`(= `SkillInfo.csv` 한 곳)에서 읽는다.
- **효과 문구표**(`BuildEffectLabels`): `BuffTag` → "반사 데미지 = 최대 HP의 {v}%" 처럼 표의 "효과" 열이
  그대로 읽히는 한 줄. 표시 문구일 뿐 새 열·새 표가 아니다 — **스키마 계약 변경 없음**.
- 설명 칸이 비운 자리(140px)만큼 `ListArea` 를 480 → 630 으로 늘렸다.
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

## 건드린 파일

- `RootDesk/MyDesk/Skill/SkillWindowLogic.mlua`
- `RootDesk/MyDesk/Skill/SkillHotbar.mlua` (`GetKeyNameForSkill` 추가)
- `Docs/Changelog/b-skill-passive-tooltip.md`

`.ui` · `.csv` · `.userdataset` · `.model` 변경 없음.
