# b/playerattack-ranged-basic — 원거리 기본 공격 (궁수 활 · 도적 아대)

## 2026-10-01 (로컬 · push 전)

근거: A #40 5884389166 "넣는다 — 기본 공격을 원거리로. 궁수(활) = 일반 화살, 도적(아대) = 수비 표창 투사체 … 스킬 투사체 재사용 방식 OK … 사거리 · 투사체 속도는 … B 기본값으로 넣고 PR 본문에 적어 달라".
기반: **#115 위에 쌓은 Draft PR**(base `b/skill-thief-effects` · #115 `8302dd7` 병합 `69aabea`) + #134(`685e939` 무기별 기본 공격 소리) 병합 — #134 가 main 에 머지될 때까지 이 PR diff 에 #134 변경이 같이 보인다. #115 · #134 가 머지되면 main 을 병합한다.

| 항목 | 예전 | 지금 |
|---|---|---|
| 활 · 아대 기본 공격 | 근접 상자(앞 0.5 · 1×1) 최근접 1마리 | 투사체 — 앞쪽 사거리 상자 안 같은 층 최근접을 조준(스킬 투사체와 같은 유도) · 1발 1마리 |
| 그 밖의 무기 · 맨손 | 근접 | 그대로 |
| 피해 · MISS · 크리 · 버프 | `PlayerAttack.CalcDamage / CalcCritical` | 같은 함수 — 투사체가 명중 순간 시전자의 `PlayerAttack` 에 넘긴다(쉐도우 파트너 · 매직 가드 · 픽파켓(명중만 · 1개) · 닷지 확정 크리 그대로) |
| 무기 소리(#134) · 모션 · 분신 따라하기 · 다크 사이트 훅 | 근접에서 | 근접 · 원거리 둘 다(분기 앞에서 이미 난다) |
| 처치 귀속(#123) | 플레이어 | 투사체 `CasterUserId` = 시전자 |

B 기본값(한 표 `PlayerAttack.BuildRangedBasic`) — **A 답 #40 5927315886(2026-10-01): "Q1~Q6 전부 B 기본값 OK"** — 근접과 같은 공식 · 한 발에 1마리 · 탄약 소모 없음 · 분신은 동작 + 배율만 · 공격 속도 같음. 값 변경 없음:

| 무기 | 그림 | 사거리 | 속도 | 발사 시점 | 스폰(앞 · 위) | 대상 | 배율 |
|---|---|---|---|---|---|---|---|
| BOW | `2ddccada…` = item/consume/0206.img **02060003/bullet** 활전용 화살(44×16 · 02060000 기본 화살의 bullet 은 라이브러리 색인에 없다) | 5 | 12 | +0.2s 🟡 | 0.5 · 0.5 | 1 | 1 |
| CLAW | `551dec3d…` = item/consume/0207.img **02070000/bullet** 수비 표창(18×20 · 럭키 세븐 표창과 같은 그림) | 4 | 6 | +0.15s 🟡 | 0.5 · 0.4 | 1 | 1 |

- 탄약 소모 없음(Q3) · 분신은 동작 + 피해 배율만(Q4) · 공격 속도 근접과 같음(Q5). 명중 이펙트 · 소리 없음(5916267220 대기).
- 파일(전부 B): `PlayerAttack.mlua`(`RangedBasic` · `BuildRangedBasic` · `TryRangedBasic` · `AttackNormal` 분기 한 곳) · `Skill/SkillAttack.mlua`(`SpawnBasicProjectile` · `FireBasicProjectile`) · `Skill/SkillProjectile.mlua`(`BasicAttack` · `CalcDamage` / `CalcCritical` 분기 · `OnAttack` 픽파켓 건너뜀 · `CasterEntity` / `CasterPlayerAttack`).
- 로그: `SkillAttack: basic projectile BOW target=… range=5 speed=12 lifetime=… single=true mul=1 spawn=(…) dir=±1 (<uid>)` · 명중은 기존 `[PlayerAttack] buff dmg …`(버프 있을 때) · `[Buff] PICKPOCKET +1 coin … skill=BASIC`.
- 검증(코드만): LSP `PlayerAttack` · `SkillProjectile` 깨끗 · `SkillAttack` 에러 0 · 경고 0(info 15 = #100 의 SpawnOneProjectile 줄 · 예전부터) · `check-integrity` 통과.

### Play 확인
1. 활 Ctrl: 화살이 앞으로 날아가 가장 가까운 한 마리만 맞는다 · 5 u 밖은 안 맞고 사라진다 · 뒤 · 아래층은 조준 안 함 · 로그 `basic projectile BOW …`.
2. 아대 Ctrl: 수비 표창 · 4 u · 느린 속도.
3. 검 · 단검 · 완드 · 너클 · 맨손: 예전 근접 그대로(`basic projectile` 줄 없음).
4. MISS(레벨 높은 몹): 피해 0 · 픽파켓 동전 없음 / 명중: 동전 1개(2개 아님).
5. 쉐도우 파트너 ×1.5 · 매직 가드 추가 피해 · 닷지 확정 크리가 원거리에도.
6. 원거리 막타 → `[FarmReward] … lasthit=<uid>`.
7. 무기 소리(#134) 활 `4346b64f` · 아대 `c295ef20` 한 발에 한 번.
8. 발사 시점: shoot1 / swingO3 손을 놓는 프레임과 화살 · 표창 스폰이 맞는지(0.2 / 0.15 조정).
9. 빌드 경고 N → N.

## 2026-10-05 (로컬 · push 전) — 활 · 아대 Ctrl 이 휘두르기로 나오던 버그

**증상(런타임 프로브로 확인)**: 활을 끼고 Ctrl 을 누르면 활을 휘두른다. 한 번 누를 때 클라 body 가 받은 순서 — t0 엔진 ATTACK 모션(`AvatarStateAnimationComponent` 매핑 ATTACK → `"attack"` · PlayRate 1.33 · 활이면 엔진이 swingT1/swingT3/shoot1 중 하나를 고른다) → +0.02s 우리 `shoot1`(`_PlayerMotion:PlayAttack` → `PlayAction` Client RPC) → +0.58 alert → +0.9 stand1. 엔진이 ATTACK 상태 동안 자기 모션을 계속 다시 밀어넣어 휘두르기가 이긴다. 아대도 같은 충돌(표 `swingO3` vs 엔진 한손 휘두르기/찌르기).

**고침(`PlayerAttack.mlua` 만 · msw-avatar 전략 A)**: 장착 무기가 `EngineAttackMotionOff`(BOW · CLAW)에 있으면 **서버에서** `AvatarStateAnimationComponent:RemoveActionSheet("ATTACK")` 로 매핑을 걷어내 표(WeaponMotion.csv) 모션만 남긴다. 그 밖의 무기(검 SWORD_1H/2H · 완드 · 맨손 …)로 바꾸면 걷어내기 전에 저장해 둔 처음 원소(`"attack"` · 1.33)를 `StateToAvatarBodyActionSheet:Add("ATTACK", AvatarBodyActionElement(…))` 로 되돌린다(`SetActionSheet` 는 PlayRate 를 못 받아 안 씀).
- 부르는 곳: `OnBeginPlay` · `HandleEquipChangedEvent`(`@EventSender("Logic", "EquipService")` · WEAPON 슬롯 · 자기 UserId 만 — 무기 바꾼 뒤 첫 Ctrl 부터) · `AttackNormal` 첫 줄(안전망). 상태(`AttackSheetState` "" / ON / OFF)가 같으면 아무것도 안 한다.
- 검 · 완드는 지금과 똑같다(엔진 ATTACK 모션 + 표 행). `PlayerMotion.mlua`(A) 는 건드리지 않았다.
- 로그: `[PlayerAttack] ATTACK motion sheet -> off (BOW) saved=attack x1.33 (<uid>)` · `[PlayerAttack] ATTACK motion sheet -> restored (SWORD_1H) attack x1.33 (<uid>)`(맨손이면 `(맨손)`).
- 검증(코드만): LSP `PlayerAttack.mlua` 깨끗 · `check-integrity` 통과(경고 3 = 예전부터).
- 남은 틈: 매치 리셋(`EquipService.ResetMatchState`)은 `EquipChangedEvent` 를 안 내서, 활을 낀 채 리셋되면 다음 Ctrl 한 번은 걷어낸 채로 시작하고 그 Ctrl 에서 되돌린다(맨손 = 엔진도 alert 라 눈에 거의 안 띈다).

### Play 확인 (대기)
1. 활 Ctrl: `shoot1` 만(휘두르기 없음) · 로그 `-> off (BOW)` 한 번.
2. 아대 Ctrl: `swingO3` 만 · `-> off (CLAW)`.
3. 활 → 검 · 완드로 바꾼 뒤 Ctrl: 예전 그대로(엔진 ATTACK 모션 + 표 행) · 로그 `-> restored (SWORD_1H)` 등.
4. 걷어낸 뒤 alert · stand1 복귀가 그대로인지(ATTACK_WAIT · IDLE 매핑은 안 건드림).
5. 다른 유저 화면에서도 같은지(`StateToAvatarBodyActionSheet` @Sync).
