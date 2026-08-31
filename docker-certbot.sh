#!/bin/sh
# Issue or expand a single Let's Encrypt cert for nginx.prod.conf.
# HTTP-01 needs nginx serving /.well-known/acme-challenge/ from
# containers/certbot/www, and each -d name must resolve to this host.
set -e

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
  --cert-name myfinancefreedom.com \
  -d myfinancefreedom.com \
  -d www.myfinancefreedom.com \
  -d api.myfinancefreedom.com \
  -d web.myfinancefreedom.com
