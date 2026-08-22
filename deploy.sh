#!/usr/bin/env bash

### ==============================================================================
### Script Name: deploy.sh
### Description: First-time and repeat production deploy on AWS (Debian/Ubuntu EC2).
###              Creates .env.prod, fills origin/secrets, then builds and starts
###              docker-compose.prod.yml. Local development still uses docker-compose.yml.
### ==============================================================================

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${ROOT}"

ENV_FILE="${ROOT}/.env.prod"
COMPOSE_FILE="${ROOT}/docker-compose.prod.yml"
INSTALL_DOCKER=0
NO_BUILD=0
ORIGIN_OVERRIDE=""
PORT_OVERRIDE=""

usage() {
  cat <<'EOF'
Usage: ./deploy.sh [options]

Prepares .env.prod (from .env.prod.example if missing), fills PUBLIC_ORIGIN from
EC2 metadata when it is still a placeholder, generates alphanumeric Postgres and
JWT secrets when they are still the example values, then runs:

  docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build

Options:
  --install-docker   Run docker-setup.sh first (Debian/Ubuntu). Then log out and
                     back in before deploying if this is the first Docker install.
  --origin URL       Set PUBLIC_ORIGIN (no trailing slash), e.g. http://13.x.x.x
  --port N           Set PUBLIC_PORT (default 80)
  --no-build         Recreate containers without rebuilding images
  -h, --help         Show this help

Existing real secrets in .env.prod are never overwritten. Optional keys such as
OPENAI_API_KEY are left for you to edit in .env.prod.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --install-docker) INSTALL_DOCKER=1; shift ;;
    --no-build) NO_BUILD=1; shift ;;
    --origin)
      ORIGIN_OVERRIDE="${2:-}"
      [[ -n "${ORIGIN_OVERRIDE}" ]] || { echo "--origin requires a URL" >&2; exit 1; }
      shift 2
      ;;
    --port)
      PORT_OVERRIDE="${2:-}"
      [[ -n "${PORT_OVERRIDE}" ]] || { echo "--port requires a number" >&2; exit 1; }
      shift 2
      ;;
    -h|--help) usage; exit 0 ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

log() { echo "--> $*"; }
die() { echo "ERROR: $*" >&2; exit 1; }

env_get() {
  local key="$1"
  awk -v k="${key}" 'index($0, k "=") == 1 { print substr($0, length(k) + 2); exit }' "${ENV_FILE}"
}

env_set() {
  local key="$1" value="$2" tmp
  tmp="$(mktemp)"
  awk -v k="${key}" -v v="${value}" '
    index($0, k "=") == 1 { print k "=" v; found = 1; next }
    { print }
    END { if (!found) print k "=" v }
  ' "${ENV_FILE}" > "${tmp}"
  mv "${tmp}" "${ENV_FILE}"
}

is_placeholder() {
  local value="$1"
  case "${value}" in
    ""|replace-with-*|REPLACE_WITH_*) return 0 ;;
    *) return 1 ;;
  esac
}

alphanumeric_secret() {
  # DATABASE_URL interpolates POSTGRES_PASSWORD; keep it URL-safe.
  openssl rand -hex 16
}

hex_secret() {
  openssl rand -hex 32
}

detect_public_ip() {
  local token="" ip=""
  token="$(curl -fsS -m 2 -X PUT "http://169.254.169.254/latest/api/token" \
    -H "X-aws-ec2-metadata-token-ttl-seconds: 60" 2>/dev/null || true)"
  if [[ -n "${token}" ]]; then
    ip="$(curl -fsS -m 2 -H "X-aws-ec2-metadata-token: ${token}" \
      "http://169.254.169.254/latest/meta-data/public-ipv4" 2>/dev/null || true)"
  fi
  if [[ -z "${ip}" ]]; then
    ip="$(curl -fsS -m 3 https://checkip.amazonaws.com 2>/dev/null | tr -d '[:space:]' || true)"
  fi
  printf '%s' "${ip}"
}

normalize_origin() {
  local origin="$1"
  origin="${origin%/}"
  case "${origin}" in
    http://*|https://*) ;;
    *) origin="http://${origin}" ;;
  esac
  printf '%s' "${origin}"
}

require_docker() {
  command -v docker >/dev/null 2>&1 || die "Docker is not installed. Run ./docker-setup.sh or ./deploy.sh --install-docker"
  docker info >/dev/null 2>&1 || die "Cannot talk to the Docker daemon. Log out and back in after docker-setup.sh so the docker group applies, then retry."
  docker compose version >/dev/null 2>&1 || die "Docker Compose plugin is missing. Re-run ./docker-setup.sh"
}

echo "========================================="
echo " Production deploy"
echo "========================================="

if [[ "${INSTALL_DOCKER}" -eq 1 ]]; then
  [[ -x "${ROOT}/docker-setup.sh" ]] || die "docker-setup.sh not found or not executable"
  log "Installing Docker Engine..."
  "${ROOT}/docker-setup.sh"
  echo
  echo "If this was the first install, log out of SSH and back in, then run ./deploy.sh again."
  echo
