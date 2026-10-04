# b/skill-raging-blow-flame-haze

## 2026-10-02 — 레이징 블로우(불굴의 진 중 파워 스트라이크 키) · 플레임 헤이즈(매직 가드 중 에너지볼트 키) · 매직 가드 추가 피해 5 → 2.5 %

출처: A 인계 페이지 "레이징 블로우 · 플레임 헤이즈"(HUD 쪽 = A #155 `a/hud-icon-repaint`, main 에 머지됨). **값은 사용자 결정(2026-10-02)** 이고, 인계 페이지와 다른 곳은 사용자 값을 따랐다(아래 "인계 페이지와 다른 값").
기반: `828d5a4`(#116 로컬 = main + #115 + #100 · #100 의 에너지볼트 폭발 투사체가 필요).

### 결정 (사용자 2026-10-02)

| | 레이징 블로우 | 플레임 헤이즈 |
|---|---|---|
| 조건 | 불굴의 진(SK_W31 · 8 s) 동안 파워 스트라이크(SK_W11) 키 | 매직 가드(SK_M22 · 45 s) 동안 에너지볼트(SK_M11) 키 |
| 레벨 | 파워 스트라이크 레벨 | 에너지볼트 레벨 |
| 원작 팩 | `skill/112.img/skill/1120017`(1121008 아님) | `skill/212.img/skill/2121011` |
| 피해 | 4타 · 타마다 파워 스트라이크 % × 0.8 (Lv1 120 % × 4 … Lv5 240 % × 4) · 4타 모두 같은 대상 · 넉백/경직 한 번 | 에너지볼트 % × 2 · 1타 (Lv1 280 % … Lv5 440 %) |
| 대상 · 범위 | 최대 6 · 앞 3.5 × 높이 2.5 | 최대 10 · 첫 대상 둘레 3.5 × 2 (#100 폭발 투사체 재사용) |
| 크리 | 다른 스킬과 같은 판정(마지막 2타 확정 크리 없음) | 같음 |
| MP · 쿨 · 시전 락 | 10 · 0 · 동작 길이(원작 780 ms → 0.78) | 에너지볼트와 같음 · 0 · 0.4 |
| 화상 · 둔화 | — | 없음 |
| 동작 | `ragingBlowNew` → `New2` → `New3` → `New4` 순서 | `flameHaze` |
| 소리 | Hit `aa92fddf…`(시전당 한 번 · 시전음 없음) | Use `888da667…` · Hit `6adfe5a7…`(폭발 한 번에 한 번) |

- 슬롯의 스킬 ID 는 그대로(SK_W11 · SK_M11). 버프 동안 `SkillDatabase:GetSkill(id).icon` 이 새 아이콘(레이징 블로우 `644fc39b…` · 플레임 헤이즈 `b16f2dee…`)을 돌려주고, 버프가 끝나면(만료 · 매치 리셋 · 죽음) 원래 아이콘과 원래 스킬로 돌아간다. A #155 가 0.1 s 안에 다시 그린다.
- **매직 가드** `SkillInfo.csv` SK_M22 `SecondaryEffect` 5 → **2.5**(공격 시 현재 MP % 추가 피해). 설명 문구 "현재 MP의 5%만큼" → "2.5%만큼" · `#Note` 도 같이 고쳤다. 헤더 · 열 변경 없음.

### B 가 고른 것

- **새 스킬 ID 는 만들지 않았다.** 변형 키 `SK_W11_RB` · `SK_M11_FH` 는 코드 안의 키일 뿐(시전 락 · 동작 · 그림 · 소리 표의 열쇠)이고 `SkillInfo.csv` 행 · 스킬창 · 레벨 · SP 가 없다. 피해 태그 · 쿨타임 · 레벨 · 처치 귀속은 원래 ID(SK_W11 · SK_M11) 그대로다. 시전 로그에는 `variant=SK_W11_RB` 로 남는다.
- 변형 시전은 원래 스킬의 쿨타임을 걸지 않는다(둘 다 원래 쿨 0 이라 지금은 차이 없음).
- 죽어 있으면 변형이 안 나간다(사용자 2026-10-02: 당분간 유지 · 버프가 죽음에 끝나야 하는지는 #40 에 질문). 버프는 죽어도 남아 있어서 — `SkillBuffs` 는 죽음에 버프를 지우지 않는다 · 매치 리셋에만). 버프가 남은 채 부활하면 다시 변형이 된다. 아이콘도 같은 규칙. → **2026-10-04 결정: 죽으면 버프가 끝난다**(A #40 5977727869 · 원작과 같음) — `EndBuffsOnDeath = true`(아래 2026-10-04 절).
- 원작 동작(`ragingBlowNew` · `flameHaze`)을 MSW 아바타가 재생하는지 확인되지 않았다 → 서버 속성 `SkillExecutors.VariantOwnMotion`(기본 true). Play 에서 동작이 안 나오면 false 로 바꾸면 원래 스킬 모션(파워 스트라이크 · 에너지볼트)으로 돌아간다.

### 수정

- `RootDesk/MyDesk/Skill/SkillBuffs.mlua`
  - `VariantSpec(skillId)`: 변형 표(키 · 원래 ID · 버프 태그 · 이름 · 아이콘 · MP(−1 = 원래 스킬 그대로) · 쿨).
  - `VariantOf(userId, skillId)`(서버) · `LocalVariantOf(skillId)`(클라): 버프 활성 + 살아 있음 → 변형 키, 아니면 "".
  - 클라 `OnUpdate` → 0.1 s 마다 `ApplyVariantIcon("SK_W11" / "SK_M11")`: `GetSkill(id).icon` 을 바꾸고 원래 값을 기억했다가 버프가 끝나면 되돌린다. 로그 `[Buff] icon swap <id> -> <ruid 8자> (<이름> on|off)`.
- `RootDesk/MyDesk/Skill/SkillCaster.mlua` — 클라 예측(`Cast`)과 서버(`RequestCast`) 둘 다: 변형이면 쿨타임 검사 건너뜀 · MP = 변형 MP(레이징 블로우 10 · 매직 가드의 MP ×1.5 는 그대로 곱해진다) · 시전 락 키 = 변형 키 · 쿨타임 = 변형 쿨(0) · 모션 = 변형 키. `castLockOverrides` 에 `SK_W11_RB = 0.78`, `SK_M11_FH = 0.4`. 로그 `variant=`.
- `RootDesk/MyDesk/Skill/SkillExecutors.mlua`
  - `Execute`: 변형이면 `ExecuteRagingBlow` / `ExecuteFlameHaze` 만 돈다.
  - `PlayMotion` → 변형 키면 `PlayVariantMotion`(유저별 순번 New → New4 · `VariantOwnMotion`).
  - `ExecuteRagingBlow`: 시전 그림 + 순번 베기 그림(New..New4 짝) → `hitAt`(0.12 s · 임시값) 뒤 상자 판정, 순번 명중 그림을 대상마다 4번(0.08 s 간격), 맞은 대상이 있으면 명중음 한 번.
  - `ExecuteFlameHaze`: 시전 그림 + Use 소리 → 에너지볼트 자리에서 플레임 헤이즈 구체 발사(피해 × 2 · 폭발 3.5 × 2 · 최대 10 · 명중 그림 hit/0 `9f78110b…` · 불꽃 5종).
  - `PlayAttachedSpec`(시전자에 붙여 한 번 · 오른쪽을 보면 FlipX) · `effectOverrides.SK_W11_RB` / `SK_M11_FH` · `castSounds.SK_M11_FH` · `extraSounds.SK_W11_RB` / `SK_M11_FH`.
- `RootDesk/MyDesk/Skill/SkillAttack.mlua`
  - `DealSkillDamageScaled(skillId, level, shape, mul, displayHits)`: `DealSkillDamage` 와 같은 상자 판정에 배율 · 표시 타수만 받는다(판정 1번 = 넉백/경직 1번 · 숫자 4개). 반환 = 맞은 수.
  - `PendingProjectileDamageMul` · `PendingProjectileExtraHitCsv`: 다음 `SpawnProjectile` 한 번에만 쓰고 바로 비운다(다른 스킬로 새지 않게). 배율은 투사체의 `BaseDamageMul` 로 간다.
- `RootDesk/MyDesk/Skill/SkillProjectile.mlua` — `ExtraHitEffectCsv`: 맞은 자리마다 불꽃 그림을 하나씩 돌려 튼다(연출만). `BaseDamageMul`: `CalcDamage` 가 `DamageAt` 에서 매직 가드 추가 피해를 뺀 몫에만 곱하고 추가 피해를 다시 더한다.
- `RootDesk/MyDesk/SkillInfo.csv` — SK_M22 `SecondaryEffect` 2.5 · 설명 · `#Note`.

### 피해 계산 메모

- 레이징 블로우 = 판정 1번 × 배율 3.2(= 4 × 0.8) × 표시 4타 → 타마다 파워 스트라이크 % × 0.8. 크리는 이 한 판정에서 굴린다(지금 스킬엔 무작위 크리가 없다 — 회피 확정 크리만 있다).
- 플레임 헤이즈 × 2 는 **스킬 자체 피해에만** 곱한다(`SkillProjectile.BaseDamageMul` · 매직 가드 추가 피해 = 현재 MP 2.5 % 는 배율 밖 · 사용자 2026-10-02: A 인계 "플레임 헤이즈 2배 대신 매직 가드 추가 피해 2.5 %" 라 플레임 헤이즈에서도 2.5 % 그대로). 로그 `SkillProjectile: SK_M11 base x2 (bonus N kept) A -> B`.
- 플레임 헤이즈 명중 그림 위치는 에너지볼트의 `impact.offsetY 0.20` 을 그대로 쓴다(스폰 스킬 ID 가 SK_M11).

### 인계 페이지와 다른 값 (사용자 값을 따름)

| 항목 | 인계 페이지 | 이 브랜치(사용자 결정) |
|---|---|---|
| 레이징 블로우 마지막 2타 | 확정 크리 | 일반 판정 |
| 레이징 블로우 시전 락 | 0.8 | 동작 길이 0.78 |
| 플레임 헤이즈 MP · 쿨 | 70 · 10 s | 에너지볼트와 같음 · 0 |
| 플레임 헤이즈 화상 · 둔화 | 있음 | 없음 |

### 툴팁 (보류 — 사용자가 나중에 정한다 · 코드엔 넣지 않았다)

- 파워 스트라이크: 끝에 "불굴의 진 동안 레이징 블로우(파워 스트라이크 %의 80 % × 4타 · 최대 6명 · MP 10)로 바뀐다."
- 에너지볼트: 끝에 "매직 가드 동안 플레임 헤이즈(에너지볼트 %의 2배 · 주변 최대 10명)로 바뀐다."
- 아니면 버프 쪽(불굴의 진 · 매직 가드)에 "지속 중 파워 스트라이크 → 레이징 블로우" 한 줄. 어느 쪽이든 문구는 사용자/기획이 정한다.

### 점검

- mLua 진단: 바꾼 5개 스크립트 errors 0 · warnings 0 (SkillCaster `EnsureShape` · SkillBuffs `DealFlatDamageToTarget` info 2건은 `828d5a4` 에 원래 있던 것).
- `node Docs/tools/check-integrity.cjs` 전부 통과(경고 3건 = main 과 같음).
- 줄 끝: CRLF 파일(SkillExecutors · SkillAttack · SkillProjectile · SkillInfo.csv BOM) · LF 파일(SkillCaster · SkillBuffs) 그대로.

### Play 확인 (아직 안 함 · 캡처 없음 — 스킬 PR 규칙)

1. 불굴의 진 → 파워 스트라이크 키: 로그 `variant=SK_W11_RB` · `RAGING BLOW lv=` · 숫자 4개 · 6명 넘게 모여 있을 때 6명만 · 넉백 한 번 · 명중음 한 번(몬스터 수와 무관).
2. 같은 버프 중 연속 시전: 동작 New → New2 → New3 → New4 → New 순서 · 베기 그림이 동작과 짝. 동작이 안 나오면(아바타가 액션을 모름) `VariantOwnMotion = false` 로 바꾸고 다시 본다.
3. `hitAt 0.12` 가 베기 그림 · 동작과 맞는지(맞춰야 할 숫자). 시전 락 0.78 동안 다른 스킬이 안 나가는지.
4. MP 10 이 빠지는지(Lv 무관) · 쿨 표시가 생기지 않는지.
5. 매직 가드 → 에너지볼트 키: `variant=SK_M11_FH` · `FLAME HAZE` · 첫 대상 둘레 10명까지 · 스킬 몫이 에너지볼트의 2배이고 매직 가드 추가 피해는 그대로(`base x2 (bonus N kept)` 로그의 N = 현재 MP × 2.5 %) · 불꽃 그림 · Use 한 번 · Hit 한 번.
6. 플레임 헤이즈 구체가 키 누름 즉시 나가는 게 어색하면 `effectOverrides.SK_M11_FH.spawnDelay` 를 맞춘다(에너지볼트는 0.50).
7. 아이콘: 버프 켜면 0.1 s 안에 HUD 슬롯이 새 아이콘(`[SkillHud] icon swap …` · `[Buff] icon swap … on`) · 만료 · 매치 리셋 때 원래 아이콘(`… off`). 죽은 동안은 원래 아이콘, 버프가 남은 채 부활하면 다시 새 아이콘(스위치를 끈 경우 · 2026-10-04 기본 켬이면 죽을 때 버프와 같이 꺼진다 = 10번).
8. 매직 가드 추가 피해가 현재 MP 2.5 % 인지(에너지볼트 · 다른 스킬 · 툴팁 "2.5%").
9. 버프 없이: 파워 스트라이크 · 에너지볼트가 예전 그대로(변형 로그 `variant=-`).

## 2026-10-03 — 죽으면 버프 끝 스위치 (~~기본 꺼짐 · #40 5949256804 답 대기~~ → 2026-10-04 기본 켬 · A #40 5977727869)

- `SkillBuffs.EndBuffsOnDeath`(~~기본 **false** = 지금처럼 죽어도 버프가 남는다. A 가 "죽으면 끝" 이라고 답하면 이 값만 true 로 바꾼다.~~ → 2026-10-04 기본 **true** · 아래 2026-10-04 절).
- 켜져 있으면 서버 타이머(`DeathCheckInterval` 0.25 s · 스위치는 틱마다 본다 → 서버 Lua 로 켜고 끄면 바로 따른다)가 버프가 남은 유저 중 죽은(HP 0 · `IsDead`) 유저의 **B 버프 전부**(불굴의 진 · 매직 가드 · 하이퍼 바디 · 다크 사이트 · 쉐도우 파트너 · 에너지 쉴드 · 에너지 차지 · 닷지 확정 크리 …)를 보통 끝내기(`EndBuffNow` · 만료와 같은 태그별 처리 · 루프 이펙트 제거 · 미러 갱신)로 끝내고 궁 시전 무적 창도 지운다 — `EndAllBuffsOnDeath` · 로그 `[Buff] death -> ended N buff(s) [태그…]` · 태그마다 `[Buff] OFF <태그> (death)`.
- 레이징 블로우 · 플레임 헤이즈 변형과 슬롯 아이콘은 버프가 있을 때만 있으므로 같이 끝난다(변형의 "살아 있을 때만" 검사는 그대로 둔다 — 스위치가 꺼져 있을 때를 위해).
- 에너지 차지 쿨다운은 만료와 같은 규칙(`EndChargeState`)을 따른다.
- 점검: `SkillBuffs` 0 errors · 0 warnings(info 1 = 예전부터) · `check-integrity` 통과(경고 3).

### Play 체크 (스위치 켜고)

10. 기본값 그대로(`EndBuffsOnDeath = true` · 2026-10-04 부터 서버 Lua 로 켤 필요 없음) → 전사 R(불굴의 진) · 마법사 E(매직 가드) 각각 켠 채 죽기(서버 Lua 로 HP 0 · 또는 몬스터) → `[Buff] OFF INVULNERABLE (death)` / `OFF MAGIC_GUARD (death)` · `[Buff] death -> ended 1 buff(s) [...]` · `[Buff] icon swap SK_W11 -> … (레이징 블로우 off)` / `SK_M11 … (플레임 헤이즈 off)` · HUD 아이콘 원래대로 · 부활 뒤 Q = 보통 파워 스트라이크 / 에너지볼트(`variant=-`) · 버프 루프 이펙트 사라짐.
11. 스위치 끈 채(서버 Lua `_SkillBuffs.EndBuffsOnDeath = false` · 2026-10-04 전까지의 기본) 같은 것 → 버프가 남고(`death -> ended` 줄 없음) · 죽은 동안 변형 안 나감 · 버프가 남은 채 부활하면 변형 · 아이콘 다시 켜짐.

## 2026-10-03 — 툴팁 안 A (따로 커밋 `2443047` · ~~사용자가 고른다~~ → 2026-10-04 사용자 확정)

- 안 A(`villagedefense-harness/pirate-check/pr-drafts/tooltips-rbfh.md`): 공격 스킬 설명에 한 줄.
  - SK_W11 파워 스트라이크: "… 불굴의 진 지속 중에는 레이징 블로우가 된다: 파워 스트라이크 데미지의 80%로 4번 · 앞쪽 최대 6명 · MP 10."
  - SK_M11 에너지볼트: "… 매직 가드 지속 중에는 플레임 헤이즈가 된다: 데미지 2배 · 맞은 자리 주변 최대 10명."
- `SkillInfo.csv` Description 2칸만(헤더 · 다른 열 그대로 · 쉼표 없음). 코드 변경 없음. 상대 수치라 모든 레벨에서 맞다.
- ~~다른 안을 고르면 이 커밋을 되돌리는 커밋을 하나 더 한다(되쓰기 없음).~~ → 안 A 확정(2026-10-04) · 되돌리지 않는다.
- ⚠ **#135(전사 쿨타임 · Draft)도 SK_W11 행을 고친다** → `merge=union` 이 SK_W11 을 두 줄 남긴다(시험 합침으로 확인 2026-10-03 · git 은 안 알려 준다 · C3 실패). 둘 중 나중에 머지되는 쪽에서 한 줄로: #135 의 Cooldown 0 + 이 설명.

### Play 체크 (안 A)

12. K → 파워 스트라이크 · 에너지볼트 툴팁에 새 줄 · 줄바꿈 · 툴팁 칸 크기가 넘치지 않는다(*Look*).

## 2026-10-04 — 죽으면 버프 끝 켬 · 툴팁 안 A 확정

- A #40 5977727869: "죽으면 버프가 끝난다(원작과 같음)". 사용자 결정 → `SkillBuffs.EndBuffsOnDeath` 기본 **true**(값 한 줄 + 주석). 동작 코드는 2026-10-03 그대로. 끄려면 서버 Lua `_SkillBuffs.EndBuffsOnDeath = false`.
- 툴팁 안 A(`2443047` · SK_W11 · SK_M11 설명 한 줄) 사용자 확정 — 되돌리지 않는다.
- Play 체크는 위 10 · 11 · 12 그대로(10 은 이제 기본값으로 본다). 아직 안 함.

## 2026-10-05 — 레이징 블로우 외형 = 후보 E (원작 몸 동작 11프레임 · 베기/시전 캐릭터 뒤 · 첫 피해 +0.28 s · 크기 1.0)

- 2026-10-04 Play 에서 확인: `ragingBlowNew` ~ `New4` 는 이 엔진에서 재생되지 않는다(에러 없이 몸이 서 있음 · New2 ~ New4 는 원작 KMS 359 에도 없음). 위 2026-10-02 표의 "동작" 칸 · Play 체크 2 · 3 은 이 절로 바뀐다.
- 후보 키트(`villagedefense-harness/pirate-check/prbv_server.lua` · `prbv_client.lua`)의 **E** 를 그대로 옮겼다. 다른 스킬 · 플레임 헤이즈는 안 건드렸다.
- `RootDesk/MyDesk/Skill/SkillExecutors.mlua`
  - `effectOverrides.SK_W11_RB`: `motions` 제거 → `bodyFrames`(원작 `Character/00002000.img/ragingBlowNew` 11프레임 = swingT3 0 · 1 · 2 · swingT1 1 · swingTF 3 · swingT3 1 · 2 · stabOF 0 · 2 · 2 · 2 · 120/60/60/120/60/60/60/60/60/60/60 ms = 0.78 s) · `bodyEnd1H` / `bodyEnd2H` = stand1 · 시전 · 베기 4종에 `scale = 1.0` · `sortBehind = true` · `hitAt` 0.12 → **0.28**.
  - `PlayVariantMotion`: `VariantOwnMotion`(기본 true 그대로)이고 `bodyFrames` 가 있으면 시전자 클라로 `PlayBodyFrames` · 순번 개수 = 베기 개수(예전과 같은 4). 플레임 헤이즈는 예전 경로(`motions` = flameHaze).
  - `PlayBodyFrames`(Client · 새로): 프레임마다 body 에 `ActionStateChangedEvent(액션, 액션, 1, Loop, f, f)` · 0.78 s 뒤 서 있기 · 새 순서가 오면 이전 타이머를 지운다. 로그 `SkillExecutors: body frames x11 · 0.78 s · end stand1 (1H|2H)`.
  - `PlayAttachedSpec`: spec 의 `sortBehind` 면 `ApplyShadowSorting`(플레이어 Default / 4 − 1 층) — 키트 E 의 "cast/slash behind" 와 같은 옵션(FlipX = 오른쪽을 보면 · 위치 0 · 크기 1.0).
- 키트와 다른 한 곳: 키트는 두손이면 끝 서 있기 stand2 였다. 이 월드 두손검 아바타는 stand2 에서 대검을 안 그려서(#94 · WeaponMotion `*_END_SWORD_2H` = stand1) 둘 다 stand1. 키트대로 하려면 `bodyEnd2H = "stand2"` 한 단어.
- 점검: `node Docs/tools/check-integrity.cjs` · LSP 는 커밋 메시지/PR 참고. **Play 안 함 · 캡처 없음** — 외형은 사용자 픽(RUN-NEXT B3) 뒤에 본다.

### Play 체크 (후보 E)

13. 불굴의 진 → Q(한손 · 두손 · 양쪽 방향): 몸이 원작처럼 11프레임으로 움직이고 0.78 s 뒤 서 있기(두손이면 대검이 보이는지) · 시전 · 베기가 캐릭터 **뒤** · 숫자가 키 +0.28 s 쯤 · 로그 `variant motion SK_W11_RB -> body frames x11` · `body frames x11 · 0.78 s` · `RAGING BLOW … hitAt=0.28`.
14. 연속 시전(락 0.78 끝나자마자): 앞 순서의 끝 서 있기가 새 순서를 덮지 않는지.
