# Backend Log

## 2026-03-15: profession(직종) 컬럼 추가

### 마이그레이션
- `018_profession.sql`: `users.profession VARCHAR(100)` 추가 (프로덕션 DB 적용 완료)

### API 수정
| 엔드포인트 | 변경 |
|-----------|------|
| `GET /api/admin/members` | SELECT에 `u.profession`, `p.name as position_name` (LEFT JOIN) 추가 |
| `GET /api/admin/members/:id` | SELECT에 `u.profession` 추가 |
| `PUT /api/admin/members/:id` | `profession` 필드 저장 가능 |
| `GET /api/admin/members/:id/dossier` | SELECT에 `u.profession` 추가 |
| `GET /api/members` | SELECT에 `u.profession` 추가 |
| `GET /api/members/:id` | SELECT에 `u.profession` 추가 |

### 필드 구분
- `users.position` = 직장 직위 (수석개발자, 실장 등)
- `users.position_id` = JC 직책 FK (positions 테이블)
- `users.profession` = 직종 (변호사, 한의사, 개발자 등) **NEW**

### 테스트: 12/12 PASS
