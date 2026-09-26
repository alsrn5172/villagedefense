# b/skill-pirate-effects — 해적 스킬 정리 (기획 표 대조 · 원작 기준 기본값 · 참고 영상 실측)

## 3차 (2026-09-27 · 피스트 인 레인지 기본값 되돌림 · #114 `615bcb9` 위로 rebase)

| 무엇 | 전 → 후 | 근거 | 위치 |
|---|---|---|---|
| 피스트 인 레인지 판정 | 기본 `PunchSequenceHits = true`(판정 10번 × 표 %) → **기본 false**(첫 타 +0.23s 에 판정 1번 × (표 % × 10) = 표 합계 · 함포 사격과 같은 방식). 10타 경로는 스위치 뒤에 그대로 | 사용자 결정: 판정 1번 × 10 도 표 합계와 같다 · 진짜 10타는 A 의 무적 예외 뒤 | `SkillExecutors.PunchSequenceHits` |
| 피스트 인 레인지 숫자 간격 | 숫자 10개 0.05s 간격(플레이어 모델 `DelayPerAttack` 0.05) → **0.12s**(폭발 간격과 같게) | 엔진은 공격별 간격이 없고 공격한 엔티티의 `DamageSkinSettingComponent.DelayPerAttack`(@Sync)만 있다 → 주먹 한 번 동안만 시전자 값을 0.12 로 바꾸고 마지막 숫자 뒤(+hitDelay + 10 × 0.12 + 0.3s) 원래 값으로 되돌린다(연타는 되돌리는 시각만 민다) | `SkillExecutors.PunchDamageSkinDelay` · `ApplyPunchDamageSkinDelay` |
| 폭발 10번 | 0.12s 간격 연출 그대로 | — | `punchImpact.repeatInterval` |

- 그 사이(주먹 한 번 ≈1.5s) 같은 플레이어의 다른 여러 타 공격 숫자도 0.12s 간격으로 뜬다(예: 그 안에 쓴 함포 사격 파 5타). `PunchDamageSkinDelay = 0` 이면 건드리지 않는다.
- rebase: `7c719ee` → #114 현재 `615bcb9`(픽파켓 기본 공격 드랍을 명중일 때만 · A/B 파일 겹침 없음).

### Play 체크리스트 (3차 추가)

11. 피스트 인 레인지(기본): 로그 `punch damage-skin spacing 0.12s (was 0.05)` → `… restored 0.05` · 대상마다 HP 가 **한 번** 준다(= 표 % × 10) · 숫자 10개가 폭발 10번과 같이 0.12s 간격으로 뜬다 · 연타해도 마지막 주먹 뒤에만 0.05 로 돌아온다 · 끝난 뒤 기본 공격 숫자 간격 0.05.

## 2차 (2026-09-27 · 사용자 결정 + 피해 검산)

| 무엇 | 전 → 후 | 근거 | 위치 |
|---|---|---|---|
| 써머솔트 킥 이동 | 뒤로 0.70 → **제자리(driftX 0)** · 나머지(시간 · 판정 1.7/0.9/1.85 · 6명 · 크기) 그대로 | 사용자 결정 "원작대로 제자리" · 원작 5001002 는 캐릭터 좌표 이동 없음 | `SkillExecutors` SK_P11.backflip |
| 써머솔트 킥 이펙트 자리 | offsetX −0.33 **그대로** | 재확인: 영상 2번째 시전(9.36~9.99s · 왼쪽 봄)은 이름표·카메라가 가만히 있는 동안(world x 310±1px) 잰 값 = 밀림 없음. 1번째 시전(오른쪽 봄 · 밀리는 중)도 호가 몸 기준 −0.38~+0.73 캐릭터 키에 붙어 따라간다(부착) | — |
| 에너지 쉴드 그림 | 제로 이뮨 배리어 101120109 → **바이퍼 디펜스 폼 5120011 한 팩**: cast = repeat `51d514ea` 0~12 한 번 · loop = repeat 13~20(1.11s 뒤 · 새 `loop.startDelay`) · loopEnd = end `693d4c4e` · 원본 크기 · 발 기준 · 좌우 대칭 | 사용자 결정. 라이브러리 이름은 "오펜스 폼" 이지만 KMS 389 5120011 repeat 20/21 · end 12/12 프레임이 크기·pivot 일치 · 지연 합 1830/960ms · repeatIdx 13 · KMS 359/360 엔 repeat/end 없음(`design-handoff/pirate-refs/library/defense_form_proof.txt`) | `SkillExecutors` SK_P22 · `PlayBuffLoop`/`RemoveBuffLoop` |
| 에너지 쉴드 소리 | 시전 = 이뮨 배리어 Pre `5d388814` → **엔젤릭버스터 파워 트랜스퍼 Use `b86f0000`** · 터짐 = 이뮨 배리어 End `26311ed7` → **없음** | 디펜스 폼 팩엔 소리 없음 · 가장 가까운 해적 보호막 스킬 소리 · 깨지는 해적 소리는 라이브러리에 없음 | `castSounds` · `extraSounds` |
| 피스트 인 레인지 피해 | 누름 1번 = 대상마다 **판정 1번 × (표 % × 10)** (+0.23s · 숫자 10개가 0.05s 간격 · 폭발 10번은 연출만) → **판정 10번 × 표 %** (+0.23s 부터 0.12s 간격 · 폭발 1번 = 타격 1번 · 대상은 첫 타 때 고정) | 사용자 요청 "폭발 10번이 각각 1타" · 합계는 같다(표 30%x10 → 50%x10) | `SkillExecutors.ExecuteChargePunch` · `PunchSequenceHits` · `SkillAttack.SnapshotTargets`/`DealSequenceHit`/`BaseSkillId` |
| 함포 사격 피해 | **변경 없음** — 파마다 대상마다 판정 1번 × (150% × 5) · 숫자 5개 · 6파 = 30 × 150% = 4500% | 표와 같다 | — |

