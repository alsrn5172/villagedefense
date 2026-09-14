# b/skill-pirate-motion — 해적 스킬 캐릭터 애니메이션 · 섬머솔트 킥 원작 계열 팩 · 표 재대조 (B)

> Draft PR #58 `[b/skill-pirate-motion] 해적 스킬 캐릭터 애니메이션 — 섬머솔트 킥·슈퍼 트랜스폼·에너지 쉴드·함포 사격 · 섬머솔트 킥 원작 계열 팩 · 표 재대조` · base `b/skill-thief-motion`(PR #57 · 스택 — 도적 편의 `PlayMotion` / `ResolveMotionRow` / `GetMotionSequence(skillId, skillData)` / `PlayShadowMimic` 위에 얹는다). 이 브랜치의 조각 로그. 릴리스 때 `Docs/CHANGELOG.md` 로 합친다(협업-규칙 §11).
> 근거: 사용자의 해적 표 이미지("해적 — 오래 버티는 자" · 2026-09-13) · 요청 "표대로 재확인 · 원작과 같거나 비슷하게 · 공격 스킬은 공격 동작 · 비공격 스킬은 사용이 보이는 동작". 계약 변경 없음(새 표·열·열거값·이벤트 없음 · `WeaponMotion.csv` 는 A 표에 B 행 추가/B 행 값 변경만). #55 마법사 · #56 궁수 · #57 도적 편과 같은 형태의 해적 편.

## 2026-09-13 — 해적 5종 표 재대조 · 캐릭터 애니메이션 · 섬머솔트 킥 팩 교체

