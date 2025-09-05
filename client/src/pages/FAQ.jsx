/**
 * Fichier : client/src/pages/FAQ.jsx
 * Rôle : Afficher la liste des FAQ venant de l’API.
 * Points clés :
 *  - Charge les données au montage via useEffect.
 *  - Affiche états "loading" / "error".
 *  - Utilise <Accordion> ; l’item 0 est ouvert par défaut.
 */

import { Container, Accordion, Alert, Spinner } from 'react-bootstrap'
import { useEffect, useState } from 'react'

export default function FAQ() {
  // Données, états réseau
  const [faqs, setFaqs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Astuce "cancelled" : évite de setState si le composant est démonté
    let cancelled = false

      ; (async () => {
        try {
          const res = await fetch('/api/faqs')
          if (!res.ok) throw new Error('Failed to load FAQs')
          const data = await res.json()
          if (!cancelled) setFaqs(Array.isArray(data) ? data : [])
        } catch (e) {
          if (!cancelled) setError(e.message || 'Network error')
        } finally {
          if (!cancelled) setLoading(false)
        }
      })()

    return () => { cancelled = true }
  }, [])

  return (
    <Container className="py-4">
      <h2>FAQ</h2>

      {/* États réseau */}
      {loading && (
        <div className="d-flex align-items-center gap-2">
          <Spinner size="sm" /> Loading…
        </div>
      )}
      {error && <Alert variant="danger" className="my-3">{error}</Alert>}

      {/* Liste des questions/réponses */}
      {!loading && !error && (
        <Accordion
          /* Ouvre la première entrée si disponible */
          defaultActiveKey={faqs[0]?.id?.toString() ?? undefined}
        >
          {faqs.map((f) => (
            <Accordion.Item key={f.id} eventKey={f.id.toString()}>
              <Accordion.Header>{f.question}</Accordion.Header>
              <Accordion.Body>{f.answer}</Accordion.Body>
            </Accordion.Item>
          ))}
          {faqs.length === 0 && (
            <div className="text-muted p-3">No FAQ available.</div>
          )}
        </Accordion>
      )}
    </Container>
  )
}
