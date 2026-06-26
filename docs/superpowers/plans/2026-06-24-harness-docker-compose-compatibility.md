# Harness Docker Compose Compatibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Add Harness-compatible CI/CD, static build, Docker image packaging, and Docker Compose deployment for the DeerRecall static MVP.

**Architecture:** Keep the app plain HTML/CSS/JavaScript and add a build layer that copies runtime assets into `dist/`. Serve `dist/` with a small Nginx image, deploy that image with Docker Compose, and provide a Harness Open Source pipeline that runs tests, builds assets, builds the image, deploys, and verifies the running container.

**Tech Stack:** Node built-in test runner, Node ESM build script, Nginx, Docker, Docker Compose, Harness Open Source pipeline YAML.

---

## File Structure

- Create `package.json`: standard local and Harness commands.
- Create `scripts/build-static.mjs`: static artifact builder.
- Modify `tests/homepage-structure.test.js`: add compatibility tests for package scripts, static build script, Dockerfile, Compose, Nginx, Harness YAML, ignore files, and README.
- Create `Dockerfile`: Nginx runtime image consuming `dist/`.
- Create `nginx.conf`: static serving and cache behavior.
- Create `docker-compose.yml`: single-host deployment service.
- Create `.env.example`: documented Compose variables.
- Create `.dockerignore`: Docker context exclusions while keeping `dist/` available.
- Create `.gitignore`: local/generated exclusions.
- Create `.harness/deerrecall-ci-cd.yaml`: Harness Open Source pipeline.
- Create `README.md`: local, Docker Compose, and Harness usage.

## Task 1: Compatibility Tests

**Files:**
- Modify: `tests/homepage-structure.test.js`

- [x] **Step 1: Add failing tests for the new delivery files**

Append this code to `tests/homepage-structure.test.js`:

```js
test("project exposes npm scripts for Harness-compatible static delivery", () => {
  const pkg = JSON.parse(read("package.json"));

  assert.equal(pkg.scripts.test, "node --test tests/homepage-structure.test.js");
  assert.equal(pkg.scripts.clean, "rm -rf dist");
  assert.equal(pkg.scripts.build, "node scripts/build-static.mjs");
  assert.equal(pkg.scripts.serve, "npx --yes http-server dist -p 8080");
});

test("static build script copies runtime assets and excludes development-only folders", () => {
  const script = read("scripts/build-static.mjs");

  assert.match(script, /const root = path\.resolve/);
  assert.match(script, /const dist = path\.join\(root, "dist"\)/);
  assert.match(script, /"index\.html"/);
  assert.match(script, /"app\.js"/);
  assert.match(script, /"styles\.css"/);
  assert.match(script, /"demos"/);
  assert.match(script, /"finalized"/);
  assert.match(script, /path\.basename\(src\) !== "\.DS_Store"/);
  assert.doesNotMatch(script, /"docs"/);
  assert.doesNotMatch(script, /"tests"/);
  assert.doesNotMatch(script, /"output"/);
});

test("docker runtime serves built dist assets with nginx", () => {
  const dockerfile = read("Dockerfile");
  const nginx = read("nginx.conf");

  assert.match(dockerfile, /ARG NGINX_IMAGE=nginx:1\.27-alpine/);
  assert.match(dockerfile, /FROM \$\{NGINX_IMAGE\}/);
  assert.match(dockerfile, /COPY nginx\.conf \/etc\/nginx\/conf\.d\/default\.conf/);
  assert.match(dockerfile, /COPY dist\/ \/usr\/share\/nginx\/html\//);
  assert.match(dockerfile, /EXPOSE 80/);

  assert.match(nginx, /listen 80/);
  assert.match(nginx, /try_files \$uri \$uri\/ \/index\.html/);
  assert.match(nginx, /location ~\* \\\.\(css\|js\)\$/);
  assert.match(nginx, /Cache-Control "no-store"/);
});

test("docker compose defines a single configurable DeerRecall service", () => {
  const compose = read("docker-compose.yml");
  const env = read(".env.example");

  assert.match(compose, /services:/);
  assert.match(compose, /deerrecall:/);
  assert.match(compose, /image: \$\{DEERRECALL_IMAGE:-deerrecall:local\}/);
  assert.match(compose, /container_name: \$\{DEERRECALL_CONTAINER:-deerrecall\}/);
  assert.match(compose, /"\$\{DEERRECALL_PORT:-8080\}:80"/);
  assert.match(compose, /restart: unless-stopped/);

  assert.match(env, /DEERRECALL_IMAGE=deerrecall:local/);
  assert.match(env, /DEERRECALL_PORT=8080/);
});

test("harness pipeline runs test, build, image, deploy, and verify stages", () => {
  const pipeline = read(".harness/deerrecall-ci-cd.yaml");

  assert.match(pipeline, /version: 1/);
  assert.match(pipeline, /kind: pipeline/);
  assert.match(pipeline, /name: test/);
  assert.match(pipeline, /npm test/);
  assert.match(pipeline, /name: build_static/);
  assert.match(pipeline, /npm run build/);
  assert.match(pipeline, /name: build_image/);
  assert.match(pipeline, /path: \/var\/run\/docker\.sock/);
  assert.match(pipeline, /mount:/);
  assert.match(pipeline, /docker build -t \$\{DEERRECALL_IMAGE:-deerrecall:local\} \./);
  assert.match(pipeline, /name: deploy_compose/);
  assert.match(pipeline, /docker compose up -d/);
  assert.match(pipeline, /name: verify_deploy/);
  assert.match(pipeline, /curl --fail "http:\/\/localhost:\$\{DEERRECALL_PORT:-8080\}\/"/);
});

test("ignore files keep generated and local-only content out of source and docker context", () => {
  const gitignore = read(".gitignore");
  const dockerignore = read(".dockerignore");

  assert.match(gitignore, /node_modules\//);
  assert.match(gitignore, /dist\//);
  assert.match(gitignore, /\.env/);
  assert.match(gitignore, /\.playwright-cli\//);
  assert.match(gitignore, /output\//);

  assert.match(dockerignore, /\.git/);
  assert.match(dockerignore, /node_modules/);
  assert.match(dockerignore, /docs/);
  assert.match(dockerignore, /tests/);
  assert.match(dockerignore, /output/);
  assert.doesNotMatch(dockerignore, /^dist$/m);
});

test("readme documents local, compose, and Harness workflows", () => {
  const readme = read("README.md");

  assert.match(readme, /npm test/);
  assert.match(readme, /npm run build/);
  assert.match(readme, /docker build -t deerrecall:local \./);
  assert.match(readme, /docker compose up -d/);
  assert.match(readme, /Harness Open Source/);
  assert.match(readme, /\/var\/run\/docker\.sock/);
  assert.match(readme, /DEERRECALL_PORT/);
  assert.match(readme, /docker compose logs --tail=100 deerrecall/);
});
```

