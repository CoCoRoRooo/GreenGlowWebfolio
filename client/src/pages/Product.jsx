/**
 * Fichier : client/src/pages/Product.jsx
 * Rôle : Page de détail d’un produit (affichage + ajout au panier).
 * Points clés :
 *  - Chargement du produit par `slug` via l’API.
 *  - Gestion des états : loading / error / success.
 *  - Contrôle de la quantité (bornes 1..stock) et ajout au panier.
 */

import { useEffect, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Container, Row, Col, Button, Badge, Alert, Spinner } from 'react-bootstrap'
import { useCart } from '../context/cart.jsx'

export default function Product() {
  const { slug } = useParams()            // Récupère le paramètre dynamique d’URL (/product/:slug)
  const { add } = useCart()               // Action pour ajouter au panier (context global)

  // État local pour la ressource distante et l’UI
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [qty, setQ] = useState(1)         // Quantité choisie par l’utilisateur

  // Effet : charge le produit quand `slug` change (navigations internes)
  useEffect(() => {
    let cancelled = false
      ; (async () => {
        setLoading(true)
        setError(null)
        setProduct(null)
        try {
          const res = await fetch('/api/products/' + slug)
          if (!res.ok) {
            if (res.status === 404) throw new Error('Product not found')
            throw new Error('Failed to load product')
          }
          const data = await res.json()
          if (!cancelled) setProduct(data)
        } catch (e) {
          if (!cancelled) setError(e.message || 'Network error')
        } finally {
          if (!cancelled) setLoading(false)
        }
      })()
    return () => { cancelled = true }
  }, [slug])

  // Dérivés : on évite de recalculer si `product` n’a pas changé
  const inStock = useMemo(() => (product ? product.stock > 0 : false), [product])
  const maxQty = useMemo(() => (product ? Math.max(0, product.stock) : 0), [product])

  // Valide et applique la quantité saisie (toujours 1..stock)
  const onChangeQty = (v) => {
    const n = Math.max(1, Math.min(Number(v) || 1, maxQty || 1))
    setQ(n)
  }

  // Ajoute au panier en utilisant l’objet produit entier (utilisé côté CartContext)
  const onAdd = () => {
    if (product) add(product, qty)
  }

  return (
    <Container className="py-4">
      {/* État : chargement */}
      {loading && (
        <div className="d-flex align-items-center gap-2">
          <Spinner size="sm" /> Loading…
        </div>
      )}

      {/* État : erreur réseau / 404 */}
      {error && !loading && (
        <Alert variant="danger" className="my-3 d-flex justify-content-between align-items-center">
          <span>{error}</span>
          <Button as={Link} to="/shop" size="sm" variant="outline-light">
            Back to shop
          </Button>
        </Alert>
      )}

      {/* État : succès */}
      {!loading && !error && product && (
        <Row className="g-4">
          {/* Visuel produit — image responsive, coins arrondis + ombre douce */}
          <Col md={6}>
            <img
              src={product.img}
              alt={product.name}
              className="img-fluid rounded-20 shadow-soft"
              loading="eager"
            />
          </Col>

          {/* Détails + actions */}
          <Col md={6}>
            <div className="d-flex justify-content-between align-items-start">
              <h3 className="mb-1">{product.name}</h3>
              <Badge bg={inStock ? 'success' : 'danger'}>
                {inStock ? `${product.stock} left` : 'Out of stock'}
              </Badge>
            </div>

            <p className="text-muted mb-2">{product.category}</p>
            <p>{product.description}</p>

            <h4 className="mb-3">${Number(product.price).toFixed(2)}</h4>

            {/* Contrôle quantité + actions (UX : input large sur mobile) */}
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <input
                type="number"
                min="1"
                max={maxQty || 1}
                value={qty}
                disabled={!inStock}
                onChange={(e) => onChangeQty(e.target.value)}
                className="form-control"
                style={{ width: 120 }}
                aria-label="Quantity"
              />

              <Button variant="success" disabled={!inStock} onClick={onAdd}>
                Add to cart
              </Button>

              <Button as={Link} to="/shop" variant="outline-secondary">
                Back to shop
              </Button>
            </div>

            {!inStock && (
              <p className="text-muted small mt-2">
                This product is currently unavailable.
              </p>
            )}
          </Col>
        </Row>
      )}
    </Container>
  )
}
