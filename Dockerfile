ARG NODE_IMAGE=public.ecr.aws/docker/library/node:20-alpine
FROM ${NODE_IMAGE}

WORKDIR /app

COPY package.json package-lock.json ./
COPY server/ ./server/
COPY dist/ ./dist/

ENV DEERRECALL_HOST=0.0.0.0
ENV DEERRECALL_PORT=8080

EXPOSE 8080

CMD ["node", "server/server.mjs"]
