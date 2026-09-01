# MSW 학습 노트

밍키타연습월드1 프로젝트를 만들면서 공부한 내용 정리.

---

## 1. 공격 시스템 — 다중공격을 "가장 가까운 1마리만"으로 바꾸기

### 1-1. 왜 다중공격이 되는가

`AttackComponent`의 공격 함수는 **범위 안에 들어온 모든 `HitComponent`에 전부 `OnHit`을 호출**한다.
그래서 기본 템플릿 `PlayerAttack.mlua`처럼 `AttackFast(shape, ...)`를 쓰면 박스 안 몬스터가 전부 맞는다.

```lua
self:AttackFast(self.Shape, nil, CollisionGroups.Monster)  -- 범위 내 전부 타격
```

### 1-2. AttackComponent 주요 API

`Environment/NativeScripts/Component/AttackComponent.d.mlua` 기준.

| 메서드 | 반환 | 설명 |
|---|---|---|
| `Attack(Shape, attackInfo, collisionGroup)` | `table<Component>` | 범위 내 타격 + **맞은 대상 목록 반환** |
| `Attack(Vector2 size, Vector2 offset, attackInfo, cg)` | `table<Component>` | 사각 범위 지정 버전 |
| `AttackFast(Shape, attackInfo, cg)` | `void` | 반환값 없음. 테이블 생성을 안 해서 **성능상 유리** (탄막 등 대량 판정용) |
| `AttackFrom(Vector2 size, Vector2 position, attackInfo, cg)` | `table<Component>` | 월드 좌표 기준 사각 범위 |
| `IsAttackTarget(defender, attackInfo)` | `boolean` | **핵심.** false 반환 시 그 대상은 공격에서 **제외** |
| `CalcDamage(attacker, defender, attackInfo)` | `integer` | 데미지 값 결정 (기본 1) |
| `CalcCritical(attacker, defender, attackInfo)` | `boolean` | 크리티컬 여부 (기본 false) |
| `GetCriticalDamageRate()` | `float` | 크리 배율 (기본 2) |
| `GetDisplayHitCount(attackInfo)` | `int32` | 한 번의 공격을 몇 타로 표시할지 (기본 1) |

### 1-3. 해결 원리 — 2패스 (탐색 → 실제 타격)

`IsAttackTarget`이 false를 리턴하면 그 대상은 제외된다는 성질을 이용한다.
문제는 "때리기 전에 누가 제일 가까운지" 알아야 한다는 것 → **2번에 나눠서 처리**한다.

1. **1패스 (탐색)**: `attackInfo = "probe"`로 공격 호출.
   `IsAttackTarget`에서 후보를 테이블에 수집만 하고 **false 리턴** → 아무도 안 맞음(데미지 0).
2. **거리 계산**: 수집된 후보 중 플레이어와 가장 가까운 하나를 고른다.
3. **2패스 (실제 타격)**: `attackInfo = "melee"`로 다시 호출.
   `IsAttackTarget`이 **선택된 하나에만 true** → 그 몬스터만 맞음.

두 패스 사이에 박스가 움직이지 않으므로 같은 후보군을 본다.

### 1-4. 구현 코드

```lua
property any CurrentTarget = nil
property table Candidates = {}

@ExecSpace("ServerOnly")
method void AttackNormal()
    local playerController = self.Entity.PlayerControllerComponent
    local transform = self.Entity.TransformComponent
    if playerController and transform then
        local worldPosition = transform.WorldPosition
        local attackOffset = Vector2(worldPosition.x + 0.5 * playerController.LookDirectionX, worldPosition.y + 0.5)
        self.Shape.Position = attackOffset

        -- 1패스: 데미지 없이 후보만 수집
        self.Candidates = {}
        self:Attack(self.Shape, "probe", CollisionGroups.Monster)

        -- 가장 가까운 후보 선택
        local closest = nil
        local best = math.huge
        for _, def in ipairs(self.Candidates) do
            if isvalid(def) then
                local p = def.TransformComponent.WorldPosition
                local dx = p.x - worldPosition.x
                local dy = p.y - worldPosition.y
                local d = dx * dx + dy * dy   -- 제곱거리 비교(루트 불필요)
                if d < best then
                    best = d
                    closest = def
                end
            end
        end
        self.CurrentTarget = closest

        -- 2패스: 가장 가까운 하나만 실제 타격
        if isvalid(self.CurrentTarget) then
            self:Attack(self.Shape, "melee", CollisionGroups.Monster)
        end
    end
end

method boolean IsAttackTarget(Entity defender, string attackInfo)
    if attackInfo == "probe" then
        table.insert(self.Candidates, defender)
        return false   -- 탐색 패스: 수집만, 아무도 안 맞음
    end
    return defender == self.CurrentTarget   -- 실제 패스: 가장 가까운 하나만
end
```

