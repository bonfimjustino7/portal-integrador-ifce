#!/usr/bin/env sh
set -eu

lua /kong/render-kong-config.lua

exec /docker-entrypoint.sh "$@"
