# b/skill-novice-double-jump — 초보자 스킬 더블 점프 (SK_N02)

## 1차 (2026-10-02 · 로컬 · push 전 · #142 위에 쌓음)

출처: A 답 #40 5927820330 Q6(사용자 강민구 · "반드시 한다 · 초보자 스킬(B) · 만렙 3 · 레벨마다 비거리가 늘어난다 · 값은 B 밸런싱"). 정해 줄 것 3건은 #40 **5954262491** 에 물었고, **B 기본값으로 먼저 만들었다** — 답이 오면 값(속성 · CSV)만 바꾼다. → **답: A 결정 #40 5977728018(2026-10-04) “세 기본값 OK”** — 바꿀 값 없음(아래 2차).

| 항목 | B 기본값 (5954262491 → **A 결정 5977728018 · OK**) | 바꾸는 곳 |
|---|---|---|
| 배우기 | SP 로 Lv1 · 2 · 3(각 1) · 해금 레벨 1 | `SkillInfo.csv` `SpCost` · (자동 Lv1 아님 — 확정 · #142 3차에서 달팽이 세마리 자동 Lv1 도 없앴다) |
| MP | 0 · 쿨 0 · 공중 1회 | `SkillInfo.csv` `MpCost` (클라 예측 `LocalMp` · 서버 `SpendMp` 둘 다 이미 있음) |
| 전직 뒤 | 마법사 = 공중 점프가 텔레포트(예전 그대로) · 나머지 직업은 더블 점프 유지 | `SkillHotbar.DoubleJumpKeepAfterJob`(false = 초보자만) |

B 가 정한 것: 그림 · 소리 = 라이브러리에서 가장 가까운 공식 클립 — **궁수 `skill/300.img/skill/3000008` "더블 점프"**(초보자용 원작 클립은 없다 · "더블 점프" 팩 검색 결과 중 효과 클립이 있고 레벨 3 단계로 커지는 유일한 팩). 모바일 점프 버튼 위험은 받아들인다(아래).

### 바꾼 것

- `SkillInfo.csv` — 새 행 `SK_N02` 더블 점프(`SK_N01` 바로 뒤 · 헤더 그대로): Tab 0 · NOVICE · 차수 0 · `PASSIVE`(슬롯 없음) · `FLAT` · BaseEffect 1.5 · EffectPerLevel 0.5(= 앞 거리값 1.5 / 2.0 / 2.5) · 아이콘 `5159af39…`. 열거값 추가 없음(계약서 변경 없음).
- `Skill/SkillHotbar.mlua` — 공중 점프 키: 마법사면 텔레포트(예전 길), 아니면 `TryAirDoubleJump` — SK_N02 배움 · 첫 점프 유예 0.2 s · 공중 1회 · 디바운스 0.25 s(텔레포트와 같은 판정) · MP 예측 → `SkillMovement.TryDoubleJump` → `SkillExecutors.RequestDoubleJump`. 새 속성 `DoubleJumpOnAirJump` · `DoubleJumpSkillId` · `DoubleJumpKeepAfterJob` · `AirTeleportJobId`.
- `Skill/SkillMovement.mlua` — `TryDoubleJump(skillId, level)`(클라): 땅이면 안 함 · 방향 = 누른 좌우 키 → 없으면 바라보는 쪽 · `RigidbodyComponent:SetForce(Vector2(방향 × 거리값 × DoubleJumpForceScale 2.0, DoubleJumpLift 1.4))`. 위치의 소유자가 클라라서 클라가 민다(텔레포트와 같은 원칙).
- `Skill/SkillExecutors.mlua` — `RequestDoubleJump(dirX)`(Server RPC): 관전자 차단 · 서버 레벨 확인 · 마법사 무시 · MP(0 이면 건너뜀) · 뛴 자리에 레벨별 그림 앞(`effect/k`) + 뒤(`effect0/k`) · 오른쪽이면 FlipX · Use 소리 `cdfecf84…` · 로그. `effectOverrides.SK_N02.levels` · `castSounds.SK_N02`.
- `Skill/SkillWindowLogic.mlua` — 툴팁 효과 줄 "공중에서 한 번 더 점프 · 앞 거리 1.5"(`FormatEffect` 의 SK_N02 분기 · #142 의 고정 피해 분기 옆 — 라벨 표 자리는 #102 · #115 · #116 이 같이 고쳐서 피했다). 초보자 탭(#142 2차)에 저절로 한 줄 더 나온다.

### 숫자 (임시 · Play 로 맞춘다)

- 앞 힘 = 1.5 / 2.0 / 2.5 × 2.0 = **3.0 / 4.0 / 5.0** · 위 힘 1.4(참고: 몬스터 넉백 `AddForce(2.5, 1.0)` · 동전 `(1.6, 1.2)`). 힘은 거리가 아니다 — 착지 x 를 재서 `DoubleJumpForceScale` · `DoubleJumpLift` 를 고친다.
- 초보자 SP: ~~달팽이 세마리 Lv2 · 3(2) + 더블 점프 Lv1~3(3) = 5 ≤ Lv7 까지 버는 18~~ → 2차: 달팽이 세마리 Lv1~3(3) + 더블 점프 Lv1~3(3) = **6 = 초보자 합계 6**(매치 시작 1 + Lv2~Lv6 레벨업 1씩 · A 결정 5977728018 · #142 3차).

### 위험 · PR 본문에 적을 것

- **모바일 점프 버튼**은 `KeyDownEvent` 를 안 줄 수 있다 → 모바일에선 더블 점프(와 마법사 공중 텔레포트)가 안 나갈 수 있다. 받아들임(사용자 2026-10-02).
- 그림 층 순서(`effect` 앞 / `effect0` 뒤)와 크기는 Play 로 확인.

### 충돌 (`git merge-tree` · 2026-10-02)

- #100 · #115 · #116: `SkillExecutors.mlua` — #142 와 같은 그 줄(`FireProjectile` 의 `SpawnProjectile` 호출 · 이 브랜치가 늘린 곳 없음).
- #102: 없음(속성 자리를 `MaxChainSteps` 뒤로 옮겨 `blinkOrigins` 와 안 겹치게). #134 · #135~#138 · #156: 없음.

### 점검

- mLua 진단 4개 파일 0 errors · 0 warnings · 0 info(`SkillMovement` 은 한 번 `@ExecSpace` 자리를 잘못 넣어 1 error → 고친 뒤 clean). `check-integrity` 통과(경고 3 = main). 줄 끝 그대로(SkillMovement LF · SkillHotbar · SkillExecutors · SkillWindowLogic CRLF · SkillInfo.csv BOM + CRLF · 33열).

### Play 체크리스트 (아직 안 함 · 캡처 없음 — 스킬 PR 규칙)

1. 초보자 SK_N02 없음: 공중 점프 키 = 아무 일 없음(`HOTBAR: air-jump` 로그 없음) · 지상 점프 그대로.
2. 스킬 창 초보자 탭에 더블 점프 · 툴팁 "공중에서 한 번 더 점프 · 앞 거리 1.5" · "SP 1" · + 로 Lv1(`[Skill] learn SK_N02 -> Lv.1 · tier 0`).
3. Lv1: 점프 → 공중에서 점프 키 → `SkillMovement: DOUBLE JUMP SK_N02 lv=1 … force=(3,1.4)` · `SkillExecutors: DOUBLE JUMP lv=1 …` · 앞으로 한 번 더 뜀 · 그림 + 소리 한 번 · 착지까지 두 번째는 안 나감.
4. Lv2 · Lv3: 착지 거리가 늘어난다(같은 자리에서 x 재기) · 그림이 커진다.
5. 좌/우 · 방향키 없이(바라보는 쪽) · 줄 · 사다리 위에선 안 나감 · 아래 점프 그대로.
6. 전직: 전사 · 궁수 · 도적 · 해적 = 더블 점프 유지 · 마법사 = 공중 텔레포트(`HOTBAR: air-jump(double) -> SK_M13`).
7. 2 클라: 다른 클라에서 움직임 · 그림 · 소리가 보인다.
8. 빌드 경고 N → N.

## 2차 (2026-10-04) — A 결정 #40 5977728018 반영 · #142 새 머리 합침

- 5954262491 에 물은 3건 = **B 기본값 그대로 OK**(SP 로 배움 · MP 0 / 쿨 0 / 최대 Lv3 · 전직 뒤 마법사 공중 점프만 텔레포트). 값 변경 없음 — "답 대기" 주석 · 메모만 고쳤다(`SkillHotbar` · `SkillExecutors.RequestDoubleJump` · `SkillInfo.csv` SK_N02 #Note).
- #142 새 머리(`c71aa4f` · 초보자 SP 규칙 + origin/main `6519369`)를 합쳤다. 초보자 SP 합계 6(시작 1 + Lv2~Lv6 레벨업 1씩) = 달팽이 세마리 3 + 더블 점프 3 → 둘 다 만렙까지 딱 맞다(남는 SP 없음 · 하나를 덜 찍으면 그만큼 남아 전직 때 사라진다).
- 합칠 때 `SkillInfo.csv`(merge=union)에 `SK_N01` 이 두 줄(예전 #Note · 새 #Note) 생겼다 → 새 줄(#142 3차) 하나만 `SK_N02` 앞 자리에 남겼다.
- 2026-10-05 더블 점프 그림: 화살 모양 앞 겹(effect) 뺌 · 둥근 별빛(effect0)만 · 크기 ×1.5 세 레벨 모두 (사용자 A3 선택)
