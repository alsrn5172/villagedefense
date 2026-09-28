# a/fix-facility-wave-portal (base `main` · Draft PR #117 · WO-033 ①)

사용자 제보 4건 수정 — 내 시설 피격 방어선 · 정식 시계(LIVE) + 리모콘 "다음 웨이브" · 포탈 인식 범위 · 헤네시스 발사 위치 복구.

## 바뀐 것

| 무엇 | 어떻게 | 파일 |
|---|---|---|
| 내 시설 방어선 | 피격 때 실제 공격자를 찾는다(스킬 투사체면 `CasterUserId` → 시전자). 그 플레이어가 시설과 적이 아니면(`FactionLogic.IsEnemy` = false · 내 시설) `[Facility] ally hit ignored` 로그만 남기고 원장에 넣지 않는다. 3페이즈 전 5% 저항 · 침범 안내 · REFLECT 반사도 시전자 기준으로 — 예전엔 투사체 피격이 플레이어로 안 잡혀 셋 다 빠졌다. 공격 쪽 1차 필터는 B #83(스킬·투사체 `IsAttackTarget` 진영 필터 · 9/28 머지) | `Lane/LaneFacility.mlua` |
| 정식 시계 | `MatchSessionLogic.Profile` 기본값 **TEST → LIVE**(첫 웨이브 7:30 · 만료 30분). TEST 는 리모콘 토글로 그대로 쓸 수 있다 | `Match/MatchSessionLogic.mlua` |
| 다음 웨이브 | 새 `SkipToNextWave`(남은 표 행이면 그 시각으로 점프 → 다음 프레임에 그 행 1회 · 반복 구간이면 반복 타이머 0) + `RequestNextWave`(리모콘 · `DevStatRemote.Enabled` 게이트) · 리모콘 2번째 줄에 버튼 1개 추가(기존 버튼 좌표 불변 · "다음 페이즈"와 같은 스타일) | `Match/MatchSessionLogic.mlua` · `Stat/DevStatRemote.mlua` · `ui/DevStatRemoteGroup.ui` |
| 페이즈 건너뛰기 몰림 | "다음 페이즈"로 점프하면 지나간 웨이브를 **투입하지 않고** 넘긴다(예전엔 한 프레임에 몰아 냈다) · `[Match] skip -> phase … skipped N waves` 로그 | `Match/MatchSessionLogic.mlua` |
| 포탈 인식 범위 | ↑키 판정 여유 +0.35/+0.80 제거. 노선 출발 포탈(제한 노선 포함)의 `BoxSize/BoxOffset` 을 **스프라이트 폭 × 아래쪽 절반**으로 서버·클라가 각자 덮는다(`PortalSpriteBoxes` 표 · 빨강 `227851` 1.2×0.82 @y0.31 · 파랑 `edd691` 1.04×0.71 @y0.275 · 크기는 리소스 API 116×159 / 104×138~144). 표에 없는 스프라이트는 기존 상자 그대로 + 경고. 맵 파일 수정 없음 · 렌더 층 Default/5 그대로 | `PortalNetwork.mlua` |
| 헤네시스 발사 위치 | 9/16 PR #53 머지 직전 "Maker 되쓰기"로 stash(`382a2cd`)에 묻힌 사용자 조정값 복구 — 포탑 Lv1~3 `LaunchOffsetX/Y` 0.7/0.18 · 억제기 Lv1~3 0.88/0.43 (셀만 · 다른 열 불변) | `FacilityAttackFx.csv` |

## 검증

- LSP clean(4파일).
- UI: 엔티티 190 → 191(새 버튼만) · 기존 엔티티 의미 비교 차이 0 · 줄바꿈 CRLF 유지.
- Maker 검증: 아래 표(예정).
