# a/m1-5-achievements (묶음 5 · 통합 브랜치 `a/m1-finish` · base `a/m1-4-collection` · PR #111)

업적 · 칭호 · 이름표 (WO-031 묶음 5 · GDD §4.12 · 계약 A-2-23 · A-2-24 · §0-5 SchemaVersion 4).

## 바뀐 것

| 무엇 | 어떻게 | 파일 |
|---|---|---|
| 새 표 | **`AchievementConfig.csv`** 16행 · **`TitleInfo.csv`** 16행(+ `.userdataset`) = WO-031 §5 초안(업적 하나 = 칭호 하나 · 경험치 합 1,220) | `AchievementConfig.csv` · `TitleInfo.csv` |
| 업적 | 신규 `AchievementService` — 카운터 `c["<CondType>:<Param>"]`(AccountRecordData.ach) · 도감 도출(`DEX_FOUND` · `DEX_BOSS` · Target 0 = 전부) · 목표 도달 순간 **기록 먼저**(`d[id]=1`) → 계정 경험치(`ACHIEVEMENT`) → 칭호 → 토스트 · 로드 직후 전체 재판정 · 로그 `[Ach]` | `Progression/AchievementService.mlua`(신규) |
| 카운터 훅 | 처치·자이언트(MatchTallyService) · 지역 보스 처치 판정(최다 피해 · 발록 제외) · 정산 판 · 1위(★ 무관 + ★별 · 탈락 안 한 1위) · 발록이 쓰러진 판의 발록 피해(`MatchSessionLogic.ShowResult` → `OnMatchSettled` · 중도 이탈 제외) · 모집 개체 · 파병 개체(`LaneStateService`) · 새 도감 발견(`CollectionService` · 발견 순간만) · 장비 6칸 전부 최대 강화(`EnhanceService` 성공 · `EquipService` 장착 → `CheckEnhanceAll` · 매치당 1번 = `MatchTallyService.MarkOnce`) | `Match/MatchTallyService.mlua` · `Match/MatchSessionLogic.mlua` · `Lane/LaneStateService.mlua` · `Progression/CollectionService.mlua` · `Item/EnhanceService.mlua` · `Item/EquipService.mlua` |
| 칭호 | 신규 `TitleService` — 보유 추가(`Grant` · 토스트 "칭호 획득") · 장착 RPC `RequestEquip(id)`(가진·켜진 칭호만 · "" = 해제) · **이름표 = "칭호 닉네임"**(`NameTagComponent.Name` · @Sync · 룸 로드 직후 `AccountRecordData.PostOnLoadedDataFromDB` 와 장착 때 · 엔티티가 없으면 1초 간격 5번 재시도) | `Progression/TitleService.mlua`(신규) |
| 프로필 v4 | `account_titles`(쉼표 목록) · `account_title`(장착) · `SchemaVersion` 3 → **4** · 옛 세이브 = 빈 값(역호환) · `AccountData` 접근자(`GetTitles` · `HasTitle` · `AddTitle` · `GetEquippedTitle` · `SetEquippedTitle` — 원장에서도 가진 칭호만) | `Progression/AccountProfile.mlua` · `AccountData.mlua` · `AccountStorageLogic.mlua` |
| 표시처 | 생존자 통계 상세 = "칭호 닉네임"(`MatchTallyService.TitleNameOf`) · 매치 결과 화면 이름 칸 = "칭호 닉네임"(결과 CSV 8번째 칸 · 정렬 ⑤ 는 닉네임 그대로) | `Match/MatchTallyService.mlua` · `Match/MatchSessionLogic.mlua` · `Match/MatchResultUIController.mlua` |
| 계정 창 | 업적 탭(한 줄 목록: 이름 · 설명 · 진행 n/목표 · 보상 · 상태) · 칭호 탭(3열 · 가진 칭호 누르면 장착 · "칭호 해제" · 없는 칭호는 ??? + 얻는 법) · 서버 `PushView`(장착 뒤 다시 보내기) | UI `AccountRecordGroup` · `Progression/AccountRecordUIController.mlua` · `Progression/AccountRecordService.mlua` |

## 검증

- LSP 전부 clean(교차 파일 not-found info = 새 메서드 · Maker refresh 뒤 사라짐). `check-integrity` 통과.
- 🟡 **Maker 검증 대기**: Reimport All(새 Logic 2개 · @Struct 필드 v4 → 두 번 refresh) → Play →
  `[Ach] AchievementConfig loaded: 16` · `[Title] TitleInfo loaded: 16` · 매치 종료 → `[Ach] complete ACH_MATCH_1` + `[Title] grant TTL_ROOKIE` · 로비 → 계정 창 칭호 탭 장착 → `[Title] nametag <uid> = 신입 수비대원 <닉>` · 재접속 뒤 장착 유지(v4 저장) · 같은 업적 재지급 없음.
- 👁 눈 확인(사용자): 머리 위 이름표 한 줄 길이 · 업적/칭호 탭 배치. 이름표가 **다른 클라에 보이는지는 다인 세션**.
