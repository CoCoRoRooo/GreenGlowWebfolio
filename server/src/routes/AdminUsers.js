/**
 * ──────────────────────────────────────────────────────────────────────────────
 * server/src/routes/AdminUsers.js
 * ──────────────────────────────────────────────────────────────────────────────
 * Routes d’administration pour la gestion des utilisateurs.
 * - Accès protégé : authentification + rôle admin requis.
 * - Listing paginé + recherche, édition (name/email/admin), reset mot de passe.
 * ──────────────────────────────────────────────────────────────────────────────
 */

import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../db/prisma.js'
import { requireAuth, requireAdmin } from './User.js'

const router = Router()

// Toutes les routes de ce module exigent d'être connecté ET admin.
router.use(requireAuth, requireAdmin)

/**
 * GET /api/admin/users?search=&skip=&take=
 * Liste paginée des utilisateurs.
 * - search (optionnel) : filtre sur email OU name (contains, insensitive)
 * - skip/take : pagination (take borné à 100 pour éviter les abus)
 * - Retour : { items, total, skip, take }
 */
router.get('/users', async (req, res) => {
    const search = String(req.query.search ?? '')
    const skip = Number.isFinite(+req.query.skip) ? +req.query.skip : 0
    const take = Math.min(100, Number.isFinite(+req.query.take) ? +req.query.take : 20)

    const where = search
        ? {
            OR: [
                { email: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
            ],
        }
        : {}

    // Requête + total en parallèle (meilleure latence)
    const [items, total] = await Promise.all([
        prisma.user.findMany({
            where,
            skip,
            take,
            orderBy: { createdAt: 'desc' },
            // On ne renvoie jamais password côté API
            select: { id: true, email: true, name: true, admin: true, createdAt: true },
        }),
        prisma.user.count({ where }),
    ])

    res.json({ items, total, skip, take })
})

/**
 * PATCH /api/admin/users/:id
 * Met à jour un utilisateur (name/email/admin).
 * - Champs optionnels, on construit un `data` partiel.
 * - Gestion des erreurs Prisma :
 *   - P2002 : email déjà pris (contrainte unique)
 *   - P2025 : user introuvable (update sur id inexistant)
 */
router.patch('/users/:id', async (req, res) => {
    try {
        const id = Number(req.params.id)
        const { name, email, admin } = req.body || {}

        const data = {}
        if (name !== undefined) data.name = String(name)
        if (email !== undefined) data.email = String(email)
        if (admin !== undefined) data.admin = !!admin

        const updated = await prisma.user.update({
            where: { id },
            data,
            select: { id: true, email: true, name: true, admin: true, createdAt: true },
        })

        res.json(updated)
    } catch (e) {
        if (e.code === 'P2002') return res.status(409).json({ error: 'Email déjà utilisé' })
        if (e.code === 'P2025') return res.status(404).json({ error: 'Utilisateur introuvable' })
        console.error('admin update user error:', e)
        res.status(500).json({ error: 'Server error' })
    }
})

/**
 * POST /api/admin/users/:id/reset-password
 * Réinitialise le mot de passe d’un utilisateur.
 * - Corps attendu : { newPassword } (>= 6 caractères)
 * - Hash bcrypt côté serveur (jamais stocker en clair)
 * - Erreurs Prisma :
 *   - P2025 : utilisateur inexistant
 */
router.post('/users/:id/reset-password', async (req, res) => {
    try {
        const id = Number(req.params.id)
        const { newPassword } = req.body || {}
        if (!newPassword || String(newPassword).length < 6) {
            return res.status(400).json({ error: 'Nouveau mot de passe invalide' })
        }

        await prisma.user.update({
            where: { id },
            data: { password: await bcrypt.hash(String(newPassword), 12) },
        })

        res.json({ ok: true })
    } catch (e) {
        if (e.code === 'P2025') return res.status(404).json({ error: 'Utilisateur introuvable' })
        console.error('admin reset password error:', e)
        res.status(500).json({ error: 'Server error' })
    }
})

/**
 * (Optionnel) DELETE /api/admin/users/:id
 * ⚠️ À n’activer que si les relations (Cart/Sale/Review) sont correctement
 * configurées (onDelete: SetNull/Cascade) pour éviter les orphelins.
 * Exemple :
 * router.delete('/users/:id', async (req, res) => { ... })
 */

export default router
