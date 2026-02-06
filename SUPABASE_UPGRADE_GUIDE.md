# 🚀 Supabase 무료 → 유료 업그레이드 가이드

## ✅ 안전한 업그레이드 (데이터 손실 없음)

Supabase는 **무료 → 유료 업그레이드 시 데이터가 100% 보존**됩니다!
같은 프로젝트에서 플랜만 변경하므로 걱정 없습니다.

---

## 📊 플랜 비교

| 항목 | Free | Pro | Team | Enterprise |
|------|------|-----|------|------------|
| **가격** | $0/월 | $25/월 | $599/월 | 맞춤형 |
| **데이터베이스** | 500MB | 8GB | 무제한 | 무제한 |
| **파일 스토리지** | 1GB | 100GB | 무제한 | 무제한 |
| **월간 활성 사용자** | 50,000 | 100,000 | 무제한 | 무제한 |
| **대역폭** | 5GB | 250GB | 무제한 | 무제한 |
| **자동 백업** | ❌ 없음 | ✅ 7일 | ✅ 14일 | ✅ 맞춤형 |
| **우선 지원** | ❌ | ✅ | ✅ | ✅ |
| **커스텀 도메인** | ❌ | ✅ | ✅ | ✅ |
| **고급 보안** | ❌ | ✅ | ✅ | ✅ |

**추천**: 회원 100명 이하 = Free / 100-1000명 = Pro

---

## 🔄 업그레이드 방법 (3분 완료)

### Step 1: 현재 사용량 확인

1. Supabase 대시보드 → **⚙️ Settings** → **Usage**
2. 다음 항목 확인:
   - Database size (500MB 넘으면 업그레이드)
   - Storage (1GB 넘으면 업그레이드)
   - Bandwidth (5GB 넘으면 업그레이드)
   - Active users (50,000명 넘으면 업그레이드)

### Step 2: 업그레이드 실행

1. Supabase 대시보드 → **⚙️ Settings** → **Billing**
2. **"Upgrade to Pro"** 클릭
3. 결제 정보 입력 (카드/PayPal)
4. **"Confirm"** 클릭

**✅ 완료! 데이터는 그대로 유지됩니다!**

---

## 🛡️ 데이터 보호 전략 (중요!)

무료 플랜에는 **자동 백업이 없습니다!**
아래 방법으로 데이터를 보호하세요:

### 📥 방법 1: 수동 백업 (무료 플랜)

#### 매주 1회 실행 (5분 소요)

1. Supabase 대시보드 → **🗄️ Database**
2. **Backups** 탭 클릭
3. **"Create backup"** 클릭
4. 백업 파일 다운로드 (`.sql` 파일)
5. 안전한 곳에 저장 (Google Drive, 외장하드 등)

#### 자동화 스크립트 (Windows)

`backup-supabase.bat` 파일 생성:

```batch
@echo off
SETLOCAL

REM Supabase CLI 설치 필요: npm install -g supabase
REM https://supabase.com/docs/guides/cli

SET PROJECT_ID=your-project-id
SET BACKUP_DIR=C:\JC_Backups
SET DATE=%date:~0,4%%date:~5,2%%date:~8,2%

echo 📦 Supabase 백업 시작: %DATE%

REM 백업 디렉토리 생성
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

REM 데이터베이스 백업
supabase db dump --project-id %PROJECT_ID% -f "%BACKUP_DIR%\backup_%DATE%.sql"

echo ✅ 백업 완료: %BACKUP_DIR%\backup_%DATE%.sql

ENDLOCAL
pause
```

**Windows 작업 스케줄러로 자동 실행 설정:**

1. Windows 키 + R → `taskschd.msc` 입력
2. "작업 만들기" 클릭
3. 트리거: 매주 일요일 오전 3시
4. 동작: `C:\jcK\backup-supabase.bat` 실행

---

### 📥 방법 2: 자동 백업 (Pro 플랜)

Pro 플랜 업그레이드 후:

1. Supabase 대시보드 → **🗄️ Database** → **Backups**
2. **"Enable automatic backups"** 클릭
3. 백업 주기 설정:
   - Daily (매일)
   - Weekly (매주)
   - Custom (맞춤)
