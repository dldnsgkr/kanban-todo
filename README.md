# Kanban Todo Board

드래그 앤 드롭으로 할 일을 관리하는 칸반 보드 앱입니다.  
React + TypeScript로 개발되었으며, GitHub Actions를 통해 AWS S3에 자동 배포됩니다.

---

## 서비스 URL

> ⚠️ AWS Academy 임시 자격증명을 사용하므로 세션 만료(약 4시간) 후 접속이 불가할 수 있습니다.

**배포 주소:** http://mybucket-20263610-276594269232-us-east-1-an.s3-website-us-east-1.amazonaws.com/

---

## 주요 기능

| 기능           | 설명                                                            |
| -------------- | --------------------------------------------------------------- |
| 할 일 추가     | 제목, 우선순위(높음 / 중간 / 낮음), 마감일을 설정해 카드를 생성 |
| 카드 편집      | 생성된 카드의 제목, 우선순위, 마감일 수정                       |
| 드래그 앤 드롭 | 컬럼 간 카드 이동 및 컬럼 내 순서 변경                          |
| 마감일 알림    | 기한 초과 시 빨간색, D-2 이내는 노란색 배지로 시각적 경고       |
| 검색 / 필터    | 텍스트 검색 및 우선순위별 필터링                                |
| 상태 유지      | `localStorage`에 보드 상태를 저장해 새로고침 후에도 유지        |
| 반응형 UI      | 모바일/데스크톱 레이아웃 자동 전환                              |

---

## 기술 스택

| 구분           | 사용 기술                        |
| -------------- | -------------------------------- |
| Frontend       | React 18, TypeScript 5           |
| 스타일링       | Panda CSS                        |
| 드래그 앤 드롭 | @dnd-kit/core, @dnd-kit/sortable |
| 빌드 도구      | Vite 5                           |
| 패키지 매니저  | pnpm 9                           |
| CI/CD          | GitHub Actions                   |
| 인프라         | AWS S3 (정적 웹 호스팅)          |

---

## GitHub Actions CI/CD

### 전체 파이프라인 흐름

```
push(main) 또는 수동 실행
        │
        ▼
┌─────────────────────────────────────────┐
│   GitHub Actions (.github/workflows/    │
│              deploy.yml)                │
│                                         │
│  STEP 1. Checkout                       │
│    └─ 소스코드를 runner에 내려받음       │
│                                         │
│  STEP 2. Setup pnpm (v9)                │
│    └─ pnpm 패키지 매니저 설치           │
│                                         │
│  STEP 3. Setup Node.js (v20)            │
│    └─ Node 설치 + pnpm 캐시 적용        │
│                                         │
│  STEP 4. Install dependencies           │
│    └─ pnpm install                      │
│         └─ prepare 훅 → Panda codegen  │
│                                         │
│  STEP 5. Build                          │
│    └─ pnpm run build                    │
│         ├─ panda codegen (CSS 생성)     │
│         ├─ tsc -b (타입 검사)           │
│         └─ vite build → dist/          │
│                                         │
│  STEP 6. Configure AWS Credentials      │
│    └─ GitHub Secrets로 AWS 인증         │
│                                         │
│  STEP 7. Sync dist/ to S3              │
│    ├─ 정적 에셋 → 1년 캐시 적용        │
│    └─ index.html → 캐시 없음           │
└─────────────────────────────────────────┘
        │
        ▼
     배포 완료 (S3 정적 호스팅)
```

---

### 워크플로우 파일 상세 설명

```yaml
# .github/workflows/deploy.yml

name: Deploy to S3

# ─── 트리거 설정 ───────────────────────────────────────────
on:
  push:
    branches:
      - main # main 브랜치에 push 시 자동 실행
  workflow_dispatch: # GitHub UI 또는 CLI에서 수동 실행 가능

# ─── 잡(Job) 정의 ─────────────────────────────────────────
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest # GitHub에서 제공하는 Ubuntu 가상 머신에서 실행

    steps:
      # STEP 1: 소스코드 체크아웃
      - name: Checkout
        uses: actions/checkout@v4
        # 현재 저장소의 코드를 runner 환경에 내려받음

      # STEP 2: pnpm 패키지 매니저 설치
      - name: Setup pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 9 # package.json의 packageManager 버전과 일치시킴

      # STEP 3: Node.js 설치
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "pnpm" # pnpm store 캐시 → 의존성 설치 속도 향상

      # STEP 4: 의존성 설치
      - name: Install dependencies
        run: pnpm install
        # package.json의 prepare 스크립트가 자동 실행됨
        # prepare: "panda codegen" → Panda CSS 타입/토큰 파일 생성

      # STEP 5: 프로덕션 빌드
      - name: Build
        run: pnpm run build
        # build 스크립트 순서:
        #   1. panda codegen  → styled-system/ 생성
        #   2. tsc -b         → TypeScript 타입 검사
        #   3. vite build     → dist/ 산출물 생성

      # STEP 6: AWS 자격증명 설정
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-session-token: ${{ secrets.AWS_SESSION_TOKEN }} # AWS Academy 임시 자격증명
          aws-region: ${{ secrets.AWS_REGION }}

      # STEP 7: S3 배포
      - name: Sync dist/ to S3
        run: |
          # 정적 에셋 (JS, CSS, 이미지): 1년 캐시 + immutable
          # 파일명에 해시가 포함되어 있어 변경 시 새 파일로 인식됨
          aws s3 sync dist/ s3://${{ secrets.S3_BUCKET_NAME }} \
            --delete \
            --cache-control "public, max-age=31536000, immutable" \
            --exclude "index.html"

          # index.html: 캐시 없음
          # 항상 최신 버전을 받아 올바른 에셋 파일명을 참조하도록 함
          aws s3 cp dist/index.html s3://${{ secrets.S3_BUCKET_NAME }}/index.html \
            --cache-control "no-store"

      # CloudFront를 사용하는 경우 아래 step의 주석을 해제하세요
      # - name: Invalidate CloudFront cache
      #   run: |
      #     aws cloudfront create-invalidation \
      #       --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} \
      #       --paths "/*"
```

