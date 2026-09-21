const API_BASE = '/api';

export const api = {
  /**
   * Fetch dynamic platform configuration (TLDs, pricing, tax rates, currency)
   */
  async getConfig() {
    const res = await fetch(`${API_BASE}/domains/config`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to load configuration');
    return json.data;
  },

  /**
   * Search domains across multi-TLD registry
   */
  async searchDomains(query) {
    if (!query || query.trim().length === 0) return null;
    const res = await fetch(`${API_BASE}/domains/search?q=${encodeURIComponent(query)}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Domain search failed');
    return json.data;
  },

  /**
   * Step 2: Reserve a domain with TTL
   */
  async reserveDomain({ domainName, customerEmail, years = 1 }) {
    const res = await fetch(`${API_BASE}/checkout/reserve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domainName, customerEmail, years })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Domain reservation failed');
    return json.data;
  },

  /**
   * Step 3, 4, 5: Submit payment, register with registrar, assign customer ownership
   */
  async processPurchase({ reservationId, domainName, years = 1, customer, paymentDetails }) {
    const res = await fetch(`${API_BASE}/checkout/purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reservationId, domainName, years, customer, paymentDetails })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Checkout failed');
    return json.data;
  },

  /**
   * Fetch domains owned by a specific customer
   */
  async getMyDomains(customerEmail) {
    const query = customerEmail ? `?email=${encodeURIComponent(customerEmail)}` : '';
    const res = await fetch(`${API_BASE}/checkout/my-domains${query}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to fetch customer domains');
    return json.data;
  },

  /**
   * Fetch all registered domains across the platform
   */
  async getAllRegisteredDomains() {
    const res = await fetch(`${API_BASE}/checkout/all`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to fetch registered domains');
    return json.data;
  }
};
