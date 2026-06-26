ARG NGINX_IMAGE=public.ecr.aws/docker/library/nginx:1.27-alpine
FROM ${NGINX_IMAGE}

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY dist/ /usr/share/nginx/html/

EXPOSE 80