### 1-5. 포인트 정리

- `AttackFast` 대신 **`Attack`을 쓴 이유**: 2패스에서 데미지 계산·크리·데미지스킨 파이프라인을 그대로 유지하기 위해.
  (직접 `OnHit`을 호출하면 그 파이프라인을 우회하게 됨)
- **거리는 제곱거리로 비교**한다. 크기 비교만 할 거라 `math.sqrt`가 불필요 → 연산 절약.
- `isvalid()`로 유효성 체크 필수 (이미 죽은 몬스터가 목록에 남을 수 있음).

---

## 2. mlua 문법 / 오버라이드 규칙 (실제로 겪은 에러)

### 2-1. `end` 개수 — `<eof> expected near 'end'`

`end`가 하나 많으면 이 에러가 난다. 블록 하나당 `end` 하나:

```lua
method boolean IsAttackTarget(Entity defender, string attackInfo)
    if attackInfo == "probe" then
        return false
    end        -- if 닫기
    return defender == self.CurrentTarget
end            -- method 닫기   ← 여기서 끝. 하나 더 쓰면 에러
```

빌드 에러는 Maker 콘솔의 **Build Console**에서 확인 가능.

### 2-2. 오버라이드는 부모 시그니처와 **정확히** 일치해야 함

부모 클래스에 선언된 타입과 글자 그대로 같아야 한다. `int` ≠ `integer`, `number` ≠ `float`.

| 메서드 | 부모(`AttackComponent`) 선언 | 틀린 예 |
|---|---|---|
| `CalcDamage` | `integer` | ~~`int`~~ |
| `GetCriticalDamageRate` | `float` | ~~`number`~~ |
| `CalcCritical` | `boolean` | (동일) |
| `IsAttackTarget` | `boolean` | (동일) |

> 에러 메시지: `The override member must match 'CalcDamage' of 'AttackComponent'`
> 타입이 안 맞으면 리턴값에서도 에러가 따라 나온다: `'int' type is required, but 'integer' type was used.`

**부모 타입은 `Environment/NativeScripts/`의 `.d.mlua`를 직접 열어서 확인하는 게 확실하다.**

### 2-3. 오버라이드에 `@ExecSpace` 붙이면 안 됨

`CalcDamage` / `CalcCritical` / `GetCriticalDamageRate` / `IsAttackTarget` 등은
부모에서 ExecSpace가 지정되어 있지 않다(=All). 자식에서 `@ExecSpace("ServerOnly")` 같은 걸 붙이면
런타임에 **LEA-3014 `SignatureMismatch`** 에러가 난다.

```lua
-- ❌ 이러면 안 됨
@ExecSpace("ServerOnly")
method boolean IsAttackTarget(Entity defender, string attackInfo)

-- ✅ 어노테이션 없이
method boolean IsAttackTarget(Entity defender, string attackInfo)
```

어노테이션이 없어도 실제 호출 경로가 서버 히트 파이프라인이라 서버에서 실행된다.

---

## 3. 공격키 변경

### 3-1. 키 → 액션 흐름

```
키 입력 → PlayerControllerComponent가 "Attack" 액션 발생 (PlayerActionEvent)
        → PlayerAttack.mlua의 HandlePlayerActionEvent가 수신
        → ActionName == "Attack" 이면 AttackNormal() 실행
```

이동(방향키)·점프(스페이스)는 **엔진 내장**이라 스크립트에 코드가 없다.
키 매핑은 `Global/Player.model` / `DefaultPlayer.model`에 내장 (Global은 읽기 전용).

