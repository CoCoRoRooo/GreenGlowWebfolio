/**
 * Fichier : client/src/pages/Checkout.jsx
 * Rôle : Page de paiement (factice) où l’utilisateur confirme sa commande.
 * Notes :
 *  - Récupère le panier global via `useCart`.
 *  - Simule un paiement en envoyant les articles à l’API `/api/checkout`.
 *  - Affiche un formulaire d’adresse + message de succès/erreur.
 */

import { useState } from 'react'
import { Container, Form, Button, Alert } from 'react-bootstrap'
import { useCart } from '../context/cart.jsx'

export default function Checkout() {
  const { items, total, clear } = useCart()

  // Status du paiement : { type, msg } affiché comme une alerte Bootstrap
  const [status, setStatus] = useState(null)

  // Fonction appelée quand l’utilisateur clique sur "Pay"
  const onPay = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // important : inclut le cookie JWT si l’utilisateur est connecté
        body: JSON.stringify({ items })
      })

      if (res.status === 401) {
        // Cas : utilisateur non connecté → erreur
        setStatus({ type: 'danger', msg: 'Please log in to complete your order.' })
        return
      }

      const data = await res.json()
      if (data.success) {
        // Cas succès → vider panier + afficher confirmation
        setStatus({ type: 'success', msg: 'Payment successful (test mode). Order confirmed!' })
        clear()
      } else {
        // Cas erreur renvoyée par l’API
        setStatus({ type: 'danger', msg: data.error })
      }
    } catch (err) {
      setStatus({ type: 'danger', msg: 'Unexpected error during checkout.' })
    }
  }

  return (
    <Container className="py-4">
      <h2>Checkout (Test)</h2>

      {/* Message de succès/erreur */}
      {status && <Alert variant={status.type}>{status.msg}</Alert>}

      {/* Formulaire factice (infos non stockées, juste pour la démo) */}
      <Form onSubmit={onPay} className="row g-3">
        <div className="col-md-6">
          <Form.Label>Full name</Form.Label>
          <Form.Control required placeholder="John Doe" />
        </div>
        <div className="col-md-6">
          <Form.Label>Email</Form.Label>
          <Form.Control type="email" required placeholder="john@example.com" />
        </div>
        <div className="col-12">
          <Form.Label>Address</Form.Label>
          <Form.Control required placeholder="123 Main St" />
        </div>
        <div className="col-md-6">
          <Form.Label>City</Form.Label>
          <Form.Control required />
        </div>
        <div className="col-md-3">
          <Form.Label>ZIP</Form.Label>
          <Form.Control required />
        </div>
        <div className="col-md-3">
          <Form.Label>Country</Form.Label>
          <Form.Control required />
        </div>

        {/* Total + bouton paiement */}
        <div className="col-12 d-flex justify-content-between align-items-center">
          <div className="fw-semibold">Total: ${total.toFixed(2)}</div>
          <Button type="submit" variant="success">Pay with Stripe (Test)</Button>
        </div>
      </Form>

      {/* Note explicative */}
      <p className="text-muted small mt-3">
        This is a mock checkout for portfolio screenshots. No real payment is processed.
      </p>
    </Container>
  )
}
