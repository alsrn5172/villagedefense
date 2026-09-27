# b/skill-pirate-effects — 해적 스킬 정리 (기획 표 대조 · 원작 기준 기본값 · 참고 영상 실측)

## 9차 (2026-09-28 · 에너지 쉴드 아이콘 = 디펜스 폼 · 그림과 같은 팩)

- `SkillInfo.csv` SK_P22 `IconRUID`: `9868d220…`(제로 이뮨 배리어 101120109 icon) → **`3cbfb551f77049f3bff4aa4f5eee047e`**. 바꾼 것은 그 한 줄의 `IconRUID` · `#Note` 뿐이다. BOM · CRLF · 33 열은 그대로다.
  - 이 RUID 는 바이퍼 디펜스 폼 `skill/512.img/skill/5120011` 팩의 `icon` 원소다(`iconDisabled` · `iconMouseOver` 가 아님). 에너지 쉴드 그림(`repeat` 51d514ea… · `end` 693d4c4e…)과 같은 팩이다.
  - 리소스 라이브러리 확인(2026-09-28): sprite · category skill · 32×32(예전 아이콘과 같은 종류 · 크기). 이 RUID 를 가진 팩은 5120011 하나뿐이다. 태그: 너클 엑스퍼트 · 카운터 어택(KMS 359 에서 이 id 의 이름).
- 8차 때 "아이콘은 그대로" 라고 적은 것은 사용자 결정이 아니었다. 핸드오프 · 원장 · 메모리에 제로 아이콘을 남기라는 결정이 없어서 그림과 맞췄다(사용자 지시).
- 코드는 바뀌지 않았다. 스킬 창은 CSV 의 `IconRUID` 를 그대로 쓰고, 다른 곳에 예전 RUID 를 적어 둔 코드도 없다.
- 확인: `check-integrity` 통과(경고 4 = main). `.mlua` 는 바뀌지 않아 LSP 는 필요 없다.

### Play 체크리스트 (9차 추가)

14. 스킬 창의 에너지 쉴드 칸에 **새 아이콘**(디펜스 폼 5120011 icon `3cbfb551…`)이 보인다. 미리보기: https://mod-resource-search-images.dn.nexoncdn.co.kr/maplestory_world/3cbfb551f77049f3bff4aa4f5eee047e.png. 예전 제로 이뮨 배리어 아이콘(`9868d220…`)이 아니다. Lv1 · Lv5 양쪽에서 같은 아이콘이다(키 − 로 레벨 전환). 툴팁의 수치는 P8 그대로다.

## 8차 (2026-09-28 · 낡은 주석 · 메모 정리 · 동작 변화 없음)

2026-09-27 에 그림을 바꾸고도 예전 팩을 "지금" 으로 적어 둔 글을 고쳤다. 코드 · 값 · CSV 의 #Note 말고 다른 열은 그대로다. 값은 코드와 `design-handoff/pirate-refs/library/pirate-library.md`(라이브러리 조회 기록)로 하나씩 확인했다.

- `Skill/SkillExecutors.mlua` 머리 주석(에너지 쉴드): 제로 이뮨 배리어 방울 → 바이퍼 디펜스 폼 5120011 (repeat 0~12 한 번 → 13~20 반복 · end). 끝 연출 · 숨김 규칙은 그대로다.
  - 층 이름 repeat / end 는 KMS 389 WZ 와 프레임 단위로 일치한다(`defense_form_proof.txt`). 0~12 지연 합은 1110ms 로 `startDelay 1.11` 과 같다.
- SK_P21 차지 블록 주석: 공격 그림 = 피스트 인레이지 VI 5141000(effect 16f · 최대 740×464 · effect0 16f · 584×364 · hit/0 8f · 188×192). 예전 4차 5121020 은 356×200 · 177×178 였다.
  - "effect0 쓰지 않음" 은 4차 팩(66d87241…) 이야기다. VI 의 effect0(90d4195a…)은 발밑 겹이라 쓴다.