### 3-2. 키 재바인딩 API — `PlayerControllerComponent`

| 메서드 | 설명 |
|---|---|
| `SetActionKey(KeyboardKey key, string actionName, func condition = nil)` | 키에 액션 매핑 (**ClientOnly**) |
| `RemoveActionKey(KeyboardKey key)` | 해당 키의 액션 제거 (ClientOnly) |
| `RemoveAllActionKeyByActionName(string actionName)` | 액션 이름으로 전부 제거 (ClientOnly) |
| `GetActionName(KeyboardKey key)` | 키에 매핑된 액션 이름 조회 (ClientOnly) |

```lua
@ExecSpace("ClientOnly")
method void OnBeginPlay()
    self.Entity.PlayerControllerComponent:SetActionKey(KeyboardKey.B, "Attack")
end
```

### 3-3. 주의

- **ClientOnly**다. 서버에서 호출하면 안 된다.
- 기존 기본키도 없애려면 `RemoveAllActionKeyByActionName("Attack")` 먼저 호출.
  안 하면 **기본키 + 새 키 둘 다** 공격으로 동작한다.
- 액션 이름 문자열 `"Attack"`은 그대로 유지해야 한다.
  핸들러가 `ActionName == "Attack"`으로 받고 있어서 이름을 바꾸면 공격 로직이 안 걸린다.
- `PlayerAttack.mlua`의 `OnBeginPlay`는 이미 `@ExecSpace("ServerOnly")`다.
  같은 이름 메서드를 client용으로 하나 더 만들 수 없으므로, **키 재바인딩은 별도의 작은 client 컴포넌트**에 넣는다.

---

## 4. 사운드 설정

### 4-1. 카메라 / 오디오는 어디서 관리되나

| 대상 | 무엇 | 어디 |
|---|---|---|
| 카메라 | `CameraComponent` (컴포넌트) | **DefaultPlayer에 부착**. 설정값은 `Global/DefaultPlayer.model` |
| 카메라 런타임 조작 | `_CameraService` (서비스) | 줌 `SetZoomTo`, 흔들기 `ShakeCamera` 등 |
| 오디오 재생 | `_SoundService` (전역 서비스) | 오브젝트 아님. 스크립트에서 호출 |
| 엔티티 부착 사운드 | `SoundComponent` (컴포넌트) | 소리 낼 엔티티에 부착 |

**"카메라 오브젝트" / "오디오 오브젝트"가 따로 있는 게 아니다.**
카메라는 플레이어에 붙은 컴포넌트, 오디오는 코드로 부르는 서비스다.

### 4-2. 아무것도 안 넣었는데 점프/공격 소리가 나는 이유

→ **`MaplePreferencesLogic`** (엔진 내장 전역 `@Logic`)에 기본 사운드 RUID가 박혀 있다.

`Environment/NativeScripts/Logic/MaplePreferencesLogic.d.mlua`

| 프로퍼티 | 기본값 | 재생 시점 |
|---|---|---|
| `JumpSound` | `a49c4b3963e148f09b2eb9de98d42ef4` | 점프할 때 |
| `DeathSound` | `8727e134756141c58bf2f525a1598eee` | 죽을 때 |
| `WeaponSwordBSound` 등 무기 타입별 | `UNSET` | 근접 공격 시 (장착 무기 타입에 따라) |

무기 타입별 프로퍼티: `Bow`, `Cane`, `Cannon`, `CrossBow`, `DualBow`, `Gun`, `Knuckle`, `Mace`,
`PoleArm`, `Spear`, `SwordB`(한손검), `SwordK`(카타나), `SwordL`(두손검), `SwordS`(단검),
`SwordZB`, `SwordZL`, `TGlove`

**스크립트나 컴포넌트를 아무리 뒤져도 안 나오는 이유**: 워크스페이스 파일이 아니라 엔진이 값을 들고 있기 때문.
(`Environment/`에는 정의만 있고 읽기 전용)

### 4-3. 끄는 방법 — property가 아니라 **method 안에서 대입**

