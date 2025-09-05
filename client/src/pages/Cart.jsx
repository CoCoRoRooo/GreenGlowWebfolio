/**
 * Fichier : client/src/pages/Cart.jsx
 * Rôle : Page d’affichage et gestion du panier (quantités, suppression, vidage, total).
 * Notes :
 *  - Récupère l’état global du panier via le contexte `useCart`.
 *  - Permet de modifier les quantités, supprimer un produit, vider le panier.
 *  - Affiche le total et un bouton pour passer au checkout.
 */

import { Container, Table, Button } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/cart.jsx'

export default function Cart() {
  // Contexte du panier : items = produits ajoutés
  // setQty = modifier quantité | remove = supprimer produit | clear = vider panier | total = prix total
  const { items, setQty, remove, clear, total } = useCart()
  const nav = useNavigate()

  return (
    <Container className="py-4">
      <h2>Cart</h2>

      {/* Cas : panier vide */}
      {items.length === 0 ? (
        <p>Your cart is empty. <Link to="/shop">Go shopping</Link>.</p>
      ) : (
        <>
          {/* Tableau listant les produits du panier */}
          <div className="rounded-20 shadow-soft p-3">
            <Table responsive hover className="align-middle">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map(i => (
                  <tr key={i.slug}>
                    {/* Cellule produit : image + nom */}
                    <td className="d-flex align-items-center gap-2">
                      <img
                        src={i.img}
                        width="56"
                        height="56"
                        style={{ objectFit: 'cover', borderRadius: 12 }}
                        alt={i.name}
                      />
                      {i.name}
                    </td>

                    {/* Cellule quantité : champ numérique modifiable */}
                    <td style={{ maxWidth: 120 }}>
                      <input
                        type="number"
                        min="1"
                        max="99"
                        value={i.qty}
                        onChange={e => setQty(i.slug, e.target.value)}
                        className="form-control form-control-sm"
                      />
                    </td>

                    {/* Prix total pour cet article */}
                    <td>${(Number(i.price) * i.qty).toFixed(2)}</td>

                    {/* Bouton suppression */}
                    <td>
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => remove(i.slug)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          {/* Total + bouton vider panier */}
          <div className="d-flex justify-content-between">
            <Button variant="outline-secondary" onClick={clear}>Clear cart</Button>
            <div className="h5">Total: ${total.toFixed(2)}</div>
          </div>

          {/* Bouton vers checkout */}
          <div className="mt-3 text-end">
            <Button onClick={() => nav('/checkout')} variant="success">
              Proceed to Checkout
            </Button>
          </div>
        </>
      )}
    </Container>
  )
}
