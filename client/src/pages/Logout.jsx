/**
 * client/src/pages/Logout.jsx
 * Page technique qui déclenche la déconnexion.
 * - Dès que le composant est monté, on appelle logout() (contexte auth).
 * - Puis redirection immédiate vers l’accueil.
 * - Pas de rendu d’UI (return null).
 */

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/auth.jsx'

export default function Logout() {
    const { logout } = useAuth()
    const navigate = useNavigate()

    // Effet déclenché au montage : exécute logout() puis redirige
    useEffect(() => {
        (async () => {
            await logout()
            navigate('/', { replace: true }) // replace empêche retour via bouton "précédent"
        })()
    }, [logout, navigate])

    // Pas de rendu (composant purement fonctionnel)
    return null
}
