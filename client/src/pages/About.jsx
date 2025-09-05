/**
 * Fichier : client/src/pages/About.jsx
 * Rôle : Page statique "About" (présentation du projet).
 * Notes :
 *  - Composant très simple : pas d’état ni d’effet.
 *  - Utilise <Container> de React-Bootstrap pour gérer les marges et la largeur.
 */

import { Container } from 'react-bootstrap'

export default function About() {
  // Rendu simple et sémantique (h2 + paragraphe)
  return (
    <Container className="py-4" style={{ maxWidth: 800 }}>
      <h2 className="mb-3">About GreenGlow</h2>
      <p className="text-muted">
        GreenGlow is a demo storefront built with React, React-Bootstrap, and an Express + Prisma API.
        It showcases a polished, mobile-friendly UI, real product listings, and a minimal auth + cart flow
        suitable for portfolio demonstrations.
      </p>
      <p className="text-muted mb-0">
        Images are sourced from Unsplash/Pexels for visual appeal. No real payments are processed—checkout
        is intentionally mocked for demo purposes.
      </p>
    </Container>
  )
}
