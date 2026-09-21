docker compose -p personal-finance-prod --env-file .env.prod -f docker-compose.prod.yml down

docker rm -f $(docker ps -aq)

# unused images, build cache, stopped containers — keeps named volumes
docker builder prune -af
docker image prune -af
docker container prune -f
docker system prune -af

docker compose -p personal-finance-prod --env-file .env.prod -f docker-compose.prod.yml build --no-cache nginx api web website


docker compose -p personal-finance-prod --env-file .env.prod -f docker-compose.prod.yml up -d