- SK_P31 머리 주석: 폭탄 = 드레드노트 자기 팩 hit/0 72cef21e…(15f · 424×348 · 흩뿌림 ×0.6 · 대상 ×1 · 파마다 3발). 시전 소리 = 배틀쉽 봄버 Use.
- `SkillInfo.csv` #Note(SK_P21 · SK_P22 · SK_P31 세 줄만. 헤더 · 다른 열 · 도적 행은 그대로):
  - SK_P21: 공격 그림 VI · 예전 4차 RUID · 쿨 시작 = 시전 순간.
  - SK_P22: 지금 팩(디펜스 폼)을 앞에 적었다. **아이콘은 제로 이뮨 배리어 9868d220… 그대로**다. 예전 = 제로 이뮨 배리어 / 키네시스.
  - SK_P31: 폭탄 72cef21e… · 소리 686297b9… / 8fd7da62…(배틀쉽 봄버 Use / Attack1) · 파 간격 0.58s. 예전 = 354977ce… · 38dd6c9b….
- PR 본문의 #100 충돌 확인 해시: `9fd50f0` → `e6128f3`. 2026-09-28 에 `git merge-tree` 로 다시 확인했고, 여전히 두 곳이다(`SkillExecutors` 단계 목록 · `SkillAttack` impact).
- 확인: LSP · `check-integrity`. Play 는 필요 없다(주석 · 메모만 바뀌었다).

## 7차 (2026-09-27 · 연출 변경 · 섬머솔트 킥 회전 = 원작 자세 순서 · 사용자 영상에 맞춤)

