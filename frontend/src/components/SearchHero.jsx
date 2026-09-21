import React from 'react';
import { Search, Sparkles, ArrowRight, Loader2, X } from 'lucide-react';

export default function SearchHero({ query, setQuery, onSearch, isSearching, config }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (query && query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleTldClick = (tld) => {
    let current = (query || '').trim();
    // Strip existing extension if any
    current = current.replace(/\.[a-z0-9]+$/i, '');
    const newQuery = current ? `${current}${tld}` : `mybrand${tld}`;
    setQuery(newQuery);
    onSearch(newQuery);
  };

  const handleClear = () => {
    setQuery('');
  };

  const supportedTlds = config?.supportedTlds || {};

  return (
    <section className="hero-section">
      <div className="container">
        <div className="hero-pill">
          <Sparkles size={14} style={{ color: 'var(--primary)' }} />
          <span>Real-Time ICANN Registrar Checkout Engine</span>
        </div>

        <h1 className="hero-title">
          Search, Reserve & Secure <br />
          Your Next <span className="highlight">Digital Identity</span>
        </h1>

        <p className="hero-subtitle">
          Instant multi-TLD availability check with live external registrar provisioning and guaranteed immediate ownership assignment.
        </p>

        <form onSubmit={handleSubmit} className="search-container">
          <div className="search-bar-wrap">
            <Search size={22} className="search-icon-left" />
            <input
              id="domain-search-input"
              type="text"
              className="search-input"
              placeholder="Find your dream domain (e.g. startup, cloudflow, mybrand.in)..."
              value={query || ''}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={handleClear}
                style={{ color: 'var(--text-muted)', padding: '6px', marginRight: '8px' }}
                title="Clear search"
              >
                <X size={18} />
              </button>
            )}
            <button
              id="domain-search-submit-btn"
              type="submit"
              className="search-action-btn"
              disabled={isSearching || !query || !query.trim()}
            >
              {isSearching ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Checking...</span>
                </>
              ) : (
                <>
                  <span>Search</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Dynamically loaded TLD filter chips */}
        <div className="tld-chips-row">
          {Object.entries(supportedTlds).slice(0, 7).map(([tld, meta]) => (
            <button
              key={tld}
              className="tld-chip"
              onClick={() => handleTldClick(tld)}
              id={`chip-${tld.replace('.', '')}`}
            >
              <span>{tld}</span>
              <span className="price-tag">
                {config?.currencySymbol || '$'}{meta.price}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
