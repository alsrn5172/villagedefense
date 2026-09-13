# b/skill-thief-motion — 도적 스킬 캐릭터 애니메이션 · 분신 따라하기 · 표 재대조 (B)

> Draft PR #57 `[b/skill-thief-motion] 도적 스킬 캐릭터 애니메이션 — 럭키 세븐·다크 사이트·쉐도우 파트너·메소 익스플로전 · 분신 따라하기 · 표 재대조` · base `b/skill-archer-motion`(PR #56 · 스택 — 궁수 편의 `GetMotionSequence(skillId, skillData)` / `PlayMotion` / `ResolveMotionRow` 위에 얹는다). 이 브랜치의 조각 로그. 릴리스 때 `Docs/CHANGELOG.md` 로 합친다(협업-규칙 §11).
> 근거: 사용자의 도적 표 이미지("도적 — 도박하는 자" · 2026-09-13) · 요청 "표대로 재확인 · 원작과 같거나 비슷하게 · 공격 스킬은 공격 동작 · 비공격 스킬은 사용이 보이는 동작". 계약 변경 없음(새 표·열·열거값·이벤트 없음 · `WeaponMotion.csv` 는 A 표에 B 행 추가/B 행 값 변경만). #55 마법사 편 · #56 궁수 편과 같은 형태의 도적 편.

## 2026-09-13 — 도적 5종 표 재대조 · 캐릭터 애니메이션 · 쉐도우 파트너 분신 따라하기

