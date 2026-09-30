# a/design-ui-hud (디자이너 시안 UI · 상시 HUD · 통합 a/design-ui 의 조각)

디자이너 시안 `04-hud`(상태창 · 퀵슬롯 · 스킬 칸 · 매치 시계 · 파병 배지 · 오른쪽 위 바로가기 · 레벨업 알림 · 8상태)를 `StatusHUD` · `QuickSlotGroup` · `SkillHudGroup` · `MatchClockGroup` 에 입힌다. 1단계 = 겉모습. 서버 파일 · CSV · `스키마-계약.md` 는 건드리지 않았다. 고친 스크립트는 클라 컨트롤러 4개: `Summon/StatusHUDController.mlua` · `Item/QuickSlotController.mlua` · `Stat/SkillHudController.mlua` · `Match/MatchClockUIController.mlua`.
🔴 **Play 로 본 것은 없다**(Maker 미사용) — 위치 · 그리기 순서 · 글자 폭은 통합 담당이 눈으로 확인해야 한다. 적용 스크립트 4개는 두 번(세 번) 돌려도 파일이 바이트 동일(md5 확인)이고 `ui_lint` 에러 0 · 스크립트 LSP 이슈 0 · `check-integrity` 통과.

## 2026-10-01

| 항목 | 내용 | 파일 |
|---|---|---|
| 상태창 | 판 `panel_tooltip`(380×186 · 화면 가운데보다 30px 오른쪽 = 시안 실측) · 레벨(풋볼 굵게 24 금색) · 이름판 `plate_dark` · 직업 아이콘 + 이름 · AP/SP 칩(남으면 금 칩 + 어두운 글자 + 빨강 알림 · 없으면 회색 칩 + 흰 글자) · HP/MP/EXP 게이지 3줄(트랙 `gauge_track` · 채움 `gauge_fill_*` 262×12 · 글자 풋볼 굵게 14 흰색 + 어두운 외곽 · 라벨 HP/MP/EXP) · 판 전체 클릭(캐릭터 창 열기)은 맨 앞으로 | `ui/StatusHUD` · `Docs/tools/design-ui/apply-hud-status.cjs` · `Summon/StatusHUDController.mlua` |
| 바로가기 | 오른쪽 위 캐릭터(C) · 스킬(K) 두 칸: 칸 틀(올림/누름 = `slot_frame_hover`) + 아이콘 + 금 키 칩 + 이름 + 빨강 알림(AP · SP 가 남을 때). 클릭은 C · K 키와 같은 토글(`_StatUIController:Toggle()` · `_SkillWindowLogic:Toggle()` — 호출만 · B 코드 수정 없음) | 같음 |
| 레벨업 알림 | 화면 위쪽 가운데 문장 + 꽃 바("LEVEL UP!" 배찌체) + 줄 "Lv 12 → Lv 13 · AP +5 · SP +3" + 반짝임 2개. 2초 뒤 꺼짐. 기존 `PlayLevelUp`(소리 · 캐릭터 이펙트) 흐름은 그대로 두고 알림만 더했다. 바뀐 수치는 서버가 주는 `PushStats` 의 이전 값과 비교해 계산(`PlayLevelUp` · `PushStats` 도착 순서가 바뀌어도 줄을 다시 그린다) | 같음 |
| 스크립트(상태창) | EXP 글자 "62.4% (390/625)"(소수 한 자리 · 내림) · AP/SP 글자 "AP 5 · SP 0" · HP 30% 미만이면 "HP" 라벨 붉게 · 직업 칸은 B 미러 `_PlayerSkillState:LocalJobId()` → 한글(`JobInfo.csv` 이름과 같은 표 · 글자 수가 많으면 16 → 14 → 12) · 새 property 는 `apply-hud-status` 가 UUID 주입(기존 UUID 그대로) | `Summon/StatusHUDController.mlua` |
| 퀵슬롯 | 판 `panel_inner` 200×116 · 칸 78×78(빈 칸 = 점선 칸 `slot_item_drag` + 흐린 "+" · 등록 = 파랑 칸 `slot_frame`은 스크립트가 교체) · 키 번호 금 칩 · 수량 풋볼 굵게 16(0개 = 붉은 숫자 + 아이콘 회색 어둡게) · 재사용 덮개 66×66 `#060A14` 66%(채움 방향 그대로) · 남은 초 풋볼 굵게 24 금색. 빈 칸을 누르면 위쪽 가운데에 안내 판 "인벤토리에서 물약을 끌어다 놓으세요" 2초 | `ui/QuickSlotGroup` · `apply-hud-quickslot.cjs` · `Item/QuickSlotController.mlua` |
| 스킬 칸 | 판 `panel_inner` 452×100(Shift 칸이 없는 직업은 스크립트가 368 로 줄이고 Q~R 을 가운데로 모은다) · 칸 72×72 틀 3상태(빈 칸 `slot_frame_empty` ↔ 배운 스킬 `slot_frame`은 스크립트가 교체) · 키 글자 금 칩(Shift 는 가로 40.5) · 덮개 56×56 `#060A14` 70% · 남은 초 풋볼 굵게 24 금색(10초 미만은 소수 한 자리 "1.2"). 모바일 5칸은 위치 · 크기 그대로 그림 · 덮개 · 글자만 | `ui/SkillHudGroup` · `apply-hud-skill.cjs` · `Stat/SkillHudController.mlua` |
| 매치 시계 | 판 `panel_title_bar` 560×64 · 페이즈 칩(개척 초록 · 전직/성장 파랑 · 견제 금 + 어두운 글자 · 결전 빨강 · 그 밖(매치 종료)은 칩 없이 회색 글자) · 시간 풋볼 굵게 30 금색(결전은 붉게) · 다음 투입 "다음 투입 18초"(끝물 "최종 페이즈" · "시간 종료"는 붉게) | `ui/MatchClockGroup` · `apply-hud-clock.cjs` · `Match/MatchClockUIController.mlua` |
| 파병 배지 | 시계 판 아래 6px 280×40 · 등급별 그림(소 = 어두운 금 `chip_gold_dark_lg` · 중/대 = 빨강 `chip_red`) · 경고 깃발 · 오른쪽 눈금 3칸(소 1 · 중 2 · 대 3칸 켬) | 같음 |

