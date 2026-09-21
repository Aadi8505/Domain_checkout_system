# Backend Domain Service & Search Engine

## Overview
The Domain Service handles parsing, sanitizing, and calculating availability for multi-TLD domain queries.

## Key Decisions & Flow
1. **Dynamic TLD Generation**:
   - Rather than static presets, the engine dynamically loops through the configured TLD catalog (`.com`, `.in`, `.net`, `.org`, `.io`, `.co`, `.ai`, `.tech`, `.dev`).
   - If the user types an explicit TLD (e.g. `superstar.in`), the system isolates `.in` as the primary exact match, while presenting `.com` and other alternatives below it.
2. **Default Availability Principle**:
   - Per requirements, every domain name is assumed available until a customer in the system purchases it.
   - When a customer purchases `company.com`, subsequent searches for `company` report `company.com` as **TAKEN** (with masked owner info and registration timestamps) while `company.in` remains available.
3. **Repository Contract**:
   - Built on `DomainRepositoryInterface` with methods `findByName`, `findManyByNames`, `save`, `reserve`, `releaseReservation`, and `findByOwner`.
   - Thread-safe in-memory map implementation with automatic TTL cleanup for abandoned checkout reservations.

## API Endpoints
- `GET /api/domains/search?q=<keyword>`: Returns multi-TLD status, pricing, and availability.
- `GET /api/domains/status/:domainName`: Inspects a specific domain name.
- `GET /api/domains/config`: Returns active currency, tax rate, and supported TLD metadata.
