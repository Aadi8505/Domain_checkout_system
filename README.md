# GoDaddy Domain Search & Checkout System

A full-stack, enterprise-grade domain search and checkout platform built with **React.js** (frontend) and **Node.js / Express** (backend) organized in a **monorepo architecture** with **zero hardcoded configuration** and a **Repository Pattern** designed for easy database integration.

---

## Purchase Workflow

1. **Search**: Customer queries any domain name across multiple TLDs (`.com`, `.in`, `.net`, `.org`, `.io`, `.tech`, `.co`, `.ai`, `.dev`). All domains are available by default unless previously bought in the system.
2. **Reserve & Plan**: Customer selects registration term (1, 2, or 3 years). Pricing, ICANN fees, and taxes are calculated dynamically.
3. **Payment**: Customer submits payment details with mock validation.
4. **External Registrar Registration**: System executes external ICANN accredited registrar handshake and provisions authoritative nameservers & EPP auth code.
5. **Ownership Assignment**: Legal ownership is assigned to the customer contact and persisted in the repository.

---

## How to Run

### 1. Install All Dependencies (Root)
```bash
npm install
```

### 2. Run Both Frontend and Backend Concurrently
```bash
npm run dev
```
- **Backend API**: `http://localhost:5000`
- **Frontend App**: `http://localhost:5173`

Or run them individually:
```bash
# Backend only:
npm run dev:backend

# Frontend only:
npm run dev:frontend
```

---

## Project Structure & Documentation

Detailed documentation of all decisions, architecture, and flows is maintained in the [`docs/`](./docs/) directory:
- [`docs/00-monorepo-setup.md`](./docs/00-monorepo-setup.md): Workspace configuration & principles.
- [`docs/01-architecture-and-design.md`](./docs/01-architecture-and-design.md): Layered Clean Architecture.
- [`docs/02-backend-domain-service.md`](./docs/02-backend-domain-service.md): Multi-TLD search engine logic.
- [`docs/03-checkout-and-ownership-flow.md`](./docs/03-checkout-and-ownership-flow.md): 5-step checkout and registrar integration.
- [`docs/04-frontend-ui-ux.md`](./docs/04-frontend-ui-ux.md): React components, design system, and user flow.
- [`docs/05-future-database-migration-guide.md`](./docs/05-future-database-migration-guide.md): Guide & code samples for swapping to MongoDB or PostgreSQL.
