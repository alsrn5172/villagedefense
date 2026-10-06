# b/skill-no-attack-on-rope

## 2026-10-05 — 줄 · 사다리 위 공격 금지 (사용자 결정)

줄 · 사다리에 매달린 캐릭터는 피격되지 않는다 → 거기서 공격하면 일방적으로 때리는 악용이 된다.
규칙: 매달린 동안 **공격**(모든 직업의 피해 스킬 · 궁 5종 · 기본 공격)은 시전되지 않고 피해도 들어가지 않는다. 버프 · 이동 스킬은 바꾸지 않는다.

| 곳 | 무엇 |
|---|---|
| `Skill/SkillCaster.mlua` (B) | 판정 한 곳: 클라 = 로컬 플레이어 상태기가 `CLIMB`(줄) / `LADDER`(사다리) · 서버 = 클라가 바뀔 때마다 알리는 값(`ReportClimbing`) 또는 서버 상태기. 공격 시전 = `IsAttackCast`(= `IsDamagingCast` + 궁 전부 · 재시전 주먹 포함). 클라 `Cast` · 서버 `RequestCast`(4-1b · MP · 쿨다운 · 영혼석 앞) 둘 다 거절. 기본 공격 = 클라 `OnUpdate` 가 `PlayerControllerComponent:AddCondition("Attack", …)` 를 건다. 피해 게이트 `BlocksDamageWhileClimbing`(이동 스킬 예외 · 0.5s 에 로그 한 줄) |
| `Skill/SkillAttack.mlua` (B) | `IsAttackTarget`: 시전자가 매달려 있으면 타격 없음(아이언 바디 반사 `FlatTag` 제외) — 시전 뒤 매달린 늦은 타격 · 궁 후속 파 |
| `Skill/SkillProjectile.mlua` (B) | `IsAttackTarget`: 시전자가 매달려 있으면 날아가던 투사체 · 폭발도 피해 없음 |
| `PlayerAttack.mlua` (B · 협업-규칙 :91) | `HandlePlayerActionEvent`("Attack") — 매달려 있으면 `AttackNormal` 을 부르지 않는다(모션 · 소리 · 판정 없음 · 서버 판정본). `AttackNormal` 의 유일한 호출 지점이라 같은 효과이고, #161 이 고치는 `AttackNormal` 첫 줄과 겹치지 않는다 |

- 예외(그대로): 버프(하이퍼 바디 · 매직 가드 · 다크 사이트 · 쉐도우 파트너 · 에너지 쉴드 · 에너지 차지 1단 · 닷지) · 이동(텔레포트 · 텔레포트 강화 도착 광역 피해 포함) · 도발(피해 없음) · 패시브.
- 로그: 클라 `SkillCaster: climbing=true (state CLIMB) — reported to server` · `cast(pred) <id> ok=false reason='on a rope or ladder'` · 서버 `[Skill] climbing=true` · `[Skill] on rope/ladder — <id> refused` · `[Skill] on rope/ladder — hit refused (<id>)` · `[PlayerAttack] on rope/ladder — basic attack refused`.
- 런타임 미검증: 상태 이름 `CLIMB` / `LADDER` 와 입력 조건 이름 `"Attack"` — 숫자 줄(RUN-rope.md)과 사용자 눈(RELOOK)으로 확인한다.

## 2026-10-05 (2) — 시전 중 줄 · 사다리 잡기 금지 (M3 · 사용자 결정 · AUDIT-rope-move.md)

- `Skill/SkillCaster.mlua` `LockPresentation`: 시전 락 입력 조건에 `MoveUp` · `MoveDown` 을 더했다(`Jump` · `DownJump` 와 같은 조건 = 락 중이면 땅 · 공중 모두 차단). 엔진의 줄 · 사다리 잡기(ActionClimb)는 위 · 아래 키로 시작하므로 어떤 시전 락 동안에도 줄을 잡아 무적으로 빠져나가지 못한다. 락 동안은 아래 키 엎드리기도 막힌다.
- 런타임 미검증: 입력 조건 이름 `"MoveUp"` / `"MoveDown"`(엔진 기본 액션 이름 · `RUN-rope.md` RO-9).

## 2026-10-05 (3) — 기본 공격 중 이동 금지 (M1 · 사용자 결정 · AUDIT-rope-move.md)

