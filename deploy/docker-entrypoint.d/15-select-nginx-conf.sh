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

if [ -n "${DOMAIN}" ] && [ -f "${CERT}" ] && [ -f "${KEY}" ]; then
    render "${AVAILABLE}/tls.conf"
else
    render "${AVAILABLE}/http.conf"
fi

nginx -t
