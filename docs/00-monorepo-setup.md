# Phase 1: Monorepo Setup & Architecture Foundation

## Overview
This project is organized as an enterprise-grade monorepo designed for high modularity, zero hardcoded domain pricing or configuration, and seamless future database integration.

## Folder Structure
```
GoDaddyTask/
├── backend/                  # Node.js + Express REST API
│   ├── src/
│   │   ├── config/           # Dynamic environment & TLD configuration
│   │   ├── controllers/      # Express route controllers
│   │   ├── services/         # Domain search, checkout & registrar logic
│   │   ├── repositories/     # In-memory repository (extensible to DBs)
│   │   ├── models/           # Domain, Customer, Order data structures
│   │   └── server.js         # Express app entry point
│   ├── test/                 # Automated API test suite
│   ├── package.json
│   └── .env.example
├── frontend/                 # React (Vite) client application
│   ├── src/
│   │   ├── components/       # Search, Cart, Checkout, Provisioning UI
│   │   ├── services/         # API client
│   │   ├── App.jsx           # Main application state & tabs
│   │   └── index.css         # Rich modern design system
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── docs/                     # Section-by-section documentation
│   ├── 00-monorepo-setup.md
│   ├── 01-architecture-and-design.md
│   ├── 02-backend-domain-service.md
│   ├── 03-checkout-and-ownership-flow.md
│   ├── 04-frontend-ui-ux.md
│   └── 05-future-database-migration-guide.md
├── package.json              # Monorepo root workspace configuration
└── requirements.txt
```

## Decisions & Design Principles
1. **Monorepo Workspaces**: Configured using standard npm workspaces (`backend`, `frontend`) managed from the root `package.json` with unified start commands (`npm run dev`).
2. **Zero Hardcoded Data**:
   - TLD pricing, supported extensions (`.com`, `.in`, `.net`, `.org`, `.io`, `.co`, etc.), tax rate, and registrar latency are loaded via dynamic configuration files and environment variables.
   - Any domain can be dynamically queried and evaluated.
3. **Repository Pattern for Future Database Transition**:
   - Business logic depends on an abstract repository contract (`DomainRepository`).
   - The initial implementation uses an efficient in-memory thread-safe map store.
   - Future transition to PostgreSQL, MongoDB, or Redis requires simply swapping the repository adapter without changing any controllers or services.
