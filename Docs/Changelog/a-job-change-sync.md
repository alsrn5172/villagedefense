# a/job-change-sync — 전직 반영: 스탯 직업 연결 + 1차 전직 기본 무기 (WO-045)

> 배경: 사용자 2026-10-05 "전직했는데 초보자 체크리스트에 전직이 체크가 안 된다" · "전직 후 그 직업 기본 무기를 껴 줘야 한다(몽둥이 해제 · 10렙 기본 무기 · 구매 무기보다 약한 것)".
> 원인: B 가 보내는 `JobChangedEvent` 를 `StatService` 가 받지 않아 서버 스탯 원장이 모두 영구 `NOVICE` 였다.

## 2026-10-05

### `Stat/StatService.mlua`
- `OnBeginPlay` 에서 `_PlayerSkillState` 의 `JobChangedEvent` 구독 → `OnJobChanged` → `SetJob(UserId, NewJobId)`(재계산). 로그 `[Stat] job <uid> NOVICE -> THIEF (tier 1)`.
- 이제 새 직업을 따르는 것: ★1 체크리스트 C2(전직) · ★1 안내 G5("빈 마을의 넥서스를 차지하세요") · 일반 공격 데미지 주/부 스탯(`GetRange`) · AP 자동 분배 비율(`JobInfo`) · 캐릭터 창 직업 · 직업 장비 제한(`EquipService.RequestEquip` — 전직한 유저는 다른 직업 장비를 못 낀다).

### `Item/EquipService.mlua`
- 같은 이벤트 구독 → `OnJobChanged`: **초보자 → 1차 전직일 때만** `WEAPON_<직업>_BASIC` 을 인벤토리에 넣고 무기 칸에 끼운다(몽둥이 등은 칸에서만 빠지고 인벤토리에 남는다). 두손 무기(활 · 아대 · 너클)면 방패 칸을 비운다. 이미 새 직업 무기를 끼고 있으면 인벤토리에만 넣는다(사용자 결정). 토스트 "전직 기념으로 ○○을(를) 장착했습니다". 2 · 3차 전직은 주지 않는다.
- 직업 제한 주석 갱신(이제 전직이 연결됐다).

### `ItemInfo.csv`
- 기본 무기 5행(행 추가만 · 헤더 그대로) — 사용자 2026-10-05 "외형은 같은데 약한 것 · (마모된) 수식어". 10제 행을 복사해 이름 · 수치만 바꿨다: ReqLevel 10 · 공격력(마법사는 마력) **22**(10제 27) · 내구 100(10제 150) · 판매 50 · 상점 · 제작 목록에는 없음.

| ItemId | 이름 | 그림 |
|---|---|---|
| `WEAPON_WARRIOR_BASIC` | (마모된) 검 | 원작 검(`9edfb2ac…` · 후보 W1) |
| `WEAPON_MAGICIAN_BASIC` | (마모된) 우드 완드 | 우드 완드와 같음 |
| `WEAPON_ARCHER_BASIC` | (마모된) 워 보우 | 워 보우와 같음(두손) |
| `WEAPON_THIEF_BASIC` | (마모된) 가니어 | 가니어와 같음(아대 · 두손 칸) |
| `WEAPON_PIRATE_BASIC` | (마모된) 스틸 너클 | 스틸 너클과 같음(두손 칸) |

### 로그 확인 (Maker Play) — TODO
- [ ] 초보자 → 도적 전직: `[Skill] JOB NOVICE -> THIEF/1` → `[Stat] job … NOVICE -> THIEF` → `[Item] job basic weapon WEAPON_THIEF_BASIC equipped (prev WEAPON_CLUB)` · 캐릭터 창 무기 = 기본 아대 · 몽둥이는 인벤토리.
- [ ] ★1 체크리스트 '전직' 켜짐 · 안내가 G5 로 넘어감.
- [ ] 다섯 직업 각각 무기 외형 · 평타 모션.
