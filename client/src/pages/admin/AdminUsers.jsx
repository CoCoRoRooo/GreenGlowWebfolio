/**
 * Fichier : client/src/pages/admin/AdminUsers.jsx
 * Rôle : Gestion des utilisateurs côté admin.
 * - Liste paginée + recherche : GET /api/admin/users?search=&skip=&take=
 * - Édition d’un user (name/email/admin) : PATCH /api/admin/users/:id
 * - Reset mot de passe : POST /api/admin/users/:id/reset-password
 */

import { useEffect, useState } from 'react'
import { Card, Table, Button, Modal, Form, Spinner, Alert, Badge, InputGroup } from 'react-bootstrap'

export default function AdminUsers() {
    // Requête courante (filtres/pagination)
    const [query, setQuery] = useState({ search: '', skip: 0, take: 20 })
    // Données + états réseau
    const [rows, setRows] = useState([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Modale d’édition
    const [showEdit, setShowEdit] = useState(false)
    const [editing, setEditing] = useState(null)
    const [form, setForm] = useState({ name: '', email: '', admin: false })

    // Modale reset password
    const [showReset, setShowReset] = useState(false)
    const [newPass, setNewPass] = useState('')

    const canPrev = query.skip > 0
    const canNext = query.skip + query.take < total

    // Charge la liste selon `query`
    async function load() {
        setLoading(true); setError(null)
        try {
            const qs = new URLSearchParams()
            if (query.search) qs.set('search', query.search)
            qs.set('skip', query.skip); qs.set('take', query.take)

            const res = await fetch(`/api/admin/users?${qs.toString()}`, { credentials: 'include' })
            const data = await res.json()
            if (!res.ok) throw new Error(data?.error || 'Loading error')

            setRows(data.items || [])
            setTotal(data.total || 0)
        } catch (e) {
            setError(e.message || 'Network error')
            setRows([]); setTotal(0)
        } finally {
            setLoading(false)
        }
    }

    // Recharger quand la page change
    useEffect(() => { load() }, [query.skip, query.take]) // eslint-disable-line react-hooks/exhaustive-deps

    // Soumettre le filtre → revient à la page 1 et recharge
    const onSubmitSearch = (e) => { e.preventDefault(); setQuery(q => ({ ...q, skip: 0 })); load() }

    // Ouvrir l’éditeur avec les valeurs de l’utilisateur
    function openEdit(u) {
        setEditing(u)
        setForm({ name: u.name || '', email: u.email, admin: u.admin })
        setShowEdit(true)
    }

    // Sauvegarde des champs édités
    async function save(e) {
        e.preventDefault()
        try {
            const res = await fetch(`/api/admin/users/${editing.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(form)
            })
            const data = await res.json().catch(() => ({}))
            if (!res.ok) throw new Error(data?.error || 'Save failed')

            setShowEdit(false)
            await load()
        } catch (e2) {
            alert(e2.message)
        }
    }

    // Ouvrir la modale de reset
    function openReset(u) {
        setEditing(u)
        setNewPass('')
        setShowReset(true)
    }

    // Exécuter le reset mot de passe
    async function doReset(e) {
        e.preventDefault()
        try {
            const res = await fetch(`/api/admin/users/${editing.id}/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ newPassword: newPass })
            })
            const data = await res.json().catch(() => ({}))
            if (!res.ok) throw new Error(data?.error || 'Password reset failed')

            setShowReset(false)
        } catch (e2) {
            alert(e2.message)
        }
    }

    // Rendu principal (liste + pagination + modales)
    return (
        <Card className="p-3 rounded-20 shadow-soft">
            {/* Barre de recherche */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Users</h5>
                <Form onSubmit={onSubmitSearch} className="d-flex gap-2">
                    <InputGroup>
                        <Form.Control
                            placeholder="Search (name or email)"
                            value={query.search}
                            onChange={e => setQuery(q => ({ ...q, search: e.target.value }))}
                        />
                    </InputGroup>
                    <Button type="submit" variant="outline-secondary">Filter</Button>
                </Form>
            </div>

            {/* États réseau */}
            {loading && (
                <div className="d-flex align-items-center gap-2">
                    <Spinner size="sm" /> Loading…
                </div>
            )}
            {error && <Alert variant="danger">{error}</Alert>}

            {/* Tableau utilisateurs */}
            {!loading && !error && (
                <>
                    <Table hover responsive>
                        <thead>
                            <tr>
                                <th>#</th><th>Name</th><th>Email</th><th>Role</th><th>Created</th><th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map(u => (
                                <tr key={u.id}>
                                    <td>{u.id}</td>
                                    <td>{u.name || '—'}</td>
                                    <td>{u.email}</td>
                                    <td>{u.admin ? <Badge bg="success">Admin</Badge> : <Badge bg="secondary">User</Badge>}</td>
                                    <td>{new Date(u.createdAt).toLocaleString()}</td>
                                    <td className="text-end">
                                        <Button size="sm" variant="outline-primary" onClick={() => openEdit(u)}>Edit</Button>{' '}
                                        <Button size="sm" variant="outline-warning" onClick={() => openReset(u)}>Reset password</Button>
                                    </td>
                                </tr>
                            ))}
                            {rows.length === 0 && (
                                <tr><td colSpan={6} className="text-muted">No users.</td></tr>
                            )}
                        </tbody>
                    </Table>

                    {/* Pagination simple */}
                    <div className="d-flex justify-content-between">
                        <div>Total: {total}</div>
                        <div className="d-flex gap-2">
                            <Button
                                size="sm"
                                disabled={!canPrev}
                                onClick={() => setQuery(q => ({ ...q, skip: Math.max(0, q.skip - q.take) }))}
                            >
                                ←
                            </Button>
                            <Button
                                size="sm"
                                disabled={!canNext}
                                onClick={() => setQuery(q => ({ ...q, skip: q.skip + q.take }))}
                            >
                                →
                            </Button>
                        </div>
                    </div>
                </>
            )}

            {/* Modale d’édition */}
            <Modal show={showEdit} onHide={() => setShowEdit(false)}>
                <Form onSubmit={save}>
                    <Modal.Header closeButton>
                        <Modal.Title>Edit user #{editing?.id}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="row g-3">
                        <div className="col-md-6">
                            <Form.Label>Name</Form.Label>
                            <Form.Control
                                value={form.name}
                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            />
                        </div>
                        <div className="col-md-6">
                            <Form.Label>Email</Form.Label>
                            <Form.Control
                                type="email"
                                value={form.email}
                                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                required
                            />
                        </div>
                        <div className="col-12">
                            <Form.Check
                                type="switch"
                                id="is-admin"
                                label="Administrator"
                                checked={!!form.admin}
                                onChange={e => setForm(f => ({ ...f, admin: e.target.checked }))}
                            />
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowEdit(false)}>Cancel</Button>
                        <Button type="submit">Save</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Modale reset password */}
            <Modal show={showReset} onHide={() => setShowReset(false)}>
                <Form onSubmit={doReset}>
                    <Modal.Header closeButton>
                        <Modal.Title>Reset password</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form.Label>New password</Form.Label>
                        <Form.Control
                            value={newPass}
                            onChange={e => setNewPass(e.target.value)}
                            type="password"
                            minLength={6}
                            required
                        />
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowReset(false)}>Cancel</Button>
                        <Button type="submit" variant="warning">Reset</Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Card>
    )
}
