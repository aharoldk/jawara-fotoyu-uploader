#!/bin/sh
set -e

echo "Generating runtime env.js..."

# Replace $VITE_API_URL with actual environment variable value
envsubst '$VITE_API_URL' < /usr/share/nginx/html/env.template.js > /usr/share/nginx/html/env.js

echo "Runtime environment variables injected."

exec "$@"

