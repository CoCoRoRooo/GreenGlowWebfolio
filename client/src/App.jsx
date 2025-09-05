/**
 * Fichier : client/src/App.jsx
 * But : Point d’entrée UI. Monte Auth/Cart providers, rend la TopNav (avec Offcanvas en mobile),
 *       déclare les routes publiques + admin, et empêche l’accès à /login /register si déjà connecté.
 *
 * Points clés :
 * - Navbar responsive : <Navbar.Offcanvas> ouvre un panneau latéral en mobile (placement="start").
 * - Les liens admin n’apparaissent que si user.admin === true (côté UI).
 * - <RedirectIfAuth> redirige un utilisateur déjà connecté hors de /login /register.
 */

// Imports principaux : bibliothèques UI/routage + composants/pages/contexts utilisés dans ce fichier
import { Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom'
import { Navbar, Nav, Container, Badge, Button, Offcanvas } from 'react-bootstrap'

import Home from './pages/Home.jsx'
import Shop from './pages/Shop.jsx'
import Product from './pages/Product.jsx'
import About from './pages/About.jsx'
import Contact from './pages/Contact.jsx'
import FAQ from './pages/FAQ.jsx'
import Gallery from './pages/Gallery.jsx'
import Reviews from './pages/Reviews.jsx'
import Cart from './pages/Cart.jsx'
import Checkout from './pages/Checkout.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Logout from './pages/Logout.jsx'
import Profile from './pages/Profile.jsx'

import AdminLayout from './pages/admin/Admin'
import AdminStats from './pages/admin/AdminStats'
import AdminFaq from './pages/admin/AdminFaq'
import AdminReviews from './pages/admin/AdminReviews'
import AdminProducts from './pages/admin/AdminProducts'
import AdminUsers from './pages/admin/AdminUsers'
import AdminSales from './pages/admin/AdminSales'

import { useState } from 'react'
import { AuthProvider, useAuth } from './context/auth.jsx'
import { CartProvider, useCart } from './context/cart.jsx'

/**
 * TopNav
 * - Desktop : navbar étendue (expand="lg")
 * - Mobile : bouton burger ouvre un Offcanvas (menu latéral) avec tous les liens + actions de compte
 */
function TopNav() {
  const { items } = useCart()            // items du panier (context cart)
  const { user } = useAuth()             // user courant (context auth) ou null
  const navigate = useNavigate()         // navigation impérative (pour le bouton Cart)
  const count = items.reduce((s, i) => s + i.qty, 0) // total qty pour le badge
  const [showMenu, setShowMenu] = useState(false)   // <- contrôle l'Offcanvas
  const openMenu = () => setShowMenu(true)
  const closeMenu = () => setShowMenu(false)

  // JSX : structure de la vue ; les { } injectent des expressions JS
  return (
    <Navbar expand="lg" className="bg-white border-bottom sticky-top">
      <Container>
        {/* Brand → retour Home (SPA) */}
        <Navbar.Brand as={Link} to="/">GreenGlow</Navbar.Brand>

        {/* Bouton burger (visible sous lg) */}
        <Navbar.Toggle aria-controls="main-offcanvas" onClick={openMenu} />

        {/* Offcanvas : menu latéral en mobile ; en desktop, il se comporte comme un collapse */}
        <Navbar.Offcanvas
          id="main-offcanvas"
          aria-labelledby="offcanvasNavbarLabel"
          placement="start"
          show={showMenu}
          onHide={closeMenu}
        >
          <Offcanvas.Header closeButton>
            <Offcanvas.Title id="offcanvasNavbarLabel">Menu</Offcanvas.Title>
          </Offcanvas.Header>

          <Offcanvas.Body>
            {/* Liens principaux à gauche */}
            <Nav className="me-auto">
              <Nav.Link as={Link} onClick={closeMenu} to="/">Home</Nav.Link>
              <Nav.Link as={Link} onClick={closeMenu} to="/shop">Shop</Nav.Link>
              <Nav.Link as={Link} onClick={closeMenu} to="/gallery">Portfolio</Nav.Link>
              <Nav.Link as={Link} onClick={closeMenu} to="/faq">FAQ</Nav.Link>
              <Nav.Link as={Link} onClick={closeMenu} to="/reviews">Reviews</Nav.Link>
              <Nav.Link as={Link} onClick={closeMenu} to="/about">About</Nav.Link>
              <Nav.Link as={Link} onClick={closeMenu} to="/contact">Contact</Nav.Link>
              {user?.admin && <Nav.Link as={Link} onClick={closeMenu} to="/admin">Admin</Nav.Link>}
            </Nav>

            {/* Actions compte + Cart à droite (s’affichent aussi dans l’Offcanvas en mobile) */}
            <div className="d-flex align-items-center gap-3">
              {!user ? (
                <>
                  <Nav.Link as={Link} onClick={closeMenu} to="/login">Login</Nav.Link>
                  <Nav.Link as={Link} onClick={closeMenu} to="/register">Register</Nav.Link>
                </>
              ) : (
                <>
                  <span className="me-2">
                    Hello, <strong>{user.name || user.email}</strong>
                  </span>
                  <Nav.Link as={Link} onClick={closeMenu} to="/profile">Profile</Nav.Link>
                </>
              )}

              {/* Bouton Cart : navigation impérative → /cart */}
              <Button variant="success" onClick={() => navigate('/cart')}>
                Cart <Badge bg="light" text="dark">{count}</Badge>
              </Button>
            </div>
          </Offcanvas.Body>
        </Navbar.Offcanvas>
      </Container>
    </Navbar>
  )
}

/** Footer simple avec l’année courante et liens (placeholders) */
function Footer() {
  return (
    <div className="footer border-top mt-5">
      <Container className="py-4 d-flex justify-content-between small text-muted">
        <span>© {new Date().getFullYear()} GreenGlow</span>
        <div className="d-flex gap-3">
          <a href="#">Instagram</a><a href="#">X</a><a href="#">LinkedIn</a>
        </div>
      </Container>
    </div>
  )
}

/**
 * RedirectIfAuth
 * - Si la session charge encore : affiche un petit fallback
 * - Si déjà connecté : redirige vers "/"
 * - Sinon : rend le formulaire enfant (Login/Register)
 */
function RedirectIfAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="p-4">Checking session…</div>
  return user ? <Navigate to="/" replace /> : children
}

/**
 * App
 * - Monte les providers Auth/Cart pour que tous les composants sous-jacents
 *   puissent consommer `useAuth()` et `useCart()`.
 * - Déclare toutes les routes ; le bloc /admin est un layout imbriqué.
 */
export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <TopNav />

        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:slug" element={<Product />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />

          {/* Empêcher l’accès si déjà connecté */}
          <Route path="/login" element={<RedirectIfAuth><Login /></RedirectIfAuth>} />
          <Route path="/register" element={<RedirectIfAuth><Register /></RedirectIfAuth>} />

          {/* Divers */}
          <Route path="/logout" element={<Logout />} />
          <Route path="/profile" element={<Profile />} />

          {/* Admin (layout + sous-routes) */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminStats />} />
            <Route path="stats" element={<AdminStats />} />
            <Route path="faq" element={<AdminFaq />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="sales" element={<AdminSales />} />
          </Route>
        </Routes>

        <Footer />
      </CartProvider>
    </AuthProvider>
  )
}