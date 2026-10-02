# a/design-ui-world-art (디자이너 시안 · 월드에 그려지는 것 · 통합 a/design-ui 의 조각)

디자이너 시안 `19-facility`(방어 시설) · `20-damage`(데미지 숫자 · 이름표)를 월드 쪽에 입힌다. UI 파일이 아니라 모델 · 스크립트다. 1단계 = 겉모습.
🔴 **Play 로 본 것은 없다**(Maker 미사용). 크기 · 위치 · 그리기 순서는 통합 담당이 눈으로 확인해야 한다. 서버 파일(`LaneFacilityService` · `LaneStateService`) · CSV · `.map` 은 건드리지 않았다.

## 2026-10-01

| 항목 | 내용 | 파일 |
|---|---|---|
| 시설 HP 바(#16) | `lanehpbar` 모델에 자식 2개(틀 `Track` = `gauge_track` · 채움 `Fill` = `hpbar_fill`) 추가 · 옛 픽셀 16×3 렌더러는 끔(컴포넌트는 그대로). 스크립트는 자식 이름으로 찾아 크기·위치를 잡고, 채움은 왼쪽 끝 고정 + 가로로 **부드럽게** 줄임(`SmoothSpeed`) · 색 초록 #58D27E / 노랑 #F2C94C(≤50%) / 빨강 #F0564E(≤25%) · 숨김이면 틀·채움 모두 끔. 부모 배율(서비스가 (12.5, 6.67) 로 키움)을 스크립트가 되돌려 계산 | `Models/Structures/LaneHpBar.model` · `Lane/LaneHpBar.mlua` · `Docs/tools/design-ui/apply-facility.cjs` |
| 억제기 오라 띠(#17) | 시설(LaneFacility 가 붙은 것)의 오라만: 스폰 그림을 `aura_band`(흰 원본)로, 컨트롤러 값이 들어오면(`AllySpeedBonus` / `AllyAtkBonus` / `AllyRegenPerSec` > 0) 특성 색 그림(`aura_band_speed` 하늘 · `_attack` 주황 · `_heal` 초록)으로 한 번 갈아 끼움 · 투명도 0.9 · 크기는 기존 `ApplySize`(판정 6.0×3.0 유닛 = 시안 600×300 · 바닥 −0.5~+2.5 와 일치) · 그림 크기를 API 로 못 읽으면 올린 원본 1200×600px / 100 으로 계산. 시설이 아닌 오라(진영 오라 등)는 종전 그대로(팀 색 · `auracircle` 그림) | `Faction/AuraEmitter.mlua` |
| 이름표(#20) | `apply-damage.cjs --nametag` 를 **선택 적용**으로만 둠(기본은 아무것도 안 고침). NPC 모델 21개의 이름표 판을 초록 칩(`chip_green_dark`)으로 + 굵게 | `Docs/tools/design-ui/apply-damage.cjs` |

## 안 한 것 (2단계 · 새 기능이거나 서버 파일 수정이 필요하거나 확신이 없음)

- **파괴 색 · 잔해(#18)** · **넥서스 피해 단계 금 · 연기 · 불꽃(#19)** — 켜고 끄는 곳이 서버 `LaneFacilityService.ApplyVisual` 이라 못 고쳤다(읽기만 하기로 함). 2단계에서: 시설 엔티티 자식으로 `Rubble`(`fx_rubble` 400×160 바닥 맞춤) · `Cracks`(`fx_cracks` 400×400 · HP ≤50%) · `Smoke`(`fx_smoke` 200×200 · ≤25%) · `Flame1/2`(`fx_flame` 80×100 · ≤10%)를 만들어 `ApplyVisual` 에서 켜고 끄고, 파괴 색 `Color(0.45,0.45,0.45,1)` · 주인 없음 `Color(0.97,0.97,0.97,0.9)` · 넥서스 밝기 곡선 1.0→0.65. 위치는 시안 s3 · s4 실측.
- **HP 바 틀 9-slice** — 월드 SpriteRenderer 의 `Sliced` 가 크기를 어떻게 받는지 확인 못 해 **고정 그림을 늘려서**(138×17 → 200×20, 비균등 배율) 그렸다. 모서리 꺾쇠가 가로로 약간 넓어 보일 수 있다.
- **시설 그림 15장 · `FacilitySprite.csv`(GroundOffset · BarOffset)** — 임시 그림이라 대상 아님(오프셋 재실측은 새 그림 뒤).
- **데미지 숫자(#1 · #3)** — 엔진 데미지 스킨은 아바타 아이템 종류 리소스(`Monster.DamageSkinRUID` = `02c22d93…` · 문서상 기본 스킨 `3271c3e7…` 이 아바타 카탈로그에 있음)라 스프라이트 교체로 안 된다. 시안 숫자 22장으로 스킨을 만드는 Maker 경로는 확인 못 해 만들지 않았다. 스킨 슬롯(치명타 · MISS · 폭발) 규격도 미확인.
- **플레이어 이름표 판 · 글자** — `NameTagRUID` 가 `@Sync` 가 아니라 서버(`TitleService.ApplyNameTag`)에서 써도 다른 클라에 안 간다 → `Global/Player.model` 값을 바꿔야 한다. 판이 9-slice 로 늘어나는지도 미확인. **칭호 띠**(이름표 위 금 띠)는 컴포넌트 하나로 못 그려 별 엔티티가 필요한 기능이라 2단계.
- **오라 주황 · 초록 hex** — 시안 텍스트에 없지만 색 입힌 그림 3장을 그대로 써서 필요 없어졌다.

## 2차 — 이름표 (2026-10-01 저녁 · 브랜치 a/design-ui-fix-nametag)

사용자 지적("이름표는 디자이너가 준 게 있는데 왜 안 했냐")에 따라 1차에서 미룬 이름표를 전부 적용했다. 🔴 Maker 를 쓰지 않아 **Play 로 본 것은 없다**(아래 "검증 때 볼 것").

### 한 것

| 항목 | 내용 | 파일 |
|---|---|---|
| 플레이어 이름표 판 · 글꼴 | `NameTagRUID` = `plate_dark_sm`(9-slice 테두리 10 · 시안 9 · `plate_dark` 는 11 이라 더 가까운 `_sm`) · `Bold` = true. 글자색은 엔진 기본 흰색 그대로. `NameTagRUID` 는 `@Sync` 가 아니라 서버가 못 쓰므로 모델 값으로 둠 | `Global/Player`(기존 파일 제자리 · ModelBuilder) |
| 칭호 띠 | 새 모델 `titlechip` = `NameTagComponent` 하나뿐인 빈 엔티티(판 `chip_gold_dark` · 글자 #FFE7A0 굵게). 서버(`TitleService.ApplyTitleChip`)가 칭호가 있는 플레이어에게 **자식으로 스폰**(칭호 바꾸면 글자만 갱신 · 해제하면 Destroy · 재접속 때는 `ApplyNameTag` 경로로 다시 붙음). 이름표 글자는 **닉네임만**, 칭호가 있으면 이름표 `OffsetY` 를 `NameShiftY`(-0.235)로 내려 띠 아래에 놓는다(시안: 띠 위 · 이름 아래) | `Models/Progression/TitleChip` · `Progression/TitleService.mlua` |
| NPC 이름표 | `apply-damage.cjs` 를 기본 적용으로 바꿔 NPC 21개 전부 `NameTagRUID` = `chip_green_dark`(테두리 10 · 시안 9) · `Bold` | `Models/Npcs/*` · `Docs/tools/design-ui/apply-damage.cjs` |

도구: `node Docs/tools/design-ui/apply-damage.cjs`(다시 돌려도 같은 결과 · diff 동일 확인) · `--status` 로 현황.

### 브리프와 달라진 것 (이유)

- 칭호 띠를 브리프의 "SpriteRenderer 9-slice + TextComponent" 가 아니라 **`NameTagComponent` 만 가진 엔티티**로 만들었다. 이유: (1) `TextComponent.Text` 가 `@Sync` 가 아니라 모든 클라에 글자를 보내려면 새 스크립트 컴포넌트 + RPC/동기화 + 런타임 `AddComponent` 가 필요한데 Maker 로 못 돌려 본다 (2) 월드 `SpriteRenderer` 의 9-slice 가 크기를 어떻게 받는지 1차에서도 확인 못 했고, 글자 폭에 맞춘 판 폭 계산이 글꼴마다 어긋난다 (3) 엔진 이름표는 판 · 글자 맞춤 · 그리는 층(플레이어 앞뒤 규칙과 무관)을 엔진이 다룬다. 새 스크립트도 없다. 안 되면(엔티티 이름표가 스프라이트 없는 엔티티에서 안 뜨면) 브리프 구조로 되돌린다.
- `FontSize` 는 안 건드렸다 — 속성이 `float`(기본 1)인데 px 인지 배율인지 d.mlua 에 없어 시안 14 를 옮길 근거가 없다. 기본값 그대로.

### 안 한 것 · 못 한 것

- 데미지 숫자 스킨은 사용자 결정으로 손대지 않음. 몬스터 이름표도 대상 아님.
- 이름표 글꼴이 Noto(Default)인지는 NameTagComponent 에 글꼴 속성이 없어 엔진 기본 그대로(시안의 Noto 700 굵게는 `Bold` 로만 근사).

### 검증 때 볼 것

1. 플레이어 이름표 판이 9-slice 로 늘어나는지 — **긴 닉네임 · 짧은 닉네임** 둘 다(모서리가 안 뭉개지고 글자가 판 안에 들어오는지).
2. 칭호 띠가 **보이는지**(스프라이트 없는 자식 엔티티의 이름표) · 닉네임 이름표 **위**에 뜨는지. `OffsetY` 부호가 반대면(이름이 띠 위로 가면) `TitleService.NameShiftY` 부호를 바꾼다. 띠와 이름 사이 간격은 값으로 조정.
3. 칭호 장착 → 해제 → 재장착, 재접속, 맵 이동(자식 엔티티가 따라오는지) · 다른 플레이어 화면에서도 띠가 보이는지(`Name` · `OffsetY` 동기화).
4. 띠가 플레이어(Default/4)를 가리지 않는지(이름표는 엔티티 층과 별개라 겹칠 일 없다고 추정).
5. NPC 이름표 초록 칩 판 · 흰 글자(21개 중 몇 곳) · 숨김 NPC(차원 관문)는 이름표가 꺼진 그대로인지.
6. `titlechip` 모델은 새 폴더(`Models/Progression`)라 Maker 가 `.directory` 를 만들도록 Reimport All 한 번 더. 모델 id 가 `titlechip` 으로 잡히는지(스폰 로그 `[Title] chip spawn failed` 가 없는지).

## 3차 — 이름표 v2(월드 엔티티) (2026-10-01 밤 · 브랜치 a/design-ui · Maker Play 로 맞춤)

2차의 "엔진 이름표 + 우리 판 그림"은 판이 아예 안 그려져 되돌렸다(엔진 `NameTagComponent.NameTagRUID` 는 이름표 종류 리소스만 받음). 그래서 **이름표를 월드 엔티티로 새로 그린다.** 엔진 이름표(플레이어 모델 2 · NPC 21)는 `Enable=false` 로 끈다.

### 구조

- 새 모델 `Models/Progression/WorldNameTag`(EntryKey `worldnametag`) = 루트(스크립트 `Progression/WorldNameTag.mlua`) + 자식 `Plate`(판 · `plate_dark_sm` 9-slice) · `Label`(이름) · `TitlePlate`(`chip_gold_dark`) · `TitleLabel`(칭호 · #FFE7A0). NPC 는 `Plate` 그림만 `chip_green_dark` 로 바뀐다(`Kind="npc"`).
- 서버는 `Label` · `Title` · `Kind`(`@Sync`)만 쓴다. 판 크기 · 글자 · 층은 **클라이언트마다** 스크립트가 맞춘다(바뀔 때 `OnSyncProperty` + 0.25초 확인).
- 플레이어: `TitleService.ApplyNameTag` 가 플레이어 **자식**으로 1개 스폰(있으면 재사용) → `Setup(닉네임, 장착 칭호, "player")`. 엔진 이름표는 서버에서도 한 번 더 끔. 칭호 장착/해제는 같은 경로(`ApplyTitleChip` · `titlechip` 모델 · `NameShiftY` 삭제).
- NPC: `NpcSpawner.AttachNameTag` 가 스폰 직후 자식으로 붙인다(글자 = 모델의 `NameTagComponent.Name` → 없으면 카탈로그 표시 이름). 숨김 NPC(차원 관문)는 안 붙인다.
- 적용 스크립트 `Docs/tools/design-ui/apply-damage.cjs`(다시 돌려도 같은 결과 · `--status`): 모델 생성 + 엔진 이름표 끄기 + 옛 `TitleChip` 삭제.

### Play 로 확인해서 맞춘 것 (코드에 상수로 박음 · 속성으로 조정 가능)

| 항목 | 값 | 근거 |
|---|---|---|
| 글자 컴포넌트 | **`TextRendererComponent`**(월드 글자). 브리프의 `TextComponent` 는 UI 용이라 월드 엔티티에서 **아무것도 안 그려진다**(FontSize 100 · 노란색으로도 안 보임) | Play 캡처 |
| 시안 px → 유닛 | 150px = 1유닛(1920 기준 · `WorldToScreenPosition` 으로 확인) | 스크립트 |
| Sliced `TiledSize` | 월드 유닛이 **아니라 그림 원본 크기의 배수**(1 = 원본 px/100 유닛: 43×29 그림 → 0.43×0.29). 그림 중심이 아니라 **원본 크기 기준 왼쪽 아래에서 오른쪽 위로** 자라서 판이 오른쪽으로 치우친다 → `((원본×배율 − 목표)/2)` 만큼 위치 보정 | 판 폭 실측(TiledSize 3 → 1.28유닛 · 중심 +0.43) |
| 판 크기 | 이름 판 높이 23.5(글자 14 + 위아래 4.75) · 폭 = 글자 폭 + 9.3×2(3글자 = 58.5 ✓ 시안) · 칭호 띠 높이 20(글자 13 + 3.5×2) · 폭 = 글자 + 13×2 · 두 판 사이 2 · 윗변은 발에서 6 아래 | 시안 s0 · 실측 plate 60.6→58.5 |
| 9-slice 배율 | 이름 · NPC 판 0.6 · 칭호 띠 0.533(그림 테두리 10px 를 시안 9 · 8px 로) | 계산 + 캡처 |
| 글자 | `FontSize`(float) 1 = 0.1유닛 → 14px 이름 = 0.933 · 13px 칭호 = 0.867 · 굵게 · 한글 1자 폭 ≈ 0.95em(굵은 14글자 = 약 187px 실측) · 글자 세로 가운데 판과 일치(오차 0.5px) | 캡처 픽셀 측정 |
| 층 | 판 `Default/2` · 글자 `Default/3` — 플레이어(`Default/4`) 뒤 | N29 |

위치: 시안(s0)이 **발 아래**(캐릭터 박스 바로 밑)라 그대로 따랐다(브리프의 "머리 위"는 엔진 이름표가 원래 발 아래라는 점과 같은 뜻으로 읽음).

### 본 것 (캡처 · `디자인인계/2026-09-23/applied/` · 합성 `_work/sheet_round2_8.png`)

- N19 기본 · N20 긴 닉네임 14글자(판이 늘어나고 모서리 · 글자 안 깨짐) · N21 칭호 장착(금 띠가 닉네임 위) · N22 해제(띠 사라지고 닉네임 판만) · N27 리스항구 NPC 초록 판 6곳 + 내 캐릭터 어두운 판 · N29 점프 중(내 이름표가 발 아래를 따라오고, 겹친 다른 이름표 2줄은 머리카락 **뒤**).
- 맵 이동: 로비 → 로비 배(`Orbis_Lobby_VictoriaShip`)로 텔레포트해도 자식 이름표가 따라오고 서버 · 클라 값(닉네임 · 칭호) 유지(로그). NPC 7개 맵 전체를 서버에서 훑어 85개 중 84개에 이름표 · 숨김 관문 1개는 없음.
- Play 로그: 이름표가 낸 Error 0. `[Title] nametag …` · `[NameTag] layout …` 확인. 마을 Play 에서만 `[Match] handoff 없음` 1줄(룸을 직접 만든 탓 · 무해 · 기존).

### 못 본 것 · 알아둘 것

- **다른 플레이어 화면**에서 실제로 보이는지(2번째 클라이언트 없음 — `@Sync` 값이라 가야 하지만 안 봄). N29 의 "다른 이름표"는 같은 모델을 맵에 모의로 스폰한 것. 재접속 · 실제 매치 룸에서 보이는 것도 안 봄.
- 로비 배 맵은 배가 플레이어를 가려 이동 뒤 **눈으로는** 확인 못 함(로그 · 클라 상태로만).
- 영문 · 숫자 · 섞인 이름의 판 폭은 어림값(대문자 0.7 · 소문자 0.58 · 숫자 0.6 · 공백 0.28)이라 안 맞을 수 있다. 한글만 실측.
- 리스항구 외 마을 NPC 이름표는 눈으로 안 봄(서버에서 개수만).
- NPC 원본 모델(`Dimensional Mirror` · id 9010022)도 이름표가 붙는다(영문 이름 그대로).
- 모바일 · 카메라 줌을 바꿨을 때의 글자 선명도는 안 봄.
- `Docs/스키마-계약.md` 의 "이름표는 서버가 `NameTagComponent.Name` 에 쓴다"(2곳)는 이제 낡았다 — 계약서는 공지 후 단독 작업이라 안 고쳤다.
- Maker 개인 월드 계정에 테스트로 `TTL_ROOKIE` 칭호를 추가했다(장착은 해제함). 실제 저장소 파일이 아니라 Maker 쪽 저장 데이터.
