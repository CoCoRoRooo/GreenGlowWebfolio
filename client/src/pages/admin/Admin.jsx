/**
 * Fichier : client/src/pages/admin/Admin.jsx
 * Rôle : Layout admin responsive.
 * - Desktop : sidebar fixe verticale à gauche.
 * - Mobile : Offcanvas latéral avec bouton d’ouverture, fermeture au clic.
 * - Protège l’accès (auth + admin) avant d’afficher <Outlet />.
 */

import { useState } from 'react'
import { Outlet, Navigate, NavLink } from 'react-router-dom'
import { useAuth } from '../../context/auth.jsx'
import { Container, Nav, Button, Offcanvas } from 'react-bootstrap'

export default function AdminLayout() {
  const { user, loading } = useAuth()

  // 1) Attendre résolution auth
  if (loading) return null
  // 2) Auth requise
  if (!user) return <Navigate to="/login" replace />
  // 3) Rôle admin requis
  if (!user.admin) return <Navigate to="/" replace />

  // État du menu latéral en mobile (Offcanvas)
  const [showMenu, setShowMenu] = useState(false)
  const openMenu = () => setShowMenu(true)
  const closeMenu = () => setShowMenu(false)

  // Composant commun : liste des liens (réutilisé dans desktop + offcanvas)
  const AdminLinks = () => (
    <Nav className="flex-column gap-1">
      <Nav.Link
        as={NavLink}
        to="/admin/stats"
        onClick={closeMenu}
        className={({ isActive }) => isActive ? 'active fw-semibold' : undefined}
      >
        📊 Statistics
      </Nav.Link>
      <Nav.Link
        as={NavLink}
        to="/admin/faq"
        onClick={closeMenu}
        className={({ isActive }) => isActive ? 'active fw-semibold' : undefined}
      >
        ❓ FAQ
      </Nav.Link>
      <Nav.Link
        as={NavLink}
        to="/admin/reviews"
        onClick={closeMenu}
        className={({ isActive }) => isActive ? 'active fw-semibold' : undefined}
      >
        ⭐ Reviews
      </Nav.Link>
      <Nav.Link
        as={NavLink}
        to="/admin/products"
        onClick={closeMenu}
        className={({ isActive }) => isActive ? 'active fw-semibold' : undefined}
      >
        📦 Products
      </Nav.Link>
      <Nav.Link
        as={NavLink}
        to="/admin/users"
        onClick={closeMenu}
        className={({ isActive }) => isActive ? 'active fw-semibold' : undefined}
      >
        👤 Users
      </Nav.Link>
      <Nav.Link
        as={NavLink}
        to="/admin/sales"
        onClick={closeMenu}
        className={({ isActive }) => isActive ? 'active fw-semibold' : undefined}
      >
        💰 Sales
      </Nav.Link>
    </Nav>
  )

  return (
    <Container fluid className="py-4">
      {/* En-tête mobile : bouton d’ouverture du menu admin */}
      <div className="d-md-none d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Admin</h3>
        <Button variant="outline-secondary" onClick={openMenu}>
          Admin menu
        </Button>
      </div>

      <div className="d-flex">
        {/* Sidebar desktop (fixe à gauche dès md) */}
        <aside
          className="d-none d-md-block bg-light p-3 rounded-3 shadow-sm"
          style={{ minWidth: 220, maxHeight: 'calc(100vh - 4rem)', position: 'sticky', top: '1.5rem' }}
        >
          <h5 className="mb-3">Admin Panel</h5>
          <AdminLinks />
        </aside>

        {/* Contenu */}
        <main className="flex-grow-1 ms-md-4">
          <Outlet />
        </main>
      </div>

      {/* Offcanvas mobile */}
      <Offcanvas show={showMenu} onHide={closeMenu} placement="start">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Admin Panel</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <AdminLinks />
        </Offcanvas.Body>
      </Offcanvas>
    </Container>
  )
}
