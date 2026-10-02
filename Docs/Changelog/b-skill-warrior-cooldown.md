# b/skill-warrior-cooldown — 전사 쿨타임 표에 맞춤

## 2026-10-01

| 스킬 | 예전 | 지금 | 근거 |
|---|---|---|---|
| 파워 스트라이크 SK_W11 | 쿨타임 3초 | **0** | #40 5884390599 "쿨타임 — 표에 없으면 없음(0)"에 맞춰 변경 |
| 도발 SK_W22 | 쿨타임 20초 | **0** | 같음 |

- `RootDesk/MyDesk/SkillInfo.csv` 두 행의 `Cooldown` 열 + `#Note` 끝에 한 줄. 헤더 불변 · BOM/CRLF 유지. `CooldownPerLevel` 은 둘 다 원래 0.
- 코드 변경 없음. 쿨타임 0 은 더블 샷 · 섬머솔트 킥이 이미 쓰는 경로(`SkillCaster` 가 0 초 쿨다운을 건다 · 툴팁은 `쿨타임 N초` 줄을 안 쓴다 · `SkillWindowLogic.FormatEffect`).
- 같은 답의 에너지볼트 1.5 → 0 · 스나이핑 8 → 0 은 마법사 · 궁수 행이라 이 PR 에 넣지 않았다(각 창 몫).
- 도발은 이제 시전 락(`SkillCaster.castLockOverrides.SK_W22` 0.6초)만이 연속 시전을 막는다 — Play 에서 연타 느낌 확인.

### Play 확인
1. 파워 스트라이크를 연달아 → 시전 락이 끝나자마자 다시 나간다 · 핫바 슬롯이 회색이 되지 않는다 · 툴팁에 "쿨타임" 줄이 없다.
2. 도발을 연달아 → 같음 · 몬스터를 모으는 동작 · 5초 추격은 그대로.
3. 빌드 경고 N → N.

## 2026-10-03 (로컬 · push 전) — 파워 스트라이크 명중 사운드 자리(사용자 Play 선택 대기)

- `Skill/SkillExecutors.mlua`(B): `extraSounds.SK_W11 = { hit = "" }` 빈 자리 + 후보 3개 표(주석) · `ExecutePowerStrike` 명중 순간(`if hit then` · hit 이펙트 바로 뒤) `GetExtraSound(skillId, "hit")` 가 비어 있지 않으면 한 번 튼다 · 로그 `SkillExecutors: POWER STRIKE hit sound once (<id>)`.
- 지금은 빈 값 = 동작 변화 없음(몬스터 기본 소리만). 통합 Play(RUN-combined-1003 135-S)에서 W1 / W2 / W3 중 하나를 고르면 `hit = "<id>"` 한 줄만 바꾼다.
- 후보: W1 `1488e238bb474c9087cd563a892d5dcb` 11101008/Hit 브랜디쉬(기사단) · W2 `6c06fe8ab27b469eb61f466ea7f7e182` 1101011/Hit 브랜디쉬(파이터) · W3 `ca35cb7d0652411395a5bb90a5beecd3` 1001005/Hit 슬래시 블러스트.
- 이 PR 이 건드리는 파일에 `Skill/SkillExecutors.mlua` 가 더해진다(push 할 때 본문 "건드리는 파일"에 적는다).
