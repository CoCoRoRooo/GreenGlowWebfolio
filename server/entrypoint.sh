#!/usr/bin/env sh
set -e


# Attendre Postgres
until nc -z db 5432; do
echo "[api] Waiting for Postgres..."; sleep 1;
done


# Migrer la BDD (prisma migrate deploy)
npx prisma migrate deploy


# Seed optionnel et idempotent
if [ "$SEED_ON_START" = "true" ]; then
echo "[api] Seeding database (idempotent)"
node prisma/seed.js || true
fi


# Lancer le serveur
exec node src/index.js