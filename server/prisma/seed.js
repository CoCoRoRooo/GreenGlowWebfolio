/**
 * ──────────────────────────────────────────────────────────────────────────────
 * server/prisma/seed.js
 * ──────────────────────────────────────────────────────────────────────────────
 * Script de "seed" (ensemencement) de la base :
 * - Crée ou met à jour des utilisateurs, produits, éléments de portfolio, FAQ,
 *   et quelques avis (reviews) démonstratifs.
 * - Idéal pour démarrer un environnement de dev/test reproductible.
 *
 * Points clés :
 * - On utilise PRISMA "upsert" pour être idempotent (réexécutable sans erreurs) :
 *   si l'élément existe (via "where"), on fait "update", sinon "create".
 * - Les mots de passe sont hashés (bcrypt) : *ne jamais* stocker du clair.
 * - L’ordre de création est important quand il y a des relations (ex : Review
 *   a besoin d’un user et d’un product existants).
 * ──────────────────────────────────────────────────────────────────────────────
 */

import bcrypt from 'bcryptjs'
import { prisma } from '../src/db/prisma.js' // Client Prisma connecté à ta DB

// --- Données de démonstration (modifiables facilement) -----------------------
// Produits : slugs uniques (utilisés dans les URLs et les upserts)
const products = [
    { slug: 'eco-bottle', name: 'Eco Bottle', price: 19.90, category: 'Accessories', img: '/images/sara-groblechner-h10-NImYZHs-unsplash.jpg', description: 'Reusable bottle made from recycled materials.', stock: 20 },
    { slug: 'bamboo-toothbrush', name: 'Bamboo Toothbrush', price: 4.90, category: 'Hygiene', img: '/images/sara-groblechner-7TgbRVEYdYY-unsplash.jpg', description: 'Soft bristles, compostable handle.', stock: 12 },
    { slug: 'metal-straw-set', name: 'Metal Straw Set', price: 9.90, category: 'Kitchen', img: '/images/blair-yang-VyXMd13O1qE-unsplash.jpg', description: 'Set of 4 stainless steel straws + brush.', stock: 41 },
    { slug: 'reusable-bag', name: 'Reusable Bag', price: 7.50, category: 'Accessories', img: '/images/kelly-sikkema-1Pgq9ZpIatI-unsplash.jpg', description: 'Durable tote bag for daily use.', stock: 49 },
    { slug: 'solar-charger', name: 'Solar Charger', price: 39.00, category: 'Electronics', img: '/images/evnex-ltd-QjZqEIrTy1c-unsplash.jpg', description: 'Charge devices with sunlight.', stock: 99 },
    { slug: 'organic-soap', name: 'Organic Soap', price: 5.90, category: 'Hygiene', img: '/images/aurelia-dubois-6J0MUsmS4fQ-unsplash.jpg', description: 'Natural ingredients, gentle on skin.', stock: 148 },
    { slug: 'wooden-cutlery', name: 'Wooden Cutlery', price: 6.50, category: 'Kitchen', img: '/images/clair-Mv3yxyI_OY4-unsplash.jpg', description: 'Reusable wooden cutlery set.', stock: 12 },
    { slug: 'recycled-notebook', name: 'Recycled Notebook', price: 8.90, category: 'Stationery', img: '/images/daian-gan-8_d05sj9JVc-unsplash.jpg', description: 'Notebook made from recycled paper.', stock: 45 },
    { slug: 'thermal-mug', name: 'Thermal Mug', price: 14.90, category: 'Kitchen', img: '/images/sean-thoman-smtcdXmvZTI-unsplash.jpg', description: 'Keep drinks hot or cold longer.', stock: 67 },
    { slug: 'led-bulb', name: 'LED Bulb', price: 3.90, category: 'Electronics', img: '/images/federico-bottos-TuAtSs8peoM-unsplash.jpg', description: 'Energy-saving LED bulb.', stock: 7 },
]

