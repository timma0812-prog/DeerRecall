# DeerRecall

DeerRecall is a static MVP prototype for an AI recruiting workspace. The current implementation is plain HTML, CSS, and JavaScript with seeded local data. There is no backend API, database, resume parser, or model service in this repository yet.

## Local Commands

Run the structure tests:

```bash
npm test
```

Build the static artifact:

```bash
npm run build
```

Serve the built artifact locally:

```bash
npm run serve
```

## Docker Compose Deployment

Build the static artifact and image:

```bash
npm run build
docker build -t deerrecall:local .
```

If Docker Desktop is installed but `docker` is not on your shell path, use:

```bash
export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"
```

If Docker Hub is unreachable from the host, build with an alternate Docker Library mirror:

```bash
docker build \
  --build-arg NGINX_IMAGE=public.ecr.aws/docker/library/nginx:1.27-alpine \
  -t deerrecall:local .
```

Start the app with Docker Compose:

```bash
DEERRECALL_IMAGE=deerrecall:local DEERRECALL_PORT=8080 docker compose up -d
```

Open `http://localhost:8080`.

Inspect logs:

```bash
docker compose logs --tail=100 deerrecall
```

Stop the app:

```bash
docker compose down
```

## Deployment Variables

Copy `.env.example` to `.env` for local overrides.

```dotenv
DEERRECALL_IMAGE=deerrecall:local
DEERRECALL_CONTAINER=deerrecall
DEERRECALL_PORT=8080
```

## Harness Open Source

This repository includes a Harness Open Source pipeline at `.harness/deerrecall-ci-cd.yaml`.

The pipeline flow is:

```text
source -> npm test -> npm run build -> docker build -> docker compose up -d -> release smoke checks
```

Harness must run with access to the Docker socket for image builds and Docker Compose deployment. When running Harness Open Source locally, mount `/var/run/docker.sock` into the Harness container.

The pipeline uses Harness Open Source pipeline YAML with a host volume for `/var/run/docker.sock`. Save the pipeline in your Harness instance before relying on triggers so Harness can validate the YAML against the version you run.

## Production Release Guardrails

Before deploying outside a demo environment:

- Build artifacts exclude design references: `npm run build` copies only `index.html`, `app.js`, and `styles.css` into `dist`.
- JS and CSS use `no-cache, must-revalidate` because filenames are not content-hashed.
- The SPA shell uses `no-store` so release checks always fetch the current HTML entry.
- Harness verify checks the deployed HTML for core SPA states and validates cache headers for `app.js`, `styles.css`, and `/`.
- Create a release tag before production deployment, then deploy that image tag so rollback can use the previous immutable image tag.

Example Harness Open Source startup:

```bash
docker run -d \
  -p 3000:3000 \
  -p 3022:3022 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /tmp/harness:/data \
  --name harness \
  --restart always \
  harness/harness
```

## Rollback

For this single-host deployment, rollback means deploying a previous Docker image tag:

```bash
DEERRECALL_IMAGE=deerrecall:previous docker compose up -d
```

If deployment fails, inspect the service:

```bash
docker compose ps
docker compose logs --tail=100 deerrecall
```
