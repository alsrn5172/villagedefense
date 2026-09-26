# a/m1-7-cleanup (묶음 7 · 통합 브랜치 `a/m1-finish` · base `a/m1-6-history` · PR #113)

정리 후보 목록 · 개발 도구 배포 게이트 · 5레인 부하 계측 (WO-031 묶음 7 · GDD §7 Phase 5).

## 바뀐 것

| 무엇 | 어떻게 | 파일 |
|---|---|---|
| 정리 후보 | 맵 43개 · UI 22개 · 개발 도구 전수 조사 → 후보 4건 + 남길 것 목록. **지운 것 없음**(사용자 승인 대기) | `Docs/M1-정리후보.md`(신규) |
| 🔴 배포 게이트 | 개발용 스탯 리모컨 `DevStatRemote` 가 배포 월드에서도 켜졌다(백쿼트 → 스탯·메소·보석·AP 지급 RPC 가 `Enabled=true` 만 봤다) → `OnBeginPlay` 에서 Maker Play 가 아니면 `Enabled=false`(서버 RPC 전부 · 클라 패널 둘 다 이 값을 본다) | `Stat/DevStatRemote.mlua` |
| 부하 계측 | `MatchTallyService.StartLoadProbe(초)`(Maker Play 전용) — 서버 fps · 최장 프레임 · 마을별 미니언/수비대/파병 개체/파병 대기 5초마다 `[Load]` | `Match/MatchTallyService.mlua` |

## 검증

- LSP clean · `check-integrity` 통과.
- 🟡 **Maker 검증 대기**: 5레인 부하(레시피 = `Docs/M1-정리후보.md` 끝) · 배포 게이트는 게시 월드에서만 확인 가능(Maker 에서는 그대로 켜짐 — `[DevRemote] ready (server) enabled=true`).
