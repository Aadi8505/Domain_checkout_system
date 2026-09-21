# Future Database Migration Guide

## Why the Current Design is Database-Ready
The system adheres to the **Repository Pattern**.
The core services (`DomainService` and `CheckoutService`) depend entirely on `DomainRepositoryInterface` (`backend/src/repositories/domainRepository.interface.js`), never on in-memory collections directly.

```
       [DomainService / CheckoutService]
                       │
                       ▼
        [DomainRepositoryInterface]
           ▲                   ▲
           │                   │
  [InMemoryDomainRepo]   [MongoDomainRepo / PostgresDomainRepo]
      (Current)                      (Future Plug-in)
```

To switch from the in-memory store to a database, you only need to:
1. Implement a new class extending `DomainRepositoryInterface`.
2. Swap the instantiation in `backend/src/server.js`:
   ```javascript
   // Change:
   // const domainRepository = new InMemoryDomainRepository();
   // To:
   const domainRepository = new MongoDomainRepository(mongoClient);
   ```
   **Zero lines of business logic or controllers need to change.**

---

## Example 1: MongoDB / Mongoose Implementation

```javascript
import mongoose from 'mongoose';
import { DomainRepositoryInterface } from './domainRepository.interface.js';

const DomainSchema = new mongoose.Schema({
  domainName: { type: String, unique: true, index: true, lowercase: true },
  status: { type: String, enum: ['ACTIVE', 'EXPIRED'], default: 'ACTIVE' },
  owner: {
    customerId: String,
    name: String,
    email: { type: String, index: true, lowercase: true },
    phone: String,
    country: String
  },
  years: Number,
  registrationDate: Date,
  expiryDate: Date,
  nameservers: [String],
  authCode: String,
  registrar: {
    name: String,
    transactionId: String
  },
  order: {
    orderId: String,
    paymentReference: String,
    pricing: Object
  }
}, { timestamps: true });

const DomainModel = mongoose.model('Domain', DomainSchema);

export class MongoDomainRepository extends DomainRepositoryInterface {
  async findByName(domainName) {
    const doc = await DomainModel.findOne({ domainName: domainName.toLowerCase() }).lean();
    if (!doc) return null;
    return { ...doc, isPurchased: true };
  }

  async findManyByNames(domainNames) {
    const docs = await DomainModel.find({ 
      domainName: { $in: domainNames.map(d => d.toLowerCase()) } 
    }).lean();
    
    const map = new Map();
    docs.forEach(doc => map.set(doc.domainName, { ...doc, isPurchased: true }));
    return map;
  }

  async save(domainRecord) {
    return await DomainModel.findOneAndUpdate(
      { domainName: domainRecord.domainName.toLowerCase() },
      domainRecord,
      { upsert: true, new: true }
    );
  }

  async findByOwner(ownerEmail) {
    return await DomainModel.find({ 'owner.email': ownerEmail.toLowerCase() }).sort({ registrationDate: -1 }).lean();
  }

  async findAllPurchased() {
    return await DomainModel.find().sort({ registrationDate: -1 }).lean();
  }
}
```

---

## Example 2: PostgreSQL / Prisma Implementation

In `schema.prisma`:
```prisma
model Domain {
  id               String   @id @default(uuid())
  domainName       String   @unique
  status           String   @default("ACTIVE")
  ownerEmail       String
  ownerName        String
  registrationDate DateTime
  expiryDate       DateTime
  nameservers      String[]
  authCode         String
  registrarTxId    String
  orderId          String
  createdAt        DateTime @default(now())

  @@index([domainName])
  @@index([ownerEmail])
}
```
Implementing `PrismaDomainRepository`:
```javascript
export class PrismaDomainRepository extends DomainRepositoryInterface {
  constructor(prisma) {
    super();
    this.prisma = prisma;
  }

  async findByName(domainName) {
    const record = await this.prisma.domain.findUnique({
      where: { domainName: domainName.toLowerCase() }
    });
    return record ? { ...record, isPurchased: true } : null;
  }
  // ... other methods implemented cleanly using prisma queries
}
```
