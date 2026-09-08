# feature/skill — 전직/스킬 작업 (B)

> PR #32 `[feature/skill] 전직/스킬 작업 합치기 시작`. 이 브랜치의 조각 로그. 릴리스 때 `Docs/CHANGELOG.md` 로 합친다(협업-규칙 §11).

## 2026-09-09

### `RootDesk/MyDesk/Skill/SkillExecutors.mlua` — 에너지볼트 시전 이펙트가 오른쪽 시전 때 등 뒤(왼쪽)에 남던 버그
- **증상**: 에너지볼트(`SK_M11`)를 오른쪽으로 쏘면 시전 이펙트가 캐릭터 뒤 왼쪽에 머물고, 왼쪽으로 쏘면 정상.
- **원인**: 메이플 원본 스킬 이펙트는 왼쪽을 보는 기준으로 그려져 pivot 이 캐릭터 앞(왼쪽)에 있다. `PlayStageEffect` 가 `PlayEffect` 를 뒤집기 없이 재생했고, 플레이어 facing 은 `LookDirectionX` 로 표현돼 `Scale.x` 처럼 자식이 따라 뒤집히지 않는다. 또한 `PlayEffect` 는 월드 좌표 고정이라 시전 직후 이동하면 그 자리에 남는다.
- **수정**: `cast` 단계만 `_EffectService:PlayEffectAttached(ruid, caster, Vector3.zero, …, opt)` + `opt["FlipX"] = LookDirectionX > 0`. `impact` 단계(AOE·ORIGIN 의 캐스터 위치 폭발)는 지면 고정이 맞아 `PlayEffect` 유지. 파티클 폴백 경로 변경 없음.
- `GetFacingX(caster)` 헬퍼 추가(ServerOnly, `LookDirectionX` 부호만). `ExecuteMeleeArc` 의 자체 facing 계산을 이 헬퍼로 교체(동작 동일).
- 근거: `Environment/NativeScripts/Service/EffectService.d.mlua` 옵션 키 `FlipX` · `.claude/skills/maplestory-skill-maker/references/player/cast-effects.md` "Cast Effect Direction Flip Rule".
- 건드리지 않은 것: `SkillProjectile.OnAttack` 의 피격 이펙트(대상 위치 `PlayEffect`, 뒤집기 없음). 필요하면 별도 확인 후.

### `RootDesk/MyDesk/Skill/SkillAttack.mlua` — 투사체를 바라보는 쪽 앞에서 발사
- 요청: 메이플 에너지볼트처럼 시전 이펙트가 뜨는 손 앞에서 발사. 발 위치(x)에서 나가던 것을 `x + LookDirectionX × ProjectileSpawnOffsetX(0.5)` 로.
- `SpawnOffsetX` 열 추가 대신 코드 기본값(`ProjectileSpawnOffsetX`). 열로 승격하려면 헤더 변경이라 협업-규칙 §1-5(스키마-계약 선행 PR + 공지) 필요.
- 로그에 `spawnX`/`offsetX` 추가.

### `RootDesk/MyDesk/SkillInfo.csv` — `SK_M11` 에너지볼트 `Cooldown` 0 → 1.5 (기존 행 수정 · B 소유 행)
- 요청: 연타 방지, 쏘고 몇 초간 재시전 불가. 서버 `PlayerSkillState.StartCooldown` + 클라 미러 쿨다운(핫바 회색)이 이미 있어 값만 넣으면 동작. 헤더 변경 없음.
- 수치는 임시. 메이플 원작 에너지볼트는 쿨타임 없이 시전 모션 락(~0.8s)만 있으므로 체감에 맞춰 조정.

### `RootDesk/MyDesk/Skill/SkillCaster.mlua` — 시전 락 (원작 공격 딜레이: 시전 중 이동 불가 · 그동안 어떤 스킬도 재시전 불가)
- 요청: 메이플 원작처럼 스킬을 쓰는 동안 못 움직이고, 못 움직이는 동안 다른 스킬도 못 쓴다.
- 클라(`Cast`): 쿨다운·MP 게이트 뒤 `castLockActive` 면 거절. 통과하면 `castId` 발급 → `LockPresentation`(지상: `InputSpeed` 캐시 → `Stop()` → 0 / 공중: 궤적 보존을 위해 안 건드림 · `FixedLookAt` 으로 시선 고정 · `AddCondition("Jump"/"DownJump")` 점프 차단) → `RequestCast(skillId, castId)` → `SetTimerOnce(lock)` 로 `ReleaseCastLock(castId)`.
- 서버(`RequestCast`): 게이트 4-1 `castLockUntil[uid]`(ServerElapsedSeconds) 로 락 중 재시전 거절. 성공 시 `now + lock×0.9` 스탬프(왕복 지연 여유).
- `CastResult` 에 `castId` 추가. 실패 응답은 그 `castId` 의 클라 락만 해제. 타이머·거절 모두 `ReleaseCastLock` 하나로 수렴(멱등, 다른 castId 무시).
- 락 길이: `DefaultCastLockSeconds=0.4`, `castLockOverrides.SK_M11=0.4`(원작 공격 딜레이 ≈0.8s 의 절반 · 2차 요청). CSV `CastTime` 열 승격은 §1-5 절차 후.
- 이동 스킬 예외(`IsMovementSkill` = behavior `BLINK`): 락 중에도 시전되고 자기 락을 걸지 않는다(클라·서버 양쪽 게이트). 원작 텔레포트 캔슬.
- 이동 입력 자체 차단: `AddCondition("MoveLeft"/"MoveRight")` — 지상 시전으로 이동을 잠근 동안만(`hasCachedInputSpeed`). 공중 시전은 방향 입력을 살려 궤적 보존.
- 제자리 걷기 모션 제거(3차 · 방향키 누른 채 시전 시 다리가 계속 움직이던 문제): 지상 시전은 `StateComponent` 를 `IDLE` 로 보낸 뒤 `Enable=false`, 해제 시 `Enable=true`(`stateDisabled` 로 이 시전이 끈 경우만). casting.md 원칙 2·7. 상태기가 입력을 보고 MOVE 로 가 걷기 애니메이션을 밀어넣는 게 원인이라 `InputSpeed=0`·액션 조건만으로는 부족했다. 공격 모션은 A 의 `PlayerMotion`(`WeaponMotion.csv` 완드 기본 `swingO1`)이 그 위에 재생.
- 근거: `.claude/skills/maplestory-skill-maker/references/player/casting.md` 원칙 1·3·4·6·8·9 를 축소 적용. 서버는 클라 `InputSpeed`/`FixedLookAt` 을 쓰지 않는다(소유자 분리). 레퍼런스가 권하는 `PlayerControllerComponent` 서브클래스 교체는 `Global/DefaultPlayer.model`(A) 변경이라 미적용 → `AddCondition` 사용. `StateComponent` 미변경(모션은 A 의 PlayerMotion).
- 🟡 런타임 미검증 항목: `AddCondition` 액션 이름 `"Jump"`/`"DownJump"`, `RigidbodyComponent:IsOnGround()` 지상 판정, `FixedLookAt` 클라 쓰기.

### 검증
- `node Docs/tools/check-integrity.cjs` — 통과(스크립트만 변경).
- Maker 런타임: 🟡 **미검증** — Refresh 후 Play 에서 좌/우 시전, 로그 `SkillExecutors: cast effect SK_M11 attached, facing=1 flipX=true` / `facing=-1 flipX=false` 확인 필요. 빌드 경고 수 N → N 을 PR 본문에 기록.