- `origin/main` 은 이 브랜치의 base 가 이미 담고 있다(사용자 지시 "main 먼저 pull" · `git fetch` 결과 새 커밋 0 → 병합 커밋 없음).
- 표(해적 · 이미지판 · 해금/효과/Lv.1→5) 대조 — **CSV 값 변경 0**(`SkillInfo.csv` 는 SK_P11 의 IconRUID·#Note 만):

| 슬롯 | 표 | CSV / 코드 | 결과 |
|---|---|---|---|
| A 섬머솔트 킥 Q · 해금 10 | 백덤블링하며 공격 · 125% → 275% | ReqLevel 10 · BaseEffect 125 · +37.5/lv(Lv5 275) · 앞쪽 Range 2 상자 전부(`ExecuteMeleeArc`) · 맞은 대상마다 hit 클립 | ✅ (백덤블링 = 이번 편 swingPF 모션) |
| B 선원 관리(패시브) · 10 | 모집·훈련 재화 절감 · 15% → 35% | 10 · RATIO 15 · +5/lv(Lv5 35) · `JobPassiveLogic.GetJobCostMul`(A 의 CostResolver 적용점 대기 · #54 그대로) | ✅ |
| C 슈퍼 트랜스폼 W · 20 | 변신 · 이동속도·점프력 증가 · 지속 중 누르면 전방 다수에 주먹 · 지속 30초 · 쿨 60초 · 300~500% | 20 · Duration 30 · Cooldown 60 · BaseEffect 300 · +50/lv(Lv5 500) · Secondary 30 = 속도·점프 +30%(표에 수치 없음 · TENTATIVE 그대로) · 재시전 = 앞쪽 Range 3 상자 주먹(`ExecuteTransformPunch`) | ✅ |
| D 에너지 쉴드 E · 20 | 최대 체력에 비례한 쉴드 · 쿨 30초 · 최대 체력의 10~30% | 20 · HP_PCT 10 · +5/lv(Lv5 30) · Cooldown 30 · Duration 0 = 깨질 때까지 | ✅ |
| 궁 함포 사격 R · 30 | 광역 연속 폭격(컷신 · 캡틴 오리진 추천) · 150% × 30회 | 30 · 150 · HitCount 30 · 6파 × 5타 · 드레드노트(캡틴 오리진 5241500) 컷신 · UseLimit 1 | ✅ |

- **원작 팩 재검색**(msw-search 리소스 API · 2026-09-13): **`skill/40000.img/skill/400004134` 써머솔트 킥 강화(해적 계열 VI)** 가 새로 잡혔다 — effect 7프레임 103×130 · hit/0 5프레임 66×72 · Use/Hit 사운드 · CharLevel/10~25 변형. 썸네일 프레임을 펼쳐 비교하니 **그림은 예전 스트라이커 15001002 와 같고**(크기·프레임 수·모양 동일) 아이콘만 다르다(VI = 해적 원작 붉은 발차기 · 스트라이커 = 초록). 해적 원작 500.img/5001002 는 여전히 색인에 없으므로 같은 계열인 이쪽으로 교체: `SkillInfo.csv` SK_P11 `IconRUID` 16475656… · `effectOverrides.SK_P11` cast 3c5e92e9… / impact 66301df4… · `castSounds` 85398b7f… / `extraSounds.hit` 1b54e033…. 슈퍼 트랜스포메이션(512.img)·에너지 차지 계열은 여전히 색인에 없음 → 라이트닝 폼 + 스크류 펀치 · 싸이킥 실드 그대로.
- **캐릭터 애니메이션** — `RootDesk/MyDesk/WeaponMotion.csv`(A 표 · B 행 추가/B 행 값 변경만 · 헤더·A 행 불변 · 협업-규칙 §2-1): KNUCKLE 행 5 → **16**(표 62 → **73행**) + `SkillExecutors.GetMotionSequence` 해적 3종. 검(나무 검)을 든 해적·맨손 해적도 `ResolveMotionRow` ②(직업 기본 무기 KNUCKLE 의 스킬 전용 행)로 재생된다(#55).
  - 액션 이름 근거: 쉐도우 파트너 팩(4111002)의 `special/<action>` 썸네일 실루엣(GIF 프레임을 System.Drawing 으로 펼쳐 확인 · #57 과 같은 방법) — **`swingPF` = 웅크림 → 다리를 들고 뛰어오름 → 착지(4프레임)**, `swingP1` = 잽(팔을 앞으로), `swingP2` = 훅(팔을 뒤로 뺐다가 앞으로). 아바타엔 백덤블링(회전)이 없으니 뛰어오르는 swingPF 가 표 "백덤블링하며 공격" 에 가장 가깝다.
  - 섬머솔트 킥 `SK_P11`(공격): 시전 행 **swingPF 1배속** 한 동작(#54 의 "미검증 후보" 를 실루엣으로 확정 · 시전 락 0.5). 순서 없음.
  - 슈퍼 트랜스폼 `SK_P21`(변신 = 비공격): 전사 버프·매직 가드와 같은 순서 — **heal 1.5배속 ZigzagLoop**(시전 락 0.6 동안 · 라이트닝 폼 시전 이펙트와 같이) → `_2` 1.0 alert 2.5배속 → `_END` 1.6 **stand1**(너클 = 한손 분류). 예전 행 = alert 1배속 Onetime(피격 HIT 와 같아 보이는 자세). 원작 슈퍼 트랜스포메이션은 몸이 통째로 바뀌는 연출이라 아바타에 없음 → 틴트 + 라이트닝 폼 루프(#54) 그대로.
  - 변신 중 재시전 `SK_P21_RECAST`(주먹 = 공격): **swingP2 훅 1.2배속**(시전 락 0.6 안 · 스크류 펀치 이펙트와 같이). 순서 없음 — `SkillExecutors.Execute` 가 실행기보다 **먼저** `IsRecastCast`(recastAttack + BuffTag 활성 · ExecuteBuff 의 분기와 같은 조건 · 한 메서드로 합침)로 순서 id 를 `SK_P21_RECAST` 로 바꿔 넘긴다. 예전엔 재시전 뒤에도 변신 순서(`_2` alert · `_END` stand)가 붙었을 것(주먹 1.0s 뒤 전투 자세 → 1.6s 서 있기). 변신 뒤 1.6s 안에 바로 주먹을 치면 변신 순서의 `_2`/`_END` 는 취소되지 않고 그대로 흐른다(주먹 뒤 서 있기 복귀 = 무해).
  - 에너지 쉴드 `SK_P22`(비공격): 같은 순서(1.0 / 1.6 · 시전 락 0.6 · 싸이킥 실드 보호막 루프가 몸을 감싼다). 예전 행 = alert Onetime.
  - 함포 사격 `SK_P31`(공격 · 컷신): 시전 행 **alert**(드레드노트 컷신 아래 자세 · 그대로) → **폭격 파마다 주먹**: `_2` ~ `_7` 을 `ExecuteBarrageOrigin` 과 같은 시점(첫 파 = CSV Duration 1.0 · 이후 `BarrageInterval` 0.45 간격 · 파 수 = `BarrageWaves` 6 · HitCount 상한)에 — 잽 swingP1 2배속 / 훅 swingP2 2배속을 번갈아(같은 액션 재전송의 재시작 여부가 🟡 미확인이라 파마다 다른 액션) · 마지막 6파(3.25s) = **swingPF 1.5배속** 피니시 → `_END` 5.5 stand1. 드레드노트 screen 79프레임은 세이크리드 바스티온(89프레임 ≈4.8s 실측) 비례로 ≈4.3s 추정 — 컷신이 걷히면 피니시의 마지막 프레임이 잠깐 보이고 5.5s 에 서 있기. `GetMotionSequence` 가 파 수·간격을 실행기 상수(`BarrageWaves`/`BarrageInterval`)에서 읽으므로 상수를 바꾸면 모션도 같이 옮겨 간다(행은 `_2` ~ `_7` 6개 — 파를 늘리면 행도 추가).
  - 선원 관리 `SK_P12` 는 패시브(시전 없음) → 행 없음. 너클 기본 행 `MOTION_KNUCKLE`(swingO1 · A 행)은 그대로(#54 부터 swingP1 권장 · A 판단).
- 🟡 **Play 미검증**(사용자가 직접 확인 · MCP 는 요청 시에만 · 2026-09-13 지시). 확인 항목(기대 로그 · 해적 Lv30 DEV 세팅 · 너클 장착 권장 · 검을 들거나 맨손이어도 KNUCKLE 행으로 재생):
  - 입장: `[Motion] weapon motion table loaded: 73 rows` · `cutscene prewarm x5`(변화 없음)
  - Q 섬머솔트 킥: `motion sequence` 없음 · 웅크렸다 뛰어오르는 피니시 한 번 + 붉은 발차기 아이콘(K 창) + 같은 노란 호 이펙트 · 맞은 대상마다 hit 클립 · Use/Hit 소리(팩이 바뀌어 소리가 조금 다를 수 있음)
  - W 슈퍼 트랜스폼(첫 시전): `[Buff] ON SUPER_TRANSFORM` · `motion sequence SK_P21 weapon=KNUCKLE steps=2/2` · 손 들기 왕복 → 빠른 전투 자세 → 서 있기 · 틴트 + 라이트닝 폼 루프
  - W 재시전(변신 중): `TRANSFORM PUNCH SK_P21` · 훅 한 번 + 스크류 펀치 이펙트 · **`motion sequence` 로그 없음**(순서 id `SK_P21_RECAST` = 항목 없음) · 주먹 뒤에 전투 자세/서 있기가 새로 붙지 않는다
  - E 에너지 쉴드: `[Buff] ON ENERGY_SHIELD` · `motion sequence SK_P22 weapon=KNUCKLE steps=2/2` · 손 들기 왕복 → 빠른 전투 자세 → 서 있기 · 보호막 루프
  - R 함포 사격: `BARRAGE SK_P31 scheduled 6 waves` · `motion sequence SK_P31 weapon=KNUCKLE steps=7/7` · 컷신 아래 1.0s 부터 0.45s 마다 잽/훅(안 보일 수 있음) · 컷신이 걷힌 뒤 피니시 마지막 프레임 → 5.5s 서 있기(컷신 길이를 스크린샷 시각으로 재면 `_END` 조정)
  - 빌드: 오류 0 · 경고 수 기존과 같음(PR 본문 "build warnings: N before → N after" 에 기입)
  - Maker 가 열린 채 파일을 복사했다 → Play 전에 **Reimport All**(CSV 는 Reimport 없이 Play/종료하면 메모리 사본으로 되돌아간다 · 협업-규칙 §5).

### 2026-09-13 — 사용자 요청 ② "섬머솔트 킥은 원작처럼 백덤블링 · 슈퍼 트랜스폼은 원작(황금 불꽃 형태 · 표 오른쪽 이미지)처럼 · 나머지도 최대한 원작대로"

- **섬머솔트 킥 = 진짜 백덤블링.** 메이커 아바타엔 회전하는 액션이 없다(14 상태 + 무기 액션 · swingPF 는 뛰어오르기만) → `SkillExecutors.PlayBackflip(caster, spec)` → `BackflipClient(uid, facing, delay, seconds, height, centerY)` **Multicast**: 모든 클라에서 그 유저의 **아바타 루트 엔티티**(`AvatarRendererComponent:GetAvatarRootEntity()` · 몸·머리·파츠 전부 · 플레이어 루트가 아니라 물리·발판 판정엔 영향 없음)의 `TransformComponent.ZRotation` 을 facing × 360° 돌리고, `Position` 을 회전 중심 보정(발이 아니라 몸 가운데 `centerY` 0.35 위 축: (c·sinθ, c·(1−cosθ))) + 포물선(`height` 0.45 · 4p(1−p))으로 옮긴 뒤 원래 값으로 되돌린다(`BackflipTickSeconds` 0.02 마다 · `backflipClientState[uid]` · 연타면 이전 것을 원위치로 되돌리고 새로). 방향 = 오른쪽을 볼 때 +360(반시계 = 머리가 뒤로 넘어간다) · 왼쪽 −360. `effectOverrides.SK_P11.backflip = { delay 0.08, seconds 0.4, height 0.45, centerY 0.35, hitDelay 0.2 }` — WeaponMotion 의 swingPF(웅크림 → 뛰어오름 → 착지)와 같이 돈다. **피해는 `hitDelay` 0.2s 뒤**(회전 중 발차기가 뜨는 시점 · `ExecuteMeleeArc` 가 타이머로 · 상자는 시전 순간 위치). `SkillCaster.castLockOverrides.SK_P11` 0.5 → **0.6**(회전이 끝날 때까지 못 움직이게). 🟡 미검증 항목: 아바타 루트 pivot 이 발인지(발이면 centerY 0.35 가 맞고, 이미 몸 가운데면 0) · 렌더러가 매 프레임 루트 Transform 을 덮어쓰는지(덮어쓰면 회전이 안 보인다 → body 엔티티(`GetBodyEntity`)로 한 칸) · 회전 방향이 뒤집혀 보이면 `facing * 360` 의 부호.
- **슈퍼 트랜스폼 = 황금 불꽃 형태.** 원작 슈퍼 트랜스포메이션의 변신 몸(Morph 스프라이트)은 MSW 라이브러리 색인에 **없다**(슈퍼 트랜스포메이션/트랜스포메이션/변신/morph/황금 변신 검색 → 해적선·몬스터·아이콘뿐 · 512.img 팩 없음). 근사: ① 아바타 틴트를 라이트닝 폼 푸른빛(0.6/0.85/1.0)에서 **황금(1.0/0.82/0.2)** 으로(`SkillBuffs.TransformTint*`) ② 변신 루프를 라이트닝 폼 주황 고리(8fb4311e…)에서 **황금 불꽃 루프 `bebd39c5…`**(카이저 팩 `skill/6114.img/skill/61141006` 의 `mob/1/loop` · 152×148 · 12프레임 · 몸에 붙는 불꽃 오버레이라 좌우 대칭 noFlip)로 — `effectOverrides.SK_P21.loop = { offsetY 0.35, scale 0.7 }`(pivot 은 오프라인에서 못 읽어 가운데로 가정 · 발에 붙거나 크면 이 두 값). 시전 이펙트(라이트닝 폼 황금 번개 기둥 69f4c505…)·스크류 펀치 주먹·속도/점프 +30% 는 그대로. ③ 컷신(함포 사격 R) 동안 루프가 컷신 위에 그려지는 문제는 분신과 같은 방식으로 `HideTransformLoopFor(uid, seconds)`(루프 내림 → 컷신 뒤 남은 버프 시간만큼 `PlayBuffLoop("SK_P21")` · `transformRestoreTimers`). 원작처럼 몸이 커지는 것(아바타 루트 Scale)은 안 넣었다 — 필요하면 백덤블링과 같은 Multicast 로 한 칸.
- **나머지 재확인:** 함포 사격은 캡틴 오리진 드레드노트 컷신 + 배틀쉽 봄버 폭탄(표 "캡틴 오리진스킬 추천" 그대로) · 에너지 쉴드는 원작에 없는 스킬(가장 가까운 싸이킥 실드 보호막 + 51111004 시전 그대로) · 선원 관리는 패시브. 섬머솔트 킥 팩은 위 ①(400004134 해적 계열).
- 🟡 Play 미검증 추가 항목(아래 ③ 으로 일부 갱신): Q → 로그 `BACKFLIP facing=±1 delay=0.08 seconds=0.4 height=0.45` · 캐릭터가 웅크렸다 **한 바퀴 뒤로 돌며** 뛰어오르고 제자리에 착지 · 피해 숫자는 회전 중(0.2s) · 다른 플레이어 화면에서도 회전이 보인다(Multicast) · W → 아바타가 황금색 + 몸을 감싸는 황금 불꽃(로그 `buff loop effect SK_P21 SUPER_TRANSFORM`) · 변신 중 R → `transform loop hidden for cutscene 5.5s` → 컷신 뒤 `buff loop effect SK_P21 … for <남은 초>s`.

### 2026-09-13 — 제보 ③ 섬머솔트 킥 이펙트 위치 · 슈퍼 트랜스폼 "캐릭터 자체가 빛나게" · 에너지 쉴드 고리 위치

- 제보 셋(사용자 Play 뒤): ① "섬머솔트 킥 이펙트가 캐릭터 앞이 아니라 서 있는 자리에 나와야" ② "슈퍼 트랜스폼은 참고 이미지처럼 캐릭터 자체가 빛나야지, 머리를 덮는 이펙트는 안 된다" ③ "에너지 쉴드 효과가 원작 것인가? 고리가 몸을 감싸지 않고 위로 떠 상체 근처에 있다".
- **프레임 pivot 을 이제 읽을 수 있다**: msw-search 리소스 API `getResource(<clip ruid>)`(단건)가 `payload.frames[].pivot {x, y, nx, ny}`(픽셀 · 왼쪽 아래 원점 · nx/ny = 폭·높이 비율)를 준다(`getResourcesBatch` 는 안 준다). 이걸로 세 자리를 계산했다(추측 아님).
- ① 섬머솔트 킥 팩 effect 는 pivot 이 그림 **바깥 오른쪽**(f3 156×216 · (177, 5) · 발 높이)이라 원작 배치 그대로면 발차기 호가 **앞쪽 0.2~1.8 유닛**에 그려진다(원작도 앞에 나가는 호). → `effectOverrides.SK_P11.cast.offsetX = −0.95`(바라보는 쪽 기준 뒤로 0.95 · `PlayStageEffect` 가 facing 을 곱한다) 로 호의 가운데가 몸에 오게. 세로(발부터 위로)는 그대로.
- ② 셰이더 없이 "캐릭터 자체가 빛나게" 할 수 있는 것: 아바타 틴트는 곱셈이라 원래보다 밝아지지 않고(어두운 옷은 어두운 채) · 오버레이 라이트(`_OverlayLightService`)는 ClientOnly + 어두운 맵 전용 + 열거값 미문서 · 머티리얼(`AvatarRendererComponent.ChangeMaterial`)은 Maker 에서 `.material` 을 만들어 속성 기본값을 받아야 한다(오프라인 불가 · `msw-general/references/material.md`). → 조합: (a) 틴트를 더 밝은 금색 **1.0 / 0.9 / 0.4** 로(`SkillBuffs.TransformTint*`) (b) 황금 불꽃 루프를 **플레이어 뒤 층**(`loop.sortBehind` → `ApplyShadowSorting` · 발판 층 + OrderInLayer 2 · 분신과 같은 층 · 대칭이라 facing 살피기는 없음)에 몸을 감싸는 크기로(pivot (79,46)/152×148 → `offsetY 0.15 · scale 0.8` = 발 아래 0.2 ~ 머리 위 0.9) — 머리·얼굴을 덮지 않는다 (c) 같은 불꽃을 몸 위에 **반투명 한 겹**(`loopFront` · `Alpha 0.35` · scale 0.7 · `PlayBuffLoop` 가 태그 `#front` 키로 같이 걸고 `StopBuffLoop`/만료가 같이 지운다) → 캐릭터가 황금빛으로 일렁인다. 앞 겹이 여전히 거슬리면 `loopFront` 한 줄을 지우거나 alpha 를 낮춘다.
- ③ **원작 아님.** 에너지 쉴드는 원작 메이플에 없는 스킬(해적에 보호막 스킬이 없다)이라 #54 에서 키네시스 **싸이킥 실드**(`skill/14210.img/skill/142100004` special 루프)를 빌렸고, 시전 이펙트·소리는 `skill/5111.img/skill/51111004`(팩 이름 靈魂抗性 · 한글 이름 없음). 위치: special 프레임 pivot (90,47)/176×176 = 그림 가운데보다 41px 아래 → `offsetY 0.6` 이면 고리 중심이 발 위 1.0 에 떠 있었다(제보 그대로). → `scale 0.6`(지름 1.06 · 아바타 ≈ 0.7) + `offsetY 0.1` 로 고리 중심 = 몸통 0.35. 원작에 맞추고 싶은 스킬이 따로 있으면(예: 버커니어 에너지 차지 오라 — 색인에 없음) 팩만 바꾸면 된다.
- 🟡 Play 미검증(사용자 확인): Q 이펙트 호가 몸을 지나간다(앞으로 치우치면 −0.95 를 −0.8 로 · 뒤로 치우치면 −1.1) · W 뒤 불꽃이 캐릭터 **뒤**에 몸 크기로 + 캐릭터가 밝은 금색 + 몸 위 옅은 불꽃(로그 `buff loop effect SK_P21 SUPER_TRANSFORM` 한 줄 · 앞 겹은 로그 없음) · E 고리가 몸통을 감싼다.

### 2026-09-13 — 제보 ④ 슈퍼 트랜스폼 "불꽃 이펙트는 빼고 캐릭터만 빛나게" · 에너지 쉴드 "격자무늬 말고 다른 것"

- **슈퍼 트랜스폼 = 아바타 틴트만.** 황금 불꽃 루프(뒤 층 + 앞 겹)를 전부 뺐다(`effectOverrides.SK_P21` 의 `loop`/`loopFront` 삭제). 대신 `tintPulse = { a = {1.0, 0.9, 0.4}, b = {1.8, 1.6, 0.7}, seconds = 0.35 }` — `PlayBuffLoop` 가 루프 없이도 `StartTintPulse` 를 걸어 `AvatarRendererComponent.SetColor` 를 두 색 사이에서 왕복시킨다(Client 메서드라 서버 호출 = 전 클라 · `SkillBuffs.SetAvatarAlpha` 와 같은 경로). b 는 1 을 넘는 값: 엔진이 안 자르면 원래보다 밝은 금백색으로 **빛나고**(글로우), 자르면 (1,1,0.7) 연노랑 ↔ 금색 왕복 — 어느 쪽이든 "캐릭터 자체" 만 변한다. 타이머는 `buffLoopEffects[uid][태그 .. "#pulse"]` 에 두고 `RemoveBuffLoop`(재시전·컷신 숨김)와 `StopBuffLoop`(버프 종료 · `SkillBuffs.OnBuffEnded` → 흰색 복구가 먼저) · duration 만료가 지운다.
  - 사용자가 낸 대안 "쉐도우 파트너 방식으로 캐릭터를 복제해 그 복제에 불꽃": 쉐도우 파트너 팩의 `special/*` 실루엣은 **검은 스프라이트**라 이펙트 `Color` 옵션(곱셈)으로 금색이 되지 않는다 → "검게 타는 그림자" 가 되어 참고 이미지(황금 형태)와 멀어진다. 그래서 틴트 왕복을 택했다(황금 실루엣 클립이 색인에 있으면 그때 분신 방식으로 한 칸).
- **에너지 쉴드 = 제로 이뮨 배리어 방울.** 제보의 "격자무늬" 는 키네시스 **싸이킥 실드**(`142100004 special` · 육각 격자 고리)로, 원작 메이플의 이펙트이긴 하지만 해적 보호막이 아니라 빌린 것이었다. → `skill/10112.img/skill/101120109` 이뮨 배리어(제로 · 캐릭터를 감싸는 반투명 구 · pre/loop/end 3단 + Pre/End 소리): `cast = effect_ple/pre 7aa944dc…`(방울이 생김) · `loop = effect_ple/loop 19694b83…` · **`loopEnd = effect_ple/end 224122b4…`**(방울이 터짐 · 보호막이 소진돼 버프가 끝날 때 `StopBuffLoop` 가 한 번 + `extraSounds.SK_P22.finish` End 소리) · `castSounds.SK_P22` = Pre. 셋 다 pivot 이 그림 가운데보다 ≈10px 위 → `scale 0.85 · offsetY 0.45` 로 구의 중심 = 몸통. `SkillInfo.csv` SK_P22 `IconRUID` 도 이뮨 배리어 아이콘(9868d220…)으로.
  - 배선: `StopBuffLoop(userId, buffTag)`(SkillBuffs.OnBuffEnded 가 부르는 것 · 시그니처 그대로)는 이제 `RemoveBuffLoop` + 끝 연출 · 내부의 재시전/컷신 숨김/분신 따라하기는 `RemoveBuffLoop` 를 직접 써서 방울이 재시전마다 터지지 않는다. 시전 `pre`(≈1.2s) 와 `loop` 가 겹치는 1초는 방울이 조금 진하게 보인다(허용).
- 🟡 Play 미검증(사용자 확인): W → 불꽃 없이 캐릭터가 금색 ↔ 밝은 금색으로 0.35s 마다 일렁임(로그 `tint pulse SUPER_TRANSFORM every 0.35s for 30s`) · 30초 뒤 흰색 복구 · E → 몸을 감싸는 연노랑 방울 + Pre 소리 · 맞아서 보호막이 0 이 되면 방울이 터지며 End 소리(로그 `buff loop end effect SK_P22 ENERGY_SHIELD`) · E 재시전 땐 터지지 않고 새로 걸림 · K 창 아이콘 = 이뮨 배리어.

### 2026-09-13 — 제보 ⑤ 백덤블링 속도 · 슈퍼 트랜스폼 "불꽃 캐릭터를 기본 외형으로 · 재시전엔 앞쪽 공격 이펙트"

- 제보: ① "섬머솔트 킥 회전이 부자연스럽다 → 속도를 줄여라" ② "슈퍼 트랜스폼은 앞의 여러 적을 치니 공격 이펙트를 캐릭터 앞에" ③ "재시전 때 뜨는 불꽃 모양 캐릭터를 변신하자마자 기본 외형으로 · 재시전엔 앞쪽 공격 이펙트".
- ① `effectOverrides.SK_P11.backflip` seconds 0.4 → **0.65** · hitDelay 0.2 → **0.35**(회전 중간) · `SkillCaster.castLockOverrides.SK_P11` 0.6 → **0.8**(회전 0.08+0.65 가 끝날 때까지). 더 느리게 하려면 seconds 와 락을 같이 올린다(락 ≥ delay + seconds).
- ②③ 스크류 펀치 effect(`4f97bf6a…` · 10프레임)의 프레임을 펼쳐 보니(`sheet_punch.png`) **0~2프레임 = 불타는 황금 캐릭터**(88~92×112~120 · pivot 발 높이 · 거의 가운데 · 원작 슈퍼 트랜스포메이션 형태 그대로) · **3~6 = 나선 펀치 궤적**(384~424 × 128~140 · pivot x 78~95 = 앞쪽 끝 · 캐릭터 그림은 anchor 뒤 ≈3.1 유닛 — 원작은 앞으로 돌진한 끝 지점에 anchor) · 7~9 = 흩어짐. 그래서 재시전 때 궤적이 캐릭터 **뒤**로 뻗고 불꽃 캐릭터가 3 유닛 뒤에 떴었다(제보 ②의 원인).
  - **변신 기본 외형** = `SK_P21.loop = { 스크류 펀치 effect, startFrame 0, endFrame 2, followFacing }` — `PlayBuffLoop` 가 `EffectService` options `StartFrameIndex/EndFrameIndex` 로 0~2프레임만 아바타 위에 반복(변신 순간부터 30초 · 그림이 왼쪽을 보므로 facing 에 따라 FlipX · `followFacing` 이 분신과 같은 `EnsureShadowFacingPoll` 로 돌아설 때 새 쪽으로 다시 건다). 황금 틴트 왕복(tintPulse)은 그대로 아래에서.
  - **재시전 공격 이펙트** = `punchCast = { 같은 clip, startFrame 3, endFrame 6, offsetX 2.5, scale 0.8 }` — 궤적 프레임만 앞으로 2.5 유닛 옮겨(그림의 캐릭터 부분이 시전자 위에 오고) 궤적이 **앞쪽 0~3.1 유닛**(Range 3)으로 뻗는다. `PlayStageEffect` 의 부착 분기에도 startFrame/endFrame 옵션을 넣었다. 맞은 대상마다 punchImpact(129×115 · pivot 가운데)는 그대로.
  - 컷신(함포 사격 R) 동안은 `HideTransformLoopFor` 가 불꽃 캐릭터·틴트 왕복을 내리고 컷신 뒤 되건다(그대로).
- 🟡 Play 미검증(사용자 확인): Q 회전이 0.65s 로 느려지고 피해 숫자가 회전 중간에 · W → 즉시 캐릭터 위에 불타는 황금 캐릭터(0~2프레임 반복 · 좌우로 돌면 따라 뒤집힘 · 로그 `buff loop effect SK_P21 SUPER_TRANSFORM` + `shadow re-anchored behind` 는 돌아설 때) · W 재시전 → 궤적이 **앞으로** 3 유닛 뻗고 뒤에는 아무것도 안 뜬다 · 프레임 범위 옵션이 안 먹으면(전체 10프레임이 돈다) 이 두 옵션 키 이름을 EffectService.d.mlua 로 재확인.

### 2026-09-13 — 제보 ⑥ 백덤블링 원래 속도 복원 + 부자연스러운 원인 한 가지 · 슈퍼 트랜스폼 "원래 캐릭터를 불꽃 캐릭터로 교체"

- **백덤블링 속도 복원**: seconds 0.65 → **0.4** · hitDelay 0.35 → **0.2** · 시전 락 0.8 → **0.6**(제보 ⑤ 이전 값).
- **부자연스러웠던 원인(진단)**: 회전각이 **선형**(처음부터 끝까지 같은 각속도)이라 첫 틱(0.04s)에 이미 36° 기울어 — 점프는 그때 겨우 0.16 유닛 떠 있다 — **땅에 선 채로 뒤로 넘어가기 시작**했고, 360° 에서 뚝 멈춰 착지 직전까지 최고 속도로 돌았다. 진짜 백덤블링은 떠오르면서 기울기 시작해 정점에서 가장 빠르게 돌고 착지하며 바로 선다.
  - **고침(작은 조정 한 가지)**: `BackflipEase = true` — `BackflipClient` 가 회전각 진행에만 smoothstep(q = p²(3−2p))을 건다. 점프 포물선·시간·높이·피해 시점은 그대로. 비교: p = 0.1 에서 예전 36° → 지금 10° · p = 0.5 에서 둘 다 180°(정점) · p = 0.9 에서 예전 324° → 지금 350°. 예전 느낌으로 돌리려면 `BackflipEase = false` 한 줄.
- **슈퍼 트랜스폼 = 불꽃 캐릭터만**: `SK_P21.loop.hideAvatar = true` — `PlayBuffLoop` 가 루프를 건 뒤 `AvatarRendererComponent.SetAlpha(0)`(전 클라 · 다크 사이트의 `SkillBuffs.SetAvatarAlpha` 와 같은 호출)로 원래 캐릭터를 숨기고, `RemoveBuffLoop(userId, buffTag, keepAvatarHidden)` 가 버프 종료(`StopBuffLoop`)·컷신 숨김 때 알파 1 로 되돌린다(재시전·돌아섬의 재걸기는 `keepAvatarHidden = true` 로 깜빡임 없이 유지). 틴트 왕복(tintPulse)은 안 보이므로 뺐다(spec 주석에 되돌리는 한 줄).
  - 한계: 원작 변신 몸의 걷기·공격 프레임은 팩에 없어 불꽃 캐릭터(스크류 펀치 effect 0~2프레임 · 서 있기)가 **미끄러지듯** 이동하고, 주먹(swingP2)·백덤블링 회전 같은 아바타 모션은 변신 중 보이지 않는다. 좌우는 followFacing 이 0.1s 마다 맞춘다.
- 🟡 Play 미검증(사용자 확인): Q 가 떠오르며 기울기 시작해 착지하며 바로 선다(0.4s) · W → 원래 캐릭터가 사라지고(로그 `avatar hidden under buff loop SUPER_TRANSFORM`) 불꽃 캐릭터만 · 좌우로 돌면 불꽃 캐릭터가 뒤집힌다 · 30초 뒤 원래 캐릭터 복구(로그 `avatar shown again after buff loop`) · 변신 중 R 컷신 뒤에도 다시 숨겨진다.

### 2026-09-13 — 제보 ⑦ 타협안 "원래 아바타는 희미하게" · 원작 슈퍼 트랜스포메이션 대조로 부자연스러운 부분 정리

- **타협안**: `SK_P21.loop.hideAvatar = true`(알파 0) → **`avatarAlpha = 0.35`** — `PlayBuffLoop` 가 `SetAlpha(avatarAlpha)`(hideAvatar 는 0 과 같음 · 전 클라), `RemoveBuffLoop` 가 1 로 복구(재시전·돌아섬은 유지). 희미한 아바타 덕에 주먹(swingP2)·백덤블링 회전·걷기가 불꽃 아래로 비친다.
- **원작 대조로 고친 것**(원작 슈퍼 트랜스포메이션 = 캐릭터 자리에 더 큰 황금 형태 · 꺼지지 않는 불꽃 · 바라보는 쪽 · 속도/점프 상승 · 30초):
  - ① 루프 프레임 **0~2 → 1~2**: 0프레임은 페이드인(희미)이라 매 주기(≈0.45s)마다 형태가 어두워졌다 — 원작은 일정한 불꽃. 1↔2 는 둘 다 밝고 윤곽만 조금 달라 자연스러운 일렁임.
  - ② **위치**: 1~2프레임 pivot (25,10)/(13,11) 이 그림 왼쪽·아래에 있어 불꽃 캐릭터 가운데가 anchor 보다 21~29px **뒤**, 발이 ≈10px **아래**(바닥에 박힘)였다 → `offsetX 0.25`(바라보는 쪽 앞 · PlayBuffLoop 가 facing 을 곱한다) · `offsetY 0.1`.
  - ③ 그대로 둔 것: 크기 ≈1.15 유닛(아바타 0.7 · 원작처럼 커진 형태) · followFacing(0.1s) · 속도/점프 +30% · 30초/쿨 60(표) · 시전 = 라이트닝 폼 황금 번개 기둥.
  - 한계(팩에 없는 것): 변신 몸의 걷기·점프·공격 프레임 → 이동 중 불꽃 캐릭터는 미끄러지고, 재시전 주먹은 궤적(3~6프레임)만. 백덤블링 때 불꽃은 돌지 않는다(루프는 플레이어 루트에 붙고 회전은 아바타 루트).
- 🟡 Play 미검증(사용자 확인): W → 로그 `avatar alpha 0.35 under buff loop SUPER_TRANSFORM` · 불꽃 캐릭터가 아바타 위에 정확히 겹치고(앞·뒤로 치우치면 offsetX ±0.1) 발이 바닥에 · 매 주기 어두워지지 않음 · 30초 뒤 `avatar shown again` · 희미한 아바타로 주먹 모션이 비친다.

### 2026-09-13 — 요청 ⑧ 궁 무적 정리: "전사는 컷신 뒤 8초 HP 100% + 무적 시간 절반 · 다른 직업은 컷신 동안 단순 피격 무시"

- 바탕: `b/skill-thief-motion` cf9fcf1(전 직업 궁 시전 중 무적 · `SkillCaster.BeginCastInvulnerability` · `SkillBuffs.castInvulnUntil/IsCastInvulnerable` · `PlayerHit.OnHit` 건너뜀)을 이 브랜치에 병합(49be649 · 충돌 없음). 그 구현은 창 길이가 **시전 락**(전사 1.5 · 나머지 3.5)이라 컷신(4.3~7.2s)을 다 덮지 못했고, 전사는 피격 무시 1.5s + 시전부터 8초 HP 고정이 겹쳤다.
- **컷신 길이를 데이터로**: `effectOverrides[궁].cast.cutsceneSeconds` — 전사 세이크리드 바스티온 **4.8**(실측) · 마법사 프로즌 라이트닝 **5.0**(92f) · 궁수 파이널 에임 **7.2**(133f) · 도적 일도양단 **4.6**(85f) · 해적 드레드노트 **4.3**(79f · 전부 89f = 4.8s 비례 추정). `SkillExecutors.GetCutsceneSeconds(skillId)`. 분신/변신 루프 숨김(`HideShadowFor`/`HideTransformLoopFor`)도 이 값을 쓴다(예전 일괄 5.5).
- **다른 직업(마·궁·도·해)**: `SkillCaster.RequestCast` 의 궁 무적 창 = **컷신 길이**(없으면 시전 락) × `GetUltimateInvulnMul`(기본 1) → 컷신 동안 피격 통째로 무시(HP·경직·넉백·표시 없음 · 로그 `[Buff] ULTIMATE invulnerable <컷신>s`).
- **전사(불굴의 진)**: `GetUltimateInvulnMul("SK_W31") = 0` → 피격 무시 창 없음. 대신 `effectOverrides.SK_W31.buffExtendsByCutscene = true` → `ExecuteOrigin` 이 INVULNERABLE 버프를 시전 즉시 **컷신 4.8 + CSV Duration 8 = 12.8초**로 건다: 컷신 내내 + 컷신 뒤 8초 동안 HP 100% 고정(`StartUnyielding` 0.1s 틱) · 경직/넉백 없음 · **피격 무적 시간 절반**(`UnyieldingImmuneMul` 0.5 · 이미 있던 값 = "무적 시간 절반" 요청) · 아이언 바디 반사 유지. 로그 `ORIGIN SK_W31 buff INVULNERABLE for 12.8s (8 + cutscene 4.8, no damage)`.
  - 해석: "전사는 컷신 뒤 8초 HP 100% · 무적 시간 절반 / 다른 직업은 **단순히** 피격 무시" 를 "전사는 피격 무시가 아니라 HP 고정 방식(컷신부터 컷신 뒤 8초까지)" 로 읽었다. 전사도 컷신 동안 피격을 무시하게 하려면 `GetUltimateInvulnMul` 의 0 → 1(전부) 또는 0.5(절반) 한 칸 · 고정을 컷신 뒤부터만 걸려면 `buffExtendsByCutscene` 대신 지연 시작(한 줄 상담).
- 🟡 Play 미검증(사용자 확인): 해적 R → `[Buff] ULTIMATE invulnerable 4.3s skill=SK_P31` · 컷신 중 맞아도 `ULTIMATE hit ignored` 만 · 컷신이 걷힌 직후부터 정상 피격 / 전사 R → `ultimate SK_W31 uses its own buff instead of cast invulnerability` + `buff INVULNERABLE for 12.8s` · 컷신 중·후 12.8초 동안 `UNYIELDING hit ignored`(HP 그대로 · 반사) · 12.8s 에 `[Buff] OFF INVULNERABLE`.

### 2026-09-13 — 요청 ⑨ 백덤블링 "회전은 빠르게 · 뛰어오르기/착지만 늘려 전체는 그대로" · 슈퍼 트랜스포메이션 애니메이션 재확인

- **백덤블링 3단 분할**: `BackflipSpinFraction`(기본 0.4) / `backflip.spinFraction` — 전체 seconds(0.4 그대로)의 **가운데 40% 동안만 한 바퀴**(0.16s · 안에서 smoothstep) · 앞 30%(0.12s)는 상승만 · 뒤 30%(0.12s)는 착지만(회전 0). 점프 포물선(height 0.45)은 전체 구간. 피해 0.2 = 회전 한가운데. `BackflipClient` 에 `spinFraction` 인자 추가(Multicast 시그니처). 1 로 두면 예전(내내 회전). 로그 `BACKFLIP … spin=0.4`.
- **슈퍼 트랜스포메이션 애니메이션 재확인(결과: 없음)**: 리소스 API 로 ① 키워드 재검색(모프 · 변신 캐릭터 스탠드 · 버커니어 변신 · 해적 4차 변신 황금 · 슈퍼 트랜스포메이션 형태 · transformation morph stand walk · 에너지 폼 변신) → 마족 모스 아이템·블루 로봇 몬스터·풍선 인형·파이널 트랜스 등만 ② **유사도 검색**(`findSimilarResources`)을 불꽃 캐릭터가 든 스크류 펀치 effect 클립·라이트닝 폼 시전 클립으로 → 전부 불꽃/폭발 이펙트(래피드 파이어 VI keydown0 · 매그넘 샷 강화 effect 등 코세어 총기 이펙트) · 서 있는 변신 몸 없음(프레임 스프라이트는 임베딩이 없어 유사도 불가). ③ mob/etc 카테고리의 148~188px 스프라이트 후보 7종 썸네일 확인 → 전부 블루 로봇 몬스터·풍선 인형. 결론: MSW 라이브러리엔 원작 Morph(변신 몸 stand/walk/attack) 스프라이트가 없고, 불꽃 캐릭터 그림은 **스크류 펀치 effect 0~2프레임(서 있기)** 뿐 — 지금 쓰는 그대로. 걷기·공격 프레임은 만들 수 없다(그리려면 msw-painter 로 직접 그려 올려야 한다 · 별도 판단).
- 🟡 Play 미검증(사용자 확인): Q → 떠오르는 0.12s 동안 안 돌다가 정점에서 빠르게 한 바퀴, 내려오며 바로 선 채 착지 · 전체 0.4s 그대로 · 로그 `BACKFLIP … spin=0.4`.

### 2026-09-14 — 제보 ⑩ 슈퍼 트랜스폼 "깜빡이면 안 된다 · 달릴 땐 불꽃 캐릭터도 달리게" · 출처 질문

- **출처(질문 답)**: 리소스 검색 API `maplestoryworlds-resourcesearch-new.nexon.com/api/v3/search/resources`(msw-search 스킬의 `msw_resource_api.cjs`). 불꽃 캐릭터 그림은 "슈퍼 트랜스포메이션" 검색 결과가 **아니라** #54 때 검색어 **"코르크스크류 블로우"** 로 잡힌 팩 `skill/40000.img/skill/400004139` **스크류 펀치/스크류 펀치 강화**(버커니어 VI) 의 `effect` 클립(`4f97bf6a…` · 10프레임)이고, 그 0~2프레임이 변신 형태로 감아 때리기 전 자세다(썸네일 프레임을 펼쳐 확인). 변신 시전 이펙트는 검색어 "슈퍼 트랜스포메이션" 결과의 `skill/40005.img/skill/400051004` 라이트닝 폼(`69f4c505…`). "슈퍼 트랜스포메이션"·"트랜스포메이션"·"변신"·"morph"·"모프" 등으로 변신 몸(Morph) 애니메이션 자체는 잡힌 게 없다(조각 ⑨).
- **깜빡임 원인 + 고침**: 서 있기 루프가 1↔2프레임 교대였는데 두 프레임의 pivot 이 (25,10)/(13,11) 로 달라 그림이 0.15s 마다 12px 씩 튀었다(= 깜빡임). → 서 있을 땐 **1프레임 한 장**(`startFrame = endFrame = 1` · offsetX 0.21 로 그 프레임 기준 가운데 맞춤). 교대는 달리기에만 쓴다.
- **달리기 자세(runPose)**: 팩에 달리기 프레임이 없어 주기를 만들었다 — 살피기 타이머(`EnsureShadowFacingPoll` · 0.1s)가 플레이어 x 가 `minStep`(0.02) 이상 움직였으면 "달리는 중" 으로 보고 틱마다 phase 를 바꿔 `loopPose[uid] = { 1~2프레임 교대, offsetY + bobY(0.06 · 한 틱 걸러), zRot leanDeg(8° · 바라보는 쪽으로 기울기) }` 로 루프를 되건다(`PlayBuffLoop` 가 `loopPose` 를 읽어 프레임·높이·`localZRotation` 을 덮어쓴다 · 되걸기 로그 생략) · 멈추면 기본 자세로 한 번 되건다. 방향 전환은 그대로. 버프 종료·컷신 숨김(`RemoveBuffLoop` keepAvatarHidden 아님)이 상태를 지운다.
  - 한계: 서버가 보는 위치는 클라보다 반 박자 늦어 출발·정지가 ≈0.1~0.2s 늦게 반영된다 · 점프 중엔 x 가 움직이면 달리기 자세.
- 🟡 Play 미검증(사용자 확인): W → 서 있을 때 불꽃 캐릭터가 전혀 움직이지 않음(깜빡임 0) · 좌우로 달리면 위아래로 통통 튀며 앞으로 기울고 두 자세가 교대 · 멈추면 바로 서 있기 · 로그는 방향 전환 때만 `shadow re-anchored`.

### 2026-09-14 — 제보 ⑪ "깜빡이면 안 된다(재차) · 원래 캐릭터 제거 · 좌우 이동 땐 다리가 걷게" · 백덤블링 "고정점 회전 말고 뒤로 조금 이동하면서"

- **깜빡임의 진짜 원인**: `EffectService` 부착 이펙트는 자세·방향을 바꾸려면 `RemoveEffect` + `PlayEffectAttached` 로 **다시 만들어야** 해서(돌아설 때 · 달리기 되걸기 0.1s 마다) 그 순간이 깜빡였고, 1↔2프레임 교대는 pivot 차이(12px)로 튀었으며, 희미한 아바타(0.35)의 걷기가 정지된 불꽃 아래로 비쳐 어른거렸다.
- **form = 자식 sprite 엔티티(이펙트 아님)**: `SpawnBuffForm` 이 `model://skillprojectile`(SpriteRenderer + script.SkillProjectile · VisualOnly · Speed 0 · MaxLifetime = 안전망)을 플레이어 **자식**으로 하나 스폰해 변신 동안 유지한다. 방향 = `SkillProjectile.SetDirection`(Scale.x 부호) · 자세 = `SpriteRUID` 교체 · 위치 = `Position` — 전부 동기화 **속성 변경**이라 재생성이 없고 깜빡일 수 없다. `EnsureFormPoll`(0.1s)이 facing 변화와 x 이동(minStep 0.02)을 살펴 서 있으면 stand, 움직이면 walk[] 를 한 장씩(stand → a → stand → b · 2.5걸음/s) 돌린다. 원래 아바타는 `avatarAlpha 0` 으로 완전히 숨김(`SetAlpha(0)` 전 클라 · `RemoveBuffLoop` 가 1 로 복구). 컷신(함포 사격)은 `HideTransformLoopFor` 가 `SetVisible(false)` → 컷신 뒤 `SetVisible(true)`(재생성 없음). 버프 종료·재시전은 `RemoveBuffLoop` 가 엔티티를 `Destroy` + 살피기 타이머 종료. 예전 이펙트 루프 경로(loop/runPose/loopPose)는 코드에 남아 있지만 SK_P21 은 더 이상 쓰지 않는다.
- **걷기 프레임을 만들었다**(팩에 없음): 스크류 펀치 강화 effect 1프레임 sprite(f30bf46b… 92×116)를 바탕으로 PowerShell System.Drawing 으로 3장 — `flame_stand`(원본) · `flame_walk_a`(엉덩이 y74 아래를 다리 중심 x51 기준 좌우 반대로 최대 6px 가위질 + 몸 전체 2px 들썩 · 반투명 글로우는 안 움직여 이음새 없음) · `flame_walk_b`(반대). `msw-mcp` `asset_create_account_resource_storage_item`(2단계 presigned PUT) + `asset_update_resource_storage_info`(pivot_x 0.5 · pivot_y 0.0 · Bilinear · Clamp)로 B 계정 리소스에 등록: **stand `b03dd531e2274903a49f270f13571e78` · walk_a `be02babc91a9407887d70dcfb7a629c5` · walk_b `f5e29b96e40046b59f2ebd93aeb9798b`**(이름 `vd_pirate_transform_flame_*` · subcategory skill). 원본 PNG 는 스크래치 `form/out/`. 다른 계정에서 이 월드를 열 때 계정 리소스가 보이는지는 🟡 확인 필요(안 보이면 그룹 리소스로 재업로드 `asset_create_group_resource_storage_item`).
- **백덤블링 뒤로 밀림**: `backflip.driftX 0.35`(`BackflipDriftX`) — `BackflipClient` 가 **소유 클라에서만** 회전 동안 플레이어 루트를 `TransformComponent:Translate` 로 바라보는 반대쪽으로 틱마다 조금씩(합 0.35 유닛) 옮긴다(클라 위치가 서버로 동기화 · 닷지와 같은 원리 · 착지 자리가 뒤). 속도·회전 구간은 그대로.
- 🟡 Play 미검증(사용자 확인): W → 로그 `buff form SK_P21 SUPER_TRANSFORM spawned facing=±1 avatarAlpha=0` · 원래 캐릭터 안 보임 · 불꽃 캐릭터가 전혀 깜빡이지 않음 · 좌우로 움직이면 다리가 벌어졌다 모였다(2.5걸음/s) · 돌아서면 뒤집힘(재생성 없음) · 변신 중 R 컷신 동안 사라졌다가 컷신 뒤 다시 · 30초 뒤 사라지고 원래 캐릭터 복구 · Q → 회전하며 조금 뒤로 밀려 착지. 확인 포인트: 자식 엔티티가 플레이어를 따라오는지(안 따라오면 `SpawnByModelId` 의 parent 인자를 맵으로 두고 살피기에서 위치를 복사하는 대안) · 발 높이(offsetY) · 걸음 폭(6px) · 다른 유저 화면에서도 sprite 가 보이는지.

### 2026-09-14 — 제보 ⑫ "W 를 누르면 캐릭터가 사라진다"

- 관찰: 아바타는 숨겨졌는데(SetAlpha 0 은 됐다) form sprite 가 안 보였다. Maker 로그는 이 세션에서 못 읽는다(Maker 가 다른 세션의 브리지 65419 에 연결돼 있음). 업로드한 sprite 는 서버에서 처리 완료(`asset_get_account_thumbnail` available=true).
- 오프라인에서 못 가르는 원인 둘 → 둘 다 손댔다:
  - ① **플레이어 자식 스폰이 안 그려질 가능성** → 없앴다. form 을 **맵 아래**에 스폰하고(투사체와 같은 경로 · 그려지는 것이 확인된 방식) `SkillProjectile.FollowTarget/FollowOffsetX/Y`(새 속성 · 서버 OnUpdate 매 프레임 `WorldPosition = 대상 + 오프셋` · Translate 건너뜀 · 대상 소멸 시 Destroy)로 따라가게. 방향은 `SetDirection`, 자세는 `SpriteRUID`, 오프셋은 Follow 속성 — 여전히 재생성 없음.
  - ② **계정 리소스 RUID 를 그룹 월드가 못 불러올 가능성** → `TransformFormSet` 스위치(SkillExecutors 속성 · 기본 `"custom"`): `formSets.custom` = B 가 만든 걷기 3장(계정 리소스) · `formSets.official` = 스크류 펀치 effect 의 **공식** 프레임 sprite 1·2(반드시 불러와짐 · pivot 이 그림 왼쪽·아래라 항목별 `ox/oy` 로 보정: f30bf46b… ox −0.225 oy 0.05 · 9bc8d968… ox −0.285 oy 0.06 · 걷기 = 두 자세 교대라 다리 움직임은 미묘). sprite 항목 = `{ ruid, ox, oy }`(`FormSprite` 가 문자열도 받는다) · `ApplyFormSprite` 가 SpriteRUID + Follow 오프셋(× facing)을 한 번에 적용. 로그 `buff form SK_P21 SUPER_TRANSFORM set=custom ruid=… follow=map-child`.
  - 진단 절차: custom 으로 여전히 안 보이면 `TransformFormSet = "official"` 한 줄 → 보이면 계정 리소스 접근 문제(그룹 리소스로 재업로드 · `asset_create_group_resource_storage_item` · 그룹 코드 필요) · official 로도 안 보이면 sprite 엔티티 자체 문제(로그 `buff form spawn failed` 여부 · `SkillForm_*` 엔티티가 하이라키에 있는지).
- 🟡 Play 미검증(사용자 확인): W → 로그 `buff form … set=custom … follow=map-child` · 불꽃 캐릭터가 발밑에서 따라온다 · 안 보이면 위 절차.
