# a/patch-1.0.9 — 직업 스킬 연계 · 편의 수정

## 1. 도적 쉐도우 파트너 · 어벤저 (사용자 2026-10-15)

- `SkillBuffs`: 쉐도우 파트너(SK_T22) 지속 중 적에게 들어간 타수 1회마다 쉐도우 파트너 남은 쿨타임 −`ShadowPartnerHitCooldownCut`(0.1초). 타수 = `OnSkillHitMonster` 호출 수(기본 공격 · 스킬 · 투사체 · 분신 타격 · 어벤저는 맞은 적마다 2타 · 메소 익스플로전 포함 · 플레이어 대상 제외). 모아서 `ShadowPartnerCooldownPushInterval`(0.25초)마다 `PlayerSkillState.ReduceCooldown` 한 번 · 버프가 끝날 때 남은 몫 반영(`NoteShadowPartnerHit` · `FlushShadowPartnerCooldown`).
- 어벤저: `AvengerAttackSpeedMul` 1.2 → 0.6(간격 2배) · `SkillExecutors.effectOverrides.SK_T11_AV.damageMul = 2`(`PendingProjectileDamageMul`).
- `PlayerSkillState.ReduceCooldown(userId, skillId, seconds, reason)` 추가(ServerOnly · 0 아래로 안 내려감 · `SyncCooldown` 으로 HUD 갱신).
- `SkillInfo.csv` SK_T11 · SK_T22 설명 · `SkillWindowLogic` SHADOW_PARTNER 문구.

## 2. 전사 하이퍼 바디 · 검의 기운 · 콤보 데스폴트 (사용자 2026-10-15)

- 검의 기운(신규 `Skill/SwordEnergy.mlua` · @Logic `_SwordEnergy`): 하이퍼 바디(SK_W21) 지속 중 내가 처치한 대상마다 +1(최대 60). 훅 = `Monster.HandleHitEvent`(사냥터 · 엘리트 · 레인 미니언 · 파병 · 수비대 · 보스 · 분신 · 귀속 `AttackCredit.UserIdOf`) · `LaneFacility` 구조물 파괴. 보스 판정 대상(활성 BossSkillRunner · CloneSkillBrain)은 처치 대신 타수 10회마다 +1(다단 = 표시 타수 · 반사 제외 · 나머지는 보스가 바뀌어도 이어 셈). 하이퍼 바디가 끝나는 모든 길(`SkillBuffs.OnBuffEnded`)에서 0 · 매치 초기화. 소유 클라로 `SyncEnergy`.
- HUD: `SkillHudGroup` 슬롯 10개(PC · 모바일)에 `Stack` 글자(UIBuilder · 아이콘 오른쪽 아래 · 기본 꺼짐) · `SkillHudController.StackOf/UpdateStack/PaintStack` — 하이퍼 바디 칸에 1 이상일 때 숫자 · 60 이면 아이콘 깜빡임(`BlinkSeconds` 0.7 · `BlinkMinAlpha` 0.3) · 쿨 오버레이 가림.
- 콤보 데스폴트: 60 에서 하이퍼 바디 키 재입력 = 재시전 길(`IsRecastActive` · `LocalIsRecastActive` · `IsRecastCast` → `IsDeathfaultReady` · 쿨다운 게이트 건너뜀 · 락 `SK_W21_RECAST`) → `ExecuteDeathfault`. 시전자 중심 12.8×7.2 상자 · 가까운 순 15명 · 880% × 14타(`DealSequenceHit` · `SkillAttack.PendingRatioOverride` · `SkillDatabase.DamageAtRatio`) · 시전 중 무적 · 끝에 쿨타임 0(`ReduceCooldown`) → 하이퍼 바디 종료 → 검의 기운 0.
- 연출 타임라인 `effectOverrides.SK_W21_CDF`(사용자 2026-10-15 "검 아래에서 위로 휘두른 다음 화면이 멈추는 연출 · 사선으로 화면이 잘리는 애니메이션"): ① 올려 베기 0~0.5 · ② 정지 0.5~1.0(대상 적 이동 · 공격 정지 `FreezeEnemies` = `StateChaseMonster.CastFreezeLeft` · `MonsterHit.StaggerUntil` · `MovementComponent:Stop` + 월드 겹침 스프라이트) · ③ 화면 가르기 1.0~1.8(14타 고르게) · ④ 끝 1.8~2.0. 시전 락 · 무적 2.0초(`DeathfaultTotalSeconds` 클라 미러). RUID 칸은 원작 리소스 조사 뒤 채움(빈 칸은 건너뛰고 경고 한 줄).
- `SkillInfo.csv` SK_W21 설명 한 문장.
- 원작 연출(사용자 2026-10-15 "원작 세트 · 원작 그대로 약 2.9초" · 원작 = KMS 400011027 · MSW 팩 skill/40001.img/skill/400011027): 단계 길이 swing 1.14 · freeze 0.72 · cut 1.02 · finish 0.02 = 2.90초(`DeathfaultTotalSeconds` · `castLockOverrides.SK_W21_RECAST` 2.9). 시전자 effect `fa4309d8`(불꽃 검 충전 → 대각 베기) · Use 소리 `b9c62d5f` · 몸 동작 = 원작 5thDeathFault 7프레임(`bodyFrames`) · screen 클립 `9aac6392`(`cut.playAt` 0 · 앞 1.14초 빈 칸 · 1.86 순백 → 폭발 · ×2 · 플레이어 바로 뒤 `ApplyBehindPlayerSorting`) · special 소리 `54e34c5a`(가르는 순간) · 14타 2.04 ~ 2.82(0.06 간격) · 명중 `2ef064f2` · Hit 소리 `f8840bbb` 4타마다(`cut.hitSoundEvery`). 화면 색 겹침 `freeze.tint`(`PlayDeathfaultTint` · screen 31프레임 순백 고정 × 색 · 원작 effectFlash 흰 번쩍 0 ~ 0.18 · 검정 암전 1.14 ~ 2.76 시각표 · 알파는 원작 값을 % 로 읽음).

