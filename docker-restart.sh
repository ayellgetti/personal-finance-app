#!/usr/bin/env bash
# Rebuild and restart the production stack on the AWS host.
#
# Builds run one service at a time, and the build cache is pruned after each
# one. A parallel --no-cache build of all six images filled a 23G root volume,
# so keep builds sequential and check free space before each build.

COMPOSE="docker compose -p personal-finance-prod --env-file .env.prod -f docker-compose.prod.yml"
MIN_FREE_GB=5

free_gb() {
  df --output=avail -BG / | tail -1 | tr -dc '0-9'
}

$COMPOSE down

docker rm -f $(docker ps -aq) 2>/dev/null

# Restart clears build-cache entries left "ACTIVE" by an interrupted build.
sudo systemctl restart docker

# unused images, build cache, stopped containers — keeps named volumes
docker builder prune -af
docker image prune -af
docker container prune -f
docker system prune -af

df -h /

for svc in api web website crm mobile mobile-fp; do
  if [ "$(free_gb)" -lt "$MIN_FREE_GB" ]; then
    echo "Only $(free_gb)G free on /, need ${MIN_FREE_GB}G before building $svc. Free space and rerun." >&2
    exit 1
  fi
  $COMPOSE build --no-cache "$svc" || exit 1
  docker builder prune -af
  df -h /
done

$COMPOSE up -d
