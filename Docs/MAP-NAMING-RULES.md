# 맵 ID 이름 규칙

## 적용 범위

이 규칙은 안농 월드에 새로 만들거나, 사용자 요청으로 이름을 정리하는 맵의 **영문 파일/맵 ID**에 적용한다. 한국어·공백은 맵 ID에 사용하지 않는다.

## 기본 형식

```
<Region>_<Role>_<Detail>
```

- `Region`: 지역 영문명. 예: `KerningCity`, `Henesys`, `Ellinia`, `Perion`, `Nautilus`, `LithHarbor`, `Sleepywood`
- `Role`: `Village`, `Hunt`, `Boss` 중 하나
- `Detail`: 역할을 구별하는 PascalCase 영문 토큰
- 구분자는 밑줄(`_`)만 사용한다. 토큰 안에는 영문자와 숫자만 사용한다.

## 역할별 규칙

| 역할 | 형식 | 용도 | 예시 |
| --- | --- | --- | --- |
| 미니미 메인 마을 | `<Region>_Village_MinimiMain` | 미니미 월드용 메인 마을 | `KerningCity_Village_MinimiMain`, `Henesys_Village_MinimiMain` |
| 마을 내 특수 지점 | `<Region>_Village_<Landmark>` | 지하철 입구 등 마을의 구별되는 지점 | `KerningCity_Village_SubwayEntrance` |
| 일반 사냥터 | `<Region>_Hunt_<Landmark>` | 사냥터의 지형·목적·대표 몬스터를 반영 | `KerningCity_Hunt_SewerApproach`, `Henesys_Hunt_BlueMushroomTrail` |
| 보스맵 | `<Region>_Boss_<BossName>` | 보스 이름을 명시 | `KerningCity_Boss_KingSlime`, `Henesys_Boss_Mushmom` |

## 기존 맵 처리

- `KerningCity`, `Ellinia`, `Perion`처럼 `Minimi` 접두어가 없는 기존 원본 마을맵은 그대로 둔다.
- 사용자 보존 원본인 `KerningCity-원본`은 예외적으로 현재 이름을 유지한다. 이 맵의 파일명·루트 맵 ID·`SectorConfig` 항목은 모두 `KerningCity-원본`으로 일치시킨다.
- 기존 원본 맵을 새 ID로 자동 변경하지 않는다. 이름 변경은 사용자 승인과 맵 파일·`SectorConfig`·포탈 참조를 함께 검토하는 별도 작업으로만 한다.
- 앞으로 `MinimiHenesys`처럼 지역명 앞에 `Minimi`를 붙인 형태는 새로 만들지 않는다. 미니미 전용 마을은 반드시 `<Region>_Village_MinimiMain` 형식을 쓴다.

## 이름 결정 원칙

- `Detail`은 목적을 바로 알 수 있게 구체적으로 쓴다. `Map1`, `AreaA`, `Somewhere` 같은 이름은 금지한다.
- 보스 전 단계 사냥터는 `Approach`, `Trail`, `Path` 등 접근 역할이 드러나는 단어를 쓴다.
- 파일명, `SectorConfig`의 `map://` 항목, 포탈 대상 ID는 같은 영문 맵 ID를 사용한다.