---

### 트리거 종류

| 트리거              | 조건                             | 사용 시점                             |
| ------------------- | -------------------------------- | ------------------------------------- |
| `push`              | `main` 브랜치에 커밋이 push될 때 | 코드 변경 후 자동 배포                |
| `workflow_dispatch` | GitHub UI 또는 CLI에서 수동 실행 | Secrets 갱신 후 코드 변경 없이 재배포 |

**수동 실행 방법 (workflow_dispatch)**

```bash
# GitHub CLI 사용
gh workflow run deploy.yml
```

또는 GitHub 저장소 → **Actions 탭** → `Deploy to S3` → **Run workflow** 버튼 클릭

---

### S3 캐시 전략

| 파일 종류          | Cache-Control                         | 이유                                                                                        |
| ------------------ | ------------------------------------- | ------------------------------------------------------------------------------------------- |
| JS, CSS, 이미지 등 | `public, max-age=31536000, immutable` | Vite가 파일명에 해시를 포함시키므로 변경 시 새 URL로 요청됨. 브라우저가 1년간 캐시해도 안전 |
| `index.html`       | `no-store`                            | 항상 최신 버전의 에셋 파일명(해시)을 참조해야 하므로 캐시하지 않음                          |

`--delete` 옵션으로 빌드 산출물에서 제거된 파일은 S3에서도 자동 삭제됩니다.

---

### GitHub Secrets 설정

**Settings → Secrets and variables → Actions → New repository secret**

| Secret 이름             | 설명                                      |
| ----------------------- | ----------------------------------------- |
| `AWS_ACCESS_KEY_ID`     | AWS 액세스 키 ID                          |
| `AWS_SECRET_ACCESS_KEY` | AWS 시크릿 액세스 키                      |
| `AWS_SESSION_TOKEN`     | AWS 세션 토큰 (AWS Academy 임시 자격증명) |
| `AWS_REGION`            | AWS 리전 (예: `us-east-1`)                |
| `S3_BUCKET_NAME`        | S3 버킷 이름                              |

> **AWS Academy Secrets 갱신 방법**
>
> AWS Academy 임시 자격증명은 약 4시간마다 만료됩니다.  
> 세션 만료 후 재배포가 필요한 경우 아래 절차를 따르세요.
>
> 1. AWS Academy → **AWS Details** → **Show** 클릭
> 2. `aws_access_key_id`, `aws_secret_access_key`, `aws_session_token` 값 확인
> 3. GitHub Secrets에서 3개 값 업데이트
> 4. **코드 변경 없이** `workflow_dispatch`로 재배포 실행

---

## CI/CD 시연 영상

**Youtube linke:** https://youtu.be/gv4Pz_uI34Q

## 로컬 실행 방법

```bash
# 의존성 설치
pnpm install

# 개발 서버 시작
pnpm dev

# 프로덕션 빌드
pnpm build
```

---

## 프로젝트 구조

```
kanban-todo/
├── .github/
│   └── workflows/
│       └── deploy.yml       # GitHub Actions 배포 워크플로우
├── src/
│   ├── components/
│   │   ├── AddTaskModal.tsx  # 할 일 추가 / 수정 모달
│   │   ├── Card.tsx          # 칸반 카드 컴포넌트
│   │   └── Column.tsx        # 컬럼 (Todo / In Progress / Done)
│   ├── hooks/
│   │   └── useLocalStorage.ts
│   ├── types.ts              # 타입 정의
│   ├── App.tsx               # 루트 컴포넌트 / 드래그 앤 드롭 로직
│   └── main.tsx
├── panda.config.ts           # Panda CSS 설정
└── vite.config.ts
```
