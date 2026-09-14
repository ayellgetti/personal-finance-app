#!/bin/sh
# Issue or expand a single Let's Encrypt cert (one lineage, many SANs)
# for nginx.prod.conf. HTTP-01 needs nginx serving
# /.well-known/acme-challenge/ from containers/certbot/www, and each
# name must resolve to this host.
#
# Usage:
#   ./docker-certbot.sh
#   ./docker-certbot.sh staging.myfinancefreedom.com
#   ./docker-certbot.sh --force
#   ./docker-certbot.sh --force new.myfinancefreedom.com
#
# Certbot skips with "not yet due for renewal" when the name list is
# unchanged and the cert is still valid. That is expected. Pass a new
# hostname (or --force) to re-issue / expand the same certificate.

set -e

cert_name="myfinancefreedom.com"
force=0

# Keep these in sync with HTTPS server_name values in nginx.prod.conf.
domains="
  myfinancefreedom.com
  www.myfinancefreedom.com
  api.myfinancefreedom.com
  web.myfinancefreedom.com
  crm.myfinancefreedom.com
"

for arg in "$@"; do
  case "${arg}" in
    --force|-f)
      force=1
      ;;
    -*)
      echo "Unknown option: ${arg}" >&2
      echo "Usage: $0 [--force] [extra.subdomain.example.com ...]" >&2
      exit 1
      ;;
    *)
      domains="${domains}
  ${arg}"
      force=1
      ;;
  esac
done

domain_flags=""
echo "Certificate ${cert_name} will cover:"
# shellcheck disable=SC2086
for name in ${domains}; do
  echo "  - ${name}"
  domain_flags="${domain_flags} -d ${name}"
done

force_flags=""
if [ "${force}" -eq 1 ]; then
  force_flags="--force-renewal"
  echo "Re-issuing (expand / --force-renewal) so new names are added now."
fi

# --expand keeps one cert and adds SANs instead of creating a second lineage.
# --force-renewal is required when names change but the existing cert is
# not close to expiry; otherwise certbot exits with "not yet due".
# shellcheck disable=SC2086
docker run --rm \
  -v "$(pwd)/containers/certbot/letsencrypt:/etc/letsencrypt" \
  -v "$(pwd)/containers/certbot/www:/var/www/certbot" \
  certbot/certbot:latest \
  certonly \
  --webroot \
  -w /var/www/certbot \
  --email ayellgetti@gmail.com \
  --agree-tos \
  --no-eff-email \
  --non-interactive \
  --expand \
  --cert-name "${cert_name}" \
  ${force_flags} \
  ${domain_flags}
