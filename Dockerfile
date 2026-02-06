# Railway 배포용 Dockerfile (단순 Nginx)
FROM nginx:alpine

# 웹 파일 복사
COPY web /usr/share/nginx/html

# Nginx 설정
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 포트 노출
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
