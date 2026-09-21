import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import SearchHero from './components/SearchHero';
import DomainCard from './components/DomainCard';
import CheckoutModal from './components/CheckoutModal';
import MyDomains from './components/MyDomains';
import { api } from './services/api';
import { Sparkles, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('search'); // 'search' or 'my-domains'
  const [config, setConfig] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedDomainForCheckout, setSelectedDomainForCheckout] = useState(null);
  const [latestPurchasedCustomerEmail, setLatestPurchasedCustomerEmail] = useState('');

  // Initial config load - zero hardcoding on frontend
  useEffect(() => {
    async function loadConfig() {
      try {
        const data = await api.getConfig();
        setConfig(data);
      } catch (err) {
        console.error('Failed to load dynamic configuration:', err);
      }
    }
    loadConfig();
  }, []);

  const handleSearch = async (query) => {
    const q = query || searchQuery;
    if (!q || !q.trim()) return;
    setIsSearching(true);
    try {
      const data = await api.searchDomains(q.trim());
      setSearchResults(data);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleOpenCheckout = (domain) => {
    setSelectedDomainForCheckout(domain);
  };

  const handlePurchaseSuccess = (result) => {
    setLatestPurchasedCustomerEmail(result.owner.email);
    // Clear state after purchase so no stale data from previous buy persists
    setSearchResults(null);
    setSearchQuery('');
    setSelectedDomainForCheckout(null);
  };

  const exactMatch = searchResults?.results?.find(r => r.isExactMatch) || searchResults?.results?.[0];
  const alternativeResults = searchResults?.results?.filter(r => r !== exactMatch) || [];

  return (
    <div className="app-layout">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cartItem={selectedDomainForCheckout}
        onOpenCheckout={() => {}}
        config={config}
      />

      <main>
        {activeTab === 'search' && (
          <>
            <SearchHero
              query={searchQuery}
              setQuery={setSearchQuery}
              onSearch={handleSearch}
              isSearching={isSearching}
              config={config}
            />

            {searchResults && (
              <section className="container results-section">
                {/* Header info */}
                <div className="results-header">
                  <div className="results-count">
                    Found <strong>{searchResults.total}</strong> extensions for "<strong>{searchResults.baseName}</strong>" ({searchResults.availableCount} available)
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Instant Registrar API Connected
                  </div>
                </div>

                {/* Primary Exact Match Featured Card */}
                {exactMatch && (
                  <div className="exact-match-card">
                    <span className="exact-badge">Top Recommendation</span>
                    <div className="domain-identity">
                      <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 700, marginBottom: '4px' }}>
                        {exactMatch.available ? 'Exact Match is Available!' : 'Exact Match Already Registered'}
                      </div>
                      <h3>
                        {exactMatch.domainName}
                        {exactMatch.available ? (
                          <CheckCircle2 size={24} color="var(--primary)" />
                        ) : (
                          <ShieldCheck size={24} color="var(--danger)" />
                        )}
                      </h3>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        {exactMatch.available 
                          ? 'Standard registration includes WHOIS privacy & DNS management.'
                          : `Registered in system by ${exactMatch.ownerInfo?.ownerName || 'Another Customer'}`}
                      </div>
                    </div>

                    <div className="domain-pricing-block">
                      {exactMatch.available && (
                        <div className="price-box">
                          <div className="price-main">
                            {exactMatch.currencySymbol}{exactMatch.price}
                          </div>
                          <div className="price-sub">
                            for the first year
                          </div>
                        </div>
                      )}

                      <div>
                        {exactMatch.available ? (
                          <button
                            className="search-action-btn"
                            onClick={() => handleOpenCheckout(exactMatch)}
                            id="exact-match-buy-btn"
                          >
                            <span>Reserve & Checkout</span>
                            <ArrowRight size={18} />
                          </button>
                        ) : (
                          <span className="btn-disabled">
                            Already Owned
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Alternative TLD Options Grid */}
                <h4 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--text-primary)' }}>
                  Alternative Extensions (.in, .com, .net, .org, .io, etc.)
                </h4>

                <div className="domain-cards-grid">
                  {alternativeResults.map((domain) => (
                    <DomainCard
                      key={domain.domainName}
                      domain={domain}
                      onBuyNow={handleOpenCheckout}
                      onAddToCart={handleOpenCheckout}
                      isInCart={selectedDomainForCheckout?.domainName === domain.domainName}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {activeTab === 'my-domains' && (
          <MyDomains
            defaultEmail={latestPurchasedCustomerEmail}
            onSearchNewDomain={() => setActiveTab('search')}
          />
        )}
      </main>

      {/* Checkout Modal */}
      {selectedDomainForCheckout && (
        <CheckoutModal
          domain={selectedDomainForCheckout}
          onClose={() => {
            setSelectedDomainForCheckout(null);
          }}
          onPurchaseSuccess={(result) => {
            handlePurchaseSuccess(result);
            setActiveTab('my-domains');
          }}
          config={config}
        />
      )}
    </div>
  );
}
