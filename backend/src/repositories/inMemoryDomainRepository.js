import fs from 'fs';
import path from 'path';
import { DomainRepositoryInterface } from './domainRepository.interface.js';

export class InMemoryDomainRepository extends DomainRepositoryInterface {
  constructor(storageFilePath = null) {
    super();
    this.storageFilePath = storageFilePath;

    // In-memory thread-safe maps for purchased domains and active reservations
    this.purchasedDomains = new Map();
    this.reservations = new Map();

    // Load persisted data if file storage is configured
    if (this.storageFilePath) {
      this.initStorage();
    }

    // Auto-clean expired reservations every 60 seconds
    setInterval(() => this.cleanupExpiredReservations(), 60 * 1000);
  }

  initStorage() {
    try {
      const dir = path.dirname(this.storageFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(this.storageFilePath)) {
        const raw = fs.readFileSync(this.storageFilePath, 'utf-8');
        if (raw && raw.trim()) {
          const data = JSON.parse(raw);
          if (data.purchasedDomains && typeof data.purchasedDomains === 'object') {
            for (const [key, value] of Object.entries(data.purchasedDomains)) {
              this.purchasedDomains.set(this.normalizeName(key), value);
            }
          }
          if (data.reservations && typeof data.reservations === 'object') {
            for (const [key, value] of Object.entries(data.reservations)) {
              if (value.expiresAt > Date.now()) {
                this.reservations.set(this.normalizeName(key), value);
              }
            }
          }
          console.log(`💾 Loaded ${this.purchasedDomains.size} purchased domains from local storage (${this.storageFilePath})`);
        }
      } else {
        this.persistToDisk();
      }
    } catch (err) {
      console.warn('⚠️ Warning: Could not initialize local domain storage file:', err.message);
    }
  }

  persistToDisk() {
    if (!this.storageFilePath) return;

    try {
      const data = {
        updatedAt: new Date().toISOString(),
        purchasedDomains: Object.fromEntries(this.purchasedDomains),
        reservations: Object.fromEntries(this.reservations)
      };

      const dir = path.dirname(this.storageFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Safe write
      fs.writeFileSync(this.storageFilePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('❌ Failed to persist domains to disk:', err.message);
    }
  }

  normalizeName(name) {
    return (name || '').trim().toLowerCase();
  }

  cleanupExpiredReservations() {
    const now = Date.now();
    let changed = false;
    for (const [domainName, res] of this.reservations.entries()) {
      if (res.expiresAt <= now) {
        this.reservations.delete(domainName);
        changed = true;
      }
    }
    if (changed) {
      this.persistToDisk();
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
    this.persistToDisk();
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
    this.persistToDisk();
    return reservation;
  }

  async releaseReservation(domainName, reservationId) {
    const key = this.normalizeName(domainName);
    const existing = this.reservations.get(key);
    if (existing && existing.reservationId === reservationId) {
      this.reservations.delete(key);
      this.persistToDisk();
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
