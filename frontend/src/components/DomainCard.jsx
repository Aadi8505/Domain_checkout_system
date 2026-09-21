import React from 'react';
import { CheckCircle2, XCircle, Clock, ShoppingCart, ArrowRight } from 'lucide-react';

export default function DomainCard({ domain, onBuyNow, onAddToCart, isInCart }) {
  const { domainName, tld, available, status, price, renewalPrice, currencySymbol, category, isExactMatch, ownerInfo } = domain;

  return (
    <div className={`glass-panel domain-card ${isExactMatch ? 'highlight-border' : 'glass-panel-hover'}`}>
      <div className="card-top">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="card-domain-name">{domainName}</span>
            {isExactMatch && (
              <span style={{ 
                fontSize: '0.7rem', 
                background: 'rgba(99, 102, 241, 0.25)', 
                color: '#a5b4fc', 
                padding: '2px 8px', 
                borderRadius: '6px', 
                fontWeight: 700 
              }}>
                Match
              </span>
            )}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Category: {category}
          </span>
        </div>

        <div>
          {status === 'AVAILABLE' && (
            <span className="status-pill available">
              <CheckCircle2 size={13} />
              <span>Available</span>
            </span>
          )}
          {status === 'TAKEN' && (
            <span className="status-pill taken">
              <XCircle size={13} />
              <span>Taken</span>
            </span>
          )}
          {status === 'RESERVED' && (
            <span className="status-pill reserved">
              <Clock size={13} />
              <span>In Cart Hold</span>
            </span>
          )}
        </div>
      </div>

      {status === 'TAKEN' && ownerInfo && (
        <div style={{ 
          fontSize: '0.78rem', 
          color: 'var(--text-secondary)', 
          background: 'rgba(239, 68, 68, 0.08)', 
          padding: '8px 12px', 
          borderRadius: '8px',
          margin: '8px 0 12px' 
        }}>
          Registered by <strong>{ownerInfo.ownerName}</strong>
          {ownerInfo.expiresAt && ` (Renews: ${new Date(ownerInfo.expiresAt).toLocaleDateString()})`}
        </div>
      )}

      <div className="card-bottom">
        <div>
          {available ? (
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>
                {currencySymbol}{price}
                <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)' }}>/1st yr</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Renews at {currencySymbol}{renewalPrice}/yr
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Unavailable for purchase
            </div>
          )}
        </div>

        <div>
          {available ? (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn-primary-sm"
                onClick={() => onBuyNow(domain)}
                id={`buy-now-${domainName.replace('.', '-')}`}
              >
                <span>Buy Now</span>
                <ArrowRight size={15} />
              </button>
            </div>
          ) : (
            <span className="btn-disabled">
              Registered
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
