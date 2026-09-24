# b/skill-hyperbody-dmgreduce

## 2026-09-24 — 하이퍼 바디(SK_W21) 받는 피해 감소 연결 (`Skill/` 자가 배선)

PR #85. 전사 스킬 점검(2026-09-24 · #83 브랜치 · Maker MCP) 중 확인했다.

**헤더 변경 없음 · 새 CSV 열 없음 · 새 이벤트 없음 · 새 RPC 없음.** `Docs/스키마-계약.md` 는 건드리지 않았다.

### 원인

감소 계산은 있었지만 **아무도 부르지 않았다.**

- `SkillBuffs.ReduceDamage`(`:719`) · `ModifyIncomingDamage`(`:731`) · `GetDamageMul` — `RootDesk/**/*.mlua` 에 `SkillBuffs.mlua` 밖 호출부 0
- 설계상 A 의 `PlayerHit.OnHit` 이 HP 감산 전에 `ModifyIncomingDamage` 를 부르기로 돼 있었고(헤더 `:16`), 그 연결이 아직 없다
- 다크 사이트 · 에너지 쉴드 · 매직 가드는 그동안 `OnPlayerHitEvent` 의 **자가 배선**(HitEvent 뒤 HP 되돌림)으로 돌았는데, 하이퍼 바디만 자가 배선이 없었다

실측(수정 전 · Lv1 · 스네일 접촉 147): 버프 전후 모두 `IRON_BODY reflect … took=147` · `GetDamageMul = 0.8` 인데 HP 는 147 × 3 = 441 그대로 빠졌다.

### 수정

| 위치 | 변경 |
|---|---|
| `SkillBuffs` 속성 (`:94`) | `HyperBodySelfWire = true` — 다른 `*SelfWire` 와 같은 스위치. A 의 사전 훅이 들어오면 false |
| `SkillBuffs.OnPlayerHitEvent` (`:223-229`) | 보호막 뒤 · 매직 가드 앞에서 `ReduceDamage` → 줄어든 만큼 `RefundHp(…, "HYPER_BODY")` · 매직 가드는 줄어든 피해를 받는다. `ModifyIncomingDamage` 의 ③→④→⑤ 순서와 같다 |
| 헤더 주석 (`:22`) · `OnPlayerHitEvent` 주석 | 자가 배선 목록에 하이퍼 바디 추가 |

**한계 (다른 자가 배선과 같다):** HP 는 먼저 전액 깎이고 0.05s 뒤 되돌아온다. 그래서 ① 한 방에 죽는 피해는 못 살린다 ② 피해 숫자는 감소 전 값이 뜬다. 둘 다 A 의 사전 훅(아래)이 들어와야 풀린다.

### A 에게 필요한 것 — `PlayerHit.OnHit` 사전 훅 (A 파일 · B 는 안 건드렸다)

`RootDesk/MyDesk/PlayerHit.mlua` `:42`(궁 시전 무적 분기 `end`) 다음 줄, 같은 `if self:IsServer() and _SkillBuffs ~= nil then` 블록 안에:

```lua
			if uid ~= "" then
				damage = _SkillBuffs:ModifyIncomingDamage(uid, damage)
				if damage <= 0 then return end
			end
```

`damage <= 0` 이면 `__base:OnHit` 을 건너뛴다 → HP · 경직 · 넉백 · 피해 표시 · HitEvent 모두 없음.

**4버프 커버 점검** (`ModifyIncomingDamage` `:731-749` 순서):

| 버프 | 단계 | HP 감산 전? | 한 방 피해 생존 | 경직·넉백 |
|---|---|:--:|:--:|---|
| 다크 사이트 SK_T21 | ② `ConsumeEvadeOnce` → 0 | ✅ | ✅ | ✅ 없음(`return`) · 대신 회피한 타는 HitEvent 가 없어 아이언 바디 반사도 없음(지금 자가 배선 `:214` 와 같다) |
| 에너지 쉴드 SK_P22 | ③ `AbsorbByShield` | ✅ | ✅ 보호막 안이면 | 전액 흡수면 없음(`return`) · 일부면 있음 — **지금은 전액 흡수여도 경직이 있다. 동작 변화** |
| 하이퍼 바디 SK_W21 | ④ `ReduceDamage` | ✅ | ✅ 감소 뒤 HP 안이면 | 있음(피해 > 0) |
| 매직 가드 SK_M22 | ⑤ `AbsorbDamage` (MP 차감 · `SkillCaster.UseSpendMp = true` `:20`) | ✅ | ✅ 흡수 뒤 HP 안이면 | 있음(피해 > 0) |

