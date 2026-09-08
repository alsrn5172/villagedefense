# a/lane-eliminate-regroup — 넥서스 파괴 탈락·관전 + 수비대 최전방 추종

> 지시서: `메월드폴더/WorkOrders/WO-012-레인-마을-세로조각.md` ③ 후속(사용자 지시 2026-09-08). base `main d959bef`(PR #26 머지 후). Draft PR 락 먼저(협업규칙 §3-1-2).

## 2026-09-08 — 구현 (Play 미검증 · 사용자 지시로 Maker 안 쓰고 작성)

### 수비대 최전방 추종 — `Lane/DefenderService` · `Lane/LaneStateService`
- `DefenderService` 가 스폰한 수비 몬스터를 `units[villageId]`(ent · monsterId · statMul)로 **추적**. `SpawnBundle` 은 `SpawnOne` 반복으로 정리.
- `Regroup(villageId, frontStage)`: 살아 있는 유닛의 HP 비율을 읽어 **파괴 → 새 최전방 시설 뒤에 같은 스펙·비율로 재스폰**(맵이 달라 걸어갈 수 없다 — 미니언 `Advance` 와 같은 방식). `DefenderUnit.reported=true` 로 사망 보고를 막는다.
- 호출 경로: `LaneStateService.Changed` 가 `FrontStage(v)` 와 원장의 `v.front` 를 비교해 바뀌면 `Regroup` — 파괴(뒤로)·재건(앞으로) 둘 다. `EnsureVillage` 에 `front="TOWER"` 추가.
- 사거리는 시설과 무관하게 **포탑 사거리 Lv1(3)**(사용자 확정). 대기·목줄을 통로 안으로 클램프: `homeX ≥ PathMinX+0.4` · `LeashMinX ≥ PathMinX` · `LeashMaxX ≤ PathMaxX`(마을 통로는 넥서스 −8 뒤 여유가 1.6 뿐).
- `DespawnVillage(villageId)`: 탈락 정리용 전부 파괴.

### 넥서스 파괴 → 탈락 — `Lane/LaneStateService.Eliminate` · `Village/VillageOwnership` · `Match/PlayerEliminatedEvent`(신규)
- `ApplyDamage` 에서 CORE 파괴 시 `Eliminate(villageId)`: 수비대(`DefenderService.DespawnVillage`)·미니언(`MinionFlowService.DespawnVillage` — 레인 3맵의 `Minion_<마을>_*` 파괴) 정리 → `v.defenders={}` → `VillageOwnership.Eliminate`(소유 해제 + `destroyed[vid]` + `eliminated[owner]`) → `PlayerEliminatedEvent(MatchId "", UserId, Reason "CORE_DESTROYED")` → 토스트 → `SpectateService.Enter(owner)`.
- 시설 엔티티는 남는다(주인 없음 → `ApplyVisual` 회색 · 넥서스는 검게). 미니언 웨이브는 주인 없는 마을을 건너뛰므로 저절로 멈춤. 마을 NPC 는 리졸버(주인만)로 잠김.
- `Claim` 거절 사유 추가: `DESTROYED`(파괴된 마을) · `ELIMINATED`(탈락한 유저) → `LaneFacility.RequestClaim` 문구.

### 관전 — `Match/SpectateService`(신규 @Logic) · `Match/SpectateUIController` · `Models/Structures/SpectateCamRig`(신규 · `spectatecamrig`)
- 사용자 결정: 정리 후 **상단 관전 바** 켜고 **캐릭터 없이 자율 카메라**. 탭 = 다른 플레이어로 카메라 이동 · 월드맵 클릭 = 맵 이동 · 방향키/WASD 상하좌우 자유 이동.
- `Enter(userId)`(서버): 캐릭터 `SetVisible(false)` · `PlayerControllerComponent.Enable=false` · `HitComponent.Enable=false` · `Rigidbody.Gravity=0` · `Faction Team=Neutral`(미니언·포탑이 무시). 클라 `SetSpectating(true)`(입력 폴링 on · 클라 쪽 컨트롤러도 끔) · 관전 바 `SetActive(true)` · 생존자 닉네임 `SetTargetsCsv`.
- **자율 카메라**: 엔진에 카메라 자유 이동 API 가 없어 **CameraComponent 만 든 빈 엔티티(리그)** 를 관전자 맵에 스폰 → `_CameraService:SwitchCameraTo(rig.CameraComponent, userId)`. 클라가 `IsKeyPressed`(←→↑↓/WASD)를 0.1초마다 `RequestMoveCam(dx,dy)` 로 → 서버가 리그 Position 을 `CamSpeed 6/s` 로 이동(0.3초 유효).
- **따라가기** `SetSpectateTarget(name)`: 이름 → userId → 다른 맵이면 `TeleportToEntity` → `RebindDelay 0.8s` 뒤 그 플레이어 `CameraComponent` 로 전환(맵 입장 시 엔진이 자기 카메라로 되돌리므로 지연). `SetFreeCam(bool)`: 리그 ↔ 마지막 대상.
- **월드맵 이동** `RequestGoMap(mapName)`: `TeleportToMapPosition(hidden, (0,0,0), map)` → 지연 후 리그 재스폰. `WorldMapController.OnRegionClick` 첫 분기(관전 중이면 `regionClickEnabled` 무관).
- **자가 복구**: 클라가 2초마다 현재 카메라가 내 캐릭터 카메라면 `RequestRebind`. 생존자 목록은 서버가 5초마다 다시 보낸다.
- `SpectateUIController`: `active` 플래그 + `SetActive` Client RPC(대상이 없어도 바를 켠다 · 자유 버튼 ● 표시). 나가기는 기존 `LeaveToLobby` 스텁(로비 없음 → 토스트).
- 리모컨 `DevStatRemote` 하단 **`탈락 시험`**(694..786 · 적갈색) → `RequestDevHit("CORE", 999999)`.

### 미검증 · 확인 포인트 (Maker 켜면 로그 스모크)
1. refresh 후 build 에러 0. `.codeblock` 은 Maker 가 파일 감시로 이미 생성.
2. `ApplyDamage(TOWER 9999)` → `[Lane] HENESYS front TOWER -> SUPPRESSOR` · `[Defender] regroup HENESYS -> SUPPRESSOR n=8` · HillNorth x 7.3~8−0.7 GUARD.
3. `ApplyDamage(SUPPRESSOR 9999)` → 마을 넥서스 뒤 −8.7~−9.2(클램프).
4. `탈락 시험` → `[Lane] … CORE DESTROYED` · `[Village] eliminated` · `[Lane] HENESYS ELIMINATED` · `[Spectate] enter` · `free cam at …` · 클라 `[Spectate] spectating=true` · `open=true`.
5. 눈 확인(사용자): 캐릭터 안 보임 · 방향키로 카메라 이동 · 월드맵 클릭 이동 · 2클라면 탭 전환. **다중 클라는 Maker 다인 플레이 테스트로**(MCP 는 클라 1개).
- 불확실: `SwitchCameraTo(cam, userId)` 를 서버에서 부를 때 리그 엔티티가 클라에 이미 로드돼 있어야 한다(스폰 직후 같은 프레임에 전환 → 실패하면 자가 복구가 2초 뒤 재시도). 리그 Transform 서버 대입의 클라 반영(동기화) 도 실측 대상.
