#!/usr/bin/env bash
# =============================================================================
# gen-db-types.sh — regeneruje src/lib/database.types.ts z lokalnego stacku.
#
# Wymagania:
#   - Docker Desktop uruchomiony
#   - Lokalny Supabase stack: `bunx supabase start` (sprawdź `bunx supabase status`)
#   - Migracje zaaplikowane: `bunx supabase db reset`
#
# Po każdej migracji (`supabase/migrations/*.sql`) uruchom ten skrypt, żeby
# zaktualizować typy używane przez `createClient<Database>` w `src/lib/supabase.ts`.
# =============================================================================
set -euo pipefail

OUTPUT_PATH="src/lib/database.types.ts"

echo "Generating Supabase types → ${OUTPUT_PATH}"
bunx supabase gen types typescript --local > "${OUTPUT_PATH}"
echo "Done. Review the diff and commit if intentional."
