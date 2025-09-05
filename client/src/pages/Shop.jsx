/**
 * client/src/pages/Shop.jsx
 * Liste des produits avec recherche côté client.
 * - Charge les produits via l'API.
 * - Gère loading / error.
 * - Filtre localement selon la requête utilisateur.
 * Remarque UX: en mobile, le champ de recherche prend toute la largeur.
 */

import { useEffect, useState, useMemo } from 'react'
import { Container, Row, Col, Card, Button, Form, Alert, Spinner } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { useCart } from '../context/cart.jsx'

export default function Shop() {
  // Données produits et états réseau
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // État du filtre texte (recherche simple par nom)
  const [query, setQuery] = useState('')

  // Accès au panier via contexte
  const { add } = useCart()

  // Effet: charger les produits au montage
  useEffect(() => {
    let cancelled = false
      ; (async () => {
        setLoading(true)
        setError(null)
        try {
          const res = await fetch('/api/products')
          if (!res.ok) throw new Error('Failed to load products')
          const data = await res.json()
          if (!cancelled) setProducts(data || [])
        } catch (e) {
          if (!cancelled) {
            setError(e.message || 'Network error')
            setProducts([])
          }
        } finally {
          if (!cancelled) setLoading(false)
        }
      })()
    // Nettoyage si démontage pendant le fetch
    return () => { cancelled = true }
  }, [])

  // Mémo: produits filtrés par `query` (évite de recalculer à chaque rendu)
  const filtered = useMemo(
    () => products.filter(p => p.name.toLowerCase().includes(query.toLowerCase())),
    [products, query]
  )

  return (
    <Container className="py-4">
      {/* Barre titre + recherche ; en mobile, le champ s’étire sur toute la largeur */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3">
        <h2 className="mb-0">Shop</h2>
        <Form className="w-100" style={{ maxWidth: 320 }}>
          <Form.Control
            size="sm"
            type="search"
            placeholder="Search products..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </Form>
      </div>

      {/* États réseau */}
      {loading && (
        <div className="d-flex align-items-center gap-2">
          <Spinner size="sm" /> Loading…
        </div>
      )}
      {error && !loading && (
        <Alert variant="danger" className="my-3">
          {error}
        </Alert>
      )}

      {/* Contenu principal */}
      {!loading && !error && (
        <>
          {filtered.length === 0 ? (
            <Alert variant="secondary">No products found.</Alert>
          ) : (
            <Row xs={1} md={3} className="g-4">
              {filtered.map(p => (
                <Col key={p.id}>
                  <Card className="product-card h-100">
                    {/* Image produit */}
                    <Card.Img variant="top" src={p.img} alt={p.name} />

                    <Card.Body className="d-flex flex-column">
                      {/* En-tête : titre + badge stock */}
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <Card.Title className="mb-0">{p.name}</Card.Title>
                        <span
                          className={`badge ${p.stock > 0 ? 'bg-success' : 'bg-danger'}`}
                          style={{ fontSize: '0.75rem' }}
                        >
                          {p.stock > 0 ? `${p.stock} left` : 'Out of stock'}
                        </span>
                      </div>

                      <Card.Text className="text-muted small mb-2">{p.category}</Card.Text>

                      {/* Pied de carte : prix + actions */}
                      <div className="d-flex justify-content-between align-items-center mt-auto">
                        <span className="price">
                          ${Number(p.price).toFixed(2)}
                        </span>

                        <div className="d-flex align-items-center gap-2">
                          {/* Champ quantité : bloqué si rupture de stock */}
                          <input
                            type="number"
                            min="1"
                            max={p.stock}
                            defaultValue={1}
                            disabled={p.stock === 0}
                            onClick={e => e.stopPropagation()} // évite de cliquer la carte par accident
                            className="form-control form-control-sm"
                            style={{ width: 72 }}
                          />

                          {/* Ajout au panier : lit la valeur de l’input précédent */}
                          <Button
                            size="sm"
                            variant="success"
                            disabled={p.stock === 0}
                            onClick={(e) => {
                              e.stopPropagation()
                              const q = Number(e.currentTarget.previousSibling.value || 1)
                              add(p, q)
                            }}
                          >
                            Add
                          </Button>

                          {/* Lien vers la page produit */}
                          <Button
                            size="sm"
                            variant="outline-secondary"
                            as={Link}
                            to={`/product/${p.slug}`}
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </>
      )}
    </Container>
  )
}
