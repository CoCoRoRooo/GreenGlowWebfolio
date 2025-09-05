/**
 * Fichier : client/src/pages/Home.jsx
 * Rôle : Page d’accueil (hero + section de features).
 * Points clés :
 *  - Mise en page responsive Bootstrap (Row/Col).
 *  - Liens d’appel à l’action (CTA) vers Shop / Gallery.
 *  - Section réutilisable <Section> pour présenter des features.
 */

import { Container, Row, Col, Button, Card } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import Section from '../components/Section'

export default function Home() {
  // Le fragment <> ... </> permet de retourner plusieurs blocs sans wrapper inutile.
  return (
    <>
      {/* Bandeau d’intro (hero) : message fort + visuel */}
      <div className="hero d-flex align-items-center">
        <Container>
          <Row className="align-items-center">
            {/* Colonne texte : badge, titre, pitch, CTA */}
            <Col lg={6}>
              {/* Badge de contexte/positionnement */}
              <span className="badge badge-gg text-white mb-3">Eco-friendly</span>

              {/* Titre principal : hiérarchie H1 pour SEO/accessibilité */}
              <h1 className="display-5 fw-bold">Sustainable goods for everyday life</h1>

              {/* Accroche : ton clair et concis */}
              <p className="lead text-muted">
                Green Today, Brighter Tomorrow.
              </p>

              {/* CTAs : navigation interne avec Link (pas de rechargement de page) */}
              <div className="d-flex gap-3 flex-wrap">
                <Button as={Link} to="/shop" size="lg" variant="success">
                  Browse Shop
                </Button>
                <Button as={Link} to="/gallery" size="lg" variant="outline-success">
                  See Portfolio
                </Button>
              </div>
            </Col>

            {/* Colonne image : carte contenant l’illustration (arrondis + ombre via .hero-card) */}
            <Col lg={6} className="mt-4 mt-lg-0">
              <Card className="hero-card p-3">
                <img
                  className="img-fluid rounded-20"
                  alt="Sustainable lifestyle hero"
                  src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1600&auto=format&fit=crop"
                  loading="eager" /* image clé du above-the-fold */
                />
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Section réutilisable : titre + sous-titre + grille de features */}
      <Section
        kicker="Why GreenGlow"
        title="Better design, better conversions"
        subtitle="Fast, responsive, accessible."
      >
        <Row className="g-4">
          {[
            { t: 'Modern UI', d: 'Clean layout, premium palette, sharp typography.' },
            { t: 'E-commerce ready', d: 'Cart, mock checkout, product detail.' },
            { t: 'Production-minded', d: 'Express API, pagination-ready, real photos.' },
          ].map((f, i) => (
            <Col md={4} key={i}>
              {/* Carte simple : titre + description */}
              <Card className="h-100 p-3">
                <h5 className="mb-2">{f.t}</h5>
                <p className="text-muted mb-0">{f.d}</p>
              </Card>
            </Col>
          ))}
        </Row>
      </Section>
    </>
  )
}