기존 엔티티는 지우지 않았고 이름도 안 바꿨다. 안 쓰게 된 것은 없다(`StatusHUD/UIMyInfo/info_top` · `info_bottom` · `info_bottom/Hp|Mp|Exp` 는 자리만 옮겨 계속 쓴다). `BattleHUD`(LeftHUD 통째로 꺼진 채) · `DefaultGroup` 모바일 버튼 · 조이스틱은 시안에 없어 그대로 뒀다.

## 안 한 것 (2단계 · 기능이 없거나 서버가 새 값을 줘야 하거나 에셋이 없음)

- **바로가기 친구(F) · 메뉴** — 게임에 기능이 없어 **만들지 않았고 자리도 두지 않았다**. 캐릭터 · 스킬 두 칸만 오른쪽 끝에 붙인다(시안은 4칸 292 폭 · 지금 140 폭).
- **월드맵 버튼**(시안 #21 · 금 버튼 + 지도 아이콘 + M 키 칩) — `WorldMapGroup` · `WorldMapController` 는 월드맵 조각 몫이라 건드리지 않았다. 다음 조각에서 한다.
- **채팅**(시안 #1 · 72 버튼 + 420×40 마지막 줄) — `DefaultGroup/UIChat` 은 MSW 기본 `ChatComponent` 한 덩이(창)라 시안 모양과 형태가 다르고 그림 · 색을 어디까지 바꿀 수 있는지 확인하지 못해 손대지 않았다.
- **레벨업 때 상태창 금빛 테두리**(시안 #7 · #22) — 대응 에셋이 없다(판 위에 금색 틴트는 어두운 판과 곱해져 효과가 약함) → 생략.
- **파병 배지 나타남/사라짐 연출**(위에서 12px 내려오며 0.2초 페이드 · 0.3초 페이드아웃) · **대 등급 붉은 번짐**(흐림) · **쿨 끝났을 때 금테 0.2초 반짝**(시안 #28) — 연출 코드를 넣지 않았다(배지는 켜고 끄기만).
- **칸 "누름" 금테(`slot_frame_hover`)를 칸에 쓰는 것**(퀵슬롯 · 스킬 칸) — 누르는 순간을 잡는 기준이 시안에 없어 칸 틀은 2상태(빈 칸 ↔ 등록/배움)만. 바로가기 두 칸은 버튼 올림/누름 전환으로 `slot_frame_hover` 를 쓴다.
- **그림자**(drop-shadow · 상태창 · 파병 배지) · **둥근 모서리**(덮개 · 눈금 · M 칩) — 생략하거나 네모로.
- **2차 직업 이름**(시안 "불독") — 직업 칸은 B 미러 `LocalJobId()`(1차 직업 id)만 읽어서 "마법사"가 나온다. 2차 이름 표가 클라에 없다.
- B 코드(`Skill/**` · `Job/**` · `PlayerAttack.mlua`) · `Stat/StatUIController.mlua`(캐릭터 창 조각 몫) — 건드리지 않았다(읽기 호출만).

## 단순화한 것 (시안과 다른 곳)

- **상태창 이름판 폭**: 시안은 닉네임 · 직업 글자에 따라 폭이 변한다 → 이름판 176 고정 + 직업 칸 60 고정(글자 수에 따라 16/14/12 로 줄임). 닉네임이 길면 이름판 밖으로 넘친다(옛 `TextComponent` 라 말줄임을 못 걸었다).
- **페이즈 칩 폭**: 글자 폭에 맞춰 늘어나는 칩 → 가장 긴 "0.5페이즈 전직"에 맞춘 고정 폭 136(짧은 문구는 칩 안에서 가운데 정렬). `(TEST)` 꼬리표가 붙으면 칩 밖으로 넘친다.
- **AP/SP 칩 폭**: 시안은 95/98 → 98 로 통일.
- **퀵슬롯 덮개 채움 방향**: 지금 스크립트 동작(사용 직후 아래→위로 차오르고 그 뒤 줄어듦) 유지.
- **눈금 · 키 칩(M 칩)**: 단색 판 + 네모(모서리 반경 생략).
- **아이콘 흑백**(수량 0): 회색 곱 `(0.55, 0.55, 0.55)` 로 대체.
- **한 에셋의 테두리 두께는 한 값이라**: 키 칩은 `chip_gold_sm`(7) · 페이즈 금 칩 · AP 칩은 `chip_gold`(10 ≈ 시안 11) · 파병 배지 중/대는 `chip_red`(11 · 시안 14) · `slot_item_drag`(15 · 시안 14).
- **시계 문구**: 시안에 없는 "종료까지 mm:ss" · "다음 페이즈 N초" · "(TEST)" · "매치 종료" 는 지금 문구 유지(색은 평소).
- **바로가기 알림 기준**: 캐릭터 = 남은 AP > 0 · 스킬 = 남은 SP > 0(`StatusHUDController` 가 들고 있는 `curAp` · `curSp` — 서버 `PushStats` 값). 스킬 창 안 SP 와 같은 값인지는 확인하지 않았다.

## 확인 전

- Play / Maker 로 본 것은 **없다.** `ui_lint` 에러 0(경고 = 작은 버튼 터치 크기 · 오른쪽 위 예약 영역 · 겹쳐 놓은 글자 상자 — 모두 시안 치수 그대로라 남겼다).
- **눈으로 봐야 할 것**: ① 상태창 위치(화면 가운데보다 30px 오른쪽 · 시안 실측 그대로)와 판 전체 클릭(캐릭터 창 열기)이 이름판 · 직업 · 게이지 글자에 막히지 않는지 — 맨 앞에 둔 투명 버튼이 받아야 한다 ② 옛 `TextComponent` 글자(레벨 · 이름 · 직업 · HP/MP/EXP 숫자)의 글꼴 · 정렬 · 외곽이 시안처럼 나오는지 ③ 게이지 채움(262×12)이 트랙(294×26) 안쪽 16px 에 들어가는지 · 줄어들 때 오른쪽부터 줄어드는지 ④ 바로가기 칸이 오른쪽 위 다른 UI 와 겹치지 않는지 · 이름(칸 아래)이 칸 밖으로 나온 자리 ⑤ 레벨업 알림 가운데 위치(화면 위에서 330) · 기존 이펙트와 겹침 ⑥ 스킬 칸 4칸 ↔ 5칸 전환(Shift 없는 직업) 때 판 폭 · 칸 위치 — 칸 위치를 런타임에 대입하면 크기가 옛 값으로 되돌아가는 일이 있어(`UIToast` 참고) 크기를 다시 대입했다 ⑦ 칸 틀 교체(`ImageRUID`)가 잘 그려지는지(Sliced 유지) ⑧ 시계 페이즈 칩 그림 교체 · 칩 없는 "매치 종료" 글자 ⑨ 파병 배지 그림 · 눈금 색.
- 요청 사진 레시피(`디자인인계/2026-09-23/_work/recipes/hud.json` B01~B11)의 Lua 는 **고친 뒤에도 그대로 돈다**: 쓰는 것은 `_StatusHUDController` 의 `curLevel` · `curWithin` · `curNeed` · `curMp` · `curMaxMp` · `curAp` · `curSp` · `apSpText` · `PlayLevelUp(level, effectRuid, soundRuid)`, `_MatchClockUIController` 의 `Apply(...)` · `phaseText` · `timeText` · `nextText`, `_QuickSlotController` 의 `slots` · `icon1` · `SetQuickSlots(csv)` — 전부 이름 · 인자가 그대로다. 달라진 것: B07 의 `PlayLevelUp` 재생은 이제 레벨업 알림도 2초 띄운다(바뀐 수치 줄은 마지막 `PushStats` 의 이전 값 기준) · B09/B10 시계 글자는 "다음 투입 N초"(s → 초).
