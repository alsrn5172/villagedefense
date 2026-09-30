# a/skill-hud (base `main` · Draft PR #118 · WO-033 ②)

우하단 스킬 HUD(포션 퀵슬롯 모양) + 모바일 스킬 버튼.

## 바뀐 것

| 무엇 | 어떻게 | 파일 |
|---|---|---|
| 스킬 HUD (PC) | 우하단 바에 72px 칸 5개 **Q · W · E · R · Shift**(PC 전용 · `ActivePlatform` 1) · 칸 = 틀 + 아이콘 + 7단계 쿨 오버레이 + 남은 초(금색 · 검은 테두리) + 키 글자 | `ui/SkillHudGroup.ui`(신규 · GroupOrder 2 = 퀵슬롯과 같음) |
| 스킬 HUD (모바일) | 기본 공격 버튼 둘레에 96px 둥근사각 5개(모바일 전용 · 점프 버튼과 안 겹침) · 탭 = 시전 | 〃 |
| 컨트롤러 | 칸 스킬 = B `SkillHotbar.slots` 를 `ResolveSlotSkillId` 로 읽기만(키 배치 단일 출처) · **배운(Lv>0) 액티브만 아이콘** · 안 배운 칸 = 빈 틀 + 키 글자 · 패시브 안 뜸 · 텔레포트 = Shift 칸(강화 배우면 같은 칸이 SK_M21 로) · Shift 매핑 없는 직업은 Shift 칸 숨김 · 쿨 = `LocalCooldownRemaining` ÷ `CooldownAt` · 클릭/탭 = `SkillCaster:Cast` · 0.1초 폴링(`SkillStateChangedEvent` 는 B 내부라 구독 안 함) · `[SkillHud]` 로그 | `Stat/SkillHudController.mlua`(신규) |
| 계약서 | B 등록서 1번에 예외 한 줄 — 스킬 HUD 표시 = A · 키 배치·시전 = B (#40 comment 5875058714 공지) | `Docs/스키마-계약.md` |

## 남은 것 (B)

- 초보자 "달팽이 세마리" — NOVICE 스킬 행 · 실행기 · 초보자 자동 습득 · `SkillHotbar` byJob `NOVICE` Q (#40 comment 5875058360 요청). 들어오면 HUD Q 칸에 저절로 뜬다.

## 검증

- LSP clean · ui_lint 경고 10(PC 72px 칸 · 키 글자/쿨 숫자 겹침 — 퀵슬롯과 같은 의도된 모양).
- 사용자 2026-09-29 "월드맵에 가려진다" → PC 바를 월드맵 열기 툴바(우하단 바닥 14~114px) 위로(바닥 +126). 우하단에 늘 떠 있는 PC UI 는 그 툴바뿐(전 UI 실측) · 모바일 버튼은 툴바와 안 겹침.
- 쿨 전체 길이를 쿨 시작 순간에 고정(표 값보다 긴 쿨이면 오버레이가 꽉 찬 채 멈추던 것).

## Maker 검증 (2026-09-29 · 개인 월드에 이 워크트리 · 로비 Play · 서버 `server_main`)

| 항목 | 방법 | 로그 | 판정 |
|---|---|---|---|
| 적재 | Reimport 뒤 Play | `[SkillHud] ready (client) pc=true mobile=true` · 새 에러 0 · codeblock 생성(커밋) | PASS |
| 초보자 | 시작 상태 | `job=NOVICE cells: Q=- W=- E=- R=- Shift=-` | PASS |
| 배우면 뜸 · 패시브 제외 | 서버 원장에 M11 + M12(패시브) | `job=MAGICIAN cells: Q=SK_M11 … Shift=-` (M12 안 뜸) | PASS |
| 텔레포트 = Shift 칸 | M13 → M21 | `Shift=SK_M13` → `Shift=SK_M21`(같은 칸 교체) · E=SK_M22 · R=SK_M31 | PASS |
| Shift 숨김 | 전사 W11 + W12(패시브) | `job=WARRIOR cells: Q=SK_W11 …` · `warrior shift pcOn=false` | PASS |
| 칸 탭 = 시전 | `CastCell` | `[SkillHud] tap Shift SK_M13 cast ok=true` → `server result SK_M13 ok=true cd=2` | PASS |
| 쿨 오버레이 | 쿨 미러 | 차오름 `fill=0.4` → 남은 초 `3`→`2` → 끝 `fill=0 coolOn=false` · PC/모바일 같은 값 · 캡처에 금색 남은 초 표시 | PASS |
| 바 위치 | 런타임 트랜스폼 | `bar pos=(-20.000, 126.000) align=BottomRight plat=PC` | PASS (눈 확인은 사용자) |
| 모바일 배치 | 캡처용으로 모바일 전용 노드를 잠깐 전체 표시 → 캡처 → `git checkout -- ui/` 로 원복 | 공격·점프 버튼과 안 겹침(캡처) | 부분 (실기기 확인은 사용자) |

- 런타임에 `UITransformComponent.ActivePlatform` 대입은 안 된다(`cannot set ActivePlatform, no such field`) — 모바일 표시 확인은 파일을 잠깐 바꿔서만 가능.
- 못 본 것: 실제 모바일 기기 · 무기 낀 상태의 공격 스킬 실시전 쿨(맨손 거절이라 이동기로만 확인).
