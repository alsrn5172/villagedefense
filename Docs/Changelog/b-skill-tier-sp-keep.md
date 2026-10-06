# b/skill-tier-sp-keep — 전직해도 지난 차수 SP 유지 · 그 차수 스킬 계속 배우기 · Lv10+ 레벨업 SP 3 → 1

## 2026-10-06 — A 결정 #40 6011071575 (사용자 승인)

> SP 는 차수마다 분리하고 서로 영향을 주지 않는다. 전직해도 이전 차수 SP 는 없어지지 않고 그 차수 스킬에 계속 쓸 수 있다. 차수끼리 옮겨 쓰지는 않는다. 레벨업 1회당 SP 는 1 — LevelTable SP 열 9 행 이후 3 → 1. 초보자 구간(Lv2~6 = 1 · Lv7~9 = 0)은 그대로.

### 바뀐 것

| 파일 · 곳 | 예전 | 지금 |
|---|---|---|
| `Skill/PlayerSkillState.mlua` `ForfeitOldTierSp` (B) | 차수가 오르면 새 차수 이후 몫 + 0 차 남은 SP 만 남기고 지난 1 ~ 3 차 몫 소멸 | 0 ~ 3 차 남은 SP 를 모두 남긴다(`PastTierSpKept` · 새 값 · 기본 true). 지갑이 차수 몫 합보다 많을 때만 그 넘침을 없앤다(지갑에서 차수 몫이 새지 않게). 로그 그대로 `[Skill] tier SP -> tier t wallet= keep= (novice n) forfeit=` — 정상이면 forfeit=0 |
| `PlayerSkillState.RequestLearn` (B) | 스킬 `ReqTier` = 지금 차수만(초보자 스킬 예외) · 아니면 `per-tier SP: only tier …` 거절 | `ReqTier` < 지금 차수도 배운다 · 그 차수 남은 SP(`TierSpLeft`)로만. 앞 차수는 예전처럼 `CanLearn`(requires tier) 이 막는다 |
| `Skill/SkillWindowLogic.mlua` `PlusBlockReason` (B) | 지난 차수 "+" 비활성 · "지난 차수 스킬은 더 올릴 수 없습니다" | 서버와 같은 판정 — 지난 차수 "+" 는 그 차수 남은 SP 가 있으면 켜진다. `PastTierText` 는 `PastTierSpKept = false` 일 때만 뜬다. SP 띠는 그대로 고른 탭 차수 몫 |
| `LevelTable.csv` SP 열 (**A 파일** · 헤더 변경 없음) | Level 9 ~ 30 행 = 3 | **1** (22 행). Level 1 ~ 5 = 1 · 6 ~ 8 = 0 그대로 |

- 그대로: 달팽이 세마리 규칙(#169 · 전직 뒤 쓸 키가 없는 초보자 액티브 스킬은 못 올림 · `NoviceSkillHasNoKey`) · 초보자 스킬을 어느 직업에서든 배우기(`NoviceSkillsForAllJobs`) · 초보자 SP Lv6 까지 · 매치 시작 SP 1 · 차수 간 이동 없음 · DEV 직업 전환.
- 번 SP(지금 표): 0 차 6(시작 1 + Lv2 ~ 6) · 1 차 10(Lv10 ~ 19) · 2 차 10(Lv20 ~ 29) · 3 차 1(Lv30). 예전 1 차 30 · 2 차 30 · 3 차 3.

### 이 결정으로 바뀐 예전 문구

- `Docs/Changelog/b-skill-novice-snails.md` 26 ~ 33 행 "차수가 오를 때 … 나머지는 없앤다 = 모아 두기 없음" · "레벨업마다 3 · 1 차 30 · 2 차 30 · 3 차 3" → **이 결정으로 바뀜**(지난 차수 몫 유지 · 레벨업 SP 1).
- `Docs/Changelog/b-skill-window-novice-tab.md` 6 ~ 11 행 "1 · 2 · 3 차 규칙은 그대로" → **이 결정으로 바뀜**(모든 차수가 0 차처럼 유지).
- 기획 문서(`Docs/` 의 changelog 밖)에서 같은 문구는 못 찾았다.
- 화면 문구: `Onboarding/TipController.mlua:100`(A 파일) 팁 "전직하면 남은 SP는 사라져요" 가 이 결정과 맞지 않는다 — 이 PR 에서는 안 고쳤다(사용자 결정 대기).

### 점검

- **Play 안 함** — 숫자 N14 · 모습 R35. #169 모습 중 F-2 의 "전직 뒤 1 차 SP 만" 부분과 F-3 의 "지난 차수 '+' 회색 · 지난 차수 스킬은 더 올릴 수 없습니다" 가 뒤집힌다.
