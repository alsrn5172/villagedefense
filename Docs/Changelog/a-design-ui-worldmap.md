# a/design-ui-worldmap (디자이너 시안 UI · 월드맵 · 통합 a/design-ui 의 조각)

디자이너 시안 `15-worldmap`(기본 · 사냥터 안내창 1줄/2줄 · 보스 안내창 · 목표 깃발 여러 곳 · 지도 밖 · 6상태)을 `WorldMapGroup` 에 입힌다. 1단계 = 겉모습. 서버 파일 · CSV(`WorldMapNodes.csv` X,Y 포함) · `Catalog/MonsterCatalog.mlua` · 파병 패널(`DispatchPanel`)은 건드리지 않았다. 고친 스크립트는 `WorldMap/WorldMapController.mlua` 하나.
🔴 **Play 로 본 것은 없다**(Maker 미사용) — 창 테두리 고리 · 점 · 핀 · 안내창의 위치와 그리기 순서는 통합 담당이 눈으로 확인해야 한다.

## 2026-10-01

| 항목 | 내용 | 파일 |
|---|---|---|
| 창 테두리 | 지도 그림은 시안에서도 임시 그림이라 **지금 그림 · 크기 · 위치를 그대로** 두었다(Board 가 들고 있는 1294×950 · 노드 좌표 변경 없음). 창 판 `panel_window` 는 **가운데를 비운 테두리 고리**(`FillCenter=false` · 위 100 / 좌우·아래 44)로 지도 그림 위에 얹었다(`Board/Frame`) | `ui/WorldMapGroup` · `Docs/tools/design-ui/apply-worldmap.cjs` |
| 제목 | 문장 `Crest` · 제목 띠 `TitleBand` · 지도 아이콘 `TitleIcon` · "월드맵" Maple 30(외곽선 끔 · 그림자) · 닫기 52×52 그림 버튼(올림 그림 `btn_close_hover`) · 화면 막 알파 0(클릭 막이는 그대로) | 같음 |
| 점 33개 | 노드(크기 · 터치)는 그대로 두고 자식 `Dot`(평소) · `DotHover`(올림 · 꺼 둠)를 얹었다(허브 42→54 · 마을 38→50 · 사냥터 26→38 · 보스 38→50). 종류는 `WorldMapNodes.csv` 의 Type 열 기준. 점은 터치를 안 받는다 | 같음 |
| 내 위치 · 목표 핀 | 핀 36×48 그림 `map_pin_me` / `map_pin_goal` · 꼬리표(짙은 하늘 / 갈색 둥근 판 + Maple 13 흰색) · 옛 검은 외곽선 복제본 4장씩 끔 · 둥둥 4px / 1.6초 | 같음 · `WorldMapController.mlua` |
| 지점 안내창 | 판 `panel_tooltip` · 머리줄(종류 색 점 · 이름 Maple 24 · 지역·종류 Noto 14 · 보스면 분홍 띠 + "보스" 칩) · 구분선 `deco_divider` · 몬스터 줄(칸 틀 `slot_frame_sm` · 얼굴 `MonsterCatalog` 아이콘 · 이름 · 레벨 칩 "Lv N" · 짝수 줄 줄무늬) · 높이 81.5 + 44/줄(보스 +4) · 노드 오른쪽 아래 22px · 지도 칸을 넘으면 왼쪽 / 위로 뒤집기 | 같음 |
| 지도 밖 | 핀 대신 제목 줄 가운데 맞춤 + 파랑 칩 "지금 위치: 로비"(로비 맵이 아닌 곳은 "지도 밖") | 같음 |
| 목표 = 내 위치 | 핀 둘이 좌우로 비켜 서고 꼬리표는 바깥쪽(내 위치 왼쪽 · 목표 오른쪽). 다른 점이면 점 중앙(예전 +26 오프셋 없앰) | `WorldMapController.mlua` |
| 범례 | 지도 왼쪽 아래 457×34 둥근 판 + 아이콘 · 글자 6쌍(번호 없는 요소) | `ui/WorldMapGroup` |
| 열기 버튼 | 230×72 금 버튼(`btn_gold_default` · 눌림 `btn_gold_pressed`) + 지도 아이콘 + 글자 "월드맵"(자식 `OpenLabel` · Maple 24 진한 글자) | 같음 |
| 스크립트 | 새 칸을 전부 **이름 경로**로 찾는다(새 property 없음 · 기존 UUID 그대로) · 기존 public 메서드 이름 · 인자 그대로(`OpenMap` `CloseMap` `Toggle` `ShowTooltipAt` `HideTooltip` `ShowGoalMarkers` `ClearGoalMarkers` `ApplyGoalMarkers` `RowSlots` `FillTooltipRows` …) · 새 메서드: `OnRegionExit` `SetDotHover` `SetAnchored` `FillTooltipHead` `FillRowMonster` `FillRowNote` `PlaceMarkerPin` `ShowOutsideChip` `HideOutsideChip` | `WorldMapController.mlua` |