## 3. 마법사 매직 가드 · 텔레포트 강화 (사용자 2026-10-15)

- `SkillExecutors.OnTeleportEnhancedHit`: 매직 가드(SK_M22) 지속 중 텔레포트 강화(SK_M21 도착 광역)가 적을 1명 이상 때리면 시전당 1번 매직 가드 쿨타임 −`MagicGuardTeleportCooldownCut`(0.5초). `SkillInfo.csv` SK_M21 · SK_M22 설명.

## 4. 몬스터 죽는 소리 절반 (사용자 2026-10-15)

- `Monster.DieSoundMasterMul` 0.5 — 모든 사망 소리(`Monster` · `LaneStateService` 미니언 처치) 크기에 곱한다. 맞는 소리는 그대로.

## 5. 피스트인레인지 꾹 누르기 · 10타 한 번에 (사용자 2026-10-15)

- `SkillHotbar.BeginHold`: 재시전 공격(에너지 차지 변신 중 피스트인레인지)도 꾹 누르기를 건다(`IsDamagingCast(skill, recast)` · `holdRecast`). `TickHold` 는 변신이 끝나면 "recast ended" 로 멈춘다(차지를 다시 켜지 않게).
- `SkillExecutors.PunchSequenceHits` true → false: 맞은 적마다 판정 1번에 10타(표 % × 10)가 한꺼번에 → 몬스터 피격 소리도 적마다 1번(예전 = 적 × 10번 겹침). 숫자 10개 · 폭발 10번은 0.12초 간격 연출 그대로 · 합계 피해 같음.

## 6. 에너지 쉴드 — 막은 피해 파란 숫자 · HP 바 위 쉴드 바 (사용자 2026-10-15)

