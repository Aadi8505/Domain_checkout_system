# Checkout, Registrar Integration & Ownership Assignment

## The 5-Step Workflow
This module implements the exact 5-step lifecycle specified in `requirements.txt`:

```
[ Step 1: Customer searches for domain ]
                     │
                     ▼
[ Step 2: Customer reserves domain / enters checkout ]
  - Domain is temporarily locked with TTL (10 min)
  - Taxes & ICANN fees computed dynamically
                     │
                     ▼
[ Step 3: Customer submits payment details ]
  - Simulated payment authorization
  - Generates transaction reference ID
                     │
                     ▼
[ Step 4: System registers domain with external registrar ]
  - Asynchronous call to RegistrarClient
  - Generates registrar transaction ID (e.g. REG-XXXX)
  - Provisions authoritative nameservers & ICANN authCode
                     │
                     ▼
[ Step 5: Ownership assigned to customer ]
  - Domain ownership record saved to repository
  - Customer ID, WHOIS contact, and expiry recorded
  - Domain is marked ACTIVE and removed from availability pool
```

## Resilience & Concurrency
- If two users attempt to purchase the same domain concurrently, the reservation lock or transactional check prevents duplicate sales with an HTTP 400 error.
- All pricing (base price * years + ICANN fees + dynamic tax rate) is verified server-side.

---

## The External Registrar: Role & Real-World Mechanism

### What is an External Registrar?
In the global Internet domain hierarchy, there are three primary entities:
1. **The Registry** (e.g., Verisign for `.com`, NIXI for `.in`, PIR for `.org`): The authoritative entity that maintains the master database of all domains under that top-level domain (TLD).
2. **The Registrar** (e.g., GoDaddy, Namecheap, Tucows): An ICANN-accredited commercial organization authorized to sell and manage domain registrations on behalf of users.
3. **The Registrant (Customer)**: The individual or business purchasing the domain and holding legal ownership.

When a customer completes checkout on our application:
- Our backend acts as a domain reseller/service orchestrator.
- In Step 4, our system contacts the **External Registrar Gateway** using standardized registrar protocols (such as **EPP** - Extensible Provisioning Protocol or modern REST APIs).
- The registrar checks registry availability, provisions authoritative nameservers (`ns1.godaddy-gateway.com`), sets up WHOIS privacy, and issues a cryptographic transfer authorization key (**EPP Auth Code**).
- Once the registrar acknowledges the transaction with a unique transaction reference (e.g., `REG-XXXXXXXX`), our backend permanently binds the domain to the customer's identity.

---

## Technical Timing: Why There Is a Brief Delay After Payment

The brief delay observed between clicking **"Authorize & Register Domain"** and seeing the confirmation receipt involves two complementary mechanisms:

### 1. Real HTTP Network API Request (Frontend to Backend)
- Clicking the submit button triggers a **real asynchronous HTTP `POST` request** from the React client to the Express server at `/api/checkout/purchase`.
- The frontend awaits the HTTP response promise while displaying the animated provisioning progression.

### 2. Backend Simulated Registrar Latency (`setTimeout`)
- In production with a live registrar (e.g., GoDaddy Reseller API or Enom), communicating over the network with ICANN registries typically takes **1.0 to 2.5 seconds** due to SSL handshakes, registry database write locks, and WHOIS propagation.
- Because this project does not charge real money or connect to a paid live ICANN sandbox, the backend service (`backend/src/services/registrarClient.js`) implements this roundtrip using an asynchronous latency delay:
  ```javascript
  if (this.latencyMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, this.latencyMs));
  }
  ```
- This delay is completely configurable via `config.registrarLatencyMs` or the `.env` variable `REGISTRAR_LATENCY_MS` (default `1200ms`).

### Summary of What Happens During That Window:
1. **Frontend**: Sends HTTP `POST /api/checkout/purchase` with order payload.
2. **Backend**: Validates payment, calls `registrarClient.registerDomain()`.
3. **Registrar Client**: Simulates the 1200ms registry network provisioning roundtrip and returns nameservers + auth code.
4. **Backend**: Writes ownership record to `DomainRepository` and returns HTTP 200 with receipt.
5. **Frontend**: Receives HTTP 200, updates UI to Stage 4 (Provisioning Complete), triggers celebratory confetti, and clears the previous search state.
