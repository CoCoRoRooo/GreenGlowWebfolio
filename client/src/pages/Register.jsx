/**
 * Fichier : client/src/pages/Register.jsx
 * Rôle : page d’inscription.
 * - Soumet name/email/password à `auth.register()`.
 * - En cas de succès, redirige vers la home ("/").
 * - Affiche une erreur si l’API renvoie une anomalie (conflit email, etc.).
 */

import { Container, Form, Button, Alert } from 'react-bootstrap'
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/auth.jsx'

export default function Register() {
    const { register } = useAuth()                 // action d’inscription (POST /api/register dans le context)
    const [error, setError] = useState(null)       // message d’erreur API
    const [loading, setLoading] = useState(false)  // état de soumission
    const navigate = useNavigate()

    // Soumission du formulaire : délègue au context `register(name, email, password)`
    async function handleSubmit(e) {
        e.preventDefault()
        setError(null); setLoading(true)

        const form = e.currentTarget
        const name = form.name.value
        const email = form.email.value
        const password = form.password.value

        try {
            await register(name, email, password)      // gère credentials côté context + setUser
            navigate('/', { replace: true })           // retour home (remplace l’entrée /register)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Container className="py-4" style={{ maxWidth: 500 }}>
            <h2 className="mb-4">Register</h2>

            {error && <Alert variant="danger" className="mb-3">{error}</Alert>}

            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="registerName">
                    <Form.Label>Name</Form.Label>
                    <Form.Control
                        type="text"
                        name="name"
                        placeholder="Your name"
                        autoComplete="name"
                    />
                </Form.Group>

                <Form.Group className="mb-3" controlId="registerEmail">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                        type="email"
                        name="email"
                        placeholder="Your email"
                        autoComplete="email"
                        required
                    />
                </Form.Group>

                <Form.Group className="mb-3" controlId="registerPassword">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                        type="password"
                        name="password"
                        placeholder="Choose a password"
                        autoComplete="new-password"
                        required
                    />
                </Form.Group>

                <Button variant="primary" type="submit" className="w-100" disabled={loading}>
                    {loading ? 'Creating…' : 'Create account'}
                </Button>

                <div className="mt-3 text-center">
                    <small>
                        Already have an account? <Link to="/login">Sign in</Link>
                    </small>
                </div>
            </Form>
        </Container>
    )
}
