/**
 * client/src/main.jsx
 * Point d’entrée du front React.
 * - Monte l’app dans le DOM (#root).
 * - Enveloppe App avec BrowserRouter (routage côté client).
 * - Active React.StrictMode (aide au repérage d’anti-patterns en dev).
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'

// CSS global : Bootstrap puis styles de marque (ordre important pour pouvoir surcharger)
import 'bootstrap/dist/css/bootstrap.min.css'
import './assets/brand.css'

// Rendu racine : on crée la "root" React à partir du conteneur #root
ReactDOM.createRoot(document.getElementById('root')).render(
  // StrictMode n’affecte que le DEV : double-appel de certains effets pour détecter des erreurs potentielles
  <React.StrictMode>
    {/* Fournit le contexte d’historique/navigation à toutes les routes de App */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
