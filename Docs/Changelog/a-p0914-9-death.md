# a/p0914-9-death (B9 · 통합 브랜치 `a/plan-0914` · B8 위 stacked · PR #78)

플레이어 사망·리스폰 (WO-029 B9 · WO-027 §9-0 3차 ④ · WO-028 T17).

| 항목 | 내용 | 파일 |
|---|---|---|
| 감지 | 매치 참가자 `PlayerComponent:IsDead()` 0.25초 폴링(엔진 사망 = A 피해 적용점 뒤 HP≤0 · `PlayerHit`(B) 손대지 않음) · 발록 방·매치 밖은 제외 | `Match/PlayerRespawnService.mlua`(신규) |
| 1P 이전 | `PHASE0-1/0-2/PHASE1` 사망 = 리스항구(`MatchStartMapId/Spawn`) 리스폰 · 페널티 0 · 토스트 | 〃 |
| 2P 이후 | 팝업(5,000메소 / 현재 레벨 경험치 −50% · 메소 부족이면 경험치만) → 고르면 즉시 부활(`ProcessRevive`) · 안 고르면 `RespawnDuration`(15초 · 매치 중만) 뒤 자동 부활 + 경험치 차감 → 내 마을 `P_To_<Lane1 맵>` 포탈 위치로 이동 · `[Death] user= phase= respawn= penalty=` | 〃 · `Summon/SummonManager.mlua`(`DeductExpInLevel` · 구간 안 경험치까지만 · 레벨 유지) |
| 팝업 UI | 새 그룹 `RevivePopupGroup`(Dim + Panel + 제목/문구 + 버튼 2 · S1 · 둥근사각 RUID 틴트) · 컨트롤러 `PlayerRespawnUIController`(값은 서버가 줌 · 선택은 `Choose` 서버 RPC) | `ui/RevivePopupGroup` · `Match/PlayerRespawnUIController.mlua`(신규) |
| 훅 | `StartMatch` → `ResetForMatch(participants)`(부활 대기 15초) · `Expire` → `OnMatchOver`(기본 5초) | `Match/MatchSessionLogic.mlua` |

## 검증

- LSP 진단 0 · `node Docs/tools/check-integrity.cjs` 통과.
- 런타임(Maker): PR 본문.
