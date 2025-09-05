/** 
 * ──────────────────────────────────────────────────────────────────────────────
 * server/src/routes/Faq.js
 * ──────────────────────────────────────────────────────────────────────────────
 * Routes pour gérer les FAQ.
 * - Partie publique : liste uniquement les entrées publiées.
 * - Partie admin : CRUD complet (création, modification, suppression).
 * ──────────────────────────────────────────────────────────────────────────────
 */

import express from 'express'
import { prisma } from '../db/prisma.js'
import { requireAuth, requireAdmin } from './User.js'

const router = express.Router()

/**
 * GET /api/faqs
 * Public : liste toutes les FAQ publiées.
 * - Triées par `ordering` (ordre d’affichage) puis par `createdAt` (stabilité).
 */
router.get('/faqs', async (_req, res) => {
    const faqs = await prisma.faq.findMany({
        where: { published: true },
        orderBy: [{ ordering: 'asc' }, { createdAt: 'asc' }],
    })
    res.json(faqs)
})

/* ─── Admin CRUD ───────────────────────────────────────────────────────────── */

/**
 * POST /api/faqs
 * Crée une nouvelle FAQ.
 * - Champs requis : question, answer
 * - Par défaut : ordering=0, published=true
 */
router.post('/faqs', requireAuth, requireAdmin, async (req, res) => {
    const { question, answer, ordering = 0, published = true } = req.body || {}
    if (!question || !answer) {
        return res.status(400).json({ error: 'question et answer requis' })
    }
    const faq = await prisma.faq.create({
        data: { question, answer, ordering, published },
    })
    res.status(201).json(faq)
})

/**
 * PATCH /api/faqs/:id
 * Met à jour une FAQ existante (champs partiels).
 * - id pris dans params
 * - Champs optionnels : question, answer, ordering, published
 */
router.patch('/faqs/:id', requireAuth, requireAdmin, async (req, res) => {
    const id = Number(req.params.id)
    const { question, answer, ordering, published } = req.body || {}
    const faq = await prisma.faq.update({
        where: { id },
        data: {
            ...(question !== undefined ? { question } : {}),
            ...(answer !== undefined ? { answer } : {}),
            ...(ordering !== undefined ? { ordering: Number(ordering) } : {}),
            ...(published !== undefined ? { published: !!published } : {}),
        },
    })
    res.json(faq)
})

/**
 * DELETE /api/faqs/:id
 * Supprime une FAQ par son id.
 */
router.delete('/faqs/:id', requireAuth, requireAdmin, async (req, res) => {
    const id = Number(req.params.id)
    await prisma.faq.delete({ where: { id } })
    res.json({ ok: true })
})

export default router
