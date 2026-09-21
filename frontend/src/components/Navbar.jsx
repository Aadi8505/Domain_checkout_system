import React from 'react';
import { Globe, ShoppingCart, ShieldCheck, Database } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, cartItem, onOpenCheckout, config }) {
  return (
    <nav className="navbar">
      <div className="container nav-content">
        <div 
          className="brand-logo" 
          style={{ cursor: 'pointer' }}
          onClick={() => setActiveTab('search')}
          id="nav-brand-logo"
        >
          <div className="brand-icon">
            <Globe size={22} />
          </div>
          <span>Apex<span style={{ color: 'var(--primary)' }}>Domain</span></span>
        </div>

        <div className="nav-actions">
          <button 
            className={`nav-btn ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
            id="nav-tab-search"
          >
            Domain Search
          </button>

          <button 
            className={`nav-btn ${activeTab === 'my-domains' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-domains')}
            id="nav-tab-my-domains"
          >
            <ShieldCheck size={16} />
            My Domains
          </button>

          {cartItem && (
            <button 
              className="cart-pill-btn"
              onClick={onOpenCheckout}
              id="nav-cart-btn"
            >
              <ShoppingCart size={16} />
              <span>Checkout ({cartItem.domainName})</span>
              <span className="badge-count">1</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
