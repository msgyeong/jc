# Railway 배포용 Dockerfile
FROM nginx:alpine

# 웹 파일 복사
COPY web /usr/share/nginx/html

# Nginx 설정 복사
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 시작 스크립트 복사
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Railway의 PORT 환경 변수 사용
ENV PORT=80

# 포트 노출
EXPOSE ${PORT}

# 시작 스크립트 실행
CMD ["/start.sh"]