- 보호막이 다 받아 낸 타격은 HP · 경직 · 넉백 · 피해 숫자가 없어(정상 · `PlayerHit` 가 기본 피격을 건너뜀) "안 맞은 것" 처럼 보였다 → `SkillBuffs.AbsorbByShield` 가 막은 양을 `ShowShieldAbsorb` → `PlayShieldAbsorbNumber`(Multicast)로 맞은 플레이어 머리 위에 파란 숫자(`ShieldAbsorbSkinId` = 공식 예제 MP 회복 숫자 스킨 0910d8fa…). 깨지는 타격은 `ShieldAbsorbBrokenOffsetY`(0.45) 위로.
- 쉴드 바: `SkillBuffs.SyncShield`(Client · 시작 · 흡수 · 종료 때 소유 클라로) → `localShield` / `LocalShield()`. `StatusHUD` `Hp/img_shield`(img_bar 와 같은 칸 · 오른쪽 끝 pivot 1 · MP 바 그림 af6be26d · img_bar 와 HP 숫자 사이 순서 · 처음 꺼짐 · 고정 id 5d1e6a0b…) · `StatusHUDController.SetShieldBar`: 폭 = HP 바 전체 폭 × 남은 보호막 ÷ 최대 HP(오른쪽에서 왼쪽으로) · 0 이면 끔. 빌더 스크립트 `handoff/patch107-agents/_work/P/hp-shield-bar.cjs`.

## 8. 보스 피해 · 발록 졸개 (사용자 2026-10-15)

- `BossInfo.AttackPower`(몸통) · `BossSkills.Damage`(소환 줄 제외): 주니어 발록 ×2 · 마을 보스 6종(마노 포함) ×5 · 킹슬라임 · 머쉬맘 · 스텀피 몸통은 ×25(따로 ×5 더). 스크립트 `handoff/patch107-agents/_work/P/boss-damage-109.cjs`(그 칸 글자만 · BOM · CRLF 그대로).
- 발록 졸개 역할 바로잡음("아이언보어가 아이언호그를 부르는 건데 반대로"): `BossSkills` 8130100 S4 = 아이언보어 소환 · `ProjectileModelId` `monster4230400boss`(새 보스 모델 · 아이언보어 모델 복사 + MonsterAttack 빼고 BossSkillRunner · `build_boar_boss_model.cjs`). `BossSkillRunner.SummonRule`: 아이언보어 Lv35(230,000 · 보스 판정 · HP 50% 이하에서 아이언호그 3마리 한 번) · 아이언호그 Lv30 기초 7,500 × 20 = 150,000(일반) · 발록 좀비버섯 기초 × 10 → 225,000(`baseHp` · `baseHpMul` 규칙 추가 · 다른 좀비버섯은 그대로). 옛 `monster4230103boss` 모델은 남겨 둠(안 씀).

## 9. 보스 피격 모습 0.6초 (사용자 2026-10-15)

- `Monster.BeginBossHitPose` · `CheckBossHitPose` · `EndBossHitPose` · `BossHitPoseSeconds` 0.6: 보스 판정 개체가 패턴 중이 아닐 때 맞으면 ActionSheet `hit` 클립 → 마지막 타격 0.6초 뒤 지금 상태 클립(stand · move …). 1% 문턱(밀림 · 플래시)과 무관 · 상태 전이로 엔진이 클립을 바꾸면 다음 틱에 hit 를 다시 건다(`HandleStateChangeEvent`) · 패턴 · 사망이 이긴다.

## 10. 궁극기 피해 타이밍 · 숫자 · 타격음 (사용자 2026-10-15)

