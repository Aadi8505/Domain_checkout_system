import { DomainRepositoryInterface } from './domainRepository.interface.js';

export class InMemoryDomainRepository extends DomainRepositoryInterface {
  constructor() {
    super();
    // In-memory thread-safe maps for purchased domains and active reservations
    this.purchasedDomains = new Map();
    this.reservations = new Map();

    // Auto-clean expired reservations every 60 seconds
    setInterval(() => this.cleanupExpiredReservations(), 60 * 1000);
  }

  normalizeName(name) {
    return (name || '').trim().toLowerCase();
  }

  cleanupExpiredReservations() {
    const now = Date.now();
    for (const [domainName, res] of this.reservations.entries()) {
      if (res.expiresAt <= now) {
        this.reservations.delete(domainName);
      }
    }
  }

  async findByName(domainName) {
    const key = this.normalizeName(domainName);
    this.cleanupExpiredReservations();

    // Check if already purchased
    if (this.purchasedDomains.has(key)) {
      return {
        ...this.purchasedDomains.get(key),
        isPurchased: true,
        isReserved: false
      };
    }

    // Check if active reservation exists
    if (this.reservations.has(key)) {
      const res = this.reservations.get(key);
      if (res.expiresAt > Date.now()) {
        return {
          domainName: key,
          isPurchased: false,
          isReserved: true,
          reservedBy: res.reservedBy,
          expiresAt: res.expiresAt
        };
      } else {
        this.reservations.delete(key);
      }
    }

    return null; // Available
  }

  async findManyByNames(domainNames) {
    this.cleanupExpiredReservations();
    const result = new Map();

    for (const name of domainNames) {
      const status = await this.findByName(name);
      if (status) {
        result.set(this.normalizeName(name), status);
      }
    }

    return result;
  }

  async save(domainRecord) {
    const key = this.normalizeName(domainRecord.domainName);
    
    // Clear any reservation on this domain once purchased
    this.reservations.delete(key);

    const record = {
      ...domainRecord,
      domainName: key,
      updatedAt: new Date().toISOString()
    };

    this.purchasedDomains.set(key, record);
    return record;
  }

  async reserve(domainName, reservation) {
    const key = this.normalizeName(domainName);
    this.cleanupExpiredReservations();

    // Only reject if already bought
    if (this.purchasedDomains.has(key)) {
      throw new Error(`Domain ${key} is already owned and cannot be reserved.`);
    }

    // Store/refresh the reservation
    this.reservations.set(key, reservation);
    return reservation;
  }

  async releaseReservation(domainName, reservationId) {
    const key = this.normalizeName(domainName);
    const existing = this.reservations.get(key);
    if (existing && existing.reservationId === reservationId) {
      this.reservations.delete(key);
      return true;
    }
    return false;
  }

  async findByOwner(ownerIdentifier) {
    const cleanId = (ownerIdentifier || '').trim().toLowerCase();
    const matches = [];

    for (const record of this.purchasedDomains.values()) {
      const ownerEmail = (record.owner?.email || '').toLowerCase();
      const ownerId = (record.owner?.customerId || '').toLowerCase();
      if (ownerEmail === cleanId || ownerId === cleanId) {
        matches.push(record);
      }
    }

    return matches.sort((a, b) => new Date(b.registrationDate) - new Date(a.registrationDate));
  }

  async findAllPurchased() {
    return Array.from(this.purchasedDomains.values()).sort(
      (a, b) => new Date(b.registrationDate) - new Date(a.registrationDate)
    );
  }
}
