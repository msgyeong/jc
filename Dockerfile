# Railway 배포용 Dockerfile - Multi-stage build
# Stage 1: DB 초기화
FROM node:18-alpine AS init

WORKDIR /app

# package.json 및 DB 초기화 스크립트 복사
COPY package*.json ./
COPY web/js/db-init.js ./web/js/

# Node.js 의존성 설치
RUN npm install --production

# Stage 2: 웹 서버
FROM nginx:alpine

# Stage 1에서 node 및 스크립트 복사
COPY --from=init /usr/local/bin/node /usr/local/bin/
COPY --from=init /usr/lib /usr/lib
COPY --from=init /app /app

# 웹 파일 복사
COPY web /usr/share/nginx/html

# Nginx 설정 복사
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 시작 스크립트 생성
RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo 'set -e' >> /docker-entrypoint.sh && \
    echo 'echo "🚀 JC 앱 시작..."' >> /docker-entrypoint.sh && \
    echo 'echo ""' >> /docker-entrypoint.sh && \
    echo 'if [ ! -z "$DATABASE_URL" ]; then' >> /docker-entrypoint.sh && \
    echo '  echo "📊 데이터베이스 초기화 중..."' >> /docker-entrypoint.sh && \
    echo '  cd /app && node web/js/db-init.js' >> /docker-entrypoint.sh && \
    echo '  echo ""' >> /docker-entrypoint.sh && \
    echo 'else' >> /docker-entrypoint.sh && \
    echo '  echo "⚠️  DATABASE_URL이 설정되지 않았습니다."' >> /docker-entrypoint.sh && \
    echo 'fi' >> /docker-entrypoint.sh && \
    echo 'echo "🌐 웹 서버 시작..."' >> /docker-entrypoint.sh && \
    echo 'exec nginx -g "daemon off;"' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

WORKDIR /usr/share/nginx/html

# 포트 노출
EXPOSE 80

# 시작!
ENTRYPOINT ["/docker-entrypoint.sh"]