- [x] **Step 2: Run tests to verify they fail because files do not exist**

Run:

```bash
node --test tests/homepage-structure.test.js
```

Expected: FAIL with `ENOENT` for `package.json` or another newly required file.

## Task 2: NPM Scripts And Static Builder

**Files:**
- Create: `package.json`
- Create: `scripts/build-static.mjs`

- [x] **Step 1: Create `package.json`**

Create `package.json` with:

```json
{
  "name": "deerrecall",
  "version": "0.1.0",
  "private": true,
  "description": "Static DeerRecall MVP prototype with Harness-compatible Docker Compose delivery.",
  "scripts": {
    "test": "node --test tests/homepage-structure.test.js",
    "clean": "rm -rf dist",
    "build": "node scripts/build-static.mjs",
    "serve": "npx --yes http-server dist -p 8080"
  },
  "engines": {
    "node": ">=20"
  }
}
```

- [x] **Step 2: Create `scripts/build-static.mjs`**

Create `scripts/build-static.mjs` with:

```js
import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");

const assets = [
  "index.html",
  "app.js",
  "styles.css",
  "demos",
  "finalized",
];

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

for (const asset of assets) {
  await cp(path.join(root, asset), path.join(dist, asset), {
    recursive: true,
    filter: (src) => path.basename(src) !== ".DS_Store",
  });
}

console.log(`Built DeerRecall static artifact at ${path.relative(root, dist)}`);
```

- [x] **Step 3: Run tests for the first green slice**

Run:

```bash
npm test
```

Expected: tests still fail because Docker, Compose, Harness, ignore, and README files are not created yet.

## Task 3: Docker Runtime And Compose Deployment

**Files:**
- Create: `Dockerfile`
- Create: `nginx.conf`
- Create: `docker-compose.yml`
- Create: `.env.example`

- [x] **Step 1: Create `Dockerfile`**

Create `Dockerfile` with:

```Dockerfile
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY dist/ /usr/share/nginx/html/

EXPOSE 80
```

- [x] **Step 2: Create `nginx.conf`**

Create `nginx.conf` with:

```nginx
server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;

  location ~* \.(css|js)$ {
    add_header Cache-Control "public, max-age=31536000, immutable";
    try_files $uri =404;
  }

  location / {
    add_header Cache-Control "no-store";
    try_files $uri $uri/ /index.html;
  }
}
```

- [x] **Step 3: Create `docker-compose.yml`**

Create `docker-compose.yml` with:

```yaml
services:
  deerrecall:
    image: ${DEERRECALL_IMAGE:-deerrecall:local}
    container_name: ${DEERRECALL_CONTAINER:-deerrecall}
    ports:
      - "${DEERRECALL_PORT:-8080}:80"
    restart: unless-stopped
```

- [x] **Step 4: Create `.env.example`**

Create `.env.example` with:

