/**
 * Fichier : client/src/pages/admin/AdminProducts.jsx
 * Rôle : gestion des produits (liste + recherche/pagination + création/édition/suppression).
 * - GET /api/admin/products?search=&category=&skip=&take= pour la liste.
 * - POST /api/admin/products pour créer, PATCH /api/admin/products/:id pour éditer.
 * - DELETE /api/admin/products/:id pour supprimer.
 * - Modale avec formulaire contrôlé pour créer/éditer.
 */

import { useEffect, useState } from 'react'
import { Card, Table, Button, Modal, Form, InputGroup, Spinner, Alert } from 'react-bootstrap'

export default function AdminProducts() {
    // Query côté UI (recherche/filtre/pagination)
    const [query, setQuery] = useState({ search: '', category: '', skip: 0, take: 20 })
    // Données + états réseau
    const [rows, setRows] = useState([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // État du formulaire (modale) : `editing === null` => création
    const [showModal, setShowModal] = useState(false)
    const [editing, setEditing] = useState(null)
    const [form, setForm] = useState({
        slug: '',
        name: '',
        price: 0,
        category: '',
        img: '',
        description: '',
        stock: 0
    })

    const canPrev = query.skip > 0
    const canNext = query.skip + query.take < total

    // Chargement de la liste (filtrée/paginée)
    async function load() {
        setLoading(true); setError(null)
        try {
            const qs = new URLSearchParams()
            if (query.search) qs.set('search', query.search)
            if (query.category) qs.set('category', query.category)
            qs.set('skip', query.skip); qs.set('take', query.take)

            const res = await fetch(`/api/admin/products?${qs.toString()}`, { credentials: 'include' })
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

    // Monte + pagination (skip/take) → recharge
    useEffect(() => { load() }, [query.skip, query.take]) // eslint-disable-line react-hooks/exhaustive-deps

    // Soumission du filtre
    const onSubmitSearch = (e) => {
        e.preventDefault()
        setQuery(q => ({ ...q, skip: 0 }))
        load()
    }

    // Ouvre la modale en mode création
    function openCreate() {
        setEditing(null)
        setForm({ slug: '', name: '', price: 0, category: '', img: '', description: '', stock: 0 })
        setShowModal(true)
    }

    // Ouvre la modale en mode édition
    function openEdit(p) {
        setEditing(p)
        setForm({
            slug: p.slug,
            name: p.name,
            price: p.price,
            category: p.category,
            img: p.img,
            description: p.description,
            stock: p.stock
        })
        setShowModal(true)
    }

    // Création / Édition
    async function save(e) {
        e.preventDefault()
        try {
            const url = editing ? `/api/admin/products/${editing.id}` : '/api/admin/products'
            const method = editing ? 'PATCH' : 'POST'
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(form)
            })
            const data = await res.json().catch(() => ({}))
            if (!res.ok) throw new Error(data?.error || 'Save failed')
            setShowModal(false)
            await load()
        } catch (e2) {
            alert(e2.message)
        }
    }

    // Suppression
    async function remove(id) {
        if (!confirm('Delete this product?')) return
        try {
            const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE', credentials: 'include' })
            const data = await res.json().catch(() => ({}))
            if (!res.ok) throw new Error(data?.error || 'Deletion failed')
            load()
        } catch (e) {
            alert(e.message)
        }
    }

    return (
        <Card className="p-3 rounded-20 shadow-soft">
            {/* Barre d’actions : filtre + bouton "Add" */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Products</h5>
                <div className="d-flex gap-2">
                    <Form onSubmit={onSubmitSearch} className="d-flex gap-2">
                        <InputGroup>
                            <Form.Control
                                placeholder="Search…"
                                value={query.search}
                                onChange={e => setQuery(q => ({ ...q, search: e.target.value }))}
                            />
                        </InputGroup>
                        <Form.Control
                            placeholder="Category"
                            value={query.category}
                            onChange={e => setQuery(q => ({ ...q, category: e.target.value }))}
                        />
                        <Button type="submit" variant="outline-secondary">Filter</Button>
                    </Form>
                    <Button onClick={openCreate}>+ Add</Button>
                </div>
            </div>

            {/* États réseau */}
            {loading && (
                <div className="d-flex align-items-center gap-2">
                    <Spinner size="sm" /> Loading…
                </div>
            )}
            {error && <Alert variant="danger">{error}</Alert>}

            {/* Tableau des produits */}
            {!loading && !error && (
                <>
                    <Table hover responsive>
                        <thead>
                            <tr>
                                <th>#</th><th>Slug</th><th>Name</th><th>Cat.</th><th>Price</th><th>Stock</th><th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map(p => (
                                <tr key={p.id}>
                                    <td>{p.id}</td>
                                    <td>{p.slug}</td>
                                    <td>{p.name}</td>
                                    <td>{p.category}</td>
                                    <td>{Number(p.price).toFixed(2)}</td>
                                    <td>{p.stock}</td>
                                    <td className="text-end">
                                        <Button size="sm" variant="outline-primary" onClick={() => openEdit(p)}>Edit</Button>{' '}
                                        <Button size="sm" variant="outline-danger" onClick={() => remove(p.id)}>Delete</Button>
                                    </td>
                                </tr>
                            ))}
                            {rows.length === 0 && (
                                <tr><td colSpan={7} className="text-muted">No products.</td></tr>
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

            {/* Modale de création/édition */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Form onSubmit={save}>
                    <Modal.Header closeButton>
                        <Modal.Title>{editing ? 'Edit product' : 'New product'}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="row g-3">
                        <div className="col-md-6">
                            <Form.Label>Slug</Form.Label>
                            <Form.Control
                                value={form.slug}
                                onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                                required
                            />
                        </div>
                        <div className="col-md-6">
                            <Form.Label>Name</Form.Label>
                            <Form.Control
                                value={form.name}
                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                required
                            />
                        </div>
                        <div className="col-md-4">
                            <Form.Label>Price</Form.Label>
                            <Form.Control
                                type="number"
                                step="0.01"
                                value={form.price}
                                onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
                                required
                            />
                        </div>
                        <div className="col-md-4">
                            <Form.Label>Category</Form.Label>
                            <Form.Control
                                value={form.category}
                                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                            />
                        </div>
                        <div className="col-md-4">
                            <Form.Label>Stock</Form.Label>
                            <Form.Control
                                type="number"
                                value={form.stock}
                                onChange={e => setForm(f => ({ ...f, stock: Number(e.target.value) }))}
                            />
                        </div>
                        <div className="col-12">
                            <Form.Label>Image URL</Form.Label>
                            <Form.Control
                                value={form.img}
                                onChange={e => setForm(f => ({ ...f, img: e.target.value }))}
                            />
                        </div>
                        <div className="col-12">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={4}
                                value={form.description}
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            />
                        </div>
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
