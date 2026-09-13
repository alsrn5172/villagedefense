# b/skill-archer-motion — 궁수 스킬 캐릭터 애니메이션 · 스나이핑 원작 팩 (B)

> Draft PR #56 `[b/skill-archer-motion] 궁수 스킬 캐릭터 애니메이션 — 더블 샷·스나이핑·닷지·폭풍의 화살 · 스나이핑 원작 팩 · 표 재대조` · base `b/skill-magician-motion`(PR #55 · 스택 — `SkillExecutors.PlayMotion/ResolveMotionRow`(장착 무기≠직업 무기 행 해석)가 그 브랜치에 있다). 이 브랜치의 조각 로그. 릴리스 때 `Docs/CHANGELOG.md` 로 합친다(협업-규칙 §11).
> 근거: 사용자의 궁수 표 이미지(2026-09-13) · 요청 "표대로 재확인 · 원작과 같게 · 공격 스킬은 공격 동작 · 비공격 스킬은 사용이 보이는 동작". 계약 변경 없음(새 표·열·열거값·이벤트 없음 · `WeaponMotion.csv` 는 A 표에 B 행 추가/B 행 값 변경만). #55 마법사 편과 같은 형태의 궁수 편.

## 2026-09-13 — 궁수 5종 표 재대조 · 캐릭터 애니메이션 · 스나이핑 원작 팩 교체

