#!/bin/sh
# Idempotent extra databases for isolated CRM Compose instances.
# docker-entrypoint-initdb.d only runs on an empty volume, so this script is
# also started as a one-shot service against an existing postgres_data dir.
set -eu

: "${POSTGRES_USER:?POSTGRES_USER is required}"
: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}"
: "${POSTGRES_TRAVEL_CRM_DB:?POSTGRES_TRAVEL_CRM_DB is required}"
: "${POSTGRES_BANQUE_CRM_DB:?POSTGRES_BANQUE_CRM_DB is required}"

export PGPASSWORD="${POSTGRES_PASSWORD}"

create_db_if_missing() {
  name="$1"
  exists="$(psql -h postgres -U "${POSTGRES_USER}" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='${name}'")"
  if [ "${exists}" = "1" ]; then
    echo "database ${name} already exists"
    return
  fi
  echo "creating database ${name}"
  psql -h postgres -U "${POSTGRES_USER}" -d postgres -c "CREATE DATABASE \"${name}\";"
}

create_db_if_missing "${POSTGRES_TRAVEL_CRM_DB}"
create_db_if_missing "${POSTGRES_BANQUE_CRM_DB}"
