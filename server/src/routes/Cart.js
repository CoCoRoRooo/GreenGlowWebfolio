/**
 * ──────────────────────────────────────────────────────────────────────────────
 * server/src/routes/Cart.js
 * ──────────────────────────────────────────────────────────────────────────────
 * Routes panier (côté API) pour un utilisateur authentifié.
 * - Un seul panier `ACTIVE` par user (garanti par @@unique(userId, status)).
 * - Ajout / maj quantité / suppression d’item / vidage / fusion invité→user.
 * ──────────────────────────────────────────────────────────────────────────────
 */

import express from 'express'
import { prisma } from '../db/prisma.js'
import { requireAuth } from './User.js'

const router = express.Router()

/**
 * Utilitaire : récupère le panier ACTIVE d’un user, ou le crée si absent.
 * - Inclut les items + produit attaché pour que le front ait tout en 1 appel.
 */
async function getOrCreateActiveCart(userId) {
    let cart = await prisma.cart.findFirst({
        where: { userId, status: 'ACTIVE' },
        include: { items: { include: { product: true } } },
    })
    if (!cart) {
        cart = await prisma.cart.create({
            data: { userId },
            include: { items: { include: { product: true } } },
        })
    }
    return cart
}

/**
 * GET /api/cart
 * Retourne le panier ACTIVE de l’utilisateur courant.
 */
router.get('/cart', requireAuth, async (req, res) => {
    const cart = await getOrCreateActiveCart(req.user.id)
    res.json(cart)
})

/**
 * POST /api/cart/add  body: { productId, qty }
 * Ajoute un produit au panier (ou incrémente si déjà présent).
 * - Composite unique (cartId, productId) : on fait un upsert « manuel ».
 */
router.post('/cart/add', requireAuth, async (req, res) => {
    const { productId, qty = 1 } = req.body || {}
    if (!productId) return res.status(400).json({ error: 'productId requis' })

    const q = Math.max(1, Number(qty) || 1)
    const cart = await getOrCreateActiveCart(req.user.id)

    const existing = await prisma.cartItem.findUnique({
        where: { cartId_productId: { cartId: cart.id, productId: Number(productId) } },
    })

    if (existing) {
        await prisma.cartItem.update({
            where: { cartId_productId: { cartId: cart.id, productId: Number(productId) } },
            data: { qty: existing.qty + q },
        })
    } else {
        await prisma.cartItem.create({
            data: { cartId: cart.id, productId: Number(productId), qty: q },
        })
    }

    const updated = await prisma.cart.findUnique({
        where: { id: cart.id },
        include: { items: { include: { product: true } } },
    })
    res.json(updated)
})

/**
 * PATCH /api/cart/qty  body: { productId, qty }
 * Force la quantité d’un item (>= 1).
 */
router.patch('/cart/qty', requireAuth, async (req, res) => {
    const { productId, qty } = req.body || {}
    const q = Math.max(1, Number(qty) || 1)
    const cart = await getOrCreateActiveCart(req.user.id)

    await prisma.cartItem.update({
        where: { cartId_productId: { cartId: cart.id, productId: Number(productId) } },
        data: { qty: q },
    })

    const updated = await prisma.cart.findUnique({
        where: { id: cart.id },
        include: { items: { include: { product: true } } },
    })
    res.json(updated)
})

/**
 * DELETE /api/cart/item/:productId
 * Supprime une ligne de panier (par productId).
 */
router.delete('/cart/item/:productId', requireAuth, async (req, res) => {
    const productId = Number(req.params.productId)
    const cart = await getOrCreateActiveCart(req.user.id)

    await prisma.cartItem.delete({
        where: { cartId_productId: { cartId: cart.id, productId } },
    })

    const updated = await prisma.cart.findUnique({
        where: { id: cart.id },
        include: { items: { include: { product: true } } },
    })
    res.json(updated)
})

/**
 * DELETE /api/cart/clear
 * Vide complètement le panier ACTIVE.
 */
router.delete('/cart/clear', requireAuth, async (req, res) => {
    const cart = await getOrCreateActiveCart(req.user.id)
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } })
    res.json({ ok: true })
})

/**
 * POST /api/cart/merge
 * Fusionne un panier invité (localStorage) dans le panier user après login.
 * - body: [{ productId, qty }, ...]
 * - Additionne les quantités si la ligne existe déjà.
 */
router.post('/cart/merge', requireAuth, async (req, res) => {
    const guestItems = Array.isArray(req.body) ? req.body : []
    const cart = await getOrCreateActiveCart(req.user.id)

    for (const gi of guestItems) {
        const productId = Number(gi.productId)
        const q = Math.max(1, Number(gi.qty) || 1)

        const existing = await prisma.cartItem.findUnique({
            where: { cartId_productId: { cartId: cart.id, productId } },
        })

        if (existing) {
            await prisma.cartItem.update({
                where: { cartId_productId: { cartId: cart.id, productId } },
                data: { qty: existing.qty + q },
            })
        } else {
            await prisma.cartItem.create({
                data: { cartId: cart.id, productId, qty: q },
            })
        }
    }

    const updated = await prisma.cart.findUnique({
        where: { id: cart.id },
        include: { items: { include: { product: true } } },
    })
    res.json(updated)
})

export default router