**연출 변경(원작 = 연출 기준 · 사용자 영상에 맞춤).** 사용자 제보: Round 9 에서 회전이 부자연스럽다(그 빌드는 main 판 · #116 없음 · 마법사 창 확인).

| 시각(시전 뒤 s) | 원작 · 영상 | main(Round 9 에서 본 것) | #116 6차까지 | **7차** |
|---|---|---|---|---|
| 0 ~ 0.15 | 웅크림 → 발 뜸 +0.03 · 발차기 섬광 +0.067 · 피해 +0.10 · 똑바로 | 오르기 · 똑바로 | 오르기 · 똑바로 | 0° → 142°(뒤로 넘어가기 시작) · 몸 +0.33 |
| 0.20 | **거꾸로(180°)** · 몸 가운데 +0.42 | 0.20~0.36 한 바퀴 360°(0.16s) | 똑바로 | **180°** · +0.42 |
| 0.20 ~ 0.60 | **거꾸로 매달린 채**(원작 swingP2 3프레임) | 똑바로 · 내려옴 | 0.27~0.44 한 바퀴 360°(0.16s) | 180° → 200°(아주 천천히) · +0.42~0.45 |
| 0.60 ~ 0.68 | 270° → 똑바로 착지 +0.68 | 끝(0.48) | 똑바로 · 내려옴 | 270°(+0.65 · +0.49) → 360° 착지 +0.68 |

- 원인: 두 판 모두 한 바퀴를 0.16초에 몰아 돌아(main `spinFraction 0.4 × 0.4s` · 6차 `0.25 × 0.65s`) 원작의 "거꾸로 매달림 ≈0.4초"가 없다. 6차는 회전이 피해(+0.10)보다 한참 뒤(+0.27~0.44)였다.
- 고침: `effectOverrides.SK_P11.backflip.keys` = `{ 초, 각도, 몸 가운데 추가 높이 }` 6개 → `BackflipClient` 가 구간마다 smoothstep 으로 잇는다(keys 가 없으면 예전 한 바퀴 그대로). 회전 중심(centerY 0.35) · 바라보는 쪽 부호 · 제자리(driftX 0) · 피해 +0.10 · 시전 락 0.7 · 판정 · 크기는 그대로.
- 근거: 원작 바디 액션 KMS 389 `Character/00002000.img/somersault`(참고만 · 가져오지 않음): swingPF 60 → swingT2 90 → swingP2 ×3 = 180° · move y −112~−115px → stabT2 270° · −84px → swingPF 210 · y 0. 영상(29.97fps · 옛 클라 7 × 120ms): 거꾸로 +0.20~+0.60 · 똑바로 +0.68. 높이 = 원작 move 로 계산한 몸 가운데(거꾸로 ≈ 발 위 0.77 · 270° ≈ 0.84) − centerY 0.35.
- 일부러 둔 것: 거꾸로 동안 180 → 200 으로 조금 돈다(원작은 그동안 다리 자세가 바뀐다 · 우리 아바타는 swingPF 한 자세라 완전히 멈추면 굳어 보인다) · 착지는 원작처럼 0.03초에 내려온다.
- main 에서 2·3번째 킥이 HP 를 안 깎은 것(Round 9 · 마법사 창 제보 · 뒤로 밀림 0.35 가 원인으로 추정 · 확인 안 됨)은 #116 에선 밀림이 0 이다 — 합동 확인 체크리스트 1.12 로 본다.

### Play 체크리스트 (7차 추가)

13. 섬머솔트 킥 회전(양쪽 방향): 로그 `BACKFLIP facing=… keys 6 to +0.68s` · 뛰어오르며 뒤로 넘어가 **+0.20 부터 거꾸로 매달리고** +0.60 까지 천천히만 돈다 → +0.65 옆으로 누운 자세 → +0.68 똑바로 착지 · 빠른 한 바퀴 blur 가 없다 · 연타해도 이전 회전이 원위치로 돌아온 뒤 새로 시작.

## 6차 (2026-09-27 · 이름 표기 = 기획 표 `vd-audit/Docs/skill-spec.md`)

**표에 맞춰 변경 (skill-spec.md), commit `7d45dc8`**

도적 창의 표 → 코드 감사에서 나온 해적 두 곳. 규칙: 기획 표가 이긴다. 1차에서 이름을 맞춘 "기획 표"는 세션 지시문에 붙어 온 **번역 표**였고 skill-spec.md 와 이 두 이름만 달랐다(수치 · 해금 레벨 · 쿨타임 · 지속시간은 전부 같음).

| 무엇 | 전 → 후 | 어디(플레이어에게 보이는 곳) |
|---|---|---|
| A 슬롯 이름 | 써머솔트 킥 → **섬머솔트 킥** (skill-spec.md:45 · 1차 전 값으로 되돌림) | `SkillInfo.csv` SK_P11 SkillName → 스킬창 · 퀵슬롯 · 툴팁 |
| C 재시전 공격 이름 | 피스트 인 레인지 → **피스트인레인지** (skill-spec.md:47 · 띄어쓰기 없음) | `SkillWindowLogic.RecastAttackNames.ENERGY_CHARGE` → 툴팁 데미지 줄 · `SkillInfo.csv` SK_P21 Description |

- 주석 · CSV #Note · 이 변경 기록도 같은 표기로 바꿨다. 코드 식별자(변수 · 함수 · 속성 · 키 이름)는 원래 영문이라 바뀐 것이 없다.
- 일부러 둔 것: 원작 WZ 팩 이름 `400004134 써머솔트 킥 강화`(`SkillExecutors.mlua` 36 · 630 · 790 · 803 · `SkillInfo.csv` SK_P11 #Note) — 우리 스킬 이름이 아니라 외부 리소스의 실제 이름이고 #116 전부터 있던 줄이다. 원작 스킬 `피스트 인레이지`(Fist Enrage · 다른 낱말)도 그대로. 위 1차 표의 두 줄은 이력이라 취소선으로 남겼다.

## 5차 (2026-09-27 · 탈락 이벤트 구독 뺌)

| 무엇 | 전 → 후 | 근거 |
|---|---|---|
| 탈락 때 숫자 간격 | A 의 `PlayerEliminatedEvent` 를 받아 곧바로 되돌림 → **구독 없음 · 감시의 보통 만료가 되돌린다**(마지막 주먹 +≈1.73s · 0.1s 주기) | A 의 탈락 경로(`LaneStateService.Eliminate` → `SpectateService.Enter` · `MatchSessionLogic.OnPlayerEliminated` → `BalrogRoomService.OnEliminated`)는 엔티티를 **숨기고 멈추기만** 한다(SetVisible false · 조작/피격 끔 · 중력 0 · Neutral) — HP · IsDead · 엔티티 그대로, ResetMatchState 안 탐. 감시 타이머는 SkillExecutors 것이라 계속 돈다 → 0.12 가 남는 길이 없다 |

- `DelayPerAttack` 을 쓰는 곳 조사(원격 브랜치 27개 전부): 런타임에 쓰는 곳은 이 PR 의 `SkillExecutors` 뿐. 나머지는 모델 초기값(`Global/DefaultPlayer` `damageDelayPerAttack` 0.05 · `Global/Player` 속성 정의 · 모든 브랜치 같음)뿐이고 `_DamageSkinService` 를 부르는 스크립트도 없다 → 창 안에서 우리 되돌리기가 남의 값을 덮는 경우 없음.
- A 의존: 이제 A 의 이벤트를 받지 않는다. 남은 연결은 A 가 이미 부르는 우리 `SkillBuffs.ResetMatchState` 한 줄뿐.

## 4차 (2026-09-27 · 숫자 간격 되돌리기 안전하게 · 낡은 주석)

| 무엇 | 전 → 후 | 위치 |
|---|---|---|
| 숫자 간격 되돌리기 | 주먹마다 타이머 1개(token 이 맞으면 되돌림) → **플레이어마다 기록 1개 + 감시 타이머 1개**(0.1s · `PunchSkinWatchInterval`). 되돌리는 곳은 `RestorePunchDamageSkinDelay` 한 곳 | `SkillExecutors.ApplyPunchDamageSkinDelay` · `WatchPunchDamageSkinDelay` · `RestorePunchDamageSkinDelay` |
| 연타 | 되돌릴 시각을 늦추기만 한다(max) · 원래 값은 기록이 없을 때 한 번만 적는다 → 일찍 되돌리지도, 0.12 를 남기지도 않는다 | 같은 곳 |
| 사망 | 감시가 HP 0 또는 `IsDead()` 를 보면 곧바로 되돌린다(≤0.1s) | `WatchPunchDamageSkinDelay` |
| 엔티티 제거 · 엔티티 바뀜 | 없어졌으면 기록만 버린다(값을 들고 있던 컴포넌트도 없어짐) · 같은 유저의 새 엔티티면 옛 기록을 정리하고 새 엔티티 값으로 새로 적는다(`Entity.Id` 비교) | 같은 곳 |
| 매치를 떠남 | 포기 · 로비로 · 접속 끊김 · 새 매치 시작 = A 의 `MatchResetService.ResetUser` → **`SkillBuffs.ResetMatchState`** 에서 곧바로 되돌린다 | `SkillBuffs.ResetMatchState` |
| 탈락(관전으로) | ~~A 가 보내는 계약 이벤트 `PlayerEliminatedEvent`(`_LaneStateService`)를 받아 곧바로 되돌린다~~ → 5차에서 뺌(보통 만료가 되돌린다) | — |
| 룸 종료 | `OnEndPlay` 가 남은 기록을 전부 되돌리고 타이머를 멈춘다 | `SkillExecutors.OnEndPlay` |
| 낡은 주석 5곳 | 함포 사격 간격 0.45s → 0.58s · "상자 안 전부" → 대상 상한(섬머솔트 6 · 피스트 4 · 함포 15) · 에너지 차지 쿨타임 = 시전 순간 | `SkillExecutors.mlua` |

- 창 안의 다른 숫자: 간격은 공격한 **엔티티**마다 하나라 창(≈1.7s) 안에 같은 플레이어가 쓴 다른 여러 숫자 공격도 0.12s 간격으로 뜬다. 해적은 함포 사격 파(숫자 5개)뿐이다 — 섬머솔트 킥 · 기본 공격은 숫자 1개라 차이가 없다. 몬스터가 플레이어를 때린 숫자는 몬스터 값이라 그대로. 표시만 바뀌고 피해는 판정 때 한 번에 들어간다 → 그대로 둔다.
- A 파일 변경 없음.

### Play 체크리스트 (4차 추가)

12. 숫자 간격 되돌리기: ① 연타 2번 → `spacing 0.12s … until +1.73s` 두 줄 뒤 `restored 0.05 (done …)` **한 줄** ② 주먹 직후 죽기 → `restored 0.05 (death …)` ③ 주먹 직후 로비로/포기 → `restored 0.05 (match reset …)` ④ 주먹 직후 탈락 → 마지막 주먹 +≈1.73s 에 `restored 0.05 (done …)`(5차 · 관전 중에도 감시가 돈다) ⑤ 그 뒤 기본 공격 숫자 간격 0.05.

## 3차 (2026-09-27 · 피스트인레인지 기본값 되돌림 · #114 `615bcb9` 위로 rebase)

| 무엇 | 전 → 후 | 근거 | 위치 |
|---|---|---|---|
| 피스트인레인지 판정 | 기본 `PunchSequenceHits = true`(판정 10번 × 표 %) → **기본 false**(첫 타 +0.23s 에 판정 1번 × (표 % × 10) = 표 합계 · 함포 사격과 같은 방식). 10타 경로는 스위치 뒤에 그대로 | 사용자 결정: 판정 1번 × 10 도 표 합계와 같다 · 진짜 10타는 A 의 무적 예외 뒤 | `SkillExecutors.PunchSequenceHits` |
| 피스트인레인지 숫자 간격 | 숫자 10개 0.05s 간격(플레이어 모델 `DelayPerAttack` 0.05) → **0.12s**(폭발 간격과 같게) | 엔진은 공격별 간격이 없고 공격한 엔티티의 `DamageSkinSettingComponent.DelayPerAttack`(@Sync)만 있다 → 주먹 한 번 동안만 시전자 값을 0.12 로 바꾸고 마지막 숫자 뒤(+hitDelay + 10 × 0.12 + 0.3s) 원래 값으로 되돌린다(연타는 되돌리는 시각만 민다) | `SkillExecutors.PunchDamageSkinDelay` · `ApplyPunchDamageSkinDelay` |
| 폭발 10번 | 0.12s 간격 연출 그대로 | — | `punchImpact.repeatInterval` |

- 그 사이(주먹 한 번 ≈1.5s) 같은 플레이어의 다른 여러 타 공격 숫자도 0.12s 간격으로 뜬다(예: 그 안에 쓴 함포 사격 파 5타). `PunchDamageSkinDelay = 0` 이면 건드리지 않는다.
- rebase: `7c719ee` → #114 현재 `615bcb9`(픽파켓 기본 공격 드랍을 명중일 때만 · A/B 파일 겹침 없음).

### Play 체크리스트 (3차 추가)

11. 피스트인레인지(기본): 로그 `punch damage-skin spacing 0.12s (was 0.05)` → `… restored 0.05` · 대상마다 HP 가 **한 번** 준다(= 표 % × 10) · 숫자 10개가 폭발 10번과 같이 0.12s 간격으로 뜬다 · 연타해도 마지막 주먹 뒤에만 0.05 로 돌아온다 · 끝난 뒤 기본 공격 숫자 간격 0.05.

## 2차 (2026-09-27 · 사용자 결정 + 피해 검산)

| 무엇 | 전 → 후 | 근거 | 위치 |
|---|---|---|---|
| 섬머솔트 킥 이동 | 뒤로 0.70 → **제자리(driftX 0)** · 나머지(시간 · 판정 1.7/0.9/1.85 · 6명 · 크기) 그대로 | 사용자 결정 "원작대로 제자리" · 원작 5001002 는 캐릭터 좌표 이동 없음 | `SkillExecutors` SK_P11.backflip |
| 섬머솔트 킥 이펙트 자리 | offsetX −0.33 **그대로** | 재확인: 영상 2번째 시전(9.36~9.99s · 왼쪽 봄)은 이름표·카메라가 가만히 있는 동안(world x 310±1px) 잰 값 = 밀림 없음. 1번째 시전(오른쪽 봄 · 밀리는 중)도 호가 몸 기준 −0.38~+0.73 캐릭터 키에 붙어 따라간다(부착) | — |
| 에너지 쉴드 그림 | 제로 이뮨 배리어 101120109 → **바이퍼 디펜스 폼 5120011 한 팩**: cast = repeat `51d514ea` 0~12 한 번 · loop = repeat 13~20(1.11s 뒤 · 새 `loop.startDelay`) · loopEnd = end `693d4c4e` · 원본 크기 · 발 기준 · 좌우 대칭 | 사용자 결정. 라이브러리 이름은 "오펜스 폼" 이지만 KMS 389 5120011 repeat 20/21 · end 12/12 프레임이 크기·pivot 일치 · 지연 합 1830/960ms · repeatIdx 13 · KMS 359/360 엔 repeat/end 없음(`design-handoff/pirate-refs/library/defense_form_proof.txt`) | `SkillExecutors` SK_P22 · `PlayBuffLoop`/`RemoveBuffLoop` |
| 에너지 쉴드 소리 | 시전 = 이뮨 배리어 Pre `5d388814` → **엔젤릭버스터 파워 트랜스퍼 Use `b86f0000`** · 터짐 = 이뮨 배리어 End `26311ed7` → **없음** | 디펜스 폼 팩엔 소리 없음 · 가장 가까운 해적 보호막 스킬 소리 · 깨지는 해적 소리는 라이브러리에 없음 | `castSounds` · `extraSounds` |
| 피스트인레인지 피해 | 누름 1번 = 대상마다 **판정 1번 × (표 % × 10)** (+0.23s · 숫자 10개가 0.05s 간격 · 폭발 10번은 연출만) → **판정 10번 × 표 %** (+0.23s 부터 0.12s 간격 · 폭발 1번 = 타격 1번 · 대상은 첫 타 때 고정) | 사용자 요청 "폭발 10번이 각각 1타" · 합계는 같다(표 30%x10 → 50%x10) | `SkillExecutors.ExecuteChargePunch` · `PunchSequenceHits` · `SkillAttack.SnapshotTargets`/`DealSequenceHit`/`BaseSkillId` |
| 함포 사격 피해 | **변경 없음** — 파마다 대상마다 판정 1번 × (150% × 5) · 숫자 5개 · 6파 = 30 × 150% = 4500% | 표와 같다 | — |

- ⚠ **A 필요:** 몬스터 무적 0.4s(`Faction/MonsterHit.mlua:26`)가 있는 동안 0.12s 간격 타격은 1·5·9번째만 들어간다(3 × 표 %). 2~10번째 타격은 attackInfo = `SK_P21#k` 로 보낸다 — A 가 `IsHitTarget` 에서 `#` 이 붙은 attackInfo 만 무적 시간을 건너뛰면 10타 전부 들어간다(#40). 예외 전에 Play 할 때는 `SkillExecutors.PunchSequenceHits = false` 로 예전 방식(판정 1번 × 10).
- 툴팁 문구는 바뀌지 않는다("피스트인레인지 데미지 30% x 10타").

### Play 체크리스트 (2차 추가)

8. 섬머솔트 킥: 제자리(위치 로그 · 발판 끝 아님) · 이펙트가 몸에 맞게 붙는지 양쪽 방향.
9. 에너지 쉴드: 원반 → 방울(0~12) → 1.11s 뒤 반복(로그 `buff loop effect SK_P22 … started after 1.11s`) · 깨지면 end · 첫 1.11s 안에 깨져도 end 가 나오고 반복이 안 걸리는지 · 방울 크기(캐릭터를 감싸는지) · 시전 소리.
10. 피스트인레인지: 로그 `PUNCH SEQUENCE SK_P21 targets=N hits=10 every 0.12s` + `sequence hit SK_P21` · `SK_P21#2` … `#10` · 대상 HP 가 몇 번 줄어드는지(A 예외 전 = 3번 · 뒤 = 10번) · 폭발 10번이 타격과 같은 때.

## 1차 (2026-09-27)

기반: #114 `7c719ee`(= origin/main `3b6c972` + PlayerAttack 버프 훅). **로컬 커밋만(push · PR 전).**
기획 질문 + A 훅 제안 = #40 5849880738. 답이 올 때까지 원작 메이플(가장 최신 공식 판) 기준 기본값이고, 값마다 상수 한 곳이다.
원작 근거(WZ 경로 · 나무위키 현재판)와 영상 실측 · 라이브러리 비교는 저장소 밖 `design-handoff/pirate-refs/`(research-original.md · video-frames/ · library/ · pirate_comparison_sheet.png).
**런타임 확인 없음** — 월드가 Round 9 에 쓰이는 중. 아래 Play 체크리스트는 다음 라운드.

### 기획 표와 대조

| 슬롯 | 표 | 코드 | 결과 |
|---|---|---|---|
| A 섬머솔트 킥 | 10 · 125% → 275% | ReqLevel 10 · BaseEffect 125 + 37.5/레벨 | 같음. ~~**이름만** `섬머솔트 킥` → `써머솔트 킥`~~ → 6차에서 되돌림(표 skill-spec.md = `섬머솔트 킥`) |
| B 선원 관리 | 10 · 15% → 35% | 10 · 15 + 5/레벨 | 같음. 적용점(A 파일)이 아직 없음 → #40 훅 제안 |
| C 에너지 차지 + 피스트인레인지 | 20 · 30%×10 → 50%×10 · 지속 30 · 쿨 60 | 20 · 30 + 5/레벨 · HitCount 10 · 30 · 60 | 같음. 툴팁에 공격 이름 "피스트인레인지" 추가 |
| D 에너지 쉴드 | 20 · 최대 HP 10% → 30% · 쿨 30 | 20 · 10 + 5/레벨 · 30 | 같음 |
| 궁 함포 사격 | 30 · 150% × 30 | 30 · 150 · HitCount 30 | 같음 |

해금 레벨: 해적 10/10/20/20/30 = 전사·마법사·궁수와 같다. 다른 곳은 도적 D(쉐도우 파트너) 30 하나(도적 표 그대로 · 안 바꿈).

### 바꾼 것

| 스킬 | 무엇 | 전 → 후 | 근거 | 위치 |
|---|---|---|---|---|
| 섬머솔트 킥 | 이름 | ~~섬머솔트 킥 → 써머솔트 킥~~ → 6차에서 되돌림 | ~~기획 표~~ 세션 지시문의 번역 표였다 — 기획 표 `vd-audit/Docs/skill-spec.md` 는 `섬머솔트 킥` | `SkillInfo.csv` SK_P11 |
| 섬머솔트 킥 | 판정 | 앞 2 × 높이 1.5 · 상한 없음 → **앞 1.7 · 뒤 0.9 · 위 1.85 · 최대 6명** | 원작 최신 KMS 360~389 lt(-170,-185) rb(90,5) · mobCount 6 | `SkillExecutors` `effectOverrides.SK_P11.box` · `skillTargetCaps` |
| 섬머솔트 킥 | 백덤블링 | delay 0.08 · 0.4s · 피해 0.2s · 뒤로 0.35 → **0.03 · 0.65s · 피해 0.10s · 뒤로 0.70(0.45s 동안 · 새 `driftSeconds`)** · 한 바퀴 0.16s 는 그대로(spinFraction 0.4 → 0.25) | 사용자 영상 실측(시전 2.700s · 발 뜸 +0.03 · 피해 숫자 +0.10 · 착지 +0.317 · 멈춤 +0.48 · 똑바로 섬 +0.68 · 뒤로 1.02 캐릭터 키) | `SkillExecutors` SK_P11 backflip · `PlayBackflip`/`BackflipClient` |
| 섬머솔트 킥 | 시전 락 | 0.6 → **0.7** | 영상 +0.68 | `SkillCaster.castLockOverrides` |
| 섬머솔트 킥 | 크기·자리 | cast scale 1 · offsetX −0.95 → **0.56 · −0.33** · hit scale 1 → **0.5** (새 `SkillAttack.PendingImpactScale`) | 영상 9.46s 호 0.9 × 1.65 캐릭터 키 ↔ 팩 effect 2~4 프레임 | `SkillExecutors` SK_P11 |
| 피스트인레인지 | 그림 | 4차 피스트 인레이지 5121020(주황 · 2021 모습) → **피스트 인레이지 VI 5141000**(effect + effect0 + hit/0 · 2023 · 라이브러리 최신) | 영상 64.8~66.4s(VI)와 같은 그림 · 2022 데스티니 그림은 라이브러리에 없음 | `SkillExecutors` SK_P21 · `SkillCaster.castLockClips` |
| 피스트인레인지 | 타이밍 | 피해·폭발 시전 즉시 1번 → **+0.23s 에 피해 한 번 · 대상마다 폭발 10번 × 0.12s**(연출만 · 새 `PendingImpactRepeat`) | 영상 VI 첫 구체 +0.233 · 폭발 10번 65.067…66.167 | `ExecuteChargePunch` · `SkillAttack.OnAttack` |
| 피스트인레인지 | 대상 | 상자 안 전부 → **최대 4명**(가까운 순) | 원작 VI mobCount 4(기본 4차판 3) | `skillTargetCaps.SK_P21` |
| 에너지 차지 | 쿨타임 시작 | 변신이 끝날 때 → **시전 순간**(스위치 `cooldownStartsAtBuffEnd.SK_P21 = false`) | 원작 트랜스폼 · 슈퍼 트랜스폼 · 라이트닝 폼 모두 사용 순간부터 · 예전 값은 B 구현 선택(def1e43)이었다 | `SkillCaster` · `SkillBuffs.EndChargeState` |
| 에너지 차지 | 툴팁 | "데미지 30% x 10타" → "**피스트인레인지** 데미지 30% x 10타" · 쿨타임이 버프 끝에서 시작하는 스킬은 "(지속시간이 끝난 뒤부터)" | 기획 표 이름 | `SkillWindowLogic` · `SkillInfo.csv` 설명 |
| 함포 사격 | 파 간격 | 0.45 → **0.58**(첫 파 1.0 · 마지막 ≈3.9s) | 원작 드레드노트 풍랑 1.02~3.9s | `SkillExecutors.BarrageInterval` |
| 함포 사격 | 대상 | 원 안 전부 → **파마다 최대 15명** | 원작 mobCount 15 | `skillTargetCaps.SK_P31` |
| 함포 사격 | 그림 | 폭탄 = 배틀쉽 봄버 hit(4차) → **드레드노트 hit/0**(흩뿌림 x0.6 + 맞은 대상마다 x1) | 컷신과 같은 2023 오리진 · 원작은 대상 위 hit | `SkillExecutors` SK_P31 |
| 함포 사격 | 시전 소리 | `38dd6c9b`(태그 = 드라코 슬래셔 Hit · 해적 소리 아님) → **배틀쉽 봄버 Use `686297b9`** | 드레드노트 · HEXA 팩엔 소리 없음 | `SkillExecutors.castSounds` |
| 선원 관리 | B 적용 함수 | 없음 → `JobPassiveLogic.ApplyJobCost(uid, sink, base)` = 내림 · 최소 1 · 본인 패시브만 | B 의 MP 배율과 같은 내림(`SkillCaster.mlua:226`) | `Job/JobPassiveLogic.mlua` |

- 대상 상한은 B 파일만으로: `SkillAttack.CapTargetsByShape` 가 같은 모양으로 probe → 시전자에게 가까운 순서 N명 → `IsAttackTarget` 이 그 목록만 통과 → AttackFast 1회(피해 ×N · 표시 N타 그대로). 상한 0 = 예전 동작.
- A 파일 · 계약서 · CSV 헤더 변경 없음. CSV 는 해적 행의 이름·설명·#Note 만.

### 그대로 둔 것 (일부러)

- 섬머솔트 킥 그림(400004134 = 모험가 5001002 그림 · 지금 라이브) — 영상은 옛 파랑·흰 판이라 색·모양이 다르다. CharLevel 15/20/25 색 변형도 안 씀.
- 섬머솔트 킥 뒤로 이동 0.70 — 원작(공식)은 **제자리**다. 영상(옛 클래식 판)과 2026-09-14 사용자 요청이 뒤로 이동이라 둠. 원작대로 = `driftX 0`.
- 에너지 차지 이동속도 +22→30% · 점프력 +11→15%(2026-09-24 기획 OK) · 레벨 티어 불꽃 3종(원작 변신 몸 스프라이트는 라이브러리에 없음).
- 에너지 쉴드 로직(깨질 때까지 · 재시전 = 새로 채움 · 쿨 시전 순간 · 순서 무적 → 다크 사이트 → 보호막 → 하이퍼 바디 → 매직 가드)과 그림(제로 이뮨 배리어 · 2026-09-13 사용자 선택).
- 피스트인레인지 소리(4차판 · VI 팩엔 소리 없음) · 판정 Range 3(원작 앞 3.2 와 거의 같음) · 시전 락 = 클립 길이(원작 액션 딜레이 780ms 와 비슷).
- 함포 사격 반지름 8 · 시전 락 3.5 · 컷신(드레드노트 screen · 임시 · mp4 교체 예정) · 원작의 15초 함선 추가 폭격(기획 표에 없음).

### Play 체크리스트 (Round 9 뒤)

1. 섬머솔트 킥: 뒤로 ≈0.7 유닛 밀림 · 벽/발판 끝에서 이상 없음 · 피해 +0.10s · 앞 1.7 · 뒤 0.9 안의 몬스터 최대 6마리 · 로그 `target cap SK_P11 max=6 inShape=… chosen=…` · 이펙트 크기(x0.56)와 자리(offsetX −0.33 · 양쪽 방향) · hit x0.5 · 똑바로 서는 시점 = 락 0.7.
2. 피스트인레인지: 변신 중 W → VI 휩쓸기 + effect0 · +0.23s 에 피해 · 대상 위 폭발 10번 · 최대 4마리 · 로그 `CHARGE PUNCH … hitDelay=0.23 cap=4` · 시전 락 로그 `clip lock SK_P21_RECAST = …s (382ee512…)` · 방향 뒤집기.
3. 에너지 차지 쿨: 시전 즉시 쿨 60 시작(`CastResult … cd=60`) · 변신 중 W 재입력 계속 됨 · 변신 끝 로그 `ENERGY_CHARGE state end (cooldown started at cast …)` · 끝난 뒤 30초 뒤 재사용.
4. 툴팁: 에너지 차지 = "피스트인레인지 데미지 …" · "쿨타임 60초"(괄호 없음 = 시전 순간) · 섬머솔트 킥 이름.
5. 함포 사격: 파 6개 1.0 → 3.9s(`BARRAGE … every 0.58s`) · 파마다 최대 15마리 · 대상 위 드레드노트 hit · 흩뿌린 폭탄 크기 · 시전 소리 = 배틀쉽 봄버.
6. 선원 관리: A 연결 전엔 변화 없음(로그 `[JobPassive] cost …` 없음). 연결 뒤 재료 8 → 6/5 · 꿈의 조각 내림.
7. 빌드 경고 before → after · 런타임 새 경고 0.
