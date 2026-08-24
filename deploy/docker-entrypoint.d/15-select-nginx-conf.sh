#!/bin/sh
set -e

AVAILABLE=/etc/nginx/conf.available
DEST=/etc/nginx/conf.d/default.conf
DOMAIN="${TLS_DOMAIN:-}"
WWW="${TLS_WWW_DOMAIN:-}"

if [ -n "${DOMAIN}" ] && [ -z "${WWW}" ]; then
    WWW="www.${DOMAIN}"
fi

render() {
    sed -e "s|__TLS_DOMAIN__|${DOMAIN}|g" -e "s|__TLS_WWW_DOMAIN__|${WWW}|g" "$1" > "${DEST}"
}

CERT="/etc/letsencrypt/live/${DOMAIN}/fullchain.pem"
KEY="/etc/letsencrypt/live/${DOMAIN}/privkey.pem"

use_tls=0
if [ -n "${DOMAIN}" ] && [ -s "${CERT}" ] && [ -s "${KEY}" ]; then
    render "${AVAILABLE}/tls.conf"
    if nginx -t; then
        use_tls=1
        echo "nginx: TLS enabled for ${DOMAIN}"
    else
        echo "nginx: TLS config failed (certs present but unusable); serving HTTP" >&2
        render "${AVAILABLE}/http.conf"
    fi
fi

if [ "${use_tls}" -eq 0 ]; then
    render "${AVAILABLE}/http.conf"
    echo "nginx: HTTP config (TLS_DOMAIN=${DOMAIN:-empty})"
fi

nginx -t
