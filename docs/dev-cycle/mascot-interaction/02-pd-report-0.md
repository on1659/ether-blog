# PD 보고서: 이더봇 마스코트 시스템 (사이클 #0)

╔══════════════════════════════════════════╗
║  개발 사이클: 이더봇 마스코트 시스템        ║
║  현재 단계: PD 보고서                     ║
║  반복: 0/3                               ║
╚══════════════════════════════════════════╝

## Go/No-Go 판단

**GO (조건부)** — Phase 1(히어로 walk + Footer idle + 404 페이지)만 우선 착수.
About 풀 인터랙션(Phase 2)은 Phase 1 배포 후 Umami 데이터 기반 Go/No-Go 재판단.
에셋은 현재 SVG 목업 기반으로 충분하므로 별도 에셋 제작 대기 없이 즉시 착수 가능.

---

## 작업 분해 (WBS)

| # | 담당자 | 작업 | 예상 공수 | 선행 작업 | 우선순위 |
|---|--------|-----|----------|---------|---------|
| 1 | 미래(FE) | `MascotSVG.tsx` 공유 컴포넌트 (expression/theme/size props) | 0.5d | — | P0 |
| 2 | 미래(FE) | `mascot.css` — @keyframes + 상태 클래스 | 0.5d | — | P0 |
| 3 | 미래(FE) | `HeroMascot.tsx` — 걸어다니는 봇 2개 + 클릭 멈춤/말풍선 | 0.5d | #1, #2 | P0 |
| 4 | 미래(FE) | `HeroBanner.tsx` 수정 — HeroMascot composition | 0.25d | #3 | P0 |
| 5 | 미래(FE) | `FooterMascot.tsx` — idle 봇 | 0.25d | #1 | P0 |
| 6 | 미래(FE) | `Footer.tsx` 수정 — FooterMascot composition | 0.25d | #5 | P0 |
| 7 | 미래(FE) | `not-found.tsx` 신규 + `NotFoundMascot.tsx` | 0.5d | #1, #2 | P0 |
| 8 | 미래(FE) | `useMascotInteraction.ts` — 클릭/콤보/말풍선 훅 | 0.5d | — | P0 |
| 9 | 미래(FE) | 모바일 터치 이벤트 대응 | 0.25d | #3, #7 | P1 |
| 10 | 미래(FE) | `prefers-reduced-motion` 폴백 | 0.25d | #2 | P1 |
| 11 | 태준(BE) | SSR 안전성 검증 + 번들 분석 | 0.25d | #3~#7 | P1 |
| 12 | 윤서(QA) | 크로스 브라우저 + 접근성 테스트 | 0.5d | #3~#10 | P1 |
| | | **합계** | **~4d** | | |

---

## 개발 범위 확정

### 이번 사이클 포함 (Phase 1)
- `MascotSVG.tsx` — 공유 SVG 컴포넌트 (expression: normal/happy/confused/sleeping, theme: blue/purple)
- `HeroMascot.tsx` — 히어로 배너 하단 걸어다니는 봇 2개, 클릭 시 멈춤+말풍선+파티클, 5연타 스핀
- `FooterMascot.tsx` — Footer 로고 옆 idle 봇
- `not-found.tsx` + `NotFoundMascot.tsx` — 404 페이지 + 배회하는 봇 + 클릭 반응
- `useMascotInteraction.ts` — 클릭/콤보/말풍선 공통 훅
- `mascot.css` — 모든 @keyframes 정의
- `prefers-reduced-motion` 대응
- 모바일 터치 이벤트 기본 대응

### 제외 (Phase 2 — 추후 판단)
- About 페이지 풀 인터랙션 (콤보 10단계, 드래그, 롱프레스 수면, 감정 무드바)
- 코나미 코드 이스터에그
- 파티클 시스템 고도화
- 마스코트 상태 persist (localStorage/API)
- Umami 커스텀 이벤트 트래킹
- A/B 테스트

---

## 리스크 매트릭스

| 리스크 | 확률 | 영향 | 대응 전략 |
|--------|------|------|---------|
| SSR Hydration 불일치 | 중 | 높 | `dynamic import + ssr: false` 필수 적용 |
| 모바일 성능 프레임 드롭 | 낮 | 중 | `will-change: transform`, IntersectionObserver로 뷰포트 밖 정지 |
| 히어로 레이아웃 충돌 | 낮 | 중 | absolute 오버레이 + pointer-events 관리 |
| 보라색 디자인 시스템 미등록 | 확실 | 낮 | globals.css + tailwind.config에 mascot 토큰 추가 |
| CLS(Layout Shift) | 낮 | 중 | 마스코트 영역 fixed height 예약 |

---

## 예상 사용 시나리오

### 개발 전 (As-Is)
- 메인 페이지: 히어로 배너에 텍스트만 있는 정적 레이아웃
- 404: 페이지 자체가 없어 Next.js 기본 에러 표시
- Footer: 텍스트 + 링크만 있는 표준 구조

### 개발 후 (To-Be)
- 메인 페이지: 히어로 배너 하단에 이더봇이 걸어다니며 클릭 시 "안녕하세요!", "커밋하셨나요?" 등 말풍선 표시. 블로그의 AI 정체성을 시각적으로 전달.
- 404: 길 잃은 이더봇이 ?를 띄우며 배회. 클릭 시 반응. "홈으로 돌아가기" 버튼과 함께 이탈 방지.
- Footer: 로고 옆 작은 이더봇이 idle 호흡 애니메이션. 브랜드 시그니처 역할.
