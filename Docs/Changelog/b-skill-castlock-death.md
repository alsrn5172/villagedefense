# b/skill-castlock-death

## 2026-09-25 — 시전 락 중 사망이 사라지는 버그 수정

### 증상 (#83 4차 Play 에서 발견 · 사용자 결정으로 별도 PR)

- 지상에서 스킬을 쓰면 시전 락(`SkillCaster.LockPresentation`)이 클라 `StateComponent` 를 끈다(걷기 모션 방지).
- 그동안 치명타를 맞으면 엔진의 사망 전이(DEAD)가 무시되고, 락이 풀린 뒤에도 다시 오지 않는다.
  - 실측: 락 중 치명타 → HP −700 · 서버 · 클라 모두 `IsDead=false`(락 해제 뒤에도). 클라 `ProcessDead()` 도 락 중엔 무시(state IDLE).
  - 락 밖에서는 같은 타로 바로 DEAD(서버 · 클라).
- 결과: 음수 HP 로 계속 살아 있고, 휘두르기 · 늦게 들어가는 스킬 타격 · 스킬 연출이 그대로 이어졌다. 모든 시전 락 스킬 공통.

### 수정

- `Skill/SkillCaster.mlua`
  - `LockPresentation`: 락 동안 0.05s 마다 HP 감시. 0 이하가 되면 곧바로 `ReleaseCastLock(castId, "dead")`(상태기 복구) → 아직 안 죽었으면 `ProcessDead()` 로 사라진 사망을 다시 건다 → 서버에 `ReportCastLockDeath`. 이 시전의 락이 끝나면 감시도 스스로 멈춘다.
  - 신규 `ReportCastLockDeath(castId)`(Server · 관전자 차단): 서버에서도 HP 0 이하(또는 사망)일 때만 · 그 시전자의 스킬 연출 엔티티 `SkillFx_<uid>_*`(휘두르기 잔상 등)를 지우고 1.5s 동안 0.1s 마다 다시 쓸어낸다(늦게 스폰되는 연출까지).
- `Skill/SkillAttack.mlua` `IsAttackTarget`: 시전자(플레이어)가 HP 0 이하거나 죽었으면 false — 시전 뒤 늦게 들어가는 스킬 타격(파워 스트라이크 접촉 등)이 안 들어간다.

### 건드리지 않은 것

- 사망 · 부활 흐름 자체(A 의 `PlayerRespawnService` · 엔진) — 사라진 사망을 다시 걸기만 한다.
- `PlayerHit`(A) · 시전 락 길이 · 공중 시전(상태기를 끄지 않음).
- `EffectService` 로 튼 연출(엔티티가 아님)은 지우지 못한다 — 예: main 의 파워 스트라이크 찌르기 불꽃(#83 에서 없어짐).

### Play 검증 (대기)

**빌드 경고: ? → ?** (대기)

| 항목 | 기대 | 결과 |
|---|---|---|
| 시전 0.45s 대기 중 치명타 | 곧바로 DEAD(서버 · 클라) · 락 풀림 · 스킬 타격 안 들어감 · 연출 엔티티 지워짐 | 대기 |
| 시전 밖 사망 | 예전처럼 DEAD | 대기 |
| 시전 중 일반 피격 | 예전처럼(휘두르기 · 타격 그대로) | 대기 |
| 부활 뒤 시전 | 정상 | 대기 |
