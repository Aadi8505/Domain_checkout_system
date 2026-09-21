/**
 * DomainRepository Interface
 * 
 * Formal abstraction contract for Domain Persistence.
 * Enables seamless switching to MongoDB (Mongoose), PostgreSQL (Prisma/TypeORM/pg),
 * or Redis without modifying any service or controller code.
 */
export class DomainRepositoryInterface {
  /**
   * Find a domain by its full name (e.g., 'example.com')
   * @param {string} domainName
   * @returns {Promise<Object|null>}
   */
  async findByName(domainName) {
    throw new Error('Method not implemented: findByName');
  }

  /**
   * Find multiple domains by a list of domain names
   * @param {string[]} domainNames
   * @returns {Promise<Map<string, Object>>}
   */
  async findManyByNames(domainNames) {
    throw new Error('Method not implemented: findManyByNames');
  }

  /**
   * Save or update a domain record (used during registration / ownership assignment)
   * @param {Object} domainRecord
   * @returns {Promise<Object>}
   */
  async save(domainRecord) {
    throw new Error('Method not implemented: save');
  }

  /**
   * Temporarily reserve a domain for checkout
   * @param {string} domainName
   * @param {Object} reservation
   * @returns {Promise<Object>}
   */
  async reserve(domainName, reservation) {
    throw new Error('Method not implemented: reserve');
  }

  /**
   * Release reservation if not purchased
   * @param {string} domainName
   * @param {string} reservationId
   * @returns {Promise<boolean>}
   */
  async releaseReservation(domainName, reservationId) {
    throw new Error('Method not implemented: releaseReservation');
  }

  /**
   * Retrieve all domains owned by an owner identifier (email / customerId)
   * @param {string} ownerIdentifier
   * @returns {Promise<Object[]>}
   */
  async findByOwner(ownerIdentifier) {
    throw new Error('Method not implemented: findByOwner');
  }

  /**
   * Retrieve all registered domains in the system
   * @returns {Promise<Object[]>}
   */
  async findAllPurchased() {
    throw new Error('Method not implemented: findAllPurchased');
  }
}
