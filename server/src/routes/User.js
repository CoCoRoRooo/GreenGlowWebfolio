/** 
 * ──────────────────────────────────────────────────────────────────────────────
 * server/src/routes/User.js
 * ──────────────────────────────────────────────────────────────────────────────
 * Gestion de l’authentification et des utilisateurs.
 * - Inscription, login/logout
 * - Récupération du profil courant (/me)
 * - Mise à jour sécurisée du profil (changement email/mdp avec mot de passe actuel)
 * - Middlewares d’auth et d’admin pour protéger d’autres routes
 * ──────────────────────────────────────────────────────────────────────────────
 */

import express from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { prisma } from '../db/prisma.js'

const router = express.Router()

// ⚠️ À stocker dans process.env en production
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'

// Par défaut en HTTP (VPS actuel) : secure=false + SameSite=Lax
// Quand tu passeras en HTTPS : mettre COOKIE_SECURE=true -> secure=true + SameSite=None
function setAuthCookie(req, res, payload) {
    const jwtToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
    const secure = String(process.env.COOKIE_SECURE || '').toLowerCase() === 'true'

    res.cookie('auth', jwtToken, {
        httpOnly: true,
        secure,                    // false en HTTP, true en HTTPS
        sameSite: secure ? 'none' : 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
    })
}

/**
 * Middleware : requireAuth
 * Vérifie la présence d’un cookie JWT valide → attache l’objet user au req.
 */
export function requireAuth(req, res, next) {
    const token = req.cookies?.auth
    if (!token) return res.status(401).json({ error: 'Unauthenticated' })
    try {
        req.user = jwt.verify(token, JWT_SECRET)
        next()
    } catch {
        return res.status(401).json({ error: 'Invalid token' })
    }
}

/**
 * Middleware : requireAdmin
 * Exige que req.user.admin = true.
 */
export function requireAdmin(req, res, next) {
    if (!req.user?.admin) return res.status(403).json({ error: 'Forbidden' })
    next()
}

// ────────────────────────────────
// ROUTES PUBLIC/PRIVÉES
// ────────────────────────────────

/**
 * POST /api/register
 * Inscription d’un nouvel utilisateur.
 * - Vérifie unicité de l’email
 * - Hash du mot de passe avec bcrypt
 * - Renvoie l’utilisateur (sans password) + cookie JWT
 */
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body
        if (!email || !password) return res.status(400).json({ error: 'email et password requis' })

        const existing = await prisma.user.findUnique({ where: { email } })
        if (existing) return res.status(409).json({ error: 'Email déjà utilisé' })

        const hash = await bcrypt.hash(password, 12)
        const user = await prisma.user.create({
            data: { name, email, password: hash, admin: false },
            select: { id: true, email: true, name: true, admin: true },
        })

        setAuthCookie(req, res, { id: user.id, email: user.email, admin: user.admin })
        return res.status(201).json({ user })
    } catch (err) {
        console.error('register error:', err)
        res.status(500).json({ error: 'Server error' })
    }
})

/**
 * POST /api/login
 * Authentifie un utilisateur existant :
 * - Vérifie email et password avec bcrypt
 * - Retourne un cookie JWT et l’utilisateur (sans password)
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body
        if (!email || !password) return res.status(400).json({ error: 'email et password requis' })

        const user = await prisma.user.findUnique({ where: { email } })
        if (!user) return res.status(401).json({ error: 'Identifiants invalides' })

        const ok = await bcrypt.compare(password, user.password)
        if (!ok) return res.status(401).json({ error: 'Identifiants invalides' })

        const publicUser = { id: user.id, email: user.email, name: user.name, admin: user.admin }
        setAuthCookie(req, res, publicUser)
        return res.json({ user: publicUser })
    } catch (err) {
        console.error('login error:', err)
        res.status(500).json({ error: 'Server error' })
    }
})

/**
 * GET /api/me
 * Retourne le profil de l’utilisateur courant (à partir du JWT).
 */
router.get('/me', requireAuth, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { id: true, email: true, name: true, admin: true },
        })
        if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })
        res.json({ user })
    } catch (err) {
        console.error('me error:', err)
        res.status(500).json({ error: 'Server error' })
    }
})

/**
 * PATCH /api/me
 * Mise à jour sécurisée du profil utilisateur :
 * - Exige currentPassword (obligatoire)
 * - Vérifie l’ancien mot de passe
 * - Peut modifier name, email (unique) et/ou password
 * - Rafraîchit le JWT si email changé
 */
router.patch('/me', requireAuth, async (req, res) => {
    try {
        const { name, email, currentPassword, newPassword } = req.body || {}

        if (!currentPassword) {
            return res.status(400).json({ error: 'Mot de passe actuel requis' })
        }

        const me = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { id: true, email: true, name: true, admin: true, password: true },
        })
        if (!me) return res.status(404).json({ error: 'Utilisateur introuvable' })

        const ok = await bcrypt.compare(currentPassword, me.password)
        if (!ok) return res.status(401).json({ error: 'Mot de passe actuel invalide' })

        const data = {}
        if (typeof name === 'string') data.name = name.trim()

        if (typeof email === 'string' && email.trim() && email.trim() !== me.email) {
            const existing = await prisma.user.findUnique({ where: { email: email.trim() } })
            if (existing && existing.id !== me.id) {
                return res.status(409).json({ error: 'Email déjà utilisé' })
            }
            data.email = email.trim()
        }

        if (typeof newPassword === 'string' && newPassword.length > 0) {
            data.password = await bcrypt.hash(newPassword, 12)
        }

        if (Object.keys(data).length === 0) {
            return res.json({ user: { id: me.id, email: me.email, name: me.name, admin: me.admin } })
        }

        const updated = await prisma.user.update({
            where: { id: me.id },
            data,
            select: { id: true, email: true, name: true, admin: true },
        })

        if (updated.email !== me.email) {
            setAuthCookie(req, res, { id: updated.id, email: updated.email, admin: updated.admin })
        }

        return res.json({ user: updated })
    } catch (err) {
        console.error('update me error:', err)
        return res.status(500).json({ error: 'Server error' })
    }
})

/**
 * POST /api/logout
 * Supprime le cookie JWT côté client.
 */
router.post('/logout', (req, res) => {
    const secure = String(process.env.COOKIE_SECURE || '').toLowerCase() === 'true'
    res.clearCookie('auth', {
        httpOnly: true,
        secure,
        sameSite: secure ? 'none' : 'lax',
        path: '/',
    })
    res.json({ ok: true })
})

export default router
