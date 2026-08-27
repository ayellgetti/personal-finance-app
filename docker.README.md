
docker compose --env-file .env.prod -f docker-compose.dev.yml up -d --build


docker compose --env-file .env.dev -f docker-compose.dev.yml up -d web



docker compose --env-file .env.dev -f docker-compose.dev.yml build --no-cache web

docker compose --env-file .env.dev -f docker-compose.dev.yml build --no-cache api





git pull && docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build api

git pull && docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build web

docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build

docker compose --env-file .env.prod -f docker-compose.prod.yml build --no-cache web

docker compose --env-file .env.prod -f docker-compose.prod.yml build --no-cache api