# ============================================
# Railway 배포용 Dockerfile (Multi-stage build)
# Nginx (정적 웹) + Node.js (API)
# ============================================

# Stage 1: Node.js API 빌드
FROM node:18-alpine AS api-builder

WORKDIR /app/api
COPY api/package*.json ./
RUN npm ci --production --silent
COPY api/ ./

# Stage 2: 최종 이미지
FROM nginx:alpine

# Node.js만 설치 (npm 불필요 - 빌드는 stage 1에서 완료)
RUN apk add --no-cache nodejs

# API 디렉토리 생성 및 파일 복사
WORKDIR /app/api
COPY --from=api-builder /app/api ./

# 웹 정적 파일 복사
COPY web /usr/share/nginx/html

# Nginx 설정 복사
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 시작 스크립트 복사
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Railway PORT 환경 변수 (기본값 80)
ENV PORT=80
ENV NODE_ENV=production

# 포트 노출
EXPOSE ${PORT}

# 헬스체크
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:${PORT}/health || exit 1

# 시작 스크립트 실행
CMD ["/start.sh"]
