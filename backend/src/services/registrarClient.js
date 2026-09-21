import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/index.js';

/**
 * RegistrarClient
 * 
 * Simulates communication with an external ICANN-accredited registrar API.
 * Handles domain provisioning, WHOIS contact registration, and nameserver delegation.
 */
export class RegistrarClient {
  constructor(options = {}) {
    this.registrarName = options.registrarName || 'Global Domain Registry Gateway (ICANN #1448)';
    this.latencyMs = options.latencyMs ?? config.registrarLatencyMs;
  }

  /**
   * Register domain with external registry
   * @param {Object} registrationParams
   * @param {string} registrationParams.domainName - e.g. "mybrand.com"
   * @param {number} registrationParams.years - duration in years
   * @param {Object} registrationParams.registrantContact - customer/registrant details
   * @param {string[]} [registrationParams.nameservers] - DNS nameservers
   * @returns {Promise<Object>} Registrar response receipt
   */
  async registerDomain({ domainName, years = 1, registrantContact, nameservers }) {
    // Simulate real registrar API network latency and verification
    if (this.latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.latencyMs));
    }

    const registrationDate = new Date();
    const expiryDate = new Date();
    expiryDate.setFullYear(registrationDate.getFullYear() + years);

    const defaultNameservers = [
      'ns1.godaddy-gateway.com',
      'ns2.godaddy-gateway.com'
    ];

    const registrarTransactionId = `REG-${uuidv4().substring(0, 8).toUpperCase()}`;
    const registryAuthCode = uuidv4().substring(0, 16);

    return {
      status: 'REGISTERED',
      registrarTransactionId,
      registrarName: this.registrarName,
      domainName: domainName.toLowerCase(),
      years,
      registrationDate: registrationDate.toISOString(),
      expiryDate: expiryDate.toISOString(),
      authCode: registryAuthCode,
      nameservers: nameservers && nameservers.length > 0 ? nameservers : defaultNameservers,
      whoisPrivacy: true,
      registrant: {
        name: registrantContact.name,
        email: registrantContact.email,
        phone: registrantContact.phone || '+1.5550199',
        country: registrantContact.country || 'IN'
      },
      eppStatus: ['ok', 'clientTransferProhibited', 'clientUpdateProhibited']
    };
  }
}

export const defaultRegistrarClient = new RegistrarClient();
