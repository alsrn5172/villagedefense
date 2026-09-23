# a/p0914-8-account (B8 · 통합 브랜치 `a/plan-0914` · B7 위 stacked · PR #77)

순위별 심장 · 계정 경험치/레벨 (WO-029 B8 · WO-027 §8 · 계약 A-2-21 · §0-5 SchemaVersion 3).

| 항목 | 내용 | 파일 |
|---|---|---|
| `RankReward` 신설 | 15행 = Rank 1~5 × ★1/3/5 · Hearts 2×★ / 1×★ / 0.5×★ 반올림(3~5위) · 4·5위 `BALROG_HP_HALF`(발록 누적 피해 ≥ MaxHp/2) · AccountExp ★3 120/100/80/60/50 · ★1 ×0.5 · ★5 ×2 | `RankReward.csv` · `.userdataset` |
| 정산 | `RankRewardService.Settle`(신규): `ShowResult` 정렬 순서 = 순위 · 탈락자 = Rank 5 행 · 이탈자 = 0 · 매치당 1회 · `[Rank] user= rank= hearts= accExp= lv=a->b` · 결과 화면 `reward=` 문구 | `Match/RankRewardService.mlua` · `Match/MatchSessionLogic.mlua` |
| 계정 레벨 | `AccountLevelService`(신규): 누적 경험치 → 레벨(필요치 80+20×(Lv−1) · 상한 50) · 레벨업마다 심장 1/2/3 · 토스트 · `Progress` | `Progression/AccountLevelService.mlua` |
| 저장 v3 | `AccountProfile` += `account_exp` · `account_guideOff`(B10) · `SchemaVersion` 2→3 · 구버전 JSON 은 기본값(역호환) · `AccountData` += `exp/guideOff` 필드 · `GetExp/AddExp/IsGuideOff/SetGuideOff` | `Progression/AccountProfile.mlua` · `AccountStorageLogic.mlua` · `AccountData.mlua` |
| 표시 | 로비 `aprog=` → 하트 라벨 "계정 Lv n (x/y)" · 결과 화면 `reward=` | `Match/MatchLobbyGateway.mlua` · `Match/LobbyUIController.mlua` |

해금(★3 Lv5 · ★5 Lv13)은 B6 `DifficultyService.IsUnlocked` 가 `AccountData.GetLevel` 로 이미 본다.

## 검증

- `node Docs/tools/check-integrity.cjs` 통과(RankReward 15행) · LSP 진단 0.
- 런타임(Maker): PR 본문.
