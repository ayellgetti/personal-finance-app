#!/bin/sh
set -e

# Reload so renewed Let's Encrypt files are picked up without a deploy.
(
    while true; do
        sleep 43200
        nginx -s reload >/dev/null 2>&1 || true
    done
) &

exec nginx -g "daemon off;"
