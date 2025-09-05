/**
 * Fichier : client/src/pages/admin/AdminSales.jsx
 * Rôle : Liste et filtrage des ventes côté admin (+ détail d’une vente).
 * - GET /api/admin/sales?from=&to=&userId=&skip=&take=
 * - GET /api/admin/sales/:id (détail : items + user)
 * - Filtre par date et userId, pagination simple, modale de détail.
 */

import { useEffect, useState } from 'react'
import { Card, Table, Button, Modal, Form, Spinner, Alert, InputGroup } from 'react-bootstrap'

export default function AdminSales() {
    // Filtres et pagination côté UI
    const [filters, setFilters] = useState({ from: '', to: '', userId: '', skip: 0, take: 20 })
    // Données + états réseau
    const [rows, setRows] = useState([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    // Détail de vente (ouvrira la modale)
    const [detail, setDetail] = useState(null)

    const canPrev = filters.skip > 0
    const canNext = filters.skip + filters.take < total

    // Charge la liste en fonction des filtres/pagination
    async function load() {
        setLoading(true); setError(null)
        try {
            const qs = new URLSearchParams()
            if (filters.from) qs.set('from', filters.from)
            if (filters.to) qs.set('to', filters.to)
            if (filters.userId) qs.set('userId', filters.userId)
            qs.set('skip', filters.skip)
            qs.set('take', filters.take)

            const res = await fetch(`/api/admin/sales?${qs.toString()}`, { credentials: 'include' })
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

    // Recharger quand la page (skip/take) change
    useEffect(() => { load() }, [filters.skip, filters.take]) // eslint-disable-line react-hooks/exhaustive-deps

    // Soumission du formulaire de filtres → réinitialise à la 1re page puis charge
    const onSubmitFilters = (e) => {
        e.preventDefault()
        setFilters(f => ({ ...f, skip: 0 }))
        load()
    }

    // Charge le détail d'une vente (affiche ensuite la modale)
    async function openDetail(id) {
        try {
            const res = await fetch(`/api/admin/sales/${id}`, { credentials: 'include' })
            const data = await res.json()
            if (!res.ok) throw new Error(data?.error || 'Unable to load sale details')
            setDetail(data)
        } catch (e) {
            alert(e.message)
        }
    }

    return (
        <Card className="p-3 rounded-20 shadow-soft">
            {/* Barre de filtres */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Sales</h5>
                <Form onSubmit={onSubmitFilters} className="d-flex flex-wrap gap-2">
                    <Form.Control
                        type="date"
                        value={filters.from}
                        onChange={e => setFilters(f => ({ ...f, from: e.target.value }))}
                    />
                    <Form.Control
                        type="date"
                        value={filters.to}
                        onChange={e => setFilters(f => ({ ...f, to: e.target.value }))}
                    />
                    <InputGroup>
                        <InputGroup.Text>User ID</InputGroup.Text>
                        <Form.Control
                            value={filters.userId}
                            onChange={e => setFilters(f => ({ ...f, userId: e.target.value }))}
                            placeholder="e.g. 1"
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

            {/* Tableau des ventes */}
            {!loading && !error && (
                <>
                    <Table hover responsive>
                        <thead>
                            <tr>
                                <th>#</th><th>Date</th><th>User</th><th>Total</th><th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map(s => (
                                <tr key={s.id}>
                                    <td>{s.id}</td>
                                    <td>{new Date(s.createdAt).toLocaleString()}</td>
                                    <td>{s.user ? (s.user.name || s.user.email) : '—'}</td>
                                    <td>${Number(s.total).toFixed(2)}</td>
                                    <td className="text-end">
                                        <Button size="sm" variant="outline-primary" onClick={() => openDetail(s.id)}>
                                            Details
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {rows.length === 0 && (
                                <tr><td colSpan={5} className="text-muted">No sales.</td></tr>
                            )}
                        </tbody>
                    </Table>

                    {/* Pagination */}
                    <div className="d-flex justify-content-between">
                        <div>Total: {total}</div>
                        <div className="d-flex gap-2">
                            <Button
                                size="sm"
                                disabled={!canPrev}
                                onClick={() => setFilters(f => ({ ...f, skip: Math.max(0, f.skip - f.take) }))}
                            >
                                ←
                            </Button>
                            <Button
                                size="sm"
                                disabled={!canNext}
                                onClick={() => setFilters(f => ({ ...f, skip: f.skip + f.take }))}
                            >
                                →
                            </Button>
                        </div>
                    </div>
                </>
            )}

            {/* Modale de détail de vente */}
            <Modal show={!!detail} onHide={() => setDetail(null)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Sale #{detail?.id}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {detail ? (
                        <>
                            <p><b>Date:</b> {new Date(detail.createdAt).toLocaleString()}</p>
                            <p>
                                <b>Customer:</b>{' '}
                                {detail.user ? `${detail.user.name || ''} <${detail.user.email}>` : '—'}
                            </p>

                            <Table size="sm" responsive>
                                <thead>
                                    <tr><th>Product</th><th>Price</th><th>Qty</th><th>Subtotal</th></tr>
                                </thead>
                                <tbody>
                                    {detail.items.map(it => (
                                        <tr key={it.id}>
                                            <td>{it.product?.name} ({it.product?.slug})</td>
                                            <td>${Number(it.price).toFixed(2)}</td>
                                            <td>{it.qty}</td>
                                            <td>${Number(it.price * it.qty).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>

                            <p className="text-end fs-5">
                                <b>Total:</b> ${Number(detail.total).toFixed(2)}
                            </p>
                        </>
                    ) : '…'}
                </Modal.Body>
            </Modal>
        </Card>
    )
}
