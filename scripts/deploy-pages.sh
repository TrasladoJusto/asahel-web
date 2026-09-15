#!/usr/bin/env bash
# Deploy Pages (advanced mode) con OpenNext.
# Estructura requerida: assets estáticos + _worker.js + módulos internos + _routes.json
set -euo pipefail
cd "$(dirname "$0")/.."

echo "[1/3] Build OpenNext..."
npx opennextjs-cloudflare build

echo "[2/3] Ensamblando directorio de deploy..."
OUT=.pages-deploy
rm -rf "$OUT"
mkdir -p "$OUT"

# Assets estáticos (raíz pública)
cp -r .open-next/assets/. "$OUT/"
# Entrypoint del worker + módulos internos
cp .open-next/worker.js "$OUT/_worker.js"
cp -r .open-next/cloudflare "$OUT/"
cp -r .open-next/.build "$OUT/"
cp -r .open-next/middleware "$OUT/"
cp -r .open-next/server-functions "$OUT/"
# Routing Pages: sirve estáticos sin pasar por el worker
cp deploy/_routes.pages.json "$OUT/_routes.json"

echo "[3/3] Deploy a Cloudflare Pages (proyecto: asahel)..."
npx wrangler pages deploy "$OUT" --project-name asahel --branch main --commit-dirty=true

echo "✓ Deploy completo"