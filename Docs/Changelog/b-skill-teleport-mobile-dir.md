# b/skill-teleport-mobile-dir — 텔레포트 방향: 방향 입력 변수(MoveVelocity)로 PC · 모바일 같이

## 2026-10-01

근거: #40 5897840056 2-(1) "B 가 `Skill/` 안에서 읽는다 · 후보 `RigidbodyComponent.MoveVelocity` · PC · 모바일을 따로 다루지 말고 방향 입력이 들어오면 값이 바뀌는 변수를 읽는다". A 는 조이스틱이 이 값을 채우는지 Play 로 확인하지 않았다.

| 순서 | 예전 | 지금 |
|---|---|---|
| ① 방향키 4개(`IsKeyPressed`) | 좌우 우선 | **그대로** |
| ② 방향 입력 변수 | — | `RigidbodyComponent.MoveVelocity`: 한 축 절댓값 ≥ `MoveInputDeadZone`(0.3)이면 큰 축 하나(같으면 좌우) |
| ③ 바라보는 방향 | 방향키가 없으면 | ①② 가 없을 때 |

- 파일: `Skill/SkillMovement.mlua` — `ResolveDirection(controller, body)`(인자 하나 추가 · 호출 한 곳 `TryTeleport`) · 새 값 `MoveInputDeadZone = 0.3`. 닷지(`TryDodge`)는 방향을 안 쓴다 · 그대로.
- **로그(시전마다 한 줄):** `SkillMovement: dir <left|right|up|down> source=<keys|moveVelocity|facing> mv=(x,y)` — 모바일에서 조이스틱을 기울이고 텔레포트했을 때 `source=moveVelocity` 가 나오면 이 값이 채워지는 것이다. `source=facing mv=(0.00,0.00)` 이면 조이스틱이 이 값을 채우지 않는다 → 다른 변수를 찾아야 한다.
- 🟡 런타임 미확인: 모바일 조이스틱이 `MoveVelocity` 를 채우는지 · 땅 위에서 위/아래 입력이 y 에 잡히는지(MapleTile 은 사다리 밖 상하 이동이 없어 y 가 0 일 수 있다) · 데드존 0.3 이 맞는지.
- LSP `SkillMovement` 깨끗 · `check-integrity` 통과.

### Play 확인
1. PC · 방향키: ← → ↑ ↓ 누른 채 텔레포트 → 예전과 같은 방향 · 로그 `source=keys` (옆의 `mv=` 값도 적어 두면 PC 방향키가 이 값을 채우는지 같이 보인다).
2. PC · 방향키 없이 → `source=facing` · 바라보는 쪽.
3. 모바일(Maker 모바일 미리보기 또는 기기) · 조이스틱 왼쪽/오른쪽 기울인 채 스킬 버튼 → `source=moveVelocity` · 그 방향.
4. 모바일 · 조이스틱 위/아래 → `source=moveVelocity` 가 up/down 이면 위아래 텔레포트 · `mv=(0.00,…)` 의 y 가 0 이면 상하는 이 값으로 못 읽는다(보고).
5. 빌드 경고 N → N.
