import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/index.js';

/**
 * CheckoutService
 * 
 * Orchestrates the full 5-step domain checkout workflow:
 * 1. Search & availability verification
 * 2. Reservation / hold locking
 * 3. Payment verification & capture
 * 4. External registrar provisioning
 * 5. Ownership assignment and persistence
 */
export class CheckoutService {
  constructor(domainRepository, registrarClient) {
    this.domainRepo = domainRepository;
    this.registrarClient = registrarClient;
  }

  /**
   * Helper to calculate price breakdown
   */
  calculateOrderPricing(domainName, years = 1) {
    const extMatch = domainName.match(/\.[a-z0-9]+$/i);
    const tld = extMatch ? extMatch[0].toLowerCase() : '.com';
    const tldMeta = config.supportedTlds[tld] || { price: 9.99, renewalPrice: 12.99 };

    const basePrice = tldMeta.price * years;
    const icannFee = 0.18 * years; // Standard ICANN fee simulation
    const taxAmount = parseFloat(((basePrice + icannFee) * config.taxRate).toFixed(2));
    const total = parseFloat((basePrice + icannFee + taxAmount).toFixed(2));

    return {
      tld,
      years,
      unitPrice: tldMeta.price,
      basePrice: parseFloat(basePrice.toFixed(2)),
      icannFee,
      taxRate: config.taxRate,
      taxAmount,
      total,
      currency: config.currency,
      currencySymbol: config.currencySymbol
    };
  }

  /**
   * Step 2: Reserve domain for checkout with TTL
   */
  async reserveDomain({ domainName, customerEmail, years = 1 }) {
    const cleanDomain = (domainName || '').trim().toLowerCase();
    
    // Check if domain is already purchased
    const existing = await this.domainRepo.findByName(cleanDomain);
    if (existing && existing.isPurchased) {
      throw new Error(`Domain ${cleanDomain} is already registered and not available.`);
    }

    const reservationId = `RES-${uuidv4()}`;
    const expiresAt = Date.now() + (config.reservationTTLSeconds * 1000);
    const pricing = this.calculateOrderPricing(cleanDomain, years);

    const reservation = {
      reservationId,
      domainName: cleanDomain,
      reservedBy: (customerEmail || '').toLowerCase(),
      years,
      pricing,
      createdAt: Date.now(),
      expiresAt
    };

    await this.domainRepo.reserve(cleanDomain, reservation);

    return {
      reservationId,
      domainName: cleanDomain,
      expiresAt: new Date(expiresAt).toISOString(),
      ttlSeconds: config.reservationTTLSeconds,
      pricing
    };
  }

  /**
   * Step 3, 4 & 5: Process Payment, Register with Registrar, Assign Ownership
   */
  async processPurchase({ reservationId, domainName, years = 1, customer, paymentDetails }) {
    const cleanDomain = (domainName || '').trim().toLowerCase();

    // 1. Validate Customer details
    if (!customer || !customer.email || !customer.name) {
      throw new Error('Customer full name and email are required for domain ownership.');
    }

    // 2. Validate availability / reservation status
    const currentStatus = await this.domainRepo.findByName(cleanDomain);
    if (currentStatus && currentStatus.isPurchased) {
      throw new Error(`Domain ${cleanDomain} has already been registered.`);
    }

    // 3. Process Payment (Step 3 in requirement)
    const pricing = this.calculateOrderPricing(cleanDomain, years);
    const paymentResult = await this.simulatePaymentProcessing(pricing, paymentDetails, customer);

    // 4. Register with external registrar (Step 4 in requirement)
    const registrarResult = await this.registrarClient.registerDomain({
      domainName: cleanDomain,
      years,
      registrantContact: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        country: customer.country || 'IN'
      }
    });

    // 5. Assign ownership to customer (Step 5 in requirement)
    const customerId = customer.customerId || `CUST-${uuidv4().substring(0, 8).toUpperCase()}`;
    const orderId = `ORD-${Date.now()}-${uuidv4().substring(0, 5).toUpperCase()}`;

    const domainOwnershipRecord = {
      domainName: cleanDomain,
      status: 'ACTIVE',
      owner: {
        customerId,
        name: customer.name,
        email: customer.email.toLowerCase(),
        phone: customer.phone || 'N/A',
        organization: customer.organization || 'Individual',
        country: customer.country || 'IN',
        assignedAt: new Date().toISOString()
      },
      years,
      registrationDate: registrarResult.registrationDate,
      expiryDate: registrarResult.expiryDate,
      autoRenew: true,
      authCode: registrarResult.authCode,
      nameservers: registrarResult.nameservers,
      registrar: {
        name: registrarResult.registrarName,
        transactionId: registrarResult.registrarTransactionId,
        eppStatus: registrarResult.eppStatus
      },
      order: {
        orderId,
        paymentReference: paymentResult.paymentReference,
        paymentMethod: paymentDetails.method || 'Credit Card',
        pricing,
        completedAt: new Date().toISOString()
      }
    };

    // Persist ownership in repository
    await this.domainRepo.save(domainOwnershipRecord);

    return {
      success: true,
      message: `Congratulations! ${cleanDomain} has been successfully registered and assigned to you.`,
      orderId,
      domain: {
        domainName: cleanDomain,
        status: 'ACTIVE',
        registrationDate: domainOwnershipRecord.registrationDate,
        expiryDate: domainOwnershipRecord.expiryDate,
        nameservers: domainOwnershipRecord.nameservers,
        authCode: domainOwnershipRecord.authCode
      },
      owner: domainOwnershipRecord.owner,
      pricing,
      payment: {
        paymentReference: paymentResult.paymentReference,
        status: 'PAID',
        processedAt: paymentResult.timestamp
      },
      registrar: {
        name: registrarResult.registrarName,
        transactionId: registrarResult.registrarTransactionId
      }
    };
  }

  /**
   * Simulated payment gateway handler
   */
  async simulatePaymentProcessing(pricing, paymentDetails = {}, customer) {
    // Minimal mock validation
    if (paymentDetails.cardNumber && paymentDetails.cardNumber.replace(/\s/g, '').length < 12) {
      throw new Error('Invalid payment card number provided.');
    }

    const paymentReference = `PAY-${Date.now()}-${uuidv4().substring(0, 6).toUpperCase()}`;
    return {
      status: 'SUCCESS',
      paymentReference,
      amount: pricing.total,
      currency: pricing.currency,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get all domains owned by a customer email
   */
  async getDomainsByCustomer(customerEmail) {
    if (!customerEmail) return [];
    return await this.domainRepo.findByOwner(customerEmail);
  }

  /**
   * Get all registered domains (for admin / overview dashboard)
   */
  async getAllRegisteredDomains() {
    return await this.domainRepo.findAllPurchased();
  }
}