- `origin/main`(5f8c7c4 · #48 전사 squash)은 이 브랜치의 base 가 이미 담고 있다(사용자 지시 "main 먼저 pull" · `git fetch` 결과 새 커밋 0 → 병합 커밋 없음).
- 표(도적 · 이미지판 · 해금/효과/Lv.1→5) 대조 — **CSV 값 변경 0**(`SkillInfo.csv` 는 손대지 않았다):

| 슬롯 | 표 | CSV / 코드 | 결과 |
|---|---|---|---|
| A 럭키 세븐 Q · 해금 10 | 표창 2개 · 80x2% → 120x2% | ReqLevel 10 · BaseEffect 80 · +10/lv · HitCount 2(첫 발 ×2 피해 · 2발 연출 볼리 0.12s · 수비 표창 스프라이트) | ✅ |
| B 픽파켓(패시브) · 10 | 몬스터를 1번(타수 아님) 때리면 1~2메소 즉시 드랍 · 기존 드랍 영향 X · 소수점 안 되면 5렙에만 2메소 | 10 · FLAT 1 · +0.25/lv → Lv1 1개 ~ Lv5 2개(소수점 = 확률 · `SkillBuffs.OnSkillHitMonster` · 같은 대상 0.5s 중복 방지 · 기존 드랍(FarmReward) 무관) · 기본 공격 훅은 A 의 `PlayerAttack.OnAttack` 대기 | ✅ |
| C 다크 사이트 W · 20 | 10초 은신 · 공격 1회 무조건 회피 · 회피하면 해제 · 쿨 50→30 | 20 · Duration 10 · Cooldown 50 · −5/lv(Lv5 = 30) · `ConsumeEvadeOnce`(1회 회피 → 버프 종료) · 알파 0.35 · 몬스터의 은신 무시는 A 의 IsTargetable 대기 | ✅ |
| D 쉐도우 파트너 E · **30** | 분신 소환 · 화력 2배 · 1분 · 쿨 2분→1분 | 30 · RATIO 100(피해 ×2 = `GetOutgoingDamageMul`) · Duration 60 · Cooldown 120 · −15/lv(Lv5 = 60) · 분신 = 팩 special/stand1 루프 | ✅ (구현항목-결정 §4-5 의 해금 20 과 다름 — #54 부터 이미지판 30 · 기획 확인 대기 그대로) |
| 궁 메소 익스플로전 R · 30 | 갑자기 메소를 소환해서 주변 지역을 다 폭발(컷신) · 50% × 주변 메소 갯수 | 30 · 50 · Range 6 · UseLimit 1 · 반경 안 실제 메소 동전 N 개 소모 → atk × 50% × N · 일도양단 컷신 | ✅ ("소환" 은 컷신·동전 연쇄 폭발 연출로 · 동전 0 개면 소모 없이 거절은 #54 결정 그대로 — 원작도 바닥 메소가 재료) |

- **원작 팩 재검색**(msw-search 리소스 API · 2026-09-13): 럭키 세븐 `skill/400.img/skill/4001344`(원작 그대로 · CharLevel/10~25 별 effect·hit 변형도 있음) · 픽파켓 4211003 · 쉐도우 파트너 4111002 · 메소 익스플로전(원작 4211006 은 여전히 색인에 없음 → 400004110 coin hit + 4241006 VI effect0 + 일도양단 4241500 컷신 그대로).
  다크 사이트는 `skill/424.img/skill/4241005 "다크 사이트"` 가 새로 잡혔지만 **아이콘 3장뿐(effect 없음)** → 나이트워커 14001003(effect 은신 연기 + Use 사운드) 그대로.
- **캐릭터 애니메이션** — `RootDesk/MyDesk/WeaponMotion.csv`(A 표 · B 행 추가/B 행 값 변경만 · 헤더·A 행 불변 · 협업-규칙 §2-1): CLAW 행 3 → **10**(표 55 → **62행**) + `SkillExecutors.GetMotionSequence` 도적 3종. 검(나무 검)을 든 도적·맨손 도적도 `ResolveMotionRow` ②(직업 기본 무기 CLAW 의 스킬 전용 행)로 재생된다(#55).
  - 액션 이름 근거: 쉐도우 파트너 팩의 `special/<action>` 썸네일 실루엣(GIF 프레임을 System.Drawing 으로 펼쳐 확인) — **`swingT3` = 팔을 어깨에서 앞으로 뻗는 던지기**, `swingO3` = 옆으로 크게 베기(A 의 아대 기본 행 후보값 · `Docs/스킬-모션-구현맵.md` §3 "미검증"), `swingO1` = 뒤로 젖혔다 내려치기. 도적 공격 동작 = `swingT3`.
  - 럭키 세븐 `SK_T11`(공격): 시전 행 **swingT3 1.2배속** 한 동작(원작 럭키 세븐 = 던지기 한 번에 표창 2개 · 더블 샷과 같은 규칙). 예전엔 전용 행이 없어 아대 기본 swingO3(옆 베기)이 나갔다.
  - 다크 사이트 `SK_T21`(비공격): 전사 버프·매직 가드와 같은 순서 — **heal 1.5배속 ZigzagLoop**(시전 락 0.5 동안 손 들기 왕복 · 은신 연기 이펙트와 같이) → `_2` 1.0 alert 2.5배속 → `_END` 1.6 **stand1**(아대 = 한손 분류). 원작 다크 사이트는 몸 동작 없이 반투명만 → "사용이 보이는 동작" 요청으로 넣었다. 예전 행 = alert 1배속 Onetime(피격 HIT 와 같아 보이는 자세).
  - 쉐도우 파트너 `SK_T22`(비공격): 같은 순서(1.0 / 1.6 · 시전 락 0.6). 예전 행 = alert Onetime.
  - 메소 익스플로전 `SK_T31`(공격 · 컷신): 시전 행 **alert**(일도양단 컷신 아래 자세 · 그대로) → `_2` **CSV Duration(1.6 = `ExecuteMesoOrigin` 피해·중심 폭발) swingT3 1.5배속**(폭발 순간 던지기 = 공격 동작) → `_END` 5.5 stand1. 일도양단 screen 85프레임은 세이크리드 바스티온(89프레임 ≈4.8s 실측) 비례로 ≈4.6s 로 추정 — 컷신이 걷히면 던지기의 마지막 프레임이 잠깐 보이고 5.5s 에 서 있기.
  - 픽파켓 `SK_T12` 는 패시브(시전 없음) → 행 없음.
- **쉐도우 파트너 분신 따라하기** — `SkillExecutors.PlayShadowMimic(uid, action)`(원작 = 분신이 시전자의 공격을 그대로 따라 한다 · 예전엔 분신이 60초 내내 서 있기만 했다):
  - `PlayMotion` 이 WeaponMotion 행을 재생할 때마다(시전 행 · `_2`/`_END` 순서 · 파워 스트라이크 `_1`/`_2`) 부른다. 분신 루프(`buffLoopEffects[uid][SHADOW_PARTNER]`)가 있고 `effectOverrides.SK_T22.mimic` 에 그 CoreAction 의 팩 `special/<action>` 클립(같은 4111002 팩 · 3프레임 · 발 pivot)이 있으면: 서 있기 루프를 내리고 → 같은 자리(시전자 뒤 offsetX −0.45 · **지금** 바라보는 쪽 기준 FlipX)에 그 클립 한 번 → `ShadowMimicSeconds`(0.6) 뒤 버프가 켜져 있으면 **남은 시간**(`GetBuff().endsAt − ServerElapsedSeconds`)만큼 `PlayBuffLoop` 로 서 있기 루프 재개. 연타면 이전 복귀 타이머를 취소한다.
  - mimic 표: swingT3(럭키 세븐 · 메소 익스플로전 폭발) · swingO3/O1/O2 · stabO1/O2(단검) · heal · alert. stand1 은 루프 자체라 없음 · shoot 계열은 도적이 안 쓴다.
  - 부수 효과: 뒤돌아선 뒤의 첫 스킬부터 분신이 새 등 뒤로 옮겨 온다(예전엔 시전 때 바라본 쪽에 고정). 시전 행(heal)은 분신이 `ExecuteBuff` 뒤에 뜨므로 안 따라 하고 `_2` alert 부터 따라 한다. 버프가 도중에 끝나면 `OnBuffEnded → StopBuffLoop` 가 새 루프 serial 도 지운다(serial 은 `perUser[tag]` 최신값).
  - 피해 2배는 그대로 `SkillDatabase.DamageAt` 의 `GetOutgoingDamageMul` 한 줄(표시 타수를 분신 몫으로 나누는 원작식 2줄 표시는 안 넣었다 — SkillAttack/SkillProjectile 표시 경로 전부를 건드려야 해서 별도 판단).
- 🟡 **Play 미검증**(사용자가 직접 확인 · MCP 는 요청 시에만 · 2026-09-13 지시). 확인 항목(기대 로그 · 도적 Lv30 DEV 세팅 · 아대 `WEAPON_THIEF_CLAW_T10` 장착 권장 · 자동획득 OFF 면 동전이 남는다):
  - 입장: `[Motion] weapon motion table loaded: 62 rows` · `cutscene prewarm x5`(변화 없음)
  - Q 럭키 세븐: `motion sequence` 없음(순서 없음) · 팔을 앞으로 뻗는 던지기 한 번 + 표창 2발(`volley=2`) · 맞으면 `[Buff] PICKPOCKET +N meso`
  - W 다크 사이트: `[Buff] ON DARK_SIGHT` · `motion sequence SK_T21 weapon=CLAW steps=2/2` · 손 들기 왕복 → 빠른 전투 자세 → 서 있기 · 반투명
  - E 쉐도우 파트너: `[Buff] ON SHADOW_PARTNER` · `buff loop effect SK_T22 SHADOW_PARTNER` · `motion sequence SK_T22 weapon=CLAW steps=2/2` · 1.0s 에 `shadow mimic alert` · 이후 Q 마다 `shadow mimic swingT3 facing=±1` → `buff loop effect stopped` → 0.6s 뒤 `buff loop effect SK_T22 … for <남은 초>s` · 분신이 시전자 뒤에서 같이 던진다 · Q 피해 로그 `x2 (shadowPartner)`
  - R 메소 익스플로전(동전 근처): `MESO SK_T31 detonating N coins` · `motion sequence SK_T31 weapon=CLAW steps=2/2` · 1.6s `dealt SK_T31 circle … mul=N` · 컷신이 걷힌 뒤 던지기 마지막 프레임 → 5.5s 서 있기(컷신 길이를 스크린샷 시각으로 재면 `_END` 조정)
  - 빌드: 오류 0 · 경고 수 기존과 같음(PR 본문 "build warnings: N before → N after" 에 기입)
  - Maker 가 열린 채 파일을 복사했다 → Play 전에 **Reimport All**(CSV 는 Reimport 없이 Play/종료하면 메모리 사본으로 되돌아간다 · 협업-규칙 §5).
