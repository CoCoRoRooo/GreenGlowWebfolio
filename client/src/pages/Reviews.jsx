/**
 * ──────────────────────────────────────────────────────────────────────────────
 * client/src/pages/Reviews.jsx
 * ──────────────────────────────────────────────────────────────────────────────
 * Rôle :
 *  - Affiche les avis clients (reviews) venant de l’API.
 *  - Gère les états de chargement / erreur / succès.
 *  - Rend chaque review sous forme de carte avec étoiles.
 */

import { Container, Row, Col, Card, Alert, Spinner } from 'react-bootstrap'
import { useEffect, useState } from 'react'

export default function Reviews() {
  // État local : liste des avis
  const [reviews, setReviews] = useState([])
  // État local : suivi du chargement
  const [loading, setLoading] = useState(true)
  // État local : gestion des erreurs éventuelles
  const [error, setError] = useState(null)

  // Effet : se déclenche après le rendu initial pour charger les avis depuis l’API
  useEffect(() => {
    let cancelled = false
      ; (async () => {
        try {
          const res = await fetch('/api/reviews') // appel API REST
          if (!res.ok) throw new Error('Failed to load reviews')
          const data = await res.json()
          if (!cancelled) setReviews(data)
        } catch (e) {
          if (!cancelled) setError(e.message)
        } finally {
          if (!cancelled) setLoading(false)
        }
      })()
    // Nettoyage : si le composant est démonté avant la fin du fetch
    return () => { cancelled = true }
  }, [])

  return (
    <Container className="py-4">
      <h2>Customer Reviews</h2>

      {/* État : chargement */}
      {loading && (
        <div className="d-flex align-items-center gap-2">
          <Spinner size="sm" /> Loading…
        </div>
      )}

      {/* État : erreur */}
      {error && <Alert variant="danger" className="my-3">{error}</Alert>}

      {/* État : succès */}
      {!loading && !error && (
        <Row className="g-4 mt-2">
          {reviews.map(r => (
            <Col md={4} key={r.id}>
              <Card className="h-100 rounded-20 shadow-soft">
                <Card.Body>
                  {/* Titre carte = nom + étoiles */}
                  <Card.Title className="d-flex justify-content-between">
                    <span>{r.name}</span>
                    {/* Affichage des étoiles selon `r.stars` */}
                    <span>{'★'.repeat(r.stars)}{'☆'.repeat(5 - r.stars)}</span>
                  </Card.Title>
                  <Card.Text>{r.text}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          ))}

          {/* Cas : aucun avis disponible */}
          {reviews.length === 0 && (
            <Col>
              <Alert variant="secondary">No reviews available yet.</Alert>
            </Col>
          )}
        </Row>
      )}
    </Container>
  )
}
