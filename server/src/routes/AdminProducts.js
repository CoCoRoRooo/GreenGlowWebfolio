/**
 * ──────────────────────────────────────────────────────────────────────────────
 * server/src/routes/AdminProducts.js
 * ──────────────────────────────────────────────────────────────────────────────
 * CRUD Produits côté Admin (sécurisé).
 * - Tous les endpoints sont protégés par requireAuth + requireAdmin.
 * - Pagination / recherche / filtrage par catégorie sur la liste.
 * - Gestion fine des erreurs Prisma (P2002: contrainte unique, P2025: not found).
 * ──────────────────────────────────────────────────────────────────────────────
 */

import { Router } from 'express'
import { prisma } from '../db/prisma.js'
import { requireAuth, requireAdmin } from './User.js'

const router = Router()

// Sécurisation globale du module : il faut être connecté ET admin
router.use(requireAuth, requireAdmin)

/**
 * GET /api/admin/products?search=&category=&skip=0&take=20
 * Liste paginée des produits + filtre texte (name/description/slug) + catégorie.
 * - `skip`/`take` pour la pagination (take plafonné à 100).
 */
router.get('/products', async (req, res) => {
    const search = String(req.query.search ?? '')
    const category = String(req.query.category ?? '')
    const skip = Number.isFinite(+req.query.skip) ? +req.query.skip : 0
    const take = Math.min(100, Number.isFinite(+req.query.take) ? +req.query.take : 20)

    // Construction d’un WHERE dynamique : si pas de filtre, on injecte un objet vide
    const where = {
        AND: [
            search
                ? {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        { description: { contains: search, mode: 'insensitive' } },
                        { slug: { contains: search, mode: 'insensitive' } },
                    ],
                }
                : {},
            category ? { category: { equals: category, mode: 'insensitive' } } : {},
        ],
    }

    // On parallélise la requête liste + le total pour la pagination
    const [items, total] = await Promise.all([
        prisma.product.findMany({
            where,
            skip,
            take,
            orderBy: { createdAt: 'desc' },
        }),
        prisma.product.count({ where }),
    ])

    res.json({ items, total, skip, take })
})

/**
 * GET /api/admin/products/:id
 * Récupère un produit par ID. 404 si introuvable.
 */
router.get('/products/:id', async (req, res) => {
    const id = Number(req.params.id)
    const p = await prisma.product.findUnique({ where: { id } })
    if (!p) return res.status(404).json({ error: 'Not found' })
    res.json(p)
})

/**
 * POST /api/admin/products
 * Création d’un produit.
 * - Champs requis: slug, name
 * - Gère la contrainte unique sur slug (P2002).
 */
router.post('/products', async (req, res) => {
    try {
        const { slug, name, price, category, img, description, stock } = req.body || {}
        if (!slug || !name) return res.status(400).json({ error: 'slug et name requis' })

        const created = await prisma.product.create({
            data: {
                slug: String(slug),
                name: String(name),
                price: Number(price ?? 0),
                category: String(category ?? ''),
                img: String(img ?? ''),
                description: String(description ?? ''),
                stock: Number.isFinite(+stock) ? +stock : 0,
            },
        })
        res.status(201).json(created)
    } catch (e) {
        // P2002 = violation contrainte unique (slug déjà pris)
        if (e.code === 'P2002') return res.status(409).json({ error: 'Slug déjà utilisé' })
        console.error('create product error:', e)
        res.status(500).json({ error: 'Server error' })
    }
})

/**
 * PATCH /api/admin/products/:id
 * Mise à jour partielle (seuls les champs fournis sont modifiés).
 * - Gère P2002 (slug unique) et P2025 (ID introuvable).
 */
router.patch('/products/:id', async (req, res) => {
    try {
        const id = Number(req.params.id)
        const { slug, name, price, category, img, description, stock } = req.body || {}

        // On ne pousse que les champs présents dans le body
        const data = {}
        if (slug !== undefined) data.slug = String(slug)
        if (name !== undefined) data.name = String(name)
        if (price !== undefined) data.price = Number(price)
        if (category !== undefined) data.category = String(category)
        if (img !== undefined) data.img = String(img)
        if (description !== undefined) data.description = String(description)
        if (stock !== undefined) data.stock = Number(stock)

        const updated = await prisma.product.update({ where: { id }, data })
        res.json(updated)
    } catch (e) {
        if (e.code === 'P2002') return res.status(409).json({ error: 'Slug déjà utilisé' })
        if (e.code === 'P2025') return res.status(404).json({ error: 'Produit introuvable' })
        console.error('update product error:', e)
        res.status(500).json({ error: 'Server error' })
    }
})

/**
 * DELETE /api/admin/products/:id
 * Suppression d’un produit par ID.
 * - Gère P2025 (déjà supprimé / inexistant).
 */
router.delete('/products/:id', async (req, res) => {
    try {
        const id = Number(req.params.id)
        await prisma.product.delete({ where: { id } })
        res.json({ ok: true })
    } catch (e) {
        if (e.code === 'P2025') return res.status(404).json({ error: 'Produit introuvable' })
        console.error('delete product error:', e)
        res.status(500).json({ error: 'Server error' })
    }
})

export default router
