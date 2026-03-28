#!/bin/sh
set -e

echo "================================================"
echo "🚀 Railway 배포 시작"
echo "================================================"

# Railway PORT 환경 변수 사용 (기본값: 80)
PORT=${PORT:-80}
echo "📡 포트: $PORT"
echo "🌍 환경: ${NODE_ENV:-production}"

# Nginx 설정에서 포트 교체
echo "⚙️  Nginx 설정 업데이트..."
sed -i "s/listen 80;/listen $PORT;/g" /etc/nginx/conf.d/default.conf

# Node.js API 서버 시작 (백그라운드)
echo "🟢 Node.js API 서버 시작 중..."
cd /app/api

# 환경 변수 확인
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  경고: DATABASE_URL 환경 변수가 설정되지 않았습니다."
fi

if [ -z "$JWT_SECRET" ]; then
    echo "⚠️  경고: JWT_SECRET 환경 변수가 설정되지 않았습니다."
fi

# Node.js 서버 백그라운드 실행
# API_PORT=3000 강제 지정, PORT 변수 숨김 (nginx가 사용하는 포트와 충돌 방지)
echo "🔹 Node.js 시작 명령: env -u PORT API_PORT=3000 node server.js"
env -u PORT API_PORT=3000 node server.js 2>&1 &
API_PID=$!
echo "✅ Node.js API 서버 시작됨 (PID: $API_PID)"

# API 서버가 준비될 때까지 대기
echo "⏳ API 서버 준비 대기 중..."
sleep 8

# Node.js 프로세스 생존 확인
if kill -0 $API_PID 2>/dev/null; then
    echo "✅ Node.js 프로세스 실행 중 (PID: $API_PID)"
else
    echo "❌ Node.js 프로세스가 죽었습니다! (PID: $API_PID)"
    echo "❌ 재시작 시도..."
    env -u PORT API_PORT=3000 node server.js 2>&1 &
    API_PID=$!
    sleep 5
fi

# API 헬스체크
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ API 서버 헬스체크 통과"
else
    echo "⚠️  API 서버 헬스체크 실패"
    echo "⚠️  Node.js 직접 테스트:"
    env -u PORT API_PORT=3000 node -e "require('./server.js')" 2>&1 | head -20 || true
fi

# Nginx 시작 (포그라운드)
echo "🟢 Nginx 웹 서버 시작 중..."
echo "================================================"
echo "✅ 배포 완료!"
echo "📡 서버 실행 중: 포트 $PORT"
echo "🌐 웹: http://localhost:$PORT"
echo "🔌 API: http://localhost:$PORT/api"
echo "================================================"

# Nginx를 포그라운드로 실행 (컨테이너가 종료되지 않도록)
exec nginx -g "daemon off;"
