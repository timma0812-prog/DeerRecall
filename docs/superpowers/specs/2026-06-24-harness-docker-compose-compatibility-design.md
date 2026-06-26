# Harness Docker Compose Compatibility Design

## Goal

Make DeerRecall fully compatible with Harness-driven delivery for the current static MVP. The first deployment target is a single machine running Docker Compose. Harness Open Source is the primary target, while the project structure should stay portable enough to migrate to Harness SaaS later.

## Current Project State

DeerRecall is a static frontend prototype:

- `index.html` is the browser entry point.
- `styles.css` contains the visual system.
- `app.js` contains local interactions and seeded data.
- `tests/homepage-structure.test.js` uses Node's built-in test runner.
- There is no `package.json`, Dockerfile, Compose file, CI config, server code, backend API, database, or model service.
- The current directory is not a git repository. Harness repository triggers require the project to be imported into Harness, GitHub, or initialized as a git repository.

## Deployment Target

Use Docker Compose on a single host.

The deployed app should run as an Nginx container serving built static assets from `dist/`. The default local endpoint should be `http://localhost:8080`, with the public port configurable through an environment variable.

## Recommended Approach

Create a standard static delivery shape:

- Add npm scripts for test, build, clean, and local static serving.
- Build all runtime assets into `dist/`.
- Build a small Nginx image from `dist/`.
- Deploy the image with Docker Compose.
- Add a Harness pipeline that tests, builds, builds the image, deploys through Compose, and performs a health check.

## Files To Add

### `package.json`

Defines stable commands for local use and Harness:

- `npm test`: run `node --test tests/homepage-structure.test.js`.
- `npm run clean`: remove `dist/`.
- `npm run build`: create a production static artifact in `dist/`.
- `npm run serve`: serve `dist/` locally for smoke testing.

No runtime framework should be introduced. The project should remain plain HTML, CSS, and JavaScript.

### `scripts/build-static.mjs`

Creates `dist/` and copies runtime/static reference assets:

- `index.html`
- `app.js`
- `styles.css`
- `demos/`
- `finalized/`

It should exclude development-only directories such as `.playwright-cli`, `output`, `docs`, `tests`, and `参考图`.

### `Dockerfile`

Uses Nginx to serve `dist/`.

The image should:

- Copy `dist/` into Nginx's HTML root.
- Copy a project-specific Nginx config.
- Expose port `80`.
- Avoid rebuilding application assets inside the runtime image. Harness or local users run `npm run build` before `docker build`.

### `nginx.conf`

Serves the static app with:

- `index.html` fallback.
- Long cache headers for CSS and JS.
- No cache for HTML.
- Basic health endpoint behavior by allowing `GET /` to return `200`.

### `docker-compose.yml`

Defines one service:

- Service name: `deerrecall`.
- Container name: configurable or fixed as `deerrecall`.
- Image: configurable with `DEERRECALL_IMAGE`, defaulting to a local image name.
- Port mapping: `${DEERRECALL_PORT:-8080}:80`.
- Restart policy: `unless-stopped`.

### `.env.example`

Documents local deployment variables:

- `DEERRECALL_IMAGE=deerrecall:local`
- `DEERRECALL_PORT=8080`

### `.dockerignore`

Keeps Docker build context small and avoids copying local/generated files:

- `.git`
- `.DS_Store`
- `.playwright-cli`
- `docs`
- `output`
- `tests`
- `node_modules`
- `dist` only if the Dockerfile is changed to build assets internally. For this design, do not ignore `dist` because the runtime image consumes it.

### `.gitignore`

Ignores local/generated artifacts:

- `node_modules/`
- `dist/`
- `.env`
- `.DS_Store`
- `.playwright-cli/`
- `output/`

### `.harness/deerrecall-ci-cd.yaml`

Defines the Harness Open Source pipeline:

1. Test stage: run `npm test` in a Node container.
2. Build stage: run `npm run build`.
3. Image stage: build the Docker image.
4. Deploy stage: run `docker compose up -d` using the built image.
5. Verify stage: run `curl --fail http://localhost:${DEERRECALL_PORT:-8080}/`.

The pipeline should use standard Harness pipeline YAML and avoid SaaS-only features where possible.

### `README.md`

Documents:

- Project purpose and current static-MVP scope.
- Local test/build commands.
- Local Docker Compose deployment.
- Harness Open Source setup.
- Required Docker socket access for Harness deployments.
- Deployment variables and rollback notes.

## Harness Pipeline Behavior

The pipeline should be designed around this flow:

```text
source -> npm test -> npm run build -> docker build -> docker compose up -d -> curl health check
```

If tests or build fail, deployment must not run. If deployment or health check fails, the pipeline should fail and print container logs.

## Docker Compose Deployment Behavior

The target host must have:

- Docker installed.
- Docker Compose plugin available through `docker compose`.
- Port `DEERRECALL_PORT` free.
- Access to the repository checkout and generated `dist/`.

For Harness Open Source running locally, the Harness container must be started with Docker socket access so pipeline steps can build and run containers.

## Error Handling

- Missing `dist/`: Docker build should fail clearly. The README should instruct users to run `npm run build`.
- Port conflict: Compose should fail and surface Docker's port allocation error.
- Health check failure: pipeline should run `docker compose ps` and `docker compose logs --tail=100 deerrecall`.
- Missing Docker socket in Harness: README should point out the required `/var/run/docker.sock` mount.

## Testing

Minimum verification after implementation:

- `npm test`
- `npm run build`
- `docker build -t deerrecall:local .`
- `DEERRECALL_IMAGE=deerrecall:local DEERRECALL_PORT=8080 docker compose up -d`
- `curl --fail http://localhost:8080/`
- `docker compose down`

Optional visual verification can be added later with Playwright screenshots, but it is not required for the first Harness compatibility pass.

## Out Of Scope

- Kubernetes deployment.
- Object storage or CDN deployment.
- Backend API, database, resume parsing service, or AI model integration.
- Harness SaaS-specific connectors, secrets, environments, or approvals.
- Multi-environment promotion.

## Open Assumptions

- The initial deployment runs on the same single host where Docker is available.
- The app remains static for this compatibility pass.
- A real git remote will be configured separately before Harness trigger automation is expected to work.