- `origin/main`(5f8c7c4 · #48 전사 squash) 병합(사용자 지시 "main 먼저 pull" · `18ecde4`) — 브랜치가 이미 같은 내용을 담고 있어 **트리 변화 없음**. B 스크립트 6종의 충돌은 브랜치 쪽(`git checkout b/skill-archer-motion -- …` · 협업-규칙 §6-2) · `merge=union` 으로 26행이 통째로 중복된 `SkillInfo.csv` 도 브랜치 쪽(C3 중복 키 경고 없이 통과 확인).
- 표(궁수 · 이미지판 · 해금/효과/Lv.1→5) 대조 — **CSV 값 변경 0**:

| 슬롯 | 표 | CSV / 코드 | 결과 |
|---|---|---|---|
| A 더블 샷 Q · 해금 10 | 원거리 연속 공격(2발) · 60%x2 → 100%x2 | ReqLevel 10 · BaseEffect 60 · +10/lv · HitCount 2(첫 발 ×2 피해 · 2발 연출 · 볼리 0.12s) | ✅ |
| B 포커스(패시브) · 10 | 보스 리젠 표시 + 특수재화 드랍율 증가 10% → 30%(%p 아님) | 10 · RATIO 10 · +5 → `JobPassiveLogic.GetJobDropMul` = ×1.1 ~ ×1.3(배율 · A 의 CostResolver 적용점 대기) · 리젠 토스트 `TickFocusBossTimer` | ✅ |
| C 스나이핑 W · 20 | 단일 초고피해(선딜 1초) · 300% → 500% | 20 · 300 · +50 · Duration 1(선딜) · 보스 우선 조준 | ✅ |
| D 닷지 E/Shift · 20 | 맵에서 가장 안전한 구역(스폰 로케이션)으로 도망 · 6~10초 확정 크리 · 쿨 30 | 20 · BLINK → `SkillMovement.TryDodge`(입장 지점 최근접 SpawnLocation) · GUARANTEED_CRIT Duration 6 +1/lv · Cooldown 30 | ✅ |
| 궁 폭풍의 화살 R · 30 | 직선 관통 초고피해(컷신 · 신궁 어센트/오리진 추천) · 4000% | 30 · 4000 · MaxLevel 1 · UseLimit 1 · Range 15 직선 상자 관통(`ExecuteLineOrigin`) · 파이널 에임(신궁 오리진 3241500) screen 컷신 | ✅ |

- **원작 팩 재검색**(msw-search 리소스 API · 2026-09-13): 궁수 300.img(더블 샷·포커스)는 여전히 색인에 없음 → 더블 샷 = 와일드헌터 33001105 그대로 · 포커스 아이콘 = 스나이핑-보스 킬러 3220050 그대로(다른 후보: 3220021 "포커스 온" 아이콘). 닷지(13110008 + 백스텝샷 400004147)·폭풍의 화살(파이널 에임 3241500)도 그대로.
  **스나이핑은 신궁 원작 `skill/322.img/skill/3221007` 스나이핑 팩이 잡혀 얼티밋 스나이핑(3241004 · 6차)에서 교체**: icon `804c52c8…` · effect(조준 연출 · 13프레임 207×258) `6c7b4f79…` · mob(조준 중 대상 표시) `0c76a3bd…` · ball(4프레임 196×53 큰 화살 · 더블 샷 60×20 재사용 해제) `07a44ad4…` · hit/0 `72fa136a…` · _audio/Use `384e71cf…` · _audio/Hit `81a8c21e…`. 다른 직업과 겹치는 RUID 없음.
  - `SkillExecutors.ExecuteProjectile`: 선딜 스킬(`projectileDelayFromDuration`)은 **시전 순간** `aim` 단계(시전자 부착 · `PlayStageEffect` 가 cast 처럼 바라보는 쪽으로 뒤집기) + Use 사운드 + **`PlayAimMarker`**(SpawnProjectile 과 같은 앞쪽 상자 Range × `SkillAttack.AimSearchHeight` · 보스 우선 대상에 `mob` 클립 · 없으면 로그만) → Duration 뒤 `FireProjectile(…, withCastBeat=false)` 로 화살만 스폰. 예전엔 연출·소리도 1초 뒤에 났다. 원작 = 키 입력에 조준 이펙트·소리 → 선딜 뒤 화살.
  - `SkillInfo.csv` 는 SK_A21 행의 IconRUID·#Note 만(값 변경 0).
- **캐릭터 애니메이션** — `RootDesk/MyDesk/WeaponMotion.csv`(A 표 · B 행 추가/B 행 값 변경만 · 헤더·A 행 불변 · 협업-규칙 §2-1): BOW 행 2 → **10**(표 54 → **62행** · B 행 47 → 55) + `SkillExecutors.GetMotionSequence` 궁수 4종. 발사 시점은 `skillData.duration`(= CSV Duration)에서 읽는다 — `Execute → PlayMotionSequence(skillId, caster, skillData) → GetMotionSequence(skillId, skillData)`.
  - 더블 샷 `SK_A11`(공격): 시전 행 **shoot1 1.6배속**(1발) → `_2` 0.2s **shoot1 다시**(2발째 · 화살 2발째 스폰 `SkillAttack.VolleyInterval` 0.12 + 표시 한 박자). 원작 더블 샷 action = shoot1 · 기본 공격(shoot1 1배속 1발)과 구분.
  - 스나이핑 `SK_A21`(공격): 시전 행 **shoot2 0.35배속**(선딜 1초 동안 천천히 당기기 · 원작 신궁 action shoot2 · 조준 이펙트와 같이) → `_2` 1.0s(= Duration = `FireProjectile`) **shoot2 2배속** 스냅 발사. 예전 shoot2 1배속은 화살보다 1초 먼저 끝났다.
  - 닷지 `SK_A22`(비공격 · 이동): 텔레포트(#55)와 같은 순서 — 도착 지점에서 **heal 1.5배속 ZigzagLoop** → `_2` 0.75 alert 2.5배속 왕복 → `_END` 1.2 **stand2**(활은 엔진 분류 TwoHandedWeapon → 두손 서 있기 · 한손 자세가 맞으면 stand1 로 한 칸). `SkillCaster.RequestCast` 의 "BLINK 는 전용 행이 있을 때만"(ownRowOnly) 규칙 그대로 — 코드 변경 없이 행만으로 켜진다(주석만 갱신). 이동 스킬이라 시전 락 없음 → 방향키를 누른 채면 걷기가 덮는다(텔레포트와 같음). 원작 닷지는 몸 동작 없음.
  - 폭풍의 화살 `SK_A31`(공격 · 컷신): 시전 행 **shoot1 0.5배속**(컷신 아래에서 활 충전) → `_2` 1.5s(= Duration = `ExecuteLineOrigin` 피해 시점) **shootF 1.5배속**(시전 행과 다른 액션이라 확실히 재시작) → `_END` 5.5 stand2. 파이널 에임 screen 133프레임은 세이크리드 바스티온(89프레임 ≈4.8s 실측) 비례로 ≈7s 로 추정 — 그러면 `_END` 도 컷신 아래에 있고 컷신이 걷히면 서 있기만 보인다(길면 7.5 로 한 칸 · 미실측).
  - 포커스 `SK_A12` 는 패시브(시전 없음) → 행 없음(마법사 연성과 같음).
  - 검(나무 검 SWORD_1H)을 든 궁수·맨손 궁수도 `ResolveMotionRow` ②(직업 기본 무기 BOW 의 스킬 전용 행)로 재생된다(#55). 검을 든 채 shoot 계열을 재생하면 검을 든 활 자세 — 활(`WEAPON_ARCHER_T10`)을 장착해야 제 모습.
  - 같은 액션 재전송(shoot1 → shoot1 · shoot2 → shoot2)이 처음부터 다시 재생되는지는 🟡 Play 확인 — 안 되면 `MOTION_SK_A11_2_BOW` 를 shootF 로 한 칸(스나이핑은 배속이 0.35 → 2 로 달라 재생 파라미터가 바뀐다).
- 🟡 **Play 미검증**(사용자가 직접 확인 · MCP 는 요청 시에만 · 2026-09-13 지시). 확인 항목(기대 로그 · 여섯갈래길 · 궁수 Lv30 DEV 세팅 · 활 장착 권장):
  - 입장: `[Motion] weapon motion table loaded: 62 rows` · `cutscene prewarm x5`(변화 없음)
  - Q 더블 샷: `motion sequence SK_A11 weapon=BOW steps=1/1` · 활을 두 번 연속 쏘는 모습 · 화살 2발(`volley=2`)
  - W 스나이핑: 키 입력 순간 조준 연출·소리 + `aim marker SK_A21 on Monster_…`(앞에 몹이 없으면 `no target in front`) · `PROJECTILE SK_A21 aiming 1s` · 1초 뒤 `spawned projectile SK_A21 … sprite=true` 큰 화살(196×53 · 크기가 과하면 SkillProjectile 쪽 scale 후속) · `motion sequence SK_A21 weapon=BOW steps=1/1` · 천천히 당기기 → 스냅 발사 · 명중 hit/0 + Hit 소리 · 375 표시(75×500%)
  - E/Shift 닷지: `SkillMovement: SK_A22 dodge … branch=spawn-location(N)` · `motion sequence SK_A22 weapon=BOW steps=2/2 cancelledPrev=0` · 도착 지점에서 팔 흔들기 → 빠른 전투 자세 → 서 있기 · `[Buff] ON GUARANTEED_CRIT`
  - R 폭풍의 화살: `motion sequence SK_A31 weapon=BOW steps=2/2` · `LINE SK_A31 …` 1.5초 · 컷신이 걷힌 뒤 서 있기(컷신 길이를 스크린샷 시각으로 재면 `_END` 조정)
  - 빌드: 오류 0 · 경고 수 기존과 같음(PR 본문 "build warnings: N before → N after" 에 기입)

### 2026-09-13 — 제보 반영 ② 공격은 전부 활 쏘기 동작 · 화살 조준점 · 스나이핑 연출 방향

- 제보 셋(사용자 Play 17:37 · Maker 로그로 확인): ① "궁수는 활 쏘는 공격 동작으로 · 공격 전부" ② "더블 샷 화살이 대상 조금 위로 지나간다 · 맞추는 몬스터로 날아가야" ③ "스나이핑 공격 연출이 바라보는 방향으로 나가야".
- **그 Play 는 이 브랜치 이전 상태였다**: 로그에 `weapon motion table loaded: 54 rows`(이 브랜치 62) · `aim marker`/`motion sequence SK_A…` 없음 · 스나이핑 cast 이펙트가 1초 뒤에 남. 17:02 에 Maker 폴더로 복사한 파일 중 **`WeaponMotion.csv` 는 Maker 종료(18:19) 때 메모리 사본(54행)으로 되돌아갔다** — CSV 는 복사 뒤 Reimport 하지 않고 Play/종료하면 되돌아간다(협업-규칙 §5). 이번엔 Maker 를 닫은 상태에서 복사 → 다음에 월드를 열면 자동 동기화.
- ① 공격 3종 시전 행 전부 **shoot1**(활 쏘기 · 원작 활 스킬 action): 더블 샷 **1.2배속 한 동작**(원작 = shoot1 한 번에 화살 2발 · 처음 넣은 2발째 행 `SK_A11_2` 와 순서 삭제) · 스나이핑 **0.4배속 당기기 → `_2` shoot1 1.5배속**(원작 신궁은 석궁 shoot2 지만 이 월드 궁수 무기는 활 · 재시작이 안 돼도 0.4배속 클립의 발사 프레임이 1초 근처) · 폭풍의 화살 0.5배속 → `_2` **shoot1** 1.5배속(shootF 에서). 표 62 → **61행**(B 54).
- ② `SkillProjectile.AimPointOf(target)`: 대상 **HitComponent 콜라이더 중심**(발 + `ColliderOffset` · A 의 `Monster.FitHitboxToSprite` 가 stand 클립 크기·피벗으로 맞춘 값 · `BoxSize.y > 0` 일 때)을 매 프레임 노린다 · 없으면 발 + `TargetAimOffsetY` **0.5 → 0.3**. 예전엔 발 + 0.5 를 노려 손 높이(스폰 0.5)에서 수평으로 날아 버섯·달팽이(≈0.4 높이) 머리 위를 지나갔다. 명중 이펙트(`OnAttack`)도 같은 점(예전 발 + 0.5). 같은 투사체를 쓰는 에너지볼트·럭키 세븐·스나이핑도 몸통 중심으로 간다.
- ③ 예전 스나이핑 cast = 얼티밋 스나이핑 `special`(640×294 · 가로 줄기): 썸네일 프레임을 보면 **핵이 왼쪽 끝 · 줄기가 오른쪽으로 뻗고 후반 불덩이가 왼→오로 이동 = 오른쪽을 보고 그려진 클립** → 왼쪽 기준 뒤집기(FlipX = 오른쪽 볼 때)가 정반대로 걸려 양쪽 다 뒤로 나갔다. 이 브랜치의 새 팩 effect(3221007 · 조준 문양 + 왼쪽으로 퍼지는 빛살)·ball(화살촉 왼쪽)은 원작 관례대로 왼쪽 기준 → 지금 규칙으로 앞을 향한다. 예외용 spec `nativeRight = true`(오른쪽 기준 클립 → 뒤집기 반전)를 `PlayStageEffect` 에 추가 — 새 조준 연출이 뒤로 나가면 그 한 칸.
- 🟡 Play 미검증(사용자 확인): 입장 `[Motion] weapon motion table loaded: 61 rows` · Q 활 한 번 쏘기 + 화살 2발이 몬스터 몸통으로 내려가며 명중 · W 키 입력 순간 조준 문양이 앞쪽 + `aim marker SK_A21 on …` → 1초 뒤 큰 화살이 앞으로 · `motion sequence SK_A21 weapon=BOW steps=1/1` · R 컷신 뒤 서 있기.
