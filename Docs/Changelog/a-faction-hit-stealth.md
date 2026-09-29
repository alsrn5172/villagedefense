# a/faction-hit-stealth — 몬스터 피격 무적 제거 · 다크 사이트 은신 중 추격·조준 제외 (A)

> PR #120. 계획 `메월드폴더/WorkOrders/WO-034-몬스터무적제거-은신추격-활교체-메소그림.md` ①. 릴리스 때 `Docs/CHANGELOG.md` 로 합친다(협업-규칙 §13-1).

## 2026-09-29

### 몬스터 피격 무적 제거 (#40 사용자 결정 · 답 5884388966 · 5884390248)
- `Faction/MonsterHit.mlua` `IsHitTarget`: 항상 true — 0.4초 안의 타격 · 같은 프레임 여러 타격도 전부 받는다. `MonsterHit` 을 쓰는 모델 14개 = 포탑 2(`TurretA/B`) · 팜 몹 4 · 진영 몬스터 8.
- 넉백 · 경직만 `ImmuneCooldown`(0.4초) 간격(새 `LastKnockTime`) — 다단 히트에 몹이 계속 밀리고 굳지 않게(사용자 결정). 간격 안 타격은 피해만 받고 로그 `[MonsterHit] … knockback skipped`.
- 영향: 여러 공격자가 한 대상을 칠 때 0.4초에 1타만 들어가던 게 전부 들어간다 → 레인 교전 · 포탑 파괴 · 팜 사냥이 빨라진다(수치 조정은 이 PR 밖).

### 다크 사이트 은신 중 추격 · 조준 제외 (#40 5849781728 3번 B 제안 · 사용자 "B 제안대로")
- `Faction/FactionLogic.mlua` 새 `IsTargetable(Entity)`(ServerOnly): isvalid · 관전자 아님 · 다크 사이트 활성 아님(B `SkillBuffs.IsActive` 호출만).
- 바꾼 곳(대상 고르기만): `StateChaseMonster` AcquireTarget · IsTargetValid(이미 쫓던 몹도 놓음 · 보스 KeepTargetForever 포함 · 로그 `[Chase] … lost target`) · `Faction/FactionAI` · `Faction/TurretAI` FindNearestEnemy. 은신이 풀리면 IDLE 의 AcquireTarget 이 다시 잡는다.
- 안 바꾼 곳(맞는 판정 · 연출): `FactionAttack.CollectNearestEnemies`(넣으면 은신 10초가 사실상 무적) · `BossSkillRunner.FindNearestPlayer`(보스 패턴은 계속 온다) · `FactionAuraController` · `MesoCoin` 자석.
- B 제안과 다른 점 1개: 잠금 추격(`IsChaseNearPlayer=false` — `SetTarget` · 피아누스 · 도발)은 대상을 놓지 않는다. 놓으면 탐색을 안 해서 은신이 풀려도 다시 못 잡는다.

### 검증
- (대기) Maker Play — 워크트리를 개인 월드에 물려 Reimport All(허브 CLAUDE §1-2).
