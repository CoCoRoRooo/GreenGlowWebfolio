/**
 * Fichier : client/src/pages/admin/AdminReviews.jsx
 * Rôle : Gestion des avis (reviews) côté admin.
 * - Récupère la liste des avis via GET /api/reviews
 * - Permet la modification via PATCH /api/reviews/:id
 * - Permet la suppression via DELETE /api/reviews/:id
 * - Affiche une table des avis avec un modal pour éditer.
 */

import { useEffect, useState } from 'react'
import { Card, Table, Button, Modal, Form, Spinner, Alert, Badge } from 'react-bootstrap'

export default function AdminReviews() {
    // Données et états réseau
    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Gestion du formulaire (modale)
    const [showModal, setShowModal] = useState(false)
    const [editing, setEditing] = useState(null) // Avis en cours d’édition
    const [form, setForm] = useState({ name: '', text: '', stars: 5, published: true })

    // Ouvrir la modale en mode édition
    function openEdit(r) {
        setEditing(r)
        setForm({ name: r.name ?? '', text: r.text, stars: r.stars, published: r.published })
        setShowModal(true)
    }

    // Charger la liste des reviews
    async function load() {
        setLoading(true); setError(null)
        try {
            const res = await fetch('/api/reviews', { credentials: 'include' })
            if (!res.ok) throw new Error('Loading error')
            const data = await res.json()
            setRows(Array.isArray(data) ? data : [])
        } catch (e) {
            setError(e.message || 'Network error')
            setRows([])
        } finally {
            setLoading(false)
        }
    }

    // Chargement initial (au montage)
    useEffect(() => { load() }, [])

    // Sauvegarder un avis modifié
    async function save(e) {
        e.preventDefault()
        if (!editing) return // Ici uniquement édition (pas de création côté admin)
        const res = await fetch(`/api/reviews/${editing.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                name: form.name,
                text: form.text,
                stars: Number(form.stars),
                published: !!form.published
            })
        })
        if (!res.ok) return alert('Save failed')
        setShowModal(false)
        load()
    }

    // Supprimer un avis
    async function remove(id) {
        if (!confirm('Delete this review?')) return
        const res = await fetch(`/api/reviews/${id}`, { method: 'DELETE', credentials: 'include' })
        if (!res.ok) return alert('Deletion failed')
        load()
    }

    return (
        <Card className="p-3 rounded-20 shadow-soft">
            {/* Header de la page */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Reviews</h5>
                {/* Si tu veux gérer la création côté admin : ajouter un bouton + Add */}
            </div>

            {/* États réseau */}
            {loading && (
                <div className="d-flex align-items-center gap-2">
                    <Spinner size="sm" /> Loading…
                </div>
            )}
            {error && <Alert variant="danger">{error}</Alert>}

            {/* Tableau des reviews */}
            {!loading && !error && (
                <Table hover responsive>
                    <thead>
                        <tr>
                            <th>#</th><th>Name</th><th>Text</th><th>★</th><th>Published</th><th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(r => (
                            <tr key={r.id}>
                                <td>{r.id}</td>
                                <td>{r.name || '—'}</td>
                                <td className="text-truncate" style={{ maxWidth: 360 }}>{r.text}</td>
                                <td>{r.stars}</td>
                                <td>
                                    {r.published
                                        ? <Badge bg="success">Yes</Badge>
                                        : <Badge bg="secondary">No</Badge>}
                                </td>
                                <td className="text-end">
                                    <Button size="sm" variant="outline-primary" onClick={() => openEdit(r)}>Edit</Button>{' '}
                                    <Button size="sm" variant="outline-danger" onClick={() => remove(r.id)}>Delete</Button>
                                </td>
                            </tr>
                        ))}
                        {rows.length === 0 && (
                            <tr>
                                <td colSpan={6} className="text-muted">No reviews.</td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            )}

            {/* Modale d’édition */}
            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Form onSubmit={save}>
                    <Modal.Header closeButton>
                        <Modal.Title>Edit review #{editing?.id}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Name (optional)</Form.Label>
                            <Form.Control
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Text</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={4}
                                value={form.text}
                                onChange={e => setForm({ ...form, text: e.target.value })}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Stars (1–5)</Form.Label>
                            <Form.Control
                                type="number"
                                min="1"
                                max="5"
                                value={form.stars}
                                onChange={e => setForm({ ...form, stars: e.target.value })}
                                required
                            />
                        </Form.Group>
                        <Form.Check
                            type="switch"
                            id="review-published"
                            label="Published"
                            checked={!!form.published}
                            onChange={e => setForm({ ...form, published: e.target.checked })}
                        />
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button type="submit">Save</Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Card>
    )
}
