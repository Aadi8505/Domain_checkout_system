import { config } from '../config/index.js';

/**
 * DomainService
 * 
 * Orchestrates domain search, multi-TLD availability checks, and pricing calculation.
 * Follows requirement: all domains are available unless bought by a user in this application.
 */
export class DomainService {
  constructor(domainRepository) {
    this.domainRepo = domainRepository;
  }

  /**
   * Parse user query into base name and optional explicit TLD
   */
  parseDomainQuery(query) {
    if (!query) return { baseName: '', explicitTld: null };
    
    // Sanitize query: remove http/https, leading/trailing slashes, invalid characters
    let cleaned = query.trim().toLowerCase()
      .replace(/^(https?:\/\/)?(www\.)?/, '')
      .replace(/\/.*$/, '')
      .replace(/[^a-z0-9-.]/g, '');

    // Check if query contains any known TLD
    const supportedExts = Object.keys(config.supportedTlds);
    let explicitTld = null;
    let baseName = cleaned;

    for (const tld of supportedExts) {
      if (cleaned.endsWith(tld)) {
        explicitTld = tld;
        baseName = cleaned.substring(0, cleaned.length - tld.length);
        break;
      }
    }

    // Strip trailing or leading dots/hyphens
    baseName = baseName.replace(/^[.-]+|[.-]+$/g, '');

    return { baseName, explicitTld };
  }

  /**
   * Search domains across supported TLDs
   */
  async search(rawQuery) {
    const { baseName, explicitTld } = this.parseDomainQuery(rawQuery);

    if (!baseName || baseName.length < 2) {
      return {
        query: rawQuery,
        baseName,
        results: [],
        total: 0
      };
    }

    const tldList = Object.keys(config.supportedTlds);
    // Sort TLDs: explicit first if searched, then popular (.com, .in), then others
    const orderedTlds = [...tldList].sort((a, b) => {
      if (explicitTld && a === explicitTld) return -1;
      if (explicitTld && b === explicitTld) return 1;
      if (config.supportedTlds[a]?.popular && !config.supportedTlds[b]?.popular) return -1;
      if (!config.supportedTlds[a]?.popular && config.supportedTlds[b]?.popular) return 1;
      return 0;
    });

    const targetDomainNames = orderedTlds.map((tld) => `${baseName}${tld}`);
    const existingMap = await this.domainRepo.findManyByNames(targetDomainNames);

    const results = orderedTlds.map((tld) => {
      const fullDomain = `${baseName}${tld}`;
      const tldMeta = config.supportedTlds[tld] || { price: 9.99, renewalPrice: 12.99 };
      const existing = existingMap.get(fullDomain);

      let status = 'AVAILABLE';
      let available = true;
      let ownerInfo = null;

      if (existing && existing.isPurchased) {
        status = 'TAKEN';
        available = false;
        ownerInfo = {
          registeredAt: existing.registrationDate,
          expiresAt: existing.expiryDate,
          ownerName: existing.owner?.name ? `${existing.owner.name.substring(0, 1)}***` : 'Private User'
        };
      }

      return {
        domainName: fullDomain,
        baseName,
        tld,
        available,
        status,
        price: tldMeta.price,
        renewalPrice: tldMeta.renewalPrice,
        currency: config.currency,
        currencySymbol: config.currencySymbol,
        category: tldMeta.category || 'General',
        popular: !!tldMeta.popular,
        isExactMatch: explicitTld ? fullDomain === `${baseName}${explicitTld}` : tld === '.com',
        ownerInfo
      };
    });

    return {
      query: rawQuery,
      baseName,
      exactMatchDomain: explicitTld ? `${baseName}${explicitTld}` : `${baseName}.com`,
      results,
      total: results.length,
      availableCount: results.filter((r) => r.available).length
    };
  }

  /**
   * Check status of a single domain name
   */
  async getDomainStatus(domainName) {
    const record = await this.domainRepo.findByName(domainName);
    const { explicitTld } = this.parseDomainQuery(domainName);
    const tldMeta = explicitTld && config.supportedTlds[explicitTld] 
      ? config.supportedTlds[explicitTld] 
      : { price: 9.99, renewalPrice: 12.99 };

    if (!record) {
      return {
        domainName: domainName.toLowerCase(),
        available: true,
        status: 'AVAILABLE',
        price: tldMeta.price,
        currency: config.currency,
        currencySymbol: config.currencySymbol
      };
    }

    return {
      domainName: domainName.toLowerCase(),
      available: !record.isPurchased && !record.isReserved,
      status: record.isPurchased ? 'TAKEN' : (record.isReserved ? 'RESERVED' : 'AVAILABLE'),
      record
    };
  }
}
