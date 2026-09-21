# Frontend UI/UX & Checkout Experience

## Architecture & Tech Stack
- **Framework**: React.js with Vite
- **Styling**: Vanilla CSS custom design system with dark-mode glassmorphism, luminous green highlights (`#00df82`), responsive layout, and typography (`Plus Jakarta Sans` & `Outfit`).
- **Icons**: `lucide-react`
- **Celebration Effects**: `canvas-confetti`

## Key Components
1. **`Navbar`**:
   - Brand logo with glowing icon.
   - Quick navigation between **Domain Search** and **My Domains**.
   - Dynamic cart status button reflecting active domain in hold.
2. **`SearchHero`**:
   - Primary domain search input with automatic sanitization and instant submission.
   - Dynamic TLD pill chips (`.com`, `.in`, `.net`, `.org`, `.io`, etc.) loaded from backend `/api/domains/config` (zero client-side hardcoding).
3. **`DomainCard` & `ExactMatchCard`**:
   - Displays real-time availability status (`AVAILABLE`, `TAKEN`, `RESERVED`).
   - First-year price, renewal price, and category badge.
   - For taken domains, displays registration timestamp and owner attribution.
4. **`CheckoutModal` (5-Step Purchase Workflow)**:
   - **Step 1: Duration & Customer Contact**: Choose 1, 2, or 3 year terms with dynamic base price, ICANN fees, and taxes. "Fill Demo Data" quick action.
   - **Step 2: Payment Authorization**: Simulated credit card authorization form with auto-fill test numbers.
   - **Step 3, 4 & 5: Live Provisioning Screen**:
     - *Step 3: Authorizing Payment Gateway*
     - *Step 4: Registering with External ICANN Registrar*
     - *Step 5: Assigning Legal Ownership to Customer*
   - **Success & Confetti**: Order confirmation, registrar transaction reference, legal owner details, and button to view owned domains.
5. **`MyDomains`**:
   - Search/filter owned domains by customer email.
   - Toggle to inspect all domains registered across the entire system.
   - Displays DNS nameservers, active status, expiration date, and toggleable EPP transfer auth codes.
