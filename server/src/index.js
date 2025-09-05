/** 
 * ──────────────────────────────────────────────────────────────────────────────
 * server/src/index.js
 * ──────────────────────────────────────────────────────────────────────────────
 * Point d’entrée principal du serveur Express.
 * - Configure middlewares globaux (CORS, JSON, cookies)
 * - Monte les routes publiques (auth, produits, panier, faq, reviews, portfolio)
 * - Monte les routes admin protégées (produits, users, ventes)
 * - Fournit endpoints utilitaires (/health, /stats, /checkout)
 * ──────────────────────────────────────────────────────────────────────────────
 */

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'

// Routes publiques
import productsRouter from './routes/Products.js'
import userRoutes from './routes/User.js'
import cartRoutes from './routes/Cart.js'
import faqRoutes from './routes/Faq.js'
import reviewRoutes from './routes/Review.js'

// Routes admin
import adminProductsRouter from './routes/AdminProducts.js'
import adminUsersRouter from './routes/AdminUsers.js'
import adminSalesRouter from './routes/AdminSales.js'

// Base de données (Prisma)
import { prisma } from './db/prisma.js'

// Middlewares custom (auth)
import { requireAuth } from './routes/User.js'

dotenv.config()
const app = express()

// ────────────────────────────────
// MIDDLEWARES GLOBAUX
// ────────────────────────────────
app.use(cors({
  origin: (origin, cb) => cb(null, origin || true), // autorise l’origine appelante
  credentials: true,
}));
app.use(express.json()) // parse JSON body
app.use(cookieParser()) // parse cookies (JWT inclus)

// ────────────────────────────────
// ROUTES PUBLIQUES
// ────────────────────────────────

// Authentification (register, login, me, logout…)
app.use('/api', userRoutes)

// Panier utilisateur (guest ou connecté)
app.use('/api', cartRoutes)

// FAQ (public + admin)
app.use('/api', faqRoutes)

// Reviews (avis clients + admin)
app.use('/api', reviewRoutes)

// Healthcheck simple (utilisé par monitoring / Docker)
app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', time: new Date().toISOString() })
)

/**
 * POST /api/checkout
 * Simulation d’un checkout :
 * - Vérifie que l’utilisateur est authentifié
 * - Valide les produits + stock
 * - Calcule le total
 * - Effectue une transaction Prisma :
 *   → crée une vente liée au user
 *   → crée les SaleItem (qty, prix snapshot)
 *   → décrémente le stock produit
 *   → clôture le panier actif (status CHECKED_OUT)
 */
app.post('/api/checkout', requireAuth, async (req, res) => {
  try {
    const items = Array.isArray(req.body?.items) ? req.body.items : []
    if (!items.length) return res.status(400).json({ error: 'Empty cart' })

    // Charger les produits par slug
    const slugs = items.map(i => String(i.slug))
    const products = await prisma.product.findMany({ where: { slug: { in: slugs } } })
    if (products.length !== slugs.length) {
      return res.status(400).json({ error: 'Unknown product in cart' })
    }

    // Vérif stock + calcul du total
    const bySlug = Object.fromEntries(products.map(p => [p.slug, p]))
    for (const i of items) {
      const p = bySlug[i.slug]
      const q = Math.max(1, Number(i.qty) || 1)
      if (p.stock < q) return res.status(400).json({ error: `Insufficient stock for ${p.name}` })
    }
    const total = items.reduce(
      (s, i) => s + bySlug[i.slug].price * Math.max(1, Number(i.qty) || 1),
      0
    )

    // Transaction : crée la vente + lignes + décrémente le stock
    const result = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: { total, userId: req.user.id }
      })

      for (const i of items) {
        const p = bySlug[i.slug]
        const q = Math.max(1, Number(i.qty) || 1)

        await tx.saleItem.create({
          data: { saleId: sale.id, productId: p.id, qty: q, price: p.price }
        })

        await tx.product.update({
          where: { id: p.id },
          data: { stock: { decrement: q } }
        })
      }

      await tx.cart.updateMany({
        where: { userId: req.user.id, status: 'ACTIVE' },
        data: { status: 'CHECKED_OUT' }
      })

      return sale
    })

    return res.json({ success: true, orderId: result.id })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Checkout failed' })
  }
})

/**
 * GET /api/stats
 * Renvoie les ventes des 6 derniers mois (glissants).
 * - Bucket mensuel avec total des ventes
 * - Utilisé pour graphiques/dashboard
 */
app.get('/api/stats', async (req, res) => {
  try {
    const now = new Date()
    const start = new Date(now)
    start.setMonth(now.getMonth() - 5)
    start.setHours(0, 0, 0, 0)

    const sales = await prisma.sale.findMany({
      where: { createdAt: { gte: start } },
      orderBy: { createdAt: 'asc' },
      select: { total: true, createdAt: true }
    })

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const buckets = {}
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now); d.setMonth(now.getMonth() - i)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      buckets[key] = { month: months[d.getMonth()], sales: 0 }
    }
    for (const s of sales) {
      const k = `${s.createdAt.getFullYear()}-${s.createdAt.getMonth()}`
      if (buckets[k]) buckets[k].sales += s.total
    }
    res.json(Object.values(buckets))
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Stats failed' })
  }
})

// Produits (catalogue public)
app.use('/api/products', productsRouter)

// Portfolio (galerie de démos)
app.get('/api/portfolio', async (_req, res) => {
  const items = await prisma.portfolio.findMany({
    orderBy: { createdAt: 'desc' },
    select: { slug: true, name: true, imageUrl: true, description: true, tags: true }
  })
  res.json(items)
})

// ────────────────────────────────
// ROUTES ADMIN (protégées requireAuth+requireAdmin)
// ────────────────────────────────
app.use('/api/admin', adminProductsRouter)
app.use('/api/admin', adminUsersRouter)
app.use('/api/admin', adminSalesRouter)

// ────────────────────────────────
// LANCEMENT SERVEUR
// ────────────────────────────────
const PORT = process.env.PORT || 5000
app.listen(PORT, '0.0.0.0', () =>
  console.log(`API on :${PORT}`)
)
