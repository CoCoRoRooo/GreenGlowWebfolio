/**
 * Fichier : client/src/pages/admin/AdminStats.jsx
 * Rôle : Afficher l’évolution du chiffre des ventes des 6 derniers mois.
 * - Récupère les données via GET /api/stats (tableau [{ month, sales }]).
 * - Gère états réseau (loading/error) + affichage graphique (Recharts).
 */

import { useEffect, useState } from 'react'
import { Card, Alert, Spinner } from 'react-bootstrap'
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'

export default function AdminStats() {
    // Données + états réseau
    const [stats, setStats] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Chargement initial avec garde contre setState après unmount
    useEffect(() => {
        let cancelled = false
            ; (async () => {
                setLoading(true); setError(null)
                try {
                    const res = await fetch('/api/stats', { credentials: 'include' })
                    if (!res.ok) throw new Error('Failed to load statistics')
                    const data = await res.json()
                    if (!cancelled) setStats(Array.isArray(data) ? data : [])
                } catch (e) {
                    if (!cancelled) setError(e.message || 'Network error')
                } finally {
                    if (!cancelled) setLoading(false)
                }
            })()
        return () => { cancelled = true }
    }, [])

    if (loading) {
        return (
            <div className="d-flex align-items-center gap-2">
                <Spinner size="sm" /> Loading…
            </div>
        )
    }
    if (error) return <Alert variant="danger">{error}</Alert>

    // Affichage du graphique (ResponsiveContainer gère le responsive/mobile)
    return (
        <Card className="p-3 rounded-20 shadow-soft">
            <h5 className="mb-3">Monthly Sales (last 6 months)</h5>
            <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer>
                    <LineChart data={stats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        {/* Courbe principale : stats.sales ; type "monotone" lisse la courbe */}
                        <Line type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={3} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </Card>
    )
}
