/**
 * client/src/context/auth.jsx
 * Contexte d’authentification (AuthContext).
 * - Centralise la gestion de l’utilisateur connecté (login, register, logout, refresh).
 * - Fournit l’état `user`, `loading`, `error` et les fonctions associées.
 * - Utilisé par l’ensemble de l’app via le Provider.
 */

import { createContext, useContext, useEffect, useState } from 'react'

// Création du contexte d’auth (valeur par défaut : null)
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    // État local : utilisateur connecté (ou null)
    const [user, setUser] = useState(null)
    // Indique si une requête d’auth est en cours (utile pour affichage conditionnel)
    const [loading, setLoading] = useState(true)
    // Contient une erreur éventuelle (ex : mauvais mot de passe)
    const [error, setError] = useState(null)

    // Rafraîchir la session (vérifie si l’utilisateur est connecté via /api/me)
    async function refresh() {
        try {
            setError(null)
            const res = await fetch('/api/me', {
                method: 'GET',
                credentials: 'include', // ⚠️ Important pour envoyer le cookie JWT
                headers: { 'Content-Type': 'application/json' },
            })
            if (res.ok) {
                const data = await res.json()
                setUser(data.user) // utilisateur connecté trouvé
            } else {
                setUser(null) // pas connecté
            }
        } catch {
            setUser(null) // en cas d’erreur réseau ou serveur
        } finally {
            setLoading(false)
        }
    }

    // Connexion utilisateur
    async function login(email, password) {
        setError(null)
        const res = await fetch('/api/login', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        })
        if (!res.ok) {
            const data = await res.json().catch(() => ({}))
            throw new Error(data?.error || 'Login failed')
        }
        const data = await res.json()
        setUser(data.user) // on stocke l’utilisateur connecté
        return data.user
    }

    // Inscription utilisateur
    async function register(name, email, password) {
        setError(null)
        const res = await fetch('/api/register', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password }),
        })
        if (!res.ok) {
            const data = await res.json().catch(() => ({}))
            throw new Error(data?.error || 'Registration failed')
        }
        const data = await res.json()
        setUser(data.user) // on connecte directement l’utilisateur après inscription
        return data.user
    }

    // Déconnexion utilisateur
    async function logout() {
        setError(null)
        await fetch('/api/logout', {
            method: 'POST',
            credentials: 'include',
        })
        setUser(null) // suppression du user local
    }

    // Exécuté au montage du provider → on tente de récupérer l’utilisateur en session
    useEffect(() => {
        refresh()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Fournit les valeurs et fonctions aux composants enfants
    return (
        <AuthContext.Provider value={{ user, loading, error, login, register, logout, refresh }}>
            {children}
        </AuthContext.Provider>
    )
}

// Hook custom : permet d’accéder au contexte d’auth dans n’importe quel composant
export const useAuth = () => useContext(AuthContext)
