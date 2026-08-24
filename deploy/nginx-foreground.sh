#!/bin/sh
set -e

# Official nginx only runs /docker-entrypoint.d when argv[1] is "nginx".
# This image's CMD is this script, so select HTTP vs TLS here.
if [ -x /docker-entrypoint.d/15-select-nginx-conf.sh ]; then
    /docker-entrypoint.d/15-select-nginx-conf.sh
fi

# Reload so renewed Let's Encrypt files are picked up without a deploy.
(
    while true; do
        sleep 43200
        nginx -s reload >/dev/null 2>&1 || true
    done
) &

exec nginx -g "daemon off;"
