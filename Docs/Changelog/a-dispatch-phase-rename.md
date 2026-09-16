# a/dispatch-phase-rename — 파병 페이즈 이름 회귀 수정

> base `main 582671d`. WO-015 문서 개정 중 발견한 회귀를 별도로 고친다.

## 2026-09-09 — 파병이 전 페이즈에서 막혀 있던 것을 고침

### 증상

**게임에서 파병이 아예 되지 않았다.** 파병 담당관에서 신청해도 항상 거절된다. **에러도 경고도 나지 않는다.**

### 원인

`Dispatch/DispatchService.CurrentRule()` 은 `_MatchSessionLogic.CurrentPhaseName` 으로 `DispatchRule` 을 조회한다.

```
CurrentPhaseName  → PHASE0-1 / PHASE0-2 / PHASE1 / PHASE2 / PHASE3   (WO-014 에서 5단 개명)
DispatchRule.csv  → PHASE1_PIONEER / PHASE2_VILLAGE / PHASE25_PRESSURE / PHASE3_FINALE   ← 옛 이름
RuleOf(모르는 값) → { enabled = false, villageCap = 0 }   ← "안전한 쪽" 폴백이 조용히 막는다
```

**WO-014(페이즈 5단 개명)와 파병 브랜치가 병행 개발돼 머지 시점에 어긋났다.** WO-014 는 같은 문제를 `LaneFacility` 에서 고쳤지만(인덱스 → 이름 판정), `DispatchRule` 은 그 시점에 존재하지 않아 검색에 안 걸렸다.

`MatchSessionLogic:217` 이 `_DispatchService:Release(row.name, ...)` 로 새 이름을 넘기고 있어 투입 경로도 같이 어긋나 있었다.

### 고친 것

- `RootDesk/MyDesk/DispatchRule.csv` — 4행 → **5행**, 새 페이즈 이름으로.
  `PHASE0-1`·`PHASE0-2` 는 미니언이 없는 구간이라 `Enabled=false`. `PHASE1`/`PHASE2` 상한 3, `PHASE3` 상한 4는 기존 값 그대로 이관.
- `RootDesk/MyDesk/Dispatch/DispatchService.mlua` — `LoadRule()` 폴백 상수 4개 → **5개**, 새 이름으로.
  하이픈이 들어간 키라 `["PHASE0-1"]` 표기를 쓴다.
  왜 이 표가 페이즈 값과 글자 단위로 같아야 하는지 주석으로 남겼다.

밸런스 수치는 하나도 안 바꿨다. **이름만 맞췄다.**

### 검증

- `node Docs/tools/check-integrity.cjs` — 전부 통과, 경고 3건(기준선 유지). `DispatchRule` C1 5행 · C3 기본 키 OK
- 옛 페이즈 이름 전체 검색 — `RootDesk/` 에 **0건**
- ⬜ **런타임 미검증** — Maker Refresh → Play 로 `[Dispatch] DispatchRule loaded: 5 rows` 와 `PHASE1` 이후 파병 접수가 열리는지 확인 필요

### 재발 방지

**페이즈 값을 바꿀 때는 `CurrentPhaseName` 을 읽는 모든 구독자와 `Phase` 열을 쓰는 모든 표를 함께 검색한다.** 이 교훈은 `VillageDefense-M1-GDD.md` §9 위험 표에 올렸다(PR #44).
