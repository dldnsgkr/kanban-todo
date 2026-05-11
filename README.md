# Kanban Todo Board

드래그 앤 드롭으로 할 일을 관리하는 칸반 보드 앱입니다.  
React + TypeScript로 개발되었으며, GitHub Actions를 통해 AWS S3에 자동 배포됩니다.

---

## 서비스 URL

> ⚠️ AWS Academy 임시 자격증명을 사용하므로 세션 만료(약 4시간) 후 접속이 불가할 수 있습니다.

**배포 주소:** `<!-- TODO: S3 버킷 URL 입력 -->`

---

## 주요 기능

| 기능 | 설명 |
|---|---|
| 할 일 추가 | 제목과 우선순위(높음 / 보통 / 낮음)를 설정해 카드를 생성 |
| 드래그 앤 드롭 | Todo → In Progress → Done 컬럼 간 카드 이동 |
| 할 일 삭제 | 카드 개별 삭제 |
| 상태 유지 | `localStorage`에 보드 상태를 저장해 새로고침 후에도 유지 |
| 반응형 UI | 모바일/데스크톱 레이아웃 자동 전환 |

---

## 기술 스택

| 구분 | 사용 기술 |
|---|---|
| Frontend | React 18, TypeScript 5 |
| 스타일링 | Panda CSS |
| 드래그 앤 드롭 | @dnd-kit/core |
| 빌드 도구 | Vite 5 |
| 패키지 매니저 | pnpm 9 |
| CI/CD | GitHub Actions |
| 인프라 | AWS S3 (정적 웹 호스팅) |

---

## GitHub Actions CI/CD

`main` 브랜치에 push하면 아래 파이프라인이 자동으로 실행됩니다.

```
git push origin main
        │
        ▼
GitHub Actions 트리거 (.github/workflows/deploy.yml)
        │
        ├─ 1. 코드 체크아웃
        ├─ 2. pnpm + Node.js 20 설치
        ├─ 3. 의존성 설치 (pnpm install)
        │      └─ prepare 훅 → Panda CSS codegen 자동 실행
        ├─ 4. 프로덕션 빌드 (pnpm run build)
        │      └─ panda codegen → tsc -b → vite build → dist/
        ├─ 5. AWS 자격증명 설정 (GitHub Secrets)
        └─ 6. dist/ → S3 버킷 동기화 (배포 완료)
```

### 워크플로우 파일

```yaml
# .github/workflows/deploy.yml
on:
  push:
    branches:
      - main
```

`main` 브랜치 push 이벤트를 감지해 자동 실행됩니다.

### GitHub Secrets 설정

GitHub 저장소 **Settings → Secrets and variables → Actions** 에서 아래 4개 값을 등록해야 합니다.

| Secret 이름 | 설명 |
|---|---|
| `AWS_ACCESS_KEY_ID` | AWS 액세스 키 ID |
| `AWS_SECRET_ACCESS_KEY` | AWS 시크릿 액세스 키 |
| `AWS_SESSION_TOKEN` | AWS 세션 토큰 (AWS Academy 임시 자격증명) |
| `AWS_REGION` | AWS 리전 (예: `us-east-1`) |
| `S3_BUCKET_NAME` | S3 버킷 이름 |

> **AWS Academy 주의사항**  
> AWS Academy는 임시 자격증명을 제공하므로 약 4시간마다 세션이 만료됩니다.  
> 배포 전 AWS Academy에서 최신 자격증명을 확인하고 GitHub Secrets를 갱신해야 합니다.
>
> **AWS Academy → AWS Details → Show** 에서 `aws_access_key_id`, `aws_secret_access_key`, `aws_session_token` 값을 복사해 Secrets를 업데이트하세요.

### S3 배포 전략

```bash
# 정적 에셋 (JS, CSS, 이미지) — 1년 캐시
aws s3 sync dist/ s3://<bucket> --exclude "index.html" \
  --cache-control "public, max-age=31536000, immutable"

# index.html — 캐시 없음 (항상 최신 버전 제공)
aws s3 cp dist/index.html s3://<bucket>/index.html \
  --cache-control "no-store"
```

---

## CI/CD 시연 영상

`<!-- TODO: YouTube 영상 링크 입력 -->`

---

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
│   │   ├── AddTaskModal.tsx  # 할 일 추가 모달
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