- `ShowUltimateTotalDamage` false — 영상이 끝난 뒤 숫자를 모아 띄우지 않는다("숫자는 때리는 즉시").
- `UltimateHitTimes` 새 규칙: 타수 절반(`UltimateLateShare` 0.5 · 올림) = 영상 끝 `UltimateLateSeconds`(1.5)초 구간에 고르게 · 나머지 = 영상 끝 + `UltimateBurstDelay`(0.05)에 한꺼번에(`UltimateBurstStart` · 대상마다 한 패스 · 숫자 `UltimateBurstDisplay` = 5타씩 묶음). 대마법(`BlastSplitHit` displayHits) · 폭풍의 화살(`StormArrowSplitHit` displayHits) · 메소 익스플로전(동전 절반 · 절반) · 함포 사격(앞 파 = 영상 끝 1.5초에 패스 나눠 · 뒷 파 = 한 패스). 예전 기획 타이밍 파일 시각은 안 쓴다.
- 타격음: `PlayUltimateHitSound`(시전자마다 `UltimateHitSoundGap` 0.15초 간격 · 한꺼번에 들어갈 때 한 번 더) — 대마법 · 폭풍의 화살 명중음 · 함포 사격 파 소리.

## 11. 장비 판매 편의 (사용자 2026-10-15)

- `EquipSellUIController`: 더블클릭(같은 칸 0.35초 안) · 우클릭(`KeyboardKey.Mouse1` + 마우스가 올라간 칸 · `ButtonStateChangeEvent`) · 좌클릭 뒤 [판매] → 한 입구 `RequestSellFor` → 확인 창 "판매하시겠습니까?"(장비 · 받는 것) · Enter = 판매 · Esc = 취소 · "이번 게임에서 다시 묻지 않기" v 켜고 판매하면 이번 게임 동안 바로 판다(`skipConfirm` · 매치마다 인스턴스 룸이라 판이 바뀌면 다시 묻는다).
- 확인 창 `VillageWorkshopGroup` 루트 `SellConfirmDim` · `SellConfirm`(기존 스킨 · 이용권 상점 구매 확인과 같은 조각 · 고정 id · `handoff/patch107-agents/_work/P/apply-sell-confirm.cjs`).
- `ChatService.OnKeyDown`: 확인 창 Enter 는 채팅 입력을 열지 않는다(`ConsumesEnter`) · `UIEscStack`: 확인 창 Esc 는 공방 창까지 닫지 않는다(`ConsumesEsc`).

## 7. 장비 판매 — 강화 보석 절반 환급 (사용자 2026-10-15)

- `EquipSellService.Quote`: 박힌 보석을 종류마다 (칸 수 × 부위 수) ÷ 2 내림만큼 보석 아이템(`GEM_<id>`)으로 돌려준다(`q.gems` · `q.gemUsed` · `q.gemBack` · `CanSell` · `RefundText` · `RequestSell` 지급). 1.0.7 의 `GemBuyMeso`(보석 메소 값 · 0) 삭제.
- `EquipSellUIController.RefreshDetail`: 판매가 칸은 2줄(메소 · 구매 재료) 그대로 · 아래 줄에 "강화 +N · 보석 X개 → Y개 돌려받음" · 판매 뒤 토스트에 보석 이름별 개수. 안 쓰게 된 `GemCount` 삭제.

## 12. 파괴된 빅토리아 아일랜드 (WO-054 · 사용자 2026-10-15)

**무엇** — 매치 **9:00 · 18:00 · 27:00** 에 다섯 마을(헤네시스 · 엘리니아 · 커닝시티 · 페리온 · 노틸러스 — 리스항구 제외) 중 무작위 한 곳의 **사냥터 1 · 2 · 3**(9분 = 1 · 18분 = 2 · 27분 = 3 고정)이 그 판 끝까지 "파괴된 빅토리아 아일랜드"로 바뀐다. 같은 판에서 같은 마을은 다시 안 뽑는다. 지형(발판 · 포탈)은 그대로, 배경 · 몬스터 · 드랍이 바뀐다. 30초 전 예고 · 생기면 토스트 · 월드맵 불꽃 표시 · 튜토리얼 장면.

