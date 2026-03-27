# CLAUDE.md — 이더 테크블로그

---

## 🎯 프로젝트 목표 (AI Signal 파이프라인)

radarlog.kr의 AI Signal 피드를 안정적인 멀티소스 자동 수집 파이프라인으로 완성한다.

### 현재 구현 상태
- 5개 소스 수집기 구현 완료: HN, Reddit, HF Papers, GitHub Trending, RSS
- canonicalUrl 기반 cross-source 중복 제거 완료
- 슬롯제 선별 (community:6, research:5, industry:4) 완료
- SignalItem DB 테이블 + externalId 기반 upsert 완료
- AI 요약 → signal 포스트 자동 생성 완료
- GitHub Actions cron (daily-ai.yml) 완료

### 성공 기준
- 5개 소스 모두 파싱 성공률 95% 이상 (빈 응답/타임아웃/비정상 형식 대응)
- 소스 간 중복률 5% 이하 (canonicalUrl dedup 정상 작동)
- 기존 HuggingFace Papers 파이프라인 출력에 회귀 없음
- 전체 파이프라인 1회 실행 시간 5분 이내
- 에러 발생 시 해당 소스만 skip, 나머지 정상 수집 (Promise.allSettled 패턴)

### 다음 개선 과제 (우선순위 순)
1. 각 소스별 에러율/성공률 로깅 및 모니터링
2. RSS 피드 추가 확장 (P2 소스: arXiv, TechCrunch, THE DECODER, Latent Space)
3. 소스별 요약 프롬프트 분기 (community/research/industry별 톤 차별화)
4. 엔티티 태깅 (company/product/model/library 자동 추출)
5. 프론트엔드 소스 아이콘/라벨 표시

---

## 세션 규칙

### 세션 시작
1. **반드시 CHANGELOG.md를 먼저 읽는다.** 이전 세션의 진행 상황, 실패한 접근 방식, 현재 상태를 파악한 후 작업을 시작한다.
2. CHANGELOG.md가 없으면 새로 생성한다.

### 작업 중
- 의미 있는 작업 단위마다 Git 커밋 & 푸시
- 커밋 메시지에 현재 진행 상태 포함 (예: "feat: RSS 에러 핸들링 강화 - 성공률 87%→96%")
- 커밋 전에 기존 테스트 실행 — 실패하는 코드 커밋 금지
- 새 기능 추가 시 해당 기능의 단위 테스트도 함께 작성
- 기존 HuggingFace Papers 파이프라인의 출력을 테스트 오라클로 사용

### 세션 종료
- **반드시 CHANGELOG.md를 업데이트한다:**
  - 완료된 작업
  - 시도했으나 실패한 접근 방식 + 실패 이유
  - 현재 각 소스별 상태
  - 다음 세션에서 이어할 작업

### 테스트 규칙
- 각 소스 fetcher는 최소 3가지 입력으로 테스트 (정상 응답, 빈 응답, 비정상 형식)
- 단일 입력에서만 테스트하지 않는다 — 커버리지 구멍을 만들지 않는다
- 중복 제거 로직은 cross-source 시나리오로 테스트 (같은 콘텐츠가 HN+Reddit에서 동시에 올라오는 케이스)

---

## 프로젝트 개요

"이더" 테크블로그. GitHub 커밋을 감지하여 AI가 자동으로 블로그 글을 생성·발행하는 개인 개발 블로그.
레퍼런스 디자인: tech.kakao.com (카카오테크)

## 기술 스택

- **프레임워크:** Next.js 15 (App Router)
- **언어:** TypeScript (strict mode)
- **스타일:** Tailwind CSS v3 + @tailwindcss/typography
- **DB:** PostgreSQL (Railway)
- **ORM:** Prisma
- **인증:** NextAuth.js (Auth.js v5) + GitHub OAuth
- **마크다운:** next-mdx-remote + rehype-pretty-code (Shiki) + remark-gfm
- **AI:** Claude API (@anthropic-ai/sdk) — Sonnet 모델
- **GitHub:** Octokit (@octokit/rest) + Webhooks
- **통계:** Umami (별도 Railway 인스턴스)
- **댓글:** Giscus (GitHub Discussions)
- **검색:** Fuse.js (클라이언트 사이드)
- **배포:** Railway
- **폰트:** Pretendard Variable + JetBrains Mono

## 디렉토리 구조

