#!/bin/bash
set -euo pipefail
export PATH="/home/jauria/.local/bin:/usr/local/bin:/usr/bin:/bin"
export HOME="/home/jauria"
export NODE_ENV="production"
[ -f /home/jauria/.env ] && source /home/jauria/.env

cd /home/jauria/planmaestro-ecosystem/packages/fintera-website
[ -f .env.local ] && set -a && source .env.local && set +a

echo "[$(date -Iseconds)] 🚀 Starting FINTERA Financial Trend Scraper..."
/home/jauria/.local/bin/npx prisma generate
/home/jauria/.local/bin/npx tsx scripts/fintera-trend-scraper.ts
echo "[$(date -Iseconds)] ✅ FINTERA Financial Trend Scraper finished."
