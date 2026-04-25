#!/usr/bin/env bash
# PostToolUse hook: format + lint edited files
# Detects which sub-project the file belongs to and runs appropriate tooling.
set -euo pipefail

# FILE_PATH is set by the hook system; fall back to $1 if passed manually
FILE_PATH="${FILE_PATH:-}"

# Skip if no file path
if [[ -z "$FILE_PATH" ]]; then
  exit 0
fi

# Resolve absolute path
if [[ ! "$FILE_PATH" = /* ]]; then
  FILE_PATH="$(cd "$(dirname "$FILE_PATH")" && pwd)/$(basename "$FILE_PATH")"
fi

# Detect sub-project
PROJECT_ROOT="$(dirname "$FILE_PATH")"
while [[ "$PROJECT_ROOT" != "/" ]]; do
  if [[ -f "$PROJECT_ROOT/package.json" ]]; then
    break
  fi
  PROJECT_ROOT="$(dirname "$PROJECT_ROOT")"
done

if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
  exit 0
fi

# Skip node_modules
if [[ "$FILE_PATH" == *"/node_modules/"* ]]; then
  exit 0
fi

EXT="${FILE_PATH##*.}"

# Determine which project and run appropriate tools
# Track which projects were modified in this session
declare -A BUILT_PROJECTS

case "$PROJECT_ROOT" in
  */admin-web)
    echo "[hook] admin-web: formatting $FILE_PATH"
    if [[ "$EXT" == "vue" || "$EXT" == "js" || "$EXT" == "jsx" || "$EXT" == "ts" || "$EXT" == "tsx" || "$EXT" == "css" ]]; then
      (cd "$PROJECT_ROOT" && npx prettier --write "$FILE_PATH" 2>/dev/null || true)
      (cd "$PROJECT_ROOT" && npx eslint --fix "$FILE_PATH" 2>/dev/null || true)
    fi
    if [[ -z "${BUILT_PROJECTS[admin-web]+_}" ]]; then
      echo "[hook] admin-web: building production..."
      (cd "$PROJECT_ROOT" && npm run build 2>&1) || echo "[hook] admin-web: build failed"
      BUILT_PROJECTS[admin-web]=1
    fi
    ;;
  */super-admin)
    echo "[hook] super-admin: formatting $FILE_PATH"
    if [[ "$EXT" == "vue" || "$EXT" == "js" || "$EXT" == "jsx" || "$EXT" == "ts" || "$EXT" == "tsx" || "$EXT" == "css" ]]; then
      (cd "$PROJECT_ROOT" && npx prettier --write "$FILE_PATH" 2>/dev/null || true)
    fi
    if [[ -z "${BUILT_PROJECTS[super-admin]+_}" ]]; then
      echo "[hook] super-admin: building production..."
      (cd "$PROJECT_ROOT" && npm run build 2>&1) || echo "[hook] super-admin: build failed"
      BUILT_PROJECTS[super-admin]=1
    fi
    ;;
  */client-web)
    echo "[hook] client-web: formatting $FILE_PATH"
    if [[ "$EXT" == "vue" || "$EXT" == "js" || "$EXT" == "jsx" || "$EXT" == "ts" || "$EXT" == "tsx" || "$EXT" == "css" ]]; then
      (cd "$PROJECT_ROOT" && npx prettier --write "$FILE_PATH" 2>/dev/null || true)
    fi
    if [[ -z "${BUILT_PROJECTS[client-web]+_}" ]]; then
      echo "[hook] client-web: building production..."
      (cd "$PROJECT_ROOT" && npm run build 2>&1) || echo "[hook] client-web: build failed"
      BUILT_PROJECTS[client-web]=1
    fi
    ;;
  */backend)
    echo "[hook] backend: linting $FILE_PATH"
    if [[ "$EXT" == "js" || "$EXT" == "mjs" || "$EXT" == "cjs" ]]; then
      (cd "$PROJECT_ROOT" && npx eslint --fix "$FILE_PATH" 2>/dev/null || true)
    fi
    if [[ -z "${BUILT_PROJECTS[backend]+_}" ]]; then
      echo "[hook] backend: reloading PM2..."
      pm2 reload backend-1.0 --update-env 2>&1 || echo "[hook] backend: PM2 reload failed"
      BUILT_PROJECTS[backend]=1
    fi
    ;;
esac

exit 0
