#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONGO_URI="${MONGO_URI:-mongodb://127.0.0.1:27017}"
MONGO_DB="${MONGO_DB:-ecommerce_practice}"
OUT_DIR="${OUT_DIR:-$SCRIPT_DIR/data}"

collections=(customers sellers categories products warehouses inventory inventory_movements carts orders payments shipments returns reviews promotions wishlists audit_events)
for name in "${collections[@]}"; do
  file="$OUT_DIR/$name.json"
  if [[ ! -s "$file" ]]; then
    echo "Missing or empty: $file" >&2
    exit 1
  fi
  mongoimport --uri "$MONGO_URI" --db "$MONGO_DB" --collection "$name" \
    --file "$file" --type json --mode upsert --upsertFields _id --stopOnError
done

echo "Import complete. Run verify.mongodb.js with mongosh to check collection counts."
