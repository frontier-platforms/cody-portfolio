#!/bin/sh
# MinIO's base image has no built-in "auto-create this bucket on startup" option -
# this script is what actually does it, as the container's entrypoint: start the
# server, wait for it to accept admin connections, then create whatever buckets
# MINIO_DEFAULT_BUCKETS lists and set a short expiry on their contents (query-result
# cache and exported chart images don't need to accumulate forever).
set -e

minio server /data --console-address ":9001" &

until mc alias set local http://localhost:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" >/dev/null 2>&1; do
  sleep 1
done

expiration_days="${MINIO_EXPIRATION_DAYS:-1}"

IFS=','
for bucket in $MINIO_DEFAULT_BUCKETS; do
  [ -z "$bucket" ] && continue

  mc mb -p "local/$bucket" || echo "bucket $bucket already exists, continuing"

  mc ilm rule rm --all --force "local/$bucket" >/dev/null 2>&1 || true
  if [ "$expiration_days" -gt 0 ] 2>/dev/null; then
    mc ilm rule add --expire-days "$expiration_days" "local/$bucket"
  fi
  # No CORS rule here - this MinIO build rejects the ExposeHeader directive
  # ("functionality not implemented"), and it's not needed anyway: Lightdash's backend
  # talks to MinIO server-side, not from the browser directly, so there's no
  # cross-origin request to configure for.
done

wait
