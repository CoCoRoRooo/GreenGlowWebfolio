/**
 * Fichier : client/src/pages/Login.jsx
 * Rôle : page de connexion.
 * - Soumet email/mot de passe au context `auth.login()`.
 * - En cas de succès, redirige vers la page d’origine (`location.state?.from`) ou "/" par défaut.
 * - Affiche un message d’erreur si l’API renvoie une erreur (401, etc.).
 */

import { Container, Form, Button, Alert } from 'react-bootstrap'
import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/auth.jsx'

export default function Login() {
    const { login } = useAuth()                 // action de connexion (appelle /api/login dans le context)
    const [error, setError] = useState(null)    // message d’erreur à afficher (si login échoue)
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()
    const location = useLocation()
    const from = location.state?.from || '/'    // route cible après succès (fallback /)

    // Soumission du formulaire : délègue au context `login(email, password)`
    async function handleSubmit(e) {
        e.preventDefault()
        setError(null); setLoading(true)

        const form = e.currentTarget
        const email = form.email.value
        const password = form.password.value

        try {
            await login(email, password)            // gère credentials:'include' côté context
            navigate(from, { replace: true })       // remplace l’entrée /login dans l’historique
        } catch (err) {
            setError(err.message)                   // ex: "Identifiants invalides" renvoyé par l’API
        } finally {
            setLoading(false)
        }
    }

    return (
        <Container className="py-4" style={{ maxWidth: 500 }}>
            <h2 className="mb-4">Login</h2>

            {error && <Alert variant="danger" className="mb-3">{error}</Alert>}

            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="loginEmail">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                        type="email"
                        name="email"
                        placeholder="Enter your email"
                        autoComplete="email"
                        required
                    />
                </Form.Group>

                <Form.Group className="mb-3" controlId="loginPassword">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                        type="password"
                        name="password"
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        required
                    />
                </Form.Group>

                <Button variant="success" type="submit" className="w-100" disabled={loading}>
                    {loading ? 'Signing in…' : 'Sign in'}
                </Button>

                <div className="mt-3 text-center">
                    <small>
                        No account? <Link to="/register">Create one</Link>
                    </small>
                </div>
            </Form>
        </Container>
    )
}
