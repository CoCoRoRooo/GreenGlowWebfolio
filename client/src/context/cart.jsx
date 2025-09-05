/**
 * client/src/context/cart.jsx
 * Contexte du panier (CartContext).
 * - Gère deux modes : invité (localStorage) et utilisateur connecté (API serveur).
 * - Fournit les fonctions : add, setQty, remove, clear + le total calculé.
 * - Se synchronise automatiquement quand un utilisateur se connecte.
 */

import { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { useAuth } from './auth.jsx'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const { user } = useAuth()
  const isAuth = !!user

  // Panier invité (persisté dans localStorage)
  const [guestItems, setGuestItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('gg_cart') || '[]')
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem('gg_cart', JSON.stringify(guestItems))
  }, [guestItems])

  // Panier utilisateur (chargé depuis le serveur)
  const [serverCart, setServerCart] = useState(null)

  // Au changement de user → merge éventuel du panier invité, puis chargement du panier serveur
  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!isAuth) {
        setServerCart(null)
        return
      }

      // Si des items en invité → merge côté serveur
      if (guestItems.length > 0) {
        await fetch('/api/cart/merge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(
            guestItems.map(x => ({
              productId: x.id ?? x.productId,
              qty: x.qty
            }))
          )
        })
        setGuestItems([]) // on vide après merge
      }

      // Récupération du panier serveur
      const res = await fetch('/api/cart', { credentials: 'include' })
      const data = res.ok ? await res.json() : null
      if (!cancelled) setServerCart(data)
    }
    load()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuth])

  // Ajout au panier
  async function add(p, qty = 1) {
    const q = Math.max(1, Number(qty) || 1)
    if (!isAuth) {
      setGuestItems(prev => {
        const next = [...prev]
        const i = next.findIndex(x => x.slug === p.slug || x.id === p.id)
        if (i > -1) next[i] = { ...next[i], qty: next[i].qty + q }
        else next.push({ slug: p.slug, id: p.id, name: p.name, price: Number(p.price), img: p.img, qty: q })
        return next
      })
    } else {
      const res = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ productId: p.id, qty: q })
      })
      const data = await res.json()
      setServerCart(data)
    }
  }

  // Modifier la quantité
  async function setQty(idOrSlug, qty) {
    const q = Math.max(1, Number(qty) || 1)
    if (!isAuth) {
      setGuestItems(prev =>
        prev.map(x =>
          (x.id === idOrSlug || x.slug === idOrSlug) ? { ...x, qty: q } : x
        )
      )
    } else {
      const productId = Number(idOrSlug)
      const res = await fetch('/api/cart/qty', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ productId, qty: q })
      })
      const data = await res.json()
      setServerCart(data)
    }
  }

  // Supprimer un article
  async function remove(idOrSlug) {
    if (!isAuth) {
      setGuestItems(prev => prev.filter(x => !(x.id === idOrSlug || x.slug === idOrSlug)))
    } else {
      const productId = Number(idOrSlug)
      const res = await fetch(`/api/cart/item/${productId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      const data = await res.json()
      setServerCart(data)
    }
  }

  // Vider le panier
  async function clear() {
    if (!isAuth) {
      setGuestItems([])
    } else {
      await fetch('/api/cart/clear', { method: 'DELETE', credentials: 'include' })
      setServerCart(prev => ({ ...prev, items: [] }))
    }
  }

  // Items unifiés (même format pour invité et user connecté)
  const items = useMemo(() => {
    if (!isAuth) return guestItems
    const it = serverCart?.items || []
    return it.map(ci => ({
      id: ci.productId,
      slug: ci.product.slug,
      name: ci.product.name,
      img: ci.product.img,
      price: Number(ci.product.price),
      qty: ci.qty
    }))
  }, [isAuth, guestItems, serverCart])

  const total = items.reduce((s, i) => s + Number(i.price) * i.qty, 0)

  // Expose le contexte
  return (
    <CartContext.Provider value={{ items, add, setQty, remove, clear, total }}>
      {children}
    </CartContext.Provider>
  )
}

// Hook custom : permet d’accéder facilement au contexte du panier
export const useCart = () => useContext(CartContext)
