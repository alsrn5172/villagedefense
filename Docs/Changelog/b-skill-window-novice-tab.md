# b/skill-window-novice-tab — 스킬 창 단어 단위 줄바꿈 · 초보자 탭(모든 직업) · 초보자 SP 전직 후 유지

## 2026-10-05

출처: 툴팁 줄바꿈 = #40 5984028445(B 질문) · 5988187393(A 답 "B 가 스킬 창에 단어 단위 줄바꿈을 넣는다 · A UI 에 다시 쓸 수 있는 줄바꿈 처리는 없다").
초보자 탭 · SP = **A 구두 승인 2026-10-05**(사용자 전달) — #40 5891464912 의 차수별 SP 규칙을 **초보자(0 차)에 한해** 바꾼다. 1 · 2 · 3 차 규칙은 그대로.

### 서버 — 초보자 SP 와 초보자 스킬
| 파일 · 함수 | 예전 | 지금 |
|---|---|---|
| `PlayerSkillState.ForfeitOldTierSp` | 차수가 오르면 새 차수 이후 몫만 남기고 0 차 포함 나머지 소멸 | 0 차 남은 SP 도 남긴다(`NoviceSpKeptAcrossJobs` · 새 값 · 기본 true) |
| `PlayerSkillState.RequestLearn` | 지금 차수 스킬만 | + 0 차 스킬은 어느 차수에서든 0 차 SP 로(같은 값) |
| `SkillDatabase.CheckRequirements` | 직업 줄이 다르면 거절 | NOVICE 줄 스킬은 어느 직업이든 통과(`NoviceSkillsForAllJobs` · 새 값 · 기본 true) — CanLearn · CanUse 공용 |

- 새 값 두 개를 false 로 두면 예전과 같다.
- `TierSpEarned` 계산 본체를 `TierSpEarnedFor(jobId, level, startSp, tier)` 로 뺐다(서버 · 클라 공용 · 값은 그대로). `TierStartLevel` 은 ServerOnly 표시를 뗐다(표만 읽는다 · `_JobDatabase:EnsureLoaded()` 를 먼저 부른다).
- 미러: `PushState` 줄에 `spent=<차수>:<쓴 SP>,…;nstart=<매치 시작 SP>` 를 붙이고 `SyncState` 가 `mirrorSpentByTier` · `mirrorNoviceStartSp` 로 받는다 → `LocalTierSpLeft(tier)`(클라 · 표시용 · 지갑보다 크게 안 보인다).
- 🟡 시전: `CheckRequirements` 가 `CanUse` 와 공용이라 전직 뒤에도 서버는 초보자 스킬 시전을 막지 않는다. 다만 Q 는 `SkillHotbar.byJob` 이 직업 스킬로 바꾸므로 전직 뒤 달팽이 세마리를 누를 키가 없다 — 시전 가능 여부는 이 PR 범위 밖(사용자 지시).
- **키 없는 초보자 액티브 스킬은 못 올린다**(사용자 2026-10-05): 초보자 스킬(ReqTier 0) 중 Behavior ≠ PASSIVE 이고 지금 직업 슬롯 표(`SkillHotbar.slots` byJob)에 키가 없으면 `RequestLearn` 이 거절(`no cast key for <직업>`)하고 스킬 창 "+" 는 비활성 그림 + 툴팁 한 줄. 스킬 id 를 적지 않았다 — 표(Behavior · ReqTier) + 슬롯 표로 정한다(`PlayerSkillState.NoviceSkillHasNoKey` · 새 값 `NoviceActiveNeedsCastKey` · `SkillHotbar.HasCastKey` 새 공용 메서드 · `BuildSlotTable` 은 ClientOnly 표시를 떼 서버에서도 표를 만든다). 지금 걸리는 스킬 = 달팽이 세마리(전직 뒤 Q 가 직업 스킬).
- **더블 점프(SK_N02 · PASSIVE · 공중 점프 키)는 전직 뒤에도 초보자 탭에서 초보자 SP 로 배운다** — 이 PR 의 이유. 배운 즉시 `SkillHotbar.TryAirDoubleJump` 가 미러 레벨(`LocalSkillLevel`)을 보고 뛴다(`DoubleJumpKeepAfterJob = true` · A 결정 5977728018). 🟡 마법사는 공중 점프가 텔레포트라 배워도 더블 점프가 나가지 않는다(`SkillExecutors.RequestDoubleJump` 의 MAGICIAN 제외 · 예전과 같음 · 바꾸지 않았다).

### 스킬 창 — 탭 4개
- `ui/SkillWindow.ui`(UIBuilder · 스크립트 `villagedefense-harness/novice-tab/apply-novice-tab.cjs`): `TabRow/TabBtnNovice` 새 버튼(On · Locked · Label "초보자" · 그림 · 버튼 전환은 TabBtn0 복사). 탭 그림이 Simple(288x142)이라 네 탭을 폭 107 · 높이 53(그림 비율)으로 줄이고 간격 4 로 다시 놓았다(x −166.5 / −55.5 / 55.5 / 166.5).
- 🟡 A 의 `Docs/tools/design-ui/apply-skill.cjs` 는 탭 3개(141.5x66)를 그린다 — 다시 돌리면 1 · 2 · 3 차 탭이 옛 크기로 돌아가 초보자 탭과 겹친다(이 PR 은 A 파일을 안 고쳤다).
- `SkillWindowLogic`: UI 탭 번호 = 차수(0 초보자 · 1 · 2 · 3 · `TabTier`) · 모든 직업 같은 배치. 초보자 탭은 NOVICE 줄 스킬을 보여 준다. 탭 글자 런타임 바꾸기(`tabLabelBase`)는 없앴다. 직업 · 차수가 바뀌어 행을 다시 만들면 지금 차수 탭으로 간다(`TabAfterBuild`).
- 행 "+" 비활성 기준: 지갑 0 → 그 스킬 차수 남은 SP(`LocalTierSpLeft`) < SpCost. 전직 뒤 지갑에 초보자 SP 만 남아 있어도 1 차 행 "+" 는 꺼진 그림.

- **스킬 포인트 띠 숫자 = 고른 탭 차수의 남은 SP**(사용자 2026-10-05 · 예전 = 지갑 전체라 초보자 SP 6 + 1차 9 = 15 가 보여도 직업 스킬엔 9 만 쓸 수 있었다): `RefreshFooter`(새) 가 `LocalTierSpLeft(TabTier(currentTab))` 를 쓰고 `RefreshFromState` · `ShowTab` 이 부른다. 0 일 때 안내 글 · 회색도 이 숫자를 따른다. 글자 모양은 그대로(숫자만). 차수별 SP 를 끄면 지갑. A 의 HUD "AP · SP" 칩(`Summon/StatusHUDController.mlua:225`)은 그대로 지갑 전체(A 가 정할 것).

### 스킬 창 — 툴팁 단어 단위 줄바꿈
- `ShowPanelWithParts` 가 글을 넣기 전에 `WrapWords` 로 띄어쓰기 자리에서 줄을 나눈다(폭 = 그 칸 폭 − `TooltipWrapSlack` 6 · 재기 = 그 글자 컴포넌트 `GetPreferredWidth` · 색 태그 뺀 글자). 한 단어가 칸보다 길면 그 단어만 엔진이 꺾는다. `TooltipWordWrap = false` 면 예전처럼.
