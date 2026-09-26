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
- 배포 게이트는 게시 월드에서만 확인 가능(Maker 에서는 그대로 켜짐 — `[DevRemote] ready (server) enabled=true`).

## Maker 검증 (2026-09-26 · 개인 월드에 이 워크트리 · Reimport All)

| 항목 | 결과 |
|---|---|
| 빌드 | 새 경고 0 (예전부터 있던 `ParseStatCsv` LWA-1111 1건뿐) |
| 로비 | 새 Logic 전부 로드 · 새 계정 기록 로드 `mon=0 boss=0 achDone=0 hist=0` · 계정 창 4탭 서버 응답(도감 38 · 업적 17 · 칭호 17 · 기록 NONE) |
| 로비 → 매치 | 실제 경로(`RequestCreateMatch` → `RequestStartMatch`)로 인스턴스 룸 입장 · 기록 3키 다시 로드 |
| 집계 · 도감 · 업적 | 처치 101(엘리트 1 포함) → 도감 T1 +5 · T2(100) +10 · 엘리트 T1 +10 / 보스 2220000 → 도감 T1 +15 · `ACH_BOSS_1` 완료(+50 · Lv1→2) · 칭호 `TTL_BOSS_HUNTER` 지급 / 성장도 +3 · 같은 키 재요청 0 · +1 / 공개 요약 `SUM|…|101|1|` |
| 성능 | 처치 100건 = 게임 루프 안 2ms (Maker 스크립트로 부르면 14초 — 실행기 탓) |
| 파병 배지 | 서버 `HENESYS - -> 소` · 클라 `[DispatchBadge] client 소` |
| 중복 파괴 | `TestDestroyOnce(HENESYS,false)` **PASS** (포탑 파괴·알림 2/2 · 억제기 1/1 · 폭발 1/1 · 두 번째 치명타 INVALID) |
| 정산 | 전원 탈락 종료 → `ACH_MATCH_1` 완료 · `RANK_FIRST` 없음(탈락한 1위 — 규칙대로) · 기록 1줄 `rk=1 o=ALL_OUT x=25 k=201` · 이탈 저장 `AccountAchievement 124B` · `MatchHistory 99B` |
| 유지 | 로비 복귀 · 두 번째 룸 입장 모두 `mon=1 boss=1 achDone=2 hist=1` 로 다시 로드 · 칭호 장착 → 이름표 `신입 수비대원 밍키타`(룸 이동 뒤에도 다시 붙음) |
| 5레인 부하 | 5마을 점유(가짜 주인 4) · TEST 웨이브 90초: 대기 fps 29~32 → 미니언 40마리 동시 21~26 · 최장 프레임 0.46초. 가짜 주인에게 가는 RPC 오류(LEA-3032) 265건이 섞여 실제보다 나쁘게 나왔을 수 있음 · 파병 상한은 이번에 안 잼 |

- Reimport 로 생긴 새 `.codeblock` 8개(묶음 2·4·5·6 스크립트)는 **이 묶음(맨 위)에 모아 커밋** — 스택을 한 번에 머지하므로 main 결과는 같다. 묶음 2~6 브랜치를 따로 머지하면 그 스크립트가 Maker 에 등록되지 않는다.
- 새 codeblock 머리의 `CoreVersion` 은 사용자 Maker 기준 `26.7.0.0`(기존 파일 113개도 이미 26.7 · 28개는 26.5).

## 사용자 결정 반영 (2026-09-26)

- 정리: **4번만 삭제** — `MonsterInfo` 행 `9010028` · `9010033`(모델 없는 쓰로우백 2종 · 런타임 참조 없음 · 문서·히트박스 캐시에만 이름) → `check-integrity` C6 경고 2건 해소. 1~3번(테스트맵·리모콘 · 개발용 스탯 리모컨 · 맵 박제 NPC 3개)은 남김.
- WO-031 §4~§6 초안 **확정** → `CollectionReward` · `GrowthPoint` · `AchievementConfig` · `TitleInfo` 노트의 "초안" 을 "확정 2026-09-26" 으로.
- 보스 도감 인정 = 최다 피해 1명(묶음 4 브랜치에서 `BossCreditAllHitters` 기본 false · 계약 A-2-25 문구 · 앞으로 merge).

## 머지 준비 (2026-09-26)

- main 이 스택 기준점 뒤로 20여 개 PR(B 스킬 #81~#95 · 리스항구 전직관 #97 · 접속 외형 선택 #109/#110)만큼 앞서 있어 **이 브랜치(스택 맨 위)에 main 을 합쳤다.** 스택이 통합 브랜치에 모두 들어가면 #103 → main 이 충돌 없이 된다.
- 충돌 2건은 양쪽 보존: 계약서(등록서 WO-031 · WO-032 둘 다 · A-2-23~26 → A-2-27 번호순) · 정합성 검사(새 표 5개 모두). `Item/EquipService` 는 자동 병합(서로 다른 메서드 · LSP clean). `check-integrity` 전부 통과.
- 계약서 등록서 7번의 계정 창 GroupOrder 를 실제 값 **11** 로 정정(계획값 5 가 남아 있었다).
- 그래서 이 PR(#113)의 변경 목록에는 main 쪽 파일도 보인다 — 새로 고친 게 아니라 main 반영분이다.
