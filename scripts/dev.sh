#!/bin/sh
# Run dev server with increased file limit to avoid EMFILE 404s on macOS
ulimit -n 10240 2>/dev/null
exec npx next dev "$@"
