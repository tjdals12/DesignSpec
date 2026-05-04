# Tasks

## 1. Shared Components

- [ ] 1.1 `LoginForm` 컴포넌트 구현: `src/components/LoginForm/LoginForm.tsx` (+ `LoginForm.test.tsx`) — per `components/login-form.md`

## 2. Pages

- [ ] 2.1 `LoginPage` 구현: `src/pages/LoginPage/LoginPage.tsx` — per `pages/login.md`

## 3. Integration

- [ ] 3.1 `/login` 라우트 추가: `src/router.tsx` — 비인증 사용자 접근 시 리다이렉트 처리 포함
- [ ] 3.2 인증 API 연동: `src/api/auth.ts` — 이메일/비밀번호 로그인 엔드포인트 호출 및 토큰 저장
- [ ] 3.3 보호된 라우트 가드 추가: `src/router.tsx` — 미로그인 상태에서 보호 경로 접근 시 `/login`으로 리다이렉트, 로그인 성공 후 원래 경로로 복귀
- [ ] 3.4 `pnpm run lint && pnpm run format` 실행 후 브라우저에서 로그인 → 메인 화면 흐름 확인
