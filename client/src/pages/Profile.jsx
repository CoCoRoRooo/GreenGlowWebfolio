/**
 * Fichier : client/src/pages/Profile.jsx
 * Rôle : page profil pour utilisateur connecté.
 * - Pré-remplit le formulaire avec les infos de l’utilisateur (name/email).
 * - Exige le *mot de passe actuel* pour confirmer toute modification (sécurité).
 * - Permet de changer le mot de passe (champ facultatif).
 * - Fournit un bouton de logout.
 *
 * Flux :
 * 1) Au montage ou quand `user` change : si pas connecté → redirection /login ; sinon pré-remplissage du formulaire.
 * 2) Submit : PATCH /api/me (credentials: 'include'), puis refresh du contexte auth, message de succès, purge des champs sensibles.
 * 3) Logout : POST /api/logout (géré par `logout()` du context), puis redirection.
 */

import { Container, Form, Button, Alert } from 'react-bootstrap'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/auth.jsx'

export default function Profile() {
    // Contexte d'auth : `user` (profil minimal), `refresh()` (recharge /api/me), `logout()` (efface cookie côté back)
    const { user, refresh, logout } = useAuth()
    const navigate = useNavigate()

    // State local du formulaire (valeurs contrôlées)
    const [form, setForm] = useState({ name: '', email: '', currentPassword: '', newPassword: '' })
    const [loading, setLoading] = useState(false)     // true pendant l'envoi PATCH /api/me
    const [error, setError] = useState(null)          // message d'erreur API ou réseau
    const [success, setSuccess] = useState(null)      // message de succès après update

    // Pré-remplissage et garde de navigation :
    // - si pas d'utilisateur → redirection /login
    // - sinon, hydratation du formulaire avec les valeurs actuelles
    useEffect(() => {
        if (!user) {
            navigate('/login')
        } else {
            setForm({
                name: user.name || '',
                email: user.email,
                currentPassword: '',
                newPassword: ''
            })
        }
    }, [user, navigate])

    // Handler générique pour les inputs contrôlés
    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    // Submit du formulaire : met à jour le profil côté API
    async function handleSubmit(e) {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setSuccess(null)
        try {
            const res = await fetch('/api/me', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', // indispensable : envoie le cookie JWT
                body: JSON.stringify(form)
            })
            const data = await res.json().catch(() => ({}))
            if (!res.ok) throw new Error(data?.error || 'Update failed')

            await refresh() // recharge `user` dans le contexte (nouvel email, etc.)
            setSuccess('Profile updated successfully ✅')
            // on efface les champs sensibles après succès
            setForm(f => ({ ...f, currentPassword: '', newPassword: '' }))
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    // Déconnexion via le contexte, puis retour à l'accueil
    async function handleLogout() {
        await logout()
        navigate('/')
    }

    // Pendant la redirection de l'effet, on peut ne rien afficher
    if (!user) return null

    return (
        <Container className="py-4" style={{ maxWidth: 520 }}>
            <h2 className="mb-4">My profile</h2>

            {/* Messages API */}
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            {/* Formulaire contrôlé */}
            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="profileName">
                    <Form.Label>Name</Form.Label>
                    <Form.Control
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Your name"
                    />
                </Form.Group>

                <Form.Group className="mb-3" controlId="profileEmail">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="Your email"
                    />
                </Form.Group>

                <hr />

                {/* Sécurité : mot de passe actuel requis pour toute modification */}
                <Form.Group className="mb-3" controlId="profileCurrentPassword">
                    <Form.Label>
                        Current password <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                        type="password"
                        name="currentPassword"
                        value={form.currentPassword}
                        onChange={handleChange}
                        placeholder="Required to confirm changes"
                        required
                    />
                    <Form.Text className="text-muted">
                        For security reasons, please re-enter your current password to confirm changes.
                    </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3" controlId="profileNewPassword">
                    <Form.Label>New password</Form.Label>
                    <Form.Control
                        type="password"
                        name="newPassword"
                        value={form.newPassword}
                        onChange={handleChange}
                        placeholder="Leave empty to keep your password"
                        autoComplete="new-password"
                    />
                </Form.Group>

                <Button
                    type="submit"
                    variant="primary"
                    disabled={loading || !form.currentPassword}
                    className="w-100"
                >
                    {loading ? 'Updating…' : 'Update profile'}
                </Button>
            </Form>

            <hr />

            <Button variant="danger" className="w-100 mt-2" onClick={handleLogout}>
                Log out
            </Button>
        </Container>
    )
}
