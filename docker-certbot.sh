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
  -d myfinancefreedom.com \
  -d www.myfinancefreedom.com