네 가지 모두 이 한 줄로 **HP 감산 전**에 적용된다. `① IsInvincible` 은 위 불굴의 진 · 궁 시전 무적 분기가 먼저 `return` 해서 사실상 닿지 않는다.

**이 훅이 못 덮는 피해:** `Faction/FactionAuraController.mlua:395` `player.Hp = hp`(오라 도트 · `OnHit` 을 안 거친다). 몬스터 접촉 · 보스 스킬 · 보스 투사체 · 시설/수비대는 전부 AttackComponent → `PlayerHit.OnHit` 이라 덮는다.

**A 가 넣은 뒤 B 가 할 일 (`Skill/` · 같은 날 머지):** `SkillBuffs` 의 `MagicGuardSelfWire`(`:86`) · `DarkSightSelfWire`(`:89`) · `EnergyShieldSelfWire`(`:91`) · `HyperBodySelfWire`(`:94`) 를 **false** 로. 안 끄면 흡수·감소가 두 번 들어간다(보호막·MP 두 번 소모). 순서가 어긋나지 않게 두 PR 을 같이 머지해야 한다.

### Play 검증

(2026-09-24 · Maker MCP · `Orbis_Lobby_VictoriaStation` · 이 브랜치 `6bb9c17` · Reimport All → `refresh` → `logs(build)` → `play`)

**빌드 경고: 1 before → 1 after** (기존 `LWA-1111` · 에러 0 · Play 뒤 재확인도 같음). Refresh 뒤 `git status` 깨끗 — `SkillBuffs.codeblock` 재생성 없음.

조건: 전사 Lv30 · 3차 · ATK 75 · 최대 HP 201450 · 스네일 2마리(`FarmReward.MonsterId=100000` → 접촉 147) · 실제 시전 경로(`_SkillCaster:Cast("SK_W21")`). 서버 폴러가 받아들인 피격마다 직전 HP 와 0.3s 뒤 HP(= 되돌림 뒤)를 찍었다.

**버프 없음 — 타당 147**
```
[T] HIT#1 t=0.22 buff=none pre=201450 post=201303 net=147 max=201450
[T] HIT#7 t=9.48 buff=none pre=200568 post=200421 net=147 max=201450
```

**Lv1 — 타당 117 (−20%)** · 16타 전부 같다
```
[Buff] ON HYPER_BODY skill=SK_W21 lv=1 dur=45 ratio=20 secondary=20
[Buff] HYPER_BODY maxHp 201450 +40290 (20%) -> 241740 hp=240564
[Buff] HYPER_BODY reduce 147 -> 117 (-20%)
[Buff] HYPER_BODY hp refund +30 (240417 -> 240447)
[T] HIT#9 t=11.52 buff=lv1/-20% pre=240564 post=240447 net=117 max=241740
[T] HIT#24 t=31.36 buff=lv1/-20% pre=238809 post=238692 net=117 max=241740
```

**Lv5 — 타당 88 (−40%)** · Lv1 버프가 45초로 끝난 뒤 새로 시전(직전 6타 = 147)
```
[T] HIT5#6 t=7.27 buff=none pre=200715 post=200568 net=147 max=201450
[Buff] ON HYPER_BODY skill=SK_W21 lv=5 dur=45 ratio=60 secondary=40
[Buff] HYPER_BODY maxHp 201450 +120870 (60%) -> 322320 hp=321438
[Buff] HYPER_BODY reduce 147 -> 88 (-40%)
[Buff] HYPER_BODY hp refund +59 (321291 -> 321350)
[T] HIT5#7 t=9.22 buff=lv5/-40% pre=321438 post=321350 net=88 max=322320
[T] HIT5#9 t=11.28 buff=lv5/-40% pre=321262 post=321174 net=88 max=322320
```

`floor(147 × 0.8) = 117` · `floor(147 × 0.6) = 88` 과 정확히 같다. 아이언 바디 반사(`IRON_BODY reflect … took=147`)는 감소와 무관하게 그대로 나간다 — 반사는 원래 받은 피해가 아니라 최대 HP 기준이다.

