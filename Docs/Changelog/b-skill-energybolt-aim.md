# b/skill-energybolt-aim

## 2026-09-24 — 에너지볼트(`SK_M11`) 조준점을 #56 이전으로 되돌림

PR #82 · 사용자 요청 2026-09-23 "에너지볼트만 예전 곡선 궤적으로 돌려 달라".

**헤더 변경 없음 · 새 CSV 열 없음 · 새 이벤트 없음 · 새 RPC 없음.** `Docs/스키마-계약.md` 는 건드리지 않았다.

### 무엇이 바뀌었나

`Skill/SkillProjectile.AimPointOf` 에 `SK_M11` 한 줄 예외를 넣었다 (+5/−0, 파일 1개).

- `SK_M11` → **발 + 0.5**(= 손 높이 · CSV `SpawnOffsetY`). #56(`d8cfc69`) 이전 조준점이다.
- 그 외 전부 → #56 그대로 **대상 `HitComponent` 콜라이더 중심**.

`AimPointOf` 는 유도(`AimAtTarget`)와 명중 이펙트 위치(`OnAttack`) 둘 다가 쓰므로, `SK_M11` 의 hit 클립 위치도
#56 이전(발 + 0.5)으로 같이 돌아간다. 스폰 호출부는 건드리지 않았다 — 투사체가 이미 `SkillId` 를 들고 있고
(`SkillProjectile.mlua:50`), `SkillAttack.SpawnOneProjectile` 이 `SetTarget` **앞에서** 그 값을 채운다.

### `515853e`(#56 이전) ↔ `main` 차이 전수 대조 — `SK_M11` 비행 경로

| 차이 | 복구 |
|---|:--:|
| `AimAtTarget` 이 `AimPointOf()`(콜라이더 중심) 사용 (`SkillProjectile.mlua:158`) | ✅ |
| `TargetAimOffsetY` 기본값 `0.5 → 0.3` (`:35`) | ✅ (예외가 0.5 를 직접 돌려주므로 프로퍼티와 무관) |
| 조준 **대상 선택**: `SpawnProjectile` 이 `floorY` 를 넘겨 아래층 몬스터를 후보에서 뺀다 | ❌ — b/skill-thief-motion 의 "2층에서 아래층 몬스터를 맞혔다" 수정. 곡선과 무관하고 되돌리면 그 버그가 살아난다 |
| `SameFloorOnly`/`FloorY`/`FloorTolerance` + `IsAttackTarget` 오버라이드(명중 필터) | ❌ — 같은 이유 |
| `OnAttack` 명중 이펙트 위치 (발 + 0.5 → 조준점) | ✅ 부수 효과 — `SK_M11` 의 조준점이 다시 발 + 0.5 라 예전 자리 |
| `OnAttack` hit 사운드 · 픽파켓 훅 추가 | ❌ 불필요 — `SK_M11` 은 `extraSounds` 행이 없어 `HitSoundRUID` 가 빈 문자열 |
| `CalcDamage × DamageMul` · `GetDisplayHitCount` ← `DisplayHits` · `VisualOnly` 볼리 | ❌ 불필요 — `SK_M11` 은 `HitCount 1` 이라 셋 다 항등 |
| `CalcCritical` GUARANTEED_CRIT · `GetCriticalDamageRate 2.0` | ❌ 불필요 — 닷지(SK_A22) 버프에서만 동작 |
| `FollowTarget` 분기 | ❌ 불필요 — `SK_M11` 은 설정하지 않는다 |

**차이 없음(되돌릴 것 없음)**: CSV `Speed 8` · `SpawnOffsetY 0.5` · `Range 3`, 수명 `range/speed × HomingLifetimeMul 1.5`,
`ProjectileSpawnOffsetX 0.5` · `AimSearchHeight 2.5` · `DefaultProjectileSpeed 8`, `OnUpdate` 의 매 프레임 재조준,
`ProjectileModelId "skillprojectile"` 과 그 모델(= 원작 ball 스프라이트), `SK_M11` 의 cast/impact RUID, 선딜 없음.

### Play 검증 (2026-09-24 · Maker MCP · `Orbis_Lobby_VictoriaStation`)

**빌드 경고: 1 → 1** (`LWA-1111` 기존 1건 · 에러 0). `stop → clear_logs → refresh → logs(build) → play` 순서.
측정은 서버 컨텍스트 타이머로 투사체 `WorldPosition` 을 매 프레임 로그로 찍어 경로를 수치로 떴다.
대상은 정지시킨 달팽이(발 `y=-1.429` · `ColliderOffset.y=0.14`), 시전자 발도 같은 `y`, 스폰 높이 `y=-0.929`(발 + 0.5).

| 스킬 | 기대 | 실측 경로 | 결과 |
|---|---|---|---|
| `SK_M11` (예외 적용) | 발 + 0.5 = `-0.929` 유지 | `spawnY=-0.929` → `y=-0.929` 고정 (x 만 진행) · 명중(달팽이 105 피해) | ✅ |
| `SK_A11` 더블 샷 | 콜라이더 중심 = `-1.289` | `-0.929 → -1.002 → -1.074 → -1.146 → -1.218 → -1.293` | ✅ 그대로 |
| `SK_T11` 럭키 세븐 | 콜라이더 중심 = `-1.289` | `spawnY=-1.339`(자체 `spawn.offsetY 0.09`) → `-1.290` 수렴 | ✅ 그대로 |

`SK_A11`/`SK_T11` 이 콜라이더 중심으로 빨려 들어가는 동안 `SK_M11` 만 손 높이를 유지한다 —
예외가 스킬 단위로만 걸렸다는 직접 증거다.

🔴 **평지·같은 층에서는 "곡선" 이 아니라 수평선이다.** 스폰 높이(발 + 0.5)와 조준점(발 + 0.5)이 같은 값이라
같은 발판 위 몬스터를 쏘면 경로가 정확히 수평이다. #56 판은 조준점이 0.2~0.36 낮아 **아래로 기우는** 직선이었다.
즉 이번 복구로 분명히 달라지긴 하지만(기운 직선 → 수평선), 눈에 띄는 호는 대상의 조준점 높이가 손 높이와 다를 때
— 경사 발판·다른 층·점프 중인 몹 — 나온다. 로비 평지에서 주황버섯(점프형)으로도 재현을 시도했으나
표본 구간에서 몹이 실제로 뜨지 않아 수평선만 나왔다. 사냥 맵(경사 발판)에서 눈으로 한 번 더 보는 것을 권한다.

### 건드리지 않은 것

- `Skill/` 밖 전부 (A 폴더)
- `Skill/SkillExecutors.mlua` · `Skill/SkillAttack.mlua` — 스폰 호출부 변경 불필요(투사체가 `SkillId` 를 이미 안다)
- `SkillInfo.csv` · `.userdataset` · `Docs/스키마-계약.md`
- `.codeblock` — 기존 메서드 본문만 고쳐 재생성 불필요