**정한 값**(지시서 결정 기록 = `Docs/작업지시/WO-054-파괴된-빅토리아.md` 맨 아래)
- 변형 몹(원작 팩 · 리소스 검색 API 로 이름 정확 일치): 사냥터 1 = 변형된 달팽이 8600000 · 변형된 슬라임 8600002 / 2 = 변형된 주황버섯 8600001 · 변형된 리본돼지 8600003 / 3 = 변형된 스텀프 8620000 · 변형된 와일드보어 8620003. 그 맵의 기존 몹 2종 중 **낮은 레벨 → 앞 몹 · 높은 레벨 → 뒤 몹**으로 1:1 대체(맵 스폰표 순서 · 자리 · 수 그대로).
- 능력치: 대체되는 몹(맵 행 실제 값 = LevelOverride 반영) 기준 **레벨 +2 · HP 그대로 · 공격력 ×1.5 · 경험치 ×1.5**(대체 몹의 원래 레벨 경험치 기준) · 메소 그대로. 판정 레벨(`Monster.Level` · `FarmReward.SpawnLevel`)도 +2 라 이름표 · 명중 · 레벨 차 경험치 보정에 반영.
- 드랍(변형 몹만 · 공용 드랍 표는 그대로): 그 사냥터 `GROUND` 행 중 보석은 그대로 · `REGION_LOCAL` 행은 **지역 재화 5종 각각** 같은 확률 · 개수(사냥터 1 35%×1 · 2 75%×1 · 3 100%×3~4 · ★5 타 지역 ×2 규칙 그대로) · **꿈의 조각 33% ×1** · **빅토리아 주화 10% ×1** · 몹별 모집 재료(MAT_) 없음. 귀속(막타) · 바닥 드랍 · 자이언트 카운트는 기존 규칙 그대로.
- 배경: 사냥터 1 · 2 = 파괴된 헤네시스(원작 **271020100 "파괴된 버섯노래숲 · 음산한 콧노래 오솔길"** · 배경 세트 `destructionTown` 27층 — 사용자 스크린샷의 맵) · 사냥터 3 = 황혼의 페리온(원작 **273020000 "황량한 언덕"** · `destructionPerion` 17층). 방식 = **원작 배치 데이터로 직접 그리기**(사용자 선택) + Maker 템플릿 RUID 자리(`TownTemplateRUID` · `PerionTemplateRUID` — 넣으면 그 템플릿을 쓰고 직접 그리기는 끈다).
- 예고: 적용 30초 전(매치 길이 비율 · 최소 5초 — TEST 프로필 338초면 약 68 · 135 · 203초에 생김) 오른쪽 위(단축 버튼 줄 아래) 한 줄 "파괴 예고 0:27 커닝시티 사냥터2 · 지하철 1호선" → 생기면 "파괴 출현!" 8초.
- 스틸: 다른 마을 사냥터 · 지역 보스 입장을 막는 규칙이 없음을 확인(`PortalNetwork` · `RequestEnterBoss` 는 지역 재화만 본다) → 규칙 변경 없음. 변형 몹이 모든 지역 재화를 주므로 27분에는 그 재화로 다른 지역 보스 도전까지 이어진다.
- 튜토리얼: 커닝시티 **사냥터 2(지하철 1호선)** 를 즉시 파괴(그 시점 캐릭터 Lv20 · 변형 몹 Lv19 · 23 · 레인 시설 없는 맵).

