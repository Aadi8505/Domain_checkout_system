import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, Globe, Calendar, KeyRound, Server, ExternalLink, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

export default function MyDomains({ defaultEmail, onSearchNewDomain }) {
  const [emailFilter, setEmailFilter] = useState(defaultEmail || '');
  const [viewMode, setViewMode] = useState(defaultEmail ? 'customer' : 'all');
  const [domains, setDomains] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [revealedAuth, setRevealedAuth] = useState({});

  useEffect(() => {
    if (defaultEmail) {
      setEmailFilter(defaultEmail);
      setViewMode('customer');
    }
  }, [defaultEmail]);

  const loadDomains = async () => {
    setIsLoading(true);
    try {
      if (viewMode === 'all') {
        const data = await api.getAllRegisteredDomains();
        setDomains(data || []);
      } else {
        const data = await api.getMyDomains(emailFilter);
        setDomains(data || []);
      }
    } catch (err) {
      console.error('Failed to load domains:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDomains();
  }, [viewMode, emailFilter]);

  const handleSearchByEmail = (e) => {
    e.preventDefault();
    setViewMode('customer');
    loadDomains();
  };

  const toggleAuthCode = (domainName) => {
    setRevealedAuth(prev => ({ ...prev, [domainName]: !prev[domainName] }));
  };

  return (
    <div className="container" style={{ padding: '40px 24px 80px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff' }}>
            Domain Ownership Management
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            View ICANN registered domains, authoritative DNS status, and ownership transfer auth codes.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className={`btn-outline-sm ${viewMode === 'customer' ? 'active' : ''}`}
            onClick={() => setViewMode('customer')}
            id="view-customer-domains-btn"
          >
            My Owned Domains
          </button>
          <button
            className={`btn-outline-sm ${viewMode === 'all' ? 'active' : ''}`}
            onClick={() => setViewMode('all')}
            id="view-all-domains-btn"
          >
            All System Domains ({domains.length})
          </button>
        </div>
      </div>

      {viewMode === 'customer' && (
        <form onSubmit={handleSearchByEmail} style={{ display: 'flex', gap: '12px', maxWidth: '520px', marginBottom: '24px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
            <input
              type="email"
              className="form-input"
              style={{ paddingLeft: '42px' }}
              placeholder="Filter by owner email (e.g. sarah.jenkins@example.com)..."
              value={emailFilter}
              onChange={(e) => setEmailFilter(e.target.value)}
              id="filter-email-input"
            />
          </div>
          <button type="submit" className="btn-primary-sm" style={{ padding: '0 20px' }}>
            Filter
          </button>
          <button type="button" className="btn-outline-sm" onClick={loadDomains} title="Refresh">
            <RefreshCw size={16} />
          </button>
        </form>
      )}

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
          Loading registered domain records...
        </div>
      ) : domains.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <Globe size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>No Domains Found</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 20px', fontSize: '0.9rem' }}>
            {viewMode === 'customer' 
              ? `No domains currently registered to ${emailFilter || 'this account'}.`
              : 'No domains have been purchased in the application yet.'}
          </p>
          <button className="btn-primary-sm" onClick={onSearchNewDomain} id="search-first-domain-btn">
            Search Available Domains
          </button>
        </div>
      ) : (
        <div className="domains-table-wrap">
          <table className="domains-table">
            <thead>
              <tr>
                <th>Domain Name</th>
                <th>Status</th>
                <th>Legal Owner</th>
                <th>Registration Date</th>
                <th>Expiry Date</th>
                <th>Registrar Ref</th>
                <th>Transfer Auth</th>
              </tr>
            </thead>
            <tbody>
              {domains.map((d) => (
                <tr key={d.domainName}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Globe size={16} style={{ color: 'var(--primary)' }} />
                      <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>{d.domainName}</strong>
                    </div>
                  </td>
                  <td>
                    <span className="status-pill available" style={{ fontSize: '0.75rem', padding: '3px 8px' }}>
                      {d.status || 'ACTIVE'}
                    </span>
                  </td>
                  <td>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.owner?.name || 'Customer'}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{d.owner?.email}</div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {d.registrationDate ? new Date(d.registrationDate).toLocaleDateString() : 'N/A'}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {d.expiryDate ? new Date(d.expiryDate).toLocaleDateString() : 'N/A'}
                    </div>
                  </td>
                  <td>
                    <code style={{ fontSize: '0.78rem', background: 'rgba(255, 255, 255, 0.06)', padding: '2px 6px', borderRadius: '4px' }}>
                      {d.registrar?.transactionId || d.order?.orderId?.substring(0, 14) || 'REG-ACTIVE'}
                    </code>
                  </td>
                  <td>
                    <button
                      className="btn-outline-sm"
                      style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                      onClick={() => toggleAuthCode(d.domainName)}
                    >
                      {revealedAuth[d.domainName] ? (
                        <code>{d.authCode || 'EPP-OK'}</code>
                      ) : (
                        <span>Show Auth</span>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
