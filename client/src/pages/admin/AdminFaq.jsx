/**
 * Fichier : client/src/pages/admin/AdminFaq.jsx
 * Rôle : gestion des FAQ dans l’admin (liste + création/édition/suppression).
 * - Charge la liste via GET /api/faqs.
 * - Crée/édite via POST/PATCH /api/faqs(/:id).
 * - Supprime via DELETE /api/faqs/:id.
 * - Modale pour l’édition/création avec formulaire contrôlé.
 */

import { useEffect, useState } from 'react'
import { Card, Table, Button, Modal, Form, Spinner, Alert, Badge } from 'react-bootstrap'

export default function AdminFaq() {
    // État principal : liste, chargement, erreur
    const [faqs, setFaqs] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // État du formulaire (modale) : création si `editing === null`
    const [showModal, setShowModal] = useState(false)
    const [editing, setEditing] = useState(null)
    const [form, setForm] = useState({ question: '', answer: '', ordering: 0, published: true })

    // Ouvre la modale en mode création
    function openCreate() {
        setEditing(null)
        setForm({ question: '', answer: '', ordering: 0, published: true })
        setShowModal(true)
    }

    // Ouvre la modale en mode édition
    function openEdit(f) {
        setEditing(f)
        setForm({ question: f.question, answer: f.answer, ordering: f.ordering, published: f.published })
        setShowModal(true)
    }

    // Récupération des FAQ depuis l’API
    async function load() {
        setLoading(true); setError(null)
        try {
            const res = await fetch('/api/faqs', { credentials: 'include' })
            if (!res.ok) throw new Error('Loading error')
            const data = await res.json()
            setFaqs(Array.isArray(data) ? data : [])
        } catch (e) {
            setError(e.message || 'Network error')
            setFaqs([])
        } finally {
            setLoading(false)
        }
    }

    // Charger au montage
    useEffect(() => { load() }, [])

    // Création / Édition
    async function save(e) {
        e.preventDefault()
        try {
            const method = editing ? 'PATCH' : 'POST'
            const url = editing ? `/api/faqs/${editing.id}` : '/api/faqs'
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    question: form.question,
                    answer: form.answer,
                    ordering: Number(form.ordering) || 0,
                    published: !!form.published
                })
            })
            if (!res.ok) throw new Error('Save failed')
            setShowModal(false)
            await load()
        } catch (e) {
            alert(e.message)
        }
    }

    // Suppression
    async function remove(id) {
        if (!confirm('Delete this FAQ entry?')) return
        const res = await fetch(`/api/faqs/${id}`, { method: 'DELETE', credentials: 'include' })
        if (res.ok) load()
        else alert('Deletion failed')
    }

    return (
        <Card className="p-3 rounded-20 shadow-soft">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">FAQ</h5>
                <Button onClick={openCreate}>+ Add</Button>
            </div>

            {loading && (
                <div className="d-flex align-items-center gap-2">
                    <Spinner size="sm" /> Loading…
                </div>
            )}
            {error && <Alert variant="danger">{error}</Alert>}

            {!loading && !error && (
                <Table hover responsive>
                    <thead>
                        <tr>
                            <th>#</th><th>Question</th><th>Published</th><th>Order</th><th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {faqs.map(f => (
                            <tr key={f.id}>
                                <td>{f.id}</td>
                                <td>{f.question}</td>
                                <td>{f.published ? <Badge bg="success">Yes</Badge> : <Badge bg="secondary">No</Badge>}</td>
                                <td>{f.ordering}</td>
                                <td className="text-end">
                                    <Button size="sm" variant="outline-primary" onClick={() => openEdit(f)}>Edit</Button>{' '}
                                    <Button size="sm" variant="outline-danger" onClick={() => remove(f.id)}>Delete</Button>
                                </td>
                            </tr>
                        ))}
                        {faqs.length === 0 && (
                            <tr><td colSpan={5} className="text-muted">No entries.</td></tr>
                        )}
                    </tbody>
                </Table>
            )}

            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Form onSubmit={save}>
                    <Modal.Header closeButton>
                        <Modal.Title>{editing ? 'Edit FAQ' : 'Add FAQ'}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Question</Form.Label>
                            <Form.Control
                                value={form.question}
                                onChange={e => setForm({ ...form, question: e.target.value })}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Answer</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={4}
                                value={form.answer}
                                onChange={e => setForm({ ...form, answer: e.target.value })}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Order</Form.Label>
                            <Form.Control
                                type="number"
                                value={form.ordering}
                                onChange={e => setForm({ ...form, ordering: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Check
                            type="switch"
                            id="faq-published"
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