**구현**
- 새 `Match/DestroyedVictoriaService.mlua`(@Logic): 서버 일정(`MatchSessionLogic.Elapsed` · `MatchSerial` 로 판마다 초기화 · 튜토리얼 룸은 일정 없음) · 상태 `@Sync Destroyed`("마을:맵:번호;…") · `@Sync Pending` · 마을 → 맵 = `VillageConfig` 3맵 중 `DropTableLogic.TierOfMap == 번호` · 적용 = 상태 → 맵 `Background` 하늘 그라데이션(템플릿 RUID 가 있으면 템플릿) → Multicast 토스트 · 예고 줄 · 월드맵 갱신. 변형 표(클립 RUID 6종 × stand · move · hit · die · attack) · `VariantOf` · `VariantRows` · `ApplyVariant` · `ForceDestroy`(튜토리얼) · `DevTriggerNext`(서버 Lua) · `RequestDevTriggerNext`(DevStatRemote 게이트). 예고 줄 = `MatchClockGroup/Panel` 런타임 복제(오른쪽 위 · .ui 수정 없음 · `StatusHUD.ui` 는 B 경계라 안 건드림). 로그 `[DestroyedVictoria] notice/apply village= map= tier=`.
- 새 `Map/DestroyedBackdrop.mlua`(@Logic · 클라 전용): 원작 back 노드(maplestory.io KMS 389 Map.wz) 그대로의 층 표 + 그림 RUID 39개(리소스 검색 API · 크기 · 그림 비교로 찾음 · 피벗 = 원작 origin 확인) → 클라 전용 엔티티(`auracircle` · `MapLayer0` · OrderInLayer −1000+층) · 원작 공식(층 위치 = x + 카메라 × (100+rx)/100 · type 1 · 4 가로 반복 · type 4 자동 흐름) · 원작 VR ↔ 우리 맵 경계(`MapComponent:GetBound`) 평행 이동. 같은 공식의 파이썬 합성이 사용자 스크린샷과 일치(평균 픽셀 차 0.07 로 구현식 확인). 로그 `[DestroyedBackdrop] build/clear`.
- `Spawn/MonsterSpawner.mlua`: `SpawnSlot` 에서 변형 키면 `ApplyVariant` + 이름표 "변형된 ○○" · 맵이 막 파괴되면 살아 있는 몹 · 리스폰 대기 칸을 즉시 변형 몹으로 다시 세움(`RespawnAllNow` · 보상 없이 지움).
- `MonsterAttack.mlua`: `RemeasureBox` — 그림이 바뀐 몹의 접촉 공격 상자를 다시 잰다. 피격 상자는 `Monster.FitHitboxToSprite` · 사망 지연은 `SetupDieDestroyDelay` 를 다시 부른다.
- `Farm/FarmReward.mlua`: `VariantKey` · 변형이면 `DropTableLogic.DropVariantItems`. `Farm/DropTableLogic.mlua`: `DropVariantItems` · `VariantRegionVillages` · `VariantDreamChance` 0.33 · `VariantCoinChance` 0.1.
- `WorldMap/WorldMapController.mlua`: 파괴된 노드 불꽃 표시(`HereMarker` 런타임 복제 · 원작 불꽃 클립 · 꼬리표 "파괴됨" 빨강 · 맥동) · 툴팁 = 변형 몹 2줄(얼굴 · 이름 · 실제 레벨 +2) + "모든 지역 재화 · 꿈의 조각 · 빅토리아 주화" 줄 · 머리줄 "○○ · 파괴된 사냥터".
- `Onboarding/TutorialService.mlua`: 액션 `dv:<마을>:<번호>`. `Onboarding/TutorialDirector.mlua`: 5-0a(머쉬맘) 앞 장면 `5-dv1`(9 · 18 · 27분 카드) · `5-dv2`(dv) · `5-dv3`(월드맵 열기 · M 또는 우측 아래) · `5-dv4`(커닝 노드 강조) · `5-dvm`(지하철 1호선으로 순간이동) · `5-dv5`(변형 몬스터 · 잡아 봐도 됨) · `5-dv6`(보상 · 사수 · 다른 지역 보스 초석 카드).

**확인** — 클라우드 세션이라 Maker 없음 → Play · 로그 · 캡처 미확인. `check-integrity` 통과(경고 3건은 기존) · mLua → Lua 변환 구문 검사 9파일 통과. Maker 확인 목록은 지시서 결정 기록 아래 "Maker 에서 확인할 것".