기존 엔티티는 지우지 않았고 이름도 안 바꿨다. 안 쓰게 된 것은 끄기만 했다: `HereMarker` · `GoalMarker_0~5` 의 `OutlineDown|Left|Right|Up`(24+4개 · 새 핀 그림에 테가 있다) · `Tooltip/Row*/Badge` 의 글자 "M"(비움 · 칸 틀로 재사용).

## 안 한 것 (2단계 · 새 기능이거나 서버가 새 값을 줘야 하거나 에셋이 없음)

- **새 지도 그림**(시안 #3 · #5) — 시안도 임시 그림. 새 그림을 받으면 그때 `Board` 그림을 판으로 바꾸고 `MapArt`(1098×806 · 0,−28)를 놓고 노드 좌표를 ×0.8485 · y−28 로 옮긴다(CSV X,Y 도 같이). 마을 이름 팻말 · 섬 이름 두루마리는 그림 안 일러스트.
- **제목 띠 양쪽 가는 금선**(그라데이션) · **그림자**(창 · 문장 · 안내창) · **보스 띠 그라데이션** — 생략하거나 단색(분홍 `#FF46AA` 알파 0.22)으로.
- **영문 이름**(몬스터 줄) — `MonsterInfo.Name` 이 "이름 (English)" 한 문자열이라 안 나눴다(이름 칸에 통째로).
- **지역 · 종류**를 이름 글자 폭 바로 뒤에 붙이는 것 — 글자 폭을 재지 않는 원칙이라 안내창 오른쪽 끝에 오른쪽 정렬(보스면 칩 앞).
- 지역 정보 박스(`InfoPanel`) · 파병 패널(`DispatchPanel`) — 죽은 property / 다른 묶음 소관.
- B 코드(`Skill/**` · `Job/**` · `PlayerAttack.mlua`) — 건드릴 것 없음.

## 단순화한 것 (시안과 다른 곳)

- 안내창 머리줄 **종류 색 점**은 원형 금지 규칙이라 `map_dot_*` 그림을 16×16 으로 줄여 썼다(시안 14px 원).
- 칸 틀은 `slot_frame_sm`(테두리 10)로 — 시안은 화면 8px. 레벨 칩은 `chip_blue_dark_sm`(8) · 보스 칩 `chip_red`(테두리 11이라 높이 22 — 시안 19.5).
- 몬스터가 없는 곳 한 줄은 "등장 몬스터 정보 없음" `sub` 색(시안 캡처 없음). 지역 · 종류는 이제 머리줄에 있다.
- 짝수 줄(2 · 4번째) 줄무늬 — 시안은 2번째 줄만 있어 4번째는 같게 추측.
- 안내창 뒤집기 한계선은 지도 칸(1206×806) 기준 오른쪽 603 · 아래 −431, 위로 뒤집을 때 아랫변이 점 가운데보다 28.5 위(시안 s3 실측).
- 지도 밖 칩 너비 113.5(로비) / 141.5(지도 밖) — 제목 줄을 가운데로 민다.
- 열기 버튼 위치는 그대로(`Toolbar` 안 · 크기만 230×72).

## 확인 전

- Play / Maker 로 본 것은 **없다.** `ui_lint` 에러 0(경고 30 = 터치 크기 · 켜고 끄는 겹침 · 기존 것), 스크립트 LSP 이슈 0, `check-integrity` 통과. 적용 스크립트는 두 번 돌려도 같은 파일(바이트 동일).
- 🔴 **가장 먼저 볼 것**: 테두리 고리(`Board/Frame`)가 가운데가 비어 지도 그림이 보이는지(`FillCenter=false` 를 Maker 가 지키는지 확인 못 했다 · 안 지키면 판이 지도를 덮는다).
