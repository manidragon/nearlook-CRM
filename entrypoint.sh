#!/bin/sh
set -e

TARGET_DATA_DIR="${DATA_DIR:-/app/data}"

mkdir -p "$TARGET_DATA_DIR"
chmod 777 "$TARGET_DATA_DIR" 2>/dev/null || true

# Initialize seed store on first volume mount if empty
if [ ! -f "$TARGET_DATA_DIR/crm_store.json" ] && [ -f "/app/seed-data/crm_store.json" ]; then
  echo "[Entrypoint] First run detected: Seeding initial CRM store into $TARGET_DATA_DIR/crm_store.json"
  cp "/app/seed-data/crm_store.json" "$TARGET_DATA_DIR/crm_store.json"
  chmod 666 "$TARGET_DATA_DIR/crm_store.json" 2>/dev/null || true
fi

exec "$@"