fi

require_docker
command -v openssl >/dev/null 2>&1 || die "openssl is required to generate secrets"
command -v curl >/dev/null 2>&1 || die "curl is required to detect the public IP and check /health"

[[ -f "${ROOT}/.env.prod.example" ]] || die ".env.prod.example is missing"
[[ -f "${COMPOSE_FILE}" ]] || die "docker-compose.prod.yml is missing"

if [[ ! -f "${ENV_FILE}" ]]; then
  log "Creating .env.prod from .env.prod.example"
  cp "${ROOT}/.env.prod.example" "${ENV_FILE}"
fi
chmod 600 "${ENV_FILE}"

if [[ -n "${ORIGIN_OVERRIDE}" ]]; then
  env_set PUBLIC_ORIGIN "$(normalize_origin "${ORIGIN_OVERRIDE}")"
elif is_placeholder "$(env_get PUBLIC_ORIGIN)"; then
  detected="$(detect_public_ip)"
  [[ -n "${detected}" ]] || die "Could not detect a public IP. Pass --origin http://YOUR_ELASTIC_IP"
  env_set PUBLIC_ORIGIN "$(normalize_origin "${detected}")"
  log "Set PUBLIC_ORIGIN to $(env_get PUBLIC_ORIGIN)"
fi

if [[ -n "${PORT_OVERRIDE}" ]]; then
  env_set PUBLIC_PORT "${PORT_OVERRIDE}"
fi

if is_placeholder "$(env_get POSTGRES_PASSWORD)"; then
  env_set POSTGRES_PASSWORD "$(alphanumeric_secret)"
  log "Generated POSTGRES_PASSWORD"
fi

if is_placeholder "$(env_get JWT_ACCESS_SECRET)"; then
  env_set JWT_ACCESS_SECRET "$(hex_secret)"
  log "Generated JWT_ACCESS_SECRET"
fi

if is_placeholder "$(env_get JWT_REFRESH_SECRET)"; then
  env_set JWT_REFRESH_SECRET "$(hex_secret)"
  log "Generated JWT_REFRESH_SECRET"
fi

PUBLIC_ORIGIN="$(env_get PUBLIC_ORIGIN)"
PUBLIC_PORT="$(env_get PUBLIC_PORT)"
PUBLIC_PORT="${PUBLIC_PORT:-80}"
POSTGRES_PASSWORD="$(env_get POSTGRES_PASSWORD)"
JWT_ACCESS_SECRET="$(env_get JWT_ACCESS_SECRET)"
JWT_REFRESH_SECRET="$(env_get JWT_REFRESH_SECRET)"

[[ "${#JWT_ACCESS_SECRET}" -ge 16 ]] || die "JWT_ACCESS_SECRET must be at least 16 characters"
[[ "${#JWT_REFRESH_SECRET}" -ge 16 ]] || die "JWT_REFRESH_SECRET must be at least 16 characters"
[[ "${JWT_ACCESS_SECRET}" != "${JWT_REFRESH_SECRET}" ]] || die "JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must differ"
[[ "${POSTGRES_PASSWORD}" =~ ^[A-Za-z0-9]+$ ]] || die "POSTGRES_PASSWORD must be alphanumeric so DATABASE_URL stays valid"
case "${PUBLIC_ORIGIN}" in
  http://*|https://*) ;;
  *) die "PUBLIC_ORIGIN must start with http:// or https://" ;;
esac
[[ "${PUBLIC_ORIGIN}" != */ ]] || die "PUBLIC_ORIGIN must not have a trailing slash"

compose() {
  docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" "$@"
}

if [[ "${NO_BUILD}" -eq 1 ]]; then
  log "Starting stack without rebuild..."
  compose up -d
else
  log "Building and starting the production stack (this can take several minutes)..."
  compose up -d --build
fi

health_url="http://127.0.0.1:${PUBLIC_PORT}/health"
log "Waiting for ${health_url} ..."
ready=0
for _ in {1..60}; do
  if curl -fsS -m 2 "${health_url}" >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 2
done

echo "========================================="
if [[ "${ready}" -eq 1 ]]; then
  echo " Deploy finished."
else
  echo " Containers are up, but /health did not respond yet."
  echo " Check: docker compose -f docker-compose.prod.yml logs -f api web"
fi
echo " App:    ${PUBLIC_ORIGIN}/"
echo " Health: ${PUBLIC_ORIGIN}/health"
echo " Env:    ${ENV_FILE} (not committed; add OPENAI_API_KEY there if you use the advisor)"
echo "========================================="
echo "Security group must allow 22 (your IP) and ${PUBLIC_PORT} (0.0.0.0/0)."
echo "Do not open 5432, 6379, or 5001."
echo "========================================="
