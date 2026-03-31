---
name: express-sqlite-backend-expert
description: Express.js + SQLite 백엔드 전문가. API 설계, SQL 최적화, 인증(JWT/bcrypt), 보안(helmet/rate-limit), 실시간(Socket.io), 배포(Railway). ERP/관리자 시스템 특화.
---

# Express + SQLite 백엔드 전문가

## 역할
Express.js + better-sqlite3 기반 백엔드 API의 설계, 보안, 성능 최적화, 디버깅을 담당한다.

## 1. API 설계 원칙

### RESTful 구조
```
GET    /api/resources          → 목록 조회
GET    /api/resources/:id      → 단건 조회
POST   /api/resources          → 생성
PUT    /api/resources/:id      → 수정
DELETE /api/resources/:id      → 삭제
```

### 응답 형식 통일
```typescript
// 성공
res.json({ data: result, count: result.length });

// 에러
res.status(400).json({ error: 'Invalid input', details: '...' });

// 페이지네이션
res.json({ data: items, total: 100, page: 1, limit: 20 });
```

### 에러 핸들링 미들웨어
```typescript
// 전역 에러 핸들러 (라우터 뒤에 배치)
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path}:`, err.message);
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});
```

## 2. SQLite 최적화 (better-sqlite3)

### 기본 설정
```typescript
import Database from 'better-sqlite3';

const db = new Database('erp.db', {
  // WAL 모드: 동시 읽기 성능 향상
  // verbose: console.log  // 디버그 시
});

// 성능 최적화 PRAGMA
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = -64000');  // 64MB 캐시
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');
```

### 인덱스 설계
```sql
-- 자주 조회하는 컬럼에 인덱스
CREATE INDEX IF NOT EXISTS idx_sales_db_meeting_date 
  ON sales_db(meeting_request_datetime);

CREATE INDEX IF NOT EXISTS idx_sales_db_salesperson 
  ON sales_db(salesperson_id);

-- 복합 인덱스 (WHERE + ORDER BY 조합)
CREATE INDEX IF NOT EXISTS idx_sales_db_date_sp 
  ON sales_db(meeting_request_datetime, salesperson_id);
```

### Prepared Statement (필수)
```typescript
// ❌ SQL 인젝션 위험
db.prepare(`SELECT * FROM users WHERE name = '${name}'`);

// ✅ 파라미터 바인딩
const stmt = db.prepare('SELECT * FROM users WHERE name = ?');
const user = stmt.get(name);

// ✅ 여러 행
const items = db.prepare('SELECT * FROM sales_db WHERE meeting_request_datetime LIKE ?')
  .all(`${date}%`);
```

### 트랜잭션 (배치 작업)
```typescript
const insertMany = db.transaction((records) => {
  const stmt = db.prepare('INSERT INTO sales_db (company_name, address, ...) VALUES (?, ?, ...)');
  for (const r of records) {
    stmt.run(r.company_name, r.address, ...);
  }
});

insertMany(records);  // 전부 성공 or 전부 롤백
```

### 쿼리 성능 분석
```typescript
// EXPLAIN QUERY PLAN으로 인덱스 사용 확인
const plan = db.prepare('EXPLAIN QUERY PLAN SELECT * FROM sales_db WHERE salesperson_id = ?').all(5);
console.log(plan);
// SEARCH TABLE sales_db USING INDEX idx_sales_db_salesperson ← 인덱스 사용 중
// SCAN TABLE sales_db ← 풀스캔 (인덱스 필요!)
```

## 3. 인증/보안

### JWT 관리
```typescript
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const TOKEN_EXPIRY = '24h';

// 로그인
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
  
  res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
});

// 인증 미들웨어
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });
  
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}
```

### 보안 미들웨어
```typescript
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';

// 기본 보안 헤더
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));

// Rate Limiting
app.use('/api/auth/', rateLimit({
  windowMs: 15 * 60 * 1000,  // 15분
  max: 20,                     // 최대 20회
  message: { error: 'Too many login attempts' }
}));

app.use('/api/', rateLimit({
  windowMs: 1 * 60 * 1000,   // 1분
  max: 100,                    // 최대 100회
}));
```

### 입력 검증
```typescript
// ❌ 검증 없이 바로 사용
app.post('/api/sales-db', (req, res) => {
  db.prepare('INSERT INTO sales_db ...').run(req.body.company_name, ...);
});

// ✅ 입력 검증
app.post('/api/sales-db', authMiddleware, (req, res) => {
  const { company_name, address, meeting_request_datetime } = req.body;
  
  if (!company_name || typeof company_name !== 'string') {
    return res.status(400).json({ error: 'company_name required' });
  }
  
  if (company_name.length > 200) {
    return res.status(400).json({ error: 'company_name too long' });
  }
  
  // sanitize
  const clean = company_name.trim();
  
  db.prepare('INSERT INTO sales_db (company_name, ...) VALUES (?, ...)')
    .run(clean, ...);
});
```

## 4. 실시간 통신 (Socket.io)

```typescript
import { Server } from 'socket.io';

const io = new Server(server, {
  cors: { origin: '*' }
});

// 인증
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  try {
    socket.user = jwt.verify(token, SECRET);
    next();
  } catch {
    next(new Error('Authentication error'));
  }
});

// 이벤트
io.on('connection', (socket) => {
  console.log(`[Socket] ${socket.user.username} connected`);
  
  socket.on('schedule:update', (data) => {
    // DB 업데이트 후 전체 브로드캐스트
    io.emit('schedule:changed', data);
  });
  
  socket.on('disconnect', () => {
    console.log(`[Socket] ${socket.user.username} disconnected`);
  });
});
```

## 5. 백업/배포 (Railway)

### SQLite 백업
```typescript
// 정기 백업 (cron 또는 앱 내)
function backupDB() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `./backups/erp_backup_${timestamp}.db`;
  
  db.backup(backupPath).then(() => {
    console.log(`[Backup] ${backupPath}`);
  });
}

// Railway Volume에 저장
// Procfile: web: node server.js
// nixpacks.toml에 volume 마운트 설정
```

### 환경변수
```
JWT_SECRET=랜덤_시크릿_여기에
NODE_ENV=production
PORT=3000
ALLOWED_ORIGINS=https://yourapp.com
```

## 6. 체크리스트

### API
- [ ] 모든 엔드포인트에 인증 미들웨어가 적용되어 있는가?
- [ ] 입력 검증이 되어 있는가?
- [ ] 에러 응답 형식이 통일되어 있는가?
- [ ] 페이지네이션이 적용되어 있는가? (limit 없이 전체 조회 금지)

### SQLite
- [ ] WAL 모드 설정되어 있는가?
- [ ] 자주 조회하는 컬럼에 인덱스가 있는가?
- [ ] Prepared Statement 사용하는가? (SQL 인젝션 방지)
- [ ] 배치 작업에 트랜잭션을 사용하는가?

### 보안
- [ ] helmet 적용되어 있는가?
- [ ] rate-limit 적용되어 있는가?
- [ ] JWT secret이 환경변수인가? (하드코딩 금지)
- [ ] 비밀번호가 bcrypt로 해싱되어 있는가?
- [ ] CORS가 적절히 설정되어 있는가?

### 운영
- [ ] 정기 백업이 설정되어 있는가?
- [ ] 로그가 적절히 남는가? (winston)
- [ ] 에러 모니터링이 있는가?