```
radar-blog/
├── prisma/
│   └── schema.prisma
├── public/
│   └── fonts/
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # 전역 레이아웃 (NavBar, Footer, ThemeProvider)
│   │   ├── page.tsx                   # 메인 (히어로 + 포스트 리스트)
│   │   ├── globals.css                # CSS 변수, Tailwind 설정
│   │   ├── commits/
│   │   │   ├── page.tsx               # 커밋 카테고리 피드
│   │   │   └── [project]/page.tsx     # 프로젝트별 커밋 기록
│   │   ├── articles/page.tsx
│   │   ├── casual/page.tsx
│   │   ├── signal/page.tsx            # AI Signal (AI 뉴스)
│   │   ├── post/[slug]/page.tsx       # 글 상세
│   │   ├── about/page.tsx             # 소개
│   │   ├── search/page.tsx            # 검색 결과
│   │   ├── series/
│   │   │   ├── page.tsx               # 시리즈 목록
│   │   │   └── [slug]/page.tsx
│   │   ├── tag/[tag]/page.tsx         # 태그별 필터
│   │   ├── sitemap.ts                # 동적 사이트맵
│   │   ├── robots.ts                 # robots.txt
│   │   ├── rss.xml/route.ts          # RSS 피드
│   │   ├── admin/
│   │   │   ├── layout.tsx             # 관리자 레이아웃 (인증 체크)
│   │   │   ├── page.tsx               # 대시보드
│   │   │   ├── posts/page.tsx         # 글 관리
│   │   │   ├── analytics/page.tsx     # 통계 (Umami 연동)
│   │   │   └── settings/page.tsx      # 설정 (API Key, 레포 관리)
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── v1/
│   │       │   ├── posts/route.ts     # 외부 발행 API
│   │       │   └── posts/[id]/route.ts
│   │       └── webhooks/
│   │           └── github/route.ts    # Webhook 수신
│   ├── components/
│   │   ├── layout/
│   │   │   ├── NavBar.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── ThemeToggle.tsx
│   │   ├── post/
│   │   │   ├── PostList.tsx           # 수평 카드 리스트
│   │   │   ├── PostItem.tsx           # 개별 수평 카드
│   │   │   ├── PostDetail.tsx         # 글 상세 본문
│   │   │   ├── TableOfContents.tsx    # TOC (sticky sidebar)
│   │   │   └── PostNav.tsx            # 이전/다음 글
│   │   ├── home/
│   │   │   ├── HeroBanner.tsx         # 다크 히어로 배너
│   │   │   └── CategoryFilter.tsx     # pill 칩 필터
│   │   ├── about/
│   │   │   ├── ProfileSection.tsx
│   │   │   └── ProjectCard.tsx
│   │   ├── admin/
│   │   │   ├── PostEditor.tsx
│   │   │   ├── ApiKeyManager.tsx
│   │   │   └── RepoManager.tsx
│   │   └── ui/
│   │       ├── Badge.tsx
│   │       ├── SearchBar.tsx
│   │       └── Skeleton.tsx
│   ├── lib/
│   │   ├── prisma.ts                  # Prisma client singleton
│   │   ├── auth.ts                    # NextAuth 설정
│   │   ├── claude.ts                  # Claude API 유틸
│   │   ├── fetch-ai-news.ts           # 멀티소스 AI 뉴스 수집 (HN, Reddit, HF, GitHub, RSS)
│   │   ├── signal-sources.ts          # 소스 카탈로그, 타입, 슬롯 설정
│   │   ├── normalize-url.ts           # URL 정규화, canonicalUrl, externalId 생성
│   │   ├── generate-daily-ai.ts       # AI Signal 포스트 자동 생성
│   │   ├── generate-post.ts           # 커밋 → 블로그 글 생성 로직
│   │   ├── github.ts                  # Octokit + Webhook 처리
│   │   ├── markdown.ts                # MDX 렌더링 유틸
│   │   ├── hallucination-checker.ts   # AI 생성 글 검증
│   │   ├── post-validator.ts          # 포스트 유효성 검사
│   │   └── api-auth.ts               # API Key 인증 미들웨어
│   ├── types/
│   │   └── index.ts
│   └── config/
│       ├── site.ts                    # 블로그 메타 설정
│       └── writing-style.ts           # AI 글쓰기 스타일 설정
├── .env.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── Dockerfile                         # Railway 배포용
├── CLAUDE.md                          # 이 파일
└── CHANGELOG.md                       # 세션 간 진행 기록
```

