# 🌱 GreenGlowWebfolio

GreenGlowWebfolio is a **full-stack demo web application** showcasing an eco-friendly storefront and admin dashboard.  
It combines a **React (Vite + Bootstrap)** frontend with an **Express + Prisma + PostgreSQL** backend.

The project is designed to demonstrate:
- A modern, mobile-friendly UI
- E-commerce features (cart, checkout, reviews)
- Portfolio/gallery sections with real images
- Admin panel with CRUD operations for products, users, FAQ, reviews, and sales tracking

---

## 🚀 Tech Stack

**Frontend (client)**
- React 18 + Vite
- React Router
- React Bootstrap
- Context API (Auth, Cart)

**Backend (server)**
- Express.js
- Prisma ORM (PostgreSQL)
- JWT Authentication (httpOnly cookies)
- bcryptjs for password hashing
- CORS + cookie-parser

**Database**
- PostgreSQL (local or cloud-hosted)

---

## ✨ Features

### Public (Frontend)
- 🛍️ Shop with product list & detail pages
- 🛒 Cart system (guest & user carts with merge on login)
- 💳 Mock checkout flow (with stock update & sales history)
- 🖼️ Gallery / Portfolio with tags
- ❓ FAQ section (dynamic)
- ⭐ Customer reviews
- 🔑 Authentication (Register / Login / Profile / Logout)

### Admin Panel
- 📊 Sales statistics (with charts)
- ❓ FAQ management (CRUD)
- ⭐ Reviews moderation
- 📦 Product management
- 👤 User management (toggle admin, reset password)
- 💰 Sales overview with filters

---

## 📂 Project Structure

```
GreenGlowWebfolio/
├── client/                # React frontend (Vite)
│   ├── src/
│   │   ├── components/    # Shared UI components
│   │   ├── context/       # Auth & Cart contexts
│   │   ├── pages/         # Public & admin pages
│   │   └── main.jsx       # App entry
│   └── ...
├── server/                # Express backend
│   ├── prisma/
│   │   ├── schema.prisma  # Database schema
│   │   └── seed.js        # Seed script
│   ├── src/
│   │   ├── db/prisma.js   # Prisma client
│   │   ├── routes/        # API routes
│   │   └── index.js       # Express app entry
│   └── ...
└── package.json
```

---

## 🛠️ Prerequisites

- Node.js >= 18
- npm or yarn
- PostgreSQL (installed locally or via Docker)

Set up a `.env` file inside `server/` with:

```
DATABASE_URL="postgresql://user:password@localhost:5432/greenglow"
JWT_SECRET="your-secret"
```

---

## 📦 Installation & Setup

### 1. Clone repository
```bash
git clone https://github.com/CoCoRoRooo/GreenGlowWebfolio.git
cd GreenGlowWebfolio
```

### 2. Install dependencies
```bash
# Install client deps
cd client
npm install

# Install server deps
cd ../server
npm install
```

### 3. Database setup (Prisma + PostgreSQL)
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed database with demo data
node prisma/seed.js
```

### 4. Start development servers
```bash
# Start backend
cd server
npm run dev   # nodemon src/index.js

# Start frontend
cd ../client
npm run dev   # runs on http://localhost:5173
```

---

## 📜 Available Commands

### Client
```bash
npm run dev        # Start Vite dev server
npm run build      # Build for production
npm run preview    # Preview production build
```

### Server
```bash
npm run dev        # Start backend with nodemon
npm start          # Start backend normally
npx prisma studio  # Open Prisma web studio
```

---

## 📈 Deployment

- **Frontend**: can be deployed to Vercel / Netlify (static React build).
- **Backend**: can be deployed to Heroku / Render / Railway.
- **Database**: PostgreSQL on Supabase / Neon / Railway or self-hosted.
- **Docker + VPS**: see [`CI-CD-README.md`](./CI-CD-README.md) for a full guide on deploying with GitHub Actions and Docker Compose.

Make sure to configure environment variables in production (`DATABASE_URL`, `JWT_SECRET`, `CORS`).

---

## 📌 Roadmap

- ✅ Full-stack base (done)
- 🔄 Improve admin panel UX (sidebar responsive)
- 📊 Add charts (Recharts) for statistics
- 🚀 Deploy to cloud with demo credentials

---

## 📄 License

MIT — Free to use, modify, and share.
