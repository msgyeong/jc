# Railway 배포용 Dockerfile (Node.js + Nginx)
FROM node:18-alpine

# Nginx 설치
RUN apk add --no-cache nginx

# 작업 디렉토리
WORKDIR /app

# package.json 및 DB 초기화 스크립트 복사
COPY package*.json ./
COPY web/js/db-init.js ./web/js/

# Node.js 의존성 설치
RUN npm install --production

# 웹 파일 복사
COPY web /usr/share/nginx/html

# Nginx 설정
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 시작 스크립트 생성
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'echo "🚀 JC 앱 시작..."' >> /start.sh && \
    echo 'echo ""' >> /start.sh && \
    echo 'if [ ! -z "$DATABASE_URL" ]; then' >> /start.sh && \
    echo '  echo "📊 데이터베이스 초기화 중..."' >> /start.sh && \
    echo '  node web/js/db-init.js' >> /start.sh && \
    echo '  echo ""' >> /start.sh && \
    echo 'else' >> /start.sh && \
    echo '  echo "⚠️  DATABASE_URL이 설정되지 않았습니다."' >> /start.sh && \
    echo 'fi' >> /start.sh && \
    echo 'echo "🌐 웹 서버 시작..."' >> /start.sh && \
    echo 'nginx -g "daemon off;"' >> /start.sh && \
    chmod +x /start.sh

# 포트 노출
EXPOSE 80

# 시작!
CMD ["/start.sh"]
