/**
 * Fichier : client/src/pages/Contact.jsx
 * Rôle : Page "Contact" avec un formulaire simple (non connecté à une API).
 * Notes :
 *  - Formulaire contrôlé côté client pour illustrer le pattern (state local).
 *  - Pas d’appel réseau ici : c’est une démo UI. À connecter si besoin.
 */

import { useState } from 'react'
import { Container, Form, Button, Alert } from 'react-bootstrap'

export default function Contact() {
  // État local du formulaire — pattern contrôlé (utile si validation ou envoi API plus tard)
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [sent, setSent] = useState(false)

  const onChange = (e) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  const onSubmit = (e) => {
    e.preventDefault()
    // Ici, on simule un envoi → à remplacer par fetch('/api/contact', { ... }) si besoin.
    setSent(true)
    setForm({ name: '', email: '', message: '' })
    // NB: si tu ajoutes un backend, vérifie res.ok et gère les erreurs comme dans les autres pages.
  }

  return (
    <Container className="py-4">
      <h2 className="mb-3">Contact</h2>

      {/* Feedback visuel après "envoi" */}
      {sent && (
        <Alert variant="success" onClose={() => setSent(false)} dismissible>
          Message sent. We’ll get back to you soon.
        </Alert>
      )}

      {/* maxWidth pour limiter la largeur de lecture sur grands écrans */}
      <Form onSubmit={onSubmit} className="mt-3" style={{ maxWidth: 560 }}>
        <Form.Group className="mb-3" controlId="contactName">
          <Form.Label>Name</Form.Label>
          <Form.Control
            name="name"
            value={form.name}
            onChange={onChange}
            placeholder="Your name"
            required
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="contactEmail">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            name="email"
            value={form.email}
            onChange={onChange}
            placeholder="you@example.com"
            required
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="contactMessage">
          <Form.Label>Message</Form.Label>
          <Form.Control
            as="textarea"
            rows={4}
            name="message"
            value={form.message}
            onChange={onChange}
            placeholder="How can we help?"
            required
          />
          <Form.Text className="text-muted">
            Please avoid sharing sensitive information.
          </Form.Text>
        </Form.Group>

        <Button type="submit" variant="success">Send</Button>
      </Form>
    </Container>
  )
}