`JumpSound`는 이미 엔진에 선언된 프로퍼티다. 내가 하는 건 **값을 대입**하는 것이고,
대입은 실행되는 코드라서 **반드시 method 안**에 들어가야 한다.
(내 스크립트의 property 선언부에는 쓸 수 없다)

```lua
@ExecSpace("ServerOnly")
method void OnBeginPlay()
    _MaplePreferencesLogic.JumpSound = ""   -- 점프 소리 끄기
end
```

- `@Sync` 프로퍼티라 **서버에서** 세팅하면 클라이언트로 동기화된다.
- 월드 전역이므로 **한 번만** 세팅하면 된다 → 별도 `@Logic` 스크립트에 넣는 게 가장 깔끔.
- `PlayerAttack.mlua` 같은 곳에 넣지 말 것 (성격이 안 맞고 플레이어 스폰마다 실행됨).

### 4-4. ⚠ 전체 볼륨 0은 불가능

`SoundService`에 **마스터 볼륨 API가 없다.** 볼륨 관련은 이게 전부:

| 있는 것 | 범위 |
|---|---|
| `SetBGMVolume(float volume)` | **배경음악만** |
| `PlaySound(id, volume)` | 그 호출 1건 |
| `StopSound(id)` / `PauseSound(id)` | **id 지정 필요** |

- `SetBGMVolume(0)` → 배경음악만 꺼짐. **점프/공격 소리는 그대로 난다.**
- `StopSound(id)`는 "SoundService를 통해 재생 중인 클립"만 대상.
  점프음은 엔진 아바타 액션 시스템이 내부적으로 재생하므로 잡힌다는 보장이 없다.
- 진짜 전체 무음을 원하면 **BGM 볼륨 0 + MaplePreferences의 사운드 프로퍼티들을 각각 `""` 처리**해야 한다.

### 4-5. SoundService 주요 API

전부 `@ExecSpace("Client")` 또는 `ClientOnly`다.

| 메서드 | 설명 |
|---|---|
| `PlaySound(id, volume)` | 효과음 재생 |
| `PlaySoundAtPos(id, pos, listener, volume)` | 위치 기반(3D) 재생 |
| `PlayLoopSound(id, volume)` | 반복 재생 |
| `PlayBGM(id, volume)` / `StopBGM(immediately)` | 배경음악 |
| `PauseBGM()` / `ResumeBGM()` | 배경음악 일시정지/재개 |
| `SetBGMVolume(volume)` | 배경음악 볼륨 |
| `LoadSound(id)` | 미리 로드 (첫 재생 끊김 방지) |
| `IsPlayBGM()` | 배경음악 재생 중인지 |

---

## 5. 기타 메모

### 5-1. 스크립트 스코프 선택 기준

> "플레이어가 다른 맵으로 가도 계속 살아있어야 하나?"

| 답 | 선택 |
|---|---|
| 예 (월드 전역) | `@Logic` — 엔진 관리 싱글톤, 월드 세션 내내 유지 |
| 아니오, 이 맵에서만 | 맵 엔티티에 붙은 `@Component` |
| 아니오, 이 액터에서만 | 그 엔티티에 붙은 `@Component` |

⚠ `@Logic`에는 `OnMapEnter` / `OnMapLeave`가 **호출되지 않는다.** 써도 조용히 죽은 코드가 된다.

### 5-2. 작업 후 반영 절차

1. `.mlua` 저장
2. **Maker refresh** (`.codeblock`이 자동 생성됨 — `.mlua`만 있으면 등록 안 됨)
3. Build Console에서 에러 확인
4. Play로 실제 동작 검증

### 5-3. 플레이 테스트 디바이스 전환

플레이 창 **상단의 "Simulator"** 에서 변경:

- **PC** — FHD(1920×1080), 16:9 고정 (기본값)
- **Mobile** — 모바일 화면비, Safe Area 설정 가능
- **Free** — 창 크기에 맞춰 자유

> 점프/공격 버튼, 조이스틱 같은 **터치 UI는 Mobile에서만 표시**된다.
> PC 플레이에서 안 보이는 건 정상 (PC는 키보드로 조작하므로).
