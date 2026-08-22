# Deploy on AWS EC2

`docker-compose.yml` is the **local** stack: Vite on port 5173, source bind mounts, pgAdmin, Redis Insight, and localhost CORS. Do not use that file on a public host.

AWS uses `docker-compose.prod.yml`. Nginx listens on port **80**, serves the built React app, and proxies `/api` (and `/health`) to the API container. Postgres, Redis, and the API are not published.

That file declares its own Compose project (`personal-finance-prod`), so its images, containers, and data volumes never collide with the local stack.

Nginx serves only what the browser needs. Express also mounts `/docs`, `/docs.json`, and `/planner(.html)`; those are deliberately not proxied, so they return the SPA's not-found page. Reach Swagger through an SSH tunnel instead:

```bash
ssh -L 5001:localhost:5001 user@host   # then use docker exec / a temporary port publish
```

## 1. EC2

- Ubuntu or Debian, x86_64 or ARM (match the instance).
- Security group inbound: **22** (your IP), **80** (0.0.0.0/0). Do not open 5432, 5433, 6379, 5001, 5050, or 5173.
- Allocate an Elastic IP if you want a stable address.

Install Docker with `docker-setup.sh` (Debian/Ubuntu). Log out and back in so the `docker` group applies. First-time hosts can use `./deploy.sh --install-docker` instead, then SSH again and run `./deploy.sh`.

## 2. App files and start

```bash
git clone <this-repo> personal-finance-app
cd personal-finance-app
chmod +x deploy.sh docker-setup.sh
./deploy.sh
```

`deploy.sh` copies `.env.prod.example` to `.env.prod` if needed, sets `PUBLIC_ORIGIN` from the instance public IP when that value is still a placeholder, generates `POSTGRES_PASSWORD` / JWT secrets when they are still the example strings, then runs `docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build`. Existing real secrets are left alone.

Optional flags: `--origin https://your.domain`, `--port 80`, `--no-build`. Edit `.env.prod` yourself for `OPENAI_API_KEY` and SMTP/Twilio.

`deploy.sh` stops before building if `PUBLIC_PORT` is already bound by something other than this stack's own web container. On a development machine that is usually nginx from the local `docker-compose.yml`; stop it (`docker compose -f docker-compose.yml stop nginx`) or deploy on another port with `--port 8080 --origin http://localhost:8080`.

Open `http://<public-ip>/`. Health: `http://<public-ip>/health`.

Rebuild after API or web changes:

```bash
./deploy.sh
```

Logs: `docker compose -f docker-compose.prod.yml logs -f api web`.

## 3. HTTPS (optional)

Put a domain on the Elastic IP, then terminate TLS with a host nginx/Caddy, an ALB, or Certbot in front of this Compose stack. Set `PUBLIC_ORIGIN` to `https://your.domain` and recreate the API container so CORS matches.

## Why the local Compose file fails on AWS

| Local `docker-compose.yml` | Production |
| --- | --- |
| Vite `pnpm dev` on 5173 | nginx + `vite build` on 80 |
| Bind-mounts source for HMR | Image contains the built `dist` |
| `CORS_ORIGIN=http://localhost:5173` | `CORS_ORIGIN=$PUBLIC_ORIGIN` |
| Postgres/Redis/pgAdmin published | Only port 80 published |
| `NODE_ENV=development` | `NODE_ENV=production` |

## Caching and container restarts

`deploy/nginx.conf` handles two things that break naive SPA deploys:

- `index.html` is served `no-store` while `/assets/*` (hashed by Vite) is `immutable` for a year. Without this, browsers keep loading the previous deploy's JavaScript.
- The `/api` proxy resolves the `api` hostname through Docker's DNS (`127.0.0.11`) with a variable in `proxy_pass`, so rebuilding the API container does not leave nginx pinned to a dead IP. Verified: the API moved to a new address mid-flight and nginx kept serving without a reload.