4. 보관 기간: 7일 (Pro) / 14일 (Team)

---

## 🔐 프로덕션 환경 설정

### 1. 데이터베이스 보안 강화

**RLS (Row Level Security) 필수 활성화:**

```sql
-- 모든 테이블 RLS 활성화 (이미 SUPABASE_SETUP_GUIDE.md에 포함됨)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
```

**✅ 이미 설정되어 있습니다!** (SUPABASE_SETUP_GUIDE.md 실행 시 자동 적용)

---

### 2. API 키 보안

**⚠️ 중요: `anon` 키는 공개되어도 안전합니다!**

- `anon` 키: 클라이언트에서 사용 (공개 가능)
- `service_role` 키: 서버에서만 사용 (절대 공개 금지!)

**Railway 환경 변수 설정:**

1. Railway 대시보드 → `jc` 프로젝트 → **Variables**
2. 다음 변수 추가:

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbG...
```

3. `web/js/config.js` 파일은 **절대 `service_role` 키를 사용하지 마세요!**

---

### 3. 데이터베이스 연결 제한

**무료 플랜 제한:**
- 최대 동시 연결: 60개
- 초과 시 에러 발생

**Pro 플랜:**
- 최대 동시 연결: 200개
- 더 안정적인 운영

**연결 풀 최적화:**

```javascript
// web/js/config.js (수정 필요 없음)
const supabase = supabase_js.createClient(
    SUPABASE_CONFIG.url,
    SUPABASE_CONFIG.anonKey,
    {
        db: {
            schema: 'public',
        },
        auth: {
            persistSession: true,
            autoRefreshToken: true,
        },
        global: {
            headers: {
                'x-application-name': 'jc-app',
            },
        },
    }
);
```

✅ **이미 최적화되어 있습니다!**

---

## 📈 모니터링 및 알림 설정

### 1. 사용량 알림 (무료 플랜)

1. Supabase 대시보드 → **⚙️ Settings** → **Usage**
2. **"Set up alerts"** 클릭
3. 알림 설정:
   - Database: 80% 사용 시 알림
   - Storage: 80% 사용 시 알림
   - Bandwidth: 80% 사용 시 알림
4. 이메일 주소 입력

**무료 플랜 한계 도달 전에 알림이 옵니다!**

---

### 2. 에러 모니터링 (Sentry 연동)

**무료로 에러 추적하기:**

1. https://sentry.io 회원가입 (무료)
2. 새 프로젝트 생성 (JavaScript)
3. DSN 복사

`web/index.html` 수정:

```html
<!-- Sentry 에러 추적 -->
<script src="https://browser.sentry-cdn.com/7.x.x/bundle.min.js"></script>
<script>
  Sentry.init({
    dsn: "YOUR_SENTRY_DSN",
    environment: "production",
    tracesSampleRate: 1.0,
  });
</script>

<!-- 기존 스크립트들 -->
<script src="js/config.js"></script>
...
```

---

## 🔄 데이터 마이그레이션 준비

### 1. 마이그레이션 스크립트 관리

`C:\jcK\database\migrations\` 디렉토리 생성:

```
C:\jcK\
├── database/
│   └── migrations/
│       ├── 001_initial_schema.sql       ← SUPABASE_SETUP_GUIDE.md 내용
│       ├── 002_add_user_fields.sql      ← 추후 추가 필드
│       └── 003_add_notifications.sql    ← 추후 기능 추가
```

**각 마이그레이션 파일에 버전 번호 추가:**

```sql
-- migrations/001_initial_schema.sql
-- Version: 1.0.0
-- Date: 2026-02-06
-- Description: Initial database schema

