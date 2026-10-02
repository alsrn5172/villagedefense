# b/monster-sounds — 몹마다 원작 피격 · 사망 소리

> 🔴 **헤더 변경**: `MonsterInfo.csv` 맨 뒤에 `DamagedSoundRUID` · `DieSoundRUID` 2열 추가(A 파일 · 협업-규칙 §3-3 · §3-4 · A 리뷰 승인 필요). `check-integrity.cjs` CANONICAL · `Docs/스키마-계약.md` A-1-1 같이 고침.

## 1차 — 구현 (2026-10-02 · #40 5927315317 · 정정 5927819993 · 사용자(강민구) 결정 2026-10-01 "몬스터에 넣는다 · 오디오는 B")

| 무엇 | 어떻게 |
|---|---|
| 소리 고르기 | 행마다 그 몹 원작 팩의 `_audio/Damage` · `_audio/Die`. 팩 = `mob/<Id 7자리>.img` 중 `IconRUID`(그 팩의 stand 클립)가 들어 있는 것, 아니면 `IconRUID` 를 담은 팩(달팽이 100000 → 0100100 · 참새 → 2400202 · 아이언호그 → 4090000 · 시니컬한 주황버섯 → 2300102 · 분노한 뿔버섯 → 2300101 · 물버섯 → 2230101). 소리는 `effect` 또는 `voice` 타입. 결과 78행: Damage 78 · Die 75 · 빈칸 3(콜드아이 4230100 · 레이스 4230102 · 스톤골렘 5130101 — 라이브러리 팩에 Die 가 없다) → 아래 "사망 빈칸 3종 메우기" 로 같은 계열 소리를 넣었다. 도구(저장소 밖) `villagedefense-harness/monster-sounds/pick.cjs` |
| 표 | `MonsterInfo.csv` 2열(BOM · CRLF 유지) · `MonsterCatalog` 가 읽고 `GetDamagedSoundRuid` · `GetDieSoundRuid` |
| 적용 | `Monster.ResolveInfoSounds` — 모델 값이 비어 있고 보스가 아니면 이 몹의 `MonsterInfo.Id`(레인 미니언 `MinionUnit.MonsterId` → 수비대 `DefenderUnit.MonsterId` → 사냥터 `FarmReward.MonsterId` → 자이언트 `FarmReward.EliteId` 의 베이스 몹)로 채운다. 스폰 0.1s 뒤 + 피격 때 다시 시도. 스포너는 안 고침. 로그 `[Monster] sounds <이름> id=… damage=… die=…` |
| 소리 내기 | 지금 있던 `HandleHitEvent` 길 그대로(살아 있는 피격 = Damage · 죽이는 타격 = Die · 맵 안 플레이어마다 그 위치에서). 새 규칙 2개: 몬스터끼리의 피격(수비대 ↔ 미니언)은 피격 소리 안 냄(`MonsterVsMonsterHitSound = false`) · 같은 몹은 0.08s 안에 한 번(`HitSoundMinInterval`). 사망 소리는 누가 죽였든 낸다 |
| 사망 소리 겹침 (2026-10-02 · 사용자 결정) | 같은 맵에서 **같은 사망 소리는 0.1s 안에 한 번**(`Monster.DieSoundMapWindow` · 몹을 가리지 않음). `PlaySoundToMap` 이 `DieSoundRUID` 를 낼 때 `_MonsterCatalog.TakeDieSoundSlot(맵 이름, RUID, 0.1)` 로 거른다 — 억제기 폭발(`LaneStateService`)로 미니언 여럿이 한꺼번에 죽어도 한 번 · `LaneStateService` 는 안 고침. `MonsterCatalog` 는 룸마다 따로 뜨는 Logic 이라 맵 이름 키가 룸끼리 섞이지 않는다 |
| 검증 로그 스위치 (2026-10-03) | `Monster.LogSounds`(기본 꺼짐 · 인스펙터에 안 보임). 켜면 소리를 낼 때 `[Monster] hit sound played <이름> <RUID> users=N` · `[Monster] die sound played …`, 규칙으로 안 낼 때 `[Monster] hit sound skipped <이름> — monster attacker <공격자>` · `— within 0.08s` · `[Monster] die sound skipped <이름> — same die sound on <맵> within 0.1s`. Play 확인 때 스크립트로 테스트 몹에만 켠다(로그로 검증하는 보고서용) |
| 사망 빈칸 3종 메우기 (2026-10-03 · 사용자 지시 "원작 소리가 없으면 같은 계열 · 비슷한 생김새의 공식 사망 소리") | 라이브러리에 원작 `_audio/Die` 가 없는 3종(팩에도 없고 `sound/mob.img/<id>/Die` 검색에도 없음)을 같은 모델 계열 몬스터의 공식 사망 소리로: **콜드아이 4230100 → 커즈아이 3230100 `cd02ae7d`**(1.04s · 이블아이 · 커즈아이 · 콜드아이 · 서전아이는 같은 눈알 그림의 색 바꿈이고, 콜드아이 피격 소리가 등록된 이벤트 사본 9100017 은 커즈아이 사본 9100016 바로 옆 — 이블아이 · 서전아이 사망음 1.65s 도 후보) · **레이스 4230102 → 주니어 레이스 3230101 `4e9c63a1`**(1.93s · 같은 유령의 작은 판 · 계열에 다른 사망음 없음) · **스톤골렘 5130101 → 다크 스톤골렘 5130102 `5f543a38`**(3.00s · 같은 골렘의 어두운 색 바꿈 · 믹스골렘 계열보다 가깝다). 이제 78행 전부 Damage · Die 가 있다(Die 3행은 대체 소리) |
| 사망 소리 창 0.1 → 0.05s (2026-10-03 · 사용자 결정 · 합동 Play) | `Monster.DieSoundMapWindow` 0.05. 목적은 같은 프레임 몰살(억제기 폭발)을 한 번으로 묶는 것이라 0.05s 로도 그대로 한 번이고, 따로 난 처치 0.10s 간격(더블 샷 두 발이 겹친 두 마리를 하나씩)은 둘 다 들린다 |
| 안 바꾼 것 | 스킬 명중음(`SkillExecutors.extraSounds` 등) · 보스 소리(`BossInfo`) · 억제기 폭발 처치의 사망 소리 줄(`LaneStateService` — 이제 미니언에 값이 생겨 소리가 나지만 위 0.1s 창으로 한 번) |

검사: 스크립트 검사 0 오류 / 0 경고(`Monster.mlua` info 2 = Maker Refresh 전 `MonsterCatalog` codeblock) · `check-integrity.cjs` 통과(경고 3 · main 과 같음).

Play 확인(아직 안 함): 사냥터 몹 3종 피격/처치 소리 · 자이언트 · 레인 미니언(플레이어가 때릴 때만 피격 소리 · 수비대와 싸울 때는 안 남) · 수비대 · 억제기 폭발로 미니언 여럿이 죽을 때 사망 소리 한 번 · 보스 소리 그대로 · 빈칸이던 3종은 대체 사망 소리(커즈아이 · 주니어 레이스 · 다크 스톤골렘) · 빌드 경고 N → N.
