/**
 * client/src/components/Section.jsx
 * Composant réutilisable "Section".
 * - Permet d’afficher un bloc de contenu avec un en-tête optionnel (kicker, titre, sous-titre).
 * - Sert à structurer visuellement différentes sections de la page (ex : home, features).
 */

import { Container } from 'react-bootstrap'

// Composant Section : wrapper générique avec un header optionnel
export default function Section({ kicker, title, subtitle, children }) {
    // Rendu du composant (JSX)
    return (
        <div className="section">
            <Container>
                {/* En-tête optionnel de la section */}
                {(title || subtitle || kicker) && (
                    <div className="section-header mb-4">
                        {/* kicker = petit texte introductif au-dessus du titre */}
                        {kicker && <div className="kicker mb-2">{kicker}</div>}
                        {/* Titre principal */}
                        {title && <h2 className="mb-2">{title}</h2>}
                        {/* Sous-titre en style lead */}
                        {subtitle && <p className="text-muted lead mb-0">{subtitle}</p>}
                    </div>
                )}

                {/* Contenu de la section (donné via children) */}
                {children}
            </Container>
        </div>
    )
}
