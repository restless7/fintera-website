#!/usr/bin/env bash
set -euo pipefail

cd /home/jauria/planmaestro-ecosystem/packages/fintera-website
export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"

echo "[$(date -Is)] Starting FINTERA Monthly Executive Dossier Synthesizer..."
npx tsx scripts/fintera-monthly-dossier.ts
echo "[$(date -Is)] FINTERA Monthly Executive Dossier Synthesizer completed."