- `Skill/SkillCaster.mlua`: 기본 공격(Ctrl)도 스킬과 **같은 시전 락**을 건다 — 따로 락 장치를 만들지 않았다(castId · `LockPresentation` · `ReleaseCastLock` · 타이머 그대로).
  - 시작: 클라 `OnUpdate` 가 로컬 플레이어의 `PlayerActionEvent`(엔진 · 클라에서도 난다)를 구독 → `"Attack"` 이면 `LockForBasicAttack`. 무기와 무관한 같은 Ctrl 액션이라 근접 · 활 · 아대(#161 원거리 기본 공격, 머지되면)가 모두 같은 길로 온다.
  - 길이 `BasicAttackLockSeconds` 0.8 = 기본 공격 모션 한 번: 무기별 동작(swingO1 · swingT1 · shoot1 · stabO1 · swingO3 · swingP1 …)의 원작 프레임 지연 합이 전부 800ms(maplestory.io KMS 389 · harness `smallprs-check/ref-basic-attack-motion-lengths.txt`) · `WeaponMotion.csv` 기본 행 PlayRate 전부 1 · 휘두르기 Play 실측 0.80s(SkillMotionSet LockTime)와 같다.
  - 땅: 걷기 · 방향 전환 · 점프 · 줄 잡기 금지 / 공중: 스킬과 같다(점프 · 줄 잡기만 금지 · 궤적 유지).
  - 기본 공격 락은 상태기를 끄지 않는다(엔진 ATTACK 상태가 재생 중인 휘두르기를 끊지 않게) · 다음 Ctrl 을 막지 않는다(공격 속도 그대로) · 스킬 시전을 막지 않는다(`lockIsBasic` · 스킬 락이 이어받는다). 스킬 락 도중의 Ctrl 은 그 락을 줄이지 않는다.
  - 이어지는 락은 처음 캐시한 이동 속도를 지킨다(`LockPresentation` 이 다시 캐시하지 않는다 — 다시 캐시하면 0 을 담아 풀린 뒤 못 걷는다).
  - 피해 · 판정 시각 · 서버 쪽은 그대로(서버 `PlayerAttack` 무변경).
- 런타임 미검증: 클라에서 `PlayerActionEvent` "Attack" 이 나는지(API 문서: Space Server, Client) · 상태기를 켠 채 MoveLeft/MoveRight 조건만으로 제자리 걷기 모션이 안 나오는지 — `RUN-rope.md` RO-8 · RELOOK R27.

## 2026-10-06 (4) — 락이 풀릴 때 누르고 있던 방향키로 곧바로 걷기 (사용자 결정)

> 시전 락 · 기본 공격 락(0.8 s) 동안 누른 방향키가 버려져, 락이 끝나도 키를 다시 눌러야 걸었다. 락이 끝날 때 방향키를 누르고 있으면(락 전에 눌렀든 락 중에 눌렀든) 곧바로 걷고 그쪽을 본다. 락 중에 눌렀다 뗀 키는 아무것도 안 하고, 락 동안은 계속 아무것도 안 움직인다.

- 원인: 땅 락 동안 `MoveLeft` / `MoveRight` 조건(`LockPresentation` · 제자리 걷기 모션을 막으려고 2026-09-09 에 넣음)이 거짓이라 컨트롤러가 그 키의 누름을 버린다. 컨트롤러는 누르는 순간에만 이동을 시작하므로 조건이 다시 참이 돼도 이미 누르고 있는 키는 다시 읽지 않는다.
- 고침(`Skill/SkillCaster.mlua` · B 파일 하나): 공통 해제 길 `ReleaseCastLock` 끝에서 땅 락이었으면(`hasCachedInputSpeed`) `ResumeHeldMove` — ← / → 중 `MoveLeft` / `MoveRight` 에 묶인 키를 지금 누르고 있으면 그 키의 `KeyDownEvent` 를 `_InputService` 로 한 번 다시 보낸다(조이스틱이 이동을 넣는 것과 같은 이벤트). 둘 다 누르고 있으면 보내지 않는다. 사망 해제(`dead`)와 공중 락(조건이 막지 않음)은 건드리지 않는다. 로그 `cast lock OFF #n — held <key> → move resumed (KeyDown re-sent)`.
- 스킬 락 · 기본 공격 락 · 이어진 락(Ctrl 연타 · Ctrl → 스킬)은 모두 마지막 `ReleaseCastLock` 한 번에서만 부른다. 서버 · 피해 · 락 길이 변경 없음.
- **Play 안 함.** 합성 `KeyDownEvent` 를 컨트롤러가 실제 키처럼 받는지는 런타임 미검증(숫자 RO-10 · RELOOK R33).