// Portfolio (galerie) : slugs uniques, utilisé pour l’upsert
const imgs = [
    { slug: 'eco-store-landing', name: 'Eco Store Landing', imageUrl: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=1200&auto=format&fit=crop', description: 'Modern landing page for an eco-friendly shop.', tags: ['React', 'Bootstrap', 'Landing'] },
    { slug: 'catalog-grid', name: 'Catalog Grid', imageUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop', description: 'Responsive product grid with filters.', tags: ['React', 'Grid', 'UI'] },
    { slug: 'checkout-flow', name: 'Checkout Flow', imageUrl: 'https://images.unsplash.com/photo-1470770903676-69b98201ea1c?q=80&w=1200&auto=format&fit=crop', description: 'Smooth checkout flow (Stripe mock).', tags: ['Checkout', 'Stripe', 'UX'] }
]

// -----------------------------------------------------------------------------
// main() : point d’entrée du script de seed
// - Crée des users (avec bcrypt pour les mots de passe)
// - Crée/Met à jour des products, portfolio, FAQ
// - Ajoute des reviews (nécessite que users + products existent)
// -----------------------------------------------------------------------------
async function main() {
    // 1) USERS — on crée 4 comptes (1 admin + 3 users)
    //    Pourquoi upsert ? Pour rendre le script ré-exécutable sans erreur :
    //    si l’email existe déjà → on ne le recrée pas (update vide).
    const admin = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
            email: 'admin@example.com',
            name: 'Super Admin',
            password: await bcrypt.hash('AdminPass123!', 12), // ⚠️ toujours hasher
            admin: true
        }
    })
    const alice = await prisma.user.upsert({
        where: { email: 'alice@example.com' },
        update: {},
        create: {
            email: 'alice@example.com',
            name: 'Alice',
            password: await bcrypt.hash('AlicePass123!', 12),
            admin: false
        }
    })
    const mark = await prisma.user.upsert({
        where: { email: 'mark@example.com' },
        update: {},
        create: {
            email: 'mark@example.com',
            name: 'Mark',
            password: await bcrypt.hash('MarkPass123!', 12),
            admin: false
        }
    })
    const sofia = await prisma.user.upsert({
        where: { email: 'sofia@example.com' },
        update: {},
        create: {
            email: 'sofia@example.com',
            name: 'Sofia',
            password: await bcrypt.hash('SofiaPass123!', 12),
            admin: false
        }
    })

    // 2) PRODUCTS — upsert par slug pour pouvoir corriger/mettre à jour
    for (const p of products) {
        await prisma.product.upsert({
            where: { slug: p.slug },
            update: p,      // si existe, on met à jour avec les nouvelles valeurs
            create: p       // sinon on crée
        })
    }

    // 3) PORTFOLIO — idem, upsert par slug
    for (const i of imgs) {
        await prisma.portfolio.upsert({
            where: { slug: i.slug },
            update: i,
            create: i
        })
    }

    // 4) FAQ — createMany (plus efficace pour des lots)
    //    "skipDuplicates: true" évite les erreurs si re-run avec mêmes données
    await prisma.faq.createMany({
        data: [
            { question: 'Do you ship internationally ?', answer: 'Yes (demo content).', ordering: 1, published: true },
            { question: 'Return policy ?', answer: '30 days (demo).', ordering: 2, published: true },
            { question: 'Is payment secure ?', answer: 'Mock checkout only.', ordering: 3, published: true },
        ],
        skipDuplicates: true
    })

    // 5) REVIEWS — on doit d’abord récupérer les produits (FK productId requis)
    const prodBottle = await prisma.product.findUnique({ where: { slug: 'eco-bottle' } })
    const prodBrush = await prisma.product.findUnique({ where: { slug: 'bamboo-toothbrush' } })
    const prodStraw = await prisma.product.findUnique({ where: { slug: 'metal-straw-set' } })

    //    L’unicité (userId, productId) est imposée par le schéma (@@unique)
    //    donc chaque pair doit être différente, sinon Prisma renverra P2002.
    if (prodBottle && prodBrush && prodStraw) {
        await prisma.review.createMany({
            data: [
                { name: 'Alice', text: 'Great quality and fast delivery!', stars: 5, published: true, userId: alice.id, productId: prodBottle.id },
                { name: 'Mark', text: 'Exactly as described. Will buy again.', stars: 5, published: true, userId: mark.id, productId: prodBrush.id },
                { name: 'Sofia', text: 'Nice eco products. Support was helpful.', stars: 4, published: true, userId: sofia.id, productId: prodStraw.id },
                // Exemple d’avis supplémentaire (garde la paire (userId, productId) unique) :
                // { name: 'Admin', text: 'Works as expected.', stars: 5, published: true, userId: admin.id, productId: prodBottle.id },
            ]
        })
    }

    console.log('Seed done ✅')
}

// Exécution du script avec gestion d’erreurs et fermeture de la connexion Prisma
main()
    .catch((e) => {
        console.error(e)
        process.exit(1) // code de sortie non nul → CI/CLI verra l’échec
    })
    .finally(() => prisma.$disconnect()) // Toujours libérer la connexion
