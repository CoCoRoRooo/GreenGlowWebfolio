/** 
 * ──────────────────────────────────────────────────────────────────────────────
 * server/src/routes/Products.js
 * ──────────────────────────────────────────────────────────────────────────────
 * Routes publiques pour la gestion des produits.
 * - GET /api/products → liste filtrée (recherche + catégorie).
 * - GET /api/products/:slug → détail d’un produit.
 * ──────────────────────────────────────────────────────────────────────────────
 */

import { Router } from 'express'
import { prisma } from '../db/prisma.js'

const router = Router()

/**
 * GET /api/products
 * Liste des produits avec filtres facultatifs :
 * - search : recherche insensible à la casse dans name ou description
 * - category : filtre exact insensible à la casse
 * Retourne les produits triés du plus récent au plus ancien.
 */
router.get('/', async (req, res) => {
  const { search = '', category = '' } = req.query

  const where = {
    AND: [
      search
        ? {
          OR: [
            { name: { contains: String(search), mode: 'insensitive' } },
            { description: { contains: String(search), mode: 'insensitive' } },
          ],
        }
        : {},
      category
        ? { category: { equals: String(category), mode: 'insensitive' } }
        : {},
    ],
  }

  const products = await prisma.product.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })

  res.json(products) // renvoie un tableau simple (attendu côté front)
})

/**
 * GET /api/products/:slug
 * Retourne le produit correspondant à son slug unique.
 * - 404 si aucun produit trouvé.
 */
router.get('/:slug', async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { slug: req.params.slug },
  })

  if (!product) return res.status(404).json({ error: 'Not found' })
  res.json(product)
})

export default router
