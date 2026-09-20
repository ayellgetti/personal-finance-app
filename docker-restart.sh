docker compose -p personal-finance-prod --env-file .env.prod -f docker-compose.prod.yml down

docker compose -p personal-finance-prod --env-file .env.prod -f docker-compose.prod.yml build --no-cache nginx api web website


docker compose -p personal-finance-prod --env-file .env.prod -f docker-compose.prod.yml up -d