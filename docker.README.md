# Compose command reference

Both compose files build a service named `web`. Without `-p`, Compose derives the
project name from this directory (`example`) and tags the built image
`example-web` in both cases — but `docker-compose.dev.yml` builds
`apps/web/Dockerfile` (Vite dev server on 8080) while `docker-compose.prod.yml`
builds `apps/web/Dockerfile.prod` (nginx serving a static build on 80).

So a prod build run here silently overwrites the dev image. The dev stack then
starts a container that never listens on 8080, its healthcheck fails, and
`docker-nginx` never starts because it depends on `web` being healthy — which
takes down `local.uat`, `www.local.uat`, and `web.local.uat`.

Always pass `-p` for prod commands, and rebuild the dev image if the two ever
get crossed:

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml build web
docker compose --env-file .env.dev -f docker-compose.dev.yml up -d --force-recreate web
```

Pair `.env.dev` with `docker-compose.dev.yml` and `.env.prod` with
`docker-compose.prod.yml`. Do not mix them.

## Dev

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml up -d --build

docker compose --env-file .env.dev -f docker-compose.dev.yml up -d web

docker compose --env-file .env.dev -f docker-compose.dev.yml build --no-cache web api

docker compose --env-file .env.dev -f docker-compose.dev.yml build --no-cache nginx api web
```

## Prod

Port 80 allows one listener, so stop the dev stack before starting prod locally.

```bash
git pull && docker compose -p personal-finance-prod --env-file .env.prod -f docker-compose.prod.yml up -d --build api web

git pull && docker compose -p personal-finance-prod --env-file .env.prod -f docker-compose.prod.yml up -d --build web

docker compose -p personal-finance-prod --env-file .env.prod -f docker-compose.prod.yml up -d --build

docker compose -p personal-finance-prod --env-file .env.prod -f docker-compose.prod.yml build --no-cache web api nginx

docker compose -p personal-finance-prod stop
```
