#!/bin/sh
set -eu

flag=false
case "${VITE_OTP_AUTO_VERIFY:-false}" in
  true|TRUE|True|1|yes|YES) flag=true ;;
esac

printf 'window.__APP_CONFIG__={OTP_AUTO_VERIFY:%s};\n' "$flag" > /usr/share/nginx/html/env.js

exec nginx -g "daemon off;"
