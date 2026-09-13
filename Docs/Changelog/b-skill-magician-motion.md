# b/skill-magician-motion — 마법사 스킬 캐릭터 애니메이션 (B)

> Draft PR `[b/skill-magician-motion] 마법사 스킬 캐릭터 애니메이션 — 텔레포트·매직 가드·대마법(전사 버프 순서) · 장착 무기≠직업 무기 모션 행 해석` · base `b/skill-archer-thief-pirate`(PR #54 · 스택 — `SkillExecutors.GetMotionSequence/PlayMotionSequence` · `WeaponMotion.csv` 스킬별 행 · 전사 버프 순서가 그 브랜치에 있다). 이 브랜치의 조각 로그. 릴리스 때 `Docs/CHANGELOG.md` 로 합친다(협업-규칙 §11).
> 근거: 사용자의 마법사 표 이미지(2026-09-13) · 사용자 요청 "공격 스킬은 공격 동작 · 비공격 스킬은 전사 버프처럼 · 표대로 재확인". 계약 변경 없음(새 표·열·열거값·이벤트 없음 · `WeaponMotion.csv` 는 A 표에 B 행 추가/B 행 값 변경만). 아래 절은 #54 조각에서 옮겨 온 것(2026-09-13 마법사 작업 4커밋).

## 2026-09-13 — 마법사 5종 표 재대조 · 캐릭터 애니메이션 (사용자 요청 "표대로 재확인 · 공격 스킬은 공격 동작 · 비공격 스킬은 사용이 보이는 동작")

- `origin/main` 재확인(사용자 지시 "main 먼저 pull"): 브랜치가 이미 main 을 전부 담고 있다(`HEAD..origin/main` 빈 목록) → 병합 커밋 없음.
- 표(마법사 · 이미지판 · 해금/효과/Lv.1→5) 대조 — **CSV 값 변경 0**:

| 슬롯 | 표 | CSV / 코드 | 결과 |
|---|---|---|---|
| A 에너지볼트 Q · 해금 10 | 지정 위치 광역 · 140% → 220% | ReqLevel 10 · BaseEffect 140 · +20/lv · 앞쪽 최근접 유도 투사체 | ✅ |
| B 연성(패시브) · 10 | 장비 강화 비용 절감 30% → 50% | 10 · 30 · +5 · `JobPassiveLogic.GetJobCostMul(ENHANCE)` | ✅ |
| C 텔레포트 강화 shift · 20 | 쿨 절반 · 이동 거리 +30% · 도착 광역 · 쿨 2 → 1초 | 20 · Cooldown 2 · −0.25/lv · Range 3.25(= 2.5×1.3) · 도착 AoE 110→150% | ✅ |
| D 매직 가드 E · 20 | 45초 · 쿨 1분 · 피해의 35~75% MP 대신 · 공격 시 현재 MP 5% 추가 피해 · 소모 MP +50% | Duration 45 · Cooldown 60 · 35 +10/lv · Secondary 5 · `MagicGuardMpCostMul` 1.5 | ✅ |
| 궁 대마법 R · 30 | 단일 대상 초고피해(컷신 · 썬콜 오리진) · 6000% 고정 | 30 · 6000 · MaxLevel 1 · UseLimit 1 · 프로즌 라이트닝 screen 컷신 | ✅ 값 · ⚠ 형태는 **반지름 3 폭발**(보스 우선 중심 · 2026-09-09 사용자 결정 그대로 유지 · 되돌리면 `ExecuteBlast` → `DealSkillDamageToTarget` 한 곳) |
| 특이사항 텔레포트 shift · 10 | 초보자 더블 점프 → 텔레포트 | ReqLevel 10 · Shift + `SkillHotbar.OnJumpKeyDown`(공중 1회) | ✅ |

- 원작 팩(icon · cast · hit · sound)은 전부 기존대로(`SkillInfo.csv` `#Note`). 이번 변경은 **캐릭터 모션만**.
- **`RootDesk/MyDesk/WeaponMotion.csv`**(A 표 · B 행 추가/B 행 값 변경만 · 헤더·A 행 불변 · 협업-규칙 §2-1): 마법사 WAND 행 2 → **9**(표 43 → **50행** · B 행 36 → 43).
  - 에너지볼트 `SK_M11` = **swingO2**(완드 머리 위 휘두르기 · 원작 마법사 공격 스윙 계열 · 기본 공격 swingO1 과 구분). 원작 WZ 의 `action` 값(swingO1/O2)은 색인이 오프라인이라 미확인 — 다르면 한 칸.
  - 텔레포트 `SK_M13` · 텔레포트 강화 `SK_M21` = **heal 2배속 Onetime**(손 들기 한 번 · 원작 텔레포트는 몸 동작 없음). `SkillCaster.RequestCast` 의 "BLINK 는 모션 생략" 을 **전용 행이 있을 때만 재생**(`HasOwnMotionRow` · `PlayerMotion.Find` 가 무기 기본 행으로 폴백하면 false)으로 바꿨다 — 행이 없는 이동 스킬(닷지 SK_A22)은 예전처럼 생략. Onetime 은 마지막 프레임이 다음 움직임까지 남는다 → 텔레포트 뒤 가만히 있으면 손 든 채 멈춘다. 이동 스킬엔 시전 락이 없어 `_END`(서 있기) 를 넣으면 걷는 중에 서 있기 자세가 덮어쓸 수 있어 넣지 않았다(사용자 판단 항목).
  - 매직 가드 `SK_M22` = 전사 버프(하이퍼 바디)와 같은 순서: **heal 1.5배속 ZigzagLoop**(시전 락 0.6s) → 1.0s `_2` alert 2.5배속 왕복 → 1.6s `_END` stand1. (alert Onetime 1행 → 3행)
  - 대마법 `SK_M31` = **heal 1.5배속 ZigzagLoop**(충전 2초 = CSV Duration) → **2.0s `_2` swingO3**(폭발 순간 완드를 위로 휘두르기 = 공격 동작 · `ExecuteBlast` 와 같은 시점) → 5.5s `_END` stand1. 프로즌 라이트닝 컷신이 아바타를 덮는 구간은 안 보일 수 있다(세이크리드 바스티온은 ≈4.8s 에 걷혔고 이 컷신은 미실측).
  - 연성 `SK_M12` 는 패시브(시전 없음) → 행 없음.
- `SkillExecutors.GetMotionSequence` += `SK_M22`(`_2` 1.0 · `_END` 1.6) · `SK_M31`(`_2` 2.0 · `_END` 5.5). `SkillCaster.HasOwnMotionRow(uid, motionId)`(ServerOnly) 신설.
- 전제: `PlayerMotion.PlaySkill` 은 **장착 무기**로 행을 찾는다 → 완드(`WEAPON_MAGICIAN_T10/T20/T30` · WeaponType WAND)를 장착해야 보인다. 맨손은 A 의 설계상 모션 없음.
- 🟡 **Play 미검증**(사용자가 직접 확인 · MCP 는 요청 시에만): 기대 로그 `[Motion] weapon motion table loaded: 50 rows` · Q 완드 휘두르기 · Shift 뒤 손 들기(+ `no row` 경고 0) · E `motion sequence SK_M22 weapon=WAND steps=2/2` · R 충전 중 팔 흔들기 → 폭발 순간 휘두르기 · `motion sequence SK_M31 weapon=WAND steps=2/2`.

### 2026-09-13 — 텔레포트·매직 가드·대마법 = 전사 버프와 같은 캐릭터 애니메이션 (사용자 요청 "공격 동작 말고 전사 것처럼")

- 셋 다 **heal 1.5배속 ZigzagLoop(팔을 위아래로 계속 흔드는 시전 동작) → `_2` alert 2.5배속 왕복(빠른 전투 자세) → `_END` stand1 서 있기** — 하이퍼 바디·도발·불굴의 진(v4)과 같은 순서. 공격 스윙은 에너지볼트(SK_M11 swingO2)에만 남는다.
  - 텔레포트 `SK_M13` · 텔레포트 강화 `SK_M21`: heal 2배속 Onetime 한 번 → 위 순서로. 시전 락이 없고 쿨이 1s 까지 줄어드니 `_2` **0.75** · `_END` **1.2**(전사 v3 실측 "시전 모션은 키 +0.3s 에야 보인다 → 0.5 는 너무 짧다"). 새 행 `SK_M13_2`·`SK_M13_END`·`SK_M21_2`·`SK_M21_END` 4행.
  - 매직 가드 `SK_M22`: 이미 같은 순서(1.0 / 1.6) — 변경 없음.
  - 대마법 `SK_M31`: `_2` 를 **swingO3(공격 스윙) → alert 2.5배속 왕복**으로. 시점은 그대로 2.0(충전 끝 = 폭발) · `_END` 5.5.
- `SkillExecutors.PlayMotionSequence`: 유저별 진행 중 순서의 타이머 id 를 `motionSeqTimers[uid]` 에 두고 **새 시전이 오면 이전 순서를 `ClearTimer`** — 텔레포트 연타(쿨 1s)에서 이전 `_END`(서 있기)가 새 시전의 heal 왕복을 0.5s 만에 끊던 것 방지. 로그에 `cancelledPrev=N`.
- `WeaponMotion.csv`: 표 50 → **54행**(B 행 47). 걷는 중 텔레포트하면 상태기(MOVE)가 걷기 애니메이션을 계속 밀어넣어(SkillCaster 주석 · 그래서 시전 락 중 StateComponent 를 끈다) 시전 동작이 안 보일 수 있다 — 서서 텔레포트할 때 보인다.
- 🟡 **Play 미검증**(사용자 확인): `[Motion] weapon motion table loaded: 54 rows` · Shift 뒤 `motion sequence SK_M13 weapon=WAND steps=2/2 cancelledPrev=0` · 연타 두 번째 `cancelledPrev=2` · R `SK_M31 … steps=2/2` · 폭발 순간 전투 자세.

### 2026-09-13 — 제보 "텔레포트·매직 가드·대마법 애니메이션이 안 보인다" → 맨손 대책

- 런타임 로그는 못 봤다(Maker MCP 미연결 · `Player.log` 에는 스크립트 `log()` 가 안 남는다). 코드에서 찾은 가장 유력한 원인: **`PlayerMotion.PlaySkill` 은 장착 무기(`WeaponTypeOf`)로 행을 찾고, 맨손이면 경고도 없이 아무것도 재생하지 않는다.** `PlayMotionSequence` 도 맨손이면 조용히 return. 마법사가 완드(`WEAPON_MAGICIAN_T10`)를 안 들고 있으면 이번에 넣은 세 애니메이션 전부 무재생 — 세 스킬이 같이 안 보인다는 제보와 맞는다.
- 대책(B 파일만 · A 의 공개 API 사용): **`SkillExecutors.PlayMotion(uid, motionId, ownRowOnly)`** 한 곳으로 모션 재생을 모았다 — `MotionWeaponTypeOf` = 장착 무기, 맨손이면 **직업 기본 무기**(`JobDefaultWeaponType`: MAGICIAN→WAND · WARRIOR→SWORD_1H · ARCHER→BOW · THIEF→CLAW · PIRATE→KNUCKLE · 초보자 "" = 예전처럼 무재생) 로 `PlayerMotion.Find` → `PlayerMotion.PlayAction(core, parts, rate, playType, uid)`(A 의 Client 메서드 · PlaySkill 이 부르는 것과 같은 호출). heal·alert·stand1 은 몸 동작이라 무기 없이도 그대로 나온다. 행이 없으면 `no WeaponMotion row` 경고 · 맨손+초보자면 `skipped — no weapon and no job default` 로그.
- 호출처 교체: `SkillCaster.RequestCast`(시전 행 · `ownRowOnly = isMove` → `HasOwnMotionRow` 삭제) · `PlayMotionSequence`(`_2`/`_END`) · `ExecutePowerStrikeCombo`(`_1`/`_2`). 잔상(`PickWeaponSpec`)은 실제 장착 무기 기준 그대로(맨손 전사는 잔상 없음).
- 그래도 안 보이는 경우(설계상): ① **달리면서 텔레포트** — 상태기 MOVE 가 걷기 애니메이션을 계속 밀어넣어 시전 동작을 덮는다(시전 락이 없어 SkillCaster 처럼 StateComponent 를 끄지 않음) → 서서 Shift. ② **대마법** — 프로즌 라이트닌 screen 컷신(1445×859 · 1.4배)이 시전 순간부터 아바타를 덮는다 → 충전 동작은 컷신 아래에 있고, 컷신이 걷힌 뒤 `_END`(5.5s) 서 있기만 보일 수 있다(불굴의 진과 같은 구조 · 클립 길이 미실측).
- 🟡 **Play 미검증**(사용자 확인): 맨손 마법사로 E → `motion sequence SK_M22 weapon=WAND steps=2/2` (weapon=WAND 가 맨손에서도 찍혀야 한다) · 팔 흔들기 → 빠른 전투 자세 → 서 있기. 표 로드 `[Motion] weapon motion table loaded: 54 rows`.

### 2026-09-13 — 원인 확정(Maker MCP 로그) · 장착 무기와 직업 무기가 다를 때의 행 해석 · Play 검증 ✅

- **원인**: 사용자 캐릭터가 마법사인데 **나무 검(`WEAPON_WOODEN_SWORD` · SWORD_1H)** 을 든 채 시전 → `PlayerMotion.WeaponTypeOf` = SWORD_1H → 마법사 행(WAND)이 하나도 안 맞아 `motion sequence SK_M22_2 has no WeaponMotion row for SWORD_1H — skipped` · `steps=0/2`(16:12~16:14 사용자 Play 로그 · 표는 54행 로드됨). 매직 가드 시전 행은 검 기본 스윙(swingO1)으로 폴백. 맨손 가설(앞 절)은 틀렸고, 앞 절의 맨손 폴백은 그대로 유효.
- **`SkillExecutors.ResolveMotionRow(uid, motionId, ownRowOnly)`** → `{ row, weaponType }`: ① 장착 무기의 스킬 전용 행 → ② **직업 기본 무기의 스킬 전용 행** → ③ (ownRowOnly 아니면) 장착 무기 기본 공격 행 → ④ 맨손이면 직업 기본 무기 기본 공격 행. `PlayMotion` · `PlayMotionSequence` 가 이것을 쓴다(순서 로그의 `weapon=` 은 실제로 쓴 행의 무기).
- **Play 검증(Maker MCP · 여섯갈래길 · 마법사 Lv30 · DEV 세팅 · 나무 검 장착 `EQUIP … type=[SWORD_1H] job=MAGICIAN`)** — 빌드 오류 0:
  - E 매직 가드: `[Motion] weapon motion table loaded: 54 rows` · `motion sequence SK_M22 weapon=WAND steps=2/2 cancelledPrev=0`. 확대 프레임: +0.35 팔 들어 올림(heal) → +0.7 팔 든 채(시전 이펙트 아래) → +1.1 빠른 전투 자세(검 앞으로) → +1.8 서 있기.
  - 텔레포트(`_SkillCaster:Cast('SK_M21')` · 핫바와 같은 입구): `motion sequence SK_M21 weapon=WAND steps=2/2 cancelledPrev=2`(직전 매직 가드 순서 취소). 프레임: +0.3 도착 이펙트(텔레포트 마스터리 불꽃)가 캐릭터를 덮음 → +0.6 팔 들어 올림 → +0.95 빠른 전투 자세 → +1.4 서 있기.
  - R 대마법: `motion sequence SK_M31 weapon=WAND steps=2/2` · `BLAST … r=3`. 프레임 +0.6/+2.3/+4.7 = 프로즌 라이트닝 컷신이 화면 전체(캐릭터 안 보임) → +6.3 서 있기(`_END`). 예상대로 컷신 아래 동작은 안 보인다.
  - 맨손(`UNEQUIP type=[]`) 텔레포트: `weapon=WAND steps=2/2` · +0.9 팔 든 자세.
- 남는 것: 텔레포트 첫 0.5s 는 도착 이펙트가 캐릭터를 가린다(원작 이펙트 그대로) · 대마법은 컷신 구조상 서 있기 복귀만 보인다.