- ⚠ **A 필요:** 몬스터 무적 0.4s(`Faction/MonsterHit.mlua:26`)가 있는 동안 0.12s 간격 타격은 1·5·9번째만 들어간다(3 × 표 %). 2~10번째 타격은 attackInfo = `SK_P21#k` 로 보낸다 — A 가 `IsHitTarget` 에서 `#` 이 붙은 attackInfo 만 무적 시간을 건너뛰면 10타 전부 들어간다(#40). 예외 전에 Play 할 때는 `SkillExecutors.PunchSequenceHits = false` 로 예전 방식(판정 1번 × 10).
- 툴팁 문구는 바뀌지 않는다("피스트 인 레인지 데미지 30% x 10타").

### Play 체크리스트 (2차 추가)

8. 써머솔트 킥: 제자리(위치 로그 · 발판 끝 아님) · 이펙트가 몸에 맞게 붙는지 양쪽 방향.
9. 에너지 쉴드: 원반 → 방울(0~12) → 1.11s 뒤 반복(로그 `buff loop effect SK_P22 … started after 1.11s`) · 깨지면 end · 첫 1.11s 안에 깨져도 end 가 나오고 반복이 안 걸리는지 · 방울 크기(캐릭터를 감싸는지) · 시전 소리.
10. 피스트 인 레인지: 로그 `PUNCH SEQUENCE SK_P21 targets=N hits=10 every 0.12s` + `sequence hit SK_P21` · `SK_P21#2` … `#10` · 대상 HP 가 몇 번 줄어드는지(A 예외 전 = 3번 · 뒤 = 10번) · 폭발 10번이 타격과 같은 때.

## 1차 (2026-09-27)

기반: #114 `7c719ee`(= origin/main `3b6c972` + PlayerAttack 버프 훅). **로컬 커밋만(push · PR 전).**
기획 질문 + A 훅 제안 = #40 5849880738. 답이 올 때까지 원작 메이플(가장 최신 공식 판) 기준 기본값이고, 값마다 상수 한 곳이다.
원작 근거(WZ 경로 · 나무위키 현재판)와 영상 실측 · 라이브러리 비교는 저장소 밖 `design-handoff/pirate-refs/`(research-original.md · video-frames/ · library/ · pirate_comparison_sheet.png).
**런타임 확인 없음** — 월드가 Round 9 에 쓰이는 중. 아래 Play 체크리스트는 다음 라운드.

### 기획 표와 대조

| 슬롯 | 표 | 코드 | 결과 |
|---|---|---|---|
| A 써머솔트 킥 | 10 · 125% → 275% | ReqLevel 10 · BaseEffect 125 + 37.5/레벨 | 같음. **이름만** `섬머솔트 킥` → `써머솔트 킥` |
| B 선원 관리 | 10 · 15% → 35% | 10 · 15 + 5/레벨 | 같음. 적용점(A 파일)이 아직 없음 → #40 훅 제안 |
| C 에너지 차지 + 피스트 인 레인지 | 20 · 30%×10 → 50%×10 · 지속 30 · 쿨 60 | 20 · 30 + 5/레벨 · HitCount 10 · 30 · 60 | 같음. 툴팁에 공격 이름 "피스트 인 레인지" 추가 |
| D 에너지 쉴드 | 20 · 최대 HP 10% → 30% · 쿨 30 | 20 · 10 + 5/레벨 · 30 | 같음 |
| 궁 함포 사격 | 30 · 150% × 30 | 30 · 150 · HitCount 30 | 같음 |

해금 레벨: 해적 10/10/20/20/30 = 전사·마법사·궁수와 같다. 다른 곳은 도적 D(쉐도우 파트너) 30 하나(도적 표 그대로 · 안 바꿈).

### 바꾼 것

| 스킬 | 무엇 | 전 → 후 | 근거 | 위치 |
|---|---|---|---|---|
| 써머솔트 킥 | 이름 | 섬머솔트 킥 → 써머솔트 킥 | 기획 표 | `SkillInfo.csv` SK_P11 |
| 써머솔트 킥 | 판정 | 앞 2 × 높이 1.5 · 상한 없음 → **앞 1.7 · 뒤 0.9 · 위 1.85 · 최대 6명** | 원작 최신 KMS 360~389 lt(-170,-185) rb(90,5) · mobCount 6 | `SkillExecutors` `effectOverrides.SK_P11.box` · `skillTargetCaps` |
| 써머솔트 킥 | 백덤블링 | delay 0.08 · 0.4s · 피해 0.2s · 뒤로 0.35 → **0.03 · 0.65s · 피해 0.10s · 뒤로 0.70(0.45s 동안 · 새 `driftSeconds`)** · 한 바퀴 0.16s 는 그대로(spinFraction 0.4 → 0.25) | 사용자 영상 실측(시전 2.700s · 발 뜸 +0.03 · 피해 숫자 +0.10 · 착지 +0.317 · 멈춤 +0.48 · 똑바로 섬 +0.68 · 뒤로 1.02 캐릭터 키) | `SkillExecutors` SK_P11 backflip · `PlayBackflip`/`BackflipClient` |
| 써머솔트 킥 | 시전 락 | 0.6 → **0.7** | 영상 +0.68 | `SkillCaster.castLockOverrides` |
| 써머솔트 킥 | 크기·자리 | cast scale 1 · offsetX −0.95 → **0.56 · −0.33** · hit scale 1 → **0.5** (새 `SkillAttack.PendingImpactScale`) | 영상 9.46s 호 0.9 × 1.65 캐릭터 키 ↔ 팩 effect 2~4 프레임 | `SkillExecutors` SK_P11 |
| 피스트 인 레인지 | 그림 | 4차 피스트 인레이지 5121020(주황 · 2021 모습) → **피스트 인레이지 VI 5141000**(effect + effect0 + hit/0 · 2023 · 라이브러리 최신) | 영상 64.8~66.4s(VI)와 같은 그림 · 2022 데스티니 그림은 라이브러리에 없음 | `SkillExecutors` SK_P21 · `SkillCaster.castLockClips` |
| 피스트 인 레인지 | 타이밍 | 피해·폭발 시전 즉시 1번 → **+0.23s 에 피해 한 번 · 대상마다 폭발 10번 × 0.12s**(연출만 · 새 `PendingImpactRepeat`) | 영상 VI 첫 구체 +0.233 · 폭발 10번 65.067…66.167 | `ExecuteChargePunch` · `SkillAttack.OnAttack` |
| 피스트 인 레인지 | 대상 | 상자 안 전부 → **최대 4명**(가까운 순) | 원작 VI mobCount 4(기본 4차판 3) | `skillTargetCaps.SK_P21` |
| 에너지 차지 | 쿨타임 시작 | 변신이 끝날 때 → **시전 순간**(스위치 `cooldownStartsAtBuffEnd.SK_P21 = false`) | 원작 트랜스폼 · 슈퍼 트랜스폼 · 라이트닝 폼 모두 사용 순간부터 · 예전 값은 B 구현 선택(def1e43)이었다 | `SkillCaster` · `SkillBuffs.EndChargeState` |
| 에너지 차지 | 툴팁 | "데미지 30% x 10타" → "**피스트 인 레인지** 데미지 30% x 10타" · 쿨타임이 버프 끝에서 시작하는 스킬은 "(지속시간이 끝난 뒤부터)" | 기획 표 이름 | `SkillWindowLogic` · `SkillInfo.csv` 설명 |
| 함포 사격 | 파 간격 | 0.45 → **0.58**(첫 파 1.0 · 마지막 ≈3.9s) | 원작 드레드노트 풍랑 1.02~3.9s | `SkillExecutors.BarrageInterval` |
| 함포 사격 | 대상 | 원 안 전부 → **파마다 최대 15명** | 원작 mobCount 15 | `skillTargetCaps.SK_P31` |
| 함포 사격 | 그림 | 폭탄 = 배틀쉽 봄버 hit(4차) → **드레드노트 hit/0**(흩뿌림 x0.6 + 맞은 대상마다 x1) | 컷신과 같은 2023 오리진 · 원작은 대상 위 hit | `SkillExecutors` SK_P31 |
| 함포 사격 | 시전 소리 | `38dd6c9b`(태그 = 드라코 슬래셔 Hit · 해적 소리 아님) → **배틀쉽 봄버 Use `686297b9`** | 드레드노트 · HEXA 팩엔 소리 없음 | `SkillExecutors.castSounds` |
| 선원 관리 | B 적용 함수 | 없음 → `JobPassiveLogic.ApplyJobCost(uid, sink, base)` = 내림 · 최소 1 · 본인 패시브만 | B 의 MP 배율과 같은 내림(`SkillCaster.mlua:226`) | `Job/JobPassiveLogic.mlua` |

- 대상 상한은 B 파일만으로: `SkillAttack.CapTargetsByShape` 가 같은 모양으로 probe → 시전자에게 가까운 순서 N명 → `IsAttackTarget` 이 그 목록만 통과 → AttackFast 1회(피해 ×N · 표시 N타 그대로). 상한 0 = 예전 동작.
- A 파일 · 계약서 · CSV 헤더 변경 없음. CSV 는 해적 행의 이름·설명·#Note 만.

### 그대로 둔 것 (일부러)

- 써머솔트 킥 그림(400004134 = 모험가 5001002 그림 · 지금 라이브) — 영상은 옛 파랑·흰 판이라 색·모양이 다르다. CharLevel 15/20/25 색 변형도 안 씀.
- 써머솔트 킥 뒤로 이동 0.70 — 원작(공식)은 **제자리**다. 영상(옛 클래식 판)과 2026-09-14 사용자 요청이 뒤로 이동이라 둠. 원작대로 = `driftX 0`.
- 에너지 차지 이동속도 +22→30% · 점프력 +11→15%(2026-09-24 기획 OK) · 레벨 티어 불꽃 3종(원작 변신 몸 스프라이트는 라이브러리에 없음).
- 에너지 쉴드 로직(깨질 때까지 · 재시전 = 새로 채움 · 쿨 시전 순간 · 순서 무적 → 다크 사이트 → 보호막 → 하이퍼 바디 → 매직 가드)과 그림(제로 이뮨 배리어 · 2026-09-13 사용자 선택).
- 피스트 인 레인지 소리(4차판 · VI 팩엔 소리 없음) · 판정 Range 3(원작 앞 3.2 와 거의 같음) · 시전 락 = 클립 길이(원작 액션 딜레이 780ms 와 비슷).
- 함포 사격 반지름 8 · 시전 락 3.5 · 컷신(드레드노트 screen · 임시 · mp4 교체 예정) · 원작의 15초 함선 추가 폭격(기획 표에 없음).

### Play 체크리스트 (Round 9 뒤)

1. 써머솔트 킥: 뒤로 ≈0.7 유닛 밀림 · 벽/발판 끝에서 이상 없음 · 피해 +0.10s · 앞 1.7 · 뒤 0.9 안의 몬스터 최대 6마리 · 로그 `target cap SK_P11 max=6 inShape=… chosen=…` · 이펙트 크기(x0.56)와 자리(offsetX −0.33 · 양쪽 방향) · hit x0.5 · 똑바로 서는 시점 = 락 0.7.
2. 피스트 인 레인지: 변신 중 W → VI 휩쓸기 + effect0 · +0.23s 에 피해 · 대상 위 폭발 10번 · 최대 4마리 · 로그 `CHARGE PUNCH … hitDelay=0.23 cap=4` · 시전 락 로그 `clip lock SK_P21_RECAST = …s (382ee512…)` · 방향 뒤집기.
3. 에너지 차지 쿨: 시전 즉시 쿨 60 시작(`CastResult … cd=60`) · 변신 중 W 재입력 계속 됨 · 변신 끝 로그 `ENERGY_CHARGE state end (cooldown started at cast …)` · 끝난 뒤 30초 뒤 재사용.
4. 툴팁: 에너지 차지 = "피스트 인 레인지 데미지 …" · "쿨타임 60초"(괄호 없음 = 시전 순간) · 써머솔트 킥 이름.
5. 함포 사격: 파 6개 1.0 → 3.9s(`BARRAGE … every 0.58s`) · 파마다 최대 15마리 · 대상 위 드레드노트 hit · 흩뿌린 폭탄 크기 · 시전 소리 = 배틀쉽 봄버.
6. 선원 관리: A 연결 전엔 변화 없음(로그 `[JobPassive] cost …` 없음). 연결 뒤 재료 8 → 6/5 · 꿈의 조각 내림.
7. 빌드 경고 before → after · 런타임 새 경고 0.
