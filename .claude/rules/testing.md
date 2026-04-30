# 테스트 작성 지침

## 테스트 파일 위치

소스 파일과 같은 디렉토리 레벨에 `tests/` 폴더를 만들어 격리한다.

```
src/utils/
├── yaml.utils.ts
└── tests/
    └── yaml.utils.test.ts

src/core/change/artifact/schema/
├── validation.ts
└── tests/
    └── validation.test.ts
```

루트에 `tests/` 폴더를 두거나, 소스 파일 옆에 직접 `.test.ts`를 배치하지 않는다.

## 어떤 파일을 테스트할까

### 테스트한다

- **순수 함수**: 외부 의존성 없이 입력 → 출력이 결정되는 함수
- **복잡한 알고리즘**: 사이클 감지, 위상 정렬, 의존성 계산 등 버그가 숨기 쉬운 로직
- **입력 검증**: 정규식, 형식 규칙 등 엣지 케이스가 있는 검증 로직

### 테스트하지 않는다

| 유형 | 이유 |
|---|---|
| 파일시스템 의존 함수 (`fs`, `fs/promises`) | 모킹이 구현 세부사항에 종속되어 구현이 바뀌면 모킹도 깨짐. 통합 테스트 영역 |
| 얇은 위임 계층 | 다른 함수를 호출하고 에러를 전달하는 것만 하는 함수는 테스트 가치가 낮음 |
| 이미 테스트된 로직의 조합 | 개별 함수가 이미 테스트된 오케스트레이션 레이어는 제외 |
| CLI 진입점 및 Command 클래스 | 사이드이펙트 중심. e2e 테스트 영역 |
| 상수 / 타입 / 에러 클래스 | 로직이 없어 테스트 가치 없음 |
| 3개 이하 케이스의 단순 switch/map | 버그가 생기면 즉시 눈에 띄는 수준 |
| 외부 라이브러리 동작 검증 | Zod 검증, chalk 색상 등 라이브러리 책임 |

## 테스트 코드 스타일

### 픽스처 헬퍼를 만들어 반복을 줄인다

테스트 파일 상단에 최소한의 유효한 객체를 만드는 헬퍼를 정의한다.

```ts
function makeArtifact(id: string, requires: string[] = []): Artifact {
  return {
    id,
    generates: `${id}.md`,
    template: "template",
    instruction: "instruction",
    requires,
  };
}
```

### 설명은 한국어로, 동작 중심으로 작성한다

```ts
// 좋음
it("requires가 모두 완료되면 ready 상태가 된다", () => { ... });

// 나쁨
it("getNextArtifacts test 1", () => { ... });
```

### 에러 테스트는 타입과 메시지를 함께 검증한다

에러 클래스 타입으로 의도한 에러인지 확인하고, 정규식으로 메시지에 핵심 정보가 포함되는지 확인한다.

```ts
expect(() => validate(artifacts)).toThrowError(SchemaValidationError);
expect(() => validate(artifacts)).toThrowError(/중복된-id/);
```

### 비동기 함수는 `resolves` / `rejects`로 테스트한다

```ts
await expect(validateChangeName("valid-name")).resolves.toBeUndefined();
await expect(validateChangeName("")).rejects.toThrowError(ChangeValidationError);
```

## 병렬 실행 안전성

현재 모든 테스트는 순수 함수만 다루므로 공유 상태가 없고 병렬 실행에서 안전하다.

파일시스템, 전역 상태, 환경변수를 사용하는 테스트를 추가할 경우 `beforeEach`/`afterEach`로 반드시 격리해야 한다.
