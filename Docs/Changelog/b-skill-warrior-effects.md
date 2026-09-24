# b/skill-warrior-effects

## 2026-09-25 — 도발 연출 = 몬스터 마그넷(80003292) · 두손검 버프·도발 자세 = alert 2.5배속 · 한손 도발 = stabO1 찌르기

### 결정 (사용자 2026-09-25 · 전사 연출 점검)

- **시대 규칙**: 일반 스킬은 원작(클래식) 그림을 쓰고 궁극기는 최신 컷신을 그대로 둔다 → 하이퍼 바디(`0008003`) · 불굴의 진(세이크리드 바스티온)은 그대로.
- **도발(SK_W22)** = 몬스터 마그넷 헌정 팩 `skill/800032.img/skill/80003292`: 시전자에 effect · 끌려온 몬스터마다 mob 클립. 팩의 hit/0 은 안 쓴다(도발은 피해 없음).
- **두손검 자세**:
  - 두손검 아바타 아이템에 `heal` 프레임이 없어 heal 동안 대검이 사라진다. 2026-09-25 Play 에서 확인: 한손 heal 은 칼이 보이고, 두손 heal 은 무기가 없고, 두손 alert 는 대검이 보인다.
  - 그래서 하이퍼 바디 · 도발 · 불굴의 진 **두손 시전 행 = alert 2.5배속**(이미 `_2` 에 쓰는 빠른 전투 자세)으로 바꾼다. 두손 버프 자세는 디자인 요청하지 않는다.
- **한손 도발** = stabO1 찌르기 한 번(칼이 보이는지 테스트에서 확인). 두손 찌르기(stabT1)는 전사의 은빛 대검이 **안 그려져** 쓰지 않는다.

### 수정

- `RootDesk/MyDesk/Skill/SkillExecutors.mlua`
  - `effectOverrides.SK_W22`: cast `6be2e2e263464cdaae4d9fe74d0e1a92`(effect · 18프레임 134×109) · mob `bbbab53f359942f6a43568635ab0ae0b`(7프레임 32×35). 예전 = 노블 디맨드 1211013(cast `9a4f1f2b…` · mob `94772084…`).
  - 주석 2곳(`ExecuteTaunt` mob 클립 · `GetMotionSequence` 두손 행).
- `RootDesk/MyDesk/WeaponMotion.csv` — B 행 4개, 값만 바꿨다(헤더 · 열 변경 없음):

| MotionId | 예전 | 지금 |
|---|---|---|
| `MOTION_SK_W21_SWORD_2H` (하이퍼 바디) | heal 1.5 ZigzagLoop | **alert 2.5 ZigzagLoop** |
| `MOTION_SK_W22_SWORD_1H` (도발 한손) | heal 1.5 ZigzagLoop | **stabO1 1 Onetime** |
| `MOTION_SK_W22_SWORD_2H` (도발 두손) | heal 1.5 ZigzagLoop | **alert 2.5 ZigzagLoop** |
| `MOTION_SK_W31_SWORD_2H` (불굴의 진) | heal 1.5 ZigzagLoop | **alert 2.5 ZigzagLoop** |

### 건드리지 않은 것

- 한손 하이퍼 바디 · 불굴의 진(heal → alert → stand1).
- 순서 시점(`_2` 1.0 / 1.5s · `_END` 1.6 / 5.5s).
- 도발 소리(노블 디맨드 Use · 새 팩엔 소리 없음) · 끌어모으기 · 추격 로직.
- 궁수 닷지(SK_A22): 활도 두손 무기라 heal 동안 활이 사라질 수 있다 — 궁수 차례에 확인한다.

### Play 검증 (대기)

**빌드 경고: ? → ?** (대기)

| 항목 | 기대 | 결과 |
|---|---|---|
| 도발 시전 이펙트 | 몬스터 마그넷 effect 가 시전자에 · 바라보는 쪽 | 대기 |
| 도발 mob 클립 | 끌려온 몬스터마다 · hit/0 없음 | 대기 |
| 한손 도발 | stabO1 찌르기 · 칼이 보인다 → `_2` alert → `_END` stand1 | 대기 |
| 두손 도발 · 하이퍼 바디 · 불굴의 진 | alert 2.5배속 · 대검이 계속 보인다 → `_END` stand2 | 대기 |
| 한손 하이퍼 바디 · 불굴의 진 | 그대로 | 대기 |
