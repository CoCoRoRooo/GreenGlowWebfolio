/** 
 * ──────────────────────────────────────────────────────────────────────────────
 * server/src/routes/Review.js
 * ──────────────────────────────────────────────────────────────────────────────
 * Routes publiques et admin pour la gestion des avis clients (reviews).
 * - Public : lecture et création d’avis (non publiés par défaut).
 * - Admin : validation/modération (publish/unpublish), édition et suppression.
 * ──────────────────────────────────────────────────────────────────────────────
 */

import express from 'express'
import { prisma } from '../db/prisma.js'
import { requireAuth, requireAdmin } from './User.js'

const router = express.Router()

/**
 * GET /api/reviews
 * Liste tous les avis publiés :
 * - Filtrés par `published = true`
 * - Tri : étoiles décroissantes puis date de création récente
 */
router.get('/reviews', async (_req, res) => {
    const reviews = await prisma.review.findMany({
        where: { published: true },
        orderBy: [{ stars: 'desc' }, { createdAt: 'desc' }],
    })
    res.json(reviews)
})

/**
 * POST /api/reviews
 * Création d’un avis par un utilisateur (public).
 * - Paramètres attendus : name, text, stars
 * - stars doit être compris entre 1 et 5
 * - Avis créé avec `published = false` → nécessite validation admin
 */
router.post('/reviews', async (req, res) => {
    const { name, text, stars } = req.body || {}
    const s = Number(stars)

    if (!name || !text || !s) {
        return res.status(400).json({ error: 'name, text, stars requis' })
    }
    if (s < 1 || s > 5) {
        return res.status(400).json({ error: 'stars doit être entre 1 et 5' })
    }

    const review = await prisma.review.create({
        data: { name, text, stars: s, published: false },
    })
    res.status(201).json(review)
})

/**
 * PATCH /api/reviews/:id
 * Admin uniquement — modifier un avis :
 * - Peut changer name, text, stars (validés entre 1 et 5), published
 */
router.patch('/reviews/:id', requireAuth, requireAdmin, async (req, res) => {
    const id = Number(req.params.id)
    const { name, text, stars, published } = req.body || {}

    const data = {}
    if (name !== undefined) data.name = name
    if (text !== undefined) data.text = text
    if (stars !== undefined) {
        const s = Number(stars)
        if (s < 1 || s > 5) {
            return res.status(400).json({ error: 'stars doit être entre 1 et 5' })
        }
        data.stars = s
    }
    if (published !== undefined) data.published = !!published

    const review = await prisma.review.update({ where: { id }, data })
    res.json(review)
})

/**
 * DELETE /api/reviews/:id
 * Admin uniquement — supprime un avis client.
 */
router.delete('/reviews/:id', requireAuth, requireAdmin, async (req, res) => {
    const id = Number(req.params.id)
    await prisma.review.delete({ where: { id } })
    res.json({ ok: true })
})

export default router