**판정: PASS** (Lv1 · Lv5 둘 다). 한 방에 죽는 피해·피해 숫자 표시는 위 "한계" 그대로 — A 의 사전 훅 전까지는 확인 대상이 아니다.

### 건드리지 않은 것

- `Skill/` 밖 전부 (A 폴더) — `PlayerHit.mlua` 포함
- `ReduceDamage` · `ModifyIncomingDamage` 본문 · `SkillInfo.csv` 수치
- 다른 `*SelfWire` 기본값

## 2026-09-24 (2차) — PlayerHit 사전 피해 훅 + SelfWire 4개 끄기 (#89 를 이 PR 로 합침)

원래 PR #89(`b/skill-prehit-hook` · #85 위에 쌓은 stacked PR)였다 — 2026-09-25 사용자 지시로 이 브랜치를 #89 끝까지 fast-forward 해 한 PR 로 합쳤다. 위 1차의 HitEvent 뒤 HP 되돌림(자가 배선)은 이 2차로 대체된다. **출처: #40 5813239867 (A 결정 · 사용자 확정 2026-09-24)** — 훅과 `*SelfWire` 4개 끄기를 한 PR 에 · A 는 리뷰로 승인(`PlayerHit.mlua` = A 파일 · 협업-규칙 §3-3).

**헤더 변경 없음 · 새 CSV 열 없음 · 새 이벤트 없음 · 새 RPC 없음.** `ModifyIncomingDamage`(`Skill/SkillBuffs.mlua:732`)는 이미 있던 함수 — 호출부가 0 이었다.

### 변경

| 위치 | 변경 |
|---|---|
| `PlayerHit.mlua:43-50` (A 파일) | `OnHit` 의 불굴의 진 · 궁 시전 무적 분기 **뒤**, 같은 `if self:IsServer() and _SkillBuffs ~= nil` 블록 안에서 `damage = _SkillBuffs:ModifyIncomingDamage(uid, damage)` · `damage <= 0` 이면 `return`(= `__base:OnHit` 안 부름) |
| `Skill/SkillBuffs.mlua:88-94` | `MagicGuardSelfWire` · `DarkSightSelfWire` · `EnergyShieldSelfWire` · `HyperBodySelfWire` = **false** |
| `Skill/SkillBuffs.mlua` 주석 | 헤더 · `OnPlayerHitEvent` 설명을 새 경로로(동작 변화 없음 — 이제 `OnPlayerHitEvent` 는 아이언 바디 반사만) |

### 순서 (`ModifyIncomingDamage` · HP 감산 전)

1. 무적(`IsInvincible`) → 0 — 실제로는 위 불굴의 진 · 궁 시전 무적 분기가 먼저 `return` 한다
2. 다크 사이트 1회 회피 → 0
3. 에너지 쉴드 흡수
4. 하이퍼 바디 감소
5. 매직 가드 흡수(MP 차감)

### 동작 변화

| 경우 | 전(자가 배선 · HitEvent 뒤 HP 되돌림) | 후(사전 훅) |
|---|---|---|
| 한 방에 죽는 피해 | 되돌리기 전에 죽는다 | 줄어든 피해가 HP 안이면 **산다** |
| 피해 숫자 | 감소 전 값 | 감소 **뒤** 값 |
| 다크 사이트 회피 | HitEvent · 경직 있음 → HP 되돌림 | 경직 · 넉백 · 표시 · HitEvent **없음** |
| 에너지 쉴드 전액 흡수 | 경직 · 넉백 있음 | **없음** (A 승인 5813239867 2번) |
| 아이언 바디 반사 | 모든 피격 | 피해가 0 으로 끝난 타(회피 · 전액 흡수)는 HitEvent 가 없어 반사 없음 |
| 오라 피해 | 훅 밖 | 그대로 훅 밖 — 지금 플레이어 HP 를 깎는 오라 없음(A 3번) |

### 계약서

`Docs/스키마-계약.md` 스킬 등록서 8번의 `PlayerHit.mlua` 항목에 이 훅을 한 줄 더 적어야 한다. 같은 줄(`:274`)과 변경 이력 첫 행을 #86 도 고친다 — 여기서 고치면 두 PR 이 같은 줄에서 충돌하므로 **#86 머지 뒤 이 브랜치에서 추가**한다.

### Play 검증

(Maker 재입장 · Reimport All 뒤 추가)
