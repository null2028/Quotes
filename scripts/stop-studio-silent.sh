#!/bin/bash
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin:${PATH:-}"

PIDS_3300=$(lsof -iTCP:3300 -sTCP:LISTEN -t 2>/dev/null || true)
PIDS_3301=$(lsof -iTCP:3301 -sTCP:LISTEN -t 2>/dev/null || true)

if [ -n "$PIDS_3300" ]; then
  kill -TERM $PIDS_3300 2>/dev/null || true
fi

if [ -n "$PIDS_3301" ]; then
  kill -TERM $PIDS_3301 2>/dev/null || true
fi

exit 0