## 핵심 파일 관계 (AI Signal 파이프라인)

```
signal-sources.ts     → 소스 목록, 타입, 슬롯 설정, AI 키워드 필터
    ↓
fetch-ai-news.ts      → 5개 소스 병렬 수집 → dedup → 슬롯제 선별
    ↓
normalize-url.ts      → canonicalUrl 추출, externalId 생성 (중복 제거 핵심)
    ↓
generate-daily-ai.ts  → SignalItem DB upsert → 미사용 아이템 AI 요약 → Post 생성
    ↓
daily-ai.yml          → GitHub Actions cron 트리거
```

## 디자인 규칙

### 레퍼런스: tech.kakao.com (카카오테크)

**레이아웃:**
- 미니멀 네비게이션: "이더.dev" 로고 + Blog/Projects/About + 검색/다크모드
- 다크 히어로 배너 (메인 상단)
- 수평 카드 리스트 (왼쪽 썸네일 200×130 + 오른쪽 텍스트)
- 카드 구분: box-shadow가 아닌 border-bottom 구분선
- 글 상세: max-width 720px + 우측 sticky TOC
- 전체 max-width: 1100px

**컬러:**
- 라이트: #FFFFFF 바탕, #1B1D1F 텍스트, #3182F6 액센트
- 다크: #1B1D1F 바탕, #ECECEC 텍스트, #60A5FA 액센트
- 카테고리: commits=#00C471, articles=#3182F6, casual=#FF6B35, signal=#06B6D4
- 코드 블록: #191A1C 배경

**타이포:**
- Pretendard Variable (본문/제목)
- JetBrains Mono (코드)
- 본문: 17px / line-height 1.85
- 제목(H1): 36px / font-weight 800
- 코드: 14px / line-height 1.7

**컴포넌트:**
- 카테고리 필터: pill 칩 (border-radius: 9999px)
- 포스트 카드: 수평 레이아웃, hover 시 배경색 변경 (shadow 아님)
- 배지: 카테고리별 배경색 12% 투명도 + 해당 색 텍스트

## 코딩 규칙

### 일반
- TypeScript strict mode, any 금지
- 컴포넌트는 함수형 + arrow function export
- Server Component 기본, 클라이언트 필요시만 "use client"
- import 순서: react → next → 외부 → 내부 → types → styles
- 파일명: PascalCase (컴포넌트), camelCase (유틸), kebab-case (라우트)

### Prisma
- prisma.ts에서 globalThis로 singleton 관리
- 모든 DB 접근은 server action 또는 API route에서만
- 에러 처리: try-catch + 구체적 에러 메시지

### API
- 외부 API: /api/v1/ 프리픽스, Bearer token 인증
- 내부 API: /api/ 프리픽스, NextAuth 세션 인증
- 응답 형식: { success: boolean, data?: T, error?: string }

### 스타일
- Tailwind 유틸리티 클래스 우선
- CSS 변수: globals.css에 정의, Tailwind config에서 참조
- 다크모드: class 전략 (next-themes)
- 반응형: mobile-first (sm → md → lg)

## 환경 변수

```env
# Database
DATABASE_URL=postgresql://...

# NextAuth
NEXTAUTH_URL=https://radarlog.kr
NEXTAUTH_SECRET=your-secret
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Claude API
ANTHROPIC_API_KEY=

# GitHub (for Octokit)
GITHUB_TOKEN=
GITHUB_WEBHOOK_SECRET=

# Admin
ADMIN_GITHUB_ID=your-github-username

# Umami (통계)
NEXT_PUBLIC_UMAMI_URL=https://your-umami.railway.app
NEXT_PUBLIC_UMAMI_WEBSITE_ID=
```

## 커밋 규칙

```
feat: 새 기능
fix: 버그 수정
style: 스타일/UI 변경
refactor: 리팩토링
docs: 문서
chore: 설정/빌드
```

## 참고 문서

- 요구사항: docs/BLOG_REQUIREMENTS.md
- 디자인 시스템: docs/DESIGN_SYSTEM.md
- 목업: docs/radar-blog-mockup-v2.html
- Signal 소스 확장 플랜: docs/PLAN_signal_source_upgrade_v2.md
- AI 글 생성 규칙: docs/BLOG_REQUIREMENTS.md 부록
- **세션 기록: CHANGELOG.md (세션 시작 시 필독)**
