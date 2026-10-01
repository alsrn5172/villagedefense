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