```dotenv
DEERRECALL_IMAGE=deerrecall:local
DEERRECALL_CONTAINER=deerrecall
DEERRECALL_PORT=8080
```

- [x] **Step 5: Run tests for the second green slice**

Run:

```bash
npm test
```

Expected: tests still fail because Harness YAML, ignore files, and README are not created yet.

## Task 4: Harness Pipeline And Ignore Files

**Files:**
- Create: `.harness/deerrecall-ci-cd.yaml`
- Create: `.dockerignore`
- Create: `.gitignore`

- [x] **Step 1: Create `.harness/deerrecall-ci-cd.yaml`**

Create `.harness/deerrecall-ci-cd.yaml` with:

```yaml
version: 1
kind: pipeline
spec:
  stages:
    - name: test
      type: ci
      spec:
        steps:
          - name: test
            type: run
            spec:
              container: node:20-alpine
              script: |-
                npm test

    - name: build_static
      type: ci
      spec:
        steps:
          - name: build_static
            type: run
            spec:
              container: node:20-alpine
              script: |-
                npm run build

    - name: deploy
      type: ci
      spec:
        steps:
          - name: build_image
            type: run
            spec:
              container: docker:27-cli
              script: |-
                docker build -t ${DEERRECALL_IMAGE:-deerrecall:local} .

          - name: deploy_compose
            type: run
            spec:
              container: docker:27-cli
              script: |-
                docker compose up -d

          - name: verify_deploy
            type: run
            spec:
              container: curlimages/curl:8.10.1
              script: |-
                curl --fail "http://localhost:${DEERRECALL_PORT:-8080}/"
```

- [x] **Step 2: Create `.dockerignore`**

Create `.dockerignore` with:

```dockerignore
.git
.DS_Store
.env
.playwright-cli
docs
node_modules
output
tests
参考图
```

- [x] **Step 3: Create `.gitignore`**

Create `.gitignore` with:

```gitignore
node_modules/
dist/
.env
.DS_Store
.playwright-cli/
output/
```

- [x] **Step 4: Run tests for the third green slice**

Run:

```bash
npm test
```

Expected: tests still fail because README is not created yet.

## Task 5: README Documentation

**Files:**
- Create: `README.md`

- [x] **Step 1: Create `README.md`**

Create `README.md` with:

```markdown
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
source -> npm test -> npm run build -> docker build -> docker compose up -d -> curl health check
```

Harness must run with access to the Docker socket for image builds and Docker Compose deployment. When running Harness Open Source locally, mount `/var/run/docker.sock` into the Harness container.

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
```

- [x] **Step 2: Run the full test suite**

Run:

```bash
npm test
```

Expected: PASS with all tests passing.

## Task 6: Build And Deployment Verification

**Files:**
- Generated: `dist/`

- [x] **Step 1: Build static artifact**

Run:

```bash
npm run build
```

Expected: exit 0 and output `Built DeerRecall static artifact at dist`.

- [x] **Step 2: Verify expected files exist in `dist/`**

Run:

```bash
test -f dist/index.html && test -f dist/app.js && test -f dist/styles.css && test -d dist/demos && test -d dist/finalized
```

Expected: exit 0.

- [x] **Step 3: Build Docker image**

Run:

```bash
docker build -t deerrecall:local .
```

Expected: exit 0 and Docker reports the image was built/tagged.

- [x] **Step 4: Deploy with Docker Compose**

Run:

```bash
DEERRECALL_IMAGE=deerrecall:local DEERRECALL_PORT=8080 docker compose up -d
```

Expected: exit 0 and the `deerrecall` service starts.

- [x] **Step 5: Run health check**

Run:

```bash
curl --fail http://localhost:8080/
```

Expected: exit 0 and HTML output containing `DeerRecall - AI 人才库`.

- [x] **Step 6: Tear down local deployment**

Run:

```bash
docker compose down
```

Expected: exit 0 and the `deerrecall` container is removed.

## Task 7: Final Review

**Files:**
- Review all created and modified files.

- [x] **Step 1: Run final verification**

Run:

```bash
npm test && npm run build
```

Expected: exit 0.

- [x] **Step 2: Check repository status if git exists**

Run:

```bash
git status --short
```

Expected: If this is not a git repository, report that git status is unavailable. If it is a git repository, report the changed files without reverting unrelated work.

- [x] **Step 3: Commit if git exists**

Run only if this directory is a git repository:

```bash
git add package.json scripts/build-static.mjs Dockerfile nginx.conf docker-compose.yml .env.example .dockerignore .gitignore .harness/deerrecall-ci-cd.yaml README.md tests/homepage-structure.test.js docs/superpowers/plans/2026-06-24-harness-docker-compose-compatibility.md docs/superpowers/specs/2026-06-24-harness-docker-compose-compatibility-design.md
git commit -m "feat: add Harness Docker Compose delivery"
```

Expected: commit succeeds. If this directory is not a git repository, skip this step and report that no commit was made.
