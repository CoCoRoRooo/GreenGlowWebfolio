/**
 * ──────────────────────────────────────────────────────────────────────────────
 * server/src/db/prisma.js
 * ──────────────────────────────────────────────────────────────────────────────
 * Configuration du client Prisma.
 * Objectif :
 * - Fournir une instance unique de PrismaClient.
 * - Éviter la création multiple de connexions en mode développement (hot reload).
 * ──────────────────────────────────────────────────────────────────────────────
 */

import { PrismaClient } from '@prisma/client'

// Utilisation d'une variable globale pour stocker l'instance en dev
const globalForPrisma = globalThis

// Création ou réutilisation du client Prisma
export const prisma = globalForPrisma.prisma || new PrismaClient()

// En mode dev, conserver la même instance pour éviter d'ouvrir trop de connexions
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma
}
