#!/bin/sh
set -e

# Railway의 PORT 환경 변수 사용 (기본값: 80)
PORT=${PORT:-80}

echo "🚀 Starting Nginx on port $PORT..."

# Nginx 설정에서 포트 교체
sed -i "s/listen 80;/listen $PORT;/g" /etc/nginx/conf.d/default.conf

# Nginx 시작
exec nginx -g "daemon off;"