-- (SUPABASE_SETUP_GUIDE.md 내용 전체 복사)
```

---

### 2. 마이그레이션 추적 테이블

```sql
-- migrations 테이블 생성 (버전 관리)
CREATE TABLE IF NOT EXISTS public.schema_migrations (
    id SERIAL PRIMARY KEY,
    version TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 첫 번째 마이그레이션 기록
INSERT INTO public.schema_migrations (version, name)
VALUES ('001', 'initial_schema');
```

---

## 🚨 업그레이드 체크리스트

### ✅ 업그레이드 전 (필수!)

- [ ] 현재 데이터베이스 백업 다운로드
- [ ] 사용량 확인 (Settings → Usage)
- [ ] 결제 카드 정보 준비
- [ ] Railway 환경 변수 확인
- [ ] 웹 앱 정상 작동 확인

### ✅ 업그레이드 중

- [ ] Supabase → Billing → Upgrade to Pro
- [ ] 결제 정보 입력
- [ ] 업그레이드 완료 확인 (이메일 수신)

### ✅ 업그레이드 후

- [ ] 자동 백업 활성화 (Pro 플랜)
- [ ] 웹 앱 정상 작동 확인
- [ ] 관리자 로그인 테스트
- [ ] 회원가입 테스트
- [ ] 게시판/공지사항 테스트
- [ ] 데이터베이스 연결 확인

---

## 💰 비용 최적화 팁

### 1. 이미지 최적화

**파일 크기 줄이기:**
- 프로필 사진: 500x500px, 100KB 이하
- 게시글 이미지: 1200x1200px, 500KB 이하

**Supabase Storage 정책:**

```sql
-- Storage 버킷 생성 (Supabase 대시보드 → Storage)
-- Bucket: avatars (Public)
-- Bucket: post-images (Public)

-- 파일 크기 제한 (2MB)
-- Bucket settings → Max file size: 2MB
```

---

### 2. 데이터베이스 쿼리 최적화

**인덱스 활용 (이미 적용됨):**

```sql
-- SUPABASE_SETUP_GUIDE.md에 이미 포함됨
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
```

**불필요한 데이터 정기 삭제:**

```sql
-- 1년 이상 된 삭제된 게시글 영구 삭제 (선택)
DELETE FROM posts 
WHERE deleted_at IS NOT NULL 
AND deleted_at < NOW() - INTERVAL '1 year';
```

---

### 3. 대역폭 절약

**CDN 사용 (무료):**
- Cloudflare: 무료 CDN + 무제한 대역폭
- Railway에 Cloudflare 연결

**이미지 로딩 최적화:**

```javascript
// web/js/utils.js에 추가
function lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}
```

---

## 📞 문제 해결

### Q1: 업그레이드 후 웹 앱이 안 돼요

**A: API 키 확인**

1. Supabase → Settings → API
2. URL과 anon key가 그대로인지 확인
3. Railway 환경 변수 재확인

### Q2: 백업 파일을 어떻게 복구하나요?

**A: Supabase SQL Editor에서 실행**

1. Supabase → SQL Editor
2. 백업 파일 (`.sql`) 내용 복사
3. 붙여넣고 "RUN" 클릭

⚠️ **주의**: 기존 데이터를 덮어쓰므로 신중히!

### Q3: 무료 플랜으로 다시 다운그레이드 가능한가요?

**A: 가능합니다! (데이터 유지)**

1. Supabase → Billing → "Downgrade to Free"
2. 단, 데이터가 500MB 이하여야 함
3. 초과 시 다운로드 후 삭제 필요

---

## 📊 현재 설정 요약

### ✅ 이미 적용된 보안 설정

- ✅ Row Level Security (RLS) 활성화
- ✅ API 키 분리 (anon vs service_role)
- ✅ 인증 세션 관리
- ✅ 데이터베이스 인덱스 최적화
- ✅ 트리거 자동화

### ⏭️ 다음 단계 (선택)

- [ ] 수동 백업 설정 (무료 플랜)
- [ ] 사용량 알림 설정
- [ ] Sentry 에러 모니터링
- [ ] Cloudflare CDN 연결
- [ ] 이미지 최적화

---

## 🎯 결론

### 무료 플랜으로 시작 (추천)

- ✅ 회원 100명 이하
- ✅ 월간 방문자 1,000명 이하
- ✅ 수동 백업 주 1회

### Pro 플랜 업그레이드 시점

- 📊 데이터베이스 400MB 도달
- 👥 회원 50명 이상
- 📈 월간 방문자 5,000명 이상
- 🔒 자동 백업 필요
- 🚀 더 빠른 속도 필요

**💡 업그레이드는 클릭 한 번! 데이터는 100% 보존!**

---

**이제 안심하고 무료로 시작하세요!** 🚀
