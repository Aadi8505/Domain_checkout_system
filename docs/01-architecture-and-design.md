# Architecture & System Design

## 1. Architectural Style
This project adopts a **Layered Clean Architecture** pattern inside an npm monorepo:
- **Presentation Layer**: React (Vite) single-page application with modern responsive UI and dynamic interaction.
- **API / Controller Layer**: Express.js REST endpoints handling parameter validation, HTTP status codes, and JSON serialization.
- **Service / Domain Layer**: Pure business logic orchestrating domain availability calculations, pricing breakdown, ICANN fees, and reservation holds.
- **External Integration Layer**: An asynchronous `RegistrarClient` simulating real EPP / ICANN registrar provisioning.
- **Persistence Layer**: Abstract `DomainRepositoryInterface` with an initial `InMemoryDomainRepository` backed by dynamic thread-safe hash maps.

```
┌────────────────────────────────────────────────────────┐
│             React Frontend (Vite)                     │
│   SearchHero | DomainCards | CheckoutModal | MyDomains │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTP REST (JSON)
┌──────────────────────────▼─────────────────────────────┐
│             Express Controller Layer                   │
│       domainController     checkoutController          │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│             Business Logic Service Layer               │
│        domainService         checkoutService           │
└───────────────┬──────────────────────────┬─────────────┘
                │                          │
┌───────────────▼──────────────┐  ┌────────▼─────────────┐
│  RegistrarClient Adapter     │  │  DomainRepository    │
│  (Simulated External ICANN)  │  │  (Interface Contract)│
└──────────────────────────────┘  └────────┬─────────────┘
                                           │
                                  ┌────────▼─────────────┐
                                  │ InMemory Repository  │
                                  │ (Pluggable to DB)    │
                                  └──────────────────────┘
```

## 2. Zero Hardcoding Policy
To meet requirement 16 ("dont hardcode any of the data"):
- All TLD extensions (`.com`, `.in`, `.net`, `.org`, `.io`, `.tech`, `.co`, `.ai`, `.dev`), their base prices, renewal rates, categories, and popularity flags are defined in `config/index.js` and can be overridden by environment variables.
- The frontend fetches configuration directly from `GET /api/domains/config` during initialization. No prices, TLD lists, or tax rates are hardcoded on the client.
- Dynamic domain search parses arbitrary user input, extracts the root keyword, and evaluates availability on the fly.
