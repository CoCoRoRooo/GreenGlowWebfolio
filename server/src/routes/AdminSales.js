/**
 * ──────────────────────────────────────────────────────────────────────────────
 * server/src/routes/AdminSales.js
 * ──────────────────────────────────────────────────────────────────────────────
 * Routes d’administration pour la gestion des ventes.
 * - Tous les endpoints sont protégés (authentification + rôle admin).
 * - Liste paginée et filtrée (par date et user).
 * - Détail d’une vente avec user + produits associés.
 * ──────────────────────────────────────────────────────────────────────────────
 */

import { Router } from 'express'
import { prisma } from '../db/prisma.js'
import { requireAuth, requireAdmin } from './User.js'

const router = Router()
router.use(requireAuth, requireAdmin)

/**
 * GET /api/admin/sales?from=YYYY-MM-DD&to=YYYY-MM-DD&userId=&skip=&take=
 * Liste paginée des ventes.
 * - Filtres disponibles :
 *   - from/to : plage de dates (>= from, <= to)
 *   - userId  : limiter aux ventes d’un utilisateur
 * - Pagination : skip/take (take max = 100)
 */
router.get('/sales', async (req, res) => {
    const { from, to, userId } = req.query
    const skip = Number.isFinite(+req.query.skip) ? +req.query.skip : 0
    const take = Math.min(100, Number.isFinite(+req.query.take) ? +req.query.take : 20)

    const where = {
        AND: [
            from ? { createdAt: { gte: new Date(String(from)) } } : {},
            to ? { createdAt: { lte: new Date(String(to)) } } : {},
            userId ? { userId: Number(userId) } : {},
        ],
    }

    // On exécute en parallèle la récupération des ventes + le total
    const [items, total] = await Promise.all([
        prisma.sale.findMany({
            where,
            skip,
            take,
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { id: true, email: true, name: true } }, // infos user basiques
                items: {
                    include: {
                        product: { select: { id: true, slug: true, name: true, price: true } },
                    },
                },
            },
        }),
        prisma.sale.count({ where }),
    ])

    res.json({ items, total, skip, take })
})

/**
 * GET /api/admin/sales/:id
 * Détail d’une vente spécifique.
 * - Inclut : infos user + liste des items + produits liés.
 * - 404 si la vente n’existe pas.
 */
router.get('/sales/:id', async (req, res) => {
    const id = Number(req.params.id)

    const sale = await prisma.sale.findUnique({
        where: { id },
        include: {
            user: { select: { id: true, email: true, name: true } },
            items: {
                include: {
                    product: { select: { id: true, slug: true, name: true, price: true } },
                },
            },
        },
    })

    if (!sale) return res.status(404).json({ error: 'Sale not found' })
    res.json(sale)
})

export default router
