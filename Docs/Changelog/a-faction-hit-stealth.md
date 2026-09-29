# a/faction-hit-stealth — 몬스터 피격 무적 제거 · 다크 사이트 은신 중 추격·조준 제외 (A)

> PR #120. 계획 `메월드폴더/WorkOrders/WO-034-몬스터무적제거-은신추격-활교체-메소그림.md` ①. 릴리스 때 `Docs/CHANGELOG.md` 로 합친다(협업-규칙 §13-1).

## 2026-09-29

### 몬스터 피격 무적 제거 (#40 사용자 결정 · 답 5884388966 · 5884390248)
- `Faction/MonsterHit.mlua` `IsHitTarget`: 항상 true — 0.4초 안의 타격 · 같은 프레임 여러 타격도 전부 받는다. `MonsterHit` 을 쓰는 모델 14개 = 포탑 2(`TurretA/B`) · 팜 몹 4 · 진영 몬스터 8.
- 넉백 · 경직만 `ImmuneCooldown`(0.4초) 간격(새 `LastKnockTime`) — 다단 히트에 몹이 계속 밀리고 굳지 않게(사용자 결정). 간격 안 타격은 피해만 받고 로그 `[MonsterHit] … knockback skipped`.
- `Monster.mlua` `ReactToHit`: 밀림(슬라이드) · 경직(CastFreeze)도 새 `KnockbackInterval` 0.4 간격(`lastKnockAt`) — 첫 촬영에서 5타에 여러 번 밀려 추가(사용자 지적). 피해 · 플래시 · 돌아보기는 매 타격. `Monster.mlua` 는 #122(WO-035)도 고친다 — 이쪽은 `ReactToHit`, 그쪽은 `HandleHitEvent` 맨 위라 겹치지 않는다.
- 영향: 여러 공격자가 한 대상을 칠 때 0.4초에 1타만 들어가던 게 전부 들어간다 → 레인 교전 · 포탑 파괴 · 팜 사냥이 빨라진다(수치 조정은 이 PR 밖).

### 다크 사이트 은신 중 추격 · 조준 제외 (#40 5849781728 3번 B 제안 · 사용자 "B 제안대로")
- `Faction/FactionLogic.mlua` 새 `IsTargetable(Entity)`(ServerOnly): isvalid · 관전자 아님 · 다크 사이트 활성 아님(B `SkillBuffs.IsActive` 호출만).
- 바꾼 곳(대상 고르기만): `StateChaseMonster` AcquireTarget · IsTargetValid(이미 쫓던 몹도 놓음 · 보스 KeepTargetForever 포함 · 로그 `[Chase] … lost target`) · `Faction/FactionAI` · `Faction/TurretAI` FindNearestEnemy. 은신이 풀리면 IDLE 의 AcquireTarget 이 다시 잡는다.
- 안 바꾼 곳(맞는 판정 · 연출): `FactionAttack.CollectNearestEnemies`(넣으면 은신 10초가 사실상 무적) · `BossSkillRunner.FindNearestPlayer`(보스 패턴은 계속 온다) · `FactionAuraController` · `MesoCoin` 자석.
- B 제안과 다른 점 1개: 잠금 추격(`IsChaseNearPlayer=false` — `SetTarget` · 피아누스 · 도발)은 대상을 놓지 않는다. 놓으면 탐색을 안 해서 은신이 풀려도 다시 못 잡는다.

### 검증 (2026-09-29 · Maker Play)
- 환경: main `776ab4f` + #120 + #121 로컬 합본(`local/wo034-test` · push 안 함) · 개인 월드 · Orbis_Lobby_VictoriaStation(정적 룸) · 2026-09-29 Maker Play. 피스트인레이지만 B #116 을 그 로컬 합본에 더 합쳐 봤다(충돌 3곳은 테스트 브랜치에서만 풀었다 · B 브랜치는 그대로).
- 빌드 경고 **1 → 1**(남은 1건 = 원래 있던 `ParseStatCsv` LWA-1111 · 에러 0 · 재수정 · #116 합본 뒤 Refresh 두 번 모두 같음) · 런타임 에러 0(경고 = 원래 있던 `[BossCatalog]` · LWA-3047) · check-integrity 통과(경고 3 = main) · LSP 0.
- 영상 · 로그 보고서: https://claude.ai/artifact/DJNmg2zK9xPjrfrHXDKtLH
- **무적 제거 PASS**: 팜 몹에 기본 공격 경로로 0.1초 간격 5타 → 5번 모두 피해.
- **넉백 간격 — 재수정 뒤 PASS**: 첫 촬영에서 몹이 여러 번 밀렸다(사용자 지적) — `MonsterHit` 힘 넉백만 막고 `Monster.ReactToHit` 의 밀림 · 경직은 매 타격 걸리고 있었다. `KnockbackInterval` 0.4 를 넣은 뒤 5타(0.41초 안)에 밀림은 첫 타 한 번(+0.2 · x 위치 0.05초 간격 기록) · HP −205.
- **피스트인레이지 10타 PASS**(B #116 + `PunchSequenceHits` 실행 중 true): 에너지 차지 → 재입력 2회 · `sequence hit SK_P21 … #10` × 2 · 앞쪽 몹 20타 전부 피해(HP −940 = 47 × 20). 무적이 있을 땐 0.12초 간격 10타 중 1 · 5 · 9타만 들어갔다.
- **은신 추격 PASS**: 뿔버섯(`monster2110200`)이 쫓아오다(거리 3.50 → 2.51) 다크 사이트 ON 순간 `[Chase] … lost target` → IDLE · 거리 1.55 유지 → 5초 뒤 OFF 에 다시 CHASE(거리 0.33).
- 못 본 것: 포탑 · 진영 몬스터 조준 · 보스 이동(같은 `IsTargetable` 을 부름).
