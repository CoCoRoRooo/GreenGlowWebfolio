/**
 * Fichier : client/src/pages/Gallery.jsx
 * Rôle : Afficher un portfolio / galerie d’images récupérées depuis l’API.
 * Points clés :
 *  - Chargement des données au montage via useEffect.
 *  - États "loading" / "error" gérés explicitement.
 *  - Affiche une grille responsive (Bootstrap <Row>/<Col>).
 */

import { useEffect, useState } from 'react'
import { Container, Row, Col, Card, Badge, Alert, Spinner } from 'react-bootstrap'

export default function Gallery() {
  // État local : liste d’items du portfolio
  const [items, setItems] = useState([])
  // Indicateur de chargement
  const [loading, setLoading] = useState(true)
  // Message d’erreur éventuel
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false // évite d’écrire dans le state si composant démonté

      ; (async () => {
        setLoading(true)
        setError(null)
        try {
          const res = await fetch('/api/portfolio')
          if (!res.ok) throw new Error('Failed to load portfolio')
          const data = await res.json()
          if (!cancelled) setItems(Array.isArray(data) ? data : [])
        } catch (e) {
          if (!cancelled) {
            setError(e.message || 'Network error')
            setItems([])
          }
        } finally {
          if (!cancelled) setLoading(false)
        }
      })()

    return () => { cancelled = true }
  }, [])

  return (
    <Container className="py-4">
      <h2>Portfolio / Gallery</h2>

      {/* États réseau */}
      {loading && (
        <div className="d-flex align-items-center gap-2">
          <Spinner size="sm" /> Loading…
        </div>
      )}

      {error && !loading && (
        <Alert variant="danger" className="my-3">{error}</Alert>
      )}

      {/* Liste d’items */}
      {!loading && !error && (
        items.length === 0 ? (
          <Alert variant="secondary" className="my-3">
            No portfolio items available yet.
          </Alert>
        ) : (
          <Row xs={1} md={3} className="g-4 mt-2">
            {items.map((it) => (
              <Col key={it.slug || it.id || it.imageUrl}>
                <Card className="h-100 rounded-20 shadow-soft">
                  <Card.Img src={it.imageUrl} alt={it.name} />
                  <Card.Body>
                    <Card.Title className="mb-1">{it.name}</Card.Title>

                    {/* Badges pour les tags associés */}
                    {it.tags?.length > 0 && (
                      <div className="d-flex gap-1 mb-2 flex-wrap">
                        {it.tags.map((t) => (
                          <Badge bg="success" key={t}>{t}</Badge>
                        ))}
                      </div>
                    )}

                    <Card.Text className="text-muted small mb-0">
                      {it.description}
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )
      )}
    </Container>
  )
}
