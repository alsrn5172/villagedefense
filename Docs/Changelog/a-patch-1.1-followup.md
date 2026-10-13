# a/patch-1.1-followup — 1.1 패치 후속(비공개 테스트 서버 전 사용자 지적)

> base `main 137636e`(#205 · #206 머지 뒤). Draft #207. 2026-10-13.

## 고친 것

- **레벨업 소리 겹침**: 튜토리얼이 레벨을 한 단계씩 올려(1-2l Lv10 · 3-8l Lv20 · 6-0l Lv30) 레벨업 소리 · 이펙트 · 알림이 9~10번 동시에 나왔다(사용자 "레벨업 소리 뒤지게 크다").
  - `TutorialService.RaiseLevel`: 목표 레벨까지 모자란 경험치를 다 더해 `GrantKillReward` 한 번에 넣는다 — 레벨마다 보상은 그대로 · 연출은 한 번(최종 레벨 알림). 로그 `[Tutorial] raise level -> LvN (target N · +X exp at once)`.
  - 안전장치(사용자 "안전장치 넣어라"): `StatusHUDController.PlayLevelUp` 가 `LevelUpDedupeSeconds`(0.5초) 안에 또 오면 소리 · 이펙트를 건너뛰고 알림 숫자만 바꾼다(개발 리모콘 레벨 올리기 등 다른 경로도 막힌다). 로그 끝 `(겹침 · 소리 · 이펙트 건너뜀)`.
- **튜토리얼 직업 소개 도적 무기**: "아대 · 단검" → "아대 · 표창"(사용자 · 도적은 아대만 쓴다).
- **UI 위 클릭이 뒤 NPC 로 샘**: 튜토리얼 안내창을 누르는데 뒤의 차원의 거울이 눌렸다(사용자 "UI 클릭 시 뒤 NPC 같은 상호작용은 애초에 무시").
  - `VillageNpcUIController.IsWorldClickBlocked(touchId)`: 누른 자리가 UI 위(`_InputService:IsPointerOverUI` · RaycastTarget 켜진 UI)거나 마을 · 캐릭터 창이 열려 있으면 월드 클릭 무시. NPC(`VillageNpcInteractor`) · 넥서스(`LaneFacility`) 클릭이 같이 쓴다. 로그 `[WorldClick] blocked: pointer over UI`.
- **겹친 NPC 가 한 클릭에 같이 열림**: 차원의 거울을 누르면 전사 전직관도 눌렸다(사용자 "한 번에 하나만").
  - 원인: `TouchReceiveComponent.RelayEventToBehind` 기본 true 라 겹친 물체가 같은 클릭을 각각 받는다.
  - `VillageNpcUIController.OfferWorldClick` · `ResolveWorldClick`: 같은 클릭의 후보를 0.05초(`WorldClickWindow`) 모았다가 누른 자리에 클릭 영역 가운데(위치 + `TouchReceiveComponent.Offset`)가 가장 가까운 하나만 실행. 로그 `[WorldClick] N candidates -> 이름`.
- **도움말 1쪽(튜토리얼 시작)에 [다음] 없음**: 예전 WO-051 은 큰 버튼 두 개가 다음 행동이라 [다음] 을 껐는데, 매치 · 튜토리얼 안에서 연 도움말 1쪽에서 넘어갈 길이 흐린 [이전] 뿐이었다(사용자) → 1쪽에도 [다음] 을 켠다(`GameIntroController.RefreshButtons`).

- **도움말 마을 문장 → 마을 시설 창**(사용자 "6쪽 마을 문장에 마우스를 올리면 그 마을의 포탑 · 억제기 · 넥서스 설명창"): `GameIntroController` 가 소개 쪽 `Illu/Town1~5`(지금 6쪽)를 찾아, 커서가 문장(또는 아래 이름 칸) 위에 0.25초(`EmblemHoverDelay`) 머물면 · 누르면(`ScreenTouchEvent` · 모바일) `TutorialInfoUI.OpenTown(마을)` 로 튜토리얼 마을 시설 창을 그 마을 탭 · [확인] 버튼으로 도움말 위에 띄운다(그룹 형제 순서를 도움말 바로 위로). 닫은 뒤 같은 문장 위에 그대로 있으면 다시 안 뜬다(벗어났다 와야). 문장 · 이름 칸 판정 = `_UILogic:ScreenToLocalUIPosition` + 크기 · 피벗(UI 파일은 안 고침).
  - ESC: 그 창이 떠 있으면 `UIEscStack` 이 도움말까지 같이 닫지 않는다(창이 스스로 ESC 로 닫힘).

- **도움말 · 시설 창 ESC**: 시설 창의 키 처리가 먼저 돌아 닫힌 뒤 같은 ESC 로 도움말까지 닫혔다(Play 실측) → `TutorialInfoUI.closedAt`(닫힌 시각)을 두고 `UIEscStack` 이 0.1초 안에 닫힌 것도 같은 ESC 로 본다.
- **6단계 발록 포탈 앞에서 멀어지면 되돌림**(사용자 "발록 제단 포탈 앞에서 안 들어가고 밖으로 나가진다 · 포탈 근처에서 멀어지면 되돌려라"): 장면 6-3b 에 leash(가로 3 · 세로 2.5 · 기준점 = 포탈 앞 `leash.at`) + `leash.map`(다른 맵으로 나가도 되돌림 · 발록 방 입장 = 장면 완료라 제외).
  - `TutorialDirector.TickLeash` 가 다른 맵이면 `back:<맵>:<x>:<y>:map` 을 보낸다(맵을 넘는 왕복이라 3초 간격) · `TutorialService.MoveBack(…, anyMap)` 이 맵이 달라도 되돌린다(예전 장면은 그대로 같은 맵에서만).
- **파워 스트라이크 시전(기 모으는) 이펙트 위치**(사용자 "캐릭터 주위에 나와야 하는데 전방에서 나온다"): 1.0.3 에서 판정 상자에 맞추느라 앞 1.21 · 가로 ×1.303 으로 옮겼던 시전 광선을 캐릭터 몸 가운데로(크기 1 · 앞 −0.03 · 위 0.33 = 클립 가운데를 몸 가운데 0.55 에). 판정 · 잔상은 그대로. 디자인 명세 사이트 N47(PS 시전 광선 · 새 그림 대상)의 '판정에 맞춤' 설명은 후속으로 고친다.

- **튜토리얼 파병 10초 기다림 삭제**(사용자 "파병 진짜로 10초 기다리는 거 너무 에바 · 안 기다리고 다음 진행"): 장면 6-2w(11초 대기 말풍선)를 뺐다 — 6-2e [다음] → 바로 6-3(발록). 튜토리얼 가상 상대는 주인이 없어 기다려도 보이는 출발이 없었다. 장면 135 → 134.

- **도발 이펙트 크기 원래대로**(사용자 "도발이 왜 이렇게 커졌냐 · 도발은 그럴 필요 없다 · 원래대로 · 이건 안 변하는 거니까 영상도 찍지 마"): 1.0.3-M1-07 의 레벨별 크기 표 `effectOverrides.SK_W22.castFit` 를 뺐다 → 시전 이펙트 = 1.1 이전 원래 크기(무기별 앞 0.04). 판정 반경(3 ~ 5)은 그대로.
- **텔레포트 · 텔레포트 강화 이펙트는 그림 그대로**(사용자 "마법사니까 이 정도는 괜찮다 · 타이밍 수정은 해라 · 이펙트 RUID 변경은 하지 마 · 강화도 마찬가지"): 1.1-L04/L05 시점 수정(키를 누른 순간 시전자 화면에 바로 재생 · 1차 Play A1-2a 통과)은 그대로 · 디자인 명세 사이트 '새 그림 대상'(N51 텔레포트 고리)에서 빼는 것은 후속.
- **이용권 창이 '1일 · 1일 · 3일'로 보임**(사용자 "1 · 3 · 7일권이었는데 왜 바뀌었냐"): 바뀐 게 아니라 새 테섭 월드(c598770f…)에 이용권 상품 행이 없어 `BoostShopUIController.LoadRows` 가 다른 월드 행 6개(그룹 · 개인 월드 1 · 3 · 7 두 벌)로 카드만 보이다 일수 순 앞 3개만 남았다 → 다른 월드 행으로 보일 때는 같은 일수를 한 번만(1 · 3 · 7 · 구매 버튼은 그대로 막힘). 테섭 월드에서 실제로 팔려면 그 월드에 월드 상점 상품 3개 등록 + `BoostProduct.csv` 행 추가가 필요하다(사람 결정).

- **아이템 줍기 "띠링" · 포탈 "후우웅" 소리**(사용자 "아이템 습득 소리가 없다" · "포탈 탔을 때도 소리가 없다"): `StatusHUDController.PlayPickupSound` · `PlayPortalSound`(Client · 미리 불러 둠).
  - 줍기 = `ItemDrop.TryGive`(실제로 들어갔을 때) · `MesoCoin` 줍기 · 간격 `PickupSoundGap` 0.08초. 포탈 = 일반 포탈 · 리스항구 · 보스 입장 · 발록 방 입장.
  - 포탈 소리 RUID 는 후보(사용자가 듣고 고름).
- **물약 먹는 소리**(사용자 "f399837e… 는 물약 먹을 때 나는 소리로"): `StatusHUDController.PlayPotionSound` · `InventoryService.UseInstance` 가 소모에 성공하면 그 사람에게(Play: 빨간 포션 → `[Status] potion sound`). 줍기 소리는 사용자 지정 `205510b3…`(1.12초 밝은 알림음)로 바꿨다.
- **더블 점프**(사용자 "위로 힘 50% 더 · 윗점프는 다른 방향 속도를 줄이지 말고 순수하게 위로"): 옆 더블 점프 위 힘 3.0 → 4.5(`DoubleJumpLift`).
  - 윗점프는 가로 속도를 그대로 둔다(`UpJumpKeepMomentum` · `UpJumpKeepScale` 28 = Play 실측: `RealMoveVelocity` 가 프레임당 값이라 1.0 이면 가로가 1.81 → 0.19 로 죽었다 · 28 에서 1.79 → 1.73).
- **아래 점프**(사용자 "아래 키 꾹 누르는데 씹힘 · 아래 점프 뒤 위 계단에 올라탐 · 0.2초 발판 무시"): `SkillMovement`.
  - 씹힘 보정: 아래 키를 누른 채 점프 키(Space · 왼쪽 Alt) → 0.06초 안에 엔진 아래 점프가 안 나가고 여전히 서 있으면 직접 `DownJump()`.
  - 0.2초 보호(`DownJumpGuardSeconds`): 아래 점프 뒤 0.2초 안에 출발 발판이 아닌 발판에 닿으면 한 번 더 아래로. 출발 발판은 마지막으로 서 있던 발판(`lastGroundFh` · 엔진 이벤트 땐 이미 떠 있어 0 이 나왔다 · Play 실측).
- **텔레포트 착지 ±0.3**(사용자 "위아래 ±0.3 정도의 발판을 찾아 올라타게"): `ResolveHorizontal` 이 목적지에서 지금 높이 ±`TeleportSnapBand` 안의 발판을 먼저 찾는다(branch `band`).
- **방향키 없는 텔레포트 = 제자리**(사용자 "마법사 텔레포트는 방향키 없이 쓰면 제자리에 텔포"): 방향키 · 조이스틱 입력이 없으면 옮기지 않는다(branch `in-place` · `TeleportInPlaceWithoutDir`). 이펙트 · 소리 · 강화 도착 광역 피해는 제자리에서.
- **텔레포트 강화 소리 늦음**(사용자 "소리가 이펙트보다 한 층 느리다"): 텔레포트 소리를 `OnBeginPlay` 에서 미리 불러 둔다(첫 재생 때 불러오느라 늦었다).
- **알림창이 ★1 길안내 바를 가림**: `UIToast.PlaceBelowGuide` — 길안내 바(와 펼친 체크 목록)가 떠 있으면 토스트를 그 아래 8px 로 내린다.
- **미니언 투입 30초 전 빨강 + 경고음**(사용자): 다음 투입까지 30초 이하면 페이즈 칩 · "다음 투입" 글자가 빨강(`MatchClockUIController.MinionWarnSeconds`).
  - 투입 순간 경고음 `MinionAlertSoundRUID`(사용자가 후보를 듣고 고름 · 빈칸이면 소리 없음).
- **도감 등록 재료 8 → 3**(사용자 "도감 뚫는 데 재료 3개만"): `LaneStateService.CollectionUnlockCount` 3 · `GuideService.UnlockMaterialNeed` 3 · 튜토리얼 · 길안내 문구(`GuideStep.csv` G8U · T3). 수비대 모집은 8 그대로.
- **수비대 모집 재료 드랍 확률 ×2**(사용자 "수비대 안 모인다"): `DropTable.csv` MONSTER 34행(MAT_*) Chance ×2 — 0.125~0.15 → 0.25~0.30. 개수 · ★별 배율(HUNT_MAT_MUL)은 그대로.
- **빅토리아 주화 미니언 드랍 20~30% → 25~35%**(사용자): `MinionPhaseConfig.csv` CoinDropChance PHASE1 · 2 0.02 → 0.025 · PHASE3 0.03 → 0.035(TEST · LIVE 둘 다 · × `VictoriaCoinMul` 10).
- **즉시 사망**(사용자 "플레이어 죽자마자 아무 행동도 못 하게 하고 죽어버리게 · 지금 죽는 거에 문제가 많다"): `PlayerHit`.
  - 내 클라가 HP 가 양수 → 0 이하로 떨어지는 프레임에 바로 `ProcessDead`(서버 0.2초 재확인은 안전장치로 남김). HP 0 인 채 살아난 경우는 다시 죽이지 않는다.
  - 쓰러진 순간부터 이동 · 점프 · 아래 점프 · 공격 · 엎드리기 막음(`InstallDeathGate`) · 스킬(`SkillCaster.Cast` · 서버 `RequestCast` 0번) · 포탈 · NPC · 시설 클릭 막음.
  - HP 0 에서 되살아나던 구멍: 포션(`InventoryService.UseInstance` · 소모 없이 거절) · 시설 오라 회복 · 스킬 HP 환급이 HP 0 이면 회복하지 않는다.
- **스킬 꾹 누르기 = 연속 시전**(사용자 "꾹 누르면 사용된 판정 · 다다다 누르기 힘들다"): `SkillHotbar.HoldRepeat`.
  - 공격 스킬(근접 · 투사체 · 광역) 키를 0.3초 넘게 누르고 있으면 시전 락 · 쿨다운이 풀릴 때마다 다시 시전. 짧게 누르면 예전처럼 한 번.
  - 버프 · 토글 · 이동(텔레포트) · 궁 · 재시전은 대상 아님. 안 배운 스킬은 무장 안 함. 서버가 거절하면(맨손 등) 1초 쉬었다가 다시.
  - 모바일 스킬 칸도 눌린 동안 같은 규칙(`SkillHudController` · `ButtonStateChangeEvent`).
- **매치 소리 4종**(사용자 RUID 지정): 시작 `04ca8c28…`(리스항구 도착 = `StartMatch`) · 게임 오버 `27d957fc…`(넥서스 파괴 · 미점령 탈락 순간 = `OnPlayerEliminated`) · 승리 `713eb3fa…`(주니어 발록 선취 = 결과 화면) · 패배 `e64a2dfc…`(발록을 못 잡고 끝남 = 결과 화면 · 탈락자는 게임 오버를 이미 들어 결과 화면에선 안 냄).
  - `MatchSessionLogic.PlayCueHere`(방에 있는 사람에게만) → `StatusHUDController.PlayMatchCue`. Play: START · GAMEOVER(결과 화면 LOSE 없음) · START → 시간 종료 LOSE · START → 발록 선취 WIN.
- **미니언 투입 경고음 = 카운트다운**(사용자 "째깍째깍 5초부터 반복 · 3.1초부터 기본 카운트다운 반복 · 0초에 둘 다 멈춤"): `MatchClockUIController` 가 `PlayLoopSound` / `StopSound` 로. 째깍 `d2aa7ffc…` · 카운트다운 `7ca9fa1a…`.
  - 서버 시계가 소수 남은 초(`nextExact`)를 같이 보낸다(`BroadcastClock` · `Apply` 인자 하나 추가) — 1초마다 오는 정수로는 3.1초를 못 맞춘다. 앞서 넣은 투입 순간 단발 경고음(`MinionAlertSoundRUID`)은 지웠다.
  - Play: 째깍 4.98초 · 카운트다운 3.09초 시작 · 투입(-0.02초)에 둘 다 멈춤.
- **죽었을 때 소리**(사용자 `8727e134…`): 내 클라에서 사망이 켜지는 순간 한 번(`PlayerHit` → `StatusHUDController.PlayDeathSound`). Play 확인.
- **마법사(투사체) 데미지 스킨**(사용자 "3271c3e7… 로 안 되는 게 있다 · 스킬일 때 특히"): 원인 = 엔진은 공격한 엔티티의 `DamageSkinSettingComponent` 스킨을 쓰는데 투사체(에너지볼트 · 달팽이 · 화살 · 표창) 모델엔 그 컴포넌트가 없어 엔진 기본 스킨(`6ba67548…`)이 나왔다.
  - `SkillAttack.ApplyCasterDamageSkin`: 투사체를 스폰할 때 시전자 스킨 설정을 그대로 복사(없으면 붙임). Play: 클라에서 투사체 스킨 = `3271c3e7…` · 달팽이 4마리 명중 숫자 표시.
- **포탈 재이동 잠금 2.5초 → 1.75초**(사용자 · `PortalNetwork.PortalLockSeconds` · 튜토리얼 0.5초 그대로).
- **포탈 소리 = `95039eb5…` 를 1.0초부터**(사용자): 엔진 `PlaySound` 에 시작 위치가 없어 원본(3.53초)을 1.0초부터 잘라(2.53초 ogg) 그룹 저장소(mIYbC)에 올렸다 → `1f4e6c94…`. (mp3 는 저장소 등록이 실패해 ogg 로 올림) Play: 재생 로그 · 오류 없음.
- **피스트인레인지 이펙트 높이**(사용자 "좀 위에서 나오는 것 같다"): 휩쓸기 · 발밑 겹 두 장 모두 0.35 내림(`SkillExecutors` SK_P21 `punchCast` · `punchCast0` offsetY 0.52 → 0.17). 판정 상자 그대로. Play 녹화: 고치기 전 머리 높이 → 고친 뒤 손 · 가슴 높이.

## 확인

- mLua LSP: 고친 `.mlua` 전부 오류 0. 빌드 경고 26(기준선) · 오류 0.
- Play 실측(2026-10-14 · 로비): 제자리 텔레포트 dx 0 · 방향키 → 3 이동(band) · HP 0 → 같은 프레임 DEAD · 사망 중 이동 0 · 점프 · Q 거절 · 부활 뒤 정상 · 꾹 누르기 반복(몽둥이 끼고 Q 3초 = 8번 전부 서버 성공 · 0.4초 간격 = 시전 락 · 안 배움 = 무장 안 함 · 맨손 서버 거절 = 1초 간격) · 더블 점프 힘 (3.0, 4.5) · 윗점프 가로 유지 · 아래 점프 -0.58 → -1.43 출발 발판 기록.
- Play 확인은 아래 체크리스트(Draft #207 본문).
