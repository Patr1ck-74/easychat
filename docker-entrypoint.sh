#!/bin/sh
set -eu

DATA_DIR="${DATA_DIR:-/data}"

if [ "$(id -u)" = "0" ]; then
  mkdir -p "$DATA_DIR"
  if ! chown -R node:node "$DATA_DIR" 2>/dev/null; then
    echo "[ENTRYPOINT_WARN] Unable to chown $DATA_DIR; mounted directory may not be writable by node" >&2
  fi
  exec su-exec node "$@"
fi

exec "$